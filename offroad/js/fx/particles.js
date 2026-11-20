/*
 * Soft round particles for dust, water splashes and pickup bursts.
 * A fixed ring buffer of points drawn with a small custom shader.
 */
(function (DR) {
  'use strict';
  var THREE = window.THREE, V3 = THREE.Vector3;

  var PN = 600, head = 0;
  var pos = new Float32Array(PN * 3), alpha = new Float32Array(PN), size = new Float32Array(PN), col = new Float32Array(PN * 3);
  var vel = new Float32Array(PN * 3), life = new Float32Array(PN), maxLife = new Float32Array(PN).fill(1);

  var geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('alpha', new THREE.BufferAttribute(alpha, 1));
  geo.setAttribute('size', new THREE.BufferAttribute(size, 1));
  geo.setAttribute('pcolor', new THREE.BufferAttribute(col, 3));

  var mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uPR: { value: DR.stage.renderer.getPixelRatio() } },
    vertexShader:
      'attribute float alpha; attribute float size; attribute vec3 pcolor; uniform float uPR; varying float vA; varying vec3 vC;' +
      'void main(){ vA=alpha; vC=pcolor; vec4 mv=modelViewMatrix*vec4(position,1.0); gl_PointSize=size*uPR*(300.0/max(0.5,-mv.z)); gl_Position=projectionMatrix*mv; }',
    fragmentShader:
      'varying float vA; varying vec3 vC; void main(){ vec2 c=gl_PointCoord-0.5; float d=length(c); if(d>0.5) discard; gl_FragColor=vec4(vC, vA*(1.0-d*2.0)); }'
  });

  var points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  DR.stage.scene.add(points);

  function emit(x, y, z, vx, vy, vz, r, g, b, lifeS, sz) {
    var i = head; head = (head + 1) % PN;
    pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
    vel[i * 3] = vx; vel[i * 3 + 1] = vy; vel[i * 3 + 2] = vz;
    col[i * 3] = r; col[i * 3 + 1] = g; col[i * 3 + 2] = b;
    life[i] = lifeS; maxLife[i] = lifeS; size[i] = sz;
  }

  /** Burst of `count` particles from one point (flag or coin pickups). */
  function burst(x, y, z, count, spread, lift, r, g, b, lifeS, sz) {
    for (var p = 0; p < count; p++) {
      emit(x, y, z, (Math.random() - 0.5) * spread, lift[0] + Math.random() * lift[1], (Math.random() - 0.5) * spread, r, g, b, lifeS, sz);
    }
  }

  function update(dt) {
    for (var i = 0; i < PN; i++) {
      if (life[i] <= 0) { alpha[i] = 0; continue; }
      life[i] -= dt;
      alpha[i] = Math.max(0, life[i] / maxLife[i]) * 0.55;
      size[i] += dt * 2.2;
      vel[i * 3] *= 0.97; vel[i * 3 + 2] *= 0.97; vel[i * 3 + 1] += dt * 0.4;
      pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
    }
    geo.attributes.position.needsUpdate = true; geo.attributes.alpha.needsUpdate = true;
    geo.attributes.size.needsUpdate = true; geo.attributes.pcolor.needsUpdate = true;
  }

  function clear() { life.fill(0); alpha.fill(0); geo.attributes.alpha.needsUpdate = true; }

  var _fwd = new V3(), _up = new V3(), _wp = new V3();

  /** Kick up dust (or spray in water) behind each wheel that touches the ground. */
  function wheelDust(v, world) {
    v.forward(_fwd); v.up(_up);
    var speed = v.S.vel.length(), rad = v.T.rad;
    for (var i = 0; i < v.wheels.length; i++) {
      var wh = v.wheels[i];
      if (!wh.grounded) continue;
      var amount = Math.max(0, (speed - 3) / 18) * 0.7 + Math.min(1, wh.slip * 0.12);
      if (Math.random() >= amount) continue;
      wh.pivot.getWorldPosition(_wp);
      _wp.addScaledVector(_up, -rad * 0.8);
      var wet = world.water != null && world.heightAt(_wp.x, _wp.z) < world.water + 0.2;
      emit(_wp.x + (Math.random() - 0.5) * 0.4, _wp.y, _wp.z + (Math.random() - 0.5) * 0.4,
        -_fwd.x * speed * 0.15 + (Math.random() - 0.5) * 1.5, 0.8 + Math.random() * 1.2, -_fwd.z * speed * 0.15 + (Math.random() - 0.5) * 1.5,
        wet ? 0.86 : 0.74, wet ? 0.93 : 0.63, wet ? 1.0 : 0.47, wet ? 0.7 : 1.4, wet ? 0.9 : 1.1);
    }
  }

  DR.fx.particles = { emit: emit, burst: burst, update: update, clear: clear, wheelDust: wheelDust };
})(window.DR);
