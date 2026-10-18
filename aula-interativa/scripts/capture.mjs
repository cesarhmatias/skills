import { mkdir, writeFile, readFile, access } from 'node:fs/promises';
import { resolve, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { args, launch, openLesson, sourceHash, hash, positive, isMain } from './lib.mjs';

// Executed inside Chromium; intentionally self-contained.
export function layoutCheck() {
  const problems = [], text = [];
  const scene = document.querySelector('[data-player="scene"]') || document.querySelector('[data-qa-boundary="scene"]');
  const visible = e => e.checkVisibility({ opacityProperty: true, visibilityProperty: true }) && e.getBoundingClientRect().width > .5 && e.getBoundingClientRect().height > .5;
  const box = r => ({ x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom });
  const elements = [...document.querySelectorAll('[data-qa-text]')].filter(visible);
  if (scene && !elements.some(e => scene.contains(e))) problems.push({ code: 'NO_SCENE_TEXT_INSTRUMENTATION', detail: 'Mark essential scene labels with data-qa-text' });
  for (const e of elements) {
    const r = e.getBoundingClientRect(), name = e.dataset.qaText;
    if (r.left < -1 || r.right > innerWidth + 1) problems.push({ code: 'OUTSIDE_PAGE_WIDTH', element: name, box: box(r) });
    const boundary = e.closest('[data-qa-boundary]');
    if (boundary && !e.closest('[data-qa-scroll]')) {
      const b = boundary.getBoundingClientRect();
      if (r.left < b.left - 1 || r.right > b.right + 1 || r.top < b.top - 1 || r.bottom > b.bottom + 1) problems.push({ code: 'OUTSIDE_BOUNDARY', element: name, boundary: boundary.dataset.qaBoundary, box: box(r) });
    }
    if (!e.dataset.qaAllowOverlap) text.push({ e, r, name });
  }
  for (let i = 0; i < text.length; i++) for (let j = i + 1; j < text.length; j++) {
    const a = text[i], b = text[j];
    if (a.e.contains(b.e) || b.e.contains(a.e)) continue;
    if (Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left) > 2 && Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top) > 2) problems.push({ code: 'TEXT_OVERLAP', elements: [a.name, b.name] });
  }
  if (document.documentElement.scrollWidth > innerWidth + 1) problems.push({ code: 'PAGE_HORIZONTAL_OVERFLOW' });
  for (const e of [...document.querySelectorAll('[data-qa-focal]')].filter(visible)) {
    const r = e.getBoundingClientRect(), boundary = e.closest('[data-qa-boundary]');
    const b = boundary?.getBoundingClientRect();
    if (b && (r.left < b.left - 1 || r.right > b.right + 1 || r.top < b.top - 1 || r.bottom > b.bottom + 1)) problems.push({ code: 'FOCAL_CROPPED', element: e.dataset.qaFocal });
  }
  const uncontrolledAnimations = document.getAnimations().filter(a => a.playState === 'running').length;
  if (uncontrolledAnimations) problems.push({ code: 'UNCONTROLLED_ANIMATION', count: uncontrolledAnimations });
  return { problems, markedTextCount: elements.length };
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
  try { await access(join(out, 'manifest.json')); if (!options.overwrite) throw new Error('Output already contains a manifest; choose another directory or use --overwrite'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  await mkdir(out, { recursive: true });
  const viewports = String(options.viewports || '1440x900').split(',').map(value => {
    const m = /^(\d+)x(\d+)$/.exec(value);
    if (!m) throw new Error(`Invalid viewport ${value}`);
    return { width: positive(m[1], 'width'), height: positive(m[2], 'height') };
  });
  const browser = await launch(options);
  const manifest = { format: 1, source: file, sourceHash: await sourceHash(file), mode, fps, createdAt: new Date().toISOString(), frames: [], groups: [], errors: [], externalRequests: [], dependencies: [] };
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
          const scenarios = [{ id: 'default', inputs: {} }, ...(slide.auditCases || [])].filter(s => selected(options.scenarios, s.id));
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
              const layout = await page.evaluate(layoutCheck);
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
