/*
 * Keyboard and touch input.
 *
 * DR.input.state holds the held driving keys. Driving keys are only captured
 * while the active mode says it is live (so Space and the arrow keys still work
 * on menu buttons). Other keys (C, R, Escape) are forwarded to the active mode
 * through DR.input.onKey, which main.js sets.
 */
(function (DR) {
  'use strict';

  var state = { up: false, down: false, left: false, right: false, brake: false };
  var keyMap = {
    KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down',
    KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right', Space: 'brake'
  };

  var input = {
    state: state,
    capture: function () { return false; }, // replaced by main.js
    onKey: null,                            // replaced by main.js
    reset: function () {
      for (var k in state) state[k] = false;
      document.querySelectorAll('.tbtn.on').forEach(function (b) { b.classList.remove('on'); });
    },
    // Show the on-screen buttons. `full` adds Drift and Flip (exploration only).
    showTouch: function (on, full) {
      DR.$('touch').hidden = !on;
      DR.$('tHand').hidden = !full;
      DR.$('tReset').hidden = !full;
    }
  };

  // keys typed into a form field (dev tuning panel) stay there; a focused
  // slider keeps its arrow keys but WASD still drives
  function inField(e) {
    var t = e.target;
    if (!t || !t.tagName) return false;
    if (t.tagName === 'TEXTAREA' || t.tagName === 'SELECT') return true;
    if (t.tagName !== 'INPUT') return false;
    if (t.type === 'range') return /^Arrow|^Page|^Home$|^End$/.test(e.code);
    return t.type !== 'checkbox';
  }

  window.addEventListener('keydown', function (e) {
    if (inField(e)) return;
    var k = keyMap[e.code];
    if (k && input.capture()) { state[k] = true; e.preventDefault(); }
    if (input.onKey) input.onKey(e.code);
  });
  window.addEventListener('keyup', function (e) {
    var k = keyMap[e.code];
    if (k) state[k] = false;
  });
  window.addEventListener('blur', function () { input.reset(); });

  document.querySelectorAll('.tbtn').forEach(function (btn) {
    var k = btn.getAttribute('data-k');
    function on(e) {
      e.preventDefault();
      if (k === 'reset') { if (input.onKey) input.onKey('KeyR'); return; }
      state[k] = true; btn.classList.add('on');
    }
    function off(e) {
      e.preventDefault();
      if (k !== 'reset') { state[k] = false; btn.classList.remove('on'); }
    }
    btn.addEventListener('pointerdown', on);
    btn.addEventListener('pointerup', off);
    btn.addEventListener('pointercancel', off);
    btn.addEventListener('pointerleave', off);
    btn.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  });

  DR.input = input;
})(window.DR);
