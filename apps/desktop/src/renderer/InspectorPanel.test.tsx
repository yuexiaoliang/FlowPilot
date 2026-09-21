import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { InspectorPanel, type InspectorLoader } from './InspectorPanel';
import {
  prepareMockConfirmation,
  recordMockConfirmationDecision,
  type MockConfirmationDecisionKind,
} from './mock-confirmation';
import { loadMockInspectorProvenance } from './mock-inspector';
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

const immediateLoader: InspectorLoader = (result, options) =>
  loadMockInspectorProvenance(result, { ...options, delayMs: 0 });

describe('Inspector panel', () => {
  it('progressively reveals readable provenance and closes without changing the result', async () => {
    const user = userEvent.setup();
    const result = await createResult('CONFIRMED');
    const onClose = vi.fn();

    render(
      <InspectorPanel
        result={result}
        loader={immediateLoader}
        onAnnouncement={vi.fn()}
        onClose={onClose}
      />,
    );

    const heading = await screen.findByRole('heading', {
      name: '本次模拟运行的检查详情',
    });
    expect(heading).not.toHaveFocus();
    expect(screen.getByText('SUCCEEDED')).toBeVisible();
    expect(screen.queryByText('每日行业学习发布 · 修订 1')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /计划与 Flow 版本/u }));
    expect(screen.getByText('每日行业学习发布 · 修订 1')).toBeVisible();
    expect(screen.getByText('发布最新行业文章 · 修订 1')).toBeVisible();
    expect(screen.getByText('微信公众号文章发布流程 · 修订 1')).toBeVisible();

    await user.click(screen.getByRole('button', { name: /Source 与 InputBundle/u }));
    expect(screen.getByText('演示 Source 快照 · 版本 1')).toBeVisible();
    expect(screen.getByText(`${result.snapshotSummary} · 不可变`)).toBeVisible();

    await user.click(screen.getByRole('button', { name: /Run timeline/u }));
    expect(screen.getByText('Mock 后置条件已验证')).toBeVisible();
    expect(document.body).not.toHaveTextContent(/sourceId|runId|contentHash|\/Users\//u);

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
    expect(result.status).toBe('SUCCEEDED');
  });

  it('shows cancelled provenance without successful action evidence', async () => {
    const result = await createResult('CANCELLED');

    render(
      <InspectorPanel
        result={result}
        loader={immediateLoader}
        onAnnouncement={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    await screen.findByRole('heading', { name: '本次模拟运行的检查详情' });
    expect(screen.getByText('CANCELLED')).toBeVisible();
    expect(screen.getAllByText('未执行')).toHaveLength(2);
    expect(screen.queryByText('已验证')).not.toBeInTheDocument();
  });

  it('shows typed failure without partial provenance for an invalid result', async () => {
    const result = await createResult('CONFIRMED');
    const mutableResult = { ...result } as MockTerminalResult;

    render(
      <InspectorPanel
        result={mutableResult}
        loader={immediateLoader}
        onAnnouncement={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    const heading = await screen.findByRole('heading', { name: '还不能加载检查详情' });
    expect(heading).not.toHaveFocus();
    expect(screen.getByText(/不会生成或猜测 provenance/u)).toBeVisible();
    expect(screen.queryByText('TaskPlan')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '返回结果' })).toBeEnabled();
  });
});
