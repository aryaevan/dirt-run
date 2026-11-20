/*
 * Saved progress. Every localStorage access is wrapped, so the game still runs
 * when storage is blocked (private windows, file:// restrictions).
 *
 * The keys match the original single-file games, so existing progress carries over
 * where the browser shares storage with them.
 */
(function (DR) {
  'use strict';

  var GARAGE_KEY = 'ridge-builder-v1';   // racing: coins, best distance, upgrade levels
  var FLAGS_KEY = 'dirtrun-best';        // exploration: best flag-hunt time in seconds
  var SETTINGS_KEY = 'dirtrun-settings'; // last chosen exploration car
  var PART_IDS = ['engine', 'tyres', 'susp', 'fuel', 'drive', 'chassis'];
  var CARS = ['truck', 'buggy'];

  function read(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function write(key, val) { try { localStorage.setItem(key, val); } catch (e) {} }
  function readJSON(key) { var r = read(key); if (!r) return null; try { return JSON.parse(r); } catch (e) { return null; } }

  function freshGarage() {
    var lv = {};
    PART_IDS.forEach(function (id) { lv[id] = 0; });
    return { coins: 0, best: 0, runs: 0, lv: lv };
  }

  var garage = freshGarage();
  var saved = readJSON(GARAGE_KEY);
  if (saved && saved.lv) {
    garage = saved;
    PART_IDS.forEach(function (id) { if (typeof garage.lv[id] !== 'number') garage.lv[id] = 0; });
  }

  var bestFlags = parseFloat(read(FLAGS_KEY));
  if (!isFinite(bestFlags)) bestFlags = null;

  var settings = readJSON(SETTINGS_KEY) || {};
  if (CARS.indexOf(settings.car) < 0) settings.car = 'truck';

  DR.progress = {
    PART_IDS: PART_IDS,
    get garage() { return garage; },
    saveGarage: function () { write(GARAGE_KEY, JSON.stringify(garage)); },
    resetGarage: function () { garage = freshGarage(); this.saveGarage(); },

    get bestFlags() { return bestFlags; },
    setBestFlags: function (t) { bestFlags = t; write(FLAGS_KEY, String(t)); },

    settings: settings,
    saveSettings: function () { write(SETTINGS_KEY, JSON.stringify(settings)); }
  };
})(window.DR);
