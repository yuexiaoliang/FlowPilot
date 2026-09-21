import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { InputPreview, type InputPreparer } from './InputPreview';
import { MockInputError, prepareMockInputBundle, type MockInputBundle } from './mock-input';
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

describe('Input Preview', () => {
  it('moves from preparation to an immutable, readable article and cover preview', async () => {
    const user = userEvent.setup();
    let resolvePreparation: ((bundle: MockInputBundle) => void) | undefined;
    const preparer: InputPreparer = vi.fn(
      () =>
        new Promise<MockInputBundle>((resolve) => {
          resolvePreparation = resolve;
        }),
    );
    const onAnnouncement = vi.fn();
    const onReturnToSource = vi.fn();
    const onStartRun = vi.fn();

    const { rerender } = render(
      <InputPreview
        source={SOURCE}
        disabled={false}
        runActive={false}
        preparer={preparer}
        onAnnouncement={onAnnouncement}
        onReturnToSource={onReturnToSource}
        onStartRun={onStartRun}
      />,
    );

    const loadingHeading = screen.getByRole('heading', {
      name: '正在选择并冻结本次输入…',
    });
    await waitFor(() => expect(loadingHeading).toHaveFocus());

    const bundle = await createBundle();
    await act(async () => resolvePreparation?.(bundle));

    const successHeading = await screen.findByRole('heading', { name: '本次输入已准备' });
    await waitFor(() => expect(successHeading).toHaveFocus());
    expect(screen.getByText(bundle.selectedArticle.title)).toBeVisible();
    expect(screen.getByText('所选的行业学习 Git 仓库')).toBeVisible();
    expect(screen.getByText('演示快照 · 固定内容版本 1')).toBeVisible();
    expect(screen.getByRole('img', { name: bundle.cover.alt })).toBeVisible();
    expect(screen.getAllByText('已准备')).toHaveLength(3);
    expect(document.body).not.toHaveTextContent(/inputBundleId|sourceId|\/Users\/|contentHash/u);

    await user.click(screen.getByRole('button', { name: '展开正文' }));
    expect(screen.getByText(/自动化的起点应该是人真正想得到的结果/u)).toBeVisible();

    await user.click(screen.getByRole('button', { name: '继续准备运行' }));
    expect(onStartRun).toHaveBeenCalledWith(bundle);

    rerender(
      <InputPreview
        source={SOURCE}
        disabled={false}
        runActive
        preparer={preparer}
        onAnnouncement={onAnnouncement}
        onReturnToSource={onReturnToSource}
        onStartRun={onStartRun}
      />,
    );
    expect(screen.getByText(/已绑定到当前模拟运行/u)).toBeVisible();
    expect(screen.getByRole('button', { name: '模拟运行已创建' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: '返回重新选择' })).not.toBeInTheDocument();

    rerender(
      <InputPreview
        source={SOURCE}
        disabled={false}
        runActive={false}
        preparer={preparer}
        onAnnouncement={onAnnouncement}
        onReturnToSource={onReturnToSource}
        onStartRun={onStartRun}
      />,
    );
    await waitFor(() => expect(screen.getByRole('button', { name: '继续准备运行' })).toHaveFocus());
  });

  it('cancels preparation as a typed failure and can retry deterministically', async () => {
    const user = userEvent.setup();
    const bundle = await createBundle();
    const preparer: InputPreparer = vi
      .fn()
      .mockImplementationOnce(() => new Promise<MockInputBundle>(() => undefined))
      .mockResolvedValueOnce(bundle);

    render(
      <InputPreview
        source={SOURCE}
        disabled={false}
        runActive={false}
        preparer={preparer}
        onAnnouncement={vi.fn()}
        onReturnToSource={vi.fn()}
        onStartRun={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: '取消输入准备' }));
    const failureHeading = screen.getByRole('heading', { name: '还不能准备本次输入' });
    expect(screen.getByText(/输入准备已取消/u)).toBeVisible();
    await waitFor(() => expect(failureHeading).toHaveFocus());

    await user.click(screen.getByRole('button', { name: '重新准备' }));
    expect(await screen.findByRole('heading', { name: '本次输入已准备' })).toBeVisible();
    expect(preparer).toHaveBeenCalledTimes(2);
  });

  it('shows a recoverable required-input failure without an empty success preview', async () => {
    const user = userEvent.setup();
    const onReturnToSource = vi.fn();
    const preparer: InputPreparer = vi.fn(async () => {
      throw new MockInputError(
        'REQUIRED_INPUT_MISSING',
        '所选文章缺少必需封面，不能创建本次输入。',
        true,
      );
    });

    render(
      <InputPreview
        source={SOURCE}
        disabled={false}
        runActive={false}
        preparer={preparer}
        onAnnouncement={vi.fn()}
        onReturnToSource={onReturnToSource}
        onStartRun={vi.fn()}
      />,
    );

    expect(await screen.findByText('所选文章缺少必需封面，不能创建本次输入。')).toBeVisible();
    expect(screen.queryByRole('heading', { name: '本次输入已准备' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '返回重新选择' }));
    expect(onReturnToSource).toHaveBeenCalledOnce();
  });

  it('keeps the frozen preview honest when the intent becomes stale', async () => {
    const bundle = await createBundle();
    const preparer: InputPreparer = vi.fn(async () => bundle);
    const { rerender } = render(
      <InputPreview
        source={SOURCE}
        disabled={false}
        runActive={false}
        preparer={preparer}
        onAnnouncement={vi.fn()}
        onReturnToSource={vi.fn()}
        onStartRun={vi.fn()}
      />,
    );

    expect(await screen.findByRole('heading', { name: '本次输入已准备' })).toBeVisible();

    rerender(
      <InputPreview
        source={SOURCE}
        disabled
        runActive={false}
        preparer={preparer}
        onAnnouncement={vi.fn()}
        onReturnToSource={vi.fn()}
        onStartRun={vi.fn()}
      />,
    );

    const staleHeading = await screen.findByRole('heading', { name: '这份输入已过期' });
    expect(screen.getByText(/这份输入仍保持原样/u)).toBeVisible();
    expect(screen.queryByRole('button', { name: '继续准备运行' })).not.toBeInTheDocument();
    await waitFor(() => expect(staleHeading).toHaveFocus());
  });
});
