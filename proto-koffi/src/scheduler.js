// Planning absolu : le clic n° k est prévu à t0 + k × intervalle (horloge monotone).
// Un retard ponctuel ne décale pas les clics suivants. En cas de gros retard
// (plus d'un intervalle), on repart de maintenant au lieu de rattraper en rafale.

const { performance } = require('node:perf_hooks');

const MIN_INTERVAL_MS = 10;

// nextInterval() renvoie l'intervalle en ms avant le clic suivant (fixe ou tiré au hasard).
// tick() fait le clic ; elle est appelée à chaque échéance.
function startSchedule({ nextInterval, tick }) {
  let timer = null;
  let running = true;
  // Premier clic immédiat, comme la V1.2.
  let due = performance.now();

  function arm() {
    timer = setTimeout(fire, Math.max(0, due - performance.now()));
  }

  function fire() {
    if (!running) return;
    tick(performance.now(), due);
    const interval = Math.max(MIN_INTERVAL_MS, nextInterval());
    due += interval;
    const now = performance.now();
    if (due < now) due = now + interval;
    arm();
  }

  arm();

  return {
    stop() {
      running = false;
      clearTimeout(timer);
    },
  };
}

module.exports = { startSchedule, MIN_INTERVAL_MS };
