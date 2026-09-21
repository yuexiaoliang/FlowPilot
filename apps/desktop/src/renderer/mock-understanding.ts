export const EXAMPLE_INTENT = `每天早上 8 点检查我的行业学习仓库。
如果今天有新的文章，就发布到微信公众号。
正式发布之前让我确认。`;

export type UnderstandingItem = {
  label: '时间' | '数据' | '操作' | '没有新内容时' | '发布之前';
  value: string;
};

export type MockUnderstanding = {
  items: readonly UnderstandingItem[];
};

export type MockUnderstandingErrorCode =
  | 'EMPTY_INTENT'
  | 'INTENT_NOT_RECOGNIZED'
  | 'ANALYSIS_CANCELLED';

export class MockUnderstandingError extends Error {
  readonly code: MockUnderstandingErrorCode;
  readonly retryable: boolean;

  constructor(code: MockUnderstandingErrorCode, message: string, retryable: boolean) {
    super(message);
    this.name = 'MockUnderstandingError';
    this.code = code;
    this.retryable = retryable;
  }
}

export type AnalyzeIntentOptions = {
  signal?: AbortSignal;
  delayMs?: number;
};

const FIXTURE_UNDERSTANDING: MockUnderstanding = {
  items: [
    { label: '时间', value: '每天 08:00（你的时区）' },
    { label: '数据', value: '行业学习仓库 → 今天最新文章' },
    { label: '操作', value: '发布微信公众号文章' },
    { label: '没有新内容时', value: '跳过' },
    { label: '发布之前', value: '请求确认' },
  ],
};

function cancellationError(): MockUnderstandingError {
  return new MockUnderstandingError('ANALYSIS_CANCELLED', '分析已取消，意图文本仍然保留。', true);
}

function waitForMockDelay(delayMs: number, signal?: AbortSignal): Promise<void> {
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

function matchesFixtureIntent(source: string): boolean {
  const compact = source.replace(/\s+/gu, '');
  return (
    /每天早上?8点/u.test(compact) &&
    /行业学习(?:仓库|内容)/u.test(compact) &&
    /新(?:的)?文章/u.test(compact) &&
    /发布到?微信公众(?:号|平台)/u.test(compact) &&
    /发布(?:之前|前).*确认/u.test(compact)
  );
}

export async function analyzeIntent(
  source: string,
  options: AnalyzeIntentOptions = {},
): Promise<MockUnderstanding> {
  const trimmedSource = source.trim();

  if (trimmedSource.length === 0) {
    throw new MockUnderstandingError(
      'EMPTY_INTENT',
      '先用普通语言写下想达成的结果，然后再分析。',
      true,
    );
  }

  await waitForMockDelay(options.delayMs ?? 480, options.signal);

  if (!matchesFixtureIntent(trimmedSource)) {
    throw new MockUnderstandingError(
      'INTENT_NOT_RECOGNIZED',
      '这个确定性原型目前只识别示例发布意图。请补充时间、数据来源、发布操作和确认规则后重试。',
      true,
    );
  }

  return FIXTURE_UNDERSTANDING;
}

export function isMockUnderstandingError(error: unknown): error is MockUnderstandingError {
  return error instanceof MockUnderstandingError;
}
