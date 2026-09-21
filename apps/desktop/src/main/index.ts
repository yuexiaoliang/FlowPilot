import { app, BrowserWindow, ipcMain, session } from 'electron';
import path from 'node:path';

import { registerShellIpc } from './ipc';
import { configureDenyByDefaultPermissions, createTrustedRendererWebPreferences } from './security';

const DEVELOPMENT_RENDERER_URL = 'http://127.0.0.1:43127';

app.enableSandbox();

let mainWindow: BrowserWindow | null = null;

function getDevelopmentRendererUrl(): string | undefined {
  const value = process.env.VITE_DEV_SERVER_URL;

  if (value === undefined) {
    return undefined;
  }

  const parsed = new URL(value);
  if (parsed.origin !== DEVELOPMENT_RENDERER_URL || parsed.pathname !== '/') {
    throw new Error('VITE_DEV_SERVER_URL 必须指向 FlowPilot 本地开发服务器。');
  }

  return parsed.toString();
}

function createMainWindow(): BrowserWindow {
  const preloadPath = path.join(__dirname, '../preload/index.js');
  const window = new BrowserWindow({
    width: 1180,
    height: 800,
    minWidth: 720,
    minHeight: 620,
    show: false,
    title: 'FlowPilot',
    backgroundColor: '#F7F9FC',
    webPreferences: createTrustedRendererWebPreferences(preloadPath),
  });

  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event) => {
    event.preventDefault();
  });
  window.once('ready-to-show', () => {
    window.show();
  });
  window.once('closed', () => {
    if (mainWindow === window) {
      mainWindow = null;
    }
  });

  const developmentUrl = getDevelopmentRendererUrl();
  if (developmentUrl !== undefined) {
    void window.loadURL(developmentUrl);
  } else {
    void window.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  return window;
}

app.whenReady().then(() => {
  configureDenyByDefaultPermissions(session.defaultSession);
  const disposeShellIpc = registerShellIpc(ipcMain, {
    getAppVersion: () => app.getVersion(),
    isTrustedSender: (event) => mainWindow !== null && event.sender === mainWindow.webContents,
    platform: process.platform,
  });

  mainWindow = createMainWindow();

  app.once('will-quit', disposeShellIpc);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
