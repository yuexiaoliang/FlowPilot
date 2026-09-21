import type { MockTerminalResult } from './mock-result';

export type MockInspectorErrorCode =
  'INSPECTOR_LOADING_CANCELLED' | 'INSPECTOR_CONTEXT_UNAVAILABLE' | 'MOCK_PROVENANCE_UNAVAILABLE';

export class MockInspectorError extends Error {
  readonly code: MockInspectorErrorCode;
  readonly retryable: boolean;

  constructor(code: MockInspectorErrorCode, message: string, retryable: boolean) {
    super(message);
    this.name = 'MockInspectorError';
    this.code = code;
    this.retryable = retryable;
  }
}

export type MockTimelineEntry = Readonly<{
  label: string;
  detail: string;
  state: 'completed' | 'cancelled';
}>;

export type MockInspectorProvenance = Readonly<{
  result: MockTerminalResult;
  outcome: Readonly<{
    status: MockTerminalResult['status'];
    confirmationDecision: '已确认' | '已取消';
    mockAction: '已完成' | '未执行';
    postcondition: '已验证' | '未执行';
  }>;
  plans: Readonly<{
    taskPlan: '每日行业学习发布 · 修订 1';
    goalPlan: '发布最新行业文章 · 修订 1';
    flowRevision: '微信公众号文章发布流程 · 修订 1';
  }>;
  source: Readonly<{
    semanticName: string;
    permission: string;
    scopeSummary: string;
    version: '演示 Source 快照 · 版本 1';
  }>;
  input: Readonly<{
    snapshotSummary: string;
    articleTitle: string;
    immutable: true;
  }>;
  timeline: readonly MockTimelineEntry[];
}>;

export type LoadMockInspectorOptions = {
  signal?: AbortSignal;
  delayMs?: number;
};

function cancellationError(): MockInspectorError {
  return new MockInspectorError(
    'INSPECTOR_LOADING_CANCELLED',
    '检查详情加载已停止。结果和冻结输入没有改变。',
    true,
  );
}

function waitForLoad(delayMs: number, signal?: AbortSignal): Promise<void> {
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

function assertResultContext(result: MockTerminalResult): void {
  const decisionMatchesResult =
    (result.status === 'SUCCEEDED' &&
      result.decision.kind === 'CONFIRMED' &&
      result.mockPostconditionVerified) ||
    (result.status === 'CANCELLED' &&
      result.decision.kind === 'CANCELLED' &&
      !result.mockPostconditionVerified);

  if (
    !Object.isFrozen(result) ||
    !Object.isFrozen(result.decision) ||
    !Object.isFrozen(result.bundle) ||
    result.bundle !== result.decision.bundle ||
    !result.bundle.immutable ||
    !decisionMatchesResult
  ) {
    throw new MockInspectorError(
      'INSPECTOR_CONTEXT_UNAVAILABLE',
      '当前结果、确认决定或冻结输入无法可靠关联，因此不会生成或猜测 provenance。',
      false,
    );
  }
}

function freezeTimeline(entries: MockTimelineEntry[]): readonly MockTimelineEntry[] {
  return Object.freeze(entries.map((entry) => Object.freeze(entry)));
}

export async function loadMockInspectorProvenance(
  result: MockTerminalResult,
  options: LoadMockInspectorOptions = {},
): Promise<MockInspectorProvenance> {
  assertResultContext(result);
  await waitForLoad(options.delayMs ?? 360, options.signal);

  const succeeded = result.status === 'SUCCEEDED';
  const timeline = succeeded
    ? freezeTimeline([
        {
          label: '输入已冻结',
          detail: `${result.snapshotSummary}，文章与封面绑定完成。`,
          state: 'completed',
        },
        {
          label: '发布确认已记录',
          detail: '用户明确选择确认；关闭和 Escape 没有被当作决定。',
          state: 'completed',
        },
        {
          label: '本地 Mock 动作已完成',
          detail: '只执行确定性本地模拟，没有连接微信、浏览器或网络。',
          state: 'completed',
        },
        {
          label: 'Mock 后置条件已验证',
          detail: '固定模拟目标已满足，结果进入已验证终态。',
          state: 'completed',
        },
      ])
    : freezeTimeline([
        {
          label: '输入已冻结',
          detail: `${result.snapshotSummary}，文章与封面绑定完成。`,
          state: 'completed',
        },
        {
          label: '取消发布已记录',
          detail: '用户明确选择取消；没有执行发布动作。',
          state: 'cancelled',
        },
        {
          label: '取消结果已生成',
          detail: '本次 Mock 运行不会自动重试，也没有成功消费记录。',
          state: 'cancelled',
        },
      ]);

  return Object.freeze({
    result,
    outcome: Object.freeze({
      status: result.status,
      confirmationDecision: succeeded ? '已确认' : '已取消',
      mockAction: succeeded ? '已完成' : '未执行',
      postcondition: succeeded ? '已验证' : '未执行',
    }),
    plans: Object.freeze({
      taskPlan: '每日行业学习发布 · 修订 1',
      goalPlan: '发布最新行业文章 · 修订 1',
      flowRevision: '微信公众号文章发布流程 · 修订 1',
    }),
    source: Object.freeze({
      semanticName: result.bundle.source.semanticName,
      permission: result.bundle.source.permission,
      scopeSummary: result.bundle.source.scopeSummary,
      version: '演示 Source 快照 · 版本 1',
    }),
    input: Object.freeze({
      snapshotSummary: result.snapshotSummary,
      articleTitle: result.articleTitle,
      immutable: true,
    }),
    timeline,
  });
}

export function isMockInspectorError(error: unknown): error is MockInspectorError {
  return error instanceof MockInspectorError;
}
