# Browser listener

`netlog.py` starts at boot, connects to Chromium over CDP (`127.0.0.1:9222`) and subscribes to `requestfinished` and `requestfailed` on every page, including pages opened later by the `browser` command or by any other CDP client. It reads each response body from Chromium's own cache. It never routes, blocks or changes a request.

Details that matter:
- **No duplicates.** Each page and each browser context is hooked once (tracked by object id). Without this, re-scanning pages every half second would log each request twice.
- **Failures are logged**, with Chromium's reason (`net::ERR_TIMED_OUT`, `net::ERR_TUNNEL_CONNECTION_FAILED`, ...). Requests the tunnel refuses on purpose (browser background traffic, analytics) are labelled as such, so they never look like a site block.
- **Proxy cost.** A request made while the proxy is on is charged to the active service, using the response size for bandwidth-billed services.

File: `image/tools/netlog.py`

```python
"""Passive browser listener: attaches to Chromium over CDP and logs every request it makes
(including failures) with full text bodies. Never touches the traffic itself."""
import asyncio, sys
sys.path.insert(0, "/opt/agentbox")
import boxlib as L
from playwright.async_api import async_playwright

SKIP_TYPES = {"image", "font", "stylesheet", "media"}
NOISE = ("google.com", "gvt1.com", "googleapis.com", "google-analytics.com", "googletagmanager.com",
         "doubleclick.net", "clarity.ms", "hotjar.com")


async def finished(req):
    if req.resource_type in SKIP_TYPES:
        return
    rid = L.new_id()
    rec = {"id": rid, "source": "browser", "method": req.method, "url": req.url, "type": req.resource_type,
           "req_headers": L.redact(await req.all_headers()), "req_body": (req.post_data or "")[:4000], "via": L.via()}
    nbytes = 0
    try:
        resp = await req.response()
        rec["status"] = resp.status if resp else None
        ctype = (resp.headers.get("content-type", "") if resp else "")
        rec["ctype"] = ctype
        nbytes = int((resp.headers.get("content-length") or 0) if resp else 0)
        if resp and any(t in ctype for t in L.TEXTY):
            raw = await resp.body()
            nbytes = len(raw)
            text = raw.decode("utf-8", "replace")
            rec["body"] = text[:2000]
            rec["body_file"] = L.save_body(rid, text)
    except Exception as e:  # body may be gone (redirects, navigations)
        rec["body_error"] = str(e)[:200]
    rec["timing_ms"] = round(req.timing.get("responseEnd", -1), 1)
    L.write(rec)
    if rec["via"] != "direct":
        L.charge(nbytes, rec["via"])


def failed(req):
    if req.resource_type in SKIP_TYPES:
        return
    host = req.url.split("/")[2].split(":")[0] if "//" in req.url else ""
    reason = req.failure
    if host.endswith(NOISE) and "TUNNEL" in (reason or ""):
        reason = "blocked by agentbox (browser background / analytics host)"
    L.write({"id": L.new_id(), "source": "browser", "method": req.method, "url": req.url, "type": req.resource_type,
             "req_body": (req.post_data or "")[:4000], "via": L.via(), "status": None, "error": reason})


_hooked = set()


def hook(page):
    if id(page) in _hooked:
        return
    _hooked.add(id(page))
    page.on("requestfinished", lambda r: asyncio.ensure_future(finished(r)))
    page.on("requestfailed", failed)


async def main():
    async with async_playwright() as p:
        b = None
        for _ in range(60):
            try:
                b = await p.chromium.connect_over_cdp("http://127.0.0.1:9222")
                break
            except Exception:
                await asyncio.sleep(0.5)
        watched = set()

        def watch(ctx):
            if id(ctx) in watched:
                return
            watched.add(id(ctx))
            ctx.on("page", hook)
        open("/tmp/netlog.ready", "w").write("ok")
        while True:  # pick up contexts and pages created by other CDP clients
            for ctx in b.contexts:
                watch(ctx)
                for pg in ctx.pages:
                    hook(pg)
            await asyncio.sleep(0.5)


asyncio.run(main())
```
