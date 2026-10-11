# boxlib: shared logging and budget library

Every tool in the box imports this module. It owns the log format, secret redaction, the active proxy service and the budget counters, so the browser, curl and python all log and charge the same way.

State it reads and writes inside the box:

| Path | What |
|---|---|
| `/run/agentbox/proxy.json` | proxy services, prices, budget (read-only mount of `config/`) |
| `/work/.proxy_on` | exists while the proxy is on; holds the active service name |
| `/work/.budget` | optional per-box budget override |
| `/work/requests.jsonl` | request log |
| `/work/agent.jsonl` | agent journal (box events are added here too) |
| `/work/proxy_spend.json` | `{spent, requests, bytes, budget, by_service}` |
| `/work/bodies/<id>.txt` | full response bodies |

File: `image/tools/boxlib.py`

```python
"""Shared logging and proxy-budget helpers for every tool inside an agentbox.

All network activity (browser, curl, python) is appended to /work/requests.jsonl by observers that sit
beside the traffic, never in its path. Full text bodies go to /work/bodies/<id>.txt.
"""
import base64, fcntl, json, os, time
from urllib.parse import unquote, urlsplit

WORK = "/work"
LOG = f"{WORK}/requests.jsonl"
AGENT = f"{WORK}/agent.jsonl"
SPEND = f"{WORK}/proxy_spend.json"
BODIES = f"{WORK}/bodies"
FLAG = f"{WORK}/.proxy_on"
CONFIG = "/run/agentbox/proxy.json"
REDACT = {"authorization", "cookie", "set-cookie", "proxy-authorization", "x-api-key", "x-auth-token"}
TEXTY = ("json", "text", "xml", "javascript", "html", "csv")


def config():
    try:
        with open(CONFIG) as f:
            return json.load(f)
    except Exception:
        return {"services": {}}


def budget():
    try:
        return float(open(f"{WORK}/.budget").read().strip())
    except Exception:
        return float(config().get("budget_usd_per_box", 1.0))


def active():
    """Name of the active proxy service, or None when the box is direct."""
    try:
        name = open(FLAG).read().strip()
    except FileNotFoundError:
        return None
    return name or config().get("default_service")


def service(name=None):
    name = name or active()
    return name, (config().get("services", {}).get(name) if name else None)


def via():
    return active() or "direct"


def proxy_url():
    _, s = service()
    return s["url"] if s else None


def upstream():
    """(host, port, Proxy-Authorization value or None) of the active service."""
    u = urlsplit(proxy_url())
    auth = None
    if u.username is not None:
        auth = "Basic " + base64.b64encode(f"{unquote(u.username)}:{unquote(u.password or '')}".encode()).decode()
    return u.hostname, u.port or 80, auth


def cost(nbytes=0, name=None):
    _, s = service(name)
    if not s:
        return 0.0
    return float(s.get("usd_per_request", 0)) + nbytes / 1e9 * float(s.get("usd_per_gb", 0))


def redact(headers):
    return {k: ("<redacted>" if k.lower() in REDACT else v) for k, v in (headers or {}).items()}


def new_id():
    return f"{time.time_ns()}"


def save_body(rid, text):
    if not text:
        return None
    os.makedirs(BODIES, exist_ok=True)
    path = f"{BODIES}/{rid}.txt"
    with open(path, "w") as f:
        f.write(text[:2_000_000])
    return path


def write(rec, path=LOG):
    rec.setdefault("ts", round(time.time(), 3))
    with open(path, "a") as f:
        fcntl.flock(f, fcntl.LOCK_EX)
        f.write(json.dumps(rec, default=str) + "\n")
        fcntl.flock(f, fcntl.LOCK_UN)


def write_agent(rec):
    """Box-side events (proxy switches, tunnel resets) go into the agent journal so the timeline shows them."""
    write(rec, AGENT)


def _spend_rw(fn):
    fd = os.open(SPEND, os.O_RDWR | os.O_CREAT)
    with os.fdopen(fd, "r+") as f:
        fcntl.flock(f, fcntl.LOCK_EX)
        raw = f.read()
        st = json.loads(raw) if raw.strip() else {"spent": 0.0, "requests": 0, "bytes": 0, "by_service": {}}
        st["budget"] = budget()
        out = fn(st)
        f.seek(0); f.truncate(); f.write(json.dumps(st)); f.flush()
        fcntl.flock(f, fcntl.LOCK_UN)
    return out


def can_spend(c=None):
    """True while the next proxied request fits in the budget."""
    c = cost() if c is None else c
    return _spend_rw(lambda st: st["spent"] < st["budget"] and st["spent"] + c <= st["budget"])


def charge(nbytes=0, name=None):
    """Add one proxied request (and its response size) to the spend, under the service that carried it."""
    name, s = service(name)
    if not s:
        return
    c = cost(nbytes, name)

    def f(st):
        st["spent"] = round(st["spent"] + c, 6); st["requests"] += 1; st["bytes"] += int(nbytes)
        b = st.setdefault("by_service", {}).setdefault(name, {"requests": 0, "bytes": 0, "spent": 0.0})
        b["requests"] += 1; b["bytes"] += int(nbytes); b["spent"] = round(b["spent"] + c, 6)
    _spend_rw(f)
```
