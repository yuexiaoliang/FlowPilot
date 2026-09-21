const { app } = require('electron');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');

const { createThirdPartyWebContentsView } = require('../dist/main/third-party-surface');

const smokeProfile = mkdtempSync(path.join(tmpdir(), 'flowpilot-e0-security-'));
app.setPath('userData', smokeProfile);
app.enableSandbox();

function removeSmokeProfile() {
  if (!path.basename(smokeProfile).startsWith('flowpilot-e0-security-')) {
    throw new Error('Refusing to remove an unexpected smoke profile path.');
  }

  rmSync(smokeProfile, { force: true, maxRetries: 5, recursive: true, retryDelay: 100 });
}

process.once('exit', removeSmokeProfile);

const timeout = setTimeout(() => {
  console.error('Third-party WebContentsView security smoke timed out.');
  app.exit(1);
}, 5_000);

app
  .whenReady()
  .then(async () => {
    const view = createThirdPartyWebContentsView({
      accountKey: 'security_smoke',
      allowedOrigins: ['https://publisher.example'],
    });

    try {
      await view.webContents.loadURL('about:blank');
      const boundary = await view.webContents.executeJavaScript(`({
        flowPilotType: typeof globalThis.flowPilot,
        processType: typeof globalThis.process,
        requireType: typeof globalThis.require,
        windowOpenWasDenied: globalThis.open('https://publisher.example') === null
      })`);

      const expected = {
        flowPilotType: 'undefined',
        processType: 'undefined',
        requireType: 'undefined',
        windowOpenWasDenied: true,
      };

      if (JSON.stringify(boundary) !== JSON.stringify(expected)) {
        throw new Error(`Unexpected third-party boundary: ${JSON.stringify(boundary)}`);
      }

      if (view.webContents.session.storagePath === app.getPath('userData')) {
        throw new Error('Third-party surface unexpectedly reused the default session storage.');
      }

      console.log('Third-party WebContentsView security smoke passed.');
    } finally {
      view.webContents.close();
    }
  })
  .then(() => {
    clearTimeout(timeout);
    app.exit(0);
  })
  .catch((error) => {
    clearTimeout(timeout);
    console.error(error);
    app.exit(1);
  });
