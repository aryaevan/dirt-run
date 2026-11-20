/*
 * Physics settings for each car. Both cars run through the same engine
 * (physics/vehicle.js); only these numbers differ.
 *
 *   mass, inertia         kg and rotational inertia per axis (car space)
 *   engine, vmax, vmaxRev drive force (N), top speed forward and in reverse (m/s)
 *   low                   crawl-gear boost at low speed (1 = none)
 *   awd                   four-wheel drive, otherwise rear-wheel drive
 *   mu, lat               tyre grip and sideways stiffness
 *   k, c, rest, rad       spring rate, damping, suspension travel, wheel radius
 *   fsMax                 spring force cap
 *   brake                 brake force cap
 *   coastV/Low/High       rolling resistance below / above coastV with no pedal pressed
 *   steerMax/SpeedK/Rate  steering lock, how much it narrows with speed, and how quickly it turns
 *   right, rightDamp      self-righting torque when wheels touch, and roll/pitch damping
 *   airYaw, airPitch      control torque in the air
 *   drag, airDampW        air drag, and angular damping while airborne
 *   airSpin               free wheel spin speed in the air (visual only)
 *   fuel                  seconds of full throttle per tank (racing only)
 */
(function (DR) {
  'use strict';

  // The truck has no upgrades: it is the stock Dirt Run truck.
  DR.tuning.truck = function () {
    return {
      mass: 1200, inertia: { x: 1700, y: 2000, z: 700 },
      engine: 10500, vmax: 34, vmaxRev: 13, low: 1, awd: true,
      mu: 1.15, lat: 8500, k: 15000, c: 1800, rest: 0.5, rad: 0.4, fsMax: 26000,
      brake: 3400, coastV: 2.5, coastLow: 2200, coastHigh: 70,
      steerMax: 0.62, steerSpeedK: 0.045, steerRate: 7,
      right: 9000, rightDamp: 0, airYaw: 900, airPitch: 0,
      drag: 0.42, airDampW: 0.9995, airSpin: 30,
      fuel: 30
    };
  };

  // The buggy gets better with each garage upgrade level in L.
  DR.tuning.buggy = function (L) {
    return {
      mass: 950 + L.engine * 25 + L.chassis * 30, inertia: { x: 1500, y: 1800, z: 650 },
      engine: 5200 + L.engine * 1750, vmax: 16 + L.engine * 3.3, vmaxRev: 8,
      low: 1 + Math.max(0, L.drive - 1) * 0.35, awd: L.drive >= 1,
      mu: 0.78 + L.tyres * 0.09, lat: 5800 + L.tyres * 750,
      rad: 0.36 + L.tyres * 0.03, tyreW: 0.26 + L.tyres * 0.035,
      k: 11000 + L.susp * 1700, c: 1100 + L.susp * 230, rest: 0.3 + L.susp * 0.045, fsMax: 24000,
      brake: 3200, coastV: 2, coastLow: 2400, coastHigh: 60,
      steerMax: 0.5, steerSpeedK: 0.09, steerRate: 4.5,
      right: 3000 + L.chassis * 1900, rightDamp: 0.12,
      airYaw: 350 + L.chassis * 150, airPitch: 900 + L.chassis * 220,
      drag: 1.0, airDampW: 0.9992, airSpin: 25,
      fuel: 18 + L.fuel * 9
    };
  };
})(window.DR);
