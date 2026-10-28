# Max quality — the method behind the best video so far

Use this file when the user picks **"Máximo / Maximum"** in the quality question (SKILL.md Q1c). It describes a
*method*, not a look. The craft rules (craft.md) say what a good frame is; this file says how to get one, and how to find
the bugs yourself before the user has to.

**The bar:** a 74.5 s narrated explainer about data pipelines (9:16, 2026-10-27). The user's verdict: "esse vídeo
ficou muito foda … nível muito absurdo". Its v1 had the same topic, tools and renderer and was rejected as "motion
ridículo". The difference came from
the method, not from new tooling:

| | v1 (rejected) | v8 (the bar) |
|---|---|---|
| frame | small UI boxes on an empty beige frame, most of the frame empty | every frame a full-bleed illustration (sky, lake, soil, furniture), each scene its own colour |
| continuity | separate slides swapped in place | one world joined by one physical path; the camera travels it |
| subject | abstract labels ("Ingestão", "gráfico") | one concrete thing (pizza order #82) travels and changes state; the same numbers reach the last screen |
| props | flat icons | designed objects: glass tanks with rising liquid, a wave, a metal name plate, a glow when active |
| real material | small screenshots in a corner | real prints enter big (≈940 px) on the spoken phrase, then fly into the scene |
| structure | a stepper only | a map of the steps that comes back three times in a new state (list · night run with a failure · daylight close) |
| voice | chopped, re-spaced, sped up | one untouched take; the script rewritten until it read naturally |
| hook | a plain subtitle over the camera | an editorial caption collage + a "pull" (a folder opens into the video) |
| process | animate first, look later | every asset drawn at final quality and approved first → animation → 7 rounds of detail fixes |

The last row is the answer. The jump came from three things:
1. Every asset was drawn at final quality and the look approved before any animation code.
2. Every frame was treated as a designed illustration, not as a layout of boxes.
3. The details were fixed round after round.

The user found about 15 of those detail bugs across v2–v8. At this level **you** find them, with the loop in §6.

## 1. What "max" means in practice
- **One film, done deeply**, not N parallel versions. Explore alternatives as *directions in style frames* (§4), not as
  finished videos. If the user asked for several versions, make them at "Alto" or confirm the cost first.
- Expect hours of work, ~600 lines of scene code for 75 s, and 4–8 internal review loops before the user sees anything.
  Narration: one take (~1,300 ElevenLabs credits for 80 s), plus one regeneration if the script changes.
- Tell the user this in one line when they choose it ("Máximo: um vídeo só, feito a fundo; leva algumas horas").

## 2. Invent the world for THIS topic (never re-skin the last video)
The principles are fixed; the shapes are not. "Não é gerar igual … não é gerar 3 passos, não é os mesmos formatos de
câmera." Before drawing, answer four questions in `look.md`:
1. **The travelling subject**: one concrete thing the viewer recognises, created by a person in the first seconds. It
   changes state at every step and arrives at the end. Examples: an order, a message, a payment, a search query, a
   parcel, a drop of water, a photo being uploaded.
2. **The world it travels through**: a space native to the topic. Examples: a pipe for data, an ocean floor for a
   cable, floors of a building for a stack of layers, a city → street → building → chip zoom for scale, a road for
   logistics, the inside of a machine for a mechanism.
3. **The camera grammar**: pick it from what the story does, not by habit.

   | the story is… | camera grammar |
   |---|---|
   | a sequence of stages | track along the path (down, sideways or diagonal) |
   | a hierarchy or a stack | descend or ascend through layers |
   | "what's inside" | dolly in through scales, or orbit an exploded object |
   | a comparison | split, or side-by-side lanes with one object per lane |
   | a reveal of size or scope | pull back from a detail to the whole |

   Mix at most two grammars per film.
4. **The recurring device**: something that comes back with a new state and gives the viewer the structure. It can be
   a map of the steps, the same screen, the same object, or a counter.

**Anti-copy check:** if your four answers match the pipeline reel (pipe + stacked stations + dashed map + folder pull), you
are copying. Change at least the world and the camera grammar, unless the topic is literally that. The same goes for
the hook pull: a folder only when a folder fits the topic. Otherwise the pull comes from the topic (a cable being yanked,
a parcel opened, a phone tapped).

## 3. Script and voice first (craft.md §1b, §7), with these lessons
- The first narrated line must not repeat the hook. "Uma pipeline de dados é…" right after the on-camera question was
  cut.
- No spoken lists of three nouns ("um gráfico, um relatório ou um modelo"). The voice stumbled and added a "né?". Say
  one concrete thing and let the picture show the rest.
- Spell acronyms and loanwords the way they should sound (`É-TÊ-ÉLE`, `É-ÉLE-TÊ`, `data-lake`). A `FIX` dict maps
  them back to the real words for the captions. Test those words in a short take (~150 credits) before the full read.
- Whisper the take and diff it against the script. Any wrong word means regenerating the WHOLE script; never splice.
- Key every beat to a **word index** of the take (`V=i=>VO[i].s`). If the narration is re-recorded after the picture
  is built, add an `IDX` map from old indexes to new ones and the whole picture re-times itself. The SFX script uses
  the same map.

## 4. Assets first, animation second (two phases, one gate)
A video looks good from the first draft when it starts from an excellent design system: a great product site with
finished components and motion. Most topics have nothing like that, so at this level you build that system yourself,
completely, before a single thing moves. Flow A with a strong site: extract its real components and motion (brand.md)
and build on them. Weak site, or no site: don't settle for it; design the system here.

**Phase A: the asset library at final quality (nothing animates yet).**
- Draw every asset the film needs, in its final state, in the same SVG/HTML the scenes will use:
  - every scene background, full bleed with all its layers (§5);
  - every hero prop and every icon;
  - every UI screen, including the final one;
  - every real print, cropped, with its highlight;
  - the hook's type treatment and the pull object.
- Render them as sheets: one 1080×1920 frame per scene (`style/scenes.jpg`) and a props sheet with every prop and icon
  in 2× crops (`style/props.jpg`).
- Check every asset against §5 and the §6 items that apply to stills: fit, z-order, literalness, prop render, the
  portfolio test and prop details. Redraw until every one passes. A flat box where an object should be is a fail.
- If the direction is uncertain, draw one or two alternative worlds for the key scenes: different worlds, not
  different colours.

**The gate.** Show the scene sheet to the user with ONE question: which direction, or go/adjust. This is the single
exception to "people judge animation, not stills" (craft.md §9). A direction change after animating costs hours, and
the bar video was approved from its frames ("Gostei da direção").

**Phase B: animation only moves approved assets.**
- The approved assets become the scenes as they are. Don't redraw them from scratch.
- Never count on motion to rescue a weak asset: if something looks poor in motion, fix the asset, then re-check its
  crop.
- An asset that turns out to be missing mid-build goes through Phase A first (draw it, check its 2× crop, put it on
  the sheet), then gets animated.

## 5. Build standards (what every frame of the bar has)
- **Full bleed, layered.** Layers, back to front:
  1. a background colour per scene;
  2. far shapes (skyline, hills, water, wall);
  3. the hero;
  4. a ground strip;
  5. foreground decor in the zone under the captions.

  No frame has an empty third.
- **Illustration, not UI.** Flat vector with gradients, soft shadows and highlights, one light direction. Objects stand
  ON surfaces, windows clip what is behind them, and a prop overlaps a frame or bezel only on purpose.
- **Hero props are designed objects with material.** The medallion tanks were rejected as flat boxes ("a intenção é
  ótima, só ficou ruim a animação e o design"). They were rebuilt with a glass body, a highlight strip, metal caps, a
  liquid with a moving wave edge, a gradient name plate, and a glow on the active one. Give every hero that level.
- **Icons are drawn to be recognised at phone size.** The data-warehouse icon failed twice. Check every icon in a 2×
  crop (§6).
- **One travelling subject, consistent data.** The same ids, names and values appear in every scene; the numbers on
  the last screen are the ones built before.
- **Real material, big and timed.** A real screenshot enters at ~940 px wide on the spoken phrase, with the highlighter
  on the exact words. Then it leaves, or flies into the scene and becomes part of it (the storage-price print shrank into the
  lake's price sign).
- **Every element pops on its spoken word**: one new thing per phrase, entrances of 0.5–0.8 s, then a hold.
- **Over a busy scene**: dim everything behind it (≈80 %) and show only the card, plus one chip at most.
- **The concept is right.** Structure follows how the field explains it. ETL is the whole process, not a box in the
  map; the map was 1 Ingestão · 2 Armazenamento · 3 Transformação, with 4 Orquestração around them.
- **The opening action reads in one second.** Show the item, the price and the button, and a finger pressing it.
  "Pedir corrida" on a map was not clear; a pizza order was.
- **No literal word-labels** (craft.md §8c). Show what the thing really looks like.
- **The final screen is a real-looking product UI**: top bar, KPIs counting up, a styled chart, a status list.
- **Camera**: every move uses in-out easing, and the subject is whole at the end of the move.
  - Interpolate zoom in **log space** (`s=exp(lerp(0, log(far), p))`). A linear scale makes long pull-backs lurch.
  - For a long ride, pull back until the whole path is visible, glide, then push in. A straight scroll "bugou".
  - Keyframes are `[t0, t1, cx, cy, s]` on word times, and no two moves overlap.
- **Talking-head hook**: caption collage + pull (craft.md §8c), built with the topic's own object (§2).

## 6. The self-review loop: find the bugs yourself
Every item below is a bug the user had to point out in v2–v8. Run the whole list before every showing.

**What to render for each pass** (`render.py --test` or `--range`):
- a storyboard frame every 2 s;
- every camera move at 10 evenly spaced frames;
- every scene at the end of its hold, plus 2× crops of every icon and hero prop;
- the hook at 30 fps.

**Checklist:**
1. **Smooth motion.** Across each camera move, are the frames evenly spaced, with no jump, snap or stall? ("a
   abertura bugou")
2. **Fit.** Nothing touches what it shouldn't: boxes vs boxes, a tab glued to the first item, a tool name stuffed into
   a tab. Keep ≥ 40 px between unrelated groups and ≥ 24 px inside containers. `--sweep` must print `layout: OK`.
3. **Density.** Count the new elements per phrase; more than one is too many. No cards stacked over a scene.
4. **Z-order.** The thing being talked about is in front (the JSON file sat behind the others).
5. **Literalness.** Does anything only label what the voice says?
6. **Prop render.** Look at each 2× crop and ask whether it reads as the real thing. Redraw it if not.
7. **Portfolio test.** For each key moment, ask whether a motion designer would put it in a portfolio. If it is only
   "correct", redesign it as an object (§5).
8. **Opening clarity.** Would a stranger know in 1 s what the person did and what is at stake?
9. **Concept accuracy.** Does the structure match how an expert explains the field?
10. **Prop details.** Is the sun inside the window, the mug on the desk, every edge clean?
11. **Script.** Read the transcript aloud. Look for repeats of the hook, three-item lists, robotic phrasing, and
    mispronounced words.
12. **Edges of the film.** Is the hook cut at the first word, does the outro start on the right word ("Me segue"), and
    are there no black frames at the seams? Check the frame counts.

Write what you found in `review/review_report.md`, fix it, re-render only the affected ranges, and run the list again.
Repeat until a full pass finds nothing. Then run QC "Extreme" (craft.md §9) on the final render.

## 7. Engineering that made it possible
- **Deterministic and keyed to words**: `seek(t)` only, every time comes from `V(index)`, no CSS animations, no random.
- **Hide off-screen world elements** each frame, and restore them at the start of the next `seek`. Otherwise the sweep
  floods with false "outside safe zone" errors.
- **Cloned SVG scenes** (map vignettes) need their own def ids (`v<k>…`): gradients referenced from a hidden scene
  don't render.
- **Clip paths and global state** set by one scene must be reset when it is off. Sliced renders start mid-film, and
  a leftover `clipPath` clipped the whole world in v5.
- **Fonts** for the hook collage (Anton, Instrument Serif, Caveat): load the Google Fonts link and await it before
  `ready`.
- **Camera footage** (hook/outro as JPEG frames): clamp to the real frame count, or the render shows a black frame or
  errors on a missing file. Trim at word onsets found with RMS and confirmed with Whisper (craft.md §8b).
