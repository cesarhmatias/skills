# Orchestrator procedure

You split the job, give each subagent a box and a complete brief, let them work in parallel, then audit what they bring back.

## 1. Plan the split

- One subagent per independent target (one site, one portal, one data source, one part of an application). Two subagents never share a box or a target.
- Name each box with a short slug: `a-z`, `0-9`, `-` (for example `site-a`, `search-api`, `city-12`).
- Cap the number of boxes running at once by the host's memory (`docker/01-preflight.md`). Run the rest in waves.
- Decide the budget per box. The default comes from `proxy.json`; give a bigger one to a target you already know is hard: `AGENTBOX_BUDGET_USD=2 agentbox up hard-target`.

## 2. Start the boxes

```bash
A="$AGENTBOX_HOME/bin/agentbox"     # use the expanded absolute path in briefs
$A up site-a
$A up site-b
```

`up` returns once the browser and the listener are recording.

## 3. Brief each subagent

Fill in `subagents/subagent-prompt.md` for each one:

| Placeholder | What to put |
|---|---|
| `{{AGENTBOX}}` | absolute path of the CLI, e.g. `/home/user/.agentbox/bin/agentbox` |
| `{{BOX}}` | the box name |
| `{{TASK}}` | the target, the data wanted, the volume, the deliverable (crawler, sample, endpoint map, yes/no answer) |
| `{{CONTEXT}}` | everything you already know: URLs, platform or vendor if known, earlier findings, known blocks, login walls, rate limits |
| `{{PROXY_TABLE}}` | the cost table from `proxy/01-config.md` (`proxy list` output), never credentials |
| `{{OUTPUT_SPEC}}` | the exact fields of `result.json` |

A brief that leaves the subagent guessing costs more than a longer brief. Put in it everything a scraping intake would ask: URL, data wanted, volume, known auth or blocks, output format.

If a scraping know-how skill is installed (for example one that covers TLS impersonation, anti-bot vendors and site patterns), tell the subagent to load it and to skip its interactive intake, because the brief is the intake and the box's `proxy on` is the only proxy it may use.

## 4. Spawn

Spawn all subagents of a wave in one message, in the background, so they run in parallel. Each runs on the host with its normal tools and sends every web action through `agentbox exec <box> -- ...`. No credentials of your agent runtime are needed inside the boxes.

## 5. Watch the budget

While they run, `agentbox spend <box>` shows each box's estimated spend. A box that burns its budget early is usually looping; check its timeline.

## 6. Audit

When a subagent finishes, follow "Audit" in `logs/logs.md`: collect the transcript, build the timeline, check each claim against the cited request ids, and check every "blocked" claim against the escalation ladder. Rerun a missing rung yourself in the same box before accepting the claim.

## 7. Report and tear down

- Report what was verified, what was not, and the proxy spend per box and per service.
- `agentbox down --all`. Runs stay in `$AGENTBOX_HOME/runs/` for later review; a new `up` with the same name archives the old run instead of deleting it.
