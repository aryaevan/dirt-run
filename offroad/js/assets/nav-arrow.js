/* Arrow that floats above the car and points at the nearest flag. */
(function (DR) {
  'use strict';
  var THREE = window.THREE;

  DR.assets.makeNavArrow = function () {
    var geo = new THREE.ConeGeometry(0.38, 1.2, 4);
    geo.rotateX(Math.PI / 2);
    return new THREE.Mesh(geo, DR.mat.beaconNoFog);
  };
})(window.DR);
