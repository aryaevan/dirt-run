/*
 * Wheel model shared by both cars.
 * Returns a pivot (moved by the suspension and turned by the steering)
 * holding a spin group (rotated as the wheel rolls).
 */
(function (DR) {
  'use strict';
  var THREE = window.THREE;

  DR.assets.makeWheel = function (rad, width, segs) {
    var pivot = new THREE.Group(), spin = new THREE.Group();
    var tyre = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, width, segs || 14).rotateZ(Math.PI / 2), DR.mat.tyre);
    var rim = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.55, rad * 0.55, width + 0.02, 6).rotateZ(Math.PI / 2), DR.mat.metal);
    tyre.castShadow = true;
    spin.add(tyre, rim);
    pivot.add(spin);
    return { pivot: pivot, spin: spin };
  };
})(window.DR);
