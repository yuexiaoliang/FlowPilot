// @vitest-environment node

import path from 'node:path';

import type { Session } from 'electron';
import { describe, expect, it, vi } from 'vitest';

import {
  configureDenyByDefaultPermissions,
  createThirdPartySessionPartition,
  createThirdPartyWebPreferences,
  createTrustedRendererWebPreferences,
  isAllowedThirdPartyNavigation,
  normalizeAllowedOrigins,
} from './security';

describe('trusted Renderer security defaults', () => {
  it('uses only the explicit preload while keeping privileged browser features disabled', () => {
    const preloadPath = path.resolve('/flowpilot', 'dist/preload/index.js');

    expect(createTrustedRendererWebPreferences(preloadPath)).toEqual({
      allowRunningInsecureContent: false,
      contextIsolation: true,
      experimentalFeatures: false,
      nodeIntegration: false,
      preload: preloadPath,
      sandbox: true,
      webSecurity: true,
      webviewTag: false,
    });
  });

  it('rejects a relative preload path', () => {
    expect(() => createTrustedRendererWebPreferences('dist/preload/index.js')).toThrow(
      /必须是绝对路径/u,
    );
  });
});

describe('third-party WebContentsView security defaults', () => {
  it('isolates each account without a privileged preload', () => {
    const preferences = createThirdPartyWebPreferences('account_01');

    expect(preferences).toEqual({
      allowRunningInsecureContent: false,
      contextIsolation: true,
      experimentalFeatures: false,
      nodeIntegration: false,
      partition: 'persist:flowpilot:account:account_01',
      safeDialogs: true,
      sandbox: true,
      webSecurity: true,
      webviewTag: false,
    });
    expect(Object.hasOwn(preferences, 'preload')).toBe(false);
    expect(createThirdPartySessionPartition('account_02')).not.toBe(preferences.partition);
  });

  it('rejects unsafe account keys instead of accepting arbitrary partition names', () => {
    for (const accountKey of ['', '../shared', 'UPPERCASE', 'account:shared', 'a'.repeat(65)]) {
      expect(() => createThirdPartySessionPartition(accountKey)).toThrow(/受限的不透明标识符/u);
    }
  });

  it('allows navigation only within explicit HTTP(S) origins', () => {
    const allowedOrigins = normalizeAllowedOrigins([
      'https://publisher.example',
      'http://127.0.0.1:43128',
    ]);

    expect(
      isAllowedThirdPartyNavigation('https://publisher.example/editor?id=1', allowedOrigins),
    ).toBe(true);
    expect(isAllowedThirdPartyNavigation('http://127.0.0.1:43128/upload', allowedOrigins)).toBe(
      true,
    );
    expect(isAllowedThirdPartyNavigation('https://evil.publisher.example/', allowedOrigins)).toBe(
      false,
    );
    expect(
      isAllowedThirdPartyNavigation('https://user:secret@publisher.example/', allowedOrigins),
    ).toBe(false);
    expect(isAllowedThirdPartyNavigation('file:///etc/passwd', allowedOrigins)).toBe(false);
    expect(isAllowedThirdPartyNavigation('javascript:alert(1)', allowedOrigins)).toBe(false);
    expect(isAllowedThirdPartyNavigation('not a URL', allowedOrigins)).toBe(false);
  });

  it('rejects malformed allowlists and denies every permission by default', () => {
    expect(() => normalizeAllowedOrigins([])).toThrow(/至少需要一个/u);
    expect(() => normalizeAllowedOrigins(['https://publisher.example/path'])).toThrow(
      /明确的 HTTP\(S\) origin/u,
    );

    type PermissionCheckHandler = NonNullable<Parameters<Session['setPermissionCheckHandler']>[0]>;
    type PermissionRequestHandler = NonNullable<
      Parameters<Session['setPermissionRequestHandler']>[0]
    >;

    let checkHandler: PermissionCheckHandler | undefined;
    let requestHandler: PermissionRequestHandler | undefined;
    const permissionSession: Pick<
      Session,
      'setPermissionCheckHandler' | 'setPermissionRequestHandler'
    > = {
      setPermissionCheckHandler: (handler) => {
        checkHandler = handler ?? undefined;
      },
      setPermissionRequestHandler: (handler) => {
        requestHandler = handler ?? undefined;
      },
    };

    configureDenyByDefaultPermissions(permissionSession);

    expect(checkHandler).toBeTypeOf('function');
    expect(requestHandler).toBeTypeOf('function');
    expect(
      checkHandler?.(null, 'notifications', 'https://publisher.example', {
        embeddingOrigin: 'https://flowpilot.local',
        isMainFrame: true,
      }),
    ).toBe(false);

    const permissionDecision = vi.fn();
    requestHandler?.({} as never, 'notifications', permissionDecision, {
      requestingUrl: 'https://publisher.example',
      isMainFrame: true,
    });
    expect(permissionDecision).toHaveBeenCalledExactlyOnceWith(false);
  });
});
