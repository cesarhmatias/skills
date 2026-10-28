"""review_frames.py — staged frame review + a review report to fill in (craft.md §9). Nothing ships without it.

  python3 review_frames.py source/timeline.html --ar 9x16 [--params 'hook=A&cta=B'] [--mp4 final.mp4] --out review_9x16

Writes into --out:
  storyboard/sheet.png   pass 1 — 12 frames spread over the timeline: does the sequence tell ONE story?
  transitions/sheet.png  pass 2 — every MARK at −0.12 s / +0.06 s / +0.30 s (before · during · after): overlapping text,
                         abrupt jumps, elements vanishing. Regular intervals miss what breaks BETWEEN them.
  phone_sheet.png        pass 3 — the storyboard at real phone size (≈390 px wide, as people actually watch): can you
                         still read every word? If not, it's too small or too much.
  contact_mp4.png        pass 5 — (with --mp4) 1 frame/s of the ENCODED file, tiled — what the viewer gets
  review_report.md       timestamps inspected, layout-check output, and the sections you must fill: issues found,
                         fixes applied, remaining concerns, human approval (pass 4 brand/facts checklist included)
Then READ every sheet image yourself. "Looks great" without having opened the rendered frames is not a review.
"""
import argparse, asyncio, glob, os, subprocess, sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ap = argparse.ArgumentParser()
ap.add_argument('html'); ap.add_argument('--ar', default='16x9'); ap.add_argument('--params', default='')
ap.add_argument('--mp4'); ap.add_argument('--out', required=True); ap.add_argument('--phone', type=int, default=390)
a = ap.parse_args(); os.makedirs(a.out, exist_ok=True)


def marks():
    from playwright.async_api import async_playwright
    async def m():
        async with async_playwright() as p:
            b = await p.chromium.launch(args=['--allow-file-access-from-files'])
            pg = await b.new_page(); await pg.goto('file://' + os.path.abspath(a.html) + f'?ar={a.ar}' + (f'&{a.params}' if a.params else ''))
            await pg.wait_for_function('window.ready===true', timeout=300000)
            r = await pg.evaluate('({...(window.MARK||{}), DUR: window.DUR})'); await b.close(); return r
    return asyncio.run(m())


def stills(times, sub):
    d = os.path.join(a.out, sub)
    r = subprocess.run([sys.executable, f'{HERE}/render.py', a.html, '--ar', a.ar, '--params', a.params,
                        '--test', ','.join(f'{t:.2f}' for t in times), '--out', d], capture_output=True, text=True)
    return d, (r.stdout + r.stderr).strip()


M = marks(); dur = M.pop('DUR')
story = [round(dur * (i + .5) / 12, 2) for i in range(12)]
cuts = sorted({v for k, v in M.items() if isinstance(v, (int, float)) and .15 < v < dur - .1})
trans = sorted({round(t, 2) for m in cuts for t in (m - .12, m + .06, m + .30) if 0 <= t < dur})
sd, slog = stills(story, 'storyboard')
td, tlog = stills(trans, 'transitions')

# phone-size sheet: frames shown at the width a phone gives them (no upscaling) — judge legibility here
fs = sorted(glob.glob(f'{sd}/t*.png')); im0 = Image.open(fs[0]); w = a.phone; h = round(w * im0.height / im0.width)
cols = 6 if h <= w else 4; rows = (len(fs) + cols - 1) // cols
sheet = Image.new('RGB', (cols * (w + 12) + 12, rows * (h + 12) + 12), (40, 40, 40))
for i, f in enumerate(fs):
    sheet.paste(Image.open(f).convert('RGB').resize((w, h), Image.LANCZOS), (12 + (i % cols) * (w + 12), 12 + (i // cols) * (h + 12)))
sheet.save(os.path.join(a.out, 'phone_sheet.png'))

if a.mp4:
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', a.mp4, '-vf',
                    f"fps=1,scale={480 if h <= w else 270}:-1,tile={6 if h <= w else 8}x{max(1, int(dur) // (6 if h <= w else 8) + 1)}",
                    '-frames:v', '1', os.path.join(a.out, 'contact_mp4.png')], check=True)
    probe = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration:stream=codec_type,width,height,r_frame_rate',
                            '-of', 'compact', a.mp4], capture_output=True, text=True).stdout.strip()
else: probe = '(no --mp4 given — run again on the encoded file before delivery)'

rep = f"""# Review — {os.path.basename(a.html)} · {a.ar} {a.params}

Inspected: storyboard {', '.join(map(str, story))} s · transitions {', '.join(map(str, trans))} s
Marks: {', '.join(f'{k} {v}' for k, v in M.items())} · DUR {dur}

## Automatic checks
storyboard: {slog.splitlines()[-2] if slog else ''}
transitions:
```
{tlog}
```
encoded file: `{probe}`

## Passes (tick only after opening the sheet)
- [ ] 1 storyboard — `storyboard/sheet.png`: one clear story, hook in frame 0, CTA lands
- [ ] 2 timing — `transitions/sheet.png`: no overlapping labels, no jumps, nothing vanishes mid-move
- [ ] 3 phone size — `phone_sheet.png`: every word readable at {a.phone} px wide
- [ ] 4 brand + facts — exact logo, font, colours, real screenshots only, every number from an approved claim
- [ ] 5 encoded file + audio — `contact_mp4.png`, duration/size/fps above, SFX on their events, loudness

## Issues found
-
## Fixes applied
-
## Remaining concerns
-
## Human approval
- [ ] approved by ______ on ______ (nothing is delivered before this box is ticked)
"""
open(os.path.join(a.out, 'review_report.md'), 'w').write(rep)
print(rep.split('## Passes')[0]); print(f'→ {a.out}/  (read every sheet, then fill review_report.md)')
