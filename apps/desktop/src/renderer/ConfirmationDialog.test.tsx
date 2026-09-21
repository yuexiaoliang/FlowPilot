import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ConfirmationDialog, type ConfirmationPreparer } from './ConfirmationDialog';
import { prepareMockConfirmation } from './mock-confirmation';
import { prepareMockInputBundle, type MockInputBundle } from './mock-input';
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

const immediatePreparer: ConfirmationPreparer = (bundle, options) =>
  prepareMockConfirmation(bundle, { ...options, delayMs: 0 });

describe('Confirmation dialog', () => {
  it('shows exact context and records only an explicit confirmation', async () => {
    const user = userEvent.setup();
    const bundle = await createBundle();
    const onDecision = vi.fn();

    render(
      <ConfirmationDialog
        bundle={bundle}
        preparer={immediatePreparer}
        onAnnouncement={vi.fn()}
        onClose={vi.fn()}
        onDecision={onDecision}
      />,
    );

    const heading = await screen.findByRole('heading', { name: '确认发布这篇文章？' });
    await waitFor(() => expect(heading).toHaveFocus());
    expect(screen.getByText(bundle.selectedArticle.title)).toBeVisible();
    expect(screen.getByText(bundle.snapshotSummary)).toBeVisible();
    expect(screen.getByText(/本原型只记录你的决定/u)).toBeVisible();

    await user.click(screen.getByRole('button', { name: '确认发布' }));

    expect(onDecision).toHaveBeenCalledOnce();
    expect(onDecision.mock.calls[0]?.[0]).toMatchObject({ kind: 'CONFIRMED' });
    expect(onDecision.mock.calls[0]?.[0].bundle).toBe(bundle);
  });

  it('treats Escape and backdrop dismissal as no decision', async () => {
    const user = userEvent.setup();
    const bundle = await createBundle();
    const onClose = vi.fn();
    const onDecision = vi.fn();
    const { unmount } = render(
      <ConfirmationDialog
        bundle={bundle}
        preparer={immediatePreparer}
        onAnnouncement={vi.fn()}
        onClose={onClose}
        onDecision={onDecision}
      />,
    );

    const escapeHeading = await screen.findByRole('heading', { name: '确认发布这篇文章？' });
    await waitFor(() => expect(escapeHeading).toHaveFocus());
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
    expect(onDecision).not.toHaveBeenCalled();

    unmount();
    onClose.mockClear();
    render(
      <ConfirmationDialog
        bundle={bundle}
        preparer={immediatePreparer}
        onAnnouncement={vi.fn()}
        onClose={onClose}
        onDecision={onDecision}
      />,
    );
    await screen.findByRole('heading', { name: '确认发布这篇文章？' });
    fireEvent.mouseDown(screen.getByRole('dialog').parentElement!);
    expect(onClose).toHaveBeenCalledOnce();
    expect(onDecision).not.toHaveBeenCalled();
  });

  it('keeps keyboard focus inside the dialog', async () => {
    const user = userEvent.setup();
    const bundle = await createBundle();

    render(
      <ConfirmationDialog
        bundle={bundle}
        preparer={immediatePreparer}
        onAnnouncement={vi.fn()}
        onClose={vi.fn()}
        onDecision={vi.fn()}
      />,
    );

    const heading = await screen.findByRole('heading', { name: '确认发布这篇文章？' });
    await waitFor(() => expect(heading).toHaveFocus());
    const closeButton = screen.getByRole('button', { name: '关闭发布确认' });
    const confirmButton = screen.getByRole('button', { name: '确认发布' });
    closeButton.focus();
    await user.keyboard('{Shift>}{Tab}{/Shift}');
    expect(confirmButton).toHaveFocus();
    await user.tab();
    expect(closeButton).toHaveFocus();
  });

  it('shows a typed failure and never enables a decision for invalid context', async () => {
    const bundle = await createBundle();
    const mutableBundle = { ...bundle } as MockInputBundle;
    const onDecision = vi.fn();

    render(
      <ConfirmationDialog
        bundle={mutableBundle}
        preparer={immediatePreparer}
        onAnnouncement={vi.fn()}
        onClose={vi.fn()}
        onDecision={onDecision}
      />,
    );

    const failureHeading = await screen.findByRole('heading', {
      name: '还不能确认本次发布',
    });
    await waitFor(() => expect(failureHeading).toHaveFocus());
    expect(screen.getByText(/不能可靠复核/u)).toBeVisible();
    expect(screen.queryByRole('button', { name: '确认发布' })).not.toBeInTheDocument();
    expect(onDecision).not.toHaveBeenCalled();
  });
});
