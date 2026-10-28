"""render_campaign.py — one timeline → the whole campaign matrix (hooks × formats × CTAs), re-rendering only what changes.

  python3 render_campaign.py source/timeline.html --campaign source/campaign.json --out <root>/final \
      [--audio source/sound.wav] [--hooks A,B] [--ctas A] [--formats 16x9,9x16] [--draft]

The timeline must set MARK.BODY (hook ends, shared middle starts) and MARK.CTA (shared middle ends, CTA starts).
Per format the video is cut into three segments and each is rendered ONCE:
    [0, BODY) per hook   ·   [BODY, CTA) shared   ·   [CTA, DUR) per CTA
then every combination is a lossless concat + audio mux. Segments are cached in <out>/_cache keyed by a hash of the
timeline, campaign.js, the variant and the render settings — after a copy fix only the touched segments re-render.
Audio: source/sound_<hook>_<cta>.wav if it exists, else --audio (or a silent track).
Also writes a poster frame per format × CTA and <out>/manifest.json (inputs + hashes, template version, settings,
every output with size/duration/sha256). Final = 240 fps → tmix → 60 fps; --draft = 30 fps half-res for direction.
Without BODY/CTA marks every combination is rendered in full (slower, same result).
"""
import argparse, asyncio, hashlib, json, os, shutil, subprocess, sys, time

HERE = os.path.dirname(os.path.abspath(__file__))
SIZES = {'16x9': (1920, 1080), '1x1': (1080, 1080), '4x5': (1080, 1350), '9x16': (1080, 1920)}
PLATFORM = {'16x9': 'x', '1x1': 'linkedin', '4x5': 'instagram', '9x16': 'reels'}
ap = argparse.ArgumentParser()
ap.add_argument('html'); ap.add_argument('--campaign', required=True); ap.add_argument('--out', required=True)
ap.add_argument('--audio'); ap.add_argument('--hooks'); ap.add_argument('--ctas'); ap.add_argument('--formats')
ap.add_argument('--draft', action='store_true'); ap.add_argument('--workers', type=int, default=3)
a = ap.parse_args(); a.out = os.path.abspath(a.out); a.html = os.path.abspath(a.html)
camp = json.load(open(a.campaign)); src = os.path.dirname(os.path.abspath(a.html))
hooks = a.hooks.split(',') if a.hooks else [h['id'] for h in camp['hooks']]
ctas = a.ctas.split(',') if a.ctas else [t['id'] for t in camp['ctas']]
fmts = a.formats.split(',') if a.formats else camp['formats']
FPS, SCALE = (30, .5) if a.draft else (240, 1.0)
STEP = FPS // 60 if FPS >= 120 else 1          # frames per output frame: segment cuts land on whole output frames
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest() if p and os.path.exists(p) else None
cjs = os.path.join(src, 'campaign.js')
if not os.path.exists(cjs): sys.exit('campaign.js missing — run validate_campaign.py first')
base_key = (sha(a.html) or '') + (sha(cjs) or '') + f'{FPS}{SCALE}'
cache = os.path.join(a.out, '_cache'); os.makedirs(cache, exist_ok=True)


def marks(ar, params):
    from playwright.async_api import async_playwright
    async def m():
        async with async_playwright() as p:
            b = await p.chromium.launch(args=['--allow-file-access-from-files'])
            pg = await b.new_page(); await pg.goto('file://' + os.path.abspath(a.html) + f'?ar={ar}&{params}')
            await pg.wait_for_function('window.ready===true', timeout=300000)
            r = await pg.evaluate('({...(window.MARK||{}), DUR: window.DUR})'); await b.close(); return r
    return asyncio.run(m())


def segment(ar, params, f0, f1, tag):
    """render frames [f0, f1) at FPS for this variant → cached mp4 (60 fps final / 30 fps draft)."""
    key = hashlib.sha256(f'{base_key}{ar}{params}{f0}{f1}'.encode()).hexdigest()[:16]
    out = os.path.join(cache, f'{ar}_{tag}_{key}.mp4')
    if os.path.exists(out): print(f'  cached  {ar} {tag}'); return out
    fr = os.path.join(cache, f'_frames_{key}'); shutil.rmtree(fr, ignore_errors=True)
    t0 = time.time()
    subprocess.run(['nice', '-n', '15', sys.executable, f'{HERE}/render.py', a.html, '--ar', ar, '--fps', str(FPS),
                    '--scale', str(SCALE), '--workers', str(a.workers), '--params', params,
                    '--range', f'{(f0 + .25) / FPS},{(f1 - .75) / FPS}', '--out', fr], check=True, stdout=subprocess.DEVNULL)
    vf = f"tmix=frames={STEP}:weights='{' '.join(['1'] * STEP)}',fps=60,format=yuv420p" if STEP > 1 else 'format=yuv420p'
    subprocess.run(['nice', '-n', '15', 'ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(FPS), '-start_number', str(f0),
                    '-i', f'{fr}/%05d.jpg', '-vf', vf, '-c:v', 'libx264', '-preset', 'slow' if STEP > 1 else 'veryfast',
                    '-crf', '16', '-profile:v', 'high', out], check=True)
    shutil.rmtree(fr); print(f'  render  {ar} {tag}  {f1 - f0} frames  {time.time() - t0:.0f}s'); return out


def probe(p):
    r = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration:stream=width,height,r_frame_rate',
                                   '-of', 'json', p], capture_output=True, text=True).stdout)
    v = next(s for s in r['streams'] if 'width' in s)
    return {'duration': round(float(r['format']['duration']), 3), 'size': f'{v["width"]}x{v["height"]}', 'fps': v['r_frame_rate']}


outputs, posters = [], []
for ar in fmts:
    W, H = SIZES[ar] if ar in SIZES else map(int, ar.split('x'))
    M = marks(ar, f'hook={hooks[0]}&cta={ctas[0]}'); dur = M['DUR']; N = round(dur * FPS)
    q = lambda t: min(N, round(t * FPS / STEP) * STEP)          # snap a cut to a whole output frame
    split = 'BODY' in M and 'CTA' in M
    print(f'{ar}: DUR {dur}s, {"3-segment cache" if split else "full renders"}')
    if split:
        body = segment(ar, f'hook={hooks[0]}&cta={ctas[0]}', q(M['BODY']), q(M['CTA']), 'body')
        hk = {h: segment(ar, f'hook={h}&cta={ctas[0]}', 0, q(M['BODY']), f'hook-{h}') for h in hooks}
        ct = {c: segment(ar, f'hook={hooks[0]}&cta={c}', q(M['CTA']), N, f'cta-{c}') for c in ctas}
    for c in ctas:   # poster frame = the CTA screen settled (MARK.POSTER if the timeline names one)
        pt = M.get('POSTER', min(dur - .2, M.get('CTA', dur - 1.5) + 1.2))
        pdir = os.path.join(cache, f'_poster_{ar}_{c}')
        subprocess.run([sys.executable, f'{HERE}/render.py', a.html, '--ar', ar, '--params', f'hook={hooks[0]}&cta={c}',
                        '--test', f'{pt:.2f}', '--out', pdir], check=True, stdout=subprocess.DEVNULL)
        pp = os.path.join(a.out, 'posters', f'{camp["slug"]}_cta-{c}_{PLATFORM.get(ar, ar)}_{W}x{H}.png'); os.makedirs(os.path.dirname(pp), exist_ok=True)
        shutil.move(next(os.path.join(pdir, f) for f in os.listdir(pdir) if f.startswith('t')), pp); shutil.rmtree(pdir); posters.append(pp)
    for h in hooks:
        for c in ctas:
            parts = [hk[h], body, ct[c]] if split else [segment(ar, f'hook={h}&cta={c}', 0, N, f'full-{h}-{c}')]
            name = f'{camp["slug"]}_hook-{h}_cta-{c}_{PLATFORM.get(ar, ar)}_{W}x{H}{"_draft" if a.draft else ""}.mp4'
            dst = os.path.join(a.out, f'{PLATFORM.get(ar, ar)}', name); os.makedirs(os.path.dirname(dst), exist_ok=True)
            lst = os.path.join(cache, '_list.txt'); open(lst, 'w').write(''.join(f"file '{p}'\n" for p in parts))
            vid = os.path.join(cache, '_concat.mp4')
            subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', vid], check=True)
            wav = os.path.join(src, f'sound_{h}_{c}.wav')
            wav = wav if os.path.exists(wav) else a.audio
            if wav:
                subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', vid, '-i', wav, '-map', '0:v', '-map', '1:a', '-c:v', 'copy',
                                '-af', 'loudnorm=I=-14.5:TP=-1.0:LRA=11', '-c:a', 'aac', '-b:a', '320k', '-ar', '48000',
                                '-shortest', '-movflags', '+faststart', dst], check=True)
            else: shutil.move(vid, dst)
            outputs.append({'file': os.path.relpath(dst, a.out), 'hook': h, 'cta': c, 'format': ar, 'audio': wav and os.path.relpath(wav, src),
                            **probe(dst), 'sha256': sha(dst)})
            print(f'  ✓ {name}')

skill_files = [os.path.join(HERE, '..', 'templates', 'timeline.html'), __file__, os.path.join(HERE, 'render.py')]
manifest = {
    'campaign': camp['slug'], 'product': camp.get('product'), 'created': time.strftime('%Y-%m-%dT%H:%M:%S'),
    'inputs': {'timeline': {'path': a.html, 'sha256': sha(a.html)}, 'campaign_json': {'path': a.campaign, 'sha256': sha(a.campaign)},
               'assets': {k: {'path': v, 'sha256': sha(v.replace('file://', ''))} for k, v in json.loads(open(cjs).read().split('=', 1)[1].rstrip().rstrip(';')).get('src', {}).items()}},
    'template_version': hashlib.sha256(b''.join(open(p, 'rb').read() for p in skill_files)).hexdigest()[:12],
    'render': {'fps_capture': FPS, 'fps_out': 60 if STEP > 1 else FPS, 'scale': SCALE, 'draft': a.draft, 'loudness': '-14.5 LUFS / TP -1'},
    'matrix': {'hooks': hooks, 'ctas': ctas, 'formats': fmts, 'exports': len(outputs)},
    'outputs': outputs, 'posters': [os.path.relpath(p, a.out) for p in posters],
}
json.dump(manifest, open(os.path.join(a.out, 'manifest.json'), 'w'), indent=1, ensure_ascii=False)
print(f'\n{len(outputs)} exports + {len(posters)} posters → {a.out}  (manifest.json)')
