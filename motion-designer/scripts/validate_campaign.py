"""validate_campaign.py campaign.json [--offline] — reject bad input BEFORE any render.

Checks (exit 1 on any ERROR, prints WARN for the rest):
  · schema: product, slug, brand.colors (hex), brand.fonts, hooks[], ctas[], formats[], unique ids
  · every referenced file exists and opens (brand.logo, assets.*) — paths relative to the campaign file
  · fonts load: local files exist; Google fonts answer on fonts.googleapis.com (skipped with --offline)
  · text fits its component: hook lines ≤ limits.hook_line chars, CTA labels ≤ limits.cta_label, copy ≤ limits.copy
  · claims: every number in hooks / copy / CTAs must appear in an APPROVED claim that has a source; a hook's
    `claims: [ids]` must point at approved claims. The system never invents a statistic.
On success writes campaign.js next to the json: window.CAMPAIGN = {...} with absolute file:// URLs in `src`
(the timeline can't fetch() file://, so it loads this with a <script> tag). See references/campaign.md for the schema.
"""
import json, os, re, subprocess, sys

args = [a for a in sys.argv[1:] if not a.startswith('--')]
if not args: sys.exit(__doc__)
path = os.path.abspath(args[0]); root = os.path.dirname(path); offline = '--offline' in sys.argv
c = json.load(open(path)); E, W = [], []
err, warn = E.append, W.append

for k in ('product', 'slug', 'brand', 'hooks', 'ctas', 'formats'):
    if k not in c: err(f'missing key "{k}"')
brand = c.get('brand', {})
for name, v in brand.get('colors', {}).items():
    if not re.fullmatch(r'#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?', str(v)): err(f'brand.colors.{name} = {v!r} is not a hex colour')
for f in c.get('formats', []):
    if f not in ('16x9', '1x1', '4x5', '9x16') and not re.fullmatch(r'\d{3,4}x\d{3,4}', f): err(f'unknown format {f!r}')
for kind in ('hooks', 'ctas'):
    ids = [x.get('id') for x in c.get(kind, [])]
    if len(ids) != len(set(ids)) or None in ids: err(f'{kind}: ids must be present and unique ({ids})')

# ---- files
src = {}
files = dict(c.get('assets', {}))
if brand.get('logo'): files['logo'] = brand['logo']
for key, rel in files.items():
    p = rel if os.path.isabs(rel) else os.path.join(root, rel)
    if not os.path.exists(p): err(f'asset "{key}" not found: {rel}'); continue
    if re.search(r'\.(png|jpe?g|webp|gif)$', p, re.I):
        try:
            from PIL import Image
            with Image.open(p) as im: im.verify()
        except Exception as e: err(f'asset "{key}" does not open as an image: {e}')
    src[key] = 'file://' + os.path.abspath(p)

# ---- fonts
for f in brand.get('fonts', []):
    fam, s = f.get('family'), f.get('src', 'google')
    if s == 'google':
        if offline: warn(f'font {fam}: not checked (--offline)'); continue
        url = 'https://fonts.googleapis.com/css2?family=' + fam.replace(' ', '+') + ':wght@' + ';'.join(map(str, sorted(f.get('weights', [400]))))
        r = subprocess.run(['curl', '-sfL', '-o', '/dev/null', '-w', '%{http_code}', '-A', 'Mozilla/5.0', '--max-time', '10', url],
                           capture_output=True, text=True)   # curl: system CA store (python.org builds often lack one)
        if r.stdout.strip() != '200': err(f'font {fam} does not load from Google Fonts (HTTP {r.stdout.strip() or "none"}) — check the family/weights or ship the files locally')
    elif not os.path.exists(s if os.path.isabs(s) else os.path.join(root, s)): err(f'font {fam}: file not found {s}')

# ---- lengths
lim = {'hook_line': 30, 'cta_label': 22, 'copy': 40, **c.get('limits', {})}
for h in c.get('hooks', []):
    for ln in h.get('lines', []):
        if len(ln) > lim['hook_line']: err(f'hook {h["id"]}: line too long for its component ({len(ln)} > {lim["hook_line"]}): "{ln}"')
for t in c.get('ctas', []):
    if len(t.get('label', '')) > lim['cta_label']: err(f'cta {t["id"]}: label too long ({len(t["label"])} > {lim["cta_label"]}): "{t["label"]}"')
def strings(o):
    if isinstance(o, str): yield o
    elif isinstance(o, list):
        for x in o: yield from strings(x)
    elif isinstance(o, dict):
        for x in o.values(): yield from strings(x)
for key, v in c.get('copy', {}).items():
    for s in strings(v):
        if len(s) > lim['copy']: err(f'copy.{key} too long ({len(s)} > {lim["copy"]}): "{s}"')

# ---- claims: numbers only from approved, sourced claims
claims = {x['id']: x for x in c.get('claims', []) if 'id' in x}
ok_claims = [x for x in claims.values() if x.get('approved') and x.get('source')]
for x in claims.values():
    if not x.get('source'): err(f'claim {x["id"]} has no source')
    if not x.get('approved'): warn(f'claim {x["id"]} is not approved by the client — it may not appear in the video')
NUM = re.compile(r'(?<![\w/.])\d[\d.,]*(?:%|[x×])?(?![\w/])')   # standalone numbers only (not the 1 in a URL or v2)
approved_nums = {n for x in ok_claims for n in NUM.findall(x.get('text', ''))}
on_screen = [('hook ' + h['id'], s) for h in c.get('hooks', []) for s in strings(h.get('lines', []))]
on_screen += [('cta ' + t['id'], s) for t in c.get('ctas', []) for s in strings({k: v for k, v in t.items() if k != 'id'})]
on_screen += [('copy.' + k, s) for k, v in c.get('copy', {}).items() for s in strings(v)]
for where, s in on_screen:
    for n in NUM.findall(s):
        if n.rstrip('.,') not in {a.rstrip('.,') for a in approved_nums} and n not in c.get('numbers_ok', []):
            err(f'{where}: "{n}" in "{s}" is not backed by an approved, sourced claim (add it to claims[] or to numbers_ok for non-claims like "macOS 26")')
for h in c.get('hooks', []):
    for cid in h.get('claims', []):
        if cid not in claims or claims[cid] not in ok_claims: err(f'hook {h["id"]}: claim "{cid}" missing or not approved')

for w in W: print('WARN ', w)
for e in E: print('ERROR', e)
if E: print(f'\n✗ {len(E)} error(s) — fix the campaign before rendering'); sys.exit(1)
c['src'] = src
out = os.path.join(root, 'campaign.js')
open(out, 'w').write('window.CAMPAIGN = ' + json.dumps(c, ensure_ascii=False, indent=1) + ';\n')
print(f'✓ campaign OK — {len(c["hooks"])} hooks × {len(c["formats"])} formats × {len(c["ctas"])} CTAs = '
      f'{len(c["hooks"]) * len(c["formats"]) * len(c["ctas"])} exports  → {out}')
