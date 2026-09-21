import { useEffect, useRef, useState } from 'react';

import {
  analyzeIntent,
  EXAMPLE_INTENT,
  isMockUnderstandingError,
  MockUnderstandingError,
  type AnalyzeIntentOptions,
  type MockUnderstanding,
} from './mock-understanding';
import { ExecutionPanel } from './ExecutionPanel';
import { InputPreview } from './InputPreview';
import type { MockInputBundle } from './mock-input';
import { SourceConnectionCard } from './SourceConnectionCard';
import type { MockSourceResolution } from './mock-source';

type Analyzer = (source: string, options?: AnalyzeIntentOptions) => Promise<MockUnderstanding>;

type AnalysisStatus = 'idle' | 'loading' | 'success' | 'failure';

type AnalysisResult = {
  source: string;
  understanding: MockUnderstanding;
};

type AppProps = {
  analyzer?: Analyzer;
};

const EMPTY_INTENT_ERROR = new MockUnderstandingError(
  'EMPTY_INTENT',
  '先用普通语言写下想达成的结果，然后再分析。',
  true,
);

export function App({ analyzer = analyzeIntent }: AppProps) {
  const [intent, setIntent] = useState(EXAMPLE_INTENT);
  const [status, setStatus] = useState<AnalysisStatus>('idle');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [sourceResolution, setSourceResolution] = useState<MockSourceResolution | null>(null);
  const [inputPreparationRequested, setInputPreparationRequested] = useState(false);
  const [activeBundle, setActiveBundle] = useState<MockInputBundle | null>(null);
  const [sourceConnectionVersion, setSourceConnectionVersion] = useState(0);
  const [restoreSourceFocus, setRestoreSourceFocus] = useState(false);
  const [error, setError] = useState<MockUnderstandingError | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState(
    '意图编辑器已就绪。当前填入一段可修改的示例任务。',
  );

  const abortControllerRef = useRef<AbortController | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const understandingHeadingRef = useRef<HTMLHeadingElement>(null);
  const failureHeadingRef = useRef<HTMLHeadingElement>(null);
  const analyzeButtonRef = useRef<HTMLButtonElement>(null);

  const isResultStale = result !== null && result.source !== intent;

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  async function runAnalysis(): Promise<void> {
    if (intent.trim().length === 0) {
      setStatus('failure');
      setError(EMPTY_INTENT_ERROR);
      setNotice(null);
      setAnnouncement('需要先输入意图。');
      requestAnimationFrame(() => editorRef.current?.focus());
      return;
    }

    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    const submittedSource = intent;
    abortControllerRef.current = abortController;
    setStatus('loading');
    setError(null);
    setNotice(null);
    setAnnouncement('正在分析这段意图。');

    try {
      const understanding = await analyzer(submittedSource, {
        signal: abortController.signal,
      });

      if (abortController.signal.aborted) {
        return;
      }

      setResult({ source: submittedSource, understanding });
      setSourceResolution(null);
      setInputPreparationRequested(false);
      setActiveBundle(null);
      setSourceConnectionVersion((version) => version + 1);
      setRestoreSourceFocus(false);
      setStatus('success');
      setNotice(null);
      setAnnouncement('理解已更新。');

      if (editorRef.current?.value === submittedSource) {
        requestAnimationFrame(() => understandingHeadingRef.current?.focus());
      }
    } catch (caughtError: unknown) {
      if (isMockUnderstandingError(caughtError) && caughtError.code === 'ANALYSIS_CANCELLED') {
        setStatus(result === null ? 'idle' : 'success');
        setNotice('分析已取消，意图文本仍然保留。');
        setAnnouncement('分析已取消。');
        requestAnimationFrame(() => analyzeButtonRef.current?.focus());
        return;
      }

      const displayError = isMockUnderstandingError(caughtError)
        ? caughtError
        : new MockUnderstandingError(
            'INTENT_NOT_RECOGNIZED',
            '暂时无法完成理解。请稍后重试；你的意图文本仍然保留。',
            true,
          );
      setStatus('failure');
      setError(displayError);
      setNotice(null);
      setAnnouncement('无法形成可靠理解。请查看错误说明。');
      requestAnimationFrame(() => failureHeadingRef.current?.focus());
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
    }
  }

  function cancelAnalysis(): void {
    abortControllerRef.current?.abort();
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <a className="wordmark" href="#workspace" aria-label="FlowPilot 意图主页">
          <span className="wordmark-mark" aria-hidden="true">
            F
          </span>
          <span>FlowPilot</span>
        </a>
        <p className="prototype-label">交互原型 · 本地演示</p>
      </header>

      <main id="workspace" className="workspace">
        <section className="intro" aria-labelledby="page-title">
          <p className="eyebrow">从结果开始</p>
          <h1 id="page-title">你希望 FlowPilot 做什么？</h1>
          <p className="intro-copy">
            用自然语言写下目标和规则。FlowPilot 会先复述自己的理解，不会在这一步连接数据或开始执行。
          </p>
        </section>

        <div className={`workspace-grid${result === null ? ' workspace-grid-single' : ''}`}>
          <section className="editor-card" aria-labelledby="editor-title">
            <div className="section-heading">
              <div>
                <p className="section-kicker">意图</p>
                <h2 id="editor-title">描述目标和规则</h2>
              </div>
              <span className="draft-status">未保存的意图</span>
            </div>

            <label className="editor-label" htmlFor="intent-editor">
              用自然语言描述你的意图
            </label>
            <textarea
              ref={editorRef}
              id="intent-editor"
              value={intent}
              onChange={(event) => {
                setIntent(event.target.value);
              }}
              aria-describedby={
                error?.code === 'EMPTY_INTENT' ? 'analysis-error-message' : 'editor-help'
              }
              aria-invalid={error?.code === 'EMPTY_INTENT'}
              spellCheck="false"
            />
            <p id="editor-help" className="editor-help">
              支持普通文本和 Markdown。多行回车只会换行，不会提交。
            </p>

            <div className="editor-actions">
              <button
                ref={analyzeButtonRef}
                type="button"
                className="primary-button"
                onClick={() => void runAnalysis()}
                disabled={status === 'loading'}
                aria-describedby={status === 'loading' ? 'analysis-progress' : undefined}
              >
                {result === null || !isResultStale ? '分析我的意图' : '重新分析'}
              </button>
              <p className="privacy-note">仅在本机使用固定示例，不连接真实 AI 或网络服务。</p>
            </div>

            {status === 'loading' ? (
              <div id="analysis-progress" className="status-panel status-panel-loading">
                <div>
                  <p className="status-title">
                    <span className="spinner" aria-hidden="true" />
                    正在理解这段意图…
                  </p>
                  <p>你的文本保持可编辑；取消不会丢失任何内容。</p>
                </div>
                <button type="button" className="secondary-button" onClick={cancelAnalysis}>
                  取消分析
                </button>
              </div>
            ) : null}

            {status === 'idle' && notice !== null ? (
              <div className="status-panel status-panel-notice">
                <p className="status-title">
                  <span className="status-check" aria-hidden="true">
                    ·
                  </span>
                  {notice}
                </p>
              </div>
            ) : null}

            {status === 'failure' && error !== null ? (
              <div className="status-panel status-panel-error" id="analysis-error-message">
                <div>
                  <p className="status-symbol" aria-hidden="true">
                    !
                  </p>
                  <div>
                    <h3 ref={failureHeadingRef} tabIndex={-1}>
                      还不能形成可靠理解
                    </h3>
                    <p>{error.message}</p>
                  </div>
                </div>
                {error.code !== 'EMPTY_INTENT' && error.retryable ? (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => void runAnalysis()}
                  >
                    重试分析
                  </button>
                ) : null}
              </div>
            ) : null}
          </section>

          {result !== null ? (
            <section className="understanding-card" aria-labelledby="understanding-title">
              <div className="section-heading understanding-heading">
                <div>
                  <p className="section-kicker">理解审阅</p>
                  <h2 ref={understandingHeadingRef} id="understanding-title" tabIndex={-1}>
                    我的理解
                  </h2>
                </div>
                <span
                  className={isResultStale ? 'review-status review-status-stale' : 'review-status'}
                >
                  {isResultStale ? '需要更新' : '已形成理解'}
                </span>
              </div>

              {isResultStale ? (
                <p className="stale-notice">
                  你已修改原文。下面是上一次分析结果，重新分析后才会更新。
                </p>
              ) : null}

              <dl className="understanding-list">
                {result.understanding.items.map((item) => (
                  <div className="understanding-row" key={item.label}>
                    <dt>{item.label}</dt>
                    <dd>
                      <span>{item.value}</span>
                      {item.label === '数据' ? (
                        <SourceConnectionCard
                          key={sourceConnectionVersion}
                          disabled={isResultStale}
                          autoFocusTrigger={restoreSourceFocus}
                          onAnnouncement={setAnnouncement}
                          onResolved={(resolution) => {
                            setSourceResolution(resolution);
                            setInputPreparationRequested(false);
                          }}
                          onPrepareInput={() => setInputPreparationRequested(true)}
                          inputPreparationStarted={inputPreparationRequested}
                        />
                      ) : null}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="review-footer">
                <p>
                  {sourceResolution !== null && !isResultStale
                    ? inputPreparationRequested
                      ? '理解已形成，数据来源已获得只读授权；本次输入状态显示在下方。'
                      : '理解已形成，数据来源已获得只读授权；可以开始准备本次输入。'
                    : '这一步只确认 FlowPilot 对意图的理解，还没有授权数据来源、准备输入或开始执行。'}
                </p>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => editorRef.current?.focus()}
                >
                  调整意图
                </button>
              </div>
            </section>
          ) : null}
        </div>

        {sourceResolution !== null && inputPreparationRequested ? (
          <InputPreview
            source={sourceResolution}
            disabled={isResultStale && activeBundle === null}
            runActive={activeBundle !== null}
            onAnnouncement={setAnnouncement}
            onStartRun={setActiveBundle}
            onReturnToSource={() => {
              setSourceResolution(null);
              setInputPreparationRequested(false);
              setActiveBundle(null);
              setSourceConnectionVersion((version) => version + 1);
              setRestoreSourceFocus(true);
              setAnnouncement('已返回数据来源选择。本次输入没有进入运行。');
            }}
          />
        ) : null}

        {activeBundle !== null ? (
          <ExecutionPanel
            bundle={activeBundle}
            onAnnouncement={setAnnouncement}
            onReturnToInput={() => {
              setActiveBundle(null);
              setAnnouncement('已返回输入预览。冻结内容保持不变，没有发布任何内容。');
            }}
          />
        ) : null}

        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {announcement}
        </p>
      </main>
    </div>
  );
}
