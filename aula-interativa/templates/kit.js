/* Scene kit: building blocks for the screen kinds of a guided lesson.
   Every function is pure: same state and time → same markup. Requires motion.js. */
(function (global) {
  'use strict';
  const M = global.LessonMotion, esc = M.escape;
  const op = v => `opacity="${M.clamp(v).toFixed(3)}"`;
  // SVG attributes for an element entering with fade + small rise (see M.enter).
  const rise = e => `opacity="${e.opacity.toFixed(3)}" transform="translate(0 ${e.y.toFixed(2)})"`;

  // Full-width drawing. Size w×h to the content itself, with no empty margins: the drawing then
  // fills the scene on desktop and stays readable when it shrinks to a phone width.
  // `view` lets a camera frame part of the drawing; mark it so the checker knows clipping is
  // intended and only data-qa-focal must stay in frame. `scroll` is a last resort for drawings
  // that cannot be recomposed: a phone then pans a 760 px wide copy.
  // `narrow: { body, w, h }` is a recomposed version (e.g. stacked vertically) shown only on phones;
  // render both from the same state: CSS picks one, so render stays independent of the viewport.
  function diagram(body, { w = 1200, h = 560, view, camera = false, scroll = false, defs = '', narrow = null } = {}) {
    const one = (b, box, cls) => `<svg class="${cls}" viewBox="${box}" preserveAspectRatio="xMidYMid meet" role="img" ${camera ? 'data-qa-camera="câmera segue o foco"' : ''}>${defs}${b}</svg>`;
    const wide = one(body, view || `0 0 ${w} ${h}`, narrow ? 'sc-only-wide' : '');
    const tall = narrow ? one(narrow.body, narrow.view || `0 0 ${narrow.w} ${narrow.h}`, 'sc-only-narrow') : '';
    return `<div class="sc-full ${scroll ? 'sc-wide" data-qa-scroll="diagrama rola no celular' : ''}">${wide}${tall}</div>`;
  }
  // Copy on the left, visual on the right: the screen's single text region. `say` is the idea in one sentence;
  // `sub` a short complement; `read` an optional deeper explanation (up to ~5 lines) in the body style.
  function split({ say, sub = '', read = '', visual, kicker = '' }) {
    return `<div class="sc-split"><div class="sc-copy">${kicker ? `<p class="sc-label">${kicker}</p>` : ''}<p class="sc-say" data-qa-text="say">${say}</p>${sub ? `<p class="sc-sub" data-qa-text="sub">${sub}</p>` : ''}${read ? `<p class="sc-read" data-qa-text="read">${read}</p>` : ''}</div><div class="sc-visual">${visual}</div></div>`;
  }
  // One big statement or number in the middle of the screen.
  function hero({ big = '', say = '', sub = '', style = '' }) {
    return `<div class="sc-center" style="${style}">${big ? `<p class="sc-big" data-qa-text="big">${big}</p>` : ''}${say ? `<p class="sc-say" data-qa-text="say">${say}</p>` : ''}${sub ? `<p class="sc-sub" data-qa-text="sub">${sub}</p>` : ''}</div>`;
  }

  // Terminal mock. `script[k]` holds the lines shown during step k: earlier steps appear complete,
  // later steps are absent. A line is typed ({type:true,text,at,cps}) or shown ({text,at,cls,hl}).
  // A highlight (hl) belongs to its own step only, so one thing is lit at a time; `keep: true` keeps it.
  function terminal(state, time, script, { title = 'terminal', prompt = '$ ', badge = 'simulação' } = {}) {
    let out = '';
    script.forEach((lines, k) => {
      if (k > state.step) return;
      const t = k < state.step ? 1e9 : time;
      for (const line of lines) {
        if (t < line.at) continue;
        if (line.type) {
          const typed = M.typed(line.text, t, line.at, line.cps || 30), typing = typed.length < line.text.length;
          out += `<span class="p">${esc(line.prompt ?? prompt)}</span><span class="k">${esc(typed)}</span>${typing ? '<span class="cursor"></span>' : ''}\n`;
        } else {
          const e = M.enter(t, line.at, .35, 6), hl = line.hl !== undefined && t >= line.hl && (k === state.step || line.keep);
          out += `<span class="${line.cls || ''} ${hl ? 'hl' : ''}" style="${e.style};display:inline-block">${esc(line.text)}</span>\n`;
        }
      }
    });
    return `<div class="sc-center"><div class="mock" data-qa-text="terminal"><div class="mock-bar"><i></i><i></i><i></i><span>${esc(title)}</span><em>${esc(badge)}</em></div><pre>${out}</pre></div></div>`;
  }
  // App/screen mock: a device-like card with a title bar. `body` is HTML built from .app-* classes.
  function app({ title, body, badge = 'simulação', note = '' }) {
    return `<div class="sc-center"><div class="mock-app" data-qa-text="app"><div class="mock-app-bar"><b>${esc(title)}</b><em>${esc(badge)}</em></div><div class="mock-app-body">${body}</div></div>${note ? `<p class="sc-note">${esc(note)}</p>` : ''}</div>`;
  }

  // Practice screen with choice cards. Continuar stays disabled until an answer exists;
  // the second step ("Conferir") reveals feedback specific to the chosen answer.
  function quiz({ id, kicker = '', title, question, hint = '', options, correct, feedback, sources, lang = 'pt-BR' }) {
    const T = { 'pt-BR': ['Escolha uma resposta', 'Conferir', 'Escolha uma resposta abaixo.', 'Boa. Agora confira.', 'Isso. Siga quando quiser.', 'Leia a explicação: ela mostra o que muda o resultado.', 'Resposta'], en: ['Choose an answer', 'Check', 'Choose an answer below.', 'Good. Now check it.', 'Right. Continue when ready.', 'Read the explanation: it shows what changes the result.', 'Answer'], es: ['Elige una respuesta', 'Comprobar', 'Elige una respuesta abajo.', 'Bien. Ahora compruébalo.', 'Correcto. Sigue cuando quieras.', 'Lee la explicación: muestra qué cambia el resultado.', 'Respuesta'] }[lang] || [];
    for (const o of options) if (!feedback[o.value]) throw new Error(`Quiz ${id}: feedback missing for ${o.value}`);
    return {
      // The default (no answer) cannot reach the feedback step, so it is not a capture scenario.
      id, kind: 'pratica', kicker, title, sources, initialInputs: { a: '' }, auditDefault: false,
      controls: [{ key: 'a', type: 'choice', label: T[6], options }],
      auditCases: [{ id: 'certa', inputs: { a: correct } }, { id: 'errada', inputs: { a: options.find(o => o.value !== correct).value } }],
      ready: s => s.step > 0 || s.inputs.a !== '', waitLabel: T[0],
      steps: [{ id: 'pergunta', label: '', duration: .6 }, { id: 'resposta', label: '', duration: .6, cta: T[1] }],
      render({ state, time }) {
        const a = state.inputs.a, e = M.enter(state.step === 0 ? time : 9, 0, .5), f = M.enter(state.step === 1 ? time : 0, .05, .5);
        // The longest feedback is laid out invisibly before the answer, so nothing moves when it appears.
        const longest = Object.values(feedback).reduce((x, y) => y.length > x.length ? y : x, '');
        const fb = state.step === 1 && a ? `<p class="sc-feedback ${a === correct ? '' : 'wrong'}" style="${f.style}" data-qa-text="feedback">${esc(feedback[a])}</p>` : `<p class="sc-feedback" style="visibility:hidden" aria-hidden="true">${esc(longest)}</p>`;
        return { html: `<div class="sc-center"><div class="sc-question" style="${e.style}"><p class="sc-say" data-qa-text="pergunta">${esc(question)}</p>${hint ? `<p class="sc-sub" data-qa-text="dica">${esc(hint)}</p>` : ''}${fb}</div></div>`, caption: state.step === 0 || !a ? (a ? T[3] : T[2]) : a === correct ? T[4] : T[5] };
      }
    };
  }
  // Summary cards: [{icon, text, sub}], entering one after another.
  function cards(items, time) {
    return `<div class="sc-cards">${items.map((c, n) => `<div class="sc-card" style="${M.enter(time, .1 + n * .18, .55).style}" data-qa-text="card${n}"><b aria-hidden="true">${c.icon || ''}</b><p>${c.text}</p>${c.sub ? `<span>${c.sub}</span>` : ''}</div>`).join('')}</div>`;
  }
  global.LessonKit = Object.freeze({ op, rise, diagram, split, hero, terminal, app, quiz, cards });
})(window);
