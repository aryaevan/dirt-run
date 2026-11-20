/*
 * Truck model (from Dirt Run): a boxy orange 4x4 with a light bar and spare tyre.
 *
 * build(tune) returns the model contract used by the physics:
 *   group   THREE.Group to add to the scene
 *   wheels  [{off, front, pivot, spin}]  wheel mount points in car space
 *   hull    body corner points that collide with the ground
 *   radius  footprint radius used against trees and rocks
 */
(function (DR) {
  'use strict';
  var THREE = window.THREE, V3 = THREE.Vector3, M = DR.mat, A = DR.assets;

  function build(tune) {
    var g = new THREE.Group();
    function part(geo, mat, x, y, z) {
      var m = A.mesh(g, geo, mat, x, y, z);
      m.receiveShadow = true;
      return m;
    }

    part(new THREE.BoxGeometry(1.9, 0.55, 3.9), M.paint, 0, 0.15, 0);       // body
    part(new THREE.BoxGeometry(1.66, 0.62, 1.85), M.paint, 0, 0.73, -0.35); // cab
    part(new THREE.BoxGeometry(1.6, 0.48, 0.06), M.glass, 0, 0.76, 0.6);    // windscreen
    part(new THREE.BoxGeometry(1.68, 0.42, 1.5), M.glass, 0, 0.76, -0.35).scale.set(1.002, 1, 1); // side windows
    part(new THREE.BoxGeometry(2.02, 0.3, 0.28), M.trim, 0, -0.02, 2.02);   // front bumper
    part(new THREE.BoxGeometry(2.02, 0.3, 0.28), M.trim, 0, -0.02, -2.02);  // rear bumper
    part(new THREE.BoxGeometry(1.5, 0.12, 0.18), M.trim, 0, 1.1, 0.45);     // roof light bar
    part(new THREE.BoxGeometry(0.28, 0.14, 0.05), M.lamp, -0.62, 0.28, 1.97); // headlights
    part(new THREE.BoxGeometry(0.28, 0.14, 0.05), M.lamp, 0.62, 0.28, 1.97);
    for (var lb = -2; lb <= 2; lb++) part(new THREE.BoxGeometry(0.18, 0.1, 0.05), M.lamp, lb * 0.28, 1.1, 0.55);
    part(new THREE.CylinderGeometry(0.38, 0.38, 0.24, 12), M.trim, 0, 0.55, -2.08).rotation.x = Math.PI / 2; // spare tyre
    [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(function (p) {                // fender flares
      part(new THREE.BoxGeometry(0.2, 0.14, 1.05), M.trim, p[0] * 1.0, 0.36, p[1] * 1.35);
    });

    var wheels = [];
    [[-0.92, 1.35, true], [0.92, 1.35, true], [-0.92, -1.35, false], [0.92, -1.35, false]].forEach(function (w) {
      var wh = A.makeWheel(tune.rad, 0.44, 14);
      g.add(wh.pivot);
      wheels.push({ off: new V3(w[0], -0.2, w[1]), front: w[2], pivot: wh.pivot, spin: wh.spin });
    });

    var hull = [];
    [-0.95, 0.95].forEach(function (x) { [-0.1, 1.05].forEach(function (y) { [-2.0, 2.0].forEach(function (z) { hull.push(new V3(x, y, z)); }); }); });

    return { group: g, wheels: wheels, hull: hull, radius: 1.7 };
  }

  A.truck = { id: 'truck', name: 'Truck', build: build };
})(window.DR);
