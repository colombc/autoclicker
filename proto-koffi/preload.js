const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('proto', {
  info: () => ipcRenderer.invoke('info'),
  positions: () => ipcRenderer.invoke('positions'),
  clickIn: (opts) => ipcRenderer.invoke('clickIn', opts),
  start: (opts) => ipcRenderer.invoke('start', opts),
  stop: () => ipcRenderer.invoke('stop'),
  stats: () => ipcRenderer.invoke('stats'),
  on: (channel, fn) => {
    if (['state', 'shortcut', 'capture', 'shortcuts'].includes(channel)) ipcRenderer.on(channel, (_e, data) => fn(data));
  },
});
