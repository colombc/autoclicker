// Process main de KamClick 2 : fenêtre, raccourcis globaux, réglages et moteur de clic.
// L'interface Angular ne fait que l'affichage et passe par le preload (window.kamclick).

import { app, BrowserWindow, globalShortcut, ipcMain, Menu, screen } from 'electron';
import path from 'node:path';
import type { InitialState, Settings, SettingsPatch, Shortcuts, Status, Warnings } from '../shared/api';
import { Clicker } from './clicker';
import { loadPlatform, type Point } from './platform';
import { SETTINGS_FILE_NAME, SettingsStore } from './settings-store';

// Dev : `electron . --dev-url=http://localhost:4200` charge le serveur Angular au lieu du build.
const devUrl = process.argv.find((a) => a.startsWith('--dev-url='))?.slice('--dev-url='.length);

// Dossier du vrai exe. En portable, l'exe se décompresse dans %TEMP% : process.execPath
// pointe là-bas, d'où PORTABLE_EXECUTABLE_DIR.
function settingsDir(): string {
  if (process.env['PORTABLE_EXECUTABLE_DIR']) return process.env['PORTABLE_EXECUTABLE_DIR'];
  return app.isPackaged ? path.dirname(process.execPath) : app.getAppPath();
}

let win: BrowserWindow | null = null;
const warnings: Warnings = { settingsFile: null, shortcuts: [] };

const platform = loadPlatform();
const store = new SettingsStore(path.join(settingsDir(), SETTINGS_FILE_NAME), (message) => {
  warnings.settingsFile = message;
  send('warnings', warnings);
});
const clicker = new Clicker(
  platform,
  () => store.settings,
  isOnOwnWindow,
  (status) => send('status', status),
);

function send(channel: 'settings', data: Settings): void;
function send(channel: 'status', data: Status): void;
function send(channel: 'warnings', data: Warnings): void;
function send(channel: string, data: unknown): void {
  if (win && !win.isDestroyed()) win.webContents.send(channel, data);
}

// Vrai si le point (pixels physiques) tombe dans la fenêtre de KamClick : le clic est alors ignoré.
function isOnOwnWindow(point: Point): boolean {
  if (!win || !win.isVisible() || win.isMinimized()) return false;
  const p = screen.screenToDipPoint(point);
  const b = win.getBounds();
  return p.x >= b.x && p.x < b.x + b.width && p.y >= b.y && p.y < b.y + b.height;
}

function capturePosition(): void {
  const { x, y } = platform.getCursorPos();
  send('settings', store.update({ position: { x, y } }));
}

function registerShortcuts(shortcuts: Shortcuts): string[] {
  const actions: [keyof Shortcuts, () => void][] = [
    ['start', () => clicker.start()],
    ['stop', () => clicker.stop()],
    ['capturePosition', capturePosition],
    ['quit', () => app.quit()],
  ];
  const problems: string[] = [];
  for (const [name, action] of actions) {
    const accelerator = shortcuts[name];
    try {
      if (!globalShortcut.register(accelerator, action)) problems.push(`${accelerator} : déjà utilisé par une autre application.`);
    } catch {
      problems.push(`« ${accelerator} » n'est pas un raccourci valide (modifiable dans ${SETTINGS_FILE_NAME}).`);
    }
  }
  return problems;
}

function registerIpc(): void {
  ipcMain.handle('init', (): InitialState => ({
    settings: store.settings,
    status: clicker.status,
    warnings,
    settingsPath: store.filePath,
    version: app.getVersion(),
  }));
  ipcMain.on('updateSettings', (_e, patch: SettingsPatch) => store.update(patch));
  ipcMain.on('start', () => clicker.start());
  ipcMain.on('stop', () => clicker.stop());
}

function createWindow(): void {
  win = new BrowserWindow({
    width: 440,
    height: 716,
    useContentSize: true,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    title: 'KamClick 2',
    // Icône de la fenêtre (en dev, sinon ce serait celle d'Electron ; l'exe a la sienne via electron-builder).
    icon: path.join(app.getAppPath(), 'build/icon.ico'),
    show: false,
    backgroundColor: '#1b1b1f',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
    },
  });
  // Electron 45 sous Windows : `alwaysOnTop: true` et le niveau par défaut ('floating')
  // ne posent pas WS_EX_TOPMOST. 'pop-up-menu' est le plus bas niveau qui marche.
  win.setAlwaysOnTop(true, 'pop-up-menu');

  // Aucune navigation ni nouvelle fenêtre : l'interface est une page unique locale.
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (e) => e.preventDefault());

  // Hors exe empaqueté : console de l'interface recopiée dans le terminal.
  if (!app.isPackaged) {
    win.webContents.on('console-message', (e) => console.log(`[ui:${e.level}] ${e.message}`));
  }

  win.once('ready-to-show', () => win?.show());
  win.on('closed', () => (win = null));

  if (devUrl) win.loadURL(devUrl);
  else win.loadFile(path.join(app.getAppPath(), 'dist/kamclick/browser/index.html'));
}

// Une seule instance : deux KamClick se disputeraient les raccourcis et le fichier JSON.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!win) return;
    if (win.isMinimized()) win.restore();
    win.focus();
  });

  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    store.load();
    warnings.settingsFile = store.error;
    warnings.shortcuts = registerShortcuts(store.settings.shortcuts);
    registerIpc();
    createWindow();
  });

  app.on('will-quit', () => {
    clicker.stop();
    store.flush();
    globalShortcut.unregisterAll();
  });
  app.on('window-all-closed', () => app.quit());
}
