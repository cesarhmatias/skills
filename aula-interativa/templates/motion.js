/* Pure motion helpers. No clocks, timers, DOM reads or hidden random state. */
(function (global) {
  'use strict';
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const linear = x => clamp(x);
  const easeInOutCubic = x => (x = clamp(x)) < .5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2;
  const easeOutCubic = x => 1 - (1 - clamp(x)) ** 3;
  const lerp = (a, b, p) => a + (b - a) * p;
  function segment(t, start, end, easing = linear) {
    if (end <= start) return t >= end ? 1 : 0;
    return easing(clamp((t - start) / (end - start)));
  }
  function cubic(a, b, c, d, p) {
    const u = 1 - clamp(p); p = clamp(p);
    return {
      x: u ** 3 * a.x + 3 * u ** 2 * p * b.x + 3 * u * p ** 2 * c.x + p ** 3 * d.x,
      y: u ** 3 * a.y + 3 * u ** 2 * p * b.y + 3 * u * p ** 2 * c.y + p ** 3 * d.y
    };
  }
  function contain(source, destination) {
    if (source.w <= 0 || source.h <= 0) throw new Error('Source must have positive dimensions');
    const scale = Math.min(destination.w / source.w, destination.h / source.h);
    return {
      scale,
      x: destination.x + (destination.w - source.w * scale) / 2 - source.x * scale,
      y: destination.y + (destination.h - source.h * scale) / 2 - source.y * scale
    };
  }
  function seeded(seed, index) {
    let x = ((seed | 0) ^ Math.imul((index | 0) + 1, 0x9e3779b1)) >>> 0;
    x ^= x >>> 16; x = Math.imul(x, 0x85ebca6b) >>> 0;
    x ^= x >>> 13; x = Math.imul(x, 0xc2b2ae35) >>> 0;
    return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
  }
  function escape(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  }
  function number(value, { locale = 'pt-BR', digits = 1 } = {}) {
    return new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(value);
  }
  global.LessonMotion = Object.freeze({ clamp, linear, easeInOutCubic, easeOutCubic, lerp, segment, cubic, contain, seeded, escape, number });
})(window);
