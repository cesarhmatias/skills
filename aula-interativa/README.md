# aula-interativa — interactive lessons with a motion and review toolkit

Creates a self-contained HTML lesson on any subject. The intake asks only for language, topic and depth (or a slide count). Behind that intake, the skill researches, plans learning objectives, writes scene states, designs the frames, animates mechanisms, tests interactions and reviews captured frames.

The teaching guides are written in Portuguese. The generated lesson follows the language selected by the learner.

## Install

```bash
npx skills add gabrielgreco1/skills --skill aula-interativa
```

Or copy this entire folder to `~/.claude/skills/aula-interativa/` or `~/.codex/skills/aula-interativa/`. Keep its references, templates, scripts and example together.

Use `/aula-interativa` in Claude Code or `$aula-interativa` in Codex. Supply known answers directly if desired: “Airflow, Portuguese, depth 3.”

## What is included

| Path | Purpose |
|---|---|
| `SKILL.md` | Intake, required reading order, production workflow and completion conditions |
| `references/01-didatica.md` | Objectives, prerequisite structure, worked examples and transfer |
| `references/02-fontes-e-interfaces.md` | Primary sources, versions, screenshots and UI operations |
| `references/03-roteiro-de-cenas.md` | Scene specifications, beats, state transitions and variations |
| `references/04-direcao-visual.md` | Composition, readable geometry, type and responsive scenes |
| `references/05-motion.md` | Timing, easing, identity, event boundaries and deterministic rendering |
| `references/06-receitas-motion.md` | Ten recipes, including paths, quantity transfer, dependency state, structure expansion, UI cursor, zoom and code synchronization |
| `references/07-runtime-html.md` | Player API, implementation and offline packaging |
| `references/08-captura-e-revisao.md` | Frame capture, contact sheets, inspection, provenance and repair |
| `references/09-criterios-e-falhas.md` | Observable acceptance criteria and concrete failure cases |
| `templates/` | Functional player, motion helpers and adaptable CSS |
| `examples/mecanismo.html` | Executable example with a parameterized mechanism and explanatory feedback |
| `scripts/` | Environment check, frame capture, sheets, audit, packaging and regression tests |
| `agents/openai.yaml` | Codex display metadata |

## Production tools

The authoring agent needs Node.js, Playwright, a usable Chromium browser and Sharp. Reuse an existing runtime when available. If libraries live outside this folder, set `LESSON_NODE_MODULES` to their `node_modules` directory. The learner only needs a browser to open the finished HTML.

For an isolated tooling directory, from this folder:

```bash
npm install --prefix work/tooling playwright sharp
export LESSON_NODE_MODULES="$PWD/work/tooling/node_modules"
node scripts/check_env.mjs --channel chrome
```

`--channel chrome` uses an installed Chrome. Omit it to use Playwright's Chromium after installing that browser with the Playwright CLI in your tooling environment.

## Verify the included example

Run from this skill's folder:

```bash
node scripts/pack.mjs examples/mecanismo.html --out work/example.html
node scripts/test_player.mjs work/example.html --channel chrome
node scripts/capture.mjs work/example.html --out work/qa --mode motion --fps 30 --scenarios default --channel chrome
node scripts/contact_sheet.mjs work/qa/manifest.json
node scripts/test_tools.mjs work/example.html --capture work/qa/manifest.json --channel chrome
node scripts/audit.mjs work/example.html --capture work/qa/manifest.json --out work/audit.json --channel chrome
```

Inspect the generated sheets and full-size frames. Record concrete findings in `work/qa/review.json`; do not mark a group as passed without inspecting it. Re-run the audit with `--require-visual` when that review has been completed.

An automated pass does not imply visual approval. Reports distinguish `needs-visual-review` from `ready-with-recorded-review` and verify that the evidence matches the captured artifact. The included tests verify the reference example and base player, not every future lesson.

## Relationship to motion-designer

This skill adapts the deterministic timeline, composed-frame workflow and frame inspection principles of [`motion-designer`](../motion-designer). It has its own instructional pacing, navigation and tooling. It does not require the social-video pipeline, narration or MP4 export. Video is optional when explicitly requested.
