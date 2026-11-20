/* Small building helpers used by the asset files. */
(function (DR) {
  'use strict';
  var THREE = window.THREE, V3 = THREE.Vector3;
  var Y_AXIS = new V3(0, 1, 0);

  /** Add a shadow-casting mesh to `parent` at (x,y,z) with optional rotation. */
  DR.assets.mesh = function (parent, geo, mat, x, y, z, rx, ry, rz) {
    var m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    if (rx) m.rotation.x = rx;
    if (ry) m.rotation.y = ry;
    if (rz) m.rotation.z = rz;
    m.castShadow = true;
    parent.add(m);
    return m;
  };

  /** Add a tube running from point a to point b (roll cages, bull bars). */
  DR.assets.bar = function (parent, a, b, r, mat) {
    var d = new V3().subVectors(b, a), len = d.length();
    var m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 6), mat);
    m.position.copy(a).addScaledVector(d, 0.5);
    m.quaternion.setFromUnitVectors(Y_AXIS, d.normalize());
    m.castShadow = true;
    parent.add(m);
    return m;
  };

  /** Free the GPU geometry of a group that is being replaced. Materials are shared, so they stay. */
  DR.assets.dispose = function (group) {
    group.traverse(function (o) { if (o.geometry) o.geometry.dispose(); });
  };
})(window.DR);
