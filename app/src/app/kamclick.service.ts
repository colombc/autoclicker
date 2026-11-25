import { Injectable, signal } from '@angular/core';
import type { KamclickApi, Settings, SettingsPatch, Status, Warnings } from '../../shared/api';
import { DEFAULT_SETTINGS, applyPatch } from '../../shared/settings';

declare global {
  interface Window {
    kamclick?: KamclickApi;
  }
}

// État de l'appli côté interface. Le main est la source de vérité : on applique
// les modifications localement tout de suite (même normalisation que le main,
// via shared/settings) puis on les lui envoie.
@Injectable({ providedIn: 'root' })
export class KamclickService {
  private readonly api = window.kamclick;

  readonly ready = signal(false);
  readonly settings = signal<Settings>(DEFAULT_SETTINGS);
  readonly status = signal<Status>({ running: false, count: 0, clickError: null });
  readonly warnings = signal<Warnings>({ settingsFile: null, shortcuts: [] });
  readonly settingsPath = signal('');
  readonly version = signal('');
  // Hors Electron (ng serve dans un navigateur), il n'y a pas de preload.
  readonly available = this.api !== undefined;

  constructor() {
    if (!this.api) return;
    this.api.onSettings((s) => this.settings.set(s));
    this.api.onStatus((s) => this.status.set(s));
    this.api.onWarnings((w) => this.warnings.set({ ...w }));
    this.api.init().then((state) => {
      this.settings.set(state.settings);
      this.status.set(state.status);
      this.warnings.set(state.warnings);
      this.settingsPath.set(state.settingsPath);
      this.version.set(state.version);
      this.ready.set(true);
    });
  }

  update(patch: SettingsPatch): void {
    this.settings.update((s) => applyPatch(s, patch));
    this.api?.updateSettings(patch);
  }

  start(): void {
    this.api?.start();
  }

  stop(): void {
    this.api?.stop();
  }
}
