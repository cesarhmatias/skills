# Host CLI

`$AGENTBOX_HOME/bin/agentbox` is the only command the orchestrator and the subagents run on the host.

| Command | What it does |
|---|---|
| `agentbox build` | build the image |
| `agentbox up <box>` | start a box. Its `/work` is `runs/<box>/`; an older run with the same name is moved to `runs/_archive/` |
| `agentbox exec <box> -- <cmd>` | run a shell command inside the box. Output streams back and is saved; the call is logged to `commands.jsonl` |
| `agentbox note <box> "<text>"` | append a journal entry (PLAN / DOING / FOUND / BLOCKED) to `agent.jsonl` |
| `agentbox collect <box> <transcript.jsonl>` | import a subagent's transcript into the box log |
| `agentbox timeline <box> [--md]` | journal, commands and requests merged in time order |
| `agentbox spend <box>` | proxy spend of the box |
| `agentbox ls` | running boxes |
| `agentbox down <box>` / `--all` | remove containers (runs stay on disk) |

The proxy config folder is mounted read-only at `/run/agentbox` inside each box. The image name defaults to `agentbox` (`AGENTBOX_IMAGE` overrides it). Containers are labelled `agentbox=1` and capped with `AGENTBOX_MEM` (default `1500m`) and `AGENTBOX_CPUS` (default `1`).

File: `bin/agentbox`

```bash
#!/bin/bash
# agentbox: one Docker sandbox per subagent (terminal, headless browser, passive request listeners, budgeted proxy).
#
#   agentbox build                       build the image
#   agentbox up <box>                    start a box; its /work is runs/<box>/ (an older run is archived, never deleted)
#   agentbox exec <box> -- <cmd>         run a command inside the box; logged to runs/<box>/commands.jsonl
#   agentbox note <box> "<text>"         agent journal entry (runs/<box>/agent.jsonl)
#   agentbox collect <box> <transcript>  import a subagent transcript (JSONL) into the box log
#   agentbox timeline <box> [--md]       journal + commands + requests in time order
#   agentbox spend <box>                 proxy spend of the box
#   agentbox ls | down <box> | down --all
set -euo pipefail
HOME_DIR="${AGENTBOX_HOME:-$HOME/.agentbox}"
IMG="${AGENTBOX_IMAGE:-agentbox}"
RUNS="$HOME_DIR/runs"
now() { python3 -c 'import time;print(round(time.time(),3))'; }
journal() { python3 -c "import json,sys,time;open(sys.argv[1],'a').write(json.dumps({'ts':round(time.time(),3),'type':sys.argv[2],'text':sys.argv[3]})+'\n')" "$@"; }
need_box() { [ -n "${1:-}" ] || { echo "box name required"; exit 2; }; }

cmd=${1:-help}; shift || true
case "$cmd" in
  build) docker build -t $IMG "$HOME_DIR/image" ;;
  up)
    need_box "${1:-}"; name=$1; dir="$RUNS/$name"
    case "$name" in *[!a-z0-9-]*) echo "box names use a-z, 0-9 and -"; exit 2;; esac
    if [ -d "$dir" ]; then mkdir -p "$RUNS/_archive"; mv "$dir" "$RUNS/_archive/$name-$(date +%Y%m%d-%H%M%S)"; fi
    mkdir -p "$dir/commands" "$HOME_DIR/config"
    [ -n "${AGENTBOX_BUDGET_USD:-}" ] && echo "$AGENTBOX_BUDGET_USD" > "$dir/.budget"   # per-box budget override
    docker image inspect $IMG >/dev/null 2>&1 || docker build -q -t $IMG "$HOME_DIR/image" >/dev/null
    docker rm -f "agentbox-$name" >/dev/null 2>&1 || true
    docker run -d --name "agentbox-$name" --label agentbox=1 --shm-size=1g \
      --memory "${AGENTBOX_MEM:-1500m}" --cpus "${AGENTBOX_CPUS:-1}" \
      -v "$HOME_DIR/config:/run/agentbox:ro" -v "$dir:/work" $IMG >/dev/null
    for _ in $(seq 1 90); do [ -f "$dir/.ready" ] && break; sleep 0.5; done
    [ -f "$dir/.ready" ] || { echo "box failed to boot"; docker logs "agentbox-$name" | tail -20; exit 1; }
    journal "$dir/agent.jsonl" box "box up"
    echo "box agentbox-$name up, workdir $dir" ;;
  exec)
    need_box "${1:-}"; name=$1; shift; [ "${1:-}" = "--" ] && shift
    dir="$RUNS/$name"; c="$*"
    n=$(ls "$dir/commands" 2>/dev/null | wc -l | tr -d ' '); n=$((n+1)); out="$dir/commands/$(printf %04d $n).log"
    t0=$(now)
    set +e; docker exec "agentbox-$name" bash -lc "$c" 2>&1 | tee "$out"; code=${PIPESTATUS[0]}; set -e
    t1=$(now)
    python3 - "$dir/commands.jsonl" "$n" "$t0" "$t1" "$code" "$out" "$c" <<'PY'
import json, sys
f, n, t0, t1, code, out, c = sys.argv[1:8]
tail = open(out, errors="replace").read()[-600:]
open(f, "a").write(json.dumps({"n": int(n), "ts": float(t0), "end": float(t1), "ms": round((float(t1) - float(t0)) * 1000),
                               "cmd": c, "exit": int(code), "out_file": out, "out_tail": tail}) + "\n")
PY
    exit $code ;;
  note)
    need_box "${1:-}"; name=$1; shift
    journal "$RUNS/$name/agent.jsonl" note "$*"; echo "noted" ;;
  collect) need_box "${1:-}"; python3 "$HOME_DIR/bin/collect.py" "$RUNS/$1" "$2" ;;
  timeline) need_box "${1:-}"; python3 "$HOME_DIR/bin/timeline.py" "$RUNS/$1" "${2:-}" ;;
  spend) need_box "${1:-}"; cat "$RUNS/$1/proxy_spend.json" 2>/dev/null || echo '{"spent": 0}'; echo ;;
  ls) docker ps --filter label=agentbox=1 --format '{{.Names}}\t{{.Status}}' ;;
  down)
    if [ "${1:-}" = "--all" ]; then docker ps -aq --filter label=agentbox=1 | xargs -r docker rm -f >/dev/null; echo "all boxes removed"
    else need_box "${1:-}"; docker rm -f "agentbox-$1" >/dev/null && echo "agentbox-$1 removed"; fi ;;
  *) sed -n '2,13p' "$0" ;;
esac
```

Notes:
- `exec` runs the command with `bash -lc`, so quote it as one string when it has pipes or redirects: `agentbox exec b1 -- 'curl -s https://example.com | jq .'`.
- The command log keeps the exit code of the command inside the box, not of `tee`.
