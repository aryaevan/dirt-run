/*
 * Buggy model (from Ridge Builder). Its look changes with the garage upgrades:
 * exhausts and intake (engine), springs (suspension), hood cans (fuel tank),
 * roll cage (chassis), bull bar and light bar (drivetrain), chunkier tyres.
 *
 * build(tune, levels) returns the same model contract as the truck.
 */
(function (DR) {
  'use strict';
  var THREE = window.THREE, V3 = THREE.Vector3, M = DR.mat, A = DR.assets;
  var add = A.mesh, bar = A.bar;

  function build(tune, L) {
    var g = new THREE.Group();

    add(g, new THREE.BoxGeometry(1.5, 0.16, 3.0), M.trim, 0, -0.05, 0);      // floor pan
    add(g, new THREE.BoxGeometry(1.36, 0.32, 1.35), M.paint, 0, 0.17, -0.15); // tub
    add(g, new THREE.BoxGeometry(1.26, 0.28, 0.95), M.paint, 0, 0.19, 1.02);  // nose
    add(g, new THREE.BoxGeometry(0.95, 0.45, 0.7), M.metal, 0, 0.3, -1.08);   // engine block
    add(g, new THREE.BoxGeometry(1.75, 0.08, 0.14), M.trim, 0, -0.06, 1.3);   // axles
    add(g, new THREE.BoxGeometry(1.75, 0.08, 0.14), M.trim, 0, -0.06, -1.3);
    add(g, new THREE.BoxGeometry(0.6, 0.55, 0.14), M.trim, 0, 0.58, -0.62);   // seat back
    add(g, new THREE.BoxGeometry(0.48, 0.52, 0.32), M.seat, 0, 0.62, -0.4);   // driver
    add(g, new THREE.SphereGeometry(0.22, 10, 8), M.helmet, 0, 1.08, -0.38);  // helmet
    add(g, new THREE.BoxGeometry(0.3, 0.09, 0.05), M.glass, 0, 1.08, -0.17);  // visor
    add(g, new THREE.TorusGeometry(0.16, 0.03, 6, 14), M.trim, 0, 0.72, 0.02, -0.9); // steering wheel
    add(g, new THREE.BoxGeometry(0.22, 0.12, 0.05), M.lamp, -0.42, 0.27, 1.5);
    add(g, new THREE.BoxGeometry(0.22, 0.12, 0.05), M.lamp, 0.42, 0.27, 1.5);

    // engine upgrades
    if (L.engine >= 2) {
      add(g, new THREE.CylinderGeometry(0.06, 0.06, 0.7, 8), M.metal, -0.28, 0.5, -1.5, -0.5);
      add(g, new THREE.CylinderGeometry(0.06, 0.06, 0.7, 8), M.metal, 0.28, 0.5, -1.5, -0.5);
    }
    if (L.engine >= 4) add(g, new THREE.BoxGeometry(0.5, 0.26, 0.35), M.trim, 0, 0.66, -1.08);
    if (L.engine >= 6) add(g, new THREE.CylinderGeometry(0.16, 0.16, 0.3, 12), M.paint, 0.32, 0.62, -1.2, 0, 0, Math.PI / 2);

    // suspension springs
    if (L.susp >= 1) {
      var sm = L.susp >= 4 ? M.yellow : M.metal;
      [[-0.62, 1.3], [0.62, 1.3], [-0.62, -1.3], [0.62, -1.3]].forEach(function (p) {
        add(g, new THREE.CylinderGeometry(0.09, 0.09, 0.42, 8), sm, p[0], 0.18, p[1]);
      });
    }

    // fuel cans on the hood
    for (var f = 0; f < Math.min(3, Math.ceil(L.fuel / 2)); f++) {
      add(g, new THREE.BoxGeometry(0.32, 0.38, 0.18), f % 2 ? M.canGreen : M.canRed, -0.38 + f * 0.38, 0.52, 1.25);
    }

    // roll cage
    if (L.chassis >= 1) {
      var r = 0.045, h = 1.42, zf = 0.12, zb = -0.85, xw = 0.62;
      [[-xw, zf], [xw, zf], [-xw, zb], [xw, zb]].forEach(function (p) {
        bar(g, new V3(p[0], 0.25, p[1]), new V3(p[0] * 0.9, h, p[1]), r, M.tube);
      });
      bar(g, new V3(-xw * 0.9, h, zf), new V3(xw * 0.9, h, zf), r, M.tube);
      bar(g, new V3(-xw * 0.9, h, zb), new V3(xw * 0.9, h, zb), r, M.tube);
      bar(g, new V3(-xw * 0.9, h, zf), new V3(-xw * 0.9, h, zb), r, M.tube);
      bar(g, new V3(xw * 0.9, h, zf), new V3(xw * 0.9, h, zb), r, M.tube);
      if (L.chassis >= 3) {
        bar(g, new V3(-xw * 0.9, h, zb), new V3(xw * 0.9, 0.4, zb - 0.05), r, M.tube);
        bar(g, new V3(-0.8, 0.1, 1.2), new V3(-0.8, 0.1, -1.2), r * 1.3, M.tube);
        bar(g, new V3(0.8, 0.1, 1.2), new V3(0.8, 0.1, -1.2), r * 1.3, M.tube);
      }
      if (L.chassis >= 5) {
        bar(g, new V3(-xw * 0.9, h, zf), new V3(-0.55, 0.45, 1.45), r, M.tube);
        bar(g, new V3(xw * 0.9, h, zf), new V3(0.55, 0.45, 1.45), r, M.tube);
      }
    }

    // drivetrain: bull bar, then a light bar
    if (L.drive >= 1) {
      bar(g, new V3(-0.7, 0.12, 1.62), new V3(0.7, 0.12, 1.62), 0.06, M.tube);
      bar(g, new V3(-0.5, 0.12, 1.62), new V3(-0.4, 0.5, 1.5), 0.05, M.tube);
      bar(g, new V3(0.5, 0.12, 1.62), new V3(0.4, 0.5, 1.5), 0.05, M.tube);
    }
    if (L.drive >= 2) {
      var ly = L.chassis >= 1 ? 1.47 : 0.5, lz = L.chassis >= 1 ? 0.12 : 1.4;
      add(g, new THREE.BoxGeometry(1.0, 0.12, 0.12), M.trim, 0, ly, lz);
      for (var b = -2; b <= 2; b++) add(g, new THREE.BoxGeometry(0.14, 0.08, 0.03), M.lamp, b * 0.19, ly, lz + 0.07);
    }

    // wheels grow wider and chunkier with the tyre upgrade
    var wheels = [], segs = L.tyres >= 3 ? 10 : 14;
    [[-0.88, 1.3, true], [0.88, 1.3, true], [-0.88, -1.3, false], [0.88, -1.3, false]].forEach(function (w) {
      var wh = A.makeWheel(tune.rad, tune.tyreW, segs);
      g.add(wh.pivot);
      var ox = w[0] + Math.sign(w[0]) * (tune.tyreW - 0.26) * 0.5;
      wheels.push({ off: new V3(ox, -0.12, w[1]), front: w[2], pivot: wh.pivot, spin: wh.spin });
    });

    var hull = [];
    [-0.8, 0.8].forEach(function (x) { [-0.1, 1.0].forEach(function (y) { [-1.6, 1.6].forEach(function (z) { hull.push(new V3(x, y, z)); }); }); });

    return { group: g, wheels: wheels, hull: hull, radius: 1.5 };
  }

  A.buggy = { id: 'buggy', name: 'Buggy', build: build };
})(window.DR);
