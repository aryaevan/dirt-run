/*
 * Renderer, scene, camera and lights. One stage is shared by every mode;
 * each world passes its own sky, fog and shadow settings to configure().
 */
(function (DR) {
  'use strict';
  var THREE = window.THREE;

  var renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  DR.$('stage').appendChild(renderer.domElement);

  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0x9cc3d9);
  scene.fog = new THREE.Fog(0x9cc3d9, 140, 560);

  var camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 1400);

  var hemi = new THREE.HemisphereLight(0xe4f1ff, 0x6b5a3a, 0.78);
  scene.add(hemi);

  var sun = new THREE.DirectionalLight(0xfff0d4, 0.95);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.05;
  scene.add(sun, sun.target);
  var sunOffset = new THREE.Vector3(40, 80, 25);

  /**
   * Apply a world's look.
   * @param {object} look {sky, fogNear, fogFar, fov, far, hemiSky, hemiIntensity, shadowSize, shadowFar, sun:[x,y,z]}
   */
  function configure(look) {
    scene.background.setHex(look.sky);
    scene.fog.color.setHex(look.sky);
    scene.fog.near = look.fogNear;
    scene.fog.far = look.fogFar;
    hemi.color.setHex(look.hemiSky);
    hemi.intensity = look.hemiIntensity;
    camera.fov = look.fov;
    camera.far = look.far;
    camera.updateProjectionMatrix();
    var sc = sun.shadow.camera, s = look.shadowSize;
    sc.left = -s; sc.right = s; sc.top = s; sc.bottom = -s; sc.near = 1; sc.far = look.shadowFar;
    sc.updateProjectionMatrix();
    sunOffset.fromArray(look.sun);
    document.documentElement.style.setProperty('--sky', '#' + scene.background.getHexString());
  }

  // Keep the shadow-casting sun centred on the player
  function followSun(pos) {
    sun.position.copy(pos).add(sunOffset);
    sun.target.position.copy(pos);
    sun.target.updateMatrixWorld();
  }

  function render() { renderer.render(scene, camera); }

  window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  DR.stage = { renderer: renderer, scene: scene, camera: camera, sun: sun,
    configure: configure, followSun: followSun, render: render };
})(window.DR);
