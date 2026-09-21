import { extractFile, listPackage } from '@electron/asar';
import { readdir } from 'node:fs/promises';
import path from 'node:path';

const desktopRoot = path.resolve(import.meta.dirname, '..');
const outputRoot = path.resolve(desktopRoot, '../../out/desktop');

async function findArchives(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const archives = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      archives.push(...(await findArchives(entryPath)));
    } else if (entry.name === 'app.asar') {
      archives.push(entryPath);
    }
  }

  return archives;
}

function normalizeArchivePath(filePath) {
  return filePath.startsWith('/') ? filePath : `/${filePath}`;
}

function assertArchiveContents(archivePath) {
  const files = listPackage(archivePath).map(normalizeArchivePath);
  const requiredFiles = [
    '/dist/main/index.js',
    '/dist/preload/index.js',
    '/dist/renderer/index.html',
    '/node_modules/@flowpilot/ipc-contracts/dist/index.js',
    '/package.json',
  ];
  const forbiddenPatterns = [
    /^\/index\.html$/,
    /^\/(?:e2e|scripts|src|playwright-report|test-results|profiles|user-data)(?:\/|$)/,
    /^\/node_modules\/@flowpilot\/ipc-contracts\/(?:src(?:\/|$)|tsconfig\.json$)/,
    /^\/node_modules\/(?:@electron-forge|@playwright)\/[^/]+(?:\/|$)/,
    /^\/node_modules\/(?:eslint|prettier|typescript|vite|vitest)(?:\/|$)/,
    /(?:^|\/)\.env(?:\..*)?$/,
    /\.(?:pem|key|db|db-shm|db-wal|sqlite|sqlite3)$/i,
    /(?:^|\/)(?:storage-state|auth-state).*\.json$/i,
    /\.test\.[cm]?[jt]sx?$/i,
  ];

  const missingFiles = requiredFiles.filter((requiredFile) => !files.includes(requiredFile));
  if (missingFiles.length > 0) {
    throw new Error(`打包产物缺少必需文件：${missingFiles.join(', ')}`);
  }

  const forbiddenFiles = files.filter((file) =>
    forbiddenPatterns.some((pattern) => pattern.test(file)),
  );
  if (forbiddenFiles.length > 0) {
    throw new Error(`打包产物包含禁止文件：${forbiddenFiles.join(', ')}`);
  }

  const packagedManifest = JSON.parse(extractFile(archivePath, 'package.json').toString());
  if (packagedManifest.main !== 'dist/main/index.js') {
    throw new Error('打包产物的 Electron main 入口不正确。');
  }

  return files.length;
}

const archives = (await findArchives(outputRoot)).sort();
if (archives.length === 0) {
  throw new Error(`未在 ${outputRoot} 找到 app.asar。`);
}

const inspectedFiles = archives.reduce(
  (fileCount, archivePath) => fileCount + assertArchiveContents(archivePath),
  0,
);

console.log(
  `Packaging smoke passed: ${archives.length} archive(s), ${inspectedFiles} file(s) inspected.`,
);
