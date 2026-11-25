import { DEFAULT_SETTINGS, applyPatch, nextIntervalMs, sanitizeSettings } from '../../shared/settings';

describe('sanitizeSettings', () => {
  it('donne les valeurs par défaut pour un fichier vide ou invalide', () => {
    expect(sanitizeSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings('nimporte quoi')).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings({})).toEqual(DEFAULT_SETTINGS);
  });

  it('garde les valeurs valides et remplace les invalides champ par champ', () => {
    const s = sanitizeSettings({
      shortcuts: { start: 'Ctrl+F1', stop: '' },
      interval: { hours: 1, minutes: -5, seconds: '30', hundredths: 2.7 },
      random: { enabled: true, unit: 'heures' },
      button: 'milieu',
      position: { enabled: true, x: -1920, y: 'abc' },
    });
    expect(s.shortcuts).toEqual({ ...DEFAULT_SETTINGS.shortcuts, start: 'Ctrl+F1' });
    expect(s.interval).toEqual({ hours: 1, minutes: 0, seconds: 30, hundredths: 2 });
    expect(s.random).toEqual({ ...DEFAULT_SETTINGS.random, enabled: true });
    expect(s.button).toBe('left');
    // X négatif autorisé (écran à gauche de l'écran principal)
    expect(s.position).toEqual({ enabled: true, x: -1920, y: 0 });
  });
});

describe('applyPatch', () => {
  it('fusionne une modification partielle', () => {
    const s = applyPatch(DEFAULT_SETTINGS, { interval: { seconds: 2 }, button: 'right' });
    expect(s.interval).toEqual({ hours: 0, minutes: 0, seconds: 2, hundredths: 0 });
    expect(s.button).toBe('right');
    expect(s.random).toEqual(DEFAULT_SETTINGS.random);
  });
});

describe('nextIntervalMs', () => {
  it('additionne heures, minutes, secondes et centièmes', () => {
    const s = applyPatch(DEFAULT_SETTINGS, { interval: { hours: 1, minutes: 2, seconds: 3, hundredths: 4 } });
    expect(nextIntervalMs(s)).toBe(3_600_000 + 120_000 + 3000 + 40);
  });

  it('tire un entier dans la plage aléatoire, bornes comprises', () => {
    const s = applyPatch(DEFAULT_SETTINGS, { random: { enabled: true, from: 2, to: 5, unit: 's' } });
    expect(nextIntervalMs(s, () => 0)).toBe(2000);
    expect(nextIntervalMs(s, () => 0.999999)).toBe(5000);
  });

  it('accepte une plage inversée', () => {
    const s = applyPatch(DEFAULT_SETTINGS, { random: { enabled: true, from: 300, to: 100, unit: 'ms' } });
    expect(nextIntervalMs(s, () => 0)).toBe(100);
    expect(nextIntervalMs(s, () => 0.999999)).toBe(300);
  });

  it('gère les minutes en mode aléatoire', () => {
    const s = applyPatch(DEFAULT_SETTINGS, { random: { enabled: true, from: 1, to: 1, unit: 'min' } });
    expect(nextIntervalMs(s)).toBe(60_000);
  });
});
