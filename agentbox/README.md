# agentbox

An agent skill for running web-scraping subagents in isolated Docker sandboxes, one box per subagent, with every request and every agent step logged.

Each box has:

- **Terminal**: `curl` and `python3` (`requests`, `curl_cffi`).
- **Browser**: one persistent headless Chromium, driven by a `browser` command.
- **Listeners**: browser network events (CDP), a curl wrapper and a python hook log every request, failures included, with full bodies. They observe from the side; nothing decrypts or sits in the traffic path.
- **Proxy**: any HTTP(S) proxy provider. You configure services, prices (per request and/or per GB) and a budget per box; `proxy on` routes the whole box through it, and requests stop at the budget.
- **Logs**: request log, command log and an agent journal (PLAN / DOING / FOUND / BLOCKED with evidence), merged into one timeline so every claim can be audited.

## Install

Copy this folder into your agent's skills directory (for Claude Code: `~/.claude/skills/agentbox/`). The skill is plain Markdown; on first use the agent materializes the code from the docs into `$AGENTBOX_HOME` (default `~/.agentbox`) and builds the Docker image.

Requirements: Docker, Python 3 on the host, about 1 GB of RAM per running box.

## Configure the proxy (optional)

Create `~/.agentbox/config/proxy.json` (see `proxy/01-config.md`), or let the agent ask you for it. Without it, boxes run direct only.

## Layout

| Path | Contents |
|---|---|
| `SKILL.md` | entry point: what the orchestrator does when the skill activates |
| `docker/` | preflight checks, workspace, Dockerfile, host CLI |
| `proxy/` | provider-agnostic config, routing, budget |
| `listener/` | logging library, browser listener, curl wrapper, python hook, `reqlog` |
| `browser/` | Chromium boot and the `browser` command |
| `logs/` | log files, journal, timeline, audit |
| `subagents/` | orchestrator procedure, subagent prompt template, escalation ladder |

## Limits

- Strong JavaScript challenges and CAPTCHAs can still stop the headless browser. The skill reports them; it does not bypass them, and it never tries to get past logins.
- Spend is an estimate from your configured prices and can overshoot a little with requests in flight; set a hard limit at your provider too.
