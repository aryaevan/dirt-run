/*
 * Racing mode (from Ridge Builder): drive the buggy up the ridge on one tank
 * of fuel, collect coins, then spend them on upgrades in the garage.
 */
(function (DR) {
  'use strict';
  var THREE = window.THREE, $ = DR.$, fx = DR.fx.particles, fmtN = DR.fmtN;

  var PARTS = [
    { id: 'engine', name: 'Engine', max: 6, base: 120, info: function () { return 'More pulling power and top speed for steep climbs.'; } },
    { id: 'tyres', name: 'Tyres', max: 6, base: 100, info: function () { return 'Bigger, grippier tyres that roll over logs and hold on slopes.'; } },
    { id: 'susp', name: 'Suspension', max: 6, base: 90, info: function () { return 'Longer, stiffer travel so bumps and landings don’t bottom out.'; } },
    { id: 'fuel', name: 'Fuel tank', max: 6, base: 80, info: function () { return 'Drive longer between fuel cans.'; } },
    { id: 'drive', name: 'Drivetrain', max: 3, base: 260, info: function (l) { return l < 1 ? 'Rear-wheel drive. Next level adds four-wheel drive.' : 'Four-wheel drive with a lower crawling gear at each level.'; } },
    { id: 'chassis', name: 'Roll cage', max: 5, base: 110, info: function () { return 'Steadier chassis that resists flipping, plus better control in the air.'; } }
  ];
  function cost(p, l) { return Math.round(p.base * Math.pow(1.75, l) / 10) * 10; }

  var CAMS = [{ d: 7, h: 2.8 }, { d: 12, h: 5 }];
  var game = { phase: 'garage', fuel: 0, dist: 0, coins: 0, flipT: 0, dryT: 0, camMode: 0, orbit: 0 }; // phase: garage | run | end
  var ctl = { up: false, down: false, left: false, right: false, brake: false, noThrottle: false };
  var world = null, _up = new THREE.Vector3();
  var smallScreen = window.matchMedia('(max-width:640px)');
  var hDist = $('hDist'), hCoins = $('hCoins'), fuelFill = $('fuelFill'), fuelBar = $('fuelBar');

  function save() { return DR.progress.garage; }

  function rebuildCar() {
    DR.useCar('buggy');
    DR.player.place(world, 0, 0, 0);
  }

  /* ---------- garage ---------- */
  function renderGarage() {
    var s = save();
    $('gCoins').textContent = fmtN(s.coins);
    $('gBest').textContent = s.best > 0 ? 'Best run: ' + fmtN(s.best) + ' m' : 'No runs yet';
    var html = '';
    PARTS.forEach(function (p) {
      var l = s.lv[p.id], maxed = l >= p.max, c = maxed ? 0 : cost(p, l), pips = '';
      for (var k = 0; k < p.max; k++) pips += '<span class="pip' + (k < l ? ' on' : '') + '"></span>';
      html += '<div class="part"><div><h3>' + p.name + '</h3><p>' + p.info(l) + '</p>' +
        '<div class="pips" aria-label="Level ' + l + ' of ' + p.max + '">' + pips + '</div></div>' +
        '<button class="buy" data-id="' + p.id + '"' + (maxed || s.coins < c ? ' disabled' : '') + '>' +
        (maxed ? 'Maxed' : fmtN(c) + ' coins') + '</button></div>';
    });
    $('parts').innerHTML = html;
  }

  $('parts').addEventListener('click', function (e) {
    var b = e.target.closest('.buy'); if (!b || b.disabled) return;
    var s = save(), id = b.getAttribute('data-id');
    var p = PARTS.filter(function (x) { return x.id === id; })[0], l = s.lv[id], c = cost(p, l);
    if (l >= p.max || s.coins < c) return;
    s.coins -= c; s.lv[id] = l + 1;
    DR.progress.saveGarage();
    rebuildCar();
    renderGarage();
    var nb = document.querySelector('.buy[data-id="' + id + '"]');
    if (nb && !nb.disabled) nb.focus();
  });

  var resetArmed = false, resetTimer = 0;
  $('resetBtn').addEventListener('click', function () {
    var self = this;
    if (!resetArmed) {
      resetArmed = true; self.textContent = 'Click again to erase everything'; self.classList.add('arm');
      clearTimeout(resetTimer);
      resetTimer = setTimeout(function () { resetArmed = false; self.textContent = 'Reset progress'; self.classList.remove('arm'); }, 3000);
      return;
    }
    DR.progress.resetGarage();
    resetArmed = false; self.textContent = 'Reset progress'; self.classList.remove('arm');
    rebuildCar();
    renderGarage();
  });

  /* ---------- runs ---------- */
  function showRunUI(on) {
    $('garage').hidden = on;
    $('hud').hidden = !on;
    $('quitBtn').hidden = !on;
    $('keys').hidden = !on;
    DR.input.showTouch(on, false);
  }

  function startRun() {
    world.coinSet.reset();
    world.cans.forEach(function (c) { c.got = false; c.group.visible = true; });
    DR.player.place(world, 0, 0, 0);
    game.fuel = DR.player.T.fuel; game.dist = 0; game.coins = 0; game.flipT = 0; game.dryT = 0;
    game.phase = 'run';
    DR.input.reset();
    showRunUI(true);
    $('result').hidden = true;
    DR.cam.snap(DR.player, CAMS[game.camMode]);
  }

  function endRun(title, why) {
    if (game.phase !== 'run') return;
    game.phase = 'end';
    var s = save();
    var dist = Math.max(0, Math.floor(game.dist)), bonus = Math.floor(dist / 4), earned = game.coins + bonus;
    s.coins += earned; s.runs++;
    var record = dist > s.best; if (record) s.best = dist;
    DR.progress.saveGarage();
    $('rTitle').textContent = title;
    $('rWhy').textContent = record && s.runs > 1 ? 'New record. ' + why : why;
    $('rDist').textContent = fmtN(dist) + ' m';
    $('rCoins').textContent = fmtN(game.coins);
    $('rBonus').textContent = fmtN(bonus);
    $('rTotal').textContent = '+' + fmtN(earned);
    $('hud').hidden = true; $('quitBtn').hidden = true; $('keys').hidden = true;
    DR.input.showTouch(false);
    $('result').hidden = false;
    $('backBtn').focus();
  }

  function toGarage() {
    game.phase = 'garage';
    $('result').hidden = true;
    showRunUI(false);
    DR.player.place(world, 0, 0, 0);
    renderGarage();
    $('runBtn').focus();
  }

  function orbitOpts(snap) {
    var small = smallScreen.matches;
    return { angle: game.orbit, radius: small ? 7.5 : 6.5, height: 2.4, lookY: small ? -0.6 : 0.3, shift: small ? 0 : 1.6, snap: snap };
  }

  DR.modes.race = {
    enter: function () {
      world = DR.useWorld('ridge');
      DR.player.onLost = function () {
        var z = DR.player.S.pos.z;
        DR.player.place(world, 0, isFinite(z) ? z : 0, 0);
      };
      rebuildCar();
      game.orbit = 0;
      toGarage();
      DR.cam.orbit(0, DR.player, orbitOpts(true));
    },

    leave: function () {
      game.phase = 'garage';
      ['garage', 'hud', 'quitBtn', 'keys', 'result'].forEach(function (id) { $(id).hidden = true; });
      DR.input.showTouch(false);
    },

    live: function () { return game.phase === 'run'; },

    controls: function () {
      var i = DR.input.state;
      ctl.up = i.up; ctl.down = i.down; ctl.left = i.left; ctl.right = i.right;
      ctl.noThrottle = game.fuel <= 0;
      return ctl;
    },

    // burn fuel once per physics step
    afterStep: function (dt) {
      if (game.phase !== 'run') return;
      var t = DR.player.S.throttle;
      game.fuel = Math.max(0, game.fuel - dt * (t !== 0 ? 0.25 + 0.75 * Math.abs(t) : 0.12));
    },

    update: function (dt, clock) {
      var v = DR.player, P = v.S.pos, run = game.phase === 'run';
      var speed = v.S.vel.length();
      v.up(_up);

      // coins: spin the ones nearby, collect the ones we touch
      var coins = world.coins, set = world.coinSet, spin = clock * 2.5, dirty = false;
      for (var i = 0; i < coins.length; i++) {
        var c = coins[i];
        if (c.got || Math.abs(c.z - P.z) >= 70) continue;
        set.write(i, spin + i * 0.3); dirty = true;
        if (run && Math.abs(c.z - P.z) < 2 && Math.abs(c.x - P.x) < 1.9 && Math.abs(c.y - P.y) < 2.4) {
          c.got = true; set.write(i, 0); game.coins += c.v;
          fx.burst(c.x, c.y, c.z, 8, 4, [1, 3], 0.95, 0.78, 0.2, 0.6, 0.5);
        }
      }
      if (dirty) set.mesh.instanceMatrix.needsUpdate = true;

      // fuel cans refill the tank
      world.canBeamMat.opacity = 0.16 + Math.sin(clock * 2.5) * 0.06;
      world.cans.forEach(function (cn) {
        if (cn.got) return;
        cn.body.rotation.y = clock * 1.5;
        if (run && Math.abs(cn.z - P.z) < 2.4 && Math.abs(cn.x - P.x) < 2.2 && Math.abs(cn.y - P.y) < 3) {
          cn.got = true; cn.group.visible = false; game.fuel = v.T.fuel;
        }
      });

      if (run) {
        game.dist = Math.max(game.dist, P.z - 4);
        if (_up.y < 0.15) game.flipT += dt; else game.flipT = 0;
        if (game.fuel <= 0 && speed < 0.7) game.dryT += dt; else game.dryT = 0;
        if (game.flipT > 2.2) endRun('Flipped over', 'The buggy landed on its roof. A roll cage helps it stay upright.');
        else if (game.dryT > 1.8) endRun('Out of fuel', 'A bigger tank gets you to the next fuel can.');
        else if (P.z >= world.TRACK_END) endRun('Summit reached', 'You drove the whole ridge. Nothing left to climb.');
        hDist.textContent = fmtN(Math.max(0, game.dist));
        hCoins.textContent = fmtN(game.coins) + ' coins';
        var fr = game.fuel / v.T.fuel;
        fuelFill.style.width = (fr * 100).toFixed(1) + '%';
        fuelBar.classList.toggle('low', fr < 0.25);
      }

      if (game.phase === 'garage') {
        game.orbit += dt * 0.25;
        DR.cam.orbit(dt, v, orbitOpts(false));
      } else {
        DR.cam.chase(dt, v, world, Object.assign({ dirRate: 6, posRate: 8, ahead: 4, lookUp: 1 }, CAMS[game.camMode]));
      }
    },

    onKey: function (code) {
      if (code === 'KeyC') game.camMode = (game.camMode + 1) % CAMS.length;
      if (code === 'Escape') {
        if (game.phase === 'run') endRun('Run ended', 'You ended the run yourself.');
        else if (game.phase === 'garage') DR.setMode('menu');
      }
    }
  };

  $('runBtn').addEventListener('click', startRun);
  $('backBtn').addEventListener('click', toGarage);
  $('quitBtn').addEventListener('click', function () { endRun('Run ended', 'You ended the run yourself.'); });
  $('garageMenuBtn').addEventListener('click', function () { DR.setMode('menu'); });
})(window.DR);
