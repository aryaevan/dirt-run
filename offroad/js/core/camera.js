/* Camera rigs: a chase camera for driving and an orbit camera for menus and the garage. */
(function (DR) {
  'use strict';
  var THREE = window.THREE, V3 = THREE.Vector3;
  var cam = DR.stage.camera;
  var heading = new V3(0, 0, 1);         // smoothed flat heading the chase camera follows
  var _f = new V3(), _tgt = new V3(), _look = new V3();

  function flatForward(v, out) {
    v.forward(out); out.y = 0;
    if (out.lengthSq() < 0.01) out.set(0, 0, 1);
    return out.normalize();
  }

  DR.cam = {
    /** Jump straight behind the car, used when a mode starts. o = {d, h} */
    snap: function (v, o) {
      var p = v.S.pos;
      heading.copy(flatForward(v, _f));
      cam.position.set(p.x - heading.x * o.d, p.y + o.h, p.z - heading.z * o.d);
      cam.lookAt(p.x, p.y + 1, p.z);
    },

    /**
     * Follow behind the car.
     * o = {d, h, dirRate, posRate, ahead, lookUp}
     */
    chase: function (dt, v, world, o) {
      var p = v.S.pos;
      v.forward(_f); _f.y = 0;
      if (_f.lengthSq() > 0.01) {
        _f.normalize();
        heading.lerp(_f, 1 - Math.exp(-dt * o.dirRate)).normalize();
      }
      _tgt.set(p.x - heading.x * o.d, p.y + o.h, p.z - heading.z * o.d);
      cam.position.lerp(_tgt, 1 - Math.exp(-dt * o.posRate));
      var ground = world.heightAt(cam.position.x, cam.position.z);
      if (world.water != null) ground = Math.max(ground, world.water);
      if (cam.position.y < ground + 1.2) cam.position.y = ground + 1.2;
      _look.set(p.x + heading.x * o.ahead, p.y + o.lookUp, p.z + heading.z * o.ahead);
      cam.lookAt(_look);
    },

    /**
     * Circle around the car.
     * o = {angle, radius, height, lookY, shift, snap}
     * `shift` moves the look point sideways so the car sits beside a side panel.
     */
    orbit: function (dt, v, o) {
      var p = v.S.pos;
      _tgt.set(p.x + Math.sin(o.angle) * o.radius, p.y + o.height, p.z + Math.cos(o.angle) * o.radius);
      if (o.snap) cam.position.copy(_tgt);
      else cam.position.lerp(_tgt, 1 - Math.exp(-dt * 3));
      _look.set(p.x, p.y + o.lookY, p.z);
      if (o.shift) { _look.x += Math.cos(o.angle) * o.shift; _look.z -= Math.sin(o.angle) * o.shift; }
      cam.lookAt(_look);
    }
  };
})(window.DR);
