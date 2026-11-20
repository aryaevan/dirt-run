/*
 * Physics settings for each car. Both cars run through the same engine
 * (physics/vehicle.js); only these numbers differ.
 *
 *   mass, inertia         kg and rotational inertia per axis (car space)
 *   engine, vmax, vmaxRev drive force (N), top speed forward and in reverse (m/s)
 *   low                   crawl-gear boost at low speed (1 = none)
 *   awd                   four-wheel drive, otherwise rear-wheel drive
 *   mu, lat               tyre grip and sideways stiffness
 *   rest, rad             suspension travel and wheel radius (m)
 *   susp                  suspension settings, with one block per axle: {front, rear}
 *                         (built by DR.tuning.axle; see "Suspension" below)
 *   brake                 brake force cap
 *   coastV/Low/High       rolling resistance below / above coastV with no pedal pressed
 *   steerMax/SpeedK/Rate  steering lock, how much it narrows with speed, and how quickly it turns
 *   right, rightDamp      self-righting torque when wheels touch, and roll/pitch damping
 *   airYaw, airPitch      control torque in the air
 *   drag, airDampW        air drag, and angular damping while airborne
 *   airSpin               free wheel spin speed in the air (visual only)
 *   fuel                  seconds of full throttle per tank (racing only)
 *
 * Suspension (per axle, modelled on the BeamNG tuning screen):
 *   spring                spring rate (N/m)
 *   bump, fastBump        compression damping below / above the knee (N/m/s)
 *   rebound, fastRebound  extension damping below / above the knee (N/m/s)
 *   knee                  damper knee: shaft speed where slow damping hands over to fast (m/s)
 *   antiRoll              anti-roll bar: extra force per metre of left/right compression
 *                         difference on this axle (N/m). 0 = no bar
 *   rideHeight            spring preload as % of travel (-100..100). 0 = stock,
 *                         negative lowers the car, positive raises it
 *   bumpStop              compression (fraction of travel) where the bump stop engages
 *   bumpStopRate          bump stop stiffness, as a multiple of the spring rate
 *   fsMax                 cap on the total suspension force per wheel (N)
 *   maxVel                cap on suspension shaft speed used by the damper (m/s)
 *   tyreForceHeight       how far above the wheel mount the tyre forces act (m).
 *                         Higher = less body roll from cornering (arcade anti-roll)
 */
(function (DR) {
  'use strict';

  /**
   * Build one axle's suspension settings. Anything not given falls back to a
   * linear damper of `c` and the stock behaviour, so the defaults drive the
   * same as the old single spring/damper model.
   */
  DR.tuning.axle = function (o) {
    var c = o.c != null ? o.c : 1500;
    function pick(key, def) { return o[key] != null ? o[key] : def; }
    var bump = pick('bump', c), rebound = pick('rebound', c);
    return {
      spring: pick('spring', 15000),
      bump: bump, fastBump: pick('fastBump', bump),
      rebound: rebound, fastRebound: pick('fastRebound', rebound),
      knee: pick('knee', 0.1),
      antiRoll: pick('antiRoll', 0),
      rideHeight: pick('rideHeight', 0),
      bumpStop: pick('bumpStop', 0.85),
      bumpStopRate: pick('bumpStopRate', 5),
      fsMax: pick('fsMax', 26000),
      maxVel: pick('maxVel', 8),
      tyreForceHeight: pick('tyreForceHeight', 0.12)
    };
  };

  // The truck has no upgrades: it is the stock Dirt Run truck.
  DR.tuning.truck = function () {
    return {
      mass: 1200, inertia: { x: 1700, y: 2000, z: 700 },
      engine: 10500, vmax: 34, vmaxRev: 13, low: 1, awd: true,
      mu: 1.15, lat: 8500, rest: 0.5, rad: 0.4,
      susp: {
        front: DR.tuning.axle({
          spring: 15000,
          bump: 1800, fastBump: 1800, rebound: 1800, fastRebound: 1800, knee: 0.1,
          antiRoll: 3500, rideHeight: 0,
          bumpStop: 0.85, bumpStopRate: 5, fsMax: 26000, maxVel: 8, tyreForceHeight: 0.12
        }),
        rear: DR.tuning.axle({
          spring: 15000,
          bump: 1800, fastBump: 1800, rebound: 1800, fastRebound: 1800, knee: 0.1,
          antiRoll: 1500, rideHeight: 0,
          bumpStop: 0.85, bumpStopRate: 5, fsMax: 26000, maxVel: 8, tyreForceHeight: 0.12
        })
      },
      brake: 3400, coastV: 2.5, coastLow: 2200, coastHigh: 70,
      steerMax: 0.62, steerSpeedK: 0.045, steerRate: 7,
      right: 9000, rightDamp: 0, airYaw: 900, airPitch: 0,
      drag: 0.42, airDampW: 0.9995, airSpin: 30,
      fuel: 30
    };
  };

  // The buggy gets better with each garage upgrade level in L.
  DR.tuning.buggy = function (L) {
    var spring = 11000 + L.susp * 1700, damp = 1100 + L.susp * 230;
    return {
      mass: 950 + L.engine * 25 + L.chassis * 30, inertia: { x: 1500, y: 1800, z: 650 },
      engine: 5200 + L.engine * 1750, vmax: 16 + L.engine * 3.3, vmaxRev: 8,
      low: 1 + Math.max(0, L.drive - 1) * 0.35, awd: L.drive >= 1,
      mu: 0.78 + L.tyres * 0.09, lat: 5800 + L.tyres * 750,
      rad: 0.36 + L.tyres * 0.03, tyreW: 0.26 + L.tyres * 0.035,
      rest: 0.3 + L.susp * 0.045,
      susp: {
        front: DR.tuning.axle({
          spring: spring,
          bump: damp, fastBump: damp, rebound: damp, fastRebound: damp, knee: 0.1,
          antiRoll: Math.round(spring * 0.22), rideHeight: 0,
          bumpStop: 0.85, bumpStopRate: 5, fsMax: 24000, maxVel: 8, tyreForceHeight: 0.12
        }),
        rear: DR.tuning.axle({
          spring: spring,
          bump: damp, fastBump: damp, rebound: damp, fastRebound: damp, knee: 0.1,
          antiRoll: Math.round(spring * 0.08), rideHeight: 0,
          bumpStop: 0.85, bumpStopRate: 5, fsMax: 24000, maxVel: 8, tyreForceHeight: 0.12
        })
      },
      brake: 3200, coastV: 2, coastLow: 2400, coastHigh: 60,
      steerMax: 0.5, steerSpeedK: 0.09, steerRate: 4.5,
      right: 3000 + L.chassis * 1900, rightDamp: 0.12,
      airYaw: 350 + L.chassis * 150, airPitch: 900 + L.chassis * 220,
      drag: 1.0, airDampW: 0.9992, airSpin: 25,
      fuel: 18 + L.fuel * 9
    };
  };
})(window.DR);
