/* Printable handout (PDF) of a finished lesson: cover, one page per screen (final state of the scene with its
   controls, plus every step sentence in order), practice questions without answers, an answer key at the end
   and the sources. Images come from lesson.seek, so the PDF matches the interactive lesson exactly. */
import { writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { args, launch } from './lib.mjs';
const o = args();
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const T = {
  'pt-BR': { screens: 'telas', screen: 'Tela', steps: 'Passo a passo', practice: 'Responda antes de ver o gabarito, no fim.', key: 'Gabarito', answer: 'Resposta', sources: 'Fontes', made: 'Apostila gerada a partir da aula interativa' },
  en: { screens: 'screens', screen: 'Screen', steps: 'Step by step', practice: 'Answer before checking the key at the end.', key: 'Answer key', answer: 'Answer', sources: 'Sources', made: 'Handout generated from the interactive lesson' },
  es: { screens: 'pantallas', screen: 'Pantalla', steps: 'Paso a paso', practice: 'Responde antes de ver las respuestas, al final.', key: 'Respuestas', answer: 'Respuesta', sources: 'Fuentes', made: 'Material generado a partir de la clase interactiva' }
};
let browser;
try {
  if (!o._[0] || !o.out) throw new Error('Usage: pdf.mjs lesson.html --out lesson.pdf [--channel chrome]');
  const file = resolve(o._[0]), out = resolve(String(o.out));
  browser = await launch(o);
  // Each image is rendered in a viewport shaped like its place on the page, so the responsive layout recomposes to
  // fill it: screens with the step list get a near-square area, practice pages the full width. Two pages are kept
  // open instead of resizing one, because Chromium can tile the first 2× screenshot after a resize.
  const open = async viewport => {
    const p = await browser.newPage({ viewport, deviceScaleFactor: 2 });
    await p.goto(pathToFileURL(file).href); await p.waitForFunction(() => window.lesson?.ready || window.lesson?.error);
    return p;
  };
  const square = await open({ width: 1120, height: 1040 }), wide = await open({ width: 1440, height: 900 });
  let page = square;
  const m = await page.evaluate(() => window.lesson.getManifest());
  const t = T[m.lang] || T['pt-BR'];
  // The scene plus the screen's controls (answer cards, sliders): what the learner sees, without the player chrome.
  const shot = async () => {
    const box = await page.evaluate(() => {
      const parts = ['[data-player="scene"]', '[data-player="inputs"]'].map(s => document.querySelector(s)).filter(e => e && !e.hidden && e.getBoundingClientRect().height > 0).map(e => e.getBoundingClientRect());
      const x = Math.min(...parts.map(r => r.left)), y = Math.min(...parts.map(r => r.top));
      const pad = 10; // controls start at the scene edge; keep their labels whole
      return { x: Math.max(0, x - pad), y: Math.max(0, y - pad), width: Math.max(...parts.map(r => r.right)) - x + 2 * pad, height: Math.max(...parts.map(r => r.bottom)) - y + 2 * pad };
    });
    return (await page.screenshot({ clip: box, fullPage: true, type: 'png' })).toString('base64');
  };
  const fit = practice => { page = practice ? wide : square; };
  const caption = () => page.evaluate(() => document.querySelector('[data-player="caption"]').textContent.trim());
  const screens = [], answers = [];
  for (let i = 0; i < m.slides.length; i++) {
    const s = m.slides[i], good = s.auditCases.find(c => /cert|correta|right|correct/i.test(c.id));
    const practice = s.kind === 'pratica' && good;
    const sentences = [];
    fit(false);
    if (!practice) for (let k = 0; k < s.steps.length; k++) {
      await page.evaluate(q => window.lesson.seek(q), { slide: i, step: k });
      const c = await caption(); if (c && sentences[sentences.length - 1] !== c) sentences.push(c);
    }
    fit(practice);
    await page.evaluate(q => window.lesson.seek(q), { slide: i, step: practice ? 0 : s.steps.length - 1 });
    screens.push({ n: i + 1, slide: s, image: await shot(), sentences, practice });
    if (practice) {
      fit(true);
      await page.evaluate(q => window.lesson.seek(q), { slide: i, step: s.steps.length - 1, inputs: good.inputs });
      answers.push({ n: i + 1, slide: s, image: await shot() });
    }
  }
  const pageOf = (s, body) => `<section class="page"><header><span class="kicker">${esc(s.slide.kicker)}</span><span class="num">${t.screen} ${s.n} / ${m.slides.length}</span></header><h2>${esc(s.slide.title)}</h2>${body}</section>`;
  const html = `<!doctype html><html lang="${esc(m.lang)}"><head><meta charset="utf-8"><style>
    @page { size: A4 landscape; margin: 0 }
    * { box-sizing: border-box } body { margin: 0; font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif; color: #14161b; -webkit-print-color-adjust: exact; print-color-adjust: exact }
    .page { width: 297mm; height: 210mm; padding: 13mm 15mm 12mm; display: flex; flex-direction: column; page-break-after: always; overflow: hidden; background: #f6f5f1 }
    header { display: flex; justify-content: space-between; font-size: 9pt; letter-spacing: .1em; text-transform: uppercase; color: #6b6f78 } .kicker { color: #3b5bdb; font-weight: 650 }
    h2 { margin: 3mm 0 4mm; font-size: 20pt; line-height: 1.15; letter-spacing: -.01em }
    .body { flex: 1; min-height: 0; display: flex; gap: 8mm }
    .shot { flex: 1; min-width: 0; display: flex; align-items: flex-start; justify-content: center } .shot img { max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 3mm; box-shadow: 0 1mm 4mm rgba(20,22,27,.08) }
    ol { width: 78mm; margin: 0; padding: 0; list-style: none; counter-reset: s } ol h3 { margin: 0 0 3mm; font-size: 9pt; letter-spacing: .1em; text-transform: uppercase; color: #6b6f78 }
    li { counter-increment: s; position: relative; padding: 0 0 3.2mm 8mm; font-size: 10.5pt; line-height: 1.45 } li::before { content: counter(s); position: absolute; left: 0; top: .2mm; width: 5mm; height: 5mm; border-radius: 99px; background: #e9edff; color: #2a44b8; font-size: 7.5pt; font-weight: 700; display: flex; align-items: center; justify-content: center }
    .note { margin-top: 3mm; font-size: 10pt; color: #6b6f78 }
    .cover { justify-content: center; background: #14161b; color: #fff } .cover h1 { font-size: 34pt; margin: 0 0 6mm; letter-spacing: -.02em; max-width: 220mm } .cover p { color: #a3a6ad; font-size: 12pt; margin: 1mm 0 }
    .src li::before { content: none } .src li { padding-left: 0 } .src a { color: #2a44b8 } .src small { display: block; color: #6b6f78 }
  </style></head><body>
  <section class="page cover"><h1>${esc(m.title)}</h1><p>${m.slides.length} ${t.screens}</p><p>${t.made} · ${new Date().toISOString().slice(0, 10)}</p></section>
  ${screens.map(s => pageOf(s, `<div class="body"><div class="shot"><img src="data:image/png;base64,${s.image}"></div>${s.practice ? '' : `<ol><h3>${t.steps}</h3>${s.sentences.map(x => `<li>${esc(x)}</li>`).join('')}</ol>`}</div>${s.practice ? `<p class="note">${t.practice}</p>` : ''}`)).join('')}
  ${answers.map(a => pageOf({ ...a, slide: { ...a.slide, kicker: `${t.key} · ${a.slide.kicker}` } }, `<div class="body"><div class="shot"><img src="data:image/png;base64,${a.image}"></div></div>`)).join('')}
  ${m.sources?.length ? `<section class="page"><h2>${t.sources}</h2><ol class="src" style="width:auto">${m.sources.map(s => `<li><a href="${esc(s.url)}">${esc(s.title)}</a><small>${esc(s.url)}${s.note ? ' — ' + esc(s.note) : ''}</small></li>`).join('')}</ol></section>` : ''}
  </body></html>`;
  const tmp = join(tmpdir(), `lesson-pdf-${process.pid}.html`); await writeFile(tmp, html);
  const printer = await browser.newPage();
  await printer.goto(pathToFileURL(tmp).href); await printer.evaluate(() => document.fonts.ready);
  await mkdir(dirname(out), { recursive: true });
  await printer.pdf({ path: out, format: 'A4', landscape: true, printBackground: true, preferCSSPageSize: true });
  console.log(JSON.stringify({ output: out, pages: 1 + screens.length + answers.length + (m.sources?.length ? 1 : 0) }));
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { await browser?.close(); }
