/*
 * Heightfield terrain shared by both worlds.
 *
 * Samples a height function on a regular grid, builds the flat-shaded mesh and
 * exposes heightAt()/normalAt(). heightAt() interpolates over the same two
 * triangles per cell that THREE.PlaneGeometry draws, so the physics matches the
 * ground you see exactly.
 *
 * options:
 *   x0, z0          corner of the grid in world space
 *   width, length   size along X and Z (metres)
 *   nx, nz          number of cells along X and Z
 *   height(x, z)    height function
 *   color(x, z, y, outColor, terrain)  vertex colour function
 *   normalEps       sample distance for normals (default 0.5)
 */
(function (DR) {
  'use strict';
  var THREE = window.THREE;

  function Terrain(o) {
    var nx = o.nx, nz = o.nz, x0 = o.x0, z0 = o.z0;
    var cx = o.width / nx, cz = o.length / nz, gw = nx + 1;
    var eps = o.normalEps || 0.5, maxX = nx - 1e-4, maxZ = nz - 1e-4;

    var H = new Float32Array(gw * (nz + 1));
    for (var iz = 0; iz <= nz; iz++) {
      for (var ix = 0; ix <= nx; ix++) H[iz * gw + ix] = o.height(x0 + ix * cx, z0 + iz * cz);
    }

    function heightAt(x, z) {
      var gx = (x - x0) / cx, gz = (z - z0) / cz;
      if (gx < 0) gx = 0; if (gz < 0) gz = 0; if (gx > maxX) gx = maxX; if (gz > maxZ) gz = maxZ;
      var ix = Math.floor(gx), iz = Math.floor(gz), fx = gx - ix, fz = gz - iz;
      var ha = H[iz * gw + ix], hd = H[iz * gw + ix + 1], hb = H[(iz + 1) * gw + ix], hc = H[(iz + 1) * gw + ix + 1];
      if (fx + fz <= 1) return ha + (hd - ha) * fx + (hb - ha) * fz;
      return hc + (hb - hc) * (1 - fx) + (hd - hc) * (1 - fz);
    }

    function normalAt(x, z, out) {
      return out.set(heightAt(x - eps, z) - heightAt(x + eps, z), 2 * eps, heightAt(x, z - eps) - heightAt(x, z + eps)).normalize();
    }

    this.heightAt = heightAt;
    this.normalAt = normalAt;

    var geo = new THREE.PlaneGeometry(o.width, o.length, nx, nz);
    geo.rotateX(-Math.PI / 2);
    geo.translate(x0 + o.width / 2, 0, z0 + o.length / 2);
    var pos = geo.attributes.position, cols = new Float32Array(pos.count * 3), c = new THREE.Color();
    for (var i = 0; i < pos.count; i++) {
      var x = pos.getX(i), z = pos.getZ(i);
      var y = H[Math.round((z - z0) / cz) * gw + Math.round((x - x0) / cx)];
      pos.setY(i, y);
      o.color(x, z, y, c, this);
      cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    geo.computeVertexNormals();

    this.mesh = new THREE.Mesh(geo, DR.mat.terrain);
    this.mesh.receiveShadow = true;
  }

  DR.Terrain = Terrain;
})(window.DR);
