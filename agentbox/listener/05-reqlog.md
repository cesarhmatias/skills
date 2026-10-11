# reqlog

How subagents read what the listeners captured. The main use is discovery: open a page in the browser, then `reqlog --xhr` shows the JSON/XML API calls the page made, which can then be replayed with curl.

```
reqlog                      last 30 requests, all sources
reqlog --xhr                only API-looking calls (JSON/XML responses or non-GET)
reqlog --errors             only failures (no response, 4xx, 5xx)
reqlog --source browser     browser | curl | python
reqlog --grep search        URL, request body or response body contains the text
reqlog --last 100
reqlog --full <id>          one whole record (headers, body preview, path of the saved full body)
```

Each line: `id status method source via url [body=...] [error=...]`. The `id` is what subagents cite as evidence.

File: `image/tools/reqlog`

```python
#!/usr/bin/env python3
"""Read what the listeners captured (browser, curl, python), including failed requests.

  reqlog [--grep text] [--last 30] [--xhr] [--errors] [--source browser|curl|python] [--full ID]
    --xhr     only API-looking calls (JSON/XML responses or non-GET)
    --errors  only failed requests (no response, 4xx/5xx)
    --full    print one full record by id (with headers and the saved body file path)
"""
import json, sys
a = sys.argv[1:]


def opt(n, d=None):
    return a[a.index(n) + 1] if n in a else d


try:
    recs = [json.loads(l) for l in open("/work/requests.jsonl")]
except FileNotFoundError:
    recs = []
if "--full" in a:
    rid = opt("--full")
    for r in recs:
        if r.get("id") == rid:
            print(json.dumps(r, indent=1))
    sys.exit()
g, src = opt("--grep"), opt("--source")
out = []
for r in recs:
    if g and g.lower() not in (str(r.get("url")) + r.get("body", "") + r.get("req_body", "")).lower():
        continue
    if src and not r.get("source", "").startswith(src):
        continue
    if "--xhr" in a and not ("json" in (r.get("ctype") or "") or "xml" in (r.get("ctype") or "") or r.get("method") != "GET"):
        continue
    if "--errors" in a and not (r.get("error") or not r.get("status") or r.get("status", 0) >= 400):
        continue
    st = r.get("status") or "ERR"
    line = f'{r.get("id")} {st} {r.get("method")} {r.get("source")} {r.get("via")} {str(r.get("url"))[:150]}'
    if r.get("req_body"):
        line += f'  body={r["req_body"][:100]}'
    if r.get("error"):
        line += f'  error={str(r["error"])[:100]}'
    out.append(line)
print("\n".join(out[-int(opt("--last", 30)):]) or "nothing captured yet")
```
