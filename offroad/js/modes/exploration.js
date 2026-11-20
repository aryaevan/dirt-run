/*
 * Exploration mode (from Dirt Run): roam the open valley in the truck or the
 * buggy and collect all eight flags as fast as you can.
 */
(function (DR) {
  'use strict';
  var $ = DR.$, fx = DR.fx.particles;

  var CAMS = [{ d: 9, h: 3.6 }, { d: 16, h: 6.5 }, { d: 5.6, h: 2.3 }];
  var CAR_HINT = {
    truck: 'Fast four-wheel drive truck, built for the open valley.',
    buggy: 'Your racing buggy, with every upgrade you bought in the garage.'
  };

  var st = { phase: 'intro', time: 0, got: 0, camMode: 0 };  // phase: intro | play | done
  var ctl = { up: false, down: false, left: false, right: false, brake: false, noThrottle: false };
  var world = null, arrow = null;
  var hFlags = $('hFlags'), hTime = $('hTime'), hNext = $('hNext'), hSpeed = $('hSpeed');

  function showHud(on) {
    ['trip', 'gauge', 'help', 'exMenuBtn'].forEach(function (id) { $(id).hidden = !on; });
  }

  function cam() { return Object.assign({ dirRate: 3, posRate: 6, ahead: 0, lookUp: 1.1 }, CAMS[st.camMode]); }

  function spawn() {
    DR.player.place(world, world.spawn.x, world.spawn.z, world.spawn.yaw);
    DR.cam.snap(DR.player, CAMS[st.camMode]);
  }

  function selectCar(id) {
    DR.progress.settings.car = id;
    DR.progress.saveSettings();
    DR.useCar(id);
    spawn();
    document.querySelectorAll('#carPick button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-car') === id));
    });
    $('carHint').textContent = CAR_HINT[id];
  }

  function resetFlags() {
    world.flags.forEach(function (f) { f.got = false; f.group.visible = true; });
    st.got = 0; st.time = 0;
  }

  function start() {
    resetFlags();
    st.phase = 'play';
    spawn();
    $('exStart').hidden = true;
    $('exDone').hidden = true;
    DR.input.showTouch(true, true);
  }

  function finish() {
    st.phase = 'done';
    DR.input.showTouch(false);
    var best = DR.progress.bestFlags, msg;
    $('doneTime').textContent = DR.fmtTime(st.time);
    if (best === null || st.time < best) {
      msg = best === null ? 'That’s your first finish. Now beat it.' : 'New best time, ' + DR.fmtTime(best) + ' was your old record.';
      DR.progress.setBestFlags(st.time);
    } else msg = 'Your best is ' + DR.fmtTime(best) + '.';
    $('doneBest').textContent = msg;
    $('exDone').hidden = false;
    $('againBtn').focus();
  }

  DR.modes.explore = {
    enter: function () {
      world = DR.useWorld('valley');
      if (!arrow) { arrow = DR.assets.makeNavArrow(); world.root.add(arrow); }
      arrow.visible = false;
      DR.player.onLost = function () { DR.player.upright(world); };
      resetFlags();
      st.phase = 'intro';
      selectCar(DR.progress.settings.car);
      showHud(true);
      $('exStart').hidden = false;
      $('exDone').hidden = true;
      $('exStartBtn').focus();
    },

    leave: function () {
      showHud(false);
      $('exStart').hidden = true;
      $('exDone').hidden = true;
      DR.input.showTouch(false);
      arrow.visible = false;
      st.phase = 'intro';
    },

    live: function () { return st.phase === 'play'; },

    controls: function () {
      var i = DR.input.state;
      ctl.up = i.up; ctl.down = i.down; ctl.left = i.left; ctl.right = i.right; ctl.brake = i.brake;
      return ctl;
    },

    update: function (dt, clock) {
      var v = DR.player, P = v.S.pos, playing = st.phase === 'play';
      if (playing) st.time += dt;

      // wave the flags, collect the ones we drive through, find the nearest
      var nearest = null, nd = Infinity;
      for (var i = 0; i < world.flags.length; i++) {
        var f = world.flags[i];
        if (f.got) continue;
        f.cloth.rotation.y = Math.sin(clock * 3 + f.phase) * 0.35;
        var dist = Math.hypot(P.x - f.x, P.z - f.z);
        if (playing && dist < 6.5 && Math.abs(P.y - f.y) < 8) {
          f.got = true; f.group.visible = false; st.got++;
          fx.burst(f.x, f.y + 1, f.z, 40, 8, [2, 6], 1, 0.6, 0.25, 1.2, 0.9);
          if (st.got === world.flags.length) { finish(); playing = false; }
          continue;
        }
        if (dist < nd) { nd = dist; nearest = f; }
      }
      world.beamMat.opacity = 0.18 + Math.sin(clock * 2.5) * 0.06;
      arrow.visible = !!nearest && playing;
      if (arrow.visible) {
        arrow.position.set(P.x, P.y + 2.9, P.z);
        arrow.lookAt(nearest.x, P.y + 2.9, nearest.z);
      }

      DR.cam.chase(dt, v, world, cam());

      hFlags.textContent = st.got + ' / ' + world.flags.length;
      hTime.textContent = DR.fmtTime(st.time);
      hNext.textContent = nearest ? Math.round(nd) + ' m' : '–';
      hSpeed.textContent = Math.round(Math.abs(v.forwardSpeed()) * 3.6);
    },

    onKey: function (code) {
      if (code === 'KeyR' && st.phase === 'play') DR.player.upright(world);
      if (code === 'KeyC') st.camMode = (st.camMode + 1) % CAMS.length;
      if (code === 'Escape') DR.setMode('menu');
    }
  };

  document.querySelectorAll('#carPick button').forEach(function (b) {
    b.addEventListener('click', function () { selectCar(b.getAttribute('data-car')); });
  });
  $('exStartBtn').addEventListener('click', start);
  $('againBtn').addEventListener('click', start);
  $('exBackBtn').addEventListener('click', function () { DR.setMode('menu'); });
  $('doneMenuBtn').addEventListener('click', function () { DR.setMode('menu'); });
  $('exMenuBtn').addEventListener('click', function () { DR.setMode('menu'); });
})(window.DR);
