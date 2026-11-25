// Pont entre l'interface et le main : expose window.kamclick (voir KamclickApi).

import { contextBridge, ipcRenderer } from 'electron';
import type { KamclickApi } from '../shared/api';

const api: KamclickApi = {
  init: () => ipcRenderer.invoke('init'),
  updateSettings: (patch) => ipcRenderer.send('updateSettings', patch),
  start: () => ipcRenderer.send('start'),
  stop: () => ipcRenderer.send('stop'),
  onSettings: (fn) => ipcRenderer.on('settings', (_e, settings) => fn(settings)),
  onStatus: (fn) => ipcRenderer.on('status', (_e, status) => fn(status)),
  onWarnings: (fn) => ipcRenderer.on('warnings', (_e, warnings) => fn(warnings)),
};

contextBridge.exposeInMainWorld('kamclick', api);
