import path from 'node:path';

import type { Session, WebPreferences } from 'electron';

const THIRD_PARTY_PARTITION_PREFIX = 'persist:flowpilot:account:';
const ACCOUNT_KEY_PATTERN = /^[a-z0-9](?:[a-z0-9_-]{0,62}[a-z0-9])?$/u;
type PermissionSession = Pick<Session, 'setPermissionCheckHandler' | 'setPermissionRequestHandler'>;

export function createTrustedRendererWebPreferences(preloadPath: string): WebPreferences {
  if (!path.isAbsolute(preloadPath)) {
    throw new Error('Trusted Renderer preload path 必须是绝对路径。');
  }

  return {
    allowRunningInsecureContent: false,
    contextIsolation: true,
    experimentalFeatures: false,
    nodeIntegration: false,
    preload: preloadPath,
    sandbox: true,
    webSecurity: true,
    webviewTag: false,
  };
}

export function createThirdPartySessionPartition(accountKey: string): string {
  if (!ACCOUNT_KEY_PATTERN.test(accountKey)) {
    throw new Error('Third-party account key 必须是受限的不透明标识符。');
  }

  return `${THIRD_PARTY_PARTITION_PREFIX}${accountKey}`;
}

export function createThirdPartyWebPreferences(accountKey: string): WebPreferences {
  return {
    allowRunningInsecureContent: false,
    contextIsolation: true,
    experimentalFeatures: false,
    nodeIntegration: false,
    partition: createThirdPartySessionPartition(accountKey),
    safeDialogs: true,
    sandbox: true,
    webSecurity: true,
    webviewTag: false,
  };
}

export function configureDenyByDefaultPermissions(targetSession: PermissionSession): void {
  targetSession.setPermissionCheckHandler(() => false);
  targetSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });
}

function normalizeAllowedOrigin(rawOrigin: string): string {
  const parsed = new URL(rawOrigin);

  if (
    parsed.origin !== rawOrigin ||
    (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') ||
    parsed.username !== '' ||
    parsed.password !== ''
  ) {
    throw new Error('Allowed origin 必须是明确的 HTTP(S) origin。');
  }

  return parsed.origin;
}

export function normalizeAllowedOrigins(rawOrigins: readonly string[]): ReadonlySet<string> {
  if (rawOrigins.length === 0) {
    throw new Error('Third-party surface 至少需要一个明确允许的 origin。');
  }

  return new Set(rawOrigins.map(normalizeAllowedOrigin));
}

export function isAllowedThirdPartyNavigation(
  rawUrl: string,
  allowedOrigins: ReadonlySet<string>,
): boolean {
  try {
    const parsed = new URL(rawUrl);
    return (
      (parsed.protocol === 'https:' || parsed.protocol === 'http:') &&
      parsed.username === '' &&
      parsed.password === '' &&
      allowedOrigins.has(parsed.origin)
    );
  } catch {
    return false;
  }
}
