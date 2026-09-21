import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from 'react';

import {
  isMockConfirmationError,
  MockConfirmationError,
  prepareMockConfirmation,
  recordMockConfirmationDecision,
  type MockConfirmationContext,
  type MockConfirmationDecision,
  type PrepareMockConfirmationOptions,
} from './mock-confirmation';
import type { MockInputBundle } from './mock-input';

export type ConfirmationPreparer = (
  bundle: MockInputBundle,
  options?: PrepareMockConfirmationOptions,
) => Promise<MockConfirmationContext>;

type ConfirmationDialogProps = {
  bundle: MockInputBundle;
  preparer?: ConfirmationPreparer;
  onAnnouncement: (message: string) => void;
  onClose: () => void;
  onDecision: (decision: MockConfirmationDecision) => void;
};

type ConfirmationPhase = 'loading' | 'idle' | 'failure';

const UNKNOWN_CONFIRMATION_ERROR = new MockConfirmationError(
  'CONFIRMATION_PREPARATION_FAILED',
  '暂时无法复核本次发布确认。没有记录决定，也没有执行发布。',
  true,
);

export function ConfirmationDialog({
  bundle,
  preparer = prepareMockConfirmation,
  onAnnouncement,
  onClose,
  onDecision,
}: ConfirmationDialogProps) {
  const [phase, setPhase] = useState<ConfirmationPhase>('loading');
  const [context, setContext] = useState<MockConfirmationContext | null>(null);
  const [error, setError] = useState<MockConfirmationError | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const operationRef = useRef(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const startReview = useCallback(async (): Promise<void> => {
    const operation = operationRef.current + 1;
    operationRef.current = operation;
    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setPhase('loading');
    setContext(null);
    setError(null);
    onAnnouncement('正在复核本次发布确认。');
    requestAnimationFrame(() => headingRef.current?.focus());

    try {
      const preparedContext = await preparer(bundle, { signal: abortController.signal });

      if (operation !== operationRef.current || abortController.signal.aborted) {
        return;
      }

      setContext(preparedContext);
      setPhase('idle');
      onAnnouncement('发布确认已准备，等待你的明确决定。');
    } catch (caughtError: unknown) {
      if (operation !== operationRef.current) {
        return;
      }

      const displayError = isMockConfirmationError(caughtError)
        ? caughtError
        : UNKNOWN_CONFIRMATION_ERROR;
      setError(displayError);
      setPhase('failure');
      onAnnouncement('还不能确认本次发布。没有记录任何决定。');
      requestAnimationFrame(() => headingRef.current?.focus());
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
    }
  }, [bundle, onAnnouncement, preparer]);

  useEffect(() => {
    void startReview();

    return () => {
      operationRef.current += 1;
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
    };
  }, [startReview]);

  function closeWithoutDecision(): void {
    operationRef.current += 1;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    onClose();
  }

  function handleDecision(kind: MockConfirmationDecision['kind']): void {
    if (context === null || phase !== 'idle') {
      return;
    }

    try {
      onDecision(recordMockConfirmationDecision(context, kind));
    } catch (caughtError: unknown) {
      setError(isMockConfirmationError(caughtError) ? caughtError : UNKNOWN_CONFIRMATION_ERROR);
      setPhase('failure');
      onAnnouncement('确认上下文已失效。没有记录决定，也没有执行发布。');
      requestAnimationFrame(() => headingRef.current?.focus());
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeWithoutDecision();
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        '[data-confirmation-focusable]:not(:disabled)',
      ) ?? [],
    );

    if (focusable.length === 0) {
      event.preventDefault();
      headingRef.current?.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable.at(-1);

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  function handleBackdropClick(event: MouseEvent<HTMLDivElement>): void {
    if (event.target === event.currentTarget) {
      closeWithoutDecision();
    }
  }

  const isReady = phase === 'idle' && context !== null;

  return (
    <div
      className="confirmation-overlay"
      onMouseDown={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <div
        ref={dialogRef}
        className={`confirmation-dialog confirmation-dialog-${phase}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-title"
        aria-describedby="confirmation-description confirmation-status"
      >
        <div className="confirmation-dialog-heading">
          <div>
            <p className="confirmation-kicker">发布确认 · 不可逆动作前</p>
            <h2 ref={headingRef} id="confirmation-title" tabIndex={-1}>
              {phase === 'loading'
                ? '正在复核发布决定'
                : phase === 'failure'
                  ? '还不能确认本次发布'
                  : '确认发布这篇文章？'}
            </h2>
          </div>
          <button
            type="button"
            className="confirmation-close"
            aria-label="关闭发布确认"
            data-confirmation-focusable
            onClick={closeWithoutDecision}
          >
            ×
          </button>
        </div>

        <p id="confirmation-description" className="confirmation-description">
          只有明确选择“确认发布”才会记录确认决定。关闭或按 Escape 不会确认、取消或执行任何动作。
        </p>

        <dl className="confirmation-summary">
          <div>
            <dt>动作</dt>
            <dd>发布微信公众号文章</dd>
          </div>
          <div>
            <dt>目的地</dt>
            <dd>微信公众号</dd>
          </div>
          <div>
            <dt>本次文章</dt>
            <dd>{bundle.selectedArticle.title}</dd>
          </div>
          <div>
            <dt>固定输入</dt>
            <dd>{bundle.snapshotSummary}</dd>
          </div>
        </dl>

        <div className="confirmation-impact">
          <strong>不可逆影响</strong>
          <span>
            真实发布会让订阅者看到这篇文章；本原型只记录你的决定，不会连接微信或执行发布。
          </span>
        </div>

        <p id="confirmation-status" className={`confirmation-status confirmation-status-${phase}`}>
          {phase === 'loading'
            ? '正在复核固定输入、目的地和确认策略，决定操作暂时不可用。'
            : phase === 'failure'
              ? error?.message
              : '复核完成。当前文章和目的地仍与暂停运行一致。'}
        </p>

        {phase === 'failure' ? (
          <div className="confirmation-actions">
            {error?.retryable === true ? (
              <button
                type="button"
                className="primary-button"
                data-confirmation-focusable
                onClick={() => void startReview()}
              >
                重新复核
              </button>
            ) : null}
            <button
              type="button"
              className="secondary-button"
              data-confirmation-focusable
              onClick={closeWithoutDecision}
            >
              关闭并返回
            </button>
          </div>
        ) : (
          <div className="confirmation-actions">
            <button
              type="button"
              className="secondary-button"
              aria-describedby="confirmation-status"
              data-confirmation-focusable
              disabled={!isReady}
              onClick={() => handleDecision('CANCELLED')}
            >
              取消发布
            </button>
            <button
              type="button"
              className="confirmation-primary-action"
              aria-describedby="confirmation-status"
              data-confirmation-focusable
              disabled={!isReady}
              onClick={() => handleDecision('CONFIRMED')}
            >
              确认发布
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
