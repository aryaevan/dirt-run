/*
 * Entry point: owns the player's car, switches worlds and modes, and runs the
 * main loop (fixed 120 Hz physics, one render per frame).
 *
 * A mode is an object in DR.modes with:
 *   enter(), leave()
 *   live()            true while the player is driving (captures driving keys)
 *   controls()        input for the physics while live
 *   afterStep(dt)     optional, runs after each physics step
 *   update(dt, clock) once per frame: game rules, HUD, camera
 *   onKey(code)       non-driving keys (C, R, Escape)
 */
(function (DR) {
  'use strict';
  var STEP = 1 / 120;
  var player = DR.player = new DR.Vehicle();
  var built = {}, current = null, carKey = '';

  /** Show one world (building it the first time) and apply its sky and lighting. */
  DR.useWorld = function (name) {
    var w = built[name];
    if (!w) {
      w = built[name] = DR.worlds[name].build();
      DR.stage.scene.add(w.root);
    }
    for (var k in built) built[k].root.visible = (k === name);
    DR.stage.configure(w.look);
    DR.world = w;
    return w;
  };

  /** Switch the player's car. The buggy is rebuilt whenever its upgrade levels change. */
  DR.useCar = function (id) {
    var levels = DR.progress.garage.lv;
    var key = id === 'buggy' ? id + JSON.stringify(levels) : id;
    if (key === carKey) return;
    carKey = key;
    var tune = DR.tuning[id](levels);
    var model = DR.assets[id].build(tune, levels);
    if (player.group) {
      DR.stage.scene.remove(player.group);
      DR.assets.dispose(player.group);
    }
    player.setup(model, tune);
    player.carId = id;
    DR.stage.scene.add(model.group);
  };

  DR.setMode = function (id) {
    if (current) current.leave();
    DR.input.reset();
    DR.fx.particles.clear();
    current = DR.modes[id];
    DR.mode = id;
    current.enter();
  };

  DR.input.capture = function () { return !!current && current.live(); };
  DR.input.onKey = function (code) { if (current) current.onKey(code); };

  var acc = 0, last = performance.now(), clock = 0;

  function frame(now) {
    requestAnimationFrame(frame);
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now; clock += dt; acc += dt;

    var n = 0;
    while (acc >= STEP && n < 8) {
      player.step(STEP, current.live() ? current.controls() : null, DR.world);
      if (current.afterStep) current.afterStep(STEP);
      acc -= STEP; n++;
    }
    if (n === 8) acc = 0; // too far behind (tab was hidden): drop the backlog

    player.syncVisual(dt);
    DR.fx.particles.wheelDust(player, DR.world);
    DR.fx.particles.update(dt);
    current.update(dt, clock);
    DR.stage.followSun(player.S.pos);
    DR.stage.render();
  }

  DR.setMode('menu');
  requestAnimationFrame(frame);
})(window.DR);
