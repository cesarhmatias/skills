# aula-interativa — interactive HTML lessons

Turns any topic into a self-contained HTML lesson with navigable slides, worked examples, meaningful interactions and deterministic animations. It asks three questions: language, what you want to learn, and depth (or an exact slide count). Known answers are reused.

## Install

With the skills CLI:

```bash
npx skills add gabrielgreco1/skills --skill aula-interativa
```

Or copy this folder into your agent's skill directory:

- Claude Code: `~/.claude/skills/aula-interativa/`
- Codex: `~/.codex/skills/aula-interativa/`

The generating agent needs browser research and Playwright with Chromium for visual verification. If Playwright is not already available, a Python setup is:

```bash
python3 -m pip install playwright
python3 -m playwright install chromium
```

Use `/aula-interativa` in Claude Code or `$aula-interativa` in Codex. You can supply the answers directly: “Teach me Airflow in Portuguese, depth 3.”

## What it creates

An HTML file you can open locally, with a chapter index, slide and scene controls, keyboard navigation, reduced motion, sources, examples and learning exercises. Depth ranges are normally 6–8, 12–16 or 20–28 slides; an explicit slide count takes precedence.

Software lessons show the path from intention to UI action and expected result, identify the documented version, and distinguish real screenshots, reconstructed interfaces and unexecuted examples. Other subjects use representations appropriate to their content.

Animations are derived from explicit state so the agent can seek to any frame and inspect transitions using Playwright. The learner controls playback. MP4 export is optional, only when requested.

## What's inside

| Path | Purpose |
|---|---|
| `SKILL.md` | Intake, teaching method, visual principles, deterministic animation and verification workflow |
| `agents/openai.yaml` | Codex display metadata |

The skill is self-contained. It adapts motion principles from this repository's `motion-designer` without requiring its video pipeline or dependencies. Playback of a completed lesson needs only a browser.
