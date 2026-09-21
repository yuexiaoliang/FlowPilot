import type { WebPreferences } from 'electron';

export const trustedRendererWebPreferences = {
  allowRunningInsecureContent: false,
  contextIsolation: true,
  experimentalFeatures: false,
  nodeIntegration: false,
  sandbox: true,
  webSecurity: true,
  webviewTag: false,
} satisfies WebPreferences;
