import { describe, expect, it } from 'vitest';

import {
  prepareMockConfirmation,
  recordMockConfirmationDecision,
  type MockConfirmationDecisionKind,
} from './mock-confirmation';
import { loadMockInspectorProvenance, type MockInspectorError } from './mock-inspector';
import { prepareMockInputBundle } from './mock-input';
import {
  createMockCancelledResult,
  runMockActionAndVerify,
  type MockTerminalResult,
} from './mock-result';
import type { MockSourceResolution } from './mock-source';

const SOURCE: MockSourceResolution = {
  semanticName: '行业学习仓库',
  permission: '只读',
  scopeSummary: '所选的行业学习 Git 仓库',
  inputBundleCreated: false,
};

async function createResult(kind: MockConfirmationDecisionKind): Promise<MockTerminalResult> {
  const bundle = await prepareMockInputBundle(SOURCE, { delayMs: 0 });
  const context = await prepareMockConfirmation(bundle, { delayMs: 0 });
  const decision = recordMockConfirmationDecision(context, kind);

  return kind === 'CONFIRMED'
    ? runMockActionAndVerify(decision, { milestoneDelayMs: 0 })
    : createMockCancelledResult(decision);
}

describe('deterministic Mock Inspector provenance', () => {
  it('binds readable provenance to the exact verified result and frozen bundle', async () => {
    const result = await createResult('CONFIRMED');
    const provenance = await loadMockInspectorProvenance(result, { delayMs: 0 });

    expect(provenance).toMatchObject({
      result,
      outcome: {
        status: 'SUCCEEDED',
        confirmationDecision: '已确认',
        mockAction: '已完成',
        postcondition: '已验证',
      },
      plans: {
        taskPlan: '每日行业学习发布 · 修订 1',
        goalPlan: '发布最新行业文章 · 修订 1',
        flowRevision: '微信公众号文章发布流程 · 修订 1',
      },
      source: {
        semanticName: '行业学习仓库',
        permission: '只读',
        version: '演示 Source 快照 · 版本 1',
      },
      input: {
        snapshotSummary: result.snapshotSummary,
        articleTitle: result.articleTitle,
        immutable: true,
      },
    });
    expect(provenance.result).toBe(result);
    expect(provenance.result.bundle).toBe(result.bundle);
    expect(provenance.timeline).toHaveLength(4);
    expect(Object.isFrozen(provenance)).toBe(true);
    expect(Object.isFrozen(provenance.timeline)).toBe(true);
  });

  it('keeps cancelled provenance neutral and records no action or postcondition', async () => {
    const result = await createResult('CANCELLED');
    const provenance = await loadMockInspectorProvenance(result, { delayMs: 0 });

    expect(provenance.outcome).toEqual({
      status: 'CANCELLED',
      confirmationDecision: '已取消',
      mockAction: '未执行',
      postcondition: '未执行',
    });
    expect(provenance.timeline.map((entry) => entry.label)).toEqual([
      '输入已冻结',
      '取消发布已记录',
      '取消结果已生成',
    ]);
  });

  it('refuses inconsistent mutable provenance instead of inventing fields', async () => {
    const result = await createResult('CONFIRMED');
    const mutableResult = { ...result } as MockTerminalResult;

    await expect(loadMockInspectorProvenance(mutableResult, { delayMs: 0 })).rejects.toMatchObject<
      Partial<MockInspectorError>
    >({
      code: 'INSPECTOR_CONTEXT_UNAVAILABLE',
      retryable: false,
    });
  });

  it('supports cancelling a provenance load without changing the result', async () => {
    const result = await createResult('CONFIRMED');
    const abortController = new AbortController();
    const loading = loadMockInspectorProvenance(result, {
      delayMs: 100,
      signal: abortController.signal,
    });

    abortController.abort();

    await expect(loading).rejects.toMatchObject<Partial<MockInspectorError>>({
      code: 'INSPECTOR_LOADING_CANCELLED',
      retryable: true,
    });
    expect(result.status).toBe('SUCCEEDED');
  });
});
