/* Integration/negative tests for packaging and evidence integrity. */
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, cp, rm } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { args, launch, openLesson } from './lib.mjs';
const options = args(), scripts = dirname(fileURLToPath(import.meta.url));
let scratch, browser;
function run(script, parameters) {
  const result = spawnSync(process.execPath, [join(scripts, script), ...parameters], { encoding: 'utf8', env: process.env, timeout: 90000 });
  if (result.error) throw result.error;
  return result;
}
try {
  if (!options._[0] || !options.capture) throw new Error('Usage: test_tools.mjs PACKED_LESSON --capture CAPTURE/manifest.json [--channel chrome]');
  const lesson = resolve(options._[0]), capture = resolve(String(options.capture));
  const base = resolve(String(options.out || tmpdir())); await mkdir(base, { recursive: true });
  scratch = await mkdtemp(join(base, 'lesson-tools-'));
  const channel = options.channel ? ['--channel', String(options.channel)] : [];
  let checks = 0;
  // Packing must produce a page which opens offline, not merely remove a src string.
  await writeFile(join(scratch, 'style.css'), 'body{color:rgb(17,34,51)}');
  await writeFile(join(scratch, 'app.js'), 'document.body.dataset.executed="yes";');
  await writeFile(join(scratch, 'source.html'), '<!doctype html><link rel="stylesheet" href="style.css"><body>Local test<script src="app.js"></script></body>');
  const packed = join(scratch, 'packed.html');
  assert.equal(run('pack.mjs', [join(scratch, 'source.html'), '--out', packed]).status, 0); checks++;
  browser = await launch(options);
  const page = await browser.newPage();
  const requests = [];
  await page.route(/^https?:\/\//, route => { requests.push(route.request().url()); return route.abort(); });
  await page.goto(new URL(`file://${packed}`).href);
  assert.equal(await page.evaluate(() => document.body.dataset.executed), 'yes');
  assert.equal(await page.evaluate(() => getComputedStyle(document.body).color), 'rgb(17, 34, 51)');
  assert.equal(requests.length, 0); checks++;
  await page.close(); await browser.close(); browser = null;
  // Remote assets must fail clearly before an output is written.
  await writeFile(join(scratch, 'remote.html'), '<img src="https://example.invalid/not-fetched.png">');
  const rejected = run('pack.mjs', [join(scratch, 'remote.html'), '--out', join(scratch, 'remote-packed.html')]);
  assert.notEqual(rejected.status, 0); assert(rejected.stderr.includes('External asset')); checks++;
  // An intentional collision must be reported, with a nonzero exit.
  const original = await readFile(lesson, 'utf8');
  const collision = original.replace('<body>', '<body><span data-qa-text="collision-a" style="position:absolute;left:0;top:0;width:200px;height:30px">First text</span><span data-qa-text="collision-b" style="position:absolute;left:0;top:0;width:200px;height:30px">Second text</span>');
  const collisionPath = join(scratch, 'collision.html'); await writeFile(collisionPath, collision);
  const captureOut = join(scratch, 'collision-qa');
  const failedLayout = run('capture.mjs', [collisionPath, '--out', captureOut, '--slides', 'transferencia', '--steps', 'inicial', '--scenarios', 'default', ...channel]);
  assert.notEqual(failedLayout.status, 0);
  const collisionManifest = JSON.parse(await readFile(join(captureOut, 'manifest.json'), 'utf8'));
  assert(collisionManifest.frames.some(f => f.layout.problems.some(p => p.code === 'TEXT_OVERLAP'))); checks++;
  // Clipped SVG text, text shrunk below reading size and an unreachable step control must fail;
  // a region marked data-qa-scroll must not be reported as page overflow.
  const fixtures = '<svg width="100" height="40" viewBox="0 0 100 40"><text data-qa-text="clipped" x="60" y="20" font-size="16">texto cortado</text></svg>'
    + '<svg width="100" viewBox="0 0 1000 400"><text data-qa-text="tiny" x="10" y="100" font-size="20">minúsculo</text></svg>'
    + '<div data-qa-scroll="diagrama largo" style="overflow-x:auto;width:100px"><span data-qa-text="wide" style="display:inline-block;width:2000px">largo</span></div>'
    + '<div style="height:1200px"></div>';
  const qualityPath = join(scratch, 'quality.html'); await writeFile(qualityPath, original.replace('<body>', `<body>${fixtures}`));
  const qualityOut = join(scratch, 'quality-qa');
  assert.notEqual(run('capture.mjs', [qualityPath, '--out', qualityOut, '--slides', 'transferencia', '--steps', 'inicial', '--scenarios', 'default', ...channel]).status, 0);
  const found = JSON.parse(await readFile(join(qualityOut, 'manifest.json'), 'utf8')).frames[0].layout.problems;
  assert(found.some(p => p.code === 'TEXT_CLIPPED' && p.element === 'clipped'), 'SVG viewport clipping must be reported'); checks++;
  assert(found.some(p => p.code === 'TEXT_TOO_SMALL' && p.element === 'tiny'), 'Scaled-down SVG text must be reported'); checks++;
  assert(!found.some(p => p.element === 'wide'), 'A data-qa-scroll region is not page overflow'); checks++;
  assert(found.some(p => p.code === 'CONTROLS_BELOW_FOLD'), 'A step control below the fold must be reported'); checks++;
  // The text budget is enforced: a title longer than nine words fails the capture.
  const wordyPath = join(scratch, 'wordy.html');
  await writeFile(wordyPath, original.replace("title: 'O que sai de A entra em B'", "title: 'Um título muito longo que tenta explicar tudo de uma vez só aqui'"));
  const wordyOut = join(scratch, 'wordy-qa');
  assert.notEqual(run('capture.mjs', [wordyPath, '--out', wordyOut, '--slides', 'transferencia', '--steps', 'inicial', '--scenarios', 'default', ...channel]).status, 0);
  assert(JSON.parse(await readFile(join(wordyOut, 'manifest.json'), 'utf8')).frames[0].layout.problems.some(p => p.code === 'TITLE_TOO_LONG'), 'Long titles must be reported'); checks++;
  // Visual calm is enforced: five unrelated text sizes in one scene fail the capture.
  const noisyPath = join(scratch, 'noisy.html');
  const noise = [12, 20, 34, 56, 90].map((size, i) => `<text x="${i * 120}" y="30" font-size="${size}">ruído</text>`).join('');
  await writeFile(noisyPath, original.replace('const body = tank(20,', `const body = '${noise}' + tank(20,`));
  const noisyOut = join(scratch, 'noisy-qa');
  assert.notEqual(run('capture.mjs', [noisyPath, '--out', noisyOut, '--slides', 'transferencia', '--steps', 'comparar', '--scenarios', 'default', ...channel]).status, 0);
  assert(JSON.parse(await readFile(join(noisyOut, 'manifest.json'), 'utf8')).frames.some(f => f.layout.problems.some(p => p.code === 'TYPE_SIZES')), 'Scattered type sizes must be reported'); checks++;
  // The handout is a real PDF with one page per screen plus cover, answer key and sources.
  const pdfPath = join(scratch, 'handout.pdf');
  const pdf = run('pdf.mjs', [lesson, '--out', pdfPath, ...channel]);
  assert.equal(pdf.status, 0, pdf.stderr);
  assert((await readFile(pdfPath)).subarray(0, 5).toString() === '%PDF-', 'Handout must be a PDF'); checks++;
  // A modified HTML cannot inherit a valid report from another artifact.
  const changed = join(scratch, 'changed.html'); await writeFile(changed, original + '\n<!-- changed -->');
  const changedReport = join(scratch, 'changed-audit.json');
  const stale = run('audit.mjs', [changed, '--capture', capture, '--out', changedReport, ...channel]);
  assert.notEqual(stale.status, 0);
  assert(JSON.parse(await readFile(changedReport, 'utf8')).problems.some(p => p.name === 'source-provenance')); checks++;
  // A modified screenshot must also be detected.
  const copied = join(scratch, 'copied-capture'); await cp(dirname(capture), copied, { recursive: true });
  const manifest = JSON.parse(await readFile(join(copied, 'manifest.json'), 'utf8'));
  await writeFile(join(copied, manifest.frames[0].file), 'invalid image');
  const imageReport = join(scratch, 'image-audit.json');
  const corrupt = run('audit.mjs', [lesson, '--capture', join(copied, 'manifest.json'), '--out', imageReport, ...channel]);
  assert.notEqual(corrupt.status, 0);
  assert(JSON.parse(await readFile(imageReport, 'utf8')).problems.some(p => p.name === 'frame:0')); checks++;
  console.log(JSON.stringify({ ok: true, checks, verified: ['offline packaging', 'remote asset rejection', 'layout failure', 'svg clipping', 'minimum text size', 'scroll region exemption', 'controls below fold', 'text budget', 'type scale', 'pdf handout', 'stale HTML rejection', 'modified frame rejection'] }));
} catch (error) { console.error(error.stack || error.message); process.exitCode = 1; }
finally { await browser?.close(); if (scratch) await rm(scratch, { recursive: true, force: true }); }
