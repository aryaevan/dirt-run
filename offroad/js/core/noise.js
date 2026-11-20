/* Deterministic noise and random helpers used to generate both worlds. */
(function (DR) {
  'use strict';

  function hash2(ix, iz) {
    var h = (Math.imul(ix | 0, 374761393) + Math.imul(iz | 0, 668265263)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }

  // Smooth value noise in the range -1..1
  function vnoise(x, z) {
    var ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz;
    var ux = fx * fx * (3 - 2 * fx), uz = fz * fz * (3 - 2 * fz);
    var a = hash2(ix, iz), b = hash2(ix + 1, iz), c = hash2(ix, iz + 1), d = hash2(ix + 1, iz + 1);
    return (a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz) * 2 - 1;
  }

  // Fractal noise: several octaves of vnoise
  function fbm(x, z, oct) {
    var s = 0, amp = 1, f = 1, n = 0;
    for (var i = 0; i < oct; i++) {
      s += amp * vnoise(x * f + i * 17.3, z * f - i * 9.1);
      n += amp; amp *= 0.5; f *= 2.03;
    }
    return s / n;
  }

  function smooth(a, b, x) {
    var t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  }

  // Seeded random number generator, returns a function giving 0..1
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  DR.noise = { hash2: hash2, vnoise: vnoise, fbm: fbm, smooth: smooth, mulberry32: mulberry32 };
})(window.DR);
