import { describe, expect, it, vi } from 'vitest';

import {
  prepareMockConfirmation,
  recordMockConfirmationDecision,
} from './mock-confirmation';
import { prepareMockInputBundle, type MockInputBundle } from './mock-input';
import {
  createMockCancelledResult,
  MOCK_RESULT_MILESTONES,
  runMockActionAndVerify,
  type MockResultError,
} from './mock-result';
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

describe('deterministic mock result', () => {
  it('shows SUCCEEDED only after the fixed mock postcondition passes', async () => {
    const bundle = await createBundle();
    const context = await prepareMockConfirmation(bundle, { delayMs: 0 });
    const decision = recordMockConfirmationDecision(context, 'CONFIRMED');
    const onMilestone = vi.fn();

    const result = await runMockActionAndVerify(decision, {
      milestoneDelayMs: 0,
      onMilestone,
    });

    expect(onMilestone.mock.calls.map(([milestone]) => milestone.id)).toEqual(
      MOCK_RESULT_MILESTONES.map((milestone) => milestone.id),
    );
    expect(result).toMatchObject({
      status: 'SUCCEEDED',
      bundle,
      decision,
      mockPostconditionVerified: true,
    });
    expect(result.bundle).toBe(bundle);
    expect(Object.isFrozen(result)).toBe(true);
  });

  it('returns a typed failure instead of success when the postcondition fails', async () => {
    const bundle = await createBundle();
    const context = await prepareMockConfirmation(bundle, { delayMs: 0 });
    const decision = recordMockConfirmationDecision(context, 'CONFIRMED');

    await expect(
      runMockActionAndVerify(decision, {
        milestoneDelayMs: 0,
        postconditionPasses: false,
      }),
    ).rejects.toMatchObject<Partial<MockResultError>>({
      code: 'MOCK_POSTCONDITION_FAILED',
      retryable: true,
    });
  });

  it('creates CANCELLED only from an explicit cancelled decision', async () => {
    const bundle = await createBundle();
    const context = await prepareMockConfirmation(bundle, { delayMs: 0 });
    const cancelledDecision = recordMockConfirmationDecision(context, 'CANCELLED');
    const confirmedDecision = recordMockConfirmationDecision(context, 'CONFIRMED');

    const result = createMockCancelledResult(cancelledDecision);

    expect(result).toMatchObject({
      status: 'CANCELLED',
      bundle,
      decision: cancelledDecision,
      mockPostconditionVerified: false,
    });
    expect(() => createMockCancelledResult(confirmedDecision)).toThrowError(
      /确认决定或冻结输入已经不能可靠验证/u,
    );
  });

  it('can stop verification without producing a terminal result', async () => {
    const bundle = await createBundle();
    const context = await prepareMockConfirmation(bundle, { delayMs: 0 });
    const decision = recordMockConfirmationDecision(context, 'CONFIRMED');
    const abortController = new AbortController();
    const verification = runMockActionAndVerify(decision, {
      milestoneDelayMs: 100,
      signal: abortController.signal,
    });

    abortController.abort();

    await expect(verification).rejects.toMatchObject<Partial<MockResultError>>({
      code: 'MOCK_ACTION_CANCELLED',
      retryable: true,
    });
  });
});
