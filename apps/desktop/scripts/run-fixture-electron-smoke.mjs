import { spawn } from 'node:child_process';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const desktopRoot = path.resolve(import.meta.dirname, '..');
const fixtureRoot = path.resolve(desktopRoot, '../fixture');
const fixtureEntry = path.join(fixtureRoot, 'dist/server.js');
const rawPort = process.env.FLOWPILOT_FIXTURE_PORT ?? '43128';

if (!/^\d{4,5}$/u.test(rawPort)) {
  throw new Error('FLOWPILOT_FIXTURE_PORT must be an explicit valid port.');
}

const port = Number(rawPort);
if (!Number.isSafeInteger(port) || port < 1024 || port > 65_535 || port === 43_127) {
  throw new Error('Fixture port must be 1024–65535 and distinct from the P0 Renderer port.');
}

const fixtureOrigin = `http://127.0.0.1:${port}`;
let fixtureOutput = '';
const fixtureProcess = spawn(process.execPath, [fixtureEntry], {
  cwd: fixtureRoot,
  env: {
    ...process.env,
    FLOWPILOT_FIXTURE_PORT: rawPort,
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});

fixtureProcess.stdout.on('data', (chunk) => {
  fixtureOutput += chunk.toString();
});
fixtureProcess.stderr.on('data', (chunk) => {
  fixtureOutput += chunk.toString();
});

async function waitForFixture() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (fixtureProcess.exitCode !== null) {
      throw new Error(`Fixture server exited before it became ready.\n${fixtureOutput}`);
    }

    try {
      const response = await fetch(`${fixtureOrigin}/health`, {
        signal: AbortSignal.timeout(250),
      });
      if (response.ok) {
        return;
      }
    } catch {
      // The fixed loopback server is still starting.
    }

    await delay(50);
  }

  throw new Error(`Fixture server did not become ready.\n${fixtureOutput}`);
}

function runElectronSmoke() {
  const executable = process.platform === 'win32' ? 'electron.cmd' : 'electron';

  return new Promise((resolve, reject) => {
    const electron = spawn(executable, ['./scripts/electron-fixture-smoke.cjs'], {
      cwd: desktopRoot,
      env: {
        ...process.env,
        FLOWPILOT_FIXTURE_ORIGIN: fixtureOrigin,
      },
      shell: process.platform === 'win32',
      stdio: 'inherit',
    });

    electron.once('error', reject);
    electron.once('exit', (code, signal) => {
      if (signal !== null) {
        reject(new Error(`Electron fixture smoke was terminated by ${signal}.`));
        return;
      }
      resolve(code ?? 1);
    });
  });
}

function stopFixture() {
  if (fixtureProcess.exitCode !== null) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Fixture server did not release its port after SIGTERM.'));
    }, 3_000);

    fixtureProcess.once('exit', () => {
      clearTimeout(timeout);
      resolve();
    });
    fixtureProcess.kill('SIGTERM');
  });
}

async function assertFixtureStopped() {
  try {
    await fetch(`${fixtureOrigin}/health`, { signal: AbortSignal.timeout(250) });
  } catch {
    return;
  }

  throw new Error(`Fixture server is still reachable at ${fixtureOrigin}.`);
}

let smokeError;

try {
  await waitForFixture();
  const exitCode = await runElectronSmoke();
  if (exitCode !== 0) {
    throw new Error(`Electron fixture smoke exited with code ${exitCode}.`);
  }
} catch (error) {
  smokeError = error;
} finally {
  await stopFixture();
  await assertFixtureStopped();
}

if (smokeError !== undefined) {
  throw smokeError;
}

console.log(`Fixture server stopped and released ${fixtureOrigin}.`);
