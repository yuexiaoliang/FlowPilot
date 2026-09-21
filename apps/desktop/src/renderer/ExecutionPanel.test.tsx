import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ExecutionPanel, type ExecutionRunner } from './ExecutionPanel';
import { runMockExecution, type MockExecutionPause } from './mock-execution';
import { prepareMockInputBundle, type MockInputBundle } from './mock-input';
import { runMockActionAndVerify } from './mock-result';
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

describe('deterministic Execution panel', () => {
  it('shows meaningful milestones and pauses without rendering confirmation actions', async () => {
    const user = userEvent.setup();
    const bundle = await createBundle();
    const runner: ExecutionRunner = (input, options) =>
      runMockExecution(input, { ...options, milestoneDelayMs: 0 });
    const resultRunner = (
      decision: Parameters<typeof runMockActionAndVerify>[0],
      options?: Parameters<typeof runMockActionAndVerify>[1],
    ) => runMockActionAndVerify(decision, { ...options, milestoneDelayMs: 0 });
    const onAnnouncement = vi.fn();

    render(
      <ExecutionPanel
        bundle={bundle}
        runner={runner}
        resultRunner={resultRunner}
        onAnnouncement={onAnnouncement}
        onReturnToInput={vi.fn()}
      />,
    );

    const pausedHeading = await screen.findByRole('heading', { name: '等待你的确认' });
    await waitFor(() => expect(pausedHeading).toHaveFocus());
    expect(screen.getByText('FlowPilot 已在不可逆发布动作前暂停。')).toBeVisible();
    expect(screen.getByText(bundle.selectedArticle.title)).toBeVisible();
    expect(screen.getByText(bundle.snapshotSummary)).toBeVisible();
    expect(screen.getAllByText('已完成')).toHaveLength(3);
    expect(screen.getAllByText('已暂停')).toHaveLength(2);
    expect(screen.getByText(/尚未确认，也没有发布/u)).toBeVisible();
    expect(screen.getByRole('button', { name: '查看发布确认' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: '确认发布' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '取消发布' })).not.toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(/runId|selector|contentHash|\/Users\//u);
    expect(onAnnouncement).toHaveBeenLastCalledWith('模拟运行已在发布前暂停，等待你的确认。');

    await user.click(screen.getByRole('button', { name: '查看发布确认' }));
    await screen.findByRole('heading', { name: '确认发布这篇文章？' });
    await user.click(screen.getByRole('button', { name: '确认发布' }));
    const resultHeading = await screen.findByRole('heading', { name: '模拟发布已验证' });
    await waitFor(() => expect(resultHeading).toHaveFocus());
    expect(screen.getByText(/未连接微信，也没有执行真实发布/u)).toBeVisible();
    expect(screen.getByRole('button', { name: '检查详情' })).toBeEnabled();
    expect(onAnnouncement).toHaveBeenLastCalledWith(
      '本地 Mock 后置条件已验证。没有执行真实平台发布。',
    );
  });

  it('stops preparation as a recoverable failure and returns to the same input', async () => {
    const user = userEvent.setup();
    const bundle = await createBundle();
    const runner: ExecutionRunner = vi.fn(() => new Promise<MockExecutionPause>(() => undefined));
    const onReturnToInput = vi.fn();

    render(
      <ExecutionPanel
        bundle={bundle}
        runner={runner}
        onAnnouncement={vi.fn()}
        onReturnToInput={onReturnToInput}
      />,
    );

    await user.click(screen.getByRole('button', { name: '停止运行准备' }));
    const failureHeading = screen.getByRole('heading', { name: '还不能准备本次运行' });
    await waitFor(() => expect(failureHeading).toHaveFocus());
    expect(screen.getByText(/没有打开确认界面，也没有执行或发布/u)).toBeVisible();
    expect(screen.queryByText('等待你的确认')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '返回输入预览' }));
    expect(onReturnToInput).toHaveBeenCalledOnce();
    expect(bundle.immutable).toBe(true);
    expect(Object.isFrozen(bundle)).toBe(true);
  });

  it('keeps an unverified postcondition out of the success result', async () => {
    const user = userEvent.setup();
    const bundle = await createBundle();
    const runner: ExecutionRunner = (input, options) =>
      runMockExecution(input, { ...options, milestoneDelayMs: 0 });
    const resultRunner = (
      decision: Parameters<typeof runMockActionAndVerify>[0],
      options?: Parameters<typeof runMockActionAndVerify>[1],
    ) =>
      runMockActionAndVerify(decision, {
        ...options,
        milestoneDelayMs: 0,
        postconditionPasses: false,
      });

    render(
      <ExecutionPanel
        bundle={bundle}
        runner={runner}
        resultRunner={resultRunner}
        onAnnouncement={vi.fn()}
        onReturnToInput={vi.fn()}
      />,
    );

    await screen.findByRole('heading', { name: '等待你的确认' });
    await user.click(screen.getByRole('button', { name: '查看发布确认' }));
    await screen.findByRole('heading', { name: '确认发布这篇文章？' });
    await user.click(screen.getByRole('button', { name: '确认发布' }));

    const failureHeading = await screen.findByRole('heading', {
      name: '还不能验证模拟结果',
    });
    await waitFor(() => expect(failureHeading).toHaveFocus());
    expect(screen.getByText(/后置条件未通过/u)).toBeVisible();
    expect(screen.getByRole('button', { name: '重新验证模拟结果' })).toBeEnabled();
    expect(screen.queryByRole('heading', { name: '模拟发布已验证' })).not.toBeInTheDocument();
  });
});
