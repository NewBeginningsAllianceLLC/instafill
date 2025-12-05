import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File system operations
  selectFile: (options: any) => ipcRenderer.invoke('select-file', options),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath: string, data: any) => ipcRenderer.invoke('write-file', filePath, data),
  
  // PDF operations
  loadPDF: (filePath: string) => ipcRenderer.invoke('load-pdf', filePath),
  savePDF: (filePath: string, pdfData: any) => ipcRenderer.invoke('save-pdf', filePath, pdfData),
  
  // Settings
  getSetting: (key: string) => ipcRenderer.invoke('get-setting', key),
  setSetting: (key: string, value: any) => ipcRenderer.invoke('set-setting', key, value),
  
  // Secure storage for API keys
  getSecureValue: (key: string) => ipcRenderer.invoke('get-secure-value', key),
  setSecureValue: (key: string, value: string) => ipcRenderer.invoke('set-secure-value', key, value),
  deleteSecureValue: (key: string) => ipcRenderer.invoke('delete-secure-value', key),
});

export {};
