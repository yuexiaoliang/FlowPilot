import { useCallback, useEffect, useRef, useState } from 'react';

import { ConfirmationDialog } from './ConfirmationDialog';
import type { MockConfirmationDecision } from './mock-confirmation';
import {
  isMockExecutionError,
  MOCK_EXECUTION_MILESTONES,
  MockExecutionError,
  runMockExecution,
  type MockExecutionMilestone,
  type MockExecutionPause,
  type RunMockExecutionOptions,
} from './mock-execution';
import type { MockInputBundle } from './mock-input';
import {
  createMockCancelledResult,
  isMockResultError,
  MockResultError,
  runMockActionAndVerify,
  type MockResultMilestone,
  type MockTerminalResult,
  type RunMockResultOptions,
} from './mock-result';
import { ResultPanel } from './ResultPanel';

export type ExecutionRunner = (
  bundle: MockInputBundle,
  options?: RunMockExecutionOptions,
) => Promise<MockExecutionPause>;

export type ResultRunner = (
  decision: MockConfirmationDecision,
  options?: RunMockResultOptions,
) => Promise<MockTerminalResult>;

type ExecutionPanelProps = {
  bundle: MockInputBundle;
  runner?: ExecutionRunner;
  resultRunner?: ResultRunner;
  onAnnouncement: (message: string) => void;
  onReturnToInput: () => void;
};

type ExecutionPhase =
  'loading' | 'paused' | 'failure' | 'result-loading' | 'result-failure' | 'result';

const UNKNOWN_EXECUTION_ERROR = new MockExecutionError(
  'EXECUTION_PREPARATION_FAILED',
  '暂时无法准备本次运行。没有执行或发布任何内容，你可以重试或返回输入预览。',
  true,
);

const CANCELLED_EXECUTION_ERROR = new MockExecutionError(
  'EXECUTION_PREPARATION_CANCELLED',
  '运行准备已停止。没有打开确认界面，也没有执行或发布任何内容。',
  true,
);

const UNKNOWN_RESULT_ERROR = new MockResultError(
  'MOCK_ACTION_FAILED',
  '暂时无法完成本地 Mock 动作或结果验证。没有真实发布，也没有生成成功结果。',
  true,
);

export function ExecutionPanel({
  bundle,
  runner = runMockExecution,
  resultRunner = runMockActionAndVerify,
  onAnnouncement,
  onReturnToInput,
}: ExecutionPanelProps) {
  const [phase, setPhase] = useState<ExecutionPhase>('loading');
  const [currentMilestone, setCurrentMilestone] = useState<MockExecutionMilestone | null>(null);
  const [pause, setPause] = useState<MockExecutionPause | null>(null);
  const [error, setError] = useState<MockExecutionError | null>(null);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [decision, setDecision] = useState<MockConfirmationDecision | null>(null);
  const [currentResultMilestone, setCurrentResultMilestone] = useState<MockResultMilestone | null>(
    null,
  );
  const [result, setResult] = useState<MockTerminalResult | null>(null);
  const [resultError, setResultError] = useState<MockResultError | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const operationRef = useRef(0);
  const loadingHeadingRef = useRef<HTMLHeadingElement>(null);
  const pausedHeadingRef = useRef<HTMLHeadingElement>(null);
  const failureHeadingRef = useRef<HTMLHeadingElement>(null);
  const resultLoadingHeadingRef = useRef<HTMLHeadingElement>(null);
  const resultFailureHeadingRef = useRef<HTMLHeadingElement>(null);
  const confirmationTriggerRef = useRef<HTMLButtonElement>(null);

  const startExecution = useCallback(async (): Promise<void> => {
    const operation = operationRef.current + 1;
    operationRef.current = operation;
    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setPhase('loading');
    setCurrentMilestone(MOCK_EXECUTION_MILESTONES[0] ?? null);
    setPause(null);
    setError(null);
    setConfirmationOpen(false);
    setDecision(null);
    setCurrentResultMilestone(null);
    setResult(null);
    setResultError(null);
    onAnnouncement('正在准备本次模拟运行。');
    requestAnimationFrame(() => loadingHeadingRef.current?.focus());

    try {
      const result = await runner(bundle, {
        signal: abortController.signal,
        onMilestone: (milestone) => {
          if (operation !== operationRef.current || abortController.signal.aborted) {
            return;
          }

          setCurrentMilestone(milestone);
          onAnnouncement(milestone.label);
        },
      });

      if (operation !== operationRef.current || abortController.signal.aborted) {
        return;
      }

      setPause(result);
      setPhase('paused');
      onAnnouncement('模拟运行已在发布前暂停，等待你的确认。');
      requestAnimationFrame(() => pausedHeadingRef.current?.focus());
    } catch (caughtError: unknown) {
      if (operation !== operationRef.current) {
        return;
      }

      setError(isMockExecutionError(caughtError) ? caughtError : UNKNOWN_EXECUTION_ERROR);
      setPhase('failure');
      onAnnouncement('还不能准备本次运行。请查看原因。');
      requestAnimationFrame(() => failureHeadingRef.current?.focus());
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
    }
  }, [bundle, onAnnouncement, runner]);

  useEffect(() => {
    void startExecution();

    return () => {
      operationRef.current += 1;
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
    };
  }, [startExecution]);

  function cancelExecution(): void {
    operationRef.current += 1;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setError(CANCELLED_EXECUTION_ERROR);
    setPhase('failure');
    onAnnouncement('运行准备已停止。');
    requestAnimationFrame(() => failureHeadingRef.current?.focus());
  }

  const startResult = useCallback(
    async (confirmedDecision: MockConfirmationDecision): Promise<void> => {
      const operation = operationRef.current + 1;
      operationRef.current = operation;
      abortControllerRef.current?.abort();
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setPhase('result-loading');
      setCurrentResultMilestone(null);
      setResult(null);
      setResultError(null);
      onAnnouncement('正在执行已确认的本地 Mock 动作。');
      requestAnimationFrame(() => resultLoadingHeadingRef.current?.focus());

      try {
        const terminalResult = await resultRunner(confirmedDecision, {
          signal: abortController.signal,
          onMilestone: (milestone) => {
            if (operation !== operationRef.current || abortController.signal.aborted) {
              return;
            }

            setCurrentResultMilestone(milestone);
            onAnnouncement(milestone.label);
            requestAnimationFrame(() => resultLoadingHeadingRef.current?.focus());
          },
        });

        if (operation !== operationRef.current || abortController.signal.aborted) {
          return;
        }

        setResult(terminalResult);
        setPhase('result');
        onAnnouncement('本地 Mock 后置条件已验证。没有执行真实平台发布。');
      } catch (caughtError: unknown) {
        if (operation !== operationRef.current) {
          return;
        }

        setResultError(isMockResultError(caughtError) ? caughtError : UNKNOWN_RESULT_ERROR);
        setPhase('result-failure');
        onAnnouncement('还不能验证模拟结果。没有生成成功结果。');
        requestAnimationFrame(() => resultFailureHeadingRef.current?.focus());
      } finally {
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null;
        }
      }
    },
    [onAnnouncement, resultRunner],
  );

  function cancelResultVerification(): void {
    abortControllerRef.current?.abort();
  }

  function closeConfirmation(): void {
    setConfirmationOpen(false);
    onAnnouncement('发布确认已关闭。运行仍在等待你的决定。');
    requestAnimationFrame(() => confirmationTriggerRef.current?.focus());
  }

  function recordDecision(recordedDecision: MockConfirmationDecision): void {
    setDecision(recordedDecision);
    setConfirmationOpen(false);

    if (recordedDecision.kind === 'CONFIRMED') {
      void startResult(recordedDecision);
    } else {
      setResult(createMockCancelledResult(recordedDecision));
      setPhase('result');
      onAnnouncement('你已取消本次发布。没有执行或发布任何内容。');
    }
  }

  function milestoneStatus(milestone: MockExecutionMilestone): 'completed' | 'current' | 'pending' {
    if (phase === 'paused') {
      return 'completed';
    }

    const currentIndex = MOCK_EXECUTION_MILESTONES.findIndex(
      (candidate) => candidate.id === currentMilestone?.id,
    );
    const milestoneIndex = MOCK_EXECUTION_MILESTONES.findIndex(
      (candidate) => candidate.id === milestone.id,
    );

    if (milestoneIndex < currentIndex) {
      return 'completed';
    }

    return milestoneIndex === currentIndex ? 'current' : 'pending';
  }

  if (phase === 'failure' && error !== null) {
    return (
      <section
        className="execution-panel execution-failure"
        aria-labelledby="execution-failure-title"
      >
        <p className="execution-state-label">模拟运行 · 未开始</p>
        <h2 ref={failureHeadingRef} id="execution-failure-title" tabIndex={-1}>
          还不能准备本次运行
        </h2>
        <p>{error.message}</p>
        <div className="execution-actions">
          {error.retryable ? (
            <button type="button" className="primary-button" onClick={() => void startExecution()}>
              重新准备运行
            </button>
          ) : null}
          <button type="button" className="secondary-button" onClick={onReturnToInput}>
            返回输入预览
          </button>
        </div>
        <p className="execution-boundary-note">
          这次停止没有更换已冻结的输入，也没有访问真实平台或产生发布结果。
        </p>
      </section>
    );
  }

  if (phase === 'result-loading' && decision?.kind === 'CONFIRMED') {
    return (
      <section
        className="execution-panel execution-result-loading"
        aria-labelledby="result-loading-title"
      >
        <p className="execution-state-label">模拟运行 · 动作后验证</p>
        <h2 ref={resultLoadingHeadingRef} id="result-loading-title" tabIndex={-1}>
          {currentResultMilestone?.label ?? '正在准备本地 Mock 动作'}
        </h2>
        <p className="result-loading-description">
          {currentResultMilestone?.description ??
            '确认决定已经记录；只有固定后置条件通过后才会显示成功结果。'}
        </p>
        <dl className="execution-summary">
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
        <div className="result-verification-note">
          <strong>尚未验证成功</strong>
          <span>本流程只执行确定性本地 Mock，不连接微信、浏览器或网络。</span>
        </div>
        <div className="execution-actions">
          <button type="button" className="secondary-button" onClick={cancelResultVerification}>
            停止模拟验证
          </button>
        </div>
      </section>
    );
  }

  if (phase === 'result-failure' && resultError !== null && decision?.kind === 'CONFIRMED') {
    return (
      <section className="execution-panel execution-failure" aria-labelledby="result-failure-title">
        <p className="execution-state-label">模拟运行 · 结果未验证</p>
        <h2 ref={resultFailureHeadingRef} id="result-failure-title" tabIndex={-1}>
          还不能验证模拟结果
        </h2>
        <p>{resultError.message}</p>
        <div className="execution-actions">
          {resultError.retryable ? (
            <button
              type="button"
              className="primary-button"
              onClick={() => void startResult(decision)}
            >
              重新验证模拟结果
            </button>
          ) : null}
          <button type="button" className="secondary-button" onClick={onReturnToInput}>
            返回输入预览
          </button>
        </div>
        <p className="execution-boundary-note">
          未通过后置条件就不会生成 SUCCEEDED；原冻结输入保持不变。
        </p>
      </section>
    );
  }

  if (phase === 'result' && result !== null) {
    return (
      <ResultPanel
        result={result}
        onAnnouncement={onAnnouncement}
        onReturnToInput={onReturnToInput}
      />
    );
  }

  const isPaused = phase === 'paused' && pause !== null;
  const isConfirmed = decision?.kind === 'CONFIRMED';
  const isCancelled = decision?.kind === 'CANCELLED';
  const pausedHeading = isCancelled
    ? '本次发布已取消'
    : isConfirmed
      ? '发布决定已记录'
      : '等待你的确认';
  const pausedDescription = isCancelled
    ? '你明确选择了取消发布；没有执行任何平台动作。'
    : isConfirmed
      ? '你已明确确认发布；本原型尚未执行动作或验证结果。'
      : 'FlowPilot 已在不可逆发布动作前暂停。';

  return (
    <section
      className={`execution-panel${isPaused ? ' execution-paused' : ' execution-loading'}${
        isCancelled ? ' execution-cancelled' : isConfirmed ? ' execution-confirmed' : ''
      }`}
      aria-labelledby={isPaused ? 'execution-paused-title' : 'execution-loading-title'}
    >
      <div className="execution-heading">
        <div>
          <p className="execution-state-label">
            模拟运行 ·{' '}
            {isCancelled
              ? '发布已取消'
              : isConfirmed
                ? '确认决定已记录'
                : isPaused
                  ? '等待发布确认'
                  : '正在准备'}
          </p>
          {isPaused ? (
            <h2 ref={pausedHeadingRef} id="execution-paused-title" tabIndex={-1}>
              {pausedHeading}
            </h2>
          ) : (
            <h2 ref={loadingHeadingRef} id="execution-loading-title" tabIndex={-1}>
              {currentMilestone?.label ?? '正在准备本次运行'}
            </h2>
          )}
          <p>
            {isPaused
              ? pausedDescription
              : (currentMilestone?.description ?? '正在建立本次会话的临时 Mock 运行。')}
          </p>
        </div>
        <span className={isPaused ? 'execution-badge execution-badge-paused' : 'execution-badge'}>
          {isCancelled ? '已取消' : isConfirmed ? '已确认' : isPaused ? '已暂停' : '确定性 Mock'}
        </span>
      </div>

      <dl className="execution-summary">
        <div>
          <dt>目标</dt>
          <dd>微信公众号文章</dd>
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

      <ol className="execution-milestones" aria-label="模拟运行里程碑">
        {MOCK_EXECUTION_MILESTONES.map((milestone) => {
          const status = milestoneStatus(milestone);
          return (
            <li className={`milestone milestone-${status}`} key={milestone.id}>
              <span className="milestone-marker" aria-hidden="true">
                {status === 'completed' ? '✓' : status === 'current' ? '•' : ''}
              </span>
              <span>
                <strong>{milestone.label.replace('正在', '')}</strong>
                <small>
                  {status === 'completed' ? '已完成' : status === 'current' ? '进行中' : '等待'}
                </small>
              </span>
            </li>
          );
        })}
        <li className={`milestone milestone-${isPaused ? 'current' : 'pending'}`}>
          <span className="milestone-marker" aria-hidden="true">
            {isPaused ? '•' : ''}
          </span>
          <span>
            <strong>等待发布确认</strong>
            <small>
              {isCancelled ? '已取消' : isConfirmed ? '已确认' : isPaused ? '已暂停' : '等待'}
            </small>
          </span>
        </li>
      </ol>

      {isPaused ? (
        <div className="confirmation-boundary">
          <div>
            <strong>
              {isCancelled
                ? '发布已取消，没有执行任何动作。'
                : isConfirmed
                  ? '确认决定已记录，尚未发布。'
                  : '尚未确认，也没有发布。'}
            </strong>
            <span id="confirmation-boundary-reason">
              {isCancelled
                ? '取消只终止本次 Mock 发布边界，不代表平台已经处理任何内容。'
                : isConfirmed
                  ? '确认事件不等于动作成功；后续仍需执行动作并验证结果。'
                  : '打开发布确认后，可以明确取消或确认；关闭确认不会记录任何决定。'}
            </span>
          </div>
          {decision === null ? (
            <button
              ref={confirmationTriggerRef}
              type="button"
              className="primary-button"
              aria-haspopup="dialog"
              aria-describedby="confirmation-boundary-reason"
              onClick={() => setConfirmationOpen(true)}
            >
              查看发布确认
            </button>
          ) : (
            <div className="execution-decision-actions">
              {isConfirmed ? (
                <button
                  type="button"
                  className="secondary-button"
                  aria-describedby="confirmation-boundary-reason"
                  disabled
                >
                  等待后续模拟动作
                </button>
              ) : null}
              <button type="button" className="secondary-button" onClick={onReturnToInput}>
                返回输入预览
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="execution-actions">
          <button type="button" className="secondary-button" onClick={cancelExecution}>
            停止运行准备
          </button>
        </div>
      )}

      {confirmationOpen && decision === null ? (
        <ConfirmationDialog
          bundle={bundle}
          onAnnouncement={onAnnouncement}
          onClose={closeConfirmation}
          onDecision={recordDecision}
        />
      ) : null}
    </section>
  );
}
