import { WebContentsView } from 'electron';

import {
  configureDenyByDefaultPermissions,
  createThirdPartyWebPreferences,
  isAllowedThirdPartyNavigation,
  normalizeAllowedOrigins,
} from './security';

export type ThirdPartySurfaceOptions = Readonly<{
  accountKey: string;
  allowedOrigins: readonly string[];
}>;

export function createThirdPartyWebContentsView(
  options: ThirdPartySurfaceOptions,
): WebContentsView {
  const allowedOrigins = normalizeAllowedOrigins(options.allowedOrigins);
  const view = new WebContentsView({
    webPreferences: createThirdPartyWebPreferences(options.accountKey),
  });

  configureDenyByDefaultPermissions(view.webContents.session);
  view.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  view.webContents.on('will-navigate', (event, navigationUrl) => {
    if (!isAllowedThirdPartyNavigation(navigationUrl, allowedOrigins)) {
      event.preventDefault();
    }
  });
  view.webContents.on('will-redirect', (event, navigationUrl) => {
    if (!isAllowedThirdPartyNavigation(navigationUrl, allowedOrigins)) {
      event.preventDefault();
    }
  });

  return view;
}
