# Python hook

`agentbox_hook.py` is copied into python's site-packages and loaded by a `.pth` file, so it runs at the start of every `python3` process in the box, including scripts the subagent writes. It does nothing until the script imports `requests` or `curl_cffi`; then it wraps `requests.Session.send` and `curl_cffi.requests.Session.request` (which every helper like `requests.get` goes through).

The wrapper logs each call, successes and exceptions alike, and in proxy mode it sets `proxies` to the active service and raises `RuntimeError("agentbox: proxy budget exhausted")` once the budget is spent. If the logging library fails to load, python still works; only logging is skipped.

File: `image/tools/agentbox_hook.py`

```python
"""Loaded by every python3 in the box. Observes requests and curl_cffi calls and logs them
(including failures) without changing them. In proxy mode it routes them through the active proxy
service and enforces the budget."""
import sys
sys.path.insert(0, "/opt/agentbox")
try:
    import boxlib as L
except Exception:  # never break python because of logging
    L = None


def _record(method, url, req_body, status=None, ctype="", text=None, headers=None, error=None, client="", nbytes=0):
    if L is None:
        return
    rid = L.new_id()
    rec = {"id": rid, "source": f"python:{client}", "method": method, "url": url, "req_headers": L.redact(headers or {}),
           "req_body": (req_body if isinstance(req_body, str) else (req_body or b"").decode("utf-8", "replace"))[:4000],
           "status": status, "ctype": ctype, "via": L.via()}
    if error:
        rec["error"] = str(error)[:500]
    if text is not None and any(t in (ctype or "") for t in L.TEXTY):
        rec["body"] = text[:2000]; rec["body_file"] = L.save_body(rid, text)
    L.write(rec)
    if rec["via"] != "direct":
        L.charge(nbytes, rec["via"])


def _proxies():
    if not (L and L.active()):
        return None
    if not L.can_spend():
        raise RuntimeError("agentbox: proxy budget exhausted")
    url = L.proxy_url()
    if not url:
        raise RuntimeError("agentbox: proxy is on but its service is not in proxy.json")
    return {"http": url, "https": url}


def _patch_requests(mod):
    orig = mod.Session.send

    def send(self, request, **kw):
        px = _proxies()
        if px:
            kw["proxies"] = px
        try:
            r = orig(self, request, **kw)
        except Exception as e:
            _record(request.method, request.url, request.body, headers=dict(request.headers), error=e, client="requests"); raise
        stream = kw.get("stream")
        text = None if stream else r.text
        _record(request.method, request.url, request.body, r.status_code, r.headers.get("content-type", ""), text,
                dict(request.headers), client="requests", nbytes=0 if stream else len(r.content))
        return r
    mod.Session.send = send


def _patch_curl_cffi(mod):
    orig = mod.Session.request

    def request(self, method, url, *a, **kw):
        px = _proxies()
        if px:
            kw["proxies"] = px
        body = kw.get("data") or kw.get("json") or ""
        try:
            r = orig(self, method, url, *a, **kw)
        except Exception as e:
            _record(method, url, str(body), error=e, client="curl_cffi"); raise
        _record(method, url, str(body), r.status_code, r.headers.get("content-type", ""), r.text, kw.get("headers"),
                client="curl_cffi", nbytes=len(r.content))
        return r
    mod.Session.request = request


# Patch lazily: after any import, if requests / curl_cffi.requests is loaded and not yet patched, patch it.
import builtins
_orig_import = builtins.__import__
_done = set()


def _import(name, *a, **kw):
    mod = _orig_import(name, *a, **kw)
    try:
        if "requests" not in _done and "requests" in sys.modules and hasattr(sys.modules["requests"], "Session"):
            _done.add("requests"); _patch_requests(sys.modules["requests"])
        cr = sys.modules.get("curl_cffi.requests")
        if "curl_cffi" not in _done and cr is not None and hasattr(cr, "Session"):
            _done.add("curl_cffi"); _patch_curl_cffi(cr)
    except Exception:
        pass
    return mod


builtins.__import__ = _import
```

Not covered: `urllib`, `httpx`, `aiohttp` and raw sockets are not hooked. Tell subagents to use `requests` or `curl_cffi` (the brief template already does), or `curl` from the shell.
