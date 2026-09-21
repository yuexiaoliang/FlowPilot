import type { MockInputBundle } from './mock-input';

export type MockConfirmationErrorCode =
  | 'CONFIRMATION_PREPARATION_CANCELLED'
  | 'CONFIRMATION_CONTEXT_UNAVAILABLE'
  | 'CONFIRMATION_PREPARATION_FAILED';

export class MockConfirmationError extends Error {
  readonly code: MockConfirmationErrorCode;
  readonly retryable: boolean;

  constructor(code: MockConfirmationErrorCode, message: string, retryable: boolean) {
    super(message);
    this.name = 'MockConfirmationError';
    this.code = code;
    this.retryable = retryable;
  }
}

export type MockConfirmationContext = Readonly<{
  state: 'READY';
  actionSummary: '发布微信公众号文章';
  targetSummary: '微信公众号';
  bundle: MockInputBundle;
}>;

export type MockConfirmationDecisionKind = 'CONFIRMED' | 'CANCELLED';

export type MockConfirmationDecision = Readonly<{
  kind: MockConfirmationDecisionKind;
  actionSummary: MockConfirmationContext['actionSummary'];
  targetSummary: MockConfirmationContext['targetSummary'];
  bundle: MockInputBundle;
}>;

export type PrepareMockConfirmationOptions = {
  signal?: AbortSignal;
  delayMs?: number;
};

function cancellationError(): MockConfirmationError {
  return new MockConfirmationError(
    'CONFIRMATION_PREPARATION_CANCELLED',
    '发布确认复核已停止。没有记录确认或取消决定，也没有执行发布。',
    true,
  );
}

function waitForReview(delayMs: number, signal?: AbortSignal): Promise<void> {
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

function assertFrozenBundle(bundle: MockInputBundle): void {
  if (!bundle.immutable || !Object.isFrozen(bundle)) {
    throw new MockConfirmationError(
      'CONFIRMATION_CONTEXT_UNAVAILABLE',
      '本次输入或目的地已经不能可靠复核。请关闭确认并返回输入预览重新准备。',
      true,
    );
  }
}

export async function prepareMockConfirmation(
  bundle: MockInputBundle,
  options: PrepareMockConfirmationOptions = {},
): Promise<MockConfirmationContext> {
  assertFrozenBundle(bundle);
  await waitForReview(options.delayMs ?? 420, options.signal);

  return Object.freeze({
    state: 'READY',
    actionSummary: '发布微信公众号文章',
    targetSummary: '微信公众号',
    bundle,
  });
}

export function recordMockConfirmationDecision(
  context: MockConfirmationContext,
  kind: MockConfirmationDecisionKind,
): MockConfirmationDecision {
  assertFrozenBundle(context.bundle);

  if (!Object.isFrozen(context)) {
    throw new MockConfirmationError(
      'CONFIRMATION_CONTEXT_UNAVAILABLE',
      '发布确认上下文已经失效。没有记录决定，也没有执行发布。',
      false,
    );
  }

  return Object.freeze({
    kind,
    actionSummary: context.actionSummary,
    targetSummary: context.targetSummary,
    bundle: context.bundle,
  });
}

export function isMockConfirmationError(error: unknown): error is MockConfirmationError {
  return error instanceof MockConfirmationError;
}
