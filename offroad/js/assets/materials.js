/* Shared material palette. Every asset draws from here so both worlds and both cars match. */
(function (DR) {
  'use strict';
  var THREE = window.THREE;
  function std(o) { return new THREE.MeshStandardMaterial(o); }

  DR.mat = {
    // vehicles
    paint:   std({ color: 0xe2560f, roughness: 0.45, metalness: 0.25, flatShading: true }),
    trim:    std({ color: 0x2b2622, roughness: 0.8, flatShading: true }),
    glass:   std({ color: 0x22313d, roughness: 0.15, metalness: 0.4 }),
    lamp:    new THREE.MeshBasicMaterial({ color: 0xfff3c4 }),
    tyre:    std({ color: 0x1d1b19, roughness: 0.95, flatShading: true }),
    metal:   std({ color: 0xa9a39a, roughness: 0.35, metalness: 0.7, flatShading: true }),
    tube:    std({ color: 0x2f2f33, roughness: 0.5, metalness: 0.5 }),
    yellow:  std({ color: 0xf2c230, roughness: 0.5 }),
    seat:    std({ color: 0x2d5d8a, flatShading: true }),
    helmet:  std({ color: 0xf2efe8, roughness: 0.3 }),
    canRed:  std({ color: 0xc62f1d, roughness: 0.5, metalness: 0.2 }),
    canGreen: std({ color: 0x3c6e3a }),

    // nature
    terrain: std({ vertexColors: true, flatShading: true, roughness: 0.97, metalness: 0 }),
    water:   std({ color: 0x3f8db5, transparent: true, opacity: 0.78, roughness: 0.15, metalness: 0.1 }),
    bark:    std({ color: 0x6b4a2f, roughness: 0.9, flatShading: true }),
    leaves:  std({ color: 0x2f5a2c, flatShading: true }),
    stone:   std({ color: 0x8a8178, roughness: 1, flatShading: true }),

    // props
    pole:    std({ color: 0xf2efe8, roughness: 0.5 }),
    cloth:   std({ color: 0xf06a1d, roughness: 0.6, side: THREE.DoubleSide }),
    post:    std({ color: 0x4b3b2c }),
    gold:    std({ color: 0xf2c230, metalness: 0.6, roughness: 0.3, emissive: 0x5a4200 }),
    chalk:   new THREE.MeshBasicMaterial({ color: 0xf2efe8 }),
    beacon:  new THREE.MeshBasicMaterial({ color: 0xffb347 }),
    beaconNoFog: new THREE.MeshBasicMaterial({ color: 0xffb347, fog: false })
  };
})(window.DR);
