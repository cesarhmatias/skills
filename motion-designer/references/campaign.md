# Campaign mode — one brief, one engine, many finished videos

Source: eigen (@e1genqq), "How to Build an Automated Motion Design System" (X article, 13 Oct 2026), adapted to this
skill's tools. Use it for **product videos** (Flow A) whenever the client needs more than one cut: several hooks,
several formats, several CTAs, or the next client in the same pipeline.

```
brief → campaign.json → validate → timeline (scenes read data) → stills review → render matrix → review → delivery
        Brief Compiler   Validator   Scene Engine                  Quality Controller  Variant Generator   Delivery
```
The point: the code does the repeatable production work. A copy change, a colour change or a new format is a data
change + a re-render — not a new conversation, not a redesign.

## 1. Content lives in data, motion lives in code
`source/campaign.json` says **what** the video contains; `timeline.html` decides **how** it appears. Scenes never
hard-code copy, numbers, colours or asset paths — they read `C.copy`, `C.hook`, `C.cta`, `C.src`, `C.brand`.

```json
{
 "product": "Nova", "slug": "nova-launch", "duration": 25,
 "brand": {"colors": {"bg": "#0a0a0a", "fg": "#fafafa", "muted": "#a1a1a1", "accent": "#3b82f6"},
           "fonts": [{"family": "Geist", "weights": [400, 600, 700], "src": "google"}],
           "logo": "assets/logo.png"},
 "assets": {"ui_start": "assets/start.webp", "ui_dashboard": "assets/dashboard.webp"},
 "claims": [{"id": "speed", "text": "Reports in 4 minutes", "source": "nova.com/pricing, 2026-10-20", "approved": true}],
 "copy": {"s2": "Pick a report.", "s3": "Share it with one click."},
 "hooks": [{"id": "A", "angle": "problem", "lines": ["Monday report.", "Again."]},
           {"id": "B", "angle": "result",  "lines": ["Reports in 4 minutes."], "claims": ["speed"]},
           {"id": "C", "angle": "feature", "lines": ["Your data, already a chart."]}],
 "ctas": [{"id": "A", "label": "Try Nova free", "sub": "nova.com"}, {"id": "B", "label": "Book a demo", "sub": "nova.com/demo"}],
 "formats": ["16x9", "1x1", "9x16"],
 "limits": {"hook_line": 30, "cta_label": 22, "copy": 40},
 "numbers_ok": ["26"]
}
```
- `assets` = the client's REAL screenshots/footage (captured in Step 2). No fake product UI, ever.
- `claims` = every fact with a number, its source and whether the client approved it. Hooks that use one list it.
- `numbers_ok` = numbers that aren't claims (a version, "macOS 26", a year).

## 2. Validate before rendering
`python3 $S/validate_campaign.py source/campaign.json` → exit 1 on any error, writes `source/campaign.js` on success.
It checks: files exist and open · fonts load · every hook line / CTA / copy string fits its component (char limits) ·
every number on screen is backed by an approved, sourced claim · ids unique · colours are hex. A production system
rejects bad input instead of rendering a beautiful video with a wrong number. Re-run after every brief change.

In the timeline: `<script src="campaign.js"></script>` above the main script; the template's `C` object then holds the
campaign with `C.hook` / `C.cta` picked from `?hook=` / `?cta=`.

## 3. The reference video first (what to build first)
Don't automate before one video is genuinely good. For a product, four reusable scenes cover most launches:
1. **Opening** — the hook (variant), plain words, ≤ 3.5 s.
2. **UI interaction with a cursor** — the real screenshot, camera push to the area that matters, cursor travels on a
   spring, press (scale .96 → 1), the UI reacts (highlight, state change).
3. **Feature / data visualisation** — the one mechanism or number that proves the claim, built in code (tabs with an
   edge-spring indicator, cards spawning, a chart drawing) so it re-lays out per format.
4. **Identity + CTA** (variant) — logo, name, CTA label, one line of fine print.
Get this one video right in the first format (stills → draft → final → review). Then make it configurable, then add
the second format, then the third, then the alternate hooks/CTAs. Automating a mediocre animation only gives you
more mediocre animations.

Name the seams in `MARK`: `BODY` (hook ends), `CTA` (CTA starts), optional `POSTER`. **Nothing between BODY and CTA may
read `C.hook` or `C.cta`** — that segment is rendered once and shared by every combination. Keep the hook the same
length for every variant (or pad the short ones) so the shared middle starts at the same time.

## 4. The matrix — 3 hooks × 3 formats × 2 CTAs = 18 exports
- Hooks: A problem · B the result · C a surprising feature (different openings, same story after BODY).
- Formats: 9:16 (Reels/TikTok/Shorts) · 1:1 (square feeds) · 16:9 (YouTube, X, site embeds).
- CTAs: e.g. "Try now" · "Book a demo".
- **Never crop.** Each format gets its own `LAYOUT` entry: side by side on 16:9, stacked on 9:16, fewer elements on
  tall formats. Same timings and scene data, different layout constraints — responsive design for video.

`python3 $S/render_campaign.py source/timeline.html --campaign source/campaign.json --out <root>/final --audio source/sound.wav`
(`--draft` = 30 fps half-res for direction; `--hooks/--ctas/--formats` to render a subset). It renders per format
`[0,BODY)` once per hook, `[BODY,CTA)` once, `[CTA,DUR)` once per CTA, then concatenates each combination losslessly
— 18 exports cost ~3 hooks + 1 body + 2 CTAs of render time per format. Segments are cached by content hash, so a
copy fix re-renders only the segments it touches. Per-variant audio: `source/sound_<hook>_<cta>.wav` if present.

## 5. Delivery package
```
final/
  x/ linkedin/ reels/ …           <slug>_hook-A_cta-B_<platform>_<W>x<H>.mp4
  posters/                        poster frame per format × CTA (PNG)
  review/<ar>/review_report.md    + sheets (see craft.md §9)
  manifest.json                   inputs with sha256 (campaign, timeline, every asset), template version,
                                  render settings, every output with size/duration/fps/sha256
```
The manifest is how you prove which assets went into which file and avoid shipping a video made with an outdated logo.

## 6. Keep the library, let the model configure it
For recurring clients, don't let the agent redesign established components each campaign. Keep reviewed, reusable
scene functions (title, cursor-on-UI, tab indicator, card spawn, chart, logo + CTA) and let the agent choose and
configure them from the campaign data. More predictable than inventing every visual from scratch.

## 7. Other engines (when they fit better)
- **Remotion** (React compositions, parameterised renders; `npx skills add remotion-dev/skills` for its agent skills).
  Good when the team already lives in React. Licence: free for individuals and teams up to 3; larger teams and some
  automation setups need a company licence — check before selling a render service.
- **HyperFrames** (heygen-com/hyperframes) — deterministic video from HTML/CSS with seekable animations; same idea as
  our `seek(t)` timeline.
This skill's own engine (HTML timeline + `seek(t)` + Playwright + ffmpeg) needs neither; keep one renderer per project.

## 8. Selling it (if the user asks)
Sell a finished result, not a tool: e.g. *Product Launch Motion Package* — one product, one approved narrative,
3 hooks × 3 formats × 2 CTAs, MP4s + poster frames, a fixed number of revision rounds. Price the deliverables and the
work, not the prompts. Track: time to the first approved design, time per extra variant, render/API cost, revision
requests, delivery errors, repeat clients. Rights: confirm the client owns/licenses logos, footage, fonts, music and
SFX — automation doesn't remove copyright obligations. Any revenue figure is illustrative, never a promise.
