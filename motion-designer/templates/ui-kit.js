// ui-kit.js — the product-UI world (max-quality.md §2b, craft.md §8d). Approved on the algorithm reel, 2026-10-28.
// Include AFTER the core of timeline.html (it uses its globals: div, E, seg, clamp, lerp, hash, SB, ZONES, W, H).
//   <script src="…/templates/ui-kit.js"></script>
// Everything is a pure function of t: call the *Seek helpers from seek(t). No CSS animations, no state across frames.
//
// What's here
//   timing      pop(el,t,tin,tout,{dy,s0,din})  vo(el,o)  kv(t,keys,ease)  hlB(h,t,tin,tout)  hlSweep(printEl,t,times)
//   world       studio(sc,{base,blobs,glyphs,ink}) → {bg,drift(t)}   cshadow(p,cx,y,w)
//   objects     phoneEl(p,innerHtml,s,x,y)  statusBar(dark)  printCard(spec)  printEl(p,spec,x,y)  reportCard(p,x,y,rows)
//   structure   stepperEl(p,items)  stepperSeek(st,t,active,times,collapseAt)
//   captions    outlinedCaptions(parent,WORDS,opts) — Captions() restyled: white, black stroke, no plate, min hold
//   brand       appIcon(n,size)  logo(n,size,fill)  LOGO (Simple Icons paths: ig, x, li, tt, gh, yt, wa)
// Numbers you put on screen must come from an approved source (craft.md §4); the kit draws, it does not invent data.

let __uk = 0; const uid = () => 'uk' + (++__uk);
const el = (p, css, html) => div(p, 'el', css, html);

// ---------------------------------------------------------------- timing
// entrance (0.55 s, soft overshoot, 36 px rise) + exit (0.3 s); sets visibility too so hidden text is really hidden
function pop(e, t, tin, tout = 1e9, {dy = 36, s0 = .94, din = .55} = {}) {
  const p = E.oB(seg(t, tin, tin + din), 1.2), q = E.i3(seg(t, tout, tout + .3)), o = clamp(p * 2.2) * (1 - q);
  e.style.opacity = o; e.style.visibility = o <= .002 ? 'hidden' : 'visible';
  e.style.transform = `translateY(${(1 - p) * dy - q * 18}px) scale(${lerp(s0, 1, p) * (1 - q * .03)})`; return o; }
// opacity + visibility together: the layout check (and the eye) ignores opacity:0 on an ancestor
const vo = (e, o) => { e.style.opacity = o; e.style.visibility = o <= .01 ? 'hidden' : 'visible'; };
// eased piecewise-linear value through [[t,v],…] — counters, bars, progress that must land on a word
const kv = (t, keys, ease = E.io3) => { if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t < keys[i][0]) return lerp(keys[i - 1][1], keys[i][1], ease(seg(t, keys[i - 1][0], keys[i][0])));
  return keys[keys.length - 1][1]; };
// headline words fade + rise 18 px (never slide out of the line box: that crossed the hero for half a second)
function hlB(h, t, tin, tout = 1e9, st = .05) {
  h._w.forEach((w, k) => { const p = E.o5(seg(t, tin + k * st, tin + k * st + .5)), q = E.i3(seg(t, tout + k * .02, tout + k * .02 + .3));
    w.style.opacity = p * (1 - q); w.style.transform = `translateY(${(1 - p) * 18 + q * 10}px)`; });
  h.style.visibility = (t >= tin - .01 && t < tout + h._w.length * .02 + .35) ? 'visible' : 'hidden'; }

// ---------------------------------------------------------------- brand marks (Simple Icons, CC0; the marks belong to their owners)
const LOGO = {
  ig: 'M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z',
  x: 'M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z',
  li: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z',
  tt: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z',
  gh: 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12',
  yt: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
  wa: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z',
};
const BRAND = {ig: '#D62976', x: '#0F1419', li: '#0A66C2', tt: '#111111', gh: '#181717', yt: '#FF0000', wa: '#25D366'};
const logo = (n, size, fill) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><path d="${LOGO[n]}" fill="${fill || BRAND[n]}"/></svg>`;
// rounded app tile with the real colours (Instagram gradient, TikTok cyan/red offsets)
function appIcon(n, size = 180) {
  const k = uid(), r = size * .23;
  const bg = {ig: `url(#${k}g)`, x: '#0B0B0B', li: '#0A66C2', tt: '#0B0B0B', gh: '#181717', yt: '#FF0000', wa: '#25D366'}[n];
  const mark = n === 'tt'
    ? `<g transform="translate(${size * .2},${size * .2}) scale(${size * .6 / 24})"><path d="${LOGO.tt}" fill="#25F4EE" transform="translate(-.7,-.5)"/><path d="${LOGO.tt}" fill="#FE2C55" transform="translate(.7,.5)"/><path d="${LOGO.tt}" fill="#fff"/></g>`
    : `<g transform="translate(${size * .2},${size * .2}) scale(${size * .6 / 24})"><path d="${LOGO[n]}" fill="#fff"/></g>`;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="overflow:visible">
   <defs><radialGradient id="${k}g" cx="30%" cy="107%" r="150%"><stop offset="0" stop-color="#fdf497"/><stop offset=".05" stop-color="#fdf497"/><stop offset=".45" stop-color="#fd5949"/><stop offset=".6" stop-color="#d6249f"/><stop offset=".9" stop-color="#285AEB"/></radialGradient>
   <linearGradient id="${k}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient>
   <filter id="${k}d" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="${size * .06}" stdDeviation="${size * .07}" flood-color="#000" flood-opacity=".22"/></filter></defs>
   <rect width="${size}" height="${size}" rx="${r}" fill="${bg}" filter="url(#${k}d)"/>${mark}
   <rect width="${size}" height="${size * .55}" rx="${r}" fill="url(#${k}s)"/></svg>`; }
const pt = n => `<svg width="24" height="24" viewBox="0 0 24 24" style="width:1em;height:1em"><path d="${LOGO[n]}" fill="currentColor"/></svg>`;

// ---------------------------------------------------------------- the studio: full bleed, layered, one per brand
// base = [top, bottom] colours · blobs = [[x,y,rx,ry,rgba],…] · glyphs = brand keys or (size)=>svg · ink = glyph colour
// Layers: gradient wall → brand blobs → dot grid → darker floor band → out-of-focus glyphs (two near the top, the rest
// in the bleed zone under the captions). drift(t) moves the glyphs slowly so the frame breathes.
function studio(sc, {base, blobs, glyphs, ink}) {
  const bg = el(sc.c, `width:${W}px;height:${H}px;background:${blobs.map(b => `radial-gradient(${b[2]}px ${b[3]}px at ${b[0]}px ${b[1]}px,${b[4]},transparent 70%)`).join(',')},linear-gradient(180deg,${base[0]},${base[1]})`); bg.dataset.bleed = 1;
  el(bg, `width:${W}px;height:${H}px;background-image:radial-gradient(rgba(0,0,0,.06) 1.4px,transparent 1.6px);background-size:36px 36px;opacity:.6`);
  el(bg, `left:0;top:${H * .72}px;width:${W}px;height:${H * .28}px;background:linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,.07))`);
  const G = []; glyphs.forEach((g, k) => { const sz = 90 + hash(k * 3 + 1) * 90, x = 30 + hash(k * 7 + 2) * (W - 160), y = k < 2 ? 40 + hash(k * 5) * 110 : H * .78 + hash(k * 11 + 3) * H * .15;
    const d = el(bg, `left:${x}px;top:${y}px;width:${sz}px;height:${sz}px;opacity:${.09 + hash(k * 13) * .07};color:${ink};filter:blur(${(1 + hash(k * 17) * 1.5).toFixed(1)}px)`, typeof g === 'string' ? pt(g) : g(sz)); d._k = k; G.push(d); });
  return {bg, drift(t) { G.forEach(d => { d.style.transform = `translateY(${Math.sin(t * .35 + d._k * 1.7) * 12}px) rotate(${Math.sin(t * .2 + d._k) * 6}deg)`; }); }}; }
function cshadow(p, cx, y, w) { return el(p, `left:${cx - w / 2}px;top:${y - 14}px;width:${w}px;height:28px;border-radius:50%;background:radial-gradient(closest-side,rgba(30,20,10,.28),transparent)`); }

// ---------------------------------------------------------------- phone (Dynamic Island, side keys, floor reflection)
// inner = html of a 360×780 css screen (put statusBar() first). s = scale (.78 → 312×640, the hero size for 9:16).
// The screen is data-nocheck (mock UI text is not checked) and the phone is a focal object the captions must not cover.
function phoneEl(p, inner, s, x, y) {
  const d = el(p, `left:${x}px;top:${y}px`, `<div class="ph" style="width:${400 * s}px;height:${820 * s}px;border-radius:${64 * s}px;background:linear-gradient(160deg,#2b2d33,#0d0e11);padding:${18 * s}px;box-sizing:border-box;box-shadow:0 ${34 * s}px ${70 * s}px rgba(20,20,30,.35),inset 0 0 0 ${2 * s}px #45474e;position:relative;-webkit-box-reflect:below ${8 * s}px linear-gradient(transparent 74%,rgba(0,0,0,.2))">
   <div style="position:absolute;left:${-4 * s}px;top:${170 * s}px;width:${5 * s}px;height:${54 * s}px;border-radius:3px;background:#1a1b1f"></div><div style="position:absolute;left:${-4 * s}px;top:${250 * s}px;width:${5 * s}px;height:${90 * s}px;border-radius:3px;background:#1a1b1f"></div><div style="position:absolute;right:${-4 * s}px;top:${220 * s}px;width:${5 * s}px;height:${130 * s}px;border-radius:3px;background:#1a1b1f"></div>
   <div class="scr" data-nocheck style="width:100%;height:100%;border-radius:${48 * s}px;overflow:hidden;position:relative;background:#fff">
    <div class="inner" style="position:absolute;left:0;top:0;width:360px;height:780px;transform:scale(${s * (400 - 36) / 360});transform-origin:0 0">${inner}</div>
    <div style="position:absolute;left:50%;top:${14 * s}px;width:${112 * s}px;height:${32 * s}px;margin-left:${-56 * s}px;border-radius:${20 * s}px;background:#000"></div></div></div>`);
  d.dataset.role = 'focal'; d.dataset.name = 'phone'; d.setAttribute('data-over', ''); return d; }
const statusBar = (dark = false) => `<div style="position:absolute;left:0;top:0;width:360px;height:56px;display:flex;align-items:flex-end;justify-content:space-between;padding:0 30px 6px;box-sizing:border-box;font:700 16px Inter;color:${dark ? '#fff' : '#111'}"><span>9:41</span><span style="display:flex;gap:6px;align-items:center"><svg width="18" height="12" viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx="1" fill="currentColor"/><rect x="5" y="5" width="3" height="7" rx="1" fill="currentColor"/><rect x="10" y="2" width="3" height="10" rx="1" fill="currentColor"/><rect x="15" y="0" width="3" height="12" rx="1" fill="currentColor"/></svg><svg width="26" height="12" viewBox="0 0 26 12"><rect x="0" y="0" width="22" height="12" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="2" y="2" width="18" height="8" rx="1.5" fill="currentColor"/><rect x="23" y="4" width="2" height="4" fill="currentColor"/></svg></span></div>`;

// ---------------------------------------------------------------- real print with a marker
// spec = {img, vw (css width the page was captured at), crop:[x,y,w,h] in css px, boxes:[[x,y,w,h],…] of the phrases
// (from the capture script's getClientRects), src:'domain · title · date', width (860 fits the 9:16 frame at x=110)}
// printEl() returns the card with .hl = the marker boxes; hlSweep(card,t,[t0,t1,…]) draws each one on its word (null = never).
function printCard(sp) {
  const Wd = sp.width || 860, sc = Wd / sp.crop[2], h = sp.crop[3] * sc;
  const hl = (sp.boxes || []).map(b => `<div class="hlbox" style="position:absolute;left:${(b[0] - sp.crop[0] - 4) * sc}px;top:${(b[1] - sp.crop[1] - 3) * sc}px;width:${(b[2] + 8) * sc}px;height:${(b[3] + 6) * sc}px;background:#FFE45C;mix-blend-mode:multiply;border-radius:${3 * sc}px"></div>`).join('');
  return `<div style="width:${Wd}px;border-radius:22px;background:#fff;box-shadow:0 28px 70px rgba(20,20,30,.22),0 0 0 1px rgba(0,0,0,.06);overflow:hidden">
   <div style="height:58px;background:#f3f3f5;display:flex;align-items:center;gap:10px;padding:0 22px;font:600 26px Inter;color:#55575e;border-bottom:1px solid #e3e3e8">
    <span style="width:13px;height:13px;border-radius:50%;background:#ff5f57"></span><span style="width:13px;height:13px;border-radius:50%;background:#febc2e"></span><span style="width:13px;height:13px;border-radius:50%;background:#28c840"></span>
    <span data-nocheck style="margin-left:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${sp.src}</span></div>
   <div style="position:relative;width:${Wd}px;height:${h}px;overflow:hidden"><img src="${sp.img}" style="display:block;position:absolute;left:${-sp.crop[0] * sc}px;top:${-sp.crop[1] * sc}px;width:${sp.vw * sc}px">${hl}</div></div>`; }
function printEl(p, spec, x, y) { const d = el(p, `left:${x}px;top:${y}px`, printCard(spec)); d.dataset.role = 'focal'; d.dataset.name = 'print';
  d.hl = [...d.querySelectorAll('.hlbox')]; d.hl.forEach(h => { h.style.transformOrigin = '0 50%'; h.style.transform = 'scaleX(0)'; }); return d; }
const hlSweep = (d, t, times) => d.hl.forEach((h, i) => { h.style.transform = `scaleX(${times[i] == null ? 0 : E.o3(seg(t, times[i], times[i] + .4))})`; });
// a dim + blur that always travels WITH the print it serves (never alone): dimEl + dimSeek
function dimEl(p, tint = 'rgba(20,16,12,.4)') { const d = el(p, `width:${W}px;height:${H}px;background:${tint};backdrop-filter:blur(14px)`); d.dataset.bleed = 1; return d; }
function dimSeek(d, t, tin, tout) { const o = E.o5(seg(t, tin, tin + .4)) * (1 - E.i3(seg(t, tout, tout + .3))); d.style.opacity = o; d.style.visibility = o > .01 ? 'visible' : 'hidden'; }

// ---------------------------------------------------------------- report card (the recurring device)
// rows = [{key, name, icon (html), sub (html, may be empty), value (html)}]. Returns the card with .rows/.subs/.values
// so seek() can fill them on their words (vo(sub, p) per row). 800 px wide; 4 rows ≈ 592 px tall.
function reportCard(p, x, y, rows, title = 'a nota do teu vídeo', right = 'NOTA') {
  const d = el(p, `left:${x}px;top:${y}px;width:800px;border-radius:40px;background:#fffdf8;box-shadow:0 36px 80px rgba(40,30,15,.26),0 0 0 2px rgba(0,0,0,.04);overflow:hidden`);
  d.dataset.role = 'focal'; d.dataset.name = 'report'; d.setAttribute('data-over', '');
  d.innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between;padding:26px 32px 20px"><div style="display:flex;align-items:center;gap:16px;font:800 34px Inter;color:#16181D"><div style="width:14px;height:14px;border-radius:50%;background:#E5484D"></div>${title}</div><div class="hdr" style="font:700 26px Inter;color:#8a857b;letter-spacing:.06em">${right}</div></div>`
    + rows.map(r => `<div class="row" data-k="${r.key}" style="display:flex;align-items:center;gap:20px;padding:0 28px;height:128px;border-top:2px solid #f0eadf;position:relative">${r.thumb || ''}${r.icon}
      <div style="flex:1;min-width:0"><div style="font:800 34px Inter;color:#16181D">${r.name}</div><div class="sub" style="display:flex;align-items:center;gap:10px;font:600 28px Inter;color:#6d685f;height:40px">${r.sub || ''}</div></div>
      <div class="val" style="width:200px;display:flex;justify-content:flex-end;align-items:center;font:900 44px Inter;color:#c9c3b8;white-space:nowrap">${r.value ?? '—'}</div></div>`).join('');
  d.rows = [...d.querySelectorAll('.row')]; d.subs = d.rows.map(r => r.querySelector('.sub')); d.values = d.rows.map(r => r.querySelector('.val')); return d; }

// ---------------------------------------------------------------- stepper pill (the map): app icons, the active one opens its name
// items = [{key, name, icon (html 40px), bg (css background when active), lw (label width px; 0 = icon only)}]
function stepperEl(p, items) {
  const d = el(p, `left:${SB.x}px;top:${SB.y + 30}px;height:64px;border-radius:40px;background:rgba(255,255,255,.88);box-shadow:0 10px 24px rgba(20,20,30,.12);display:flex;align-items:center;padding:0 10px;gap:6px`); d.dataset.block = 1;
  d.cells = items.map(it => { const c = div(d, '', `display:flex;align-items:center;height:52px;border-radius:30px;padding:0 6px;background:transparent`,
      `<div style="width:44px;height:44px;display:flex;align-items:center;justify-content:center;flex:none">${it.icon}</div><div class="lb" data-nocheck style="overflow:hidden;width:0;white-space:nowrap;font:800 28px Inter;color:#fff"><span style="padding:0 12px 0 6px;display:inline-block">${it.name}</span></div>`);
    c.lb = c.querySelector('.lb'); c.lw = it.lw ?? 140; c.bg = it.bg || '#111'; return c; }); return d; }
// active = index of the current item (−1 none); times[i] = when item i became active; collapseAt = when the last label folds
function stepperSeek(st, t, active, times, collapseAt) { const ca = active >= 0 ? times[active] : (collapseAt ?? 1e9);
  st.cells.forEach((c, i) => { const p = i === active ? E.io3(seg(t, times[i], times[i] + .45)) : (times[i] != null && t >= times[i] ? 1 - E.io3(seg(t, ca, ca + .45)) : 0);
    c.lb.style.width = (c.lw * p) + 'px'; c.style.background = p > .02 ? c.bg : 'transparent'; c.lb.style.opacity = p; c.children[0].style.opacity = i === active || p > .02 ? 1 : .45; }); }

// ---------------------------------------------------------------- captions: white, black stroke, no plate, no flashing word
// Wraps the template's Captions(): same chunking, restyled for Reels (craft.md §7), plus the min-hold rule — the last
// word of a chunk stays ≥ 0.3 s and the next chunk waits for it (≤ 0.18 s late is the accepted price).
function outlinedCaptions(parent, WORDS, opts = {}) {
  const cap = Captions(parent, WORDS, {fs: 58, max: 6, maxChars: 30, hold: .9, ...opts});
  Object.assign(cap.box.style, {fontWeight: 900, webkitTextStroke: '7px #000', paintOrder: 'stroke fill', textShadow: '0 4px 14px rgba(0,0,0,.35)', letterSpacing: '-.01em'});
  const plate = cap.box.previousSibling; if (plate) plate.style.display = 'none';
  const seek0 = cap.seek.bind(cap);
  cap.seek = (t, off) => { seek0(t, off); for (const sp of cap.box.children) sp.style.color = '#fff'; };   // no accent colour on the newest word
  return cap; }
// NOTE on min-hold: add inside Captions() after `win` is built (the template now ships it):
//   for(let k=0;k<win.length-1;k++){const l=chunks[k][chunks[k].length-1],minEnd=WORDS[l].s+.3;if(win[k][1]<minEnd){win[k][1]=minEnd;win[k+1][0]=Math.max(win[k+1][0],minEnd);}}
