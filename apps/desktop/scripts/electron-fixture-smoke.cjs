const { app } = require('electron');
const { mkdtempSync, readFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');

const { createThirdPartyWebContentsView } = require('../dist/main/third-party-surface');

const fixtureOrigin = process.env.FLOWPILOT_FIXTURE_ORIGIN;
if (fixtureOrigin === undefined || !/^http:\/\/127\.0\.0\.1:\d{4,5}$/u.test(fixtureOrigin)) {
  throw new Error('FLOWPILOT_FIXTURE_ORIGIN must be an explicit loopback origin.');
}

const smokeProfile = mkdtempSync(path.join(tmpdir(), 'flowpilot-e0-fixture-'));
app.setPath('userData', smokeProfile);
app.enableSandbox();

function removeSmokeProfile() {
  if (!path.basename(smokeProfile).startsWith('flowpilot-e0-fixture-')) {
    throw new Error('Refusing to remove an unexpected fixture smoke profile path.');
  }

  rmSync(smokeProfile, { force: true, maxRetries: 5, recursive: true, retryDelay: 100 });
}

process.once('exit', removeSmokeProfile);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual, expected, label) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${label}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`,
    );
  }
}

async function readFixtureState(view) {
  return view.webContents.executeJavaScript(`({
    flowPilotType: typeof globalThis.flowPilot,
    processType: typeof globalThis.process,
    requireType: typeof globalThis.require,
    state: document.body.dataset.fixtureState,
    variant: document.body.dataset.fixtureVariant,
    version: document.body.dataset.fixtureVersion
  })`);
}

async function loadScenario(view, version, variant, expectedState) {
  await view.webContents.loadURL(`${fixtureOrigin}/fixture/${version}/${variant}`);
  const state = await readFixtureState(view);

  assertEqual(
    state,
    {
      flowPilotType: 'undefined',
      processType: 'undefined',
      requireType: 'undefined',
      state: expectedState,
      variant,
      version,
    },
    `${version}/${variant}`,
  );
}

const timeout = setTimeout(() => {
  console.error('Electron fixture smoke timed out.');
  app.exit(1);
}, 15_000);

app
  .whenReady()
  .then(async () => {
    const view = createThirdPartyWebContentsView({
      accountKey: 'fixture_e0',
      allowedOrigins: [fixtureOrigin],
    });
    const blockedRequests = [];

    view.webContents.session.webRequest.onBeforeRequest((details, callback) => {
      const isAllowed = new URL(details.url).origin === fixtureOrigin;
      if (!isAllowed) {
        blockedRequests.push(details.url);
      }
      callback({ cancel: !isAllowed });
    });

    try {
      const scenarios = [
        ['v1', 'normal', 'EDITOR_READY'],
        ['v1', 'upload', 'UPLOAD_REQUIRED'],
        ['v1', 'publish-success', 'PUBLISH_READY'],
        ['v1', 'publish-failure', 'PUBLISH_READY'],
        ['v2', 'dom-change', 'EDITOR_READY_DOM_CHANGED'],
        ['v2', 'ambiguity', 'TARGET_AMBIGUOUS'],
        ['v2', 'interstitial', 'INTERSTITIAL_REQUIRED'],
        ['v3', 'auth-expired', 'AUTH_REQUIRED'],
        ['v3', 'security-challenge', 'SECURITY_CHALLENGE'],
      ];

      for (const [version, variant, expectedState] of scenarios) {
        await loadScenario(view, version, variant, expectedState);
      }

      await loadScenario(view, 'v1', 'normal', 'EDITOR_READY');
      const normalOutcome = await view.webContents.executeJavaScript(`(() => {
        document.querySelector('[data-action="normal-publish"]').click();
        const confirmationState = document.body.dataset.fixtureState;
        document.querySelector('[data-action="confirm-normal"]').click();
        return {
          confirmationState,
          finalState: document.body.dataset.fixtureState
        };
      })()`);
      assertEqual(
        normalOutcome,
        { confirmationState: 'CONFIRMATION_REQUIRED', finalState: 'PUBLISH_SUCCEEDED' },
        'normal editor flow',
      );

      await loadScenario(view, 'v1', 'upload', 'UPLOAD_REQUIRED');
      const fakeAssetPath = path.resolve(__dirname, '../../fixture/public/assets/fake-cover.svg');
      const fakeAssetBase64 = readFileSync(fakeAssetPath).toString('base64');
      const uploadOutcome = await view.webContents.executeJavaScript(`(() => {
        const bytes = Uint8Array.from(atob(${JSON.stringify(fakeAssetBase64)}), (value) => value.charCodeAt(0));
        const transfer = new DataTransfer();
        transfer.items.add(new File([bytes], 'fake-cover.svg', { type: 'image/svg+xml' }));
        const input = document.querySelector('[data-upload-input]');
        input.files = transfer.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return {
          state: document.body.dataset.fixtureState,
          summary: document.querySelector('[data-upload-summary]').textContent
        };
      })()`);
      assert(uploadOutcome.state === 'UPLOAD_READY', 'Committed fake upload did not become ready.');
      assert(
        uploadOutcome.summary.includes('fake-cover.svg · image/svg+xml'),
        'Upload summary does not identify the committed fake asset.',
      );

      for (const [variant, expectedState] of [
        ['publish-success', 'PUBLISH_SUCCEEDED'],
        ['publish-failure', 'PUBLISH_FAILED'],
      ]) {
        await loadScenario(view, 'v1', variant, 'PUBLISH_READY');
        const finalState = await view.webContents.executeJavaScript(`(() => {
          document.querySelector('[data-action="${variant}"]').click();
          return document.body.dataset.fixtureState;
        })()`);
        assert(finalState === expectedState, `${variant} postcondition did not match.`);
      }

      await loadScenario(view, 'v2', 'dom-change', 'EDITOR_READY_DOM_CHANGED');
      const layoutRevision = await view.webContents.executeJavaScript(
        `document.querySelector('[data-layout-revision]').dataset.layoutRevision`,
      );
      assert(layoutRevision === 'v2', 'DOM/layout change is not explicit.');

      await loadScenario(view, 'v2', 'ambiguity', 'TARGET_AMBIGUOUS');
      const ambiguousTargets = await view.webContents.executeJavaScript(
        `document.querySelectorAll('button').length`,
      );
      assert(ambiguousTargets === 2, 'Ambiguity fixture must expose two equivalent targets.');

      await loadScenario(view, 'v3', 'security-challenge', 'SECURITY_CHALLENGE');
      const challengeText = await view.webContents.executeJavaScript(`document.body.textContent`);
      assert(
        challengeText.includes('does not solve or bypass'),
        'Security challenge lacks stop semantics.',
      );
      assertEqual(blockedRequests, [], 'fixture initiated external requests');

      await loadScenario(view, 'v1', 'normal', 'EDITOR_READY');
      const permission = await view.webContents.executeJavaScript(
        `Notification.requestPermission()`,
      );
      assert(permission === 'denied', 'Third-party fixture permission was not denied.');
      const popupDenied = await view.webContents.executeJavaScript(
        `globalThis.open('https://blocked.invalid') === null`,
      );
      assert(popupDenied, 'Third-party fixture popup was not denied.');

      const allowedUrl = view.webContents.getURL();
      await view.webContents.executeJavaScript(`location.href = 'https://blocked.invalid/'`);
      await new Promise((resolve) => setTimeout(resolve, 100));
      assert(
        view.webContents.getURL() === allowedUrl,
        'Disallowed navigation escaped the fixture origin.',
      );
      assert(
        blockedRequests.every((requestUrl) => new URL(requestUrl).origin !== fixtureOrigin),
        'A same-origin fixture request was unexpectedly blocked.',
      );

      console.log('Electron WebContentsView fixture smoke passed for 9 deterministic scenarios.');
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
