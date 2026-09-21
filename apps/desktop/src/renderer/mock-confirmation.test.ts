import { describe, expect, it } from 'vitest';

import {
  prepareMockConfirmation,
  recordMockConfirmationDecision,
  type MockConfirmationError,
} from './mock-confirmation';
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

describe('deterministic mock confirmation', () => {
  it('binds the exact frozen bundle and records explicit decisions without publishing', async () => {
    const bundle = await createBundle();
    const context = await prepareMockConfirmation(bundle, { delayMs: 0 });
    const confirmed = recordMockConfirmationDecision(context, 'CONFIRMED');
    const cancelled = recordMockConfirmationDecision(context, 'CANCELLED');

    expect(context).toMatchObject({
      state: 'READY',
      actionSummary: '发布微信公众号文章',
      targetSummary: '微信公众号',
    });
    expect(context.bundle).toBe(bundle);
    expect(Object.isFrozen(context)).toBe(true);
    expect(confirmed).toMatchObject({ kind: 'CONFIRMED', bundle });
    expect(cancelled).toMatchObject({ kind: 'CANCELLED', bundle });
    expect(Object.isFrozen(confirmed)).toBe(true);
    expect(Object.isFrozen(cancelled)).toBe(true);
  });

  it('returns a typed cancellation while reviewing the confirmation context', async () => {
    const bundle = await createBundle();
    const abortController = new AbortController();
    const review = prepareMockConfirmation(bundle, {
      delayMs: 100,
      signal: abortController.signal,
    });

    abortController.abort();

    await expect(review).rejects.toMatchObject<Partial<MockConfirmationError>>({
      code: 'CONFIRMATION_PREPARATION_CANCELLED',
      retryable: true,
    });
  });

  it('refuses a mutable or unavailable input bundle', async () => {
    const bundle = await createBundle();
    const mutableBundle = { ...bundle } as MockInputBundle;

    await expect(prepareMockConfirmation(mutableBundle, { delayMs: 0 })).rejects.toMatchObject<
      Partial<MockConfirmationError>
    >({
      code: 'CONFIRMATION_CONTEXT_UNAVAILABLE',
      retryable: true,
    });
  });
});
