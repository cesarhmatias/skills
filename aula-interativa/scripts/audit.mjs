import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { args, launch, openLesson, sourceHash, hash, dependency } from './lib.mjs';
const options = args(), checks = [], problems = [];
function record(name, ok, detail = '') { checks.push({ name, ok, detail }); if (!ok) problems.push({ name, detail }); }
let browser;
try {
  if (!options._[0] || !options.capture || !options.out) throw new Error('Usage: audit.mjs lesson.html --capture DIR/manifest.json --out audit.json');
  const file = resolve(options._[0]), capturePath = resolve(String(options.capture)), dir = dirname(capturePath);
  const manifest = JSON.parse(await readFile(capturePath, 'utf8'));
  record('source-provenance', manifest.sourceHash === await sourceHash(file), 'Capture must match the supplied HTML');
  for (const dependency of manifest.dependencies || []) {
    let actual = null; try { actual = await sourceHash(dependency.path); } catch { /* missing is a failure */ }
    record(`dependency:${dependency.path}`, actual === dependency.hash, 'Linked source files must match capture');
  }
  record('manifest-integrity', manifest.artifactHash === hash(JSON.stringify(manifest.dependencies)), 'Dependency list fingerprint');
  record('captured-frames', manifest.frames?.length > 0);
  record('captured-layout', manifest.frames.every(f => f.layout.problems.length === 0), `${manifest.frames.filter(f => f.layout.problems.length).length} problem frames`);
  record('page-errors', manifest.errors.length === 0, manifest.errors.join('; '));
  record('offline-load', manifest.externalRequests.length === 0, manifest.externalRequests.join('; '));
  for (const frame of manifest.frames) {
    let image; try { image = await readFile(join(dir, frame.file)); } catch { image = Buffer.alloc(0); }
    if (hash(image) !== frame.imageHash) record(`frame:${frame.index}`, false, 'Missing or modified capture image');
  }
  const sharp = dependency('sharp');
  browser = await launch(options);
  const { page, errors, external } = await openLesson(browser, file);
  const info = await page.evaluate(() => window.lesson.getManifest());
  const coverage = info.slides.every((s, i) => s.steps.every((_, k) => manifest.groups.some(g => g.slide === i && g.step === k && (g.scenario.id === 'default' || s.auditDefault === false))));
  record('scene-coverage', coverage || !!options.partial, coverage ? 'All slides and steps have default captures' : 'Partial capture: never a complete delivery review');
  // Compare scene pixels after a seek to an unrelated state. Hide caret, not animation.
  for (let i = 0; i < info.slides.length; i++) {
    const slide = info.slides[i];
    for (let k = 0; k < slide.steps.length; k++) {
      const target = { slide: i, step: k, time: slide.steps[k].duration * .5, inputs: slide.initialInputs || {} };
      // The rendered DOM must be identical; pixels may differ only by rasterization noise (a few anti-aliased pixels).
      const take = async s => { await page.evaluate(s => window.lesson.seek(s), s); await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
        return { html: await page.evaluate(() => document.querySelector('[data-player="scene"]').innerHTML), png: await page.locator('[data-player="scene"]').screenshot({ caret: 'hide' }) }; };
      const before = await take(target);
      await page.evaluate(s => window.lesson.seek(s), { slide: (i + 1) % info.slides.length, step: 0, time: 0 });
      const after = await take(target);
      let same = before.html === after.html && before.png.equals(after.png), detail = 'Direct and out-of-order seeks must match';
      if (!same && before.html === after.html) {
        const a = await sharp(before.png).raw().toBuffer({ resolveWithObject: true }), b = await sharp(after.png).raw().toBuffer();
        let differing = 0; for (let p = 0; p < b.length; p += a.info.channels) if (Math.abs(a.data[p] - b[p]) + Math.abs(a.data[p + 1] - b[p + 1]) + Math.abs(a.data[p + 2] - b[p + 2]) > 24) differing++;
        const ratio = differing / (a.info.width * a.info.height); same = ratio < .002; detail = `Same DOM; ${(ratio * 100).toFixed(3)}% pixels differ`;
      }
      record(`seek:${slide.id}/${slide.steps[k].id}`, same, detail);
    }
  }
  // A single-step button must stop on exactly the next step.
  const multi = info.slides.findIndex(s => s.steps.length > 1);
  if (multi >= 0) {
    await page.evaluate(i => window.lesson.seek({ slide: i, step: 0 }), multi);
    await page.evaluate(() => window.lesson.nextStep());
    const seconds = info.slides[multi].steps[1].duration;
    await page.waitForFunction(() => !window.lesson.playing, null, { timeout: Math.max(5000, seconds * 1000 + 3000) });
    const stopped = await page.evaluate(() => window.lesson.getState());
    record('one-step-stops', stopped.slide === multi && stopped.step === 1 && Math.abs(stopped.time - seconds) < .001);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.evaluate(i => window.lesson.seek({ slide: i, step: 0 }), multi);
    await page.evaluate(() => window.lesson.nextStep());
    const reduced = await page.evaluate(() => window.lesson.getState());
    record('reduced-motion-one-step', reduced.step === 1 && Math.abs(reduced.time - seconds) < .001 && !(await page.evaluate(() => window.lesson.playing)));
    await page.emulateMedia({ reducedMotion: 'no-preference' });
  }
  // Playing must stop at this scene, never advance to another slide.
  await page.evaluate(() => { const m = window.lesson.getManifest(); window.lesson.seek({ slide: 0, step: m.slides[0].steps.length - 1 }); window.lesson.play(); });
  const total = info.slides[0].steps.reduce((n, s) => n + s.duration, 0);
  await page.waitForFunction(() => !window.lesson.playing, null, { timeout: Math.max(5000, total * 1000 + 3000) });
  const end = await page.evaluate(() => window.lesson.getState());
  record('play-stops-before-next-slide', end.slide === 0 && end.step === info.slides[0].steps.length - 1);
  const editable = info.slides.findIndex(s => s.initialInputs && Object.keys(s.initialInputs).length);
  if (editable >= 0) {
    await page.evaluate(i => window.lesson.seek({ slide: i }), editable);
    const input = page.locator('input,textarea,select').first();
    if (await input.count()) {
      const before = await page.evaluate(() => window.lesson.getState());
      await input.focus(); await page.keyboard.press('ArrowRight');
      const after = await page.evaluate(() => window.lesson.getState());
      record('editing-keeps-navigation', before.slide === after.slide && before.step === after.step);
    }
  }
  record('audit-page-errors', errors.length === 0, errors.join('; '));
  record('audit-offline', external.length === 0, external.join('; '));
  let visual = { status: 'pending', detail: 'No completed visual review' };
  try {
    const review = JSON.parse(await readFile(join(dir, 'review.json'), 'utf8'));
    const sheets = JSON.parse(await readFile(join(dir, 'sheets.json'), 'utf8'));
    let intact = sheets.artifactHash === manifest.artifactHash;
    for (const group of sheets.groups) for (const sheet of group.sheets) intact &&= hash(await readFile(join(dir, sheet.file))) === sheet.hash;
    const complete = review.artifactHash === manifest.artifactHash && manifest.groups.every(group => {
      const r = review.groups.find(r => r.id === group.id);
      return r?.status === 'pass' && r.notes?.trim() && r.sheets?.length;
    });
    visual = { status: complete && intact ? 'recorded-pass' : 'pending-or-failed', stride: sheets.stride, detail: 'Recorded by reviewer; automated audit cannot prove visual judgement occurred' };
    record('visual-sheet-integrity', intact);
  } catch (error) { visual.detail = error.message; }
  const report = { artifactHash: manifest.artifactHash, source: file, automated: problems.length ? 'failed' : 'passed', visual, verdict: problems.length ? 'failed' : !coverage ? 'partial-review-only' : visual.status === 'recorded-pass' ? 'ready-with-recorded-review' : 'needs-visual-review', checks, problems };
  await mkdir(dirname(resolve(String(options.out))), { recursive: true });
  await writeFile(resolve(String(options.out)), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ automated: report.automated, visual: visual.status, verdict: report.verdict, checks: checks.length, problems: problems.length }));
  if (problems.length || options['require-visual'] && visual.status !== 'recorded-pass') process.exitCode = 1;
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { await browser?.close(); }
