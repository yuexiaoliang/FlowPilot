import { app, BrowserWindow, session } from 'electron';
import path from 'node:path';

import { trustedRendererWebPreferences } from './security';

const DEVELOPMENT_RENDERER_URL = 'http://127.0.0.1:43127';

app.enableSandbox();

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
  const window = new BrowserWindow({
    width: 1180,
    height: 800,
    minWidth: 720,
    minHeight: 620,
    show: false,
    title: 'FlowPilot',
    backgroundColor: '#F7F9FC',
    webPreferences: trustedRendererWebPreferences,
  });

  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event) => {
    event.preventDefault();
  });
  window.once('ready-to-show', () => {
    window.show();
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
  session.defaultSession.setPermissionCheckHandler(() => false);
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });

  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
