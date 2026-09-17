const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('belaDesktop', {
  close: () => ipcRenderer.invoke('bela-close-app'),
  onKey: callback => {
    ipcRenderer.on('bela-global-key', (_event, data) => callback(data));
    ipcRenderer.on('bela-fallback-key', (_event, data) => callback(data));
  }
});

