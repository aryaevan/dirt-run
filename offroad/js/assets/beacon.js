/* Glowing light beams that mark pickups from far away (flags, fuel cans). */
(function (DR) {
  'use strict';
  var THREE = window.THREE;

  /** One material per kind of beacon, so a mode can pulse its opacity. */
  DR.assets.beaconMaterial = function (color, opacity) {
    return new THREE.MeshBasicMaterial({
      color: color, transparent: true, opacity: opacity, depthWrite: false, fog: false,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide
    });
  };

  /** Open cylinder standing on the ground, `height` tall. */
  DR.assets.makeBeam = function (radius, height, segs, mat) {
    var beam = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, segs, 1, true), mat);
    beam.position.y = height / 2;
    return beam;
  };
})(window.DR);
