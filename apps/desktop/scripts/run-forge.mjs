import { spawn } from 'node:child_process';
import { lstat, mkdir, realpath, rename, rmdir, symlink, unlink } from 'node:fs/promises';
import path from 'node:path';

const environment = { ...process.env };
delete environment.COREPACK_ROOT;

const desktopRoot = path.resolve(import.meta.dirname, '..');
const workspaceModules = path.resolve(desktopRoot, '../../node_modules');
const desktopModules = path.join(desktopRoot, 'node_modules');
const modulesBackup = path.join(desktopRoot, '.flowpilot-package-node-modules');
const contractsRoot = path.resolve(desktopRoot, '../../packages/ipc-contracts');
const workspaceScope = path.join(workspaceModules, '@flowpilot');
const workspaceContractsLink = path.join(workspaceScope, 'ipc-contracts');

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

async function prepareWorkspaceContractsLink() {
  let createdScope = false;
  let createdLink = false;

  try {
    if (!(await pathExists(workspaceScope))) {
      await mkdir(workspaceScope);
      createdScope = true;
    }

    if (await pathExists(workspaceContractsLink)) {
      if ((await realpath(workspaceContractsLink)) !== (await realpath(contractsRoot))) {
        throw new Error(`${workspaceContractsLink} 已存在，但没有指向 IPC contracts workspace。`);
      }
    } else {
      await symlink(
        contractsRoot,
        workspaceContractsLink,
        process.platform === 'win32' ? 'junction' : 'dir',
      );
      createdLink = true;
    }

    return { createdLink, createdScope };
  } catch (error) {
    if (createdScope && !(await pathExists(workspaceContractsLink))) {
      await rmdir(workspaceScope);
    }
    throw error;
  }
}

async function restoreDesktopModules({ createdLink, movedDirectory }) {
  if (createdLink) {
    await unlink(desktopModules);
  }

  if (movedDirectory) {
    await rename(modulesBackup, desktopModules);
  }
}

async function restoreWorkspaceContractsLink({ createdLink, createdScope }) {
  if (createdLink) {
    await unlink(workspaceContractsLink);
  }

  if (createdScope) {
    await rmdir(workspaceScope);
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

const contractsLinkState = await prepareWorkspaceContractsLink();
let modulesState;

try {
  modulesState = await prepareDesktopModules();
  process.exitCode = await runForge();
} finally {
  if (modulesState !== undefined) {
    await restoreDesktopModules(modulesState);
  }
  await restoreWorkspaceContractsLink(contractsLinkState);
}
