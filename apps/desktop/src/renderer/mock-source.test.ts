import { describe, expect, it } from 'vitest';

import { connectMockSource, MockSourceError, resolveMockSource } from './mock-source';

describe('deterministic mock Source service', () => {
  it('connects only the scoped, read-only industry repository fixture', async () => {
    const source = await connectMockSource('industry-learning-repository', { delayMs: 0 });

    expect(source).toEqual({
      semanticName: '行业学习仓库',
      kind: '本地 Git 仓库',
      permission: '只读',
      scopeSummary: '所选的行业学习 Git 仓库',
      capabilities: ['读取文章', '读取配套封面'],
    });

    await expect(resolveMockSource(source, { delayMs: 0 })).resolves.toEqual({
      semanticName: '行业学习仓库',
      permission: '只读',
      scopeSummary: '所选的行业学习 Git 仓库',
      inputBundleCreated: false,
    });
  });

  it.each([
    ['selection-cancelled', 'SOURCE_SELECTION_CANCELLED'],
    ['permission-declined', 'SOURCE_PERMISSION_DECLINED'],
    ['downloads-folder', 'SOURCE_SCOPE_MISMATCH'],
  ] as const)('returns a typed failure for %s', async (selection, code) => {
    await expect(connectMockSource(selection, { delayMs: 0 })).rejects.toMatchObject({
      code,
      retryable: true,
    } satisfies Partial<MockSourceError>);
  });

  it('can cancel a pending connection without granting access', async () => {
    const abortController = new AbortController();
    const pendingConnection = connectMockSource('industry-learning-repository', {
      delayMs: 1_000,
      signal: abortController.signal,
    });

    abortController.abort();

    await expect(pendingConnection).rejects.toMatchObject({
      code: 'SOURCE_CONNECTION_CANCELLED',
      retryable: true,
    } satisfies Partial<MockSourceError>);
  });
});
