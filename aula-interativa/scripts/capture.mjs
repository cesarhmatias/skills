import { mkdir, writeFile, readFile, access } from 'node:fs/promises';
import { resolve, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { args, launch, openLesson, sourceHash, hash, positive, isMain } from './lib.mjs';

// Executed inside Chromium; intentionally self-contained.
export function layoutCheck({ minFont = 11, budget = { title: 12, caption: 30, scene: 120, pratica: 140, resumo: 80 }, typeSizes = 4, textColors = 4, endpoint = false, coverage = { abertura: .45, explicar: .45, diagrama: .45, mock: .3 } } = {}) {
  const problems = [], text = [];
  const scene = document.querySelector('[data-player="scene"]') || document.querySelector('[data-qa-boundary="scene"]');
  const visible = e => e.checkVisibility({ opacityProperty: true, visibilityProperty: true }) && e.getBoundingClientRect().width > .5 && e.getBoundingClientRect().height > .5;
  const box = r => ({ x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom });
  const outside = (r, b) => r.left < b.left - 1 || r.right > b.right + 1 || r.top < b.top - 1 || r.bottom > b.bottom + 1;
  // Nearest ancestor that clips its content (an inline <svg> clips to its viewport by default).
  // A region marked data-qa-scroll is readable by scrolling, so clipping stops there. An <svg data-qa-camera>
  // frames part of a larger drawing on purpose: text it leaves out is not a defect, but data-qa-focal must stay in frame.
  function clipper(e, { camera = false } = {}) {
    for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) {
      if (a.hasAttribute('data-qa-scroll')) return null;
      if (a.hasAttribute('data-qa-camera')) return camera ? a : null;
      const o = getComputedStyle(a);
      if (o.overflowX !== 'visible' || o.overflowY !== 'visible') return a;
    }
    return null;
  }
  // The part of an element actually painted after every clipping ancestor.
  function painted(e) {
    let r = e.getBoundingClientRect(), box = { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
    for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) {
      const o = getComputedStyle(a);
      if (a.hasAttribute('data-qa-camera') || o.overflowX !== 'visible' || o.overflowY !== 'visible') {
        const c = a.getBoundingClientRect();
        box = { left: Math.max(box.left, c.left), top: Math.max(box.top, c.top), right: Math.min(box.right, c.right), bottom: Math.min(box.bottom, c.bottom) };
      }
    }
    return box;
  }
  // Rendered size: SVG text shrinks with the viewBox scale, so apply the screen transform.
  function renderedFont(e) {
    const size = parseFloat(getComputedStyle(e).fontSize) || 0;
    const m = e instanceof SVGGraphicsElement ? e.getScreenCTM() : null;
    return m ? size * Math.hypot(m.a, m.b) : size;
  }
  const elements = [...document.querySelectorAll('[data-qa-text]')].filter(visible);
  // Instrumentation must exist; an entrance at t=0 may legitimately show nothing yet.
  if (scene && !scene.querySelector('[data-qa-text]')) problems.push({ code: 'NO_SCENE_TEXT_INSTRUMENTATION', detail: 'Mark essential scene labels with data-qa-text' });
  for (const e of elements) {
    const r = e.getBoundingClientRect(), name = e.dataset.qaText, scrolls = !!e.closest('[data-qa-scroll]');
    if (!scrolls && (r.left < -1 || r.right > innerWidth + 1)) problems.push({ code: 'OUTSIDE_PAGE_WIDTH', element: name, box: box(r) });
    const boundary = e.closest('[data-qa-boundary]');
    if (boundary && !scrolls && outside(r, boundary.getBoundingClientRect())) problems.push({ code: 'OUTSIDE_BOUNDARY', element: name, boundary: boundary.dataset.qaBoundary, box: box(r) });
    const clip = clipper(e);
    if (clip && clip !== boundary && outside(r, clip.getBoundingClientRect())) problems.push({ code: 'TEXT_CLIPPED', element: name, by: clip.tagName.toLowerCase(), box: box(r) });
    const font = renderedFont(e);
    if (e.textContent.trim() && font < minFont) problems.push({ code: 'TEXT_TOO_SMALL', element: name, px: Math.round(font * 10) / 10, min: minFont });
    const seen = painted(e);
    if (!e.dataset.qaAllowOverlap && seen.right - seen.left > .5 && seen.bottom - seen.top > .5) text.push({ e, r: seen, name });
  }
  for (let i = 0; i < text.length; i++) for (let j = i + 1; j < text.length; j++) {
    const a = text[i], b = text[j];
    if (a.e.contains(b.e) || b.e.contains(a.e)) continue;
    if (Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left) > 2 && Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top) > 2) problems.push({ code: 'TEXT_OVERLAP', elements: [a.name, b.name] });
  }
  if (document.documentElement.scrollWidth > innerWidth + 1) problems.push({ code: 'PAGE_HORIZONTAL_OVERFLOW' });
  // On a desktop-sized viewport the learner must reach the step control without scrolling.
  // Slide navigation also lives in the header index and arrow keys, so only the step control is required.
  if (innerWidth >= 1000 && innerHeight >= 700) for (const command of ['continue']) {
    const control = document.querySelector('[data-player="continue"]') || document.querySelector('[data-command="nextStep"]');
    if (control && control.getBoundingClientRect().bottom > innerHeight + 1) problems.push({ code: 'CONTROLS_BELOW_FOLD', element: command, bottom: Math.round(control.getBoundingClientRect().bottom), viewport: innerHeight });
  }
  // Visual calm (references/00-experiencia-do-aluno.md §3): more text is fine; scattered type is not.
  // The scene may hold a long explanation, but it must use few type sizes, few text colors and one family.
  // Mocks are evidence with their own look and are exempt, as is anything marked data-qa-mock or data-qa-budget-exempt.
  const words = t => (t.match(/[\p{L}\p{N}][\p{L}\p{N}'’.,%-]*/gu) || []).length;
  const title = document.querySelector('[data-player="title"]'), caption = document.querySelector('[data-player="caption"]');
  if (title && words(title.textContent) > budget.title) problems.push({ code: 'TITLE_TOO_LONG', words: words(title.textContent), max: budget.title });
  if (caption && words(caption.textContent) > budget.caption) problems.push({ code: 'CAPTION_TOO_LONG', words: words(caption.textContent), max: budget.caption });
  if (scene) {
    // Count only text actually painted: hidden alternatives (wide/narrow drawings) and not-yet-entered text are skipped.
    let n = 0;
    const sizes = [], colors = new Set(), families = new Set();
    const walker = document.createTreeWalker(scene, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const parent = node.parentElement;
      if (!parent || !node.textContent.trim() || parent.closest('.mock,.mock-app,[data-qa-mock],[data-qa-budget-exempt],[aria-hidden="true"]')) continue;
      if (!parent.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
      n += words(node.textContent);
      const style = getComputedStyle(parent), family = style.fontFamily.split(',')[0].replace(/["']/g, '').trim();
      sizes.push(renderedFont(parent)); colors.add(parent instanceof SVGElement ? style.fill : style.color);
      if (!/mono|menlo|consolas|courier/i.test(family)) families.add(family);
    }
    const kind = document.querySelector('.lp')?.dataset.kind, max = budget[kind] ?? budget.scene;
    if (n > max) problems.push({ code: 'TEXT_WALL', words: n, max, kind });
    // Sizes within ~18% read as the same step of a type scale; more steps than allowed look scattered.
    const steps = [];
    for (const size of sizes.sort((a, b) => a - b)) if (!steps.length || size > steps[steps.length - 1] * 1.18) steps.push(size);
    if (steps.length > typeSizes) problems.push({ code: 'TYPE_SIZES', steps: steps.map(v => Math.round(v)), max: typeSizes });
    if (colors.size > textColors) problems.push({ code: 'TEXT_COLORS', colors: [...colors], max: textColors });
    if (families.size > 1) problems.push({ code: 'FONT_FAMILIES', families: [...families] });
  }
  // Composition: the final state of a screen must fill the scene. Measured as the bounding box of painted leaf
  // elements (text, shapes, images; mocks as one block) over the scene area. Earlier steps may build up from little.
  const kindNow = document.querySelector('.lp')?.dataset.kind;
  if (scene && endpoint && coverage[kindNow]) {
    const area = scene.getBoundingClientRect(); let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const e of scene.querySelectorAll('*')) {
      const block = e.matches('.mock,.mock-app,[data-qa-mock]');
      if (!block && (e.closest('.mock,.mock-app,[data-qa-mock]') || (e.children.length && !(e instanceof SVGTextElement)) || e.tagName.toLowerCase() === 'svg')) continue;
      if (!e.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
      const r = e.getBoundingClientRect();
      if (r.width < 1 || r.height < 1 || r.width * r.height > area.width * area.height * .95) continue;
      x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom);
    }
    const filled = x1 > x0 ? (x1 - x0) * (y1 - y0) / (area.width * area.height) : 0;
    if (filled < coverage[kindNow]) problems.push({ code: 'SCENE_SPARSE', filled: Math.round(filled * 100) / 100, min: coverage[kindNow], kind: kindNow });
  }
  for (const e of [...document.querySelectorAll('[data-qa-focal]')].filter(visible)) {
    const r = e.getBoundingClientRect(), boundary = e.closest('[data-qa-boundary]');
    const b = boundary?.getBoundingClientRect();
    if (b && outside(r, b)) problems.push({ code: 'FOCAL_CROPPED', element: e.dataset.qaFocal });
    const frame = clipper(e, { camera: true });
    if (frame && outside(r, frame.getBoundingClientRect())) problems.push({ code: 'FOCAL_CROPPED', element: e.dataset.qaFocal, by: 'camera' });
  }
  const uncontrolledAnimations = document.getAnimations().filter(a => a.playState === 'running').length;
  if (uncontrolledAnimations) problems.push({ code: 'UNCONTROLLED_ANIMATION', count: uncontrolledAnimations });
  // Page coordinates of the scene, so contact sheets can crop to what is being reviewed.
  const s = scene?.getBoundingClientRect();
  return { problems, markedTextCount: elements.length, scene: s ? { x: s.x + scrollX, y: s.y + scrollY, width: s.width, height: s.height } : null };
}
function selected(value, id) { return !value || value === 'all' || String(value).split(',').includes(id); }
function safe(value) { return String(value).replace(/[^a-zA-Z0-9_-]/g, '_'); }
export async function capture(options) {
  const file = resolve(options._[0] || '');
  if (!options._[0] || !options.out) throw new Error('Usage: capture.mjs lesson.html --out DIR --mode keyframes|motion [--channel chrome]');
  const out = resolve(String(options.out));
  const mode = options.mode || 'keyframes';
  if (!['keyframes', 'motion'].includes(mode)) throw new Error('Unknown capture mode');
  const fps = positive(options.fps || 30, 'fps');
  const limit = positive(options['max-frames'] || 6000, 'max-frames');
  const minFont = positive(options['min-font'] || 11, 'min-font');
  try { await access(join(out, 'manifest.json')); if (!options.overwrite) throw new Error('Output already contains a manifest; choose another directory or use --overwrite'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  await mkdir(out, { recursive: true });
  const viewports = String(options.viewports || '1440x900').split(',').map(value => {
    const m = /^(\d+)x(\d+)$/.exec(value);
    if (!m) throw new Error(`Invalid viewport ${value}`);
    return { width: positive(m[1], 'width'), height: positive(m[2], 'height') };
  });
  const browser = await launch(options);
  const manifest = { format: 1, source: file, sourceHash: await sourceHash(file), mode, fps, createdAt: new Date().toISOString(), minFont, frames: [], groups: [], errors: [], externalRequests: [], dependencies: [] };
  const dependencies = new Set([file]);
  try {
    for (const viewport of viewports) {
      const { page, errors, external, files } = await openLesson(browser, file, viewport);
      const info = await page.evaluate(() => window.lesson.getManifest());
      let chosen = 0;
      for (let i = 0; i < info.slides.length; i++) {
        const slide = info.slides[i];
        if (!selected(options.slides, slide.id)) continue;
        for (let k = 0; k < slide.steps.length; k++) {
          const step = slide.steps[k];
          if (!selected(options.steps, step.id)) continue;
          chosen++;
          // A screen may opt out of the default scenario when defaults cannot reach its steps (a quiz without an answer).
          const scenarios = [...(slide.auditDefault === false ? [] : [{ id: 'default', inputs: {} }]), ...(slide.auditCases || [])].filter(s => selected(options.scenarios, s.id));
          for (const scenario of scenarios) {
            const times = mode === 'motion' && step.duration > 0
              ? Array.from({ length: Math.ceil(step.duration * fps) + 1 }, (_, j) => Math.min(j / fps, step.duration))
              : [...new Set([0, step.duration * .25, step.duration * .5, step.duration * .75, step.duration])];
            if (manifest.frames.length + times.length > limit) throw new Error(`Capture exceeds ${limit} frames. Select slides/steps/scenarios or split into batches.`);
            const groupId = `${viewport.width}x${viewport.height}--${slide.id}--${step.id}--${scenario.id}`;
            const group = { id: groupId, title: slide.title, slide: i, step: k, duration: step.duration, scenario, viewport, frames: [] };
            manifest.groups.push(group);
            for (let f = 0; f < times.length; f++) {
              const state = { slide: i, step: k, time: times[f], inputs: scenario.inputs };
              await page.evaluate(state => window.lesson.seek(state), state);
              const layout = await page.evaluate(layoutCheck, { minFont, endpoint: k === slide.steps.length - 1 && times[f] === step.duration });
              const name = `${safe(groupId)}-${hash(groupId).slice(0, 8)}--${String(f).padStart(5, '0')}.png`;
              const image = await page.screenshot({ path: join(out, name), fullPage: true, caret: 'hide' });
              const index = manifest.frames.length;
              manifest.frames.push({ index, groupId, state, viewport, file: name, imageHash: hash(image), layout });
              group.frames.push(index);
            }
          }
        }
      }
      if (!chosen) throw new Error('No slides or steps matched the selection');
      for (const filePath of files) dependencies.add(filePath);
      manifest.errors.push(...errors);
      manifest.externalRequests.push(...external);
      await page.close();
    }
    if (!manifest.frames.length) throw new Error('No scenarios matched the selection');
    for (const path of [...dependencies].sort()) manifest.dependencies.push({ path, hash: await sourceHash(path) });
    manifest.artifactHash = hash(JSON.stringify(manifest.dependencies));
    manifest.problemFrames = manifest.frames.filter(f => f.layout.problems.length).length;
    manifest.errors = [...new Set(manifest.errors)];
    manifest.externalRequests = [...new Set(manifest.externalRequests)];
    await writeFile(join(out, 'manifest.json'), JSON.stringify(manifest, null, 2));
    await writeFile(join(out, 'review.json'), JSON.stringify({ artifactHash: manifest.artifactHash, groups: manifest.groups.map(g => ({ id: g.id, status: 'pending', notes: '', sheets: [] })) }, null, 2));
    console.log(JSON.stringify({ frames: manifest.frames.length, groups: manifest.groups.length, problemFrames: manifest.problemFrames, errors: manifest.errors.length, manifest: join(out, 'manifest.json') }));
    if (manifest.problemFrames || manifest.errors.length || manifest.externalRequests.length) process.exitCode = 1;
    return manifest;
  } finally { await browser.close(); }
}
if (isMain(import.meta.url)) capture(args()).catch(error => { console.error(error.message); process.exitCode = 1; });
