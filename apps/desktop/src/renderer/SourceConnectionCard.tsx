import { useEffect, useRef, useState } from 'react';

import {
  connectMockSource,
  isMockSourceError,
  MOCK_SOURCE_CANDIDATES,
  MockSourceError,
  resolveMockSource,
  type MockConnectedSource,
  type MockSourceOptions,
  type MockSourceResolution,
  type MockSourceSelection,
} from './mock-source';

export type SourceConnector = (
  selection: MockSourceSelection,
  options?: MockSourceOptions,
) => Promise<MockConnectedSource>;

export type SourceResolver = (
  source: MockConnectedSource,
  options?: MockSourceOptions,
) => Promise<MockSourceResolution>;

type SourcePhase = 'idle' | 'selecting' | 'connecting' | 'resolving' | 'success' | 'failure';

type SourceConnectionCardProps = {
  disabled: boolean;
  autoFocusTrigger?: boolean;
  connector?: SourceConnector;
  resolver?: SourceResolver;
  onAnnouncement: (message: string) => void;
  onResolved?: (resolution: MockSourceResolution) => void;
  onPrepareInput?: () => void;
  inputPreparationStarted?: boolean;
};

const UNKNOWN_SOURCE_ERROR = new MockSourceError(
  'SOURCE_UNAVAILABLE',
  '暂时无法检查这个数据来源。权限没有扩大，请稍后重试。',
  true,
);

const CANCELLED_SOURCE_ERROR = new MockSourceError(
  'SOURCE_CONNECTION_CANCELLED',
  '连接检查已取消。FlowPilot 没有保存新的文件访问权限。',
  true,
);

export function SourceConnectionCard({
  disabled,
  autoFocusTrigger = false,
  connector = connectMockSource,
  resolver = resolveMockSource,
  onAnnouncement,
  onResolved,
  onPrepareInput,
  inputPreparationStarted = false,
}: SourceConnectionCardProps) {
  const [phase, setPhase] = useState<SourcePhase>('idle');
  const [selection, setSelection] = useState<MockSourceSelection>('industry-learning-repository');
  const [error, setError] = useState<MockSourceError | null>(null);
  const [resolution, setResolution] = useState<MockSourceResolution | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const chooseScopeButtonRef = useRef<HTMLButtonElement>(null);
  const selectionHeadingRef = useRef<HTMLHeadingElement>(null);
  const loadingHeadingRef = useRef<HTMLHeadingElement>(null);
  const failureHeadingRef = useRef<HTMLHeadingElement>(null);
  const successHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    return () => abortControllerRef.current?.abort();
  }, []);

  useEffect(() => {
    if (autoFocusTrigger) {
      requestAnimationFrame(() => chooseScopeButtonRef.current?.focus());
    }
  }, [autoFocusTrigger]);

  useEffect(() => {
    if (!disabled) {
      return;
    }

    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setPhase('idle');
    setError(null);
    setResolution(null);
  }, [disabled]);

  function openSelection(): void {
    setError(null);
    setPhase('selecting');
    onAnnouncement('请选择要授权的演示范围。');
    requestAnimationFrame(() => selectionHeadingRef.current?.focus());
  }

  function closeSelection(): void {
    setPhase('idle');
    onAnnouncement('范围选择已取消，没有授予文件访问权限。');
    requestAnimationFrame(() => chooseScopeButtonRef.current?.focus());
  }

  async function connect(selectionToConnect: MockSourceSelection): Promise<void> {
    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    setError(null);
    setPhase('connecting');
    onAnnouncement('正在检查只读授权。');
    requestAnimationFrame(() => loadingHeadingRef.current?.focus());

    try {
      const connectedSource = await connector(selectionToConnect, {
        signal: abortController.signal,
      });

      if (abortController.signal.aborted) {
        return;
      }

      setPhase('resolving');
      onAnnouncement('已保存只读授权，正在解析数据来源。');
      const resolvedSource = await resolver(connectedSource, {
        signal: abortController.signal,
      });

      if (abortController.signal.aborted) {
        return;
      }

      setResolution(resolvedSource);
      setPhase('success');
      onResolved?.(resolvedSource);
      onAnnouncement('行业学习仓库已连接并通过范围检查。');
      requestAnimationFrame(() => successHeadingRef.current?.focus());
    } catch (caughtError: unknown) {
      if (abortController.signal.aborted) {
        return;
      }

      setError(isMockSourceError(caughtError) ? caughtError : UNKNOWN_SOURCE_ERROR);
      setPhase('failure');
      onAnnouncement('数据来源仍未连接。请查看原因。');
      requestAnimationFrame(() => failureHeadingRef.current?.focus());
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
    }
  }

  function cancelConnectionCheck(): void {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setError(CANCELLED_SOURCE_ERROR);
    setPhase('failure');
    onAnnouncement('连接检查已取消。数据来源仍未连接。');
    requestAnimationFrame(() => failureHeadingRef.current?.focus());
  }

  if (disabled) {
    return (
      <section className="source-card source-card-disabled" aria-labelledby="source-disabled-title">
        <p className="source-state-label">数据来源 · 暂不可用</p>
        <h3 id="source-disabled-title">先更新理解，再连接数据来源</h3>
        <p>你修改了意图原文。旧理解不会被用来请求新的文件访问权限。</p>
        <button type="button" className="secondary-button" disabled>
          选择范围
        </button>
        <p className="source-disabled-reason">重新分析后，这个操作才会恢复。</p>
      </section>
    );
  }

  if (phase === 'success' && resolution !== null) {
    return (
      <section className="source-card source-card-success" aria-labelledby="source-success-title">
        <p className="source-state-label">数据来源 · 范围检查完成</p>
        <h3 ref={successHeadingRef} id="source-success-title" tabIndex={-1}>
          {resolution.semanticName}已连接
        </h3>
        <dl className="source-summary">
          <div>
            <dt>范围</dt>
            <dd>{resolution.scopeSummary}</dd>
          </div>
          <div>
            <dt>权限</dt>
            <dd>{resolution.permission}</dd>
          </div>
        </dl>
        <p className="source-boundary-note">
          {inputPreparationStarted
            ? '范围检查已通过。本次文章和封面状态显示在下方；尚未开始执行。'
            : '范围检查已通过。准备输入后，FlowPilot 将选择并冻结本次文章和封面；尚未开始执行。'}
        </p>
        {onPrepareInput !== undefined && !inputPreparationStarted ? (
          <div className="source-actions">
            <button type="button" className="primary-button" onClick={onPrepareInput}>
              准备本次输入
            </button>
          </div>
        ) : null}
      </section>
    );
  }

  if (phase === 'selecting') {
    return (
      <section
        className="source-card source-picker"
        aria-labelledby="source-picker-title"
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            closeSelection();
          }
        }}
      >
        <p className="source-state-label">本地演示选择器</p>
        <h3 ref={selectionHeadingRef} id="source-picker-title" tabIndex={-1}>
          选择一个本地范围
        </h3>
        <p>这不会打开真实文件，也不会读取你的电脑。</p>
        <fieldset>
          <legend>可选择的本地范围</legend>
          {MOCK_SOURCE_CANDIDATES.map((candidate) => (
            <label className="source-option" key={candidate.selection}>
              <input
                type="radio"
                name="mock-source-selection"
                value={candidate.selection}
                checked={selection === candidate.selection}
                onChange={() => setSelection(candidate.selection)}
              />
              <span>
                <strong>{candidate.name}</strong>
                <small>{candidate.kind} · 只读</small>
                <small>{candidate.description}</small>
              </span>
            </label>
          ))}
        </fieldset>
        <div className="source-actions">
          <button type="button" className="primary-button" onClick={() => void connect(selection)}>
            授权所选范围
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => void connect('selection-cancelled')}
          >
            取消选择
          </button>
        </div>
      </section>
    );
  }

  if (phase === 'connecting' || phase === 'resolving') {
    return (
      <section className="source-card source-card-loading" aria-labelledby="source-loading-title">
        <p className="source-state-label">数据来源 · 正在检查</p>
        <h3 ref={loadingHeadingRef} id="source-loading-title" tabIndex={-1}>
          <span className="spinner" aria-hidden="true" />
          {phase === 'connecting' ? '正在检查只读授权…' : '正在解析已授权的数据来源…'}
        </h3>
        <p>
          {phase === 'connecting'
            ? '只检查你明确选择的演示范围，不会扩大到其他文件。'
            : '连接成功不等于已经准备本次输入；现在只验证语义名称、能力和范围。'}
        </p>
        <button type="button" className="secondary-button" onClick={cancelConnectionCheck}>
          取消连接检查
        </button>
      </section>
    );
  }

  if (phase === 'failure' && error !== null) {
    return (
      <section className="source-card source-card-failure" aria-labelledby="source-failure-title">
        <p className="source-state-label">数据来源 · 未连接</p>
        <h3 ref={failureHeadingRef} id="source-failure-title" tabIndex={-1}>
          还不能使用行业学习仓库
        </h3>
        <p>{error.message}</p>
        <div className="source-actions">
          {error.retryable ? (
            <button type="button" className="primary-button" onClick={openSelection}>
              重新选择
            </button>
          ) : null}
          <button type="button" className="text-button" onClick={() => setPhase('idle')}>
            返回连接说明
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="source-card" aria-labelledby="source-connection-title">
      <p className="source-state-label">需要连接数据来源</p>
      <h3 id="source-connection-title">连接行业学习仓库</h3>
      <p>
        为了查找今天的新文章和配套封面，FlowPilot 需要访问你明确选择的一个本地文件夹或 Git 仓库。
      </p>
      <dl className="source-request">
        <div>
          <dt>任务能力</dt>
          <dd>读取文章与配套封面</dd>
        </div>
        <div>
          <dt>请求范围</dt>
          <dd>你选择的一个本地文件夹或 Git 仓库</dd>
        </div>
        <div>
          <dt>权限</dt>
          <dd>默认只读，不允许修改文件</dd>
        </div>
      </dl>
      <div className="source-actions">
        <button
          ref={chooseScopeButtonRef}
          type="button"
          className="primary-button"
          onClick={openSelection}
        >
          选择范围
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={() => void connect('permission-declined')}
        >
          暂不授权
        </button>
      </div>
    </section>
  );
}
