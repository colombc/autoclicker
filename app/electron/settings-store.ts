// Fichier de réglages JSON, à côté de l'exe (version portable).
// Sauvegarde à chaque modification, avec un délai pour ne pas écrire à chaque
// frappe, et écriture atomique (fichier temporaire puis renommage).

import fs from 'node:fs';
import path from 'node:path';
import type { Settings, SettingsPatch } from '../shared/api';
import { DEFAULT_SETTINGS, applyPatch, sanitizeSettings } from '../shared/settings';

export const SETTINGS_FILE_NAME = 'kamclick.json';
const SAVE_DELAY_MS = 300;

export class SettingsStore {
  settings: Settings = DEFAULT_SETTINGS;
  // Message à afficher si le fichier n'a pas pu être lu ou écrit, sinon null.
  error: string | null = null;
  private saveTimer: NodeJS.Timeout | undefined;

  constructor(
    readonly filePath: string,
    private readonly onError: (message: string | null) => void,
  ) {}

  load(): void {
    let raw: string;
    try {
      raw = fs.readFileSync(this.filePath, 'utf8');
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'ENOENT') {
        this.setError(`Lecture impossible de ${this.filePath} : ${(e as Error).message}. Valeurs par défaut utilisées.`);
        return;
      }
      // Premier lancement : on crée le fichier pour que les raccourcis soient modifiables.
      this.settings = DEFAULT_SETTINGS;
      this.save();
      return;
    }
    try {
      this.settings = sanitizeSettings(JSON.parse(raw));
    } catch (e) {
      // JSON invalide : on garde une copie pour que l'utilisateur ne perde pas ses modifications.
      const backup = `${this.filePath}.invalide`;
      try {
        fs.copyFileSync(this.filePath, backup);
      } catch {
        // Copie impossible : le message ci-dessous reste valable.
      }
      this.settings = DEFAULT_SETTINGS;
      this.setError(`${path.basename(this.filePath)} est illisible (${(e as Error).message}). Valeurs par défaut utilisées, copie dans ${path.basename(backup)}.`);
    }
  }

  update(patch: SettingsPatch): Settings {
    this.settings = applyPatch(this.settings, patch);
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.save(), SAVE_DELAY_MS);
    return this.settings;
  }

  // Écrit tout de suite une sauvegarde en attente (à la fermeture).
  flush(): void {
    if (this.saveTimer === undefined) return;
    clearTimeout(this.saveTimer);
    this.save();
  }

  private save(): void {
    this.saveTimer = undefined;
    const tmp = `${this.filePath}.tmp`;
    try {
      fs.writeFileSync(tmp, JSON.stringify(this.settings, null, 2) + '\n', 'utf8');
      fs.renameSync(tmp, this.filePath);
      if (this.error?.startsWith('Écriture')) this.setError(null);
    } catch (e) {
      this.setError(`Écriture impossible de ${this.filePath} : ${(e as Error).message}. Les réglages ne seront pas conservés (dossier protégé en écriture ?).`);
    }
  }

  private setError(message: string | null): void {
    this.error = message;
    this.onError(message);
  }
}
