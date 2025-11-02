const { contextBridge, ipcRenderer } = require('electron');

// Expor APIs seguras para o renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Informações do app
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // Diálogos
  showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  
  // Controle de janela
  minimizeToTray: () => ipcRenderer.invoke('minimize-to-tray'),
  restoreFromTray: () => ipcRenderer.invoke('restore-from-tray'),
  
  // Controles de janela personalizados
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowMaximize: () => ipcRenderer.invoke('window-maximize'),
  windowClose: () => ipcRenderer.invoke('window-close'),
  windowIsMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  windowResize: (width, height) => ipcRenderer.invoke('window-resize', width, height),
  windowOpacity: (opacity) => ipcRenderer.invoke('window-opacity', opacity),
  
  // APIs do sistema
  platform: process.platform,
  versions: process.versions
});
