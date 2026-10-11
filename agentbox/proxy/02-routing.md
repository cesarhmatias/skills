# Routing: how traffic leaves a box

Every box starts **direct**. `proxy on [service]` switches the whole box (browser, curl and python) to one proxy service from `config/proxy.json`; `proxy off` switches it back. The switch is one flag file, `/work/.proxy_on`, holding the service name.

| Client | Direct | Proxy on |
|---|---|---|
| curl | the wrapper runs plain curl | the wrapper adds `-x <service url>` |
| python | untouched | the hook sets `proxies` on each call |
| Chromium | always talks to the local tunnel `127.0.0.1:8081`, which connects straight to the site | the tunnel chains each connection to the service with `Proxy-Authorization` |

```
Chromium ──▶ tunnel :8081 ──(direct)──────────────────────────▶ website
                         └─(proxy on)──▶ proxy service ──────▶ website
curl / python ──(proxy on)──────────────▶ proxy service ──────▶ website
```

## Why the browser needs a tunnel

Chromium reads its proxy setting once at launch, and restarting it would lose the session. So it always points at a local tunnel that decides per connection where to go. The tunnel only forwards bytes (it answers `CONNECT` and pipes the encrypted stream), so the site sees Chromium's real TLS fingerprint and the credentials never reach the browser.

## The stale-connection rule

Chromium keeps connections open and reuses them. If the tunnel only changed the route for *new* connections, a page loaded right after `proxy on` could still leave over a connection opened while direct, from the box's own IP, while the log says it went through the proxy. So on every mode change the tunnel closes every connection opened under the previous mode and records it in the agent journal (`proxy direct -> datacenter: closed 3 open browser tunnels (...)`). The `proxy` command waits until the tunnel confirms the new mode before it returns.

## Budget enforcement

- The tunnel refuses new connections with `402` once the budget is spent.
- The curl wrapper exits 56 and the python hook raises before sending.
- Charges are written by the listeners after each response (`listener/01-boxlib.md`). Requests already in flight when the budget runs out still complete, so a browser page load can overshoot the cap by a few requests (in testing, a page of 13 requests took a $0.02 budget to $0.026). Keep the provider-side limit as the real ceiling.
- Chromium background traffic (update checks, safe browsing, analytics hosts) is refused by the tunnel so it never costs money. It shows in the log as "blocked by agentbox", never as a site block.

File: `image/tools/tunnel.py`

```python
"""Plain forwarding proxy for Chromium on 127.0.0.1:8081. It never decrypts TLS, so the browser keeps its
own fingerprint. Direct mode: tunnels straight to the site. Proxy mode (/work/.proxy_on): chains each
connection to the active proxy service. Refuses new connections once the budget is spent, and drops known
browser background/analytics hosts so they never cost money."""
import asyncio, sys
sys.path.insert(0, "/opt/agentbox")
import boxlib as L

NOISE = ("accounts.google.com", "gvt1.com", "clients2.google.com", "update.googleapis.com", "safebrowsing.googleapis.com",
         "optimizationguide-pa.googleapis.com", "content-autofill.googleapis.com", "google-analytics.com",
         "googletagmanager.com", "doubleclick.net", "clarity.ms", "hotjar.com")
OPEN = {}  # client writer -> (mode, host); a mode switch closes every tunnel opened in the old mode


async def pipe(r, w):
    try:
        while data := await r.read(65536):
            w.write(data); await w.drain()
    except Exception:
        pass
    finally:
        try: w.close()
        except Exception: pass


async def refuse(cw, status):
    cw.write(f"HTTP/1.1 {status}\r\n\r\n".encode()); await cw.drain(); cw.close()


async def handle(cr, cw):
    try:
        head = await cr.readuntil(b"\r\n\r\n")
    except Exception:
        cw.close(); return
    line = head.split(b"\r\n", 1)[0].decode("latin-1")
    method, target, _ = line.split(" ", 2)
    host = target.split(":")[0] if method == "CONNECT" else target.split("/")[2].split(":")[0]
    if host.endswith(NOISE):
        return await refuse(cw, "403 Blocked by agentbox")
    mode = L.via()
    try:
        if mode != "direct":
            if not L.proxy_url():
                return await refuse(cw, "502 agentbox proxy service not in proxy.json")
            if not L.can_spend():
                return await refuse(cw, "402 agentbox proxy budget exhausted")
            ph, pp, auth = L.upstream()
            ur, uw = await asyncio.open_connection(ph, pp)
            extra = f"Proxy-Authorization: {auth}\r\n" if auth else ""
            if method == "CONNECT":
                uw.write(f"CONNECT {target} HTTP/1.1\r\nHost: {target}\r\n{extra}\r\n".encode())
            else:
                uw.write(head.replace(b"\r\n", b"\r\n" + extra.encode(), 1) if extra else head)
            await uw.drain()
        elif method == "CONNECT":
            h, p = target.rsplit(":", 1)
            ur, uw = await asyncio.open_connection(h, int(p))
            cw.write(b"HTTP/1.1 200 Connection Established\r\n\r\n"); await cw.drain()
        else:
            hostport = target.split("/")[2]
            h, p = hostport.rsplit(":", 1) if ":" in hostport else (hostport, "80")
            ur, uw = await asyncio.open_connection(h, int(p))
            path = "/" + target.split("/", 3)[3] if target.count("/") >= 3 else "/"
            uw.write(head.replace(target.encode(), path.encode(), 1)); await uw.drain()
    except Exception as e:
        return await refuse(cw, f"502 agentbox tunnel error {e}")
    OPEN[cw] = (mode, host)
    try:
        await asyncio.gather(pipe(cr, uw), pipe(ur, cw))
    finally:
        OPEN.pop(cw, None)
        for w in (cw, uw):
            try: w.close()
            except Exception: pass


async def watch_mode():
    """Drop connections opened under the previous mode on every switch, and publish the applied mode
    so the `proxy` command can wait for it (the stale-connection rule)."""
    cur = L.via()
    open("/tmp/tunnel.mode", "w").write(cur)
    while True:
        await asyncio.sleep(0.2)
        new = L.via()
        if new == cur:
            continue
        stale = [(w, h) for w, (m, h) in list(OPEN.items()) if m != new]
        for w, _ in stale:
            try: w.transport.abort()
            except Exception: pass
        L.write_agent({"type": "box", "text": f"proxy {cur} -> {new}: closed {len(stale)} open browser tunnels "
                       f"({', '.join(sorted({h for _, h in stale})) or 'none'})"})
        cur = new
        open("/tmp/tunnel.mode", "w").write(cur)


async def main():
    srv = await asyncio.start_server(handle, "127.0.0.1", 8081)
    asyncio.create_task(watch_mode())
    async with srv:
        await srv.serve_forever()


asyncio.run(main())
```

## The `proxy` command

```
proxy list                 services, prices and budget (no credentials)
proxy on                   default service
proxy on residential       a named service (switching services also drops old browser connections)
proxy off                  back to direct
proxy status               current mode and spend
```

File: `image/tools/proxy`

```python
#!/usr/bin/env python3
"""proxy list | on [service] | off | status -- route the whole box (browser tunnel, curl, python) through a
proxy service from proxy.json, or go direct."""
import json, os, sys, time
sys.path.insert(0, "/opt/agentbox")
import boxlib as L

a = sys.argv[1:] or ["status"]
cfg = L.config()
services = cfg.get("services", {})

if a[0] == "list":
    print(f"budget for this box: ${L.budget():.2f}")
    for n, s in services.items():
        price = " + ".join(p for p in [f"${s['usd_per_request']}/request" if s.get("usd_per_request") else "",
                                       f"${s['usd_per_gb']}/GB" if s.get("usd_per_gb") else ""] if p) or "no price set"
        default = "   (default)" if n == cfg.get("default_service") else ""
        print(f"  {n:<14} {price:<28} {s.get('notes', '')}{default}")
    if not services:
        print("  no proxy services configured: direct only")
    sys.exit(0)
if a[0] == "on":
    name = a[1] if len(a) > 1 else cfg.get("default_service")
    if not name or name not in services:
        print("unknown or missing service; see: proxy list"); sys.exit(1)
    open(L.FLAG, "w").write(name)
elif a[0] == "off":
    if os.path.exists(L.FLAG):
        os.remove(L.FLAG)
elif a[0] != "status":
    print(__doc__); sys.exit(2)

want = L.via()
# wait until the browser tunnel has applied the mode and dropped connections from the old one
for _ in range(25):
    try:
        if open("/tmp/tunnel.mode").read() == want:
            break
    except FileNotFoundError:
        pass
    time.sleep(0.2)
else:
    print(f"proxy: {want} requested but the browser tunnel did not apply it"); sys.exit(1)
print(f"proxy: {want} (curl, python and browser)")
try:
    print(json.dumps(json.load(open(L.SPEND))))
except Exception:
    print('{"spent": 0}')
```
