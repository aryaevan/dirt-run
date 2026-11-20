/* Race track furniture: logs across the track, the start line and distance signs. */
(function (DR) {
  'use strict';
  var THREE = window.THREE, A = DR.assets;

  /** Log lying across the track, `length` metres long. */
  A.makeLog = function (length) {
    var log = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, length, 8).rotateZ(Math.PI / 2), DR.mat.bark);
    log.castShadow = log.receiveShadow = true;
    return log;
  };

  /** White start-line stripe painted on the ground. */
  A.makeStartStripe = function (width) {
    return new THREE.Mesh(new THREE.PlaneGeometry(width, 1.2).rotateX(-Math.PI / 2), DR.mat.chalk);
  };

  function signTexture(text) {
    var c = document.createElement('canvas'); c.width = 256; c.height = 128;
    var g = c.getContext('2d');
    g.fillStyle = '#f2efe8'; g.fillRect(0, 0, 256, 128);
    g.fillStyle = '#e2560f'; g.fillRect(0, 0, 256, 18);
    g.fillStyle = '#2a2118'; g.font = 'bold 64px "Chakra Petch", sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, 128, 74);
    var tx = new THREE.CanvasTexture(c);
    tx.anisotropy = 4;
    return tx;
  }

  /** Signpost showing `text`, facing back down the track towards the driver. */
  A.makeDistanceSign = function (text) {
    var g = new THREE.Group();
    var post = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.4, 0.15), DR.mat.post);
    post.position.y = 1.2;
    post.castShadow = true;
    var board = new THREE.Mesh(new THREE.PlaneGeometry(2, 1),
      new THREE.MeshBasicMaterial({ map: signTexture(text), side: THREE.DoubleSide }));
    board.position.y = 2.6;
    board.rotation.y = Math.PI;
    g.add(post, board);
    return g;
  };
})(window.DR);
