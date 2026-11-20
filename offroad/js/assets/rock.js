/* Boulders, drawn as one instanced mesh of stretched dodecahedrons. */
(function (DR) {
  'use strict';
  var THREE = window.THREE, V3 = THREE.Vector3;
  var m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), s4 = new V3(), p4 = new V3();
  var rockGeo = new THREE.DodecahedronGeometry(1, 0);

  /** A batch of up to `max` rocks. Call add() for each rock, then finish(). */
  function RockField(max) {
    this.mesh = new THREE.InstancedMesh(rockGeo, DR.mat.stone, max);
    this.mesh.castShadow = this.mesh.receiveShadow = true;
    this.count = 0;
  }

  RockField.prototype.add = function (x, y, z, sx, sy, sz, euler) {
    q4.setFromEuler(euler);
    s4.set(sx, sy, sz);
    p4.set(x, y, z);
    m4.compose(p4, q4, s4);
    this.mesh.setMatrixAt(this.count++, m4);
  };

  RockField.prototype.finish = function () {
    this.mesh.count = this.count;
    this.mesh.instanceMatrix.needsUpdate = true;
    return this.mesh;
  };

  DR.assets.RockField = RockField;
})(window.DR);
