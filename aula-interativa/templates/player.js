/* Guided lesson player. Inline with pack.mjs for a self-contained lesson.
   The learner sees one primary action (Continuar) and one narration line; the
   capture tools drive the same state through seek/nextStep/play. */
(function (global) {
  'use strict';
  const clone = value => structuredClone(value);
  const UI = {
    'pt-BR': { next: 'Continuar', finish: 'Fim da aula', back: 'Voltar', replay: 'Rever animação', sources: 'Fontes', close: 'Fechar', answer: 'Escolha uma resposta', index: 'Progresso da aula', slide: 'Tela', keys: 'ou use → e ←', failed: 'Não foi possível preparar a aula', none: 'Esta tela não depende de fonte externa.' },
    en: { next: 'Continue', finish: 'End of lesson', back: 'Back', replay: 'Replay animation', sources: 'Sources', close: 'Close', answer: 'Choose an answer', index: 'Lesson progress', slide: 'Screen', keys: 'or use → and ←', failed: 'The lesson could not be prepared', none: 'This screen does not rely on an external source.' },
    es: { next: 'Continuar', finish: 'Fin de la clase', back: 'Volver', replay: 'Repetir animación', sources: 'Fuentes', close: 'Cerrar', answer: 'Elige una respuesta', index: 'Progreso de la clase', slide: 'Pantalla', keys: 'o usa → y ←', failed: 'No se pudo preparar la clase', none: 'Esta pantalla no depende de una fuente externa.' }
  };
  function create({ root, title, slides, sources = [], lang = 'pt-BR', resources = [] }) {
    root = typeof root === 'string' ? document.querySelector(root) : root;
    if (!root || !slides?.length) throw new Error('A mount element and slides are required');
    const t = UI[lang] || UI['pt-BR'];
    const ids = new Set();
    slides.forEach(slide => {
      if (!slide.id || ids.has(slide.id)) throw new Error('Slide IDs must be unique');
      ids.add(slide.id);
      if (typeof slide.render !== 'function' || !slide.steps?.length) throw new Error(`Invalid scene ${slide.id}`);
      const steps = new Set();
      slide.steps.forEach(step => {
        if (!step.id || steps.has(step.id) || !Number.isFinite(step.duration) || step.duration < 0) throw new Error(`Invalid step in ${slide.id}`);
        steps.add(step.id);
      });
      for (const id of slide.sources || []) if (!sources.some(s => s.id === id)) throw new Error(`Unknown source ${id} in ${slide.id}`);
    });
    const esc = global.LessonMotion.escape;
    const $ = role => root.querySelector(`[data-player="${role}"]`);
    let state = { slide: 0, step: 0, time: 0, inputs: {} };
    let playing = false, sequence = false, clock = 0, raf = 0, renderedSlide = -1;
    const drafts = new Map();
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    root.innerHTML = `<div class="lp" data-kind="">
<header class="lp-top"><p class="lp-course">${esc(title)}</p><nav class="lp-progress" data-player="index" aria-label="${t.index}"></nav><button class="lp-ghost" data-command="sources" aria-expanded="false">${t.sources}</button></header>
<main class="lp-stage"><div class="lp-head"><p class="lp-kicker" data-player="chapter"></p><h1 data-player="title" data-qa-text="lesson-title"></h1></div>
<section class="lp-scene" data-player="scene" data-qa-boundary="scene" aria-live="off"></section>
<section class="lp-inputs" data-player="inputs"></section></main>
<footer class="lp-bar"><button class="lp-ghost lp-back" data-command="back">← ${t.back}</button>
<div class="lp-narration"><p data-player="caption" aria-live="polite"></p><div class="lp-dots" data-player="steps" aria-hidden="true"></div></div>
<button class="lp-ghost lp-replay" data-command="replay" aria-label="${t.replay}" title="${t.replay}">↺</button>
<div class="lp-go"><button class="lp-primary" data-command="continue" data-player="continue"></button><span class="lp-keys">${t.keys}</span></div></footer>
<aside class="lp-drawer" data-player="drawer" hidden><div class="lp-drawer-head"><h2>${t.sources}</h2><button class="lp-ghost" data-command="sources">${t.close}</button></div><div data-player="sources"></div></aside></div>`;
    $('index').innerHTML = slides.map((s, i) => `<button data-slide="${i}" aria-label="${t.slide} ${i + 1}: ${esc(s.title)}"><span></span></button>`).join('');
    function defaults(i) { return clone(slides[i].initialInputs || {}); }
    function normalize(i, inputs) {
      const result = { ...defaults(i), ...clone(inputs) };
      for (const control of slides[i].controls || []) {
        const key = control.key;
        if (control.type === 'range' || control.type === 'number') {
          const value = Number(result[key]);
          if (!Number.isFinite(value)) throw new Error(`Invalid numeric input ${key}`);
          result[key] = Math.max(control.min, Math.min(control.max, value));
        }
        if (control.options && !control.options.some(o => String(o.value) === String(result[key])) && result[key] !== '') throw new Error(`Invalid option ${key}`);
      }
      return result;
    }
    function getState() { return clone(state); }
    function duration() { return slides[state.slide].steps[state.step].duration; }
    const lastStep = () => state.step === slides[state.slide].steps.length - 1;
    const lastSlide = () => state.slide === slides.length - 1;
    // A practice step may hold the learner until an answer exists: slide.ready(state) === false.
    const blocked = () => !playing && slides[state.slide].ready?.(getState()) === false;
    function pause() {
      playing = false; cancelAnimationFrame(raf);
      $('caption')?.setAttribute('aria-live', 'polite');
      if ($('continue')) updateBar();
    }
    function updateBar() {
      const slide = slides[state.slide], step = slide.steps[state.step];
      const go = $('continue'), wait = blocked();
      go.disabled = wait || (!playing && lastStep() && lastSlide());
      const following = lastStep() ? null : slide.steps[state.step + 1];
      go.textContent = wait ? (slide.waitLabel || t.answer) : !playing && !following && lastSlide() ? t.finish : `${(!playing && following?.cta) || t.next} →`;
      root.querySelector('[data-command="back"]').disabled = state.slide === 0 && state.step === 0;
      root.querySelector('[data-command="replay"]').hidden = !(step.duration > 0);
    }
    function render() {
      const slide = slides[state.slide], step = slide.steps[state.step];
      const context = { state: getState(), slide, step, time: state.time, progress: step.duration ? Math.min(1, state.time / step.duration) : 1, motion: global.LessonMotion };
      const output = slide.render(context);
      // Rebuilding the scene would reset a scrollable diagram to 0 on every frame; keep the learner's position.
      const scrolled = renderedSlide === state.slide ? [...$('scene').querySelectorAll('[data-qa-scroll]')].map(e => [e.scrollLeft, e.scrollTop]) : [];
      $('scene').innerHTML = typeof output === 'string' ? output : output.html;
      $('scene').querySelectorAll('[data-qa-scroll]').forEach((e, i) => { if (scrolled[i]) [e.scrollLeft, e.scrollTop] = scrolled[i]; });
      renderedSlide = state.slide;
      const caption = typeof output === 'string' ? step.label : output.caption ?? step.label;
      // Do not announce animated numeric changes dozens of times per second.
      if ($('caption').textContent !== caption) $('caption').textContent = caption;
      $('steps').innerHTML = slide.steps.length > 1 ? slide.steps.map((_, i) => `<i class="${i < state.step ? 'done' : i === state.step ? 'now' : ''}"></i>`).join('') : '';
      root.querySelectorAll('[data-output]').forEach(o => { const c = (slide.controls || []).find(c => c.key === o.dataset.output); o.textContent = c.format ? c.format(state.inputs[c.key]) : `${state.inputs[c.key]}${c.unit || ''}`; });
      root.querySelectorAll('[data-choice]').forEach(b => b.setAttribute('aria-pressed', String(String(state.inputs[b.dataset.choice]) === b.dataset.value)));
      updateBar();
    }
    function mountInputs() {
      const controls = slides[state.slide].controls || [];
      $('inputs').hidden = !controls.length;
      $('inputs').innerHTML = controls.map(c => {
        const id = `input-${state.slide}-${c.key}`, value = state.inputs[c.key];
        if (c.type === 'choice') return `<div class="lp-choices" role="group" aria-label="${esc(c.label)}"><span class="lp-label">${esc(c.label)}</span>${c.options.map(o => `<button class="lp-choice" data-choice="${esc(c.key)}" data-value="${esc(o.value)}" aria-pressed="false">${esc(o.label)}</button>`).join('')}</div>`;
        if (c.type === 'select') return `<label class="lp-label" for="${id}">${esc(c.label)}</label><select id="${id}" data-input="${esc(c.key)}">${c.options.map(o => `<option value="${esc(o.value)}" ${String(value) === String(o.value) ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}</select>`;
        if (c.type === 'textarea') return `<label class="lp-label" for="${id}">${esc(c.label)}</label><textarea id="${id}" data-input="${esc(c.key)}">${esc(value)}</textarea>`;
        const output = c.type === 'range' ? `<output for="${id}" class="lp-value" data-output="${esc(c.key)}"></output>` : '';
        return `<label class="lp-label" for="${id}">${esc(c.label)}</label><input id="${id}" data-input="${esc(c.key)}" type="${c.type === 'range' ? 'range' : 'number'}" min="${c.min}" max="${c.max}" step="${c.step || 1}" value="${esc(value)}">${output}`;
      }).join('');
    }
    function mountSources() {
      const own = slides[state.slide].sources || [];
      const item = s => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a>${s.note ? `<p>${esc(s.note)}</p>` : ''}</li>`;
      $('sources').innerHTML = `<h3>${esc(slides[state.slide].title)}</h3>${own.length ? `<ul>${sources.filter(s => own.includes(s.id)).map(item).join('')}</ul>` : `<p>${t.none}</p>`}${sources.length ? `<h3>${t.sources}</h3><ul>${sources.map(item).join('')}</ul>` : ''}`;
    }
    function mountSlide() {
      const slide = slides[state.slide];
      root.querySelector('.lp').dataset.kind = slide.kind || '';
      root.querySelector('.lp').dataset.layout = slide.layout || 'stage';
      $('title').textContent = slide.title;
      $('chapter').textContent = slide.kicker || slide.chapter || '';
      $('index').querySelectorAll('button').forEach((b, i) => { b.className = i < state.slide ? 'done' : ''; i === state.slide ? b.setAttribute('aria-current', 'step') : b.removeAttribute('aria-current'); });
      mountInputs(); mountSources();
    }
    function seek(query = {}) {
      pause();
      const i = query.slide ?? 0;
      if (!Number.isInteger(i) || i < 0 || i >= slides.length) throw new Error('Slide index out of range');
      const k = query.step ?? 0;
      if (!Number.isInteger(k) || k < 0 || k >= slides[i].steps.length) throw new Error('Step index out of range');
      const time = query.time ?? slides[i].steps[k].duration;
      if (!Number.isFinite(time) || time < 0) throw new Error('Invalid local time');
      state = { slide: i, step: k, time: Math.min(time, slides[i].steps[k].duration), inputs: normalize(i, query.inputs || {}) };
      mountSlide(); render();
      return getState();
    }
    function updateInputs(patch) {
      pause(); state.inputs = normalize(state.slide, { ...state.inputs, ...patch });
      render(); return getState();
    }
    function tick(now) {
      if (!playing) return;
      state.time = Math.min(duration(), (now - clock) / 1000);
      render();
      if (state.time >= duration()) {
        if (sequence && !lastStep()) { state.step++; state.time = 0; clock = now; }
        else { pause(); return; }
      }
      raf = requestAnimationFrame(tick);
    }
    function start(wholeScene) {
      sequence = wholeScene;
      if (media.matches || duration() === 0) { state.time = duration(); pause(); render(); return; }
      playing = true; $('caption').setAttribute('aria-live', 'off');
      clock = performance.now() - state.time * 1000;
      raf = requestAnimationFrame(tick);
    }
    function nextStep({ animate = true } = {}) {
      pause();
      if (lastStep()) return getState();
      state.step++; state.time = animate && !media.matches ? 0 : duration();
      render();
      if (animate && !media.matches) start(false);
      return getState();
    }
    function previousStep() { pause(); state.step = Math.max(0, state.step - 1); state.time = duration(); render(); return getState(); }
    function reset() { pause(); state.step = 0; state.time = 0; render(); start(false); return getState(); }
    function play() {
      pause();
      if (state.time >= duration()) {
        if (lastStep()) { state.step = 0; state.time = 0; }
        else { state.step++; state.time = 0; }
      }
      start(true);
    }
    function replay() { pause(); state.time = 0; render(); start(false); }
    function goToSlide(i, { atEnd = false } = {}) {
      i = Math.max(0, Math.min(slides.length - 1, i));
      drafts.set(state.slide, state.inputs);
      const step = atEnd ? slides[i].steps.length - 1 : 0;
      seek({ slide: i, step, time: atEnd ? undefined : 0, inputs: drafts.get(i) || {} });
      if (!atEnd) start(false); // entering a screen plays its first step, then waits
    }
    // The single forward action: finish a running step, else advance a step, else the next screen.
    function proceed() {
      if (playing) { pause(); state.time = duration(); render(); return getState(); }
      if (blocked()) return getState();
      if (!lastStep()) return nextStep();
      if (!lastSlide()) goToSlide(state.slide + 1);
      return getState();
    }
    function back() {
      if (playing || state.step > 0) return previousStep();
      if (state.slide > 0) goToSlide(state.slide - 1, { atEnd: true });
      return getState();
    }
    function toggleSources(force) {
      const drawer = $('drawer'), open = force ?? drawer.hidden;
      drawer.hidden = !open;
      root.querySelectorAll('[data-command="sources"]')[0].setAttribute('aria-expanded', String(open));
    }
    const commands = { continue: proceed, back, replay, sources: () => toggleSources(), nextStep, previousStep, reset, play, pause, previousSlide: () => goToSlide(state.slide - 1), nextSlide: () => goToSlide(state.slide + 1) };
    root.addEventListener('click', event => {
      const button = event.target.closest('button');
      if (!button || !root.contains(button) || button.disabled) return;
      if (button.dataset.slide !== undefined) goToSlide(Number(button.dataset.slide));
      else if (button.dataset.choice) updateInputs({ [button.dataset.choice]: button.dataset.value });
      else if (commands[button.dataset.command]) commands[button.dataset.command]();
    });
    root.addEventListener('input', event => {
      const key = event.target.dataset.input;
      if (key) updateInputs({ [key]: event.target.type === 'range' || event.target.type === 'number' ? Number(event.target.value) : event.target.value });
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !$('drawer').hidden) { toggleSources(false); return; }
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || document.querySelector('dialog[open]') || event.target.closest('input,textarea,select,[contenteditable="true"]')) return;
      const action = { ArrowRight: proceed, ArrowLeft: back, PageDown: proceed, PageUp: back }[event.key];
      if (action) { event.preventDefault(); action(); }
      if (event.code === 'Space' && !event.target.closest('button,a,summary')) { event.preventDefault(); proceed(); }
    });
    const api = {
      ready: false, seek, getState, updateInputs, nextStep, previousStep, reset, play, pause, replay, proceed, back,
      get playing() { return playing; },
      getManifest: () => ({ title, lang, sources: clone(sources), slides: slides.map(s => ({ id: s.id, kind: s.kind || '', kicker: s.kicker || s.chapter || '', title: s.title, sources: clone(s.sources || []), auditDefault: s.auditDefault !== false, steps: s.steps.map(step => ({ ...step })), initialInputs: clone(s.initialInputs || {}), auditCases: clone(s.auditCases || []) })) }),
      getCaptureRoot: () => $('scene')
    };
    api.readyPromise = Promise.all([
      document.fonts.ready,
      ...resources.map(src => new Promise((resolve, reject) => { const image = new Image(); image.onload = resolve; image.onerror = () => reject(new Error(`Asset failed: ${src.slice(0, 100)}`)); image.src = src; }))
    ]).then(() => { seek({ slide: 0, step: 0, time: 0 }); start(false); api.ready = true; return api; }).catch(error => { api.error = error.message; $('scene').textContent = `${t.failed}: ${error.message}`; throw error; });
    return api;
  }
  global.LessonPlayer = Object.freeze({ create });
})(window);
