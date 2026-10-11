# Logs, journal, timeline and audit

A box logs three things: the traffic (what went over the network), the commands (what the subagent ran) and the agent (what the subagent intended and concluded). Together they let you replay a run step by step and check any claim against the evidence.

## Files in `$AGENTBOX_HOME/runs/<box>/`

| File | Written by | What |
|---|---|---|
| `requests.jsonl` + `bodies/` | listeners | every request from browser, curl and python, failures included, with full text bodies |
| `commands.jsonl` + `commands/NNNN.log` | `agentbox exec` | every command: start, end, duration, exit code, full output |
| `agent.jsonl` | `agentbox note`, `agentbox collect`, the box | the journal (PLAN / DOING / FOUND / BLOCKED), the imported transcript (messages, tool calls, results), box events (box up, proxy switches) |
| `agent_transcript.jsonl` | `agentbox collect` | raw copy of the subagent transcript |
| `proxy_spend.json` | listeners | estimated spend, requests and bytes, per service |
| `timeline.md` | `agentbox timeline --md` | all of the above in one time-ordered view |
| `result.json` and deliverables | the subagent | what it was asked to produce |

## The journal

The subagent writes a journal entry from the host before and after each step. This is the log of the agent's reasoning, which the request log alone cannot show.

```
agentbox note <box> "PLAN: 1) find the search API behind the page 2) test pagination 3) write crawler"
agentbox note <box> "DOING: open the search page in the browser because curl got an empty SPA shell"
agentbox note <box> "FOUND: POST /api/search returns JSON with 20 rows per page (evidence: 1791501297873156630)"
agentbox note <box> "BLOCKED: detail pages return 403 direct and with proxy on (evidence: 179150131..., 179150134...)"
```

Rules for subagents: every FOUND and BLOCKED cites request ids or a file in `/work`; a claim without evidence is written as "not verified".

## Importing the transcript

If the agent runtime saves the subagent's conversation as JSONL (Claude Code does: the subagent's output file), import it so the timeline also shows each message and tool call:

```bash
agentbox collect <box> /path/to/subagent-transcript.jsonl
```

File: `bin/collect.py`

```python
#!/usr/bin/env python3
"""Import a subagent transcript (JSONL, one message per line) into a box log.

  collect.py <runs/box> <transcript.jsonl>

Copies the raw transcript to agent_transcript.jsonl and appends one agent.jsonl entry per assistant
message ("say"), tool call ("tool") and tool result ("result", truncated)."""
import json, shutil, sys
from datetime import datetime

run, src = sys.argv[1], sys.argv[2]
shutil.copy(src, f"{run}/agent_transcript.jsonl")


def ts(s):
    try:
        return round(datetime.fromisoformat(s.replace("Z", "+00:00")).timestamp(), 3)
    except Exception:
        return None


out = []
for line in open(src):
    try:
        o = json.loads(line)
    except Exception:
        continue
    t = ts(o.get("timestamp", ""))
    content = (o.get("message") or {}).get("content")
    if not t or not isinstance(content, list):
        continue
    for b in content:
        if b.get("type") == "text" and o.get("type") == "assistant" and b.get("text", "").strip():
            out.append({"ts": t, "type": "say", "text": b["text"].strip()[:4000]})
        elif b.get("type") == "tool_use":
            inp = b.get("input", {})
            out.append({"ts": t, "type": "tool", "tool": b.get("name"),
                        "text": inp.get("command") or inp.get("description") or json.dumps(inp)[:1000]})
        elif b.get("type") == "tool_result":
            c = b.get("content")
            text = c if isinstance(c, str) else " ".join(x.get("text", "") for x in (c or []) if isinstance(x, dict))
            out.append({"ts": t, "type": "result", "error": bool(b.get("is_error")), "text": text[:800]})
with open(f"{run}/agent.jsonl", "a") as f:
    for e in out:
        f.write(json.dumps(e) + "\n")
print(f"imported {len(out)} agent events into {run}/agent.jsonl")
```

Other runtimes: adapt the parser to their transcript format, keeping the same `{ts, type, text}` entries.

## Timeline

```bash
agentbox timeline <box>          # print
agentbox timeline <box> --md     # also write runs/<box>/timeline.md
```

```
20:14:46.866  NOTE   DOING: browser open direct because the 403 may be fingerprint-based
20:14:47.102  CMD    #7 exit=0 9312ms  browser open https://portal.example.com/apps/search
20:14:52.513  HTTP   403 GET browser direct https://portal.example.com/apps/search
20:14:56.401  NOTE   FOUND: browser direct also 403 (evidence: 1791501287588504542), IP block
20:14:57.002  BOX    proxy direct -> datacenter: closed 2 open browser tunnels (portal.example.com)
```

File: `bin/timeline.py`

```python
#!/usr/bin/env python3
"""Merge a box's agent journal, commands and requests into one time-ordered view.

  timeline.py <runs/box> [--md]     prints to stdout; --md also writes <runs/box>/timeline.md"""
import json, os, sys
from datetime import datetime

run = sys.argv[1]
md = "--md" in sys.argv


def load(name):
    p = os.path.join(run, name)
    if not os.path.exists(p):
        return []
    rows = []
    for l in open(p):
        try:
            rows.append(json.loads(l))
        except Exception:
            pass
    return rows


ev = []
for a in load("agent.jsonl"):
    kind = {"note": "NOTE", "say": "AGENT", "tool": "TOOL", "result": "RESULT", "box": "BOX"}.get(a["type"], a["type"].upper())
    extra = f" [{a['tool']}]" if a.get("tool") else ""
    ev.append((a["ts"], kind, f"{extra} {a['text']}".strip()))
for c in load("commands.jsonl"):
    ev.append((c["ts"], "CMD", f"#{c['n']} exit={c['exit']} {c['ms']}ms  {c['cmd'][:300]}"))
for r in load("requests.jsonl"):
    st = r.get("status") or "ERR"
    err = f" error={r['error']}" if r.get("error") else ""
    ev.append((r["ts"], "HTTP", f"{st} {r.get('method')} {r.get('source')} {r.get('via')} {str(r.get('url'))[:180]}{err}"))
ev.sort(key=lambda e: e[0])

lines = []
for t, kind, text in ev:
    stamp = datetime.fromtimestamp(t).strftime("%H:%M:%S.%f")[:-3]
    text = text.replace("\n", " ")
    lines.append(f"{stamp}  {kind:<6} {text[:600]}")
print("\n".join(lines))
if md:
    with open(os.path.join(run, "timeline.md"), "w") as f:
        f.write(f"# Timeline: {os.path.basename(run)}\n\n```\n" + "\n".join(lines) + "\n```\n")
    print(f"\nwritten {run}/timeline.md", file=sys.stderr)
```

## Audit (before you report anything)

For each subagent:

1. `agentbox collect` its transcript, then `agentbox timeline <box> --md`.
2. Open `result.json`. For every claim, find the cited request ids in `requests.jsonl` and check that the status, URL, `via` and body say what the claim says.
3. For every "blocked", "not available" or "requires X" claim, check the log shows the failure at each rung of `subagents/escalation.md`: direct curl, direct browser, curl with the proxy on, browser with the proxy on. If a rung is missing, the claim is not verified; rerun that rung yourself in the same box or send the subagent back.
4. Check `proxy_spend.json` against the budget, and note the spend per service in your report.
5. Report claims as verified or not verified. Never pass on an unchecked "blocked".
