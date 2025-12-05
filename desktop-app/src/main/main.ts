import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import Store from 'electron-store';

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

const store = new Store();

ipcMain.handle('select-file', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    filters: options?.filters || [
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory'],
  });
  
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('read-file', async (event, filePath: string) => {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch (error: any) {
    throw new Error(`Failed to read file: ${error.message}`);
  }
});

ipcMain.handle('write-file', async (event, filePath: string, data: any) => {
  try {
    await fs.writeFile(filePath, data, 'utf-8');
  } catch (error: any) {
    throw new Error(`Failed to write file: ${error.message}`);
  }
});

ipcMain.handle('get-setting', async (event, key: string) => {
  return store.get(key);
});

ipcMain.handle('set-setting', async (event, key: string, value: any) => {
  store.set(key, value);
});

ipcMain.handle('get-secure-value', async (event, key: string) => {
  // For now, using electron-store. In production, use keytar
  return store.get(`secure.${key}`);
});

ipcMain.handle('set-secure-value', async (event, key: string, value: string) => {
  store.set(`secure.${key}`, value);
});

ipcMain.handle('delete-secure-value', async (event, key: string) => {
  store.delete(`secure.${key}`);
});
