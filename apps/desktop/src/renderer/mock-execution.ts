import type { MockInputBundle } from './mock-input';

export type MockExecutionErrorCode =
  'EXECUTION_PREPARATION_CANCELLED' | 'INPUT_BUNDLE_UNAVAILABLE' | 'EXECUTION_PREPARATION_FAILED';

export class MockExecutionError extends Error {
  readonly code: MockExecutionErrorCode;
  readonly retryable: boolean;

  constructor(code: MockExecutionErrorCode, message: string, retryable: boolean) {
    super(message);
    this.name = 'MockExecutionError';
    this.code = code;
    this.retryable = retryable;
  }
}

export type MockExecutionMilestoneId =
  'PREPARING_INPUT' | 'OPENING_DESTINATION' | 'PREPARING_IRREVERSIBLE_ACTION';

export type MockExecutionMilestone = Readonly<{
  id: MockExecutionMilestoneId;
  label: string;
  description: string;
}>;

export const MOCK_EXECUTION_MILESTONES: readonly MockExecutionMilestone[] = [
  {
    id: 'PREPARING_INPUT',
    label: '正在准备已冻结的输入',
    description: '核对文章、正文和封面仍来自同一份演示快照。',
  },
  {
    id: 'OPENING_DESTINATION',
    label: '正在打开发布位置',
    description: '模拟进入微信公众号文章发布位置，不连接真实平台。',
  },
  {
    id: 'PREPARING_IRREVERSIBLE_ACTION',
    label: '正在准备发布动作',
    description: '在任何不可逆动作发生前检查发布确认策略。',
  },
] as const;

export type MockExecutionPause = Readonly<{
  state: 'PAUSED_CONFIRMATION';
  targetSummary: '微信公众号文章';
  articleTitle: MockInputBundle['selectedArticle']['title'];
  sourceName: MockInputBundle['source']['semanticName'];
  snapshotSummary: MockInputBundle['snapshotSummary'];
  bundle: MockInputBundle;
}>;

export type RunMockExecutionOptions = {
  signal?: AbortSignal;
  milestoneDelayMs?: number;
  onMilestone?: (milestone: MockExecutionMilestone) => void;
};

function cancellationError(): MockExecutionError {
  return new MockExecutionError(
    'EXECUTION_PREPARATION_CANCELLED',
    '运行准备已停止。没有打开确认界面，也没有执行或发布任何内容。',
    true,
  );
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

export async function runMockExecution(
  bundle: MockInputBundle,
  options: RunMockExecutionOptions = {},
): Promise<MockExecutionPause> {
  if (!bundle.immutable || !Object.isFrozen(bundle)) {
    throw new MockExecutionError(
      'INPUT_BUNDLE_UNAVAILABLE',
      '本次输入不存在或尚未冻结，不能创建运行。请返回输入预览重新准备。',
      true,
    );
  }

  for (const milestone of MOCK_EXECUTION_MILESTONES) {
    options.onMilestone?.(milestone);
    await waitForMilestone(options.milestoneDelayMs ?? 680, options.signal);
  }

  return Object.freeze({
    state: 'PAUSED_CONFIRMATION',
    targetSummary: '微信公众号文章',
    articleTitle: bundle.selectedArticle.title,
    sourceName: bundle.source.semanticName,
    snapshotSummary: bundle.snapshotSummary,
    bundle,
  });
}

export function isMockExecutionError(error: unknown): error is MockExecutionError {
  return error instanceof MockExecutionError;
}
