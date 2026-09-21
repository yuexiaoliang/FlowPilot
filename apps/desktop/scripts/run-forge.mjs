import { spawn } from 'node:child_process';
import { lstat, realpath, rename, symlink, unlink } from 'node:fs/promises';
import path from 'node:path';

const environment = { ...process.env };
delete environment.COREPACK_ROOT;

const desktopRoot = path.resolve(import.meta.dirname, '..');
const workspaceModules = path.resolve(desktopRoot, '../../node_modules');
const desktopModules = path.join(desktopRoot, 'node_modules');
const modulesBackup = path.join(desktopRoot, '.flowpilot-package-node-modules');

async function pathExists(filePath) {
  try {
    await lstat(filePath);
    return true;
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return false;
    }

    throw error;
  }
}

async function prepareDesktopModules() {
  if (await pathExists(desktopModules)) {
    const stats = await lstat(desktopModules);
    if (
      stats.isSymbolicLink() &&
      (await realpath(desktopModules)) === (await realpath(workspaceModules))
    ) {
      return { createdLink: false, movedDirectory: false };
    }

    if (await pathExists(modulesBackup)) {
      throw new Error(`${modulesBackup} 已存在，无法安全准备 Forge packaging。`);
    }

    await rename(desktopModules, modulesBackup);
  }

  await symlink(
    workspaceModules,
    desktopModules,
    process.platform === 'win32' ? 'junction' : 'dir',
  );
  return { createdLink: true, movedDirectory: await pathExists(modulesBackup) };
}

async function restoreDesktopModules({ createdLink, movedDirectory }) {
  if (createdLink) {
    await unlink(desktopModules);
  }

  if (movedDirectory) {
    await rename(modulesBackup, desktopModules);
  }
}

function runForge() {
  const executable = process.platform === 'win32' ? 'electron-forge.cmd' : 'electron-forge';

  return new Promise((resolve, reject) => {
    const forge = spawn(executable, ['package'], {
      env: environment,
      shell: process.platform === 'win32',
      stdio: 'inherit',
    });

    forge.once('error', reject);
    forge.once('exit', (code, signal) => {
      if (signal !== null) {
        reject(new Error(`Electron Forge was terminated by ${signal}.`));
        return;
      }

      resolve(code ?? 1);
    });
  });
}

const modulesState = await prepareDesktopModules();

try {
  process.exitCode = await runForge();
} finally {
  await restoreDesktopModules(modulesState);
}
