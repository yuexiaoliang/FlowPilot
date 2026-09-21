import type { MockConfirmationDecision } from './mock-confirmation';
import type { MockInputBundle } from './mock-input';

export type MockResultErrorCode =
  | 'MOCK_ACTION_CANCELLED'
  | 'RESULT_CONTEXT_UNAVAILABLE'
  | 'MOCK_POSTCONDITION_FAILED'
  | 'MOCK_ACTION_FAILED';

export class MockResultError extends Error {
  readonly code: MockResultErrorCode;
  readonly retryable: boolean;

  constructor(code: MockResultErrorCode, message: string, retryable: boolean) {
    super(message);
    this.name = 'MockResultError';
    this.code = code;
    this.retryable = retryable;
  }
}

export type MockResultMilestoneId = 'PERFORMING_MOCK_ACTION' | 'VERIFYING_MOCK_POSTCONDITION';

export type MockResultMilestone = Readonly<{
  id: MockResultMilestoneId;
  label: string;
  description: string;
}>;

export const MOCK_RESULT_MILESTONES: readonly MockResultMilestone[] = [
  {
    id: 'PERFORMING_MOCK_ACTION',
    label: '正在执行本地 Mock 动作',
    description: '使用已确认的冻结输入模拟发布，不连接微信或任何真实平台。',
  },
  {
    id: 'VERIFYING_MOCK_POSTCONDITION',
    label: '正在验证模拟结果',
    description: '检查固定的本地 Mock 后置条件；验证完成前不会显示成功。',
  },
] as const;

export type MockTerminalResult = Readonly<{
  status: 'SUCCEEDED' | 'CANCELLED';
  targetSummary: '微信公众号';
  articleTitle: MockInputBundle['selectedArticle']['title'];
  snapshotSummary: MockInputBundle['snapshotSummary'];
  bundle: MockInputBundle;
  decision: MockConfirmationDecision;
  mockPostconditionVerified: boolean;
}>;

export type RunMockResultOptions = {
  signal?: AbortSignal;
  milestoneDelayMs?: number;
  postconditionPasses?: boolean;
  onMilestone?: (milestone: MockResultMilestone) => void;
};

function cancellationError(): MockResultError {
  return new MockResultError(
    'MOCK_ACTION_CANCELLED',
    '模拟动作和结果验证已停止。没有真实发布，也没有产生成功结果。',
    true,
  );
}

function assertDecisionContext(
  decision: MockConfirmationDecision,
  expectedKind: MockConfirmationDecision['kind'],
): void {
  if (
    !Object.isFrozen(decision) ||
    decision.kind !== expectedKind ||
    !decision.bundle.immutable ||
    !Object.isFrozen(decision.bundle)
  ) {
    throw new MockResultError(
      'RESULT_CONTEXT_UNAVAILABLE',
      '确认决定或冻结输入已经不能可靠验证。没有执行真实发布，也没有生成成功结果。',
      false,
    );
  }
}

function waitForMilestone(delayMs: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted === true) {
      reject(cancellationError());
      return;
    }

    const timeoutId = setTimeout(() => {
      signal?.removeEventListener('abort', handleAbort);
      resolve();
    }, delayMs);

    function handleAbort(): void {
      clearTimeout(timeoutId);
      reject(cancellationError());
    }

    signal?.addEventListener('abort', handleAbort, { once: true });
  });
}

export async function runMockActionAndVerify(
  decision: MockConfirmationDecision,
  options: RunMockResultOptions = {},
): Promise<MockTerminalResult> {
  assertDecisionContext(decision, 'CONFIRMED');

  for (const milestone of MOCK_RESULT_MILESTONES) {
    options.onMilestone?.(milestone);
    await waitForMilestone(options.milestoneDelayMs ?? 620, options.signal);
  }

  if (options.postconditionPasses === false) {
    throw new MockResultError(
      'MOCK_POSTCONDITION_FAILED',
      '本地 Mock 后置条件未通过，无法证明模拟动作达到目标，因此不会显示成功。',
      true,
    );
  }

  return Object.freeze({
    status: 'SUCCEEDED',
    targetSummary: '微信公众号',
    articleTitle: decision.bundle.selectedArticle.title,
    snapshotSummary: decision.bundle.snapshotSummary,
    bundle: decision.bundle,
    decision,
    mockPostconditionVerified: true,
  });
}

export function createMockCancelledResult(decision: MockConfirmationDecision): MockTerminalResult {
  assertDecisionContext(decision, 'CANCELLED');

  return Object.freeze({
    status: 'CANCELLED',
    targetSummary: '微信公众号',
    articleTitle: decision.bundle.selectedArticle.title,
    snapshotSummary: decision.bundle.snapshotSummary,
    bundle: decision.bundle,
    decision,
    mockPostconditionVerified: false,
  });
}

export function isMockResultError(error: unknown): error is MockResultError {
  return error instanceof MockResultError;
}
