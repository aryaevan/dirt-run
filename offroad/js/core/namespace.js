/*
 * Global namespace shared by every script.
 *
 * The game has no build step: index.html loads plain <script> files in a fixed
 * order and each file attaches what it exports to window.DR. This keeps the game
 * runnable straight from the file system (double-click index.html).
 */
window.DR = {
  assets: {},   // 3D models and props (js/assets)
  fx: {},       // visual effects (js/fx)
  worlds: {},   // world builders (js/world)
  modes: {},    // game modes (js/modes)
  tuning: {},   // per-car physics settings (js/physics/tuning.js)

  $: function (id) { return document.getElementById(id); },

  fmtTime: function (t) {
    var m = Math.floor(t / 60), s = t - m * 60;
    return m + ':' + (s < 10 ? '0' : '') + s.toFixed(1);
  },

  fmtN: function (n) { return Math.round(n).toLocaleString('en-US'); }
};
