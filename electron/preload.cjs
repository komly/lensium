const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  
  // System info
  getPlatform: () => process.platform,
  
  // Safe methods for the renderer
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
  
  // Clipboard
  writeText: (text) => ipcRenderer.invoke('clipboard:writeText', text),
  readText: () => ipcRenderer.invoke('clipboard:readText'),
}); 