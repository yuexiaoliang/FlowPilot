import { useCallback, useEffect, useRef, useState } from 'react';

import {
  isMockInputError,
  MockInputError,
  prepareMockInputBundle,
  type MockInputBundle,
  type PrepareMockInputOptions,
} from './mock-input';
import type { MockSourceResolution } from './mock-source';

export type InputPreparer = (
  source: MockSourceResolution,
  options?: PrepareMockInputOptions,
) => Promise<MockInputBundle>;

type InputPreviewProps = {
  source: MockSourceResolution;
  disabled: boolean;
  runActive: boolean;
  preparer?: InputPreparer;
  onAnnouncement: (message: string) => void;
  onReturnToSource: () => void;
  onStartRun: (bundle: MockInputBundle) => void;
};

type PreviewPhase = 'loading' | 'success' | 'failure';

const UNKNOWN_INPUT_ERROR = new MockInputError(
  'INPUT_PREPARATION_FAILED',
  '暂时无法准备本次输入。已连接的范围没有扩大，你可以重试或返回重新选择。',
  true,
);

const STALE_INPUT_ERROR = new MockInputError(
  'INPUT_BUNDLE_STALE',
  '意图原文已经改变，这份输入仍保持原样，但不能交给后续运行。请重新分析并创建新的输入。',
  true,
);

const CANCELLED_INPUT_ERROR = new MockInputError(
  'INPUT_PREPARATION_CANCELLED',
  '输入准备已取消。没有创建可继续使用的本次输入。',
  true,
);

export function InputPreview({
  source,
  disabled,
  runActive,
  preparer = prepareMockInputBundle,
  onAnnouncement,
  onReturnToSource,
  onStartRun,
}: InputPreviewProps) {
  const [phase, setPhase] = useState<PreviewPhase>('loading');
  const [bundle, setBundle] = useState<MockInputBundle | null>(null);
  const [error, setError] = useState<MockInputError | null>(null);
  const [bodyExpanded, setBodyExpanded] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const operationRef = useRef(0);
  const previousRunActiveRef = useRef(runActive);
  const loadingHeadingRef = useRef<HTMLHeadingElement>(null);
  const successHeadingRef = useRef<HTMLHeadingElement>(null);
  const failureHeadingRef = useRef<HTMLHeadingElement>(null);
  const startRunButtonRef = useRef<HTMLButtonElement>(null);

  const startPreparation = useCallback(async (): Promise<void> => {
    const operation = operationRef.current + 1;
    operationRef.current = operation;
    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setPhase('loading');
    setBundle(null);
    setError(null);
    setBodyExpanded(false);
    onAnnouncement('正在选择、绑定并冻结本次输入。');
    requestAnimationFrame(() => loadingHeadingRef.current?.focus());

    try {
      const preparedBundle = await preparer(source, { signal: abortController.signal });

      if (operation !== operationRef.current || abortController.signal.aborted) {
        return;
      }

      setBundle(preparedBundle);
      setPhase('success');
      onAnnouncement('本次输入已准备并冻结。');
      requestAnimationFrame(() => successHeadingRef.current?.focus());
    } catch (caughtError: unknown) {
      if (operation !== operationRef.current) {
        return;
      }

      setError(isMockInputError(caughtError) ? caughtError : UNKNOWN_INPUT_ERROR);
      setPhase('failure');
      onAnnouncement('还不能准备本次输入。请查看原因。');
      requestAnimationFrame(() => failureHeadingRef.current?.focus());
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
    }
  }, [onAnnouncement, preparer, source]);

  useEffect(() => {
    void startPreparation();

    return () => {
      operationRef.current += 1;
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
    };
  }, [startPreparation]);

  useEffect(() => {
    if (!disabled) {
      return;
    }

    operationRef.current += 1;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setError(STALE_INPUT_ERROR);
    setPhase('failure');
    onAnnouncement('意图已经改变，这份输入已过期。');
    requestAnimationFrame(() => failureHeadingRef.current?.focus());
  }, [disabled, onAnnouncement]);

  useEffect(() => {
    if (previousRunActiveRef.current && !runActive) {
      requestAnimationFrame(() => startRunButtonRef.current?.focus());
    }

    previousRunActiveRef.current = runActive;
  }, [runActive]);

  function cancelPreparation(): void {
    operationRef.current += 1;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setError(CANCELLED_INPUT_ERROR);
    setPhase('failure');
    onAnnouncement('输入准备已取消。');
    requestAnimationFrame(() => failureHeadingRef.current?.focus());
  }

  if (phase === 'loading') {
    return (
      <section
        className="input-preview input-preview-loading"
        aria-labelledby="input-loading-title"
      >
        <p className="preview-state-label">输入预览 · 正在准备</p>
        <h2 ref={loadingHeadingRef} id="input-loading-title" tabIndex={-1}>
          <span className="spinner" aria-hidden="true" />
          正在选择并冻结本次输入…
        </h2>
        <ol className="preparation-steps" aria-label="输入准备步骤">
          <li>从已授权范围选择今天最新的文章</li>
          <li>绑定标题、正文和配套封面</li>
          <li>校验必需输入并创建固定演示快照</li>
        </ol>
        <p className="preview-boundary-note">
          只读取已经授权的 Mock 范围；准备完成前不会开始运行。
        </p>
        <button type="button" className="secondary-button" onClick={cancelPreparation}>
          取消输入准备
        </button>
      </section>
    );
  }

  if (phase === 'failure' && error !== null) {
    const isStale = error.code === 'INPUT_BUNDLE_STALE';

    return (
      <section
        className={`input-preview input-preview-failure${isStale ? ' input-preview-disabled' : ''}`}
        aria-labelledby="input-failure-title"
      >
        <p className="preview-state-label">输入预览 · {isStale ? '已过期' : '未完成'}</p>
        <h2 ref={failureHeadingRef} id="input-failure-title" tabIndex={-1}>
          {isStale ? '这份输入已过期' : '还不能准备本次输入'}
        </h2>
        <p>{error.message}</p>
        <div className="preview-actions">
          {!isStale && error.retryable ? (
            <button
              type="button"
              className="primary-button"
              onClick={() => void startPreparation()}
            >
              重新准备
            </button>
          ) : null}
          <button type="button" className="secondary-button" onClick={onReturnToSource}>
            返回重新选择
          </button>
        </div>
        <p className="preview-boundary-note">
          失败不会扩大 Source 权限，也不会静默换用另一篇文章或创建运行。
        </p>
      </section>
    );
  }

  if (bundle === null) {
    return null;
  }

  return (
    <section className="input-preview input-preview-success" aria-labelledby="input-preview-title">
      <div className="preview-heading">
        <div>
          <p className="preview-state-label">输入预览 · 已冻结</p>
          <h2 ref={successHeadingRef} id="input-preview-title" tabIndex={-1}>
            本次输入已准备
          </h2>
          <p>检查后续运行将使用的确切文章和封面。</p>
        </div>
        <span className="immutable-badge">不可变 Mock</span>
      </div>

      <dl className="preview-provenance">
        <div>
          <dt>数据来源</dt>
          <dd>{bundle.source.semanticName}</dd>
        </div>
        <div>
          <dt>授权范围</dt>
          <dd>{bundle.source.scopeSummary}</dd>
        </div>
        <div>
          <dt>内容版本</dt>
          <dd>{bundle.snapshotSummary}</dd>
        </div>
      </dl>

      <div className="preview-content-grid">
        <article className="article-preview" aria-labelledby="selected-article-title">
          <p className="content-label">本次文章</p>
          <h3 id="selected-article-title">{bundle.selectedArticle.title}</h3>
          <p className="article-summary">{bundle.selectedArticle.summary}</p>
          <button
            type="button"
            className="text-button preview-toggle"
            aria-expanded={bodyExpanded}
            aria-controls="selected-article-body"
            onClick={() => setBodyExpanded((expanded) => !expanded)}
          >
            {bodyExpanded ? '收起正文' : '展开正文'}
          </button>
          {bodyExpanded ? (
            <div id="selected-article-body" className="article-body">
              {bundle.selectedArticle.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          ) : null}
        </article>

        <figure className="cover-preview">
          <div className="cover-preview-art" role="img" aria-label={bundle.cover.alt}>
            <span>意图</span>
            <span>输入</span>
            <span>执行</span>
          </div>
          <figcaption>
            <strong>{bundle.cover.description}</strong>
            <span>{bundle.cover.alt}</span>
          </figcaption>
        </figure>
      </div>

      <section className="binding-summary" aria-labelledby="binding-summary-title">
        <div>
          <p className="content-label">输入绑定</p>
          <h3 id="binding-summary-title">必需字段已齐全</h3>
        </div>
        <ul>
          {bundle.bindings.map((binding) => (
            <li key={binding.label}>
              <span>
                <strong>{binding.label}</strong>
                <small>{binding.sourceSummary} · 必需</small>
              </span>
              <span className="binding-ready">已准备</span>
            </li>
          ))}
        </ul>
      </section>

      <p className="immutable-note">
        进入预览后，这篇文章和封面不会静默刷新。若意图或来源改变，必须重新创建一份输入。
      </p>

      {runActive ? (
        <div className="handoff-notice">
          <strong>这份输入已绑定到当前模拟运行。</strong>
          <span>运行只会使用当前冻结内容；修改意图不会静默替换文章或封面。</span>
        </div>
      ) : null}

      <div className="preview-actions">
        <button
          ref={startRunButtonRef}
          type="button"
          className="primary-button"
          onClick={() => onStartRun(bundle)}
          disabled={runActive}
        >
          {runActive ? '模拟运行已创建' : '继续准备运行'}
        </button>
        {!runActive ? (
          <button type="button" className="secondary-button" onClick={onReturnToSource}>
            返回重新选择
          </button>
        ) : null}
      </div>
    </section>
  );
}
