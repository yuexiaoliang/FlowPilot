import { describe, expect, it } from 'vitest';

import { MockInputError, prepareMockInputBundle } from './mock-input';
import type { MockSourceResolution } from './mock-source';

const SOURCE: MockSourceResolution = {
  semanticName: '行业学习仓库',
  permission: '只读',
  scopeSummary: '所选的行业学习 Git 仓库',
  inputBundleCreated: false,
};

describe('deterministic mock InputBundle', () => {
  it('selects, binds and freezes one exact article and cover', async () => {
    const bundle = await prepareMockInputBundle(SOURCE, { delayMs: 0 });

    expect(bundle.selectedArticle.title).toBe('让自动化真正可维护：从意图到确定性执行');
    expect(bundle.cover.alt).toContain('意图');
    expect(bundle.bindings.map((binding) => binding.label)).toEqual(['标题', '正文', '封面']);
    expect(bundle.bindings.every((binding) => binding.required)).toBe(true);
    expect(bundle.immutable).toBe(true);
    expect(Object.isFrozen(bundle)).toBe(true);
    expect(Object.isFrozen(bundle.selectedArticle)).toBe(true);
    expect(Object.isFrozen(bundle.selectedArticle.body)).toBe(true);
    expect(Object.isFrozen(bundle.bindings)).toBe(true);
  });

  it('returns a typed cancellation instead of a partial bundle', async () => {
    const abortController = new AbortController();
    const preparation = prepareMockInputBundle(SOURCE, {
      delayMs: 100,
      signal: abortController.signal,
    });

    abortController.abort();

    await expect(preparation).rejects.toMatchObject<Partial<MockInputError>>({
      code: 'INPUT_PREPARATION_CANCELLED',
      retryable: true,
    });
  });

  it('rejects a Source that is not the resolved read-only scope', async () => {
    const incompatibleSource = {
      ...SOURCE,
      permission: 'write',
    } as unknown as MockSourceResolution;

    await expect(prepareMockInputBundle(incompatibleSource, { delayMs: 0 })).rejects.toMatchObject<
      Partial<MockInputError>
    >({
      code: 'SOURCE_NOT_READY',
      retryable: true,
    });
  });
});
