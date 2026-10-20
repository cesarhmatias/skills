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
  const T = 2, Q = 4; // example screens: transferencia, previsao
  // Known intermediate point, independent of DOM rendering details.
  await page.evaluate(T => window.lesson.seek({ slide: T, step: 1, time: .85, inputs: { amount: 8, loss: '0' } }), T);
  let v = await values(); check(Math.abs(v['value-A'] - 16) < 1e-8 && Math.abs(v['value-B'] - 4) < 1e-8, 'Half transfer must move 4, leaving 16');
  // Conservation must hold across extremes, partial states and an explicit loss boundary.
  for (const amount of [0, 1, 7, 20]) for (const loss of ['0', '0.2']) for (const time of [0, .25, .7, 1.45, 1.8]) {
    await page.evaluate(q => window.lesson.seek(q), { slide: T, step: 1, time, inputs: { amount, loss } });
    v = await values();
    check(Math.abs(v['value-A'] + v['value-B'] + v['outside-total'] - 20) < 1e-8, 'Closed total must remain 20');
    check(v['value-A'] >= 0 && v['value-B'] >= 0, 'Quantities must be nonnegative');
  }
  await page.evaluate(T => window.lesson.seek({ slide: T, step: 2, inputs: { amount: 20, loss: '0.2' } }), T);
  v = await values(); check(v['value-A'] === 0 && v['value-B'] === 16 && v['outside-total'] === 4, 'Loss must be represented explicitly');
  await page.evaluate(T => window.lesson.seek({ slide: T }), T);
  check((await page.evaluate(() => window.lesson.getState())).inputs.amount === 8, 'Seek must reset missing inputs to defaults');
  // Capture the same scene after an unrelated seek.
  const q = { slide: T, step: 1, time: .92, inputs: { amount: 7, loss: '0.2' } };
  await page.evaluate(q => window.lesson.seek(q), q);
  const before = await page.locator('[data-player="scene"]').screenshot({ caret: 'hide' });
  await page.evaluate(Q => window.lesson.seek({ slide: Q, step: 1, inputs: { a: '8' } }), Q);
  await page.evaluate(q => window.lesson.seek(q), q);
  check(before.equals(await page.locator('[data-player="scene"]').screenshot({ caret: 'hide' })), 'Out-of-order seek must reproduce pixels');
  // Practice: Continuar is blocked until an answer exists, then reveals causal feedback per answer.
  await page.evaluate(Q => window.lesson.seek({ slide: Q, step: 0 }), Q);
  check(await page.locator('[data-player="continue"]').isDisabled(), 'Practice must wait for an answer');
  await page.click('[data-choice="a"][data-value="12"]');
  check(!(await page.locator('[data-player="continue"]').isDisabled()), 'An answer unlocks Continuar');
  await page.click('[data-player="continue"]');
  await page.waitForFunction(() => !window.lesson.playing);
  check((await page.locator('[data-qa-text="feedback"]').textContent()).startsWith('Correto:'), 'Correct choice needs explanatory feedback');
  await page.click('[data-choice="a"][data-value="8"]');
  check((await page.locator('[data-qa-text="feedback"]').textContent()).includes('não o que ficou'), 'Wrong hypothesis needs a specific explanation');
  // Continuar advances one step at a time, never the whole scene; at the last step it changes screen.
  await page.evaluate(T => window.lesson.seek({ slide: T, step: 0 }), T);
  await page.click('[data-player="continue"]');
  await page.waitForFunction(() => !window.lesson.playing);
  let st = await page.evaluate(() => window.lesson.getState());
  check(st.slide === T && st.step === 1 && st.time === 1.8, 'One Continuar plays exactly the next step');
  await page.click('[data-player="continue"]'); await page.waitForFunction(() => !window.lesson.playing);
  await page.click('[data-player="continue"]');
  st = await page.evaluate(() => window.lesson.getState());
  check(st.slide === T + 1 && st.step === 0, 'Continuar on the last step opens the next screen at its start');
  // Pressing Continuar while a step plays finishes that step instead of skipping ahead.
  await page.evaluate(T => { window.lesson.seek({ slide: T, step: 0 }); window.lesson.nextStep(); }, T);
  await page.click('[data-player="continue"]');
  st = await page.evaluate(() => window.lesson.getState());
  check(st.step === 1 && st.time === 1.8 && !(await page.evaluate(() => window.lesson.playing)), 'Continuar during playback completes the current step');
  // Back from the first step returns to the previous screen's final state.
  await page.evaluate(T => window.lesson.seek({ slide: T, step: 0, time: 0 }), T);
  await page.click('[data-command="back"]');
  st = await page.evaluate(() => window.lesson.getState());
  check(st.slide === T - 1 && st.step === 1, 'Back on the first step opens the previous screen at its end');
  // Keyboard: → continues, but not while a control has focus.
  await page.evaluate(T => window.lesson.seek({ slide: T, step: 0 }), T);
  await page.locator('input[type=range]').focus(); await page.keyboard.press('ArrowRight');
  check((await page.evaluate(() => window.lesson.getState())).step === 0, 'Editing must not navigate');
  await page.evaluate(() => document.activeElement.blur()); await page.keyboard.press('ArrowRight'); await page.waitForFunction(() => !window.lesson.playing);
  check((await page.evaluate(() => window.lesson.getState())).step === 1, 'ArrowRight continues');
  // Sources drawer opens and closes without changing the lesson state.
  await page.click('[data-command="sources"]');
  check(await page.locator('[data-player="drawer"]').isVisible(), 'Sources drawer opens');
  await page.keyboard.press('Escape');
  check(!(await page.locator('[data-player="drawer"]').isVisible()), 'Escape closes the drawer');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(T => window.lesson.seek({ slide: T, step: 0 }), T);
  await page.click('[data-player="continue"]');
  const reduced = await page.evaluate(() => window.lesson.getState());
  check(reduced.step === 1 && reduced.time === 1.8 && !(await page.evaluate(() => window.lesson.playing)), 'Reduced motion advances once to the endpoint');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  // A range input must display its value.
  await page.evaluate(T => window.lesson.seek({ slide: T, inputs: { amount: 13 } }), T);
  check(await page.evaluate(() => document.querySelector('[data-output="amount"]')?.textContent) === 'R$ 13', 'Range input must display its formatted value');
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(T => window.lesson.seek({ slide: T, step: 2, inputs: { amount: 20, loss: '0.2' } }), T);
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `No page overflow at ${width}`);
  }
  // A diagram with a recomposed phone version shows exactly one of them per viewport.
  const shown = async width => { await page.setViewportSize({ width, height: 900 }); return page.evaluate(() => {
    const box = document.createElement('div'); box.className = 'lp'; box.innerHTML = LessonKit.diagram('<text>wide</text>', { w: 10, h: 10, narrow: { body: '<text>tall</text>', w: 5, h: 5 } }); document.body.append(box);
    const visible = [...box.querySelectorAll('svg')].filter(e => getComputedStyle(e).display !== 'none').map(e => e.textContent); box.remove(); return visible.join(); }); };
  check(await shown(1440) === 'wide' && await shown(390) === 'tall', 'Narrow diagram replaces the wide one on phones only');
  // A scrollable diagram keeps the learner's position when the scene re-renders. Runs last:
  // the fixture player adds its own keyboard listener.
  const scroll = await page.evaluate(async () => {
    const mount = document.createElement('div'); document.body.append(mount);
    const fixture = LessonPlayer.create({ root: mount, title: 'fixture', slides: [{ id: 'wide', title: 'wide', initialInputs: { v: 1 },
      controls: [{ key: 'v', type: 'range', label: 'v', min: 0, max: 5 }], steps: [{ id: 'only', label: 'only', duration: 0 }],
      render: ({ state }) => `<div data-qa-scroll="t" style="overflow-x:auto;width:100px"><div style="width:900px">${state.inputs.v}</div></div>` }] });
    await fixture.readyPromise;
    const region = () => mount.querySelector('[data-qa-scroll]');
    region().scrollLeft = 120; fixture.updateInputs({ v: 2 });
    return { left: region().scrollLeft, text: region().textContent };
  });
  check(scroll.left === 120 && scroll.text === '2', 'Re-render must keep the scroll position of data-qa-scroll regions');
  check(errors.length === 0, errors.join('; '));
  check(external.length === 0, 'Example must load offline');
  console.log(JSON.stringify({ ok: true, assertions, scope: 'included reference example and player; not arbitrary future lessons' }));
} catch (error) { console.error(error.stack || error.message); process.exitCode = 1; }
finally { await browser?.close(); }
