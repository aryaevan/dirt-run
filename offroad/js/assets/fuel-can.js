/* Red jerry can with a beam above it. Returns {group, body}; spin `body` for idle animation. */
(function (DR) {
  'use strict';
  var THREE = window.THREE, A = DR.assets;
  var bodyGeo = new THREE.BoxGeometry(0.62, 0.82, 0.34);
  var capGeo = new THREE.BoxGeometry(0.2, 0.14, 0.2);

  A.makeFuelCan = function (beamMat) {
    var g = new THREE.Group();
    var body = new THREE.Mesh(bodyGeo, DR.mat.canRed);
    body.position.y = 0.6;
    body.castShadow = true;
    var cap = new THREE.Mesh(capGeo, DR.mat.yellow);
    cap.position.set(0.15, 1.08, 0);
    g.add(body, cap, A.makeBeam(0.9, 40, 12, beamMat));
    return { group: g, body: body };
  };
})(window.DR);
