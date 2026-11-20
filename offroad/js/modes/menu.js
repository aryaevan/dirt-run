/* Main menu: pick a mode while the camera circles your car in the valley. */
(function (DR) {
  'use strict';
  var $ = DR.$;
  var angle = 0;

  function showRecords() {
    var best = DR.progress.bestFlags, g = DR.progress.garage;
    $('menuExploreRec').textContent = best !== null ? 'Best time ' + DR.fmtTime(best) : 'No finish yet';
    $('menuRaceRec').textContent = g.best > 0
      ? 'Best climb ' + DR.fmtN(g.best) + ' m · ' + DR.fmtN(g.coins) + ' coins'
      : 'No runs yet';
  }

  DR.modes.menu = {
    enter: function () {
      var world = DR.useWorld('valley');
      DR.useCar(DR.progress.settings.car);
      DR.player.onLost = function () { DR.player.upright(world); };
      DR.player.place(world, world.spawn.x, world.spawn.z, world.spawn.yaw);
      showRecords();
      $('menu').hidden = false;
      angle = 0.6;
      DR.cam.orbit(0, DR.player, { angle: angle, radius: 9, height: 3, lookY: 0.8, snap: true });
      $('menuExplore').focus();
    },
    leave: function () { $('menu').hidden = true; },
    live: function () { return false; },
    update: function (dt) {
      angle += dt * 0.15;
      DR.cam.orbit(dt, DR.player, { angle: angle, radius: 9, height: 3, lookY: 0.8 });
    },
    onKey: function () {}
  };

  $('menuExplore').addEventListener('click', function () { DR.setMode('explore'); });
  $('menuRace').addEventListener('click', function () { DR.setMode('race'); });
})(window.DR);
