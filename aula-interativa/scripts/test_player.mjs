/* Regression tests for the included reference example, not for arbitrary lesson content. */
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { args, launch, openLesson } from './lib.mjs';
const options = args();
const file = options._[0] ? resolve(options._[0]) : fileURLToPath(new URL('../examples/mecanismo.html', import.meta.url));
let browser;
try {
  browser = await launch(options);
  const { page, errors, external } = await openLesson(browser, file);
  let assertions = 0;
  const check = (value, message) => { assert(value, message); assertions++; };
  const values = () => page.evaluate(() => Object.fromEntries([...document.querySelectorAll('[data-value]')].map(e => [e.dataset.qaText, Number(e.dataset.value)])));
  // Known intermediate point, independent of DOM rendering details.
  await page.evaluate(() => window.lesson.seek({ slide: 0, step: 1, time: .85, inputs: { amount: 8, loss: '0' } }));
  let v = await values(); check(Math.abs(v['value-A'] - 16) < 1e-8 && Math.abs(v['value-B'] - 4) < 1e-8, 'Half transfer must move 4, leaving 16');
  // Conservation must hold across extremes, partial states and an explicit loss boundary.
  for (const amount of [0, 1, 7, 20]) for (const loss of ['0', '0.2']) for (const time of [0, .25, .7, 1.45, 1.8]) {
    await page.evaluate(q => window.lesson.seek(q), { slide: 0, step: 1, time, inputs: { amount, loss } });
    v = await values();
    check(Math.abs(v['value-A'] + v['value-B'] + v['outside-total'] - 20) < 1e-8, 'Closed total must remain 20');
    check(v['value-A'] >= 0 && v['value-B'] >= 0, 'Quantities must be nonnegative');
  }
  await page.evaluate(() => window.lesson.seek({ slide: 0, step: 2, inputs: { amount: 20, loss: '0.2' } }));
  v = await values(); check(v['value-A'] === 0 && v['value-B'] === 16 && v['outside-total'] === 4, 'Loss must be represented explicitly');
  await page.evaluate(() => window.lesson.seek({ slide: 0 }));
  check((await page.evaluate(() => window.lesson.getState())).inputs.amount === 8, 'Seek must reset missing inputs to defaults');
  // Capture the same scene after an unrelated seek.
  const q = { slide: 0, step: 1, time: .92, inputs: { amount: 7, loss: '0.2' } };
  await page.evaluate(q => window.lesson.seek(q), q);
  const before = await page.locator('[data-player="scene"]').screenshot({ caret: 'hide' });
  await page.evaluate(() => window.lesson.seek({ slide: 1, step: 1, inputs: { prediction: '8' } }));
  await page.evaluate(q => window.lesson.seek(q), q);
  check(before.equals(await page.locator('[data-player="scene"]').screenshot({ caret: 'hide' })), 'Out-of-order seek must reproduce pixels');
  // Correct and incorrect choices must produce distinct causal feedback.
  await page.evaluate(() => window.lesson.seek({ slide: 1, step: 1, inputs: { prediction: '12' } }));
  check((await page.locator('[data-qa-text="feedback"]').textContent()).startsWith('Correto:'), 'Correct choice needs explanatory feedback');
  await page.selectOption('select', '8');
  check((await page.locator('[data-qa-text="feedback"]').textContent()).includes('não a que resta'), 'Wrong hypothesis needs a specific explanation');
  await page.locator('select').focus(); await page.keyboard.press('ArrowLeft');
  check((await page.evaluate(() => window.lesson.getState())).slide === 1, 'Editing must not navigate slides');
  await page.evaluate(() => window.lesson.seek({ slide: 0 }));
  await page.click('[data-command="nextStep"]');
  await page.waitForFunction(() => !window.lesson.playing);
  check((await page.evaluate(() => window.lesson.getState())).step === 1, 'One step must not play the remaining scene');
  await page.click('[data-command="reset"]');
  check((await page.evaluate(() => window.lesson.getState())).step === 0, 'Reset restores the first step');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.click('[data-command="nextStep"]');
  const reduced = await page.evaluate(() => window.lesson.getState());
  check(reduced.step === 1 && reduced.time === 1.8 && !(await page.evaluate(() => window.lesson.playing)), 'Reduced motion advances once to the endpoint');
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => window.lesson.seek({ slide: 0, step: 2, inputs: { amount: 20, loss: '0.2' } }));
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `No page overflow at ${width}`);
  }
  check(errors.length === 0, errors.join('; '));
  check(external.length === 0, 'Example must load offline');
  console.log(JSON.stringify({ ok: true, assertions, scope: 'included reference example and player; not arbitrary future lessons' }));
} catch (error) { console.error(error.stack || error.message); process.exitCode = 1; }
finally { await browser?.close(); }
