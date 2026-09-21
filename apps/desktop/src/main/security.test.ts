// @vitest-environment node

import { describe, expect, it } from 'vitest';

import { trustedRendererWebPreferences } from './security';

describe('trusted renderer security defaults', () => {
  it('keeps Node, webview, insecure content, and experimental features disabled', () => {
    expect(trustedRendererWebPreferences).toEqual({
      allowRunningInsecureContent: false,
      contextIsolation: true,
      experimentalFeatures: false,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      webviewTag: false,
    });
  });
});
