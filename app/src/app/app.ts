import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import type { MouseButton, RandomUnit, SettingsPatch } from '../../shared/api';
import { MIN_INTERVAL_MS, nextIntervalMs } from '../../shared/settings';
import { KamclickService } from './kamclick.service';
import { KamsoftLogo } from './kamsoft-logo/kamsoft-logo';

// Affichage d'un raccourci Electron (« CommandOrControl+Shift+F1 ») à la française (« Ctrl+Maj+F1 »).
function formatShortcut(accelerator: string): string {
  return accelerator
    .split('+')
    .map((key) => {
      if (/^(CommandOrControl|CmdOrCtrl|Control|Ctrl)$/i.test(key)) return 'Ctrl';
      if (/^Shift$/i.test(key)) return 'Maj';
      if (/^(Alt|Option)$/i.test(key)) return 'Alt';
      return key;
    })
    .join('+');
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms} ms`;
  const parts: string[] = [];
  const h = Math.floor(ms / 3_600_000);
  const min = Math.floor((ms % 3_600_000) / 60_000);
  const s = (ms % 60_000) / 1000;
  if (h) parts.push(`${h} h`);
  if (min) parts.push(`${min} min`);
  if (s) parts.push(`${s.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} s`);
  return parts.join(' ');
}

@Component({
  selector: 'app-root',
  imports: [
    KamsoftLogo,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly kc = inject(KamclickService);
  protected readonly s = this.kc.settings;
  protected readonly status = this.kc.status;

  protected readonly keys = computed(() => {
    const sc = this.s().shortcuts;
    return {
      start: formatShortcut(sc.start),
      stop: formatShortcut(sc.stop),
      capturePosition: formatShortcut(sc.capturePosition),
      quit: formatShortcut(sc.quit),
    };
  });

  protected readonly fixedIntervalLabel = computed(() => {
    const ms = nextIntervalMs({ ...this.s(), random: { ...this.s().random, enabled: false } });
    return ms < MIN_INTERVAL_MS ? `${formatDuration(MIN_INTERVAL_MS)} (minimum)` : formatDuration(ms);
  });

  protected readonly hasWarnings = computed(() => {
    const w = this.kc.warnings();
    return w.settingsFile !== null || w.shortcuts.length > 0;
  });

  protected readonly randomUnits: { value: RandomUnit; label: string }[] = [
    { value: 'ms', label: 'millisecondes' },
    { value: 's', label: 'secondes' },
    { value: 'min', label: 'minutes' },
  ];

  // Champ numérique : on n'envoie que des valeurs valides. Un champ vidé en cours de
  // saisie garde l'ancienne valeur, réaffichée quand on quitte le champ.
  protected setNumber(event: Event, toPatch: (n: number) => SettingsPatch): void {
    const value = (event.target as HTMLInputElement).valueAsNumber;
    if (Number.isFinite(value)) this.kc.update(toPatch(value));
  }

  protected resetField(event: Event, value: number): void {
    (event.target as HTMLInputElement).value = String(value);
  }

  protected setButton(button: MouseButton): void {
    this.kc.update({ button });
  }

  protected setRandomUnit(unit: RandomUnit): void {
    this.kc.update({ random: { unit } });
  }
}
