/* Browser script: inline with pack.mjs for a self-contained lesson. */
(function (global) {
  'use strict';
  const clone = value => structuredClone(value);
  function create({ root, title, slides, resources = [] }) {
    root = typeof root === 'string' ? document.querySelector(root) : root;
    if (!root || !slides?.length) throw new Error('A mount element and slides are required');
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
    });
    const esc = global.LessonMotion.escape;
    const $ = role => root.querySelector(`[data-player="${role}"]`);
    let state = { slide: 0, step: 0, time: 0, inputs: {} };
    let playing = false, sequence = false, clock = 0, raf = 0;
    const drafts = new Map();
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    root.innerHTML = `<div class="lesson-shell"><header><p class="lesson-brand">${esc(title)}</p><nav data-player="index" aria-label="Índice"></nav></header><main><p data-player="chapter" class="lesson-chapter"></p><h1 data-player="title" data-qa-text="lesson-title"></h1><p data-player="description" class="lesson-description"></p><section data-player="scene" data-qa-boundary="scene" aria-label="Demonstração"></section><section data-player="inputs" class="lesson-inputs" aria-label="Experimentar"></section><p data-player="caption" class="lesson-caption" aria-live="polite"></p><div class="lesson-scene-controls"><button data-command="previousStep" aria-label="Etapa anterior">← Etapa</button><button data-command="play" data-player="play">Reproduzir cena</button><button data-command="pause">Pausar</button><button data-command="reset">Reiniciar cena</button><button data-command="nextStep" aria-label="Próxima etapa">Etapa →</button><span data-player="step-count"></span></div><footer><button data-command="previousSlide">← Slide</button><span data-player="slide-count"></span><button data-command="nextSlide">Slide →</button></footer></main></div>`;
    $('index').innerHTML = slides.map((s, i) => `<button data-slide="${i}" aria-label="Slide ${i + 1}: ${esc(s.title)}">${i + 1}</button>`).join('');
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
        if (control.options && !control.options.some(o => String(o.value) === String(result[key]))) throw new Error(`Invalid option ${key}`);
      }
      return result;
    }
    function getState() { return clone(state); }
    function duration() { return slides[state.slide].steps[state.step].duration; }
    function pause() {
      playing = false; cancelAnimationFrame(raf);
      $('play')?.setAttribute('aria-pressed', 'false');
      $('caption')?.setAttribute('aria-live', 'polite');
    }
    function render() {
      const slide = slides[state.slide], step = slide.steps[state.step];
      const context = { state: getState(), slide, step, time: state.time, progress: step.duration ? Math.min(1, state.time / step.duration) : 1, motion: global.LessonMotion };
      const output = slide.render(context);
      $('scene').innerHTML = typeof output === 'string' ? output : output.html;
      const caption = typeof output === 'string' ? step.label : output.caption ?? step.label;
      // Do not announce animated numeric changes dozens of times per second.
      if ($('caption').textContent !== caption) $('caption').textContent = caption;
      $('step-count').textContent = `${state.step + 1} / ${slide.steps.length}`;
      $('slide-count').textContent = `${state.slide + 1} / ${slides.length}`;
      for (const [command, disabled] of [['previousStep', state.step === 0], ['nextStep', state.step === slide.steps.length - 1], ['previousSlide', state.slide === 0], ['nextSlide', state.slide === slides.length - 1]]) root.querySelector(`[data-command="${command}"]`).disabled = disabled;
    }
    function mountInputs() {
      const controls = slides[state.slide].controls || [];
      $('inputs').innerHTML = controls.map(c => {
        const id = `input-${state.slide}-${c.key}`, value = state.inputs[c.key];
        if (c.type === 'select') return `<label for="${id}">${esc(c.label)}</label><select id="${id}" data-input="${esc(c.key)}">${c.options.map(o => `<option value="${esc(o.value)}" ${String(value) === String(o.value) ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}</select>`;
        if (c.type === 'textarea') return `<label for="${id}">${esc(c.label)}</label><textarea id="${id}" data-input="${esc(c.key)}">${esc(value)}</textarea>`;
        return `<label for="${id}">${esc(c.label)}</label><input id="${id}" data-input="${esc(c.key)}" type="${c.type === 'range' ? 'range' : 'number'}" min="${c.min}" max="${c.max}" step="${c.step || 1}" value="${esc(value)}">`;
      }).join('');
    }
    function mountSlide() {
      const slide = slides[state.slide];
      $('title').textContent = slide.title;
      $('chapter').textContent = slide.chapter || '';
      $('description').textContent = slide.description || '';
      $('index').querySelectorAll('button').forEach((b, i) => i === state.slide ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current'));
      mountInputs();
    }
    function seek(query = {}) {
      pause();
      const i = query.slide ?? 0;
      if (!Number.isInteger(i) || i < 0 || i >= slides.length) throw new Error('Slide index out of range');
      const k = query.step ?? 0;
      if (!Number.isInteger(k) || k < 0 || k >= slides[i].steps.length) throw new Error('Step index out of range');
      const t = query.time ?? slides[i].steps[k].duration;
      if (!Number.isFinite(t) || t < 0) throw new Error('Invalid local time');
      state = { slide: i, step: k, time: Math.min(t, slides[i].steps[k].duration), inputs: normalize(i, query.inputs || {}) };
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
        if (sequence && state.step < slides[state.slide].steps.length - 1) {
          state.step++; state.time = 0; clock = now;
        } else { pause(); return; }
      }
      raf = requestAnimationFrame(tick);
    }
    function start(wholeScene) {
      sequence = wholeScene;
      if (media.matches) { state.time = duration(); pause(); render(); return; }
      playing = true; $('play').setAttribute('aria-pressed', 'true'); $('caption').setAttribute('aria-live', 'off');
      clock = performance.now() - state.time * 1000;
      raf = requestAnimationFrame(tick);
    }
    function nextStep({ animate = true } = {}) {
      pause();
      if (state.step >= slides[state.slide].steps.length - 1) return getState();
      state.step++; state.time = animate && !media.matches ? 0 : duration();
      render();
      if (animate && !media.matches) start(false);
      return getState();
    }
    function previousStep() { pause(); state.step = Math.max(0, state.step - 1); state.time = duration(); render(); }
    function reset() { pause(); state.step = 0; state.time = duration(); render(); }
    function play() {
      pause();
      if (state.time >= duration()) {
        if (state.step === slides[state.slide].steps.length - 1) { state.step = 0; state.time = 0; }
        else { state.step++; state.time = 0; }
      }
      start(true);
    }
    function goToSlide(i) {
      i = Math.max(0, Math.min(slides.length - 1, i));
      drafts.set(state.slide, getState());
      seek(drafts.get(i) || { slide: i });
    }
    const commands = { nextStep, previousStep, reset, play, pause, previousSlide: () => goToSlide(state.slide - 1), nextSlide: () => goToSlide(state.slide + 1) };
    root.addEventListener('click', event => {
      const button = event.target.closest('button');
      if (!button || !root.contains(button) || button.disabled) return;
      if (button.dataset.slide !== undefined) goToSlide(Number(button.dataset.slide));
      else if (commands[button.dataset.command]) commands[button.dataset.command]();
    });
    root.addEventListener('input', event => {
      const key = event.target.dataset.input;
      if (key) updateInputs({ [key]: event.target.type === 'range' || event.target.type === 'number' ? Number(event.target.value) : event.target.value });
    });
    document.addEventListener('keydown', event => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || document.querySelector('dialog[open]') || event.target.closest('input,textarea,select,[contenteditable="true"]')) return;
      const action = { ArrowRight: commands.nextSlide, ArrowLeft: commands.previousSlide, ArrowUp: previousStep, ArrowDown: nextStep }[event.key];
      if (action) { event.preventDefault(); action(); }
      if (event.code === 'Space' && !event.target.closest('button,a,summary')) { event.preventDefault(); playing ? pause() : play(); }
    });
    const api = {
      ready: false, seek, getState, updateInputs, nextStep, previousStep, reset, play, pause,
      get playing() { return playing; },
      getManifest: () => ({ title, slides: slides.map(s => ({ id: s.id, title: s.title, steps: s.steps.map(step => ({ ...step })), initialInputs: clone(s.initialInputs || {}), auditCases: clone(s.auditCases || []) })) }),
      getCaptureRoot: () => $('scene')
    };
    api.readyPromise = Promise.all([
      document.fonts.ready,
      ...resources.map(src => new Promise((resolve, reject) => { const image = new Image(); image.onload = resolve; image.onerror = () => reject(new Error(`Asset failed: ${src.slice(0, 100)}`)); image.src = src; }))
    ]).then(() => { seek({ slide: 0 }); api.ready = true; return api; }).catch(error => { api.error = error.message; $('scene').textContent = `Não foi possível preparar a aula: ${error.message}`; throw error; });
    return api;
  }
  global.LessonPlayer = Object.freeze({ create });
})(window);
