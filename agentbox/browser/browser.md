# Browser

Each box runs one headless Chromium for its whole life. Cookies, local storage and the open page survive between `browser` commands, so a subagent can open a page, click, fill a form and read the result across several `agentbox exec` calls. Subagents drive it with the `browser` command; the listener reads its network events on the side.

## Boot order

`boot.sh` is the container's entrypoint:

1. If the proxy config folder has `ca.crt` (a proxy that re-signs TLS), add it to the system trust store.
2. Start the tunnel on `127.0.0.1:8081` (`proxy/02-routing.md`).
3. Start Chromium headless with remote debugging on `127.0.0.1:9222`, pointed at the tunnel.
4. Wait for the debugging port, start the browser listener, wait until it is attached.
5. Write `/work/.ready`. `agentbox up` waits for this file, so a box is never handed out before its listener is recording.

Chromium flags worth knowing:

| Flag | Why |
|---|---|
| `--proxy-server=http://127.0.0.1:8081` and `--proxy-bypass-list=<-loopback>` | every request goes through the tunnel; only loopback is exempt |
| `--ignore-certificate-errors` | accept a proxy service that re-signs TLS. The browser only ever talks to the sites the subagent opens; do not use the box for anything that needs strict certificate checks |
| `--disable-background-networking`, `--disable-component-update`, `--disable-sync`, ... | cut the browser's own background traffic, so it neither costs proxy money nor pollutes the log |
| `--disable-blink-features=AutomationControlled` | hide `navigator.webdriver` |
| `--user-agent=...` | a Linux desktop UA that matches the platform the browser reports; a Mac UA on a Linux browser is an easy bot signal |

File: `image/tools/boot.sh`

```bash
#!/bin/bash
# Box boot: browser tunnel (:8081), headless Chromium (CDP :9222), passive browser listener.
set -u
mkdir -p /work/bodies
if [ -f /run/agentbox/ca.crt ]; then
  cp /run/agentbox/ca.crt /usr/local/share/ca-certificates/agentbox-proxy.crt && update-ca-certificates >/dev/null 2>&1
fi
python3 /opt/agentbox/tunnel.py > /tmp/tunnel.log 2>&1 &

CHROME=$(python3 -c 'from playwright.sync_api import sync_playwright as s; p=s().start(); print(p.chromium.executable_path); p.stop()')
"$CHROME" --headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage \
  --remote-debugging-address=127.0.0.1 --remote-debugging-port=9222 \
  --proxy-server=http://127.0.0.1:8081 --proxy-bypass-list='<-loopback>' --ignore-certificate-errors \
  --disable-blink-features=AutomationControlled --user-data-dir=/tmp/chrome \
  --disable-background-networking --disable-component-update --disable-sync --no-first-run \
  --disable-default-apps --disable-domain-reliability --metrics-recording-only --no-pings \
  --user-agent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36" \
  about:blank > /tmp/chrome.log 2>&1 &

for _ in $(seq 1 60); do /usr/bin/curl -s -o /dev/null http://127.0.0.1:9222/json/version && break; sleep 0.5; done
python3 /opt/agentbox/netlog.py > /tmp/netlog.log 2>&1 &
for _ in $(seq 1 60); do [ -f /tmp/netlog.ready ] && break; sleep 0.5; done
echo "agentbox ready" > /work/.ready
exec sleep infinity
```

Keep the Chrome version in the user agent in line with the Chromium that the Playwright base image ships (131 for Playwright 1.49).

## The `browser` command

```
browser open <url> [--wait 4]      navigate, print title and final URL
browser text | html                visible text / full HTML of the current page
browser click <selector> [--wait 3]
browser fill <selector> <value>
browser press <key>                e.g. Enter
browser eval '<js>'                run JavaScript in the page, print the JSON result
browser shot <file.png>            full-page screenshot into /work
browser cookies                    current cookies (to reuse with curl)
```

After any `browser open` or `click`, run `reqlog --xhr` to see the API calls the page made.

File: `image/tools/browser`

```python
#!/usr/bin/env python3
"""Persistent headless Chromium (state survives between commands). Traffic goes through the box tunnel.

  browser open <url> [--wait 4]      navigate, print title + final url
  browser text | html                visible text / full HTML of the current page
  browser click <selector> [--wait 3]
  browser fill <selector> <value>
  browser press <key>                e.g. Enter
  browser eval '<js>'                run JS in the page, print JSON result
  browser shot <file.png>            screenshot into /work
  browser cookies                    current cookies (use them with curl)
"""
import json, sys
from playwright.sync_api import sync_playwright

a = sys.argv[1:]
if not a:
    print(__doc__); sys.exit(0)
cmd = a[0]
wait = float(a[a.index("--wait") + 1]) if "--wait" in a else None

with sync_playwright() as pw:
    b = pw.chromium.connect_over_cdp("http://127.0.0.1:9222")
    ctx = b.contexts[0] if b.contexts else b.new_context()
    page = ctx.pages[-1] if ctx.pages else ctx.new_page()
    if cmd == "open":
        page.goto(a[1], wait_until="domcontentloaded", timeout=90000)
        page.wait_for_timeout((wait or 4) * 1000)
        print(json.dumps({"title": page.title(), "url": page.url}))
    elif cmd == "text":
        print(page.inner_text("body"))
    elif cmd == "html":
        print(page.content())
    elif cmd == "click":
        page.click(a[1], timeout=30000); page.wait_for_timeout((wait or 3) * 1000)
        print(json.dumps({"url": page.url}))
    elif cmd == "fill":
        page.fill(a[1], a[2]); print("ok")
    elif cmd == "press":
        page.keyboard.press(a[1]); page.wait_for_timeout((wait or 3) * 1000); print("ok")
    elif cmd == "eval":
        print(json.dumps(page.evaluate(a[1]))[:20000])
    elif cmd == "shot":
        page.screenshot(path=f"/work/{a[1]}", full_page=True); print(f"/work/{a[1]}")
    elif cmd == "cookies":
        print(json.dumps(ctx.cookies(), indent=1))
    else:
        print(__doc__); sys.exit(1)
```

## Known limit

A headless Chromium passes most WAFs once the IP is acceptable, but strong JavaScript challenges (some Cloudflare, Incapsula, DataDome setups) can still refuse it. When the log shows that with the proxy on, the subagent reports it as blocked (`subagents/escalation.md`). Do not add CAPTCHA solvers or challenge bypasses to this skill.
