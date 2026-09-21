import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { App } from './App';
import {
  EXAMPLE_INTENT,
  MockUnderstandingError,
  type MockUnderstanding,
} from './mock-understanding';

const UNDERSTANDING: MockUnderstanding = {
  items: [
    { label: '时间', value: '每天 08:00（你的时区）' },
    { label: '数据', value: '行业学习仓库 → 今天最新文章' },
    { label: '操作', value: '发布微信公众号文章' },
    { label: '没有新内容时', value: '跳过' },
    { label: '发布之前', value: '请求确认' },
  ],
};

describe('Intent to Understanding workspace', () => {
  it('preserves the natural-language source through loading and shows the concise review', async () => {
    const user = userEvent.setup();
    let resolveAnalysis: ((value: MockUnderstanding) => void) | undefined;
    const analyzer = vi.fn(
      () =>
        new Promise<MockUnderstanding>((resolve) => {
          resolveAnalysis = resolve;
        }),
    );

    render(<App analyzer={analyzer} />);

    const editor = screen.getByLabelText('用自然语言描述你的意图');
    expect(editor).toHaveValue(EXAMPLE_INTENT);
    expect(screen.queryByRole('heading', { name: '我的理解' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '分析我的意图' }));

    expect(screen.getByText('正在理解这段意图…')).toBeVisible();
    expect(editor).toHaveValue(EXAMPLE_INTENT);

    await act(async () => resolveAnalysis?.(UNDERSTANDING));

    const understandingHeading = await screen.findByRole('heading', { name: '我的理解' });
    expect(understandingHeading).toBeVisible();
    await waitFor(() => expect(understandingHeading).toHaveFocus());
    expect(screen.getByText('每天 08:00（你的时区）')).toBeVisible();
    expect(screen.getByText('行业学习仓库 → 今天最新文章')).toBeVisible();
    expect(screen.getByText('请求确认')).toBeVisible();
    expect(screen.getByRole('heading', { name: '连接行业学习仓库' })).toBeVisible();
    expect(screen.getByText('默认只读，不允许修改文件')).toBeVisible();
    expect(editor).toHaveValue(EXAMPLE_INTENT);
  });

  it('gives honest empty-input feedback and returns focus to the editor', async () => {
    const user = userEvent.setup();
    const analyzer = vi.fn(async () => UNDERSTANDING);

    render(<App analyzer={analyzer} />);

    const editor = screen.getByLabelText('用自然语言描述你的意图');
    await user.clear(editor);
    await user.click(screen.getByRole('button', { name: '分析我的意图' }));

    expect(screen.getAllByText('先用普通语言写下想达成的结果，然后再分析。')[0]).toBeVisible();
    await waitFor(() => expect(editor).toHaveFocus());
    expect(analyzer).not.toHaveBeenCalled();
  });

  it('keeps failed input editable and offers a deterministic retry', async () => {
    const user = userEvent.setup();
    const analyzer = vi
      .fn()
      .mockRejectedValueOnce(
        new MockUnderstandingError(
          'INTENT_NOT_RECOGNIZED',
          '这个确定性原型目前还不能可靠理解这段内容。',
          true,
        ),
      )
      .mockResolvedValueOnce(UNDERSTANDING);

    render(<App analyzer={analyzer} />);

    await user.click(screen.getByRole('button', { name: '分析我的意图' }));

    expect(await screen.findByRole('heading', { name: '还不能形成可靠理解' })).toBeVisible();
    expect(screen.getAllByText('这个确定性原型目前还不能可靠理解这段内容。')[0]).toBeVisible();
    expect(screen.getByLabelText('用自然语言描述你的意图')).toHaveValue(EXAMPLE_INTENT);

    await user.click(screen.getByRole('button', { name: '重试分析' }));

    expect(await screen.findByRole('heading', { name: '我的理解' })).toBeVisible();
    expect(analyzer).toHaveBeenCalledTimes(2);
  });

  it('cancels analysis without clearing the source text', async () => {
    const user = userEvent.setup();
    const analyzer = vi.fn(
      (_source: string, options?: { signal?: AbortSignal }) =>
        new Promise<MockUnderstanding>((_resolve, reject) => {
          options?.signal?.addEventListener(
            'abort',
            () =>
              reject(
                new MockUnderstandingError(
                  'ANALYSIS_CANCELLED',
                  '分析已取消，意图文本仍然保留。',
                  true,
                ),
              ),
            { once: true },
          );
        }),
    );

    render(<App analyzer={analyzer} />);

    await user.click(screen.getByRole('button', { name: '分析我的意图' }));
    await user.click(screen.getByRole('button', { name: '取消分析' }));

    expect(screen.queryByText('正在理解这段意图…')).not.toBeInTheDocument();
    expect(screen.getByText('分析已取消，意图文本仍然保留。')).toBeVisible();
    expect(screen.getByLabelText('用自然语言描述你的意图')).toHaveValue(EXAMPLE_INTENT);
    await waitFor(() => expect(screen.getByRole('button', { name: '分析我的意图' })).toHaveFocus());
  });

  it('marks the prior review as stale after the source changes', async () => {
    const user = userEvent.setup();
    const analyzer = vi.fn(async () => UNDERSTANDING);

    render(<App analyzer={analyzer} />);

    await user.click(screen.getByRole('button', { name: '分析我的意图' }));
    const understandingHeading = await screen.findByRole('heading', { name: '我的理解' });
    await waitFor(() => expect(understandingHeading).toHaveFocus());
    await user.type(
      screen.getByLabelText('用自然语言描述你的意图'),
      '\n如果电脑没有启动，稍后再运行。',
    );

    expect(screen.getByText('需要更新')).toBeVisible();
    expect(
      screen.getByText('你已修改原文。下面是上一次分析结果，重新分析后才会更新。'),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: '重新分析' })).toBeVisible();
    expect(screen.getByRole('heading', { name: '先更新理解，再连接数据来源' })).toBeVisible();
    expect(screen.getByRole('button', { name: '选择范围' })).toBeDisabled();
  });
});
