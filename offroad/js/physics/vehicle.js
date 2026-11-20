/*
 * Vehicle physics shared by both cars and both modes.
 *
 * A rigid body with four raycast wheels: spring and damper suspension, tyre
 * grip with a friction circle, engine and brakes, ground contact for the body
 * corners, water buoyancy, tree and rock collisions, plus some arcade help
 * (self-righting, air control).
 *
 * Usage:
 *   var v = new DR.Vehicle();
 *   v.setup(model, tune);           // model from js/assets, tune from physics/tuning.js
 *   v.place(world, x, z, yaw);
 *   v.step(dt, controls, world);    // fixed time step; controls may be null
 *   v.syncVisual(dt);               // once per frame
 *
 * controls = {up, down, left, right, brake (handbrake), noThrottle (out of fuel)}
 * world    = {heightAt, normalAt, water (or null), obstacles (or null)}
 */
(function (DR) {
  'use strict';
  var THREE = window.THREE, V3 = THREE.Vector3;
  var G = 9.81, Y_AXIS = new V3(0, 1, 0);
  var NO_INPUT = Object.freeze({ up: false, down: false, left: false, right: false, brake: false, noThrottle: false });

  // scratch objects, reused every step to avoid garbage
  var _up = new V3(), _fwd = new V3(), _rt = new V3(), _A = new V3(), _P = new V3(), _N = new V3(),
      _f = new V3(), _s = new V3(), _wf = new V3(), _r = new V3(), _r2 = new V3(), _vp = new V3(),
      _tmp = new V3(), _cross = new V3(), _dir = new V3();
  var _qi = new THREE.Quaternion(), _dq = new THREE.Quaternion();

  function clampAbs(v, a) { return Math.max(-a, Math.min(a, v)); }

  function Vehicle() {
    this.S = { pos: new V3(), vel: new V3(), w: new V3(), q: new THREE.Quaternion(), steer: 0, throttle: 0 };
    this.group = null;
    this.wheels = [];
    this.hull = [];
    this.radius = 1.5;
    this.T = null;
    this.onLost = null;   // called when the car falls through the world or the state breaks
    this.F = new V3();    // force accumulator
    this.Tq = new V3();   // torque accumulator
  }

  /** Attach a model (from js/assets) and its tuning. Keeps the current position. */
  Vehicle.prototype.setup = function (model, tune) {
    this.group = model.group;
    this.hull = model.hull;
    this.radius = model.radius;
    this.T = tune;
    this.wheels = model.wheels.map(function (w) {
      return { off: w.off, front: w.front, pivot: w.pivot, spin: w.spin,
        prev: 0, sus: tune.rest, grounded: false, vL: 0, slip: 0 };
    });
  };

  Vehicle.prototype.forward = function (out) { return out.set(0, 0, 1).applyQuaternion(this.S.q); };
  Vehicle.prototype.up = function (out) { return out.set(0, 1, 0).applyQuaternion(this.S.q); };
  Vehicle.prototype.forwardSpeed = function () { return this.S.vel.dot(this.forward(_tmp)); };

  Vehicle.prototype.addForceAt = function (f, p) {
    this.F.add(f);
    _r.subVectors(p, this.S.pos);
    _cross.crossVectors(_r, f);
    this.Tq.add(_cross);
  };

  Vehicle.prototype.pointVel = function (p, out) {
    _r2.subVectors(p, this.S.pos);
    return out.crossVectors(this.S.w, _r2).add(this.S.vel);
  };

  /** Drop the car at rest onto the ground at (x, z), facing `yaw`. */
  Vehicle.prototype.place = function (world, x, z, yaw) {
    var S = this.S, T = this.T;
    S.pos.set(x, world.heightAt(x, z) + T.rest + T.rad + 0.5, z);
    S.vel.set(0, 0, 0); S.w.set(0, 0, 0); S.steer = 0; S.throttle = 0;
    S.q.setFromAxisAngle(Y_AXIS, yaw || 0);
    this.wheels.forEach(function (w) { w.prev = 0; w.sus = T.rest; w.vL = 0; });
  };

  /** Put the car back on its wheels where it is, keeping its heading. */
  Vehicle.prototype.upright = function (world) {
    this.forward(_fwd);
    var yaw = isFinite(_fwd.x) ? Math.atan2(_fwd.x, _fwd.z) : 0;
    var x = isFinite(this.S.pos.x) ? this.S.pos.x : 0, z = isFinite(this.S.pos.z) ? this.S.pos.z : 0;
    this.place(world, x, z, yaw);
  };

  Vehicle.prototype.step = function (dt, ctl, world) {
    ctl = ctl || NO_INPUT;
    var S = this.S, q = S.q, T = this.T, M = T.mass, F = this.F, Tq = this.Tq;
    var water = world.water == null ? null : world.water;

    _up.set(0, 1, 0).applyQuaternion(q);
    _fwd.set(0, 0, 1).applyQuaternion(q);
    _rt.set(1, 0, 0).applyQuaternion(q);
    F.set(0, -G * M, 0);
    Tq.set(0, 0, 0);

    var fwdSpeed = S.vel.dot(_fwd), absV = Math.abs(fwdSpeed);
    var kU = !!ctl.up, kD = !!ctl.down, kL = !!ctl.left, kR = !!ctl.right, hb = !!ctl.brake;

    // pedals: holding the opposite direction brakes first, then reverses
    var throttle = 0, braking = false;
    if (kU) { if (fwdSpeed < -1) braking = true; else throttle = 1; }
    if (kD) { if (fwdSpeed > 1) braking = true; else throttle = -0.6; }
    if (kU && kD) { throttle = 0; braking = true; }
    if (ctl.noThrottle) throttle = 0;
    S.throttle = throttle;

    var steerDir = (kL ? 1 : 0) - (kR ? 1 : 0);
    var steerTarget = steerDir * T.steerMax / (1 + absV * T.steerSpeedK);
    S.steer += (steerTarget - S.steer) * Math.min(1, dt * T.steerRate);

    var vmax = throttle > 0 ? T.vmax : T.vmaxRev;
    var lowBoost = 1 + (T.low - 1) * Math.max(0, 1 - absV / 8);
    var drive = throttle * T.engine * lowBoost * Math.max(0, 1 - absV / vmax);
    var RAD = T.rad, REST = T.rest, maxD = REST + RAD;

    // ---- wheels ----
    var grounded = 0;
    for (var i = 0; i < this.wheels.length; i++) {
      var wh = this.wheels[i];
      _A.copy(wh.off).applyQuaternion(q).add(S.pos);
      _dir.copy(_up).negate();
      wh.grounded = false;

      if (_dir.y < -0.45) {
        // cast down the suspension axis, refined once against the sloped ground
        var d = (_A.y - world.heightAt(_A.x, _A.z)) / (-_dir.y);
        if (d < maxD + 1.5) { _P.copy(_A).addScaledVector(_dir, d); d += (_P.y - world.heightAt(_P.x, _P.z)) / (-_dir.y); }

        if (d < maxD && d > -1.5) {
          wh.grounded = true; grounded++;
          var comp = Math.min(maxD - d, maxD + 0.4);
          var cv = Math.max(-8, Math.min(8, (comp - wh.prev) / dt));
          wh.prev = comp;
          wh.sus = Math.max(0.02, d - RAD);

          // suspension, with a stiff bump stop near full compression
          var fs = T.k * comp + T.c * cv, stop = REST * 0.85;
          if (comp > stop) fs += (comp - stop) * T.k * 5;
          if (fs < 0) fs = 0; if (fs > T.fsMax) fs = T.fsMax;
          _P.copy(_A).addScaledVector(_dir, d);
          world.normalAt(_P.x, _P.z, _N);
          _tmp.copy(_up).multiplyScalar(fs * Math.max(0, _N.dot(_up)));
          this.addForceAt(_tmp, _A);

          // tyre axes on the ground plane
          if (wh.front) {
            var cs = Math.cos(S.steer), sn = Math.sin(S.steer);
            _wf.copy(_fwd).multiplyScalar(cs).addScaledVector(_rt, sn);
          } else _wf.copy(_fwd);
          _f.copy(_wf).addScaledVector(_N, -_wf.dot(_N)).normalize();
          _s.crossVectors(_N, _f).normalize();
          this.pointVel(_A, _vp);
          var vL = _vp.dot(_f), vS = _vp.dot(_s);
          wh.vL = vL;

          var hand = hb && !wh.front;           // handbrake locks the rear wheels
          var driven = T.awd || !wh.front;
          var Fs = -vS * (hand ? T.lat * 0.22 : T.lat);
          var Fl = driven ? drive * (T.awd ? 0.25 : 0.5) : 0;
          if (braking) Fl -= clampAbs(vL * 3000, T.brake);
          if (hand) Fl -= clampAbs(vL * 3000, T.brake * 0.8);
          if (throttle === 0 && !braking) Fl -= vL * (Math.abs(vL) < T.coastV ? T.coastLow : T.coastHigh);

          // friction circle
          var maxF = T.mu * fs * (hand ? 0.55 : 1), tot = Math.hypot(Fs, Fl), sat = 0;
          if (tot > maxF && tot > 0) { var kk = maxF / tot; Fs *= kk; Fl *= kk; sat = 1; }
          wh.slip = Math.abs(vS) + sat * Math.abs(throttle) * 4;
          if (sat && throttle !== 0 && driven) wh.vL += throttle * 6; // visible wheelspin

          _tmp.copy(_f).multiplyScalar(Fl).addScaledVector(_s, Fs);
          _P.copy(_A).addScaledVector(_up, 0.12); // tyre forces applied near centre-of-mass height: arcade anti-roll
          this.addForceAt(_tmp, _P);
        }
      }
      if (!wh.grounded) {
        wh.prev = 0; wh.slip = 0;
        wh.sus += (REST - wh.sus) * Math.min(1, dt * 10);
        wh.vL += (throttle * T.airSpin - wh.vL) * Math.min(1, dt * 0.8);
      }
    }

    // ---- body corners hitting the ground (rollovers, hard landings) ----
    var bodyHit = false;
    for (var b = 0; b < this.hull.length; b++) {
      _A.copy(this.hull[b]).applyQuaternion(q).add(S.pos);
      var pen = world.heightAt(_A.x, _A.z) - _A.y;
      if (pen > 0) {
        bodyHit = true;
        world.normalAt(_A.x, _A.z, _N);
        this.pointVel(_A, _vp);
        var vn = _vp.dot(_N);
        var fn = Math.min(pen, 0.4) * 70000 - vn * 5000; if (fn < 0) fn = 0; if (fn > 45000) fn = 45000;
        if (pen > 0.4) {
          S.pos.addScaledVector(_N, (pen - 0.4) * 0.5);
          var vin = S.vel.dot(_N); if (vin < 0) S.vel.addScaledVector(_N, -vin * 0.5);
        }
        _tmp.copy(_vp).addScaledVector(_N, -vn);
        var vt = _tmp.length(), ft = Math.min(vt * 2500, fn * 0.7);
        if (vt > 1e-4) _tmp.multiplyScalar(-ft / vt); else _tmp.set(0, 0, 0);
        _tmp.addScaledVector(_N, fn);
        this.addForceAt(_tmp, _A);
      }
    }

    // ---- arcade help ----
    var underwater = water !== null && S.pos.y < water + 0.5;
    if (grounded > 0) {
      _cross.crossVectors(_up, Y_AXIS);
      Tq.addScaledVector(_cross, T.right * grounded / 4);
      if (T.rightDamp) {
        _tmp.copy(S.w).addScaledVector(_up, -S.w.dot(_up));
        Tq.addScaledVector(_tmp, -T.right * T.rightDamp * grounded / 4);
      }
    } else if (!bodyHit && !underwater) {
      Tq.addScaledVector(_up, steerDir * T.airYaw);
      Tq.addScaledVector(_rt, ((kD ? 1 : 0) - (kU ? 1 : 0)) * T.airPitch); // gas lifts the nose, brake drops it
    }

    // ---- drag and water ----
    F.addScaledVector(S.vel, -T.drag * S.vel.length());
    if (underwater) {
      var depth = water + 0.5 - S.pos.y;
      F.y += Math.min(depth, 1.5) * M * 3;
      F.addScaledVector(S.vel, -M * 0.55);
      S.w.multiplyScalar(1 - Math.min(0.5, dt * 2.5));
    }

    // ---- integrate ----
    S.vel.addScaledVector(F, dt / M);
    S.pos.addScaledVector(S.vel, dt);
    _qi.copy(q).invert();
    _tmp.copy(Tq).applyQuaternion(_qi);
    _tmp.set(_tmp.x / T.inertia.x, _tmp.y / T.inertia.y, _tmp.z / T.inertia.z).applyQuaternion(q);
    S.w.addScaledVector(_tmp, dt);
    S.w.multiplyScalar(grounded ? 0.9985 : T.airDampW);
    _dq.set(S.w.x * dt * 0.5, S.w.y * dt * 0.5, S.w.z * dt * 0.5, 0).multiply(q);
    q.set(q.x + _dq.x, q.y + _dq.y, q.z + _dq.z, q.w + _dq.w).normalize();

    // ---- trees and rocks ----
    var obs = world.obstacles;
    if (obs) {
      for (var o = 0; o < obs.length; o++) {
        var ob = obs[o], dx = S.pos.x - ob.x, dz = S.pos.z - ob.z, md = ob.r + this.radius, d2 = dx * dx + dz * dz;
        if (d2 < md * md && Math.abs(S.pos.y - ob.y) < ob.hgt) {
          var dd = Math.sqrt(d2) || 0.001, nx = dx / dd, nz = dz / dd;
          S.pos.x += nx * (md - dd); S.pos.z += nz * (md - dd);
          var vno = S.vel.x * nx + S.vel.z * nz;
          if (vno < 0) { S.vel.x -= nx * vno * 1.35; S.vel.z -= nz * vno * 1.35; S.w.multiplyScalar(0.85); }
        }
      }
    }

    if (!isFinite(S.pos.x) || !isFinite(q.w) || S.pos.y < world.heightAt(S.pos.x, S.pos.z) - 4) {
      if (this.onLost) this.onLost();
    }
  };

  /** Move the 3D model to the physics state, compress the suspension, steer and spin the wheels. */
  Vehicle.prototype.syncVisual = function (dt) {
    var S = this.S, rad = this.T.rad;
    this.group.position.copy(S.pos);
    this.group.quaternion.copy(S.q);
    for (var i = 0; i < this.wheels.length; i++) {
      var wh = this.wheels[i];
      wh.pivot.position.set(wh.off.x, wh.off.y - wh.sus, wh.off.z);
      wh.pivot.rotation.y = wh.front ? S.steer : 0;
      wh.spin.rotation.x += wh.vL / rad * dt;
    }
    this.group.updateMatrixWorld();
  };

  DR.Vehicle = Vehicle;
})(window.DR);
