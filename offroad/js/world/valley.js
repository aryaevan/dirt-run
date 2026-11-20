/*
 * Exploration world: an 800 m open valley with a lake, forests, boulders and
 * eight flags to collect. Generated from a fixed seed, so it is the same every time.
 *
 * World contract (also used by ridge.js):
 *   root      THREE.Group holding everything; hidden when another world is active
 *   heightAt(x, z), normalAt(x, z, out)
 *   water     water height, or null
 *   obstacles [{x, z, y, r, hgt}] solid trees and rocks, or null
 *   spawn     {x, z, yaw}
 *   look      sky, fog and lighting settings for DR.stage.configure()
 */
(function (DR) {
  'use strict';
  var THREE = window.THREE, V3 = THREE.Vector3, A = DR.assets;
  var N = DR.noise, vnoise = N.vnoise, fbm = N.fbm, smooth = N.smooth;

  var WATER = -6, SIZE = 800, HALF = SIZE / 2, SEG = 280, SPAWN_H = 4;
  var FLAG_COUNT = 8, TREES = 420, ROCKS = 160, SEED = 20261118;

  var look = {
    sky: 0x9cc3d9, fogNear: 140, fogFar: 560, fov: 62, far: 1400,
    hemiSky: 0xe4f1ff, hemiIntensity: 0.78, shadowSize: 45, shadowFar: 220, sun: [40, 80, 25]
  };

  function genHeight(x, z) {
    var h = fbm(x * 0.006, z * 0.006, 4) * 42 + fbm(x * 0.025 + 100, z * 0.025 + 100, 3) * 7 + vnoise(x * 0.09 + 50, z * 0.09 + 50) * 0.6;
    var w = smooth(18, 55, Math.hypot(x, z));
    h = SPAWN_H + (h - SPAWN_H) * w;               // flat clearing around the spawn point
    var floor = WATER - 1.6;
    if (h < floor) h = floor - (floor - h) * 0.06; // shallow lake bed
    var e = Math.max(Math.abs(x), Math.abs(z));
    if (e > 320) { var k = e - 320; h += k * k * 0.025; } // mountains ring the map edge
    return h;
  }

  var grassA = new THREE.Color(0x5a8a3c), grassB = new THREE.Color(0x8c9446), dirt = new THREE.Color(0x9a7149),
      rock = new THREE.Color(0x857565), sand = new THREE.Color(0xcdb588), snow = new THREE.Color(0xeef1f4);
  var _n = new V3();

  function colorAt(x, z, y, out, terrain) {
    terrain.normalAt(x, z, _n);
    var v = vnoise(x * 0.05, z * 0.05) * 0.5 + 0.5;
    if (y < WATER + 1.2) out.copy(sand);
    else if (_n.y < 0.78) out.copy(rock).lerp(dirt, v * 0.3);
    else if (y > 30) out.copy(snow).lerp(rock, smooth(0.95, 0.85, _n.y));
    else {
      out.copy(grassA).lerp(grassB, v);
      out.lerp(dirt, Math.max(smooth(0.95, 0.83, _n.y), 1 - smooth(22, 40, Math.hypot(x, z))));
    }
  }

  function build() {
    var root = new THREE.Group();
    var terrain = new DR.Terrain({ x0: -HALF, z0: -HALF, width: SIZE, length: SIZE, nx: SEG, nz: SEG,
      height: genHeight, color: colorAt, normalEps: 0.5 });
    var heightAt = terrain.heightAt, normalAt = terrain.normalAt;
    root.add(terrain.mesh, A.makeWater(SIZE, WATER));

    // The random calls below run in the same order as the original game, which keeps the layout identical.
    var rng = N.mulberry32(SEED), tries;

    // flags: on flat dry ground, at least 75 m apart
    var flags = [], beamMat = A.beaconMaterial(0xffb347, 0.22);
    tries = 0;
    while (flags.length < FLAG_COUNT && tries < 4000) {
      tries++;
      var ang = rng() * Math.PI * 2, rad = 60 + rng() * 260;
      var fx = Math.cos(ang) * rad, fz = Math.sin(ang) * rad, fh = heightAt(fx, fz);
      if (fh < WATER + 1.5) continue;
      if (normalAt(fx, fz, _n).y < 0.82) continue;
      var ok = true;
      for (var j = 0; j < flags.length; j++) { if (Math.hypot(flags[j].x - fx, flags[j].z - fz) < 75) { ok = false; break; } }
      if (!ok) continue;
      var flag = A.makeFlag({ beamMat: beamMat, ring: true });
      flag.group.position.set(fx, fh, fz);
      root.add(flag.group);
      flags.push({ x: fx, z: fz, y: fh, group: flag.group, cloth: flag.cloth, got: false, phase: rng() * 6 });
    }
    function nearFlag(x, z, d) {
      for (var k = 0; k < flags.length; k++) if (Math.hypot(flags[k].x - x, flags[k].z - z) < d) return true;
      return false;
    }

    // trees, clumped into forests with noise
    var obstacles = [], forest = new A.Forest(TREES);
    tries = 0;
    while (forest.count < TREES && tries < 20000) {
      tries++;
      var tx = (rng() * 2 - 1) * 350, tz = (rng() * 2 - 1) * 350, th = heightAt(tx, tz);
      if (th < WATER + 1.5 || th > 28 || Math.hypot(tx, tz) < 30 || nearFlag(tx, tz, 10)) continue;
      if (normalAt(tx, tz, _n).y < 0.86) continue;
      if (vnoise(tx * 0.02 + 7, tz * 0.02 - 3) < -0.05) continue;
      var s = 0.75 + rng() * 0.7;
      forest.add(tx, th - 0.15, tz, s, rng() * Math.PI * 2);
      obstacles.push({ x: tx, z: tz, y: th, r: 0.35 * s, hgt: 7 * s });
    }

    // boulders
    var rocks = new A.RockField(ROCKS);
    tries = 0;
    while (rocks.count < ROCKS && tries < 20000) {
      tries++;
      var rx = (rng() * 2 - 1) * 350, rz = (rng() * 2 - 1) * 350, rh = heightAt(rx, rz);
      if (rh < WATER || Math.hypot(rx, rz) < 30 || nearFlag(rx, rz, 10)) continue;
      var sx = 1 + rng() * 1.8, sy = 0.6 + rng() * 1.2, sz = 1 + rng() * 1.8;
      rocks.add(rx, rh + sy * 0.25, rz, sx, sy, sz, new THREE.Euler(rng() * 0.5, rng() * 6.28, rng() * 0.5));
      obstacles.push({ x: rx, z: rz, y: rh, r: Math.max(sx, sz) * 0.8, hgt: sy * 1.6 + 0.8 });
    }
    root.add(forest.finish(), rocks.finish());

    return {
      name: 'valley', root: root, look: look,
      heightAt: heightAt, normalAt: normalAt, water: WATER, obstacles: obstacles,
      spawn: { x: 0, z: 0, yaw: 0 },
      flags: flags, beamMat: beamMat
    };
  }

  DR.worlds.valley = { build: build };
})(window.DR);
