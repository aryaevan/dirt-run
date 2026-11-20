/* Low-poly pine trees, drawn as two instanced meshes (trunks and crowns) for speed. */
(function (DR) {
  'use strict';
  var THREE = window.THREE, V3 = THREE.Vector3;
  var Y_AXIS = new V3(0, 1, 0);
  var m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), s4 = new V3(), p4 = new V3();

  var trunkGeo = new THREE.CylinderGeometry(0.22, 0.34, 2.4, 6); trunkGeo.translate(0, 1.2, 0);
  var crownGeo = new THREE.ConeGeometry(1.7, 4.2, 7); crownGeo.translate(0, 4.3, 0);

  /** A batch of up to `max` trees. Call add() for each tree, then finish(). */
  function Forest(max) {
    this.trunks = new THREE.InstancedMesh(trunkGeo, DR.mat.bark, max);
    this.crowns = new THREE.InstancedMesh(crownGeo, DR.mat.leaves, max);
    this.trunks.castShadow = this.crowns.castShadow = true;
    this.crowns.receiveShadow = true;
    this.group = new THREE.Group();
    this.group.add(this.trunks, this.crowns);
    this.count = 0;
  }

  Forest.prototype.add = function (x, y, z, scale, rotY) {
    q4.setFromAxisAngle(Y_AXIS, rotY);
    s4.set(scale, scale, scale);
    p4.set(x, y, z);
    m4.compose(p4, q4, s4);
    this.trunks.setMatrixAt(this.count, m4);
    this.crowns.setMatrixAt(this.count, m4);
    this.count++;
  };

  Forest.prototype.finish = function () {
    this.trunks.count = this.crowns.count = this.count;
    this.trunks.instanceMatrix.needsUpdate = this.crowns.instanceMatrix.needsUpdate = true;
    return this.group;
  };

  DR.assets.Forest = Forest;
})(window.DR);
