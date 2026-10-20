# aula-interativa — guided interactive lessons with a motion and review toolkit

Creates a self-contained HTML lesson on any subject. The intake asks only for language, topic and depth (or a screen count). Behind that intake, the skill researches, writes a narration/visual script, builds short screens (opening, realistic mock, explanation, animated diagram, practice, summary), animates mechanisms, tests interactions and reviews captured frames.

The learner sees one idea per screen, one sentence per step and one primary action (**Continuar →**). Sources live in a drawer, never on the slide.

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
| `references/00-experiencia-do-aluno.md` | How people learn on a screen: navigation contract, text budget, screen kinds, composition, motion feel, review checklist |
| `references/10-arco-da-aula.md` | The 7 decisions and 8 movements of an impeccable lesson, with instances across domains |
| `references/11-escrita.md` | Titles, step sentences, labels, terms and feedback, with good/bad pairs |
| `references/12-qualidade-e-portoes.md` | 1–5 rubric, gates P1–P5, typical model failures and countermeasures |
| `templates/brief.md`, `templates/roteiro.md` | Structures to fill before any code |
| `examples/exemplar-dns/` | A complete lesson with its brief, script and sources: study the process |
| `references/01-didatica.md` | Objectives, prerequisite structure, worked examples and transfer |
| `references/02-fontes-e-interfaces.md` | Primary sources, versions, screenshots and UI operations |
| `references/03-roteiro-de-cenas.md` | Narration · visual · kind script, scene specifications, steps |
| `references/04-direcao-visual.md` | Stage, tokens, kit blocks, geometry, composition |
| `references/05-motion.md` | Timing, easing, identity, event boundaries and deterministic rendering |
| `references/06-receitas-motion.md` | Twelve recipes, including paths, quantity transfer, structure expansion, zoom, terminal/app mocks and a following camera |
| `references/07-runtime-html.md` | Guided player, kit and capture API, offline packaging |
| `references/08-captura-e-revisao.md` | Frame capture, storyboard, contact sheets, inspection, provenance and repair |
| `references/09-criterios-e-falhas.md` | Observable acceptance criteria and concrete failure cases |
| `templates/` | Guided player, scene kit (`kit.js`), motion helpers and themeable CSS |
| `examples/mecanismo.html` | Reference lesson using all six screen kinds |
| `scripts/` | Environment check, frame capture, storyboard, contact sheets, audit, packaging, printable PDF handout (`pdf.mjs`), walkthrough video (`video.mjs`, needs ffmpeg) and regression tests |
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

Run from this skill's folder (`work/` is git-ignored; lessons themselves are produced in their own folder outside the skill):

```bash
node scripts/pack.mjs examples/mecanismo.html --out work/example.html
node scripts/test_player.mjs work/example.html --channel chrome
node scripts/capture.mjs work/example.html --out work/qa --mode motion --fps 30 --scenarios default --channel chrome
node scripts/storyboard.mjs work/qa/manifest.json
node scripts/pdf.mjs work/example.html --out work/example.pdf --channel chrome
node scripts/contact_sheet.mjs work/qa/manifest.json
node scripts/test_tools.mjs work/example.html --capture work/qa/manifest.json --channel chrome
node scripts/audit.mjs work/example.html --capture work/qa/manifest.json --out work/audit.json --channel chrome
```

Contact sheets are cropped to the scene by default (`--crop page` keeps the whole page). Capture also reports clipped SVG text, rendered text below 11 px (`--min-font`) and a step control below the fold on desktop viewports.

Inspect the generated sheets and full-size frames. Record concrete findings in `work/qa/review.json`; do not mark a group as passed without inspecting it. Re-run the audit with `--require-visual` when that review has been completed.

An automated pass does not imply visual approval. Reports distinguish `needs-visual-review` from `ready-with-recorded-review` and verify that the evidence matches the captured artifact. The included tests verify the reference example and base player, not every future lesson.

## Relationship to motion-designer

This skill adapts the deterministic timeline, composed-frame workflow and frame inspection principles of [`motion-designer`](../motion-designer). It has its own instructional pacing, navigation and tooling. It does not require the social-video pipeline, narration or MP4 export. Video is optional when explicitly requested.
