import { describe, expect, it, vi } from 'vitest';

import {
  MOCK_EXECUTION_MILESTONES,
  type MockExecutionError,
  runMockExecution,
} from './mock-execution';
import { prepareMockInputBundle, type MockInputBundle } from './mock-input';
import type { MockSourceResolution } from './mock-source';

const SOURCE: MockSourceResolution = {
  semanticName: '行业学习仓库',
  permission: '只读',
  scopeSummary: '所选的行业学习 Git 仓库',
  inputBundleCreated: false,
};

async function createBundle(): Promise<MockInputBundle> {
  return prepareMockInputBundle(SOURCE, { delayMs: 0 });
}

describe('deterministic mock execution', () => {
  it('uses the exact frozen bundle and pauses before confirmation', async () => {
    const bundle = await createBundle();
    const onMilestone = vi.fn();

    const result = await runMockExecution(bundle, {
      milestoneDelayMs: 0,
      onMilestone,
    });

    expect(onMilestone.mock.calls.map(([milestone]) => milestone.id)).toEqual(
      MOCK_EXECUTION_MILESTONES.map((milestone) => milestone.id),
    );
    expect(result).toMatchObject({
      state: 'PAUSED_CONFIRMATION',
      targetSummary: '微信公众号文章',
      articleTitle: bundle.selectedArticle.title,
      snapshotSummary: bundle.snapshotSummary,
    });
    expect(result.bundle).toBe(bundle);
    expect(Object.isFrozen(result)).toBe(true);
  });

  it('returns a typed cancellation without reaching the confirmation boundary', async () => {
    const bundle = await createBundle();
    const abortController = new AbortController();
    const execution = runMockExecution(bundle, {
      milestoneDelayMs: 100,
      signal: abortController.signal,
    });

    abortController.abort();

    await expect(execution).rejects.toMatchObject<Partial<MockExecutionError>>({
      code: 'EXECUTION_PREPARATION_CANCELLED',
      retryable: true,
    });
  });

  it('refuses to create a run from a mutable or unavailable bundle', async () => {
    const bundle = await createBundle();
    const mutableBundle = { ...bundle } as MockInputBundle;

    await expect(
      runMockExecution(mutableBundle, { milestoneDelayMs: 0 }),
    ).rejects.toMatchObject<Partial<MockExecutionError>>({
      code: 'INPUT_BUNDLE_UNAVAILABLE',
      retryable: true,
    });
  });
});
