/*
 * Spinning gold coins, drawn as one instanced mesh.
 * `coins` is an array of {x, y, z, s (scale), got}. Collected coins are scaled to zero.
 */
(function (DR) {
  'use strict';
  var THREE = window.THREE, V3 = THREE.Vector3;
  var Y_AXIS = new V3(0, 1, 0);
  var m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), s4 = new V3(), p4 = new V3();
  var coinGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.1, 18); coinGeo.rotateX(Math.PI / 2);

  function CoinSet(coins) {
    this.coins = coins;
    this.mesh = new THREE.InstancedMesh(coinGeo, DR.mat.gold, coins.length);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.castShadow = true;
    for (var i = 0; i < coins.length; i++) this.write(i, 0);
  }

  CoinSet.prototype.write = function (i, angle) {
    var c = this.coins[i];
    if (c.got) s4.set(0, 0, 0); else s4.set(c.s, c.s, c.s);
    q4.setFromAxisAngle(Y_AXIS, angle);
    p4.set(c.x, c.y, c.z);
    m4.compose(p4, q4, s4);
    this.mesh.setMatrixAt(i, m4);
  };

  CoinSet.prototype.reset = function () {
    for (var i = 0; i < this.coins.length; i++) { this.coins[i].got = false; this.write(i, 0); }
    this.mesh.instanceMatrix.needsUpdate = true;
  };

  DR.assets.CoinSet = CoinSet;
})(window.DR);
