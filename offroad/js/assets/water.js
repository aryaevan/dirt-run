/* Flat translucent water plane at a given height. */
(function (DR) {
  'use strict';
  var THREE = window.THREE;

  DR.assets.makeWater = function (size, level) {
    var water = new THREE.Mesh(new THREE.PlaneGeometry(size, size).rotateX(-Math.PI / 2), DR.mat.water);
    water.position.y = level;
    return water;
  };
})(window.DR);
