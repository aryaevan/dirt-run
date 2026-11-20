/*
 * Racing world: a 3 km hill-climb track that gets steeper as it goes, with
 * logs every 47 m, kicker ramps, coins, fuel cans, distance signs and a summit flag.
 * Follows the world contract described in valley.js.
 */
(function (DR) {
  'use strict';
  var THREE = window.THREE, A = DR.assets;
  var N = DR.noise, vnoise = N.vnoise, smooth = N.smooth;

  var X0 = -20, XW = 40, NX = 40;
  var Z0 = -30, ZL = 3030, NZ = 2424;
  var TRACK_END = 2950, LOG_EVERY = 47, KICK_EVERY = 190, TREES = 520, SEED = 77;

  var look = {
    sky: 0xa9cbe0, fogNear: 90, fogFar: 330, fov: 58, far: 900,
    hemiSky: 0xe6f2ff, hemiIntensity: 0.8, shadowSize: 30, shadowFar: 200, sun: [30, 70, 20]
  };

  // Height along the centre line of the track
  function profile(z) {
    if (z < 25) return 0;
    var t = z - 25, w = smooth(0, 70, t), amp = 3 + t * 0.011;
    var h = (vnoise(t * 0.011, 3.3) * 1.6 + vnoise(t * 0.026, 8.1) * 0.55 + vnoise(t * 0.06, 1.7) * 0.18) * amp * w;
    if (t > 40) { var m = t % LOG_EVERY; h += 0.45 * Math.exp(-((m - 23) * (m - 23)) / (2 * 0.85 * 0.85)); } // log bumps
    if (t > 230) { // kicker ramps
      var k = t % KICK_EVERY;
      if (k >= 150 && k < 160) h += (k - 150) / 10 * 1.7;
      else if (k >= 160 && k < 161.6) h += 1.7 * (1 - (k - 160) / 1.6);
    }
    return h;
  }

  function genHeight(x, z) {
    var h = profile(z);
    h += x * 0.05 * vnoise(z * 0.02 + 3, 1.7) * smooth(30, 250, z); // camber
    h += vnoise(x * 0.18 + 9, z * 0.18) * 0.12 * smooth(20, 60, z);  // small bumps
    var ax = Math.abs(x); if (ax > 8.5) h += (ax - 8.5) * (ax - 8.5) * 0.38; // banks on both sides
    if (z < -12) h += (-12 - z) * (-12 - z) * 0.4;                        // wall behind the start
    return h;
  }

  var cDirt = new THREE.Color(0x9a7149), cDirt2 = new THREE.Color(0x7f5a39), cGrass = new THREE.Color(0x5d8c3d),
      cGrass2 = new THREE.Color(0x8b9447), cRock = new THREE.Color(0x857565);

  function colorAt(x, z, y, out) {
    var v = vnoise(x * 0.2, z * 0.2) * 0.5 + 0.5, ax = Math.abs(x);
    if (ax < 7.2) { out.copy(cDirt).lerp(cDirt2, v); if (ax > 6) out.lerp(cGrass, (ax - 6) / 1.2 * 0.6); }
    else if (ax < 10) out.copy(cGrass).lerp(cGrass2, v);
    else out.copy(cRock).lerp(cGrass, smooth(14, 10, ax) * 0.6 + v * 0.15);
  }

  function build() {
    var root = new THREE.Group();
    var terrain = new DR.Terrain({ x0: X0, z0: Z0, width: XW, length: ZL, nx: NX, nz: NZ,
      height: genHeight, color: colorAt, normalEps: 0.4 });
    var heightAt = terrain.heightAt;
    root.add(terrain.mesh);

    // logs across the track, sitting on the log bumps in the profile
    for (var t = 40; t < TRACK_END; t += LOG_EVERY) {
      var lz = 25 + t - (t % LOG_EVERY) + 23;
      if (lz < 65 || lz > TRACK_END) continue;
      var log = A.makeLog(14);
      log.position.set(0, heightAt(0, lz) - 0.05, lz);
      root.add(log);
    }

    var stripe = A.makeStartStripe(14);
    stripe.position.set(0, 0.03, 4);
    root.add(stripe);

    for (var d = 100; d <= TRACK_END; d += 100) {
      var sign = A.makeDistanceSign(d + ' m');
      sign.position.set(-7.6, heightAt(-7.6, d), d);
      root.add(sign);
    }

    // trees on both banks
    var rng = N.mulberry32(SEED), forest = new A.Forest(TREES);
    for (var i = 0; i < TREES; i++) {
      var side = rng() < 0.5 ? -1 : 1, tx = side * (10.5 + rng() * 8.5), tz = -10 + rng() * (TRACK_END + 20), s = 0.7 + rng() * 0.7;
      forest.add(tx, heightAt(tx, tz) - 0.2, tz, s, rng() * 6.28);
    }
    root.add(forest.finish());

    var summit = A.makeFlag({ height: 7, poleR: 0.1, clothW: 2.4, clothH: 1.5 });
    summit.group.position.set(0, heightAt(0, TRACK_END), TRACK_END);
    root.add(summit.group);

    // coins in clusters of five, with a big coin every sixth cluster
    var coins = [], cluster = 0;
    for (var cz = 45; cz < TRACK_END - 10; cz += 38) {
      cluster++;
      var big = cluster % 6 === 0, val = big ? 25 : (cz > 1000 ? 10 : 5), lane = Math.sin(cluster * 1.7) * 3.5;
      for (var j = 0; j < (big ? 1 : 5); j++) {
        var zz = cz + j * 2.2, xx = lane + Math.sin(j * 0.6) * 0.6;
        coins.push({ x: xx, z: zz, y: heightAt(xx, zz) + 1.0, v: val, s: big ? 1.7 : 1, got: false });
      }
    }
    var coinSet = new A.CoinSet(coins);
    root.add(coinSet.mesh);

    // fuel cans, spaced further apart the higher you climb
    var cans = [], canBeamMat = A.beaconMaterial(0xff6a40, 0.2), fz = 170, nCan = 0;
    while (fz < TRACK_END) {
      var can = A.makeFuelCan(canBeamMat), cx = Math.sin(nCan * 2.3) * 2.5;
      can.group.position.set(cx, heightAt(cx, fz), fz);
      root.add(can.group);
      cans.push({ x: cx, z: fz, y: heightAt(cx, fz), group: can.group, body: can.body, got: false });
      nCan++;
      fz += 225 + nCan * 28;
    }

    return {
      name: 'ridge', root: root, look: look,
      heightAt: heightAt, normalAt: terrain.normalAt, water: null, obstacles: null,
      spawn: { x: 0, z: 0, yaw: 0 },
      TRACK_END: TRACK_END, coins: coins, coinSet: coinSet, cans: cans, canBeamMat: canBeamMat
    };
  }

  DR.worlds.ridge = { build: build };
})(window.DR);
