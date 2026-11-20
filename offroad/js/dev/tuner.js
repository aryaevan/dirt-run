/*
 * Dev mode: live car tuning panel.
 *
 * Press ` (backquote) at any time, or open index.html?dev, to show the panel.
 * Every number in physics/tuning.js can be adjusted while driving; changes act
 * on the running car immediately. Edits are saved per car in localStorage as
 * overrides on top of tuning.js, so they survive reloads and car switches.
 * "Copy JSON" puts the full tuning on the clipboard for pasting into tuning.js.
 *
 * Note: for the buggy, overrides replace the garage-upgrade value for that field.
 * `rad` changes physics only; the wheel model keeps its built size.
 */
(function (DR) {
  'use strict';

  var STORE_KEY = 'dirtrun-dev-tune';
  function read() { try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (e) { return {}; } }
  function write(o) { try { localStorage.setItem(STORE_KEY, JSON.stringify(o)); } catch (e) {} }
  var overrides = read(); // { carId: { "susp.front.spring": 20000, ... } }

  // [path, label, min, max, step, unit]   path is relative to the tuning object
  var AXLE = [
    ['spring', 'Spring rate', 0, 60000, 500, 'N/m'],
    ['bump', 'Bump damping', 0, 10000, 50, 'N/m/s'],
    ['fastBump', 'Fast bump damping', 0, 10000, 50, 'N/m/s'],
    ['rebound', 'Rebound damping', 0, 20000, 50, 'N/m/s'],
    ['fastRebound', 'Fast rebound damping', 0, 20000, 50, 'N/m/s'],
    ['knee', 'Damping knee', 0.01, 1, 0.01, 'm/s'],
    ['antiRoll', 'Anti-roll stiffness', 0, 30000, 100, 'N/m'],
    ['rideHeight', 'Ride height', -100, 100, 1, '%'],
    ['bumpStop', 'Bump stop at', 0.5, 1, 0.01, '× travel'],
    ['bumpStopRate', 'Bump stop rate', 0, 20, 0.5, '× spring'],
    ['fsMax', 'Force cap', 5000, 80000, 500, 'N'],
    ['maxVel', 'Max shaft speed', 1, 20, 0.5, 'm/s'],
    ['tyreForceHeight', 'Tyre force height', -0.5, 1, 0.01, 'm']
  ];
  var SECTIONS = [
    { title: 'Suspension', axle: true },
    { title: 'Chassis', rows: [
      ['mass', 'Mass', 300, 4000, 10, 'kg'],
      ['inertia.x', 'Inertia pitch', 100, 6000, 50, ''],
      ['inertia.y', 'Inertia yaw', 100, 6000, 50, ''],
      ['inertia.z', 'Inertia roll', 100, 6000, 50, ''],
      ['rest', 'Suspension travel', 0.1, 1, 0.01, 'm'],
      ['rad', 'Wheel radius', 0.2, 0.8, 0.01, 'm']
    ] },
    { title: 'Engine & brakes', rows: [
      ['engine', 'Engine force', 0, 30000, 100, 'N'],
      ['vmax', 'Top speed', 5, 80, 0.5, 'm/s'],
      ['vmaxRev', 'Reverse top speed', 2, 30, 0.5, 'm/s'],
      ['low', 'Crawl boost', 1, 4, 0.05, '×'],
      ['awd', 'Four-wheel drive', 0, 1, 1, 'bool'],
      ['brake', 'Brake force', 0, 15000, 100, 'N'],
      ['fuel', 'Fuel (racing)', 5, 120, 1, 's']
    ] },
    { title: 'Tyres', rows: [
      ['mu', 'Grip', 0.2, 2.5, 0.01, ''],
      ['lat', 'Lateral stiffness', 1000, 30000, 100, ''],
      ['coastV', 'Coast threshold', 0, 10, 0.1, 'm/s'],
      ['coastLow', 'Rolling resistance low', 0, 6000, 50, ''],
      ['coastHigh', 'Rolling resistance high', 0, 500, 5, '']
    ] },
    { title: 'Steering', rows: [
      ['steerMax', 'Steering lock', 0.1, 1.2, 0.01, 'rad'],
      ['steerSpeedK', 'Speed narrowing', 0, 0.3, 0.005, ''],
      ['steerRate', 'Steering speed', 1, 20, 0.5, '']
    ] },
    { title: 'Assists & air', rows: [
      ['right', 'Self-righting', 0, 20000, 100, ''],
      ['rightDamp', 'Roll/pitch damping', 0, 1, 0.01, ''],
      ['airYaw', 'Air yaw control', 0, 3000, 25, ''],
      ['airPitch', 'Air pitch control', 0, 3000, 25, ''],
      ['drag', 'Air drag', 0, 3, 0.01, ''],
      ['airDampW', 'Air spin damping', 0.99, 1, 0.0001, '']
    ] }
  ];

  function get(obj, path) {
    var p = path.split('.');
    for (var i = 0; i < p.length; i++) { if (obj == null) return undefined; obj = obj[p[i]]; }
    return obj;
  }
  function set(obj, path, v) {
    var p = path.split('.');
    for (var i = 0; i < p.length - 1; i++) obj = obj[p[i]];
    obj[p[p.length - 1]] = v;
  }
  function decimals(step) { var s = String(step); return s.indexOf('.') < 0 ? 0 : s.length - s.indexOf('.') - 1; }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  // ---------- panel ----------
  var panel = el('aside', 'panel'); panel.id = 'dev'; panel.hidden = true;
  panel.setAttribute('aria-label', 'Dev tuning');
  var head = el('header');
  var title = el('h2', null, 'Dev tuning');
  var carName = el('span', 'dev-car');
  var closeBtn = el('button', 'text-btn', 'Close');
  head.append(title, carName, closeBtn);

  var tele = el('div', 'dev-tele');
  var body = el('div', 'dev-body');
  var foot = el('footer');
  var linkLabel = el('label', 'dev-link');
  var linkBox = el('input'); linkBox.type = 'checkbox';
  linkLabel.append(linkBox, document.createTextNode(' Link front/rear'));
  var copyBtn = el('button', 'text-btn', 'Copy JSON');
  var resetBtn = el('button', 'text-btn', 'Reset to stock');
  foot.append(linkLabel, copyBtn, resetBtn);
  panel.append(head, tele, body, foot);
  document.body.appendChild(panel);

  // telemetry: one cell per wheel, compression bar + force
  var WHEEL_NAMES = ['FL', 'FR', 'RL', 'RR'];
  var teleCells = WHEEL_NAMES.map(function (n) {
    var c = el('div', 'dev-wheel'), bar = el('i'), txt = el('span');
    c.append(el('b', null, n), el('div', 'dev-bar'), txt);
    c.children[1].appendChild(bar);
    tele.appendChild(c);
    return { bar: bar, txt: txt };
  });
  var teleSpeed = el('div', 'dev-speed'); tele.appendChild(teleSpeed);

  var controls = []; // {path, input, number, step, refresh()}
  var open = {};     // which <details> are expanded, kept across rebuilds
  open.Suspension = true;

  function T() { return DR.player && DR.player.T; }
  function carId() { return DR.player && DR.player.carId; }

  function save(path, v) {
    var id = carId(); if (!id) return;
    (overrides[id] = overrides[id] || {})[path] = v;
    write(overrides);
  }

  function addRow(parent, path, label, min, max, step, unit) {
    var t = T(), v = get(t, path);
    var row = el('div', 'dev-row');
    var name = el('label', null, label);
    row.appendChild(name);
    var ctl = { path: path };

    if (unit === 'bool') {
      var box = el('input'); box.type = 'checkbox'; box.checked = !!v;
      box.addEventListener('change', function () { apply(path, box.checked); });
      row.append(box);
      ctl.refresh = function () { box.checked = !!get(T(), path); };
    } else {
      var range = el('input'); range.type = 'range';
      var num = el('input'); num.type = 'number';
      var dec = decimals(step);
      [range, num].forEach(function (inp) { inp.min = min; inp.max = max; inp.step = step; });
      function show(val) {
        if (val > +range.max) range.max = val;
        if (val < +range.min) range.min = val;
        range.value = val;
        num.value = (+val).toFixed(dec);
      }
      show(v);
      range.addEventListener('input', function () { num.value = (+range.value).toFixed(dec); apply(path, +range.value); });
      num.addEventListener('change', function () {
        var n = parseFloat(num.value);
        if (!isFinite(n)) { show(get(T(), path)); return; }
        show(n); apply(path, n);
      });
      var u = el('span', 'dev-unit', unit);
      row.append(range, num, u);
      ctl.refresh = function () { show(get(T(), path)); };
    }
    controls.push(ctl);
    parent.appendChild(row);
  }

  function apply(path, v) {
    var t = T(); if (!t) return;
    var paths = [path];
    if (linkBox.checked && /^susp\.(front|rear)\./.test(path)) {
      paths.push(path.replace(/^susp\.(front|rear)/, function (m, a) { return 'susp.' + (a === 'front' ? 'rear' : 'front'); }));
    }
    paths.forEach(function (p) {
      set(t, p, v);
      save(p, v);
      controls.forEach(function (c) { if (c.path === p && p !== path) c.refresh(); });
    });
  }

  function section(titleText) {
    var d = el('details'); d.open = !!open[titleText];
    d.addEventListener('toggle', function () { open[titleText] = d.open; });
    d.appendChild(el('summary', null, titleText));
    body.appendChild(d);
    return d;
  }

  function build() {
    body.textContent = ''; controls = [];
    var t = T(); if (!t) return;
    carName.textContent = carId() || '';
    SECTIONS.forEach(function (s) {
      var d = section(s.title);
      if (s.axle) {
        if (!t.susp) { d.appendChild(el('p', 'dev-note', 'This car has no per-axle suspension block.')); return; }
        ['front', 'rear'].forEach(function (ax) {
          d.appendChild(el('h3', null, ax === 'front' ? 'Front' : 'Rear'));
          AXLE.forEach(function (r) { addRow(d, 'susp.' + ax + '.' + r[0], r[1], r[2], r[3], r[4], r[5]); });
        });
      } else {
        s.rows.forEach(function (r) { if (get(t, r[0]) !== undefined) addRow(d, r[0], r[1], r[2], r[3], r[4], r[5]); });
      }
    });
  }

  copyBtn.addEventListener('click', function () {
    var json = JSON.stringify(T(), null, 2);
    var done = function () { copyBtn.textContent = 'Copied'; setTimeout(function () { copyBtn.textContent = 'Copy JSON'; }, 1200); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(json).then(done, function () { console.log(json); });
    else console.log(json);
  });

  resetBtn.addEventListener('click', function () {
    var id = carId(); if (!id) return;
    delete overrides[id]; write(overrides);
    // rebuild the stock tuning and copy it into the live object, so the wheels'
    // axle references stay valid
    var stock = DR.tuning[id](DR.progress.garage.lv), t = T();
    Object.keys(stock).forEach(function (k) {
      if (k === 'susp') { Object.assign(t.susp.front, stock.susp.front); Object.assign(t.susp.rear, stock.susp.rear); }
      else if (k === 'inertia') Object.assign(t.inertia, stock.inertia);
      else t[k] = stock[k];
    });
    controls.forEach(function (c) { c.refresh(); });
  });

  closeBtn.addEventListener('click', function () { toggle(false); });

  function toggle(on) {
    panel.hidden = on == null ? !panel.hidden : !on;
    if (!panel.hidden) build();
    else if (panel.contains(document.activeElement)) document.activeElement.blur();
  }

  // ---------- telemetry ----------
  var teleT = 0;
  function tick(now) {
    requestAnimationFrame(tick);
    if (panel.hidden || now - teleT < 100) return;
    teleT = now;
    var p = DR.player, t = p && p.T; if (!t || !p.wheels.length) return;
    p.wheels.forEach(function (w, i) {
      var c = teleCells[i]; if (!c) return;
      var pct = Math.max(0, Math.min(1, w.comp / (t.rest + t.rad)));
      c.bar.style.width = (pct * 100).toFixed(0) + '%';
      c.bar.parentNode.classList.toggle('air', !w.grounded);
      c.txt.textContent = w.grounded ? (w.fs / 1000).toFixed(1) + ' kN' : 'air';
    });
    teleSpeed.textContent = Math.round(Math.abs(p.forwardSpeed()) * 3.6) + ' km/h';
  }
  requestAnimationFrame(tick);

  window.addEventListener('keydown', function (e) {
    if (e.code !== 'Backquote') return;
    var tg = e.target;
    if (tg && tg.tagName === 'INPUT' && tg.type === 'number') return;
    e.preventDefault();
    toggle();
  });

  DR.dev = {
    /** Apply saved overrides to a freshly built tuning (called by DR.useCar). */
    applyOverrides: function (id, tune) {
      var o = overrides[id]; if (!o) return;
      Object.keys(o).forEach(function (path) {
        try { if (get(tune, path) !== undefined) set(tune, path, o[path]); } catch (e) {}
      });
    },
    /** The player's car changed: rebuild the panel for it. */
    onCarChanged: function () { if (!panel.hidden) build(); },
    toggle: toggle
  };

  if (/[?&]dev\b/.test(location.search)) setTimeout(function () { toggle(true); }, 0);
})(window.DR);
