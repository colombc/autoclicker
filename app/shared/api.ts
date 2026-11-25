// Types partagés entre le process main (Electron) et l'interface (Angular).

export type MouseButton = 'left' | 'right';
export type RandomUnit = 'ms' | 's' | 'min';

export interface Shortcuts {
  start: string;
  stop: string;
  capturePosition: string;
  quit: string;
}

export interface Settings {
  shortcuts: Shortcuts;
  interval: { hours: number; minutes: number; seconds: number; hundredths: number };
  random: { enabled: boolean; from: number; to: number; unit: RandomUnit };
  button: MouseButton;
  position: { enabled: boolean; x: number; y: number };
}

// Réglages modifiables depuis l'interface (les raccourcis ne se changent que dans le JSON, comme le .ini de la V1.2).
export type SettingsPatch = {
  interval?: Partial<Settings['interval']>;
  random?: Partial<Settings['random']>;
  button?: MouseButton;
  position?: Partial<Settings['position']>;
};

export interface Status {
  running: boolean;
  count: number;
  // Dernière erreur de clic (ex. clic bloqué par Windows vers une fenêtre administrateur).
  clickError: string | null;
}

// Problèmes à signaler à l'utilisateur sans bloquer l'appli.
export interface Warnings {
  settingsFile: string | null;
  shortcuts: string[];
}

export interface InitialState {
  settings: Settings;
  status: Status;
  warnings: Warnings;
  settingsPath: string;
  version: string;
}

// API exposée à l'interface par le preload (window.kamclick).
export interface KamclickApi {
  init(): Promise<InitialState>;
  updateSettings(patch: SettingsPatch): void;
  start(): void;
  stop(): void;
  onSettings(fn: (settings: Settings) => void): void;
  onStatus(fn: (status: Status) => void): void;
  onWarnings(fn: (warnings: Warnings) => void): void;
}
