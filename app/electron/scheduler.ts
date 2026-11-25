// Planning absolu : le clic n° k est prévu à t0 + k × intervalle (horloge monotone).
// Un retard ponctuel ne décale pas les clics suivants. En cas de gros retard
// (plus d'un intervalle), on repart de maintenant au lieu de rattraper en rafale.

import { performance } from 'node:perf_hooks';
import { MIN_INTERVAL_MS } from '../shared/settings';

export interface Schedule {
  stop(): void;
}

// nextInterval() donne le délai en ms avant le clic suivant (fixe ou tiré au hasard),
// relu à chaque clic pour qu'un réglage modifié en cours de route s'applique tout de suite.
export function startSchedule(nextInterval: () => number, tick: () => void): Schedule {
  let timer: NodeJS.Timeout | undefined;
  let running = true;
  // Premier clic immédiat, comme la V1.2.
  let due = performance.now();

  function arm() {
    timer = setTimeout(fire, Math.max(0, due - performance.now()));
  }

  function fire() {
    if (!running) return;
    tick();
    if (!running) return;
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
