/**
 * Preload script for AI Mortgage Assistant Desktop
 * Bridges secure desktop APIs to the renderer without compromising security.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopApp', {
  isDesktop: true,
  getVaultSettings: () => ipcRenderer.invoke('get-vault-settings'),
  saveVaultSettings: (settings) => ipcRenderer.invoke('save-vault-settings', settings),
  isVaultEncrypted: () => ipcRenderer.invoke('is-vault-encrypted'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version')
});
