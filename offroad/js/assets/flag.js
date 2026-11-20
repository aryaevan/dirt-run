/*
 * Flag on a pole. Used for the exploration collectibles (with a beam and a
 * ground ring) and for the racing summit flag (bigger, no beam).
 * Returns {group, cloth}; rotate `cloth` around Y to make it wave.
 */
(function (DR) {
  'use strict';
  var THREE = window.THREE, A = DR.assets;

  A.makeFlag = function (opts) {
    var o = Object.assign({ height: 6, poleR: 0.08, clothW: 1.8, clothH: 1.1, beamMat: null, ring: false }, opts);
    var g = new THREE.Group();

    var pole = new THREE.Mesh(new THREE.CylinderGeometry(o.poleR, o.poleR, o.height, 8), DR.mat.pole);
    pole.position.y = o.height / 2;
    pole.castShadow = true;

    var cloth = new THREE.Mesh(new THREE.PlaneGeometry(o.clothW, o.clothH), DR.mat.cloth);
    cloth.position.set(o.clothW / 2, o.height - o.clothH * 0.55, 0);
    cloth.castShadow = true;
    var clothPivot = new THREE.Group();
    clothPivot.add(cloth);
    g.add(pole, clothPivot);

    if (o.beamMat) g.add(A.makeBeam(1.3, 120, 16, o.beamMat));
    if (o.ring) {
      var ring = new THREE.Mesh(new THREE.TorusGeometry(4, 0.15, 6, 32), DR.mat.beacon);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.3;
      g.add(ring);
    }
    return { group: g, cloth: clothPivot };
  };
})(window.DR);
