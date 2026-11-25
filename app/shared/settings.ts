// Valeurs par défaut, validation et calcul de l'intervalle.
// Partagé par le main (lecture du JSON) et l'interface (mise à jour locale immédiate),
// pour que les deux normalisent les réglages exactement de la même façon.

import type { MouseButton, RandomUnit, Settings, SettingsPatch } from './api';

export const MIN_INTERVAL_MS = 10;

// Valeurs par défaut de la V1.2 (raccourcis F1/F2/F3/F10, tout à 0, clic gauche,
// unité aléatoire « in seconde »).
export const DEFAULT_SETTINGS: Settings = {
  shortcuts: { start: 'F1', stop: 'F2', capturePosition: 'F3', quit: 'F10' },
  interval: { hours: 0, minutes: 0, seconds: 0, hundredths: 0 },
  random: { enabled: false, from: 0, to: 0, unit: 's' },
  button: 'left',
  position: { enabled: false, x: 0, y: 0 },
};

const RANDOM_UNIT_MS: Record<RandomUnit, number> = { ms: 1, s: 1000, min: 60000 };

type Obj = Record<string, unknown>;

function obj(value: unknown): Obj {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Obj) : {};
}

function int(value: unknown, fallback: number, min = -Infinity): number {
  const n = typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN;
  return Number.isFinite(n) ? Math.max(min, Math.trunc(n)) : fallback;
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function str(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : fallback;
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

// Transforme n'importe quelle valeur (JSON lu sur disque, réglages fusionnés) en
// réglages valides : champ absent ou invalide → valeur par défaut.
export function sanitizeSettings(raw: unknown): Settings {
  const d = DEFAULT_SETTINGS;
  const r = obj(raw);
  const shortcuts = obj(r['shortcuts']);
  const interval = obj(r['interval']);
  const random = obj(r['random']);
  const position = obj(r['position']);
  return {
    shortcuts: {
      start: str(shortcuts['start'], d.shortcuts.start),
      stop: str(shortcuts['stop'], d.shortcuts.stop),
      capturePosition: str(shortcuts['capturePosition'], d.shortcuts.capturePosition),
      quit: str(shortcuts['quit'], d.shortcuts.quit),
    },
    interval: {
      hours: int(interval['hours'], d.interval.hours, 0),
      minutes: int(interval['minutes'], d.interval.minutes, 0),
      seconds: int(interval['seconds'], d.interval.seconds, 0),
      hundredths: int(interval['hundredths'], d.interval.hundredths, 0),
    },
    random: {
      enabled: bool(random['enabled'], d.random.enabled),
      from: int(random['from'], d.random.from, 0),
      to: int(random['to'], d.random.to, 0),
      unit: oneOf<RandomUnit>(random['unit'], ['ms', 's', 'min'], d.random.unit),
    },
    button: oneOf<MouseButton>(r['button'], ['left', 'right'], d.button),
    // Coordonnées négatives autorisées : écran placé à gauche ou au-dessus de l'écran principal.
    position: {
      enabled: bool(position['enabled'], d.position.enabled),
      x: int(position['x'], d.position.x),
      y: int(position['y'], d.position.y),
    },
  };
}

export function applyPatch(settings: Settings, patch: SettingsPatch): Settings {
  return sanitizeSettings({
    ...settings,
    ...(patch.button !== undefined && { button: patch.button }),
    interval: { ...settings.interval, ...patch.interval },
    random: { ...settings.random, ...patch.random },
    position: { ...settings.position, ...patch.position },
  });
}

// Délai avant le prochain clic, en ms, comme la boucle de la V1.2 :
// mode aléatoire = entier tiré dans [de, à] × unité, sinon h/min/s/centièmes.
// Le minimum de 10 ms est appliqué par le planificateur.
export function nextIntervalMs(settings: Settings, random: () => number = Math.random): number {
  if (settings.random.enabled) {
    const unit = RANDOM_UNIT_MS[settings.random.unit];
    const lo = Math.min(settings.random.from, settings.random.to) * unit;
    const hi = Math.max(settings.random.from, settings.random.to) * unit;
    return lo + Math.floor(random() * (hi - lo + 1));
  }
  const { hours, minutes, seconds, hundredths } = settings.interval;
  return hours * 3_600_000 + minutes * 60_000 + seconds * 1000 + hundredths * 10;
}
