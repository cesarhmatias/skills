/* Walkthrough video of a finished lesson, for sharing (X/Twitter, LinkedIn, Reels).
   Every step of every screen plays its real animation; a cursor clicks Continuar; practice screens get the
   correct answer (the audit case whose id contains "cert"/"correta"/"right") clicked before checking.
   Frames come from lesson.seek, so timing is exact and independent of machine speed. Requires ffmpeg. */
import { mkdir, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { resolve, join, basename } from 'node:path';
import { pathToFileURL } from 'node:url';
import { args, launch } from './lib.mjs';
const o = args(), fps = 30;
// Native layouts, never letterboxed: phones use the mobile layout at 2× with a slightly tighter header and bar.
const TALL = '.lp-top{height:44px}.lp-bar{padding:8px 0 12px;gap:10px}.lp-stage h1{font-size:24px}.lp-scene{margin:12px 0 8px}';
const FORMATS = { '1920x1080': [1440, 810, 4 / 3, ''], '1080x1080': [1080, 1080, 1, ''], '1080x1350': [1080, 1350, 1, ''], '1080x1920': [540, 960, 2, TALL] };
const HOLD = Number(o.hold || .7), READ = Number(o.read || 1.6), MOVE = .4, CLICK = .18;
const ease = x => x < .5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2;

async function render(browser, file, dir, [vw, vh, scale, css]) {
  await mkdir(dir, { recursive: true });
  const page = await browser.newPage({ viewport: { width: vw, height: vh }, deviceScaleFactor: scale });
  await page.goto(pathToFileURL(file).href); await page.waitForFunction(() => window.lesson?.ready);
  if (css) await page.addStyleTag({ content: css });
  await page.addStyleTag({ content: '#vc{position:fixed;left:0;top:0;z-index:99;pointer-events:none}#vr{position:fixed;z-index:98;pointer-events:none;border-radius:99px;border:3px solid #f59f00}' });
  await page.evaluate(() => {
    const c = document.createElement('div'); c.id = 'vc';
    c.innerHTML = '<svg width="28" height="34" viewBox="0 0 28 34"><path d="M3 2 L3 26 L9.5 20.5 L14 31 L18.5 29 L14 18.8 L22.5 18.5 Z" fill="#14161b" stroke="#fff" stroke-width="2" stroke-linejoin="round"/></svg>';
    const r = document.createElement('div'); r.id = 'vr'; document.body.append(c, r);
  });
  const m = await page.evaluate(() => window.lesson.getManifest());
  let frame = 0, cursor = null;
  const center = selector => page.evaluate(sel => { const r = document.querySelector(sel).getBoundingClientRect(); return { x: r.x + r.width * .55, y: r.y + r.height * .6 }; }, selector);
  async function shot(state, c, ring = 0) {
    await page.evaluate(([s, c, ring]) => {
      if (s) window.lesson.seek(s);
      const v = document.getElementById('vc'), r = document.getElementById('vr'), size = 18 + ring * 34;
      v.style.transform = `translate(${c.x - 3}px, ${c.y - 2}px) scale(${1 - .12 * ring})`;
      r.style.cssText = `left:${c.x - size / 2}px;top:${c.y - size / 2}px;width:${size}px;height:${size}px;opacity:${ring ? 1 - ring : 0}`;
    }, [state, c, ring]);
    await page.screenshot({ path: join(dir, `${String(frame++).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 93 });
  }
  // Hold a state, then move the cursor to `target` and click it.
  async function travelAndClick(state, target, hold) {
    const start = cursor, moveFrames = Math.round(MOVE * fps), clickFrames = Math.round(CLICK * fps);
    const wait = Math.max(1, Math.round(hold * fps) - moveFrames - clickFrames);
    for (let f = 0; f < wait; f++) await shot(f === 0 ? state : null, start);
    for (let f = 1; f <= moveFrames; f++) { const p = ease(f / moveFrames); await shot(null, { x: start.x + (target.x - start.x) * p, y: start.y + (target.y - start.y) * p }); }
    for (let f = 1; f <= clickFrames; f++) await shot(null, target, f / clickFrames);
    cursor = target;
  }
  // A step plays its animation while the cursor drifts up-left, off the button, staying inside the frame.
  async function play(slide, step, inputs) {
    const d = m.slides[slide].steps[step].duration, n = Math.max(1, Math.round(d * fps));
    const from = cursor, rest = { x: from.x - 90, y: from.y - 34 }, drift = Math.round(.45 * fps);
    for (let f = 0; f <= n; f++) {
      const p = ease(Math.min(1, f / drift));
      await shot({ slide, step, time: Math.min(d, f / fps), inputs }, { x: from.x + (rest.x - from.x) * p, y: from.y + (rest.y - from.y) * p });
    }
    cursor = rest;
  }
  cursor = await center('[data-player="continue"]').then(c => ({ x: c.x - 140, y: c.y - 60 }));
  for (let i = 0; i < m.slides.length; i++) {
    const s = m.slides[i], good = s.auditCases.find(c => /cert|correta|right|correct/i.test(c.id));
    if (s.kind === 'pratica' && good) {
      await play(i, 0, {});
      const [key, value] = Object.entries(good.inputs)[0];
      await travelAndClick({ slide: i, step: 0, inputs: {} }, await center(`[data-choice="${key}"][data-value="${value}"]`), HOLD + .5);
      await travelAndClick({ slide: i, step: 0, inputs: good.inputs }, await center('[data-player="continue"]'), HOLD);
      await play(i, 1, good.inputs);
      if (i < m.slides.length - 1) await travelAndClick({ slide: i, step: 1, inputs: good.inputs }, await center('[data-player="continue"]'), READ);
      continue;
    }
    for (let k = 0; k < s.steps.length; k++) {
      await play(i, k, {});
      if (i === m.slides.length - 1 && k === s.steps.length - 1) { for (let f = 0; f < READ * fps; f++) await shot(null, cursor); break; }
      await travelAndClick({ slide: i, step: k, inputs: {} }, await center('[data-player="continue"]'), HOLD + (s.kind === 'mock' ? .4 : 0));
    }
  }
  await page.close();
  return frame;
}

let browser;
try {
  if (!o._[0] || !o.out) throw new Error('Usage: video.mjs lesson.html --out DIR [--formats 1920x1080,1080x1080,1080x1350,1080x1920] [--hold 0.7] [--read 1.6] [--channel chrome]');
  if (spawnSync('ffmpeg', ['-version']).status !== 0) throw new Error('ffmpeg not found');
  const file = resolve(o._[0]), out = resolve(String(o.out)), name = basename(file, '.html');
  const formats = String(o.formats || Object.keys(FORMATS).join(',')).split(',');
  for (const f of formats) if (!FORMATS[f]) throw new Error(`Unknown format ${f}`);
  await mkdir(out, { recursive: true });
  browser = await launch(o);
  const results = await Promise.all(formats.map(async f => {
    const frames = join(out, `.frames-${f}`), mp4 = join(out, `${name}-${f}.mp4`);
    const count = await render(browser, file, frames, FORMATS[f]);
    const enc = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', join(frames, '%05d.jpg'), '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4], { encoding: 'utf8' });
    if (enc.status !== 0) throw new Error(`ffmpeg failed for ${f}: ${enc.stderr}`);
    await rm(frames, { recursive: true, force: true });
    return { format: f, file: mp4, seconds: +(count / fps).toFixed(1) };
  }));
  console.log(JSON.stringify(results));
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { await browser?.close(); }
