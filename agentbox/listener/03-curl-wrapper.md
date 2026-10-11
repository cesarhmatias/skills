# curl wrapper

`/usr/local/bin/curl` comes first on `PATH`, so every `curl` in the box runs this wrapper. It calls the real `/usr/bin/curl` with the same arguments, streams the output back unchanged, and then writes one record with the method, URL, request body, final status, content type, response body and curl's exit code (so timeouts and DNS failures are logged too).

When the proxy is on, the wrapper adds `-x <service url>` and refuses to run (exit 56) once the budget is spent. `curl --noproxy` and `curl --version` bypass the wrapper's proxy logic.

File: `image/tools/curl`

```bash
#!/bin/bash
# curl wrapper: runs the real curl unchanged and logs the call (status, headers, body) to /work/requests.jsonl.
# When the proxy is on it routes through the active service and enforces the budget.
REAL=/usr/bin/curl
case " $* " in *" --noproxy "*|*" -V "*|*" --version "*) exec "$REAL" "$@";; esac
EXTRA=()
if [ -f /work/.proxy_on ]; then
  PX=$(python3 -c 'import sys
sys.path.insert(0, "/opt/agentbox")
import boxlib as L
url = L.proxy_url()
if not url: sys.exit(3)
if not L.can_spend(): sys.exit(1)
print(url)')
  case $? in
    0) EXTRA=(-x "$PX") ;;
    3) echo "agentbox: proxy is on but its service is not in proxy.json" >&2; exit 56 ;;
    *) echo "agentbox: proxy budget exhausted" >&2; exit 56 ;;
  esac
fi
HDR=$(mktemp); OUT=$(mktemp); START=$(date +%s.%N)
"$REAL" -D "$HDR" "${EXTRA[@]}" "$@" | tee "$OUT"
CODE=${PIPESTATUS[0]}
python3 /opt/agentbox/logcurl.py "$HDR" "$OUT" "$CODE" "$START" "$@" 2>/dev/null
rm -f "$HDR" "$OUT"
exit $CODE
```

File: `image/tools/logcurl.py`

```python
"""Turns one curl invocation into a requests.jsonl record (called by the curl wrapper)."""
import os, sys, time
sys.path.insert(0, "/opt/agentbox")
import boxlib as L

hdr, out, code, start, args = sys.argv[1], sys.argv[2], int(sys.argv[3]), float(sys.argv[4]), sys.argv[5:]
method, url, body, outfile = "GET", None, "", None
i = 0
while i < len(args):
    a = args[i]
    if a in ("-o", "--output"): outfile = args[i + 1]; i += 2; continue
    if a in ("-X", "--request"): method = args[i + 1]; i += 2; continue
    if a in ("-d", "--data", "--data-raw", "--data-binary", "--data-urlencode", "--json"):
        body = args[i + 1]; method = "POST" if method == "GET" else method; i += 2; continue
    if a in ("-I", "--head"): method = "HEAD"
    if a.startswith("http://") or a.startswith("https://"): url = a
    i += 1
raw = open(hdr, errors="replace").read()
blocks = [b for b in raw.split("\r\n\r\n") if b.strip().startswith("HTTP/")]
status, ctype, clen = None, "", 0
if blocks:  # the last block is the final response (after redirects and the proxy's CONNECT reply)
    last = blocks[-1].split("\r\n")
    status = int(last[0].split()[1])
    for h in last[1:]:
        if h.lower().startswith("content-type:"): ctype = h.split(":", 1)[1].strip()
        if h.lower().startswith("content-length:") and h.split(":", 1)[1].strip().isdigit(): clen = int(h.split(":", 1)[1])
text = open(out, errors="replace").read()
rid = L.new_id()
rec = {"id": rid, "source": "curl", "method": method, "url": url, "req_body": body[:4000], "status": status,
       "ctype": ctype, "via": L.via(), "curl_exit": code, "ms": round((time.time() - start) * 1000)}
if code != 0:
    rec["error"] = f"curl exit {code}"
if text and (any(t in ctype for t in L.TEXTY) or not ctype):
    rec["body"] = text[:2000]; rec["body_file"] = L.save_body(rid, text)
L.write(rec)
if rec["via"] != "direct":
    # response size for bandwidth pricing: stdout, else the -o file, else Content-Length (unknown with -o /dev/null + chunked)
    size = os.path.getsize(out)
    if outfile and outfile != "/dev/null" and os.path.isfile(outfile):
        size = max(size, os.path.getsize(outfile))
    L.charge(max(clen, size), rec["via"])
```

Limits: with `-o /dev/null` and a response without `Content-Length`, the response size is unknown and a per-GB service is charged only its per-request price. The wrapper logs one record per curl call. With `-L` the record holds the final URL's status; with several URLs in one call it keeps the last one. Subagents should make one request per curl call.
