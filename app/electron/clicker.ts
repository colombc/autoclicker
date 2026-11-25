// Moteur de clic : boucle de la V1.2 (un clic, puis attente de l'intervalle),
// avec planning absolu et clics ignorés quand ils tomberaient sur KamClick.

import type { Settings, Status } from '../shared/api';
import { nextIntervalMs } from '../shared/settings';
import type { Platform, Point } from './platform';
import { startSchedule, type Schedule } from './scheduler';

// Au plus un envoi de statut à l'interface toutes les 50 ms (à 100 clics/s, inutile de tout envoyer).
const STATUS_THROTTLE_MS = 50;

export class Clicker {
  private schedule: Schedule | null = null;
  private count = 0;
  private clickError: string | null = null;
  private statusTimer: NodeJS.Timeout | undefined;

  constructor(
    private readonly platform: Platform,
    private readonly getSettings: () => Settings,
    private readonly isOnOwnWindow: (point: Point) => boolean,
    private readonly onStatus: (status: Status) => void,
  ) {}

  get status(): Status {
    return { running: this.schedule !== null, count: this.count, clickError: this.clickError };
  }

  start(): void {
    if (this.schedule) return;
    this.clickError = null;
    this.platform.setHighResTimer(true);
    this.schedule = startSchedule(
      () => nextIntervalMs(this.getSettings()),
      () => this.tick(),
    );
    this.emitNow();
  }

  // Comme la V1.2 : l'arrêt remet le compteur à 0.
  stop(): void {
    if (this.schedule) {
      this.schedule.stop();
      this.schedule = null;
      this.platform.setHighResTimer(false);
    }
    this.count = 0;
    this.emitNow();
  }

  private tick(): void {
    // Bouton et position relus à chaque clic : un changement s'applique tout de suite, comme en V1.2.
    const { button, position } = this.getSettings();
    const point = position.enabled ? { x: position.x, y: position.y } : undefined;
    try {
      if (this.isOnOwnWindow(point ?? this.platform.getCursorPos())) return;
      this.platform.click(button, point);
      this.count++;
      this.clickError = null;
    } catch (e) {
      this.clickError = (e as Error).message;
    }
    this.emitThrottled();
  }

  private emitNow(): void {
    clearTimeout(this.statusTimer);
    this.statusTimer = undefined;
    this.onStatus(this.status);
  }

  private emitThrottled(): void {
    if (this.statusTimer) return;
    this.statusTimer = setTimeout(() => {
      this.statusTimer = undefined;
      this.onStatus(this.status);
    }, STATUS_THROTTLE_MS);
  }
}
