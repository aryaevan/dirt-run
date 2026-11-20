# Dirt Run

Off-road driving game with two modes that share one engine, one set of assets and one physics model.

- **Exploration**: roam an open valley and collect eight flags against the clock. Drive the Truck or the Buggy.
- **Racing**: climb a 3 km ridge on one tank of fuel, collect coins and spend them on Buggy upgrades in the garage. Upgrades also apply when you take the Buggy exploring.

## Run it

Open `index.html` in a browser. No build step or server is needed. Three.js r128 loads from cdnjs, so you need an internet connection.

## Layout

```
index.html            markup for every screen, loads the scripts in order
css/style.css         all styles
js/
  core/               namespace, noise, saved progress, renderer/stage, input, cameras
  assets/             3D models and props: truck, buggy, wheel, tree, rock, flag,
                      beacon, water, coin, fuel can, track props, nav arrow, materials
  world/              terrain.js (shared heightfield), valley.js (exploration), ridge.js (racing)
  physics/            vehicle.js (shared vehicle physics), tuning.js (per-car numbers)
  fx/                 particles.js (dust, splashes, pickup bursts)
  modes/              menu.js, exploration.js, racing.js
  main.js             main loop, world and car switching
```

Each script is a plain `<script>` that attaches its exports to `window.DR`. Load order matters, and `index.html` lists it.

## Extending

- **New car**: add `js/assets/<car>.js`, which returns `{group, wheels, hull, radius}`, and a `DR.tuning.<car>` function, then add a button to `#carPick`.
- **New world**: add `js/world/<world>.js` that follows the world contract at the top of `valley.js`, then call `DR.useWorld('<world>')` from a mode.
- **New mode**: add an object to `DR.modes` that has the methods listed at the top of `main.js`.
