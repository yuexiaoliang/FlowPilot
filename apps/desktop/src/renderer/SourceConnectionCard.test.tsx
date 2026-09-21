import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  SourceConnectionCard,
  type SourceConnector,
  type SourceResolver,
} from './SourceConnectionCard';
import {
  connectMockSource,
  type MockConnectedSource,
  type MockSourceResolution,
} from './mock-source';

const CONNECTED_SOURCE: MockConnectedSource = {
  semanticName: '行业学习仓库',
  kind: '本地 Git 仓库',
  permission: '只读',
  scopeSummary: '所选的行业学习 Git 仓库',
  capabilities: ['读取文章', '读取配套封面'],
};

const RESOLUTION: MockSourceResolution = {
  semanticName: '行业学习仓库',
  permission: '只读',
  scopeSummary: '所选的行业学习 Git 仓库',
  inputBundleCreated: false,
};

describe('contextual Source connection', () => {
  it('shows the reason, scoped request and read-only boundary only while Source is missing', () => {
    render(<SourceConnectionCard disabled={false} onAnnouncement={vi.fn()} />);

    expect(screen.getByRole('heading', { name: '连接行业学习仓库' })).toBeVisible();
    expect(screen.getByText('读取文章与配套封面')).toBeVisible();
    expect(screen.getByText('你选择的一个本地文件夹或 Git 仓库')).toBeVisible();
    expect(screen.getByText('默认只读，不允许修改文件')).toBeVisible();
    expect(document.body).not.toHaveTextContent(/src_|@source|\/Users\/|InputBundle ID/u);
  });

  it('moves through explicit selection, authorization, resolution and a bounded success summary', async () => {
    const user = userEvent.setup();
    let resolveConnection: ((source: MockConnectedSource) => void) | undefined;
    let resolveResolution: ((resolution: MockSourceResolution) => void) | undefined;
    const connector: SourceConnector = vi.fn(
      () =>
        new Promise<MockConnectedSource>((resolve) => {
          resolveConnection = resolve;
        }),
    );
    const resolver: SourceResolver = vi.fn(
      () =>
        new Promise<MockSourceResolution>((resolve) => {
          resolveResolution = resolve;
        }),
    );
    const onAnnouncement = vi.fn();
    const onResolved = vi.fn();
    const onPrepareInput = vi.fn();

    render(
      <SourceConnectionCard
        disabled={false}
        connector={connector}
        resolver={resolver}
        onAnnouncement={onAnnouncement}
        onResolved={onResolved}
        onPrepareInput={onPrepareInput}
      />,
    );

    await user.click(screen.getByRole('button', { name: '选择范围' }));
    const pickerHeading = screen.getByRole('heading', { name: '选择一个本地范围' });
    await waitFor(() => expect(pickerHeading).toHaveFocus());
    expect(screen.getByRole('radio', { name: /行业学习仓库/u })).toBeChecked();

    await user.click(screen.getByRole('button', { name: '授权所选范围' }));
    const loadingHeading = screen.getByRole('heading', { name: /正在检查只读授权/u });
    await waitFor(() => expect(loadingHeading).toHaveFocus());

    await act(async () => resolveConnection?.(CONNECTED_SOURCE));
    expect(screen.getByRole('heading', { name: /正在解析已授权的数据来源/u })).toBeVisible();

    await act(async () => resolveResolution?.(RESOLUTION));
    const successHeading = screen.getByRole('heading', { name: '行业学习仓库已连接' });
    await waitFor(() => expect(successHeading).toHaveFocus());
    expect(screen.getByText('所选的行业学习 Git 仓库')).toBeVisible();
    expect(screen.getByText('只读')).toBeVisible();
    expect(
      screen.getByText(
        '范围检查已通过。准备输入后，FlowPilot 将选择并冻结本次文章和封面；尚未开始执行。',
      ),
    ).toBeVisible();
    expect(screen.queryByRole('button', { name: '选择范围' })).not.toBeInTheDocument();
    expect(onAnnouncement).toHaveBeenLastCalledWith('行业学习仓库已连接并通过范围检查。');
    expect(onResolved).toHaveBeenCalledWith(RESOLUTION);

    await user.click(screen.getByRole('button', { name: '准备本次输入' }));
    expect(onPrepareInput).toHaveBeenCalledOnce();
  });

  it('closes the uncommitted range picker with Escape and restores trigger focus', async () => {
    const user = userEvent.setup();
    const onAnnouncement = vi.fn();

    render(<SourceConnectionCard disabled={false} onAnnouncement={onAnnouncement} />);

    await user.click(screen.getByRole('button', { name: '选择范围' }));
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: '选择一个本地范围' })).toHaveFocus(),
    );
    await user.keyboard('{Escape}');

    expect(screen.getByRole('heading', { name: '连接行业学习仓库' })).toBeVisible();
    await waitFor(() => expect(screen.getByRole('button', { name: '选择范围' })).toHaveFocus());
    expect(onAnnouncement).toHaveBeenLastCalledWith('范围选择已取消，没有授予文件访问权限。');
  });

  it('keeps a cancelled selection unresolved and offers recovery', async () => {
    const user = userEvent.setup();
    const connector: SourceConnector = (selection, options) =>
      connectMockSource(selection, { ...options, delayMs: 0 });

    render(
      <SourceConnectionCard
        disabled={false}
        connector={connector}
        onAnnouncement={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: '选择范围' }));
    await user.click(screen.getByRole('button', { name: '取消选择' }));

    const failureHeading = await screen.findByRole('heading', {
      name: '还不能使用行业学习仓库',
    });
    expect(screen.getByText(/没有获得任何文件访问权限/u)).toBeVisible();
    expect(screen.getByRole('button', { name: '重新选择' })).toBeVisible();
    await waitFor(() => expect(failureHeading).toHaveFocus());
  });

  it('allows an in-progress authorization check to be cancelled', async () => {
    const user = userEvent.setup();
    const connector: SourceConnector = vi.fn(
      (_selection, options) =>
        new Promise<MockConnectedSource>((_resolve, reject) => {
          options?.signal?.addEventListener(
            'abort',
            () => reject(new DOMException('Cancelled', 'AbortError')),
            { once: true },
          );
        }),
    );

    render(
      <SourceConnectionCard
        disabled={false}
        connector={connector}
        onAnnouncement={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: '选择范围' }));
    await user.click(screen.getByRole('button', { name: '授权所选范围' }));
    await user.click(screen.getByRole('button', { name: '取消连接检查' }));

    const failureHeading = screen.getByRole('heading', {
      name: '还不能使用行业学习仓库',
    });
    expect(screen.getByText(/没有保存新的文件访问权限/u)).toBeVisible();
    await waitFor(() => expect(failureHeading).toHaveFocus());
  });

  it('rejects an incompatible scope without widening permission', async () => {
    const user = userEvent.setup();
    const connector: SourceConnector = (selection, options) =>
      connectMockSource(selection, { ...options, delayMs: 0 });

    render(
      <SourceConnectionCard
        disabled={false}
        connector={connector}
        onAnnouncement={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: '选择范围' }));
    await user.click(screen.getByRole('radio', { name: /下载文件夹/u }));
    await user.click(screen.getByRole('button', { name: '授权所选范围' }));

    expect(await screen.findByText(/权限没有扩大，请重新选择/u)).toBeVisible();
    expect(screen.queryByText('行业学习仓库已连接')).not.toBeInTheDocument();
  });

  it('records an explicit refusal without treating it as a connection', async () => {
    const user = userEvent.setup();
    const connector: SourceConnector = (selection, options) =>
      connectMockSource(selection, { ...options, delayMs: 0 });

    render(
      <SourceConnectionCard
        disabled={false}
        connector={connector}
        onAnnouncement={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: '暂不授权' }));

    expect(await screen.findByText(/不能继续准备输入/u)).toBeVisible();
    expect(screen.getByRole('button', { name: '重新选择' })).toBeVisible();
  });

  it('disables authorization when the understanding is stale', () => {
    render(<SourceConnectionCard disabled onAnnouncement={vi.fn()} />);

    expect(screen.getByRole('heading', { name: '先更新理解，再连接数据来源' })).toBeVisible();
    expect(screen.getByRole('button', { name: '选择范围' })).toBeDisabled();
    expect(screen.getByText('重新分析后，这个操作才会恢复。')).toBeVisible();
  });
});
