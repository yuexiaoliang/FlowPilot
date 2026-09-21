import { readFile } from 'node:fs/promises';

import { parse } from 'yaml';

const workflowPath = new URL('../.github/workflows/ci.yml', import.meta.url);
const workflow = parse(await readFile(workflowPath, { encoding: 'utf8' }));

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(workflow !== null && typeof workflow === 'object', 'CI workflow 必须是 YAML object。');
assert(workflow.on?.push !== undefined, 'CI workflow 必须监听 push。');
assert(workflow.on?.pull_request !== undefined, 'CI workflow 必须监听 pull_request。');
assert(workflow.permissions?.contents === 'read', 'CI workflow 必须使用只读 contents 权限。');

const verifyJob = workflow.jobs?.verify;
assert(verifyJob !== undefined, 'CI workflow 缺少 verify job。');
assert(verifyJob['runs-on'] === 'ubuntu-latest', 'CI verify job 必须运行在 ubuntu-latest。');
assert(Array.isArray(verifyJob.steps), 'CI verify job 缺少 steps。');

const commands = verifyJob.steps
  .map((step) => step.run)
  .filter((command) => typeof command === 'string')
  .join('\n');

for (const expectedCommand of [
  'corepack enable',
  'corepack install --global pnpm@12.5.1',
  'pnpm install --frozen-lockfile',
  'pnpm typecheck',
  'pnpm lint',
  'pnpm format:check',
  'pnpm test',
  'pnpm build',
]) {
  assert(commands.includes(expectedCommand), `CI workflow 缺少命令：${expectedCommand}`);
}

console.log('CI workflow contract passed.');
