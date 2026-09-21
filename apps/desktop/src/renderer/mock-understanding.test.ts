import { describe, expect, it } from 'vitest';

import { analyzeIntent, EXAMPLE_INTENT, MockUnderstandingError } from './mock-understanding';

describe('deterministic mock understanding service', () => {
  it('maps the example natural-language intent to the fixed review', async () => {
    await expect(analyzeIntent(EXAMPLE_INTENT, { delayMs: 0 })).resolves.toEqual({
      items: [
        { label: '时间', value: '每天 08:00（你的时区）' },
        { label: '数据', value: '行业学习仓库 → 今天最新文章' },
        { label: '操作', value: '发布微信公众号文章' },
        { label: '没有新内容时', value: '跳过' },
        { label: '发布之前', value: '请求确认' },
      ],
    });
  });

  it('returns a typed, retryable failure for unsupported intent text', async () => {
    await expect(analyzeIntent('帮我处理一下。', { delayMs: 0 })).rejects.toMatchObject({
      code: 'INTENT_NOT_RECOGNIZED',
      retryable: true,
    } satisfies Partial<MockUnderstandingError>);
  });

  it('can be cancelled without producing a result', async () => {
    const abortController = new AbortController();
    const pendingAnalysis = analyzeIntent(EXAMPLE_INTENT, {
      delayMs: 1_000,
      signal: abortController.signal,
    });

    abortController.abort();

    await expect(pendingAnalysis).rejects.toMatchObject({
      code: 'ANALYSIS_CANCELLED',
      retryable: true,
    } satisfies Partial<MockUnderstandingError>);
  });
});
