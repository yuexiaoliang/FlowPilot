import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  prepareMockConfirmation,
  recordMockConfirmationDecision,
  type MockConfirmationDecisionKind,
} from './mock-confirmation';
import { prepareMockInputBundle } from './mock-input';
import { createMockCancelledResult, runMockActionAndVerify } from './mock-result';
import type { MockSourceResolution } from './mock-source';
import { ResultPanel } from './ResultPanel';

const SOURCE: MockSourceResolution = {
  semanticName: '行业学习仓库',
  permission: '只读',
  scopeSummary: '所选的行业学习 Git 仓库',
  inputBundleCreated: false,
};

async function createResult(kind: MockConfirmationDecisionKind) {
  const bundle = await prepareMockInputBundle(SOURCE, { delayMs: 0 });
  const context = await prepareMockConfirmation(bundle, { delayMs: 0 });
  const decision = recordMockConfirmationDecision(context, kind);

  return kind === 'CONFIRMED'
    ? runMockActionAndVerify(decision, { milestoneDelayMs: 0 })
    : createMockCancelledResult(decision);
}

describe('Result panel', () => {
  it('shows a minimal verified Mock success with an on-demand Inspector', async () => {
    const user = userEvent.setup();
    const result = await createResult('CONFIRMED');
    const onReturnToInput = vi.fn();
    const onAnnouncement = vi.fn();

    render(
      <ResultPanel
        result={result}
        onAnnouncement={onAnnouncement}
        onReturnToInput={onReturnToInput}
      />,
    );

    const heading = screen.getByRole('heading', { name: '模拟发布已验证' });
    await waitFor(() => expect(heading).toHaveFocus());
    expect(screen.getByText(/未连接微信，也没有执行真实发布/u)).toBeVisible();
    expect(screen.getByText(result.articleTitle)).toBeVisible();
    expect(screen.getByRole('button', { name: '检查详情' })).toBeEnabled();
    expect(screen.getByText(/按需查看本次结果绑定/u)).toBeVisible();
    expect(document.body).not.toHaveTextContent(/runId|contentHash|selector|\/Users\//u);

    const inspectorTrigger = screen.getByRole('button', { name: '检查详情' });
    await user.click(inspectorTrigger);
    expect(inspectorTrigger).toHaveFocus();
    await screen.findByRole('heading', { name: '本次模拟运行的检查详情' });
    expect(inspectorTrigger).toHaveFocus();
    await user.keyboard('{Tab}');
    expect(screen.getByRole('button', { name: '关闭检查详情' })).toHaveFocus();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.getByRole('button', { name: '检查详情' })).toHaveFocus());
    expect(onAnnouncement).not.toHaveBeenCalledWith('检查详情已关闭，返回原结果。');

    await user.click(screen.getByRole('button', { name: '返回输入预览' }));
    expect(onReturnToInput).toHaveBeenCalledOnce();
  });

  it('shows cancellation as a neutral result rather than success', async () => {
    const result = await createResult('CANCELLED');

    render(<ResultPanel result={result} onAnnouncement={vi.fn()} onReturnToInput={vi.fn()} />);

    const heading = screen.getByRole('heading', { name: '本次发布已取消' });
    await waitFor(() => expect(heading).toHaveFocus());
    expect(screen.getByText(/没有执行动作，也不会自动重试/u)).toBeVisible();
    expect(screen.getByText('模拟结果 · 已取消')).toBeVisible();
    expect(screen.getByText('已取消')).toBeVisible();
    expect(screen.queryByText('模拟发布已验证')).not.toBeInTheDocument();
  });
});
