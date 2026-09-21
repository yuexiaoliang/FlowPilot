import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from 'react';

import {
  isMockInspectorError,
  loadMockInspectorProvenance,
  MockInspectorError,
  type LoadMockInspectorOptions,
  type MockInspectorProvenance,
} from './mock-inspector';
import type { MockTerminalResult } from './mock-result';

export type InspectorLoader = (
  result: MockTerminalResult,
  options?: LoadMockInspectorOptions,
) => Promise<MockInspectorProvenance>;

type InspectorPanelProps = {
  result: MockTerminalResult;
  loader?: InspectorLoader;
  onAnnouncement: (message: string) => void;
  onClose: () => void;
};

type InspectorPhase = 'loading' | 'success' | 'failure';
type InspectorSection = 'outcome' | 'plans' | 'source' | 'timeline';

const UNKNOWN_INSPECTOR_ERROR = new MockInspectorError(
  'MOCK_PROVENANCE_UNAVAILABLE',
  '暂时无法加载本次 Mock provenance。结果和冻结输入没有改变。',
  true,
);

export function InspectorPanel({
  result,
  loader = loadMockInspectorProvenance,
  onAnnouncement,
  onClose,
}: InspectorPanelProps) {
  const [phase, setPhase] = useState<InspectorPhase>('loading');
  const [provenance, setProvenance] = useState<MockInspectorProvenance | null>(null);
  const [error, setError] = useState<MockInspectorError | null>(null);
  const [expandedSections, setExpandedSections] = useState<ReadonlySet<InspectorSection>>(
    () => new Set<InspectorSection>(['outcome']),
  );

  const abortControllerRef = useRef<AbortController | null>(null);
  const operationRef = useRef(0);
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const closeInspector = useCallback((): void => {
    operationRef.current += 1;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    onClose();
  }, [onClose]);

  const startLoading = useCallback(async (): Promise<void> => {
    const operation = operationRef.current + 1;
    operationRef.current = operation;
    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setPhase('loading');
    setProvenance(null);
    setError(null);
    onAnnouncement('正在加载本次模拟运行的检查详情。');

    try {
      const loadedProvenance = await loader(result, { signal: abortController.signal });

      if (operation !== operationRef.current || abortController.signal.aborted) {
        return;
      }

      setProvenance(loadedProvenance);
      setPhase('success');
      onAnnouncement('检查详情已加载，当前显示结果事实。');
    } catch (caughtError: unknown) {
      if (operation !== operationRef.current) {
        return;
      }

      setError(isMockInspectorError(caughtError) ? caughtError : UNKNOWN_INSPECTOR_ERROR);
      setPhase('failure');
      onAnnouncement('还不能加载检查详情。结果和冻结输入没有改变。');
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
    }
  }, [loader, onAnnouncement, result]);

  useEffect(() => {
    void startLoading();

    return () => {
      operationRef.current += 1;
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
    };
  }, [startLoading]);

  useEffect(() => {
    function handleDocumentKeyDown(event: globalThis.KeyboardEvent): void {
      if (event.defaultPrevented) {
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        closeInspector();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const focusable = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          '[data-inspector-focusable]:not(:disabled)',
        ) ?? [],
      );
      const first = focusable[0];
      const last = focusable.at(-1);
      const activeElement = document.activeElement;

      if (focusable.length === 0) {
        event.preventDefault();
        headingRef.current?.focus();
      } else if (!panelRef.current?.contains(activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first)?.focus();
      } else if (event.shiftKey && activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }

    document.addEventListener('keydown', handleDocumentKeyDown);
    return () => document.removeEventListener('keydown', handleDocumentKeyDown);
  }, [closeInspector]);

  function toggleSection(section: InspectorSection): void {
    setExpandedSections((current) => {
      const next = new Set(current);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  }

  function handleBackdropClick(event: MouseEvent<HTMLDivElement>): void {
    if (event.target === overlayRef.current) {
      closeInspector();
    }
  }

  function sectionButton(section: InspectorSection, label: string) {
    const expanded = expandedSections.has(section);
    return (
      <button
        type="button"
        className="inspector-section-trigger"
        aria-expanded={expanded}
        aria-controls={`inspector-section-${section}`}
        data-inspector-focusable
        onClick={() => toggleSection(section)}
      >
        <span>{label}</span>
        <span aria-hidden="true">{expanded ? '−' : '+'}</span>
      </button>
    );
  }

  const succeeded = result.status === 'SUCCEEDED';

  return (
    <div
      ref={overlayRef}
      className="inspector-overlay"
      onMouseDown={handleBackdropClick}
    >
      <aside
        ref={panelRef}
        className={`inspector-panel inspector-panel-${phase}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="inspector-title"
        aria-describedby="inspector-anchor"
      >
        <div className="inspector-heading">
          <div>
            <p className="inspector-kicker">检查详情 · Mock provenance</p>
            <h2 ref={headingRef} id="inspector-title" tabIndex={-1}>
              {phase === 'loading'
                ? '正在加载本次运行详情'
                : phase === 'failure'
                  ? '还不能加载检查详情'
                  : '本次模拟运行的检查详情'}
            </h2>
          </div>
          <button
            type="button"
            className="inspector-close"
            aria-label="关闭检查详情"
            data-inspector-focusable
            onClick={closeInspector}
          >
            ×
          </button>
        </div>

        <p id="inspector-anchor" className="inspector-anchor">
          锚定“{result.articleTitle}”的{result.status === 'SUCCEEDED' ? '已验证' : '已取消'}结果和原冻结输入。
        </p>

        {phase === 'loading' ? (
          <div className="inspector-loading-state">
            <span className="spinner" aria-hidden="true" />
            <span>正在整理已脱敏的计划、来源、输入和运行事实…</span>
          </div>
        ) : null}

        {phase === 'failure' && error !== null ? (
          <div className="inspector-failure-state">
            <p>{error.message}</p>
            <div className="inspector-actions">
              {error.retryable ? (
                <button
                  type="button"
                  className="primary-button"
                  data-inspector-focusable
                  onClick={() => void startLoading()}
                >
                  重新加载详情
                </button>
              ) : null}
              <button
                type="button"
                className="secondary-button"
                data-inspector-focusable
                onClick={closeInspector}
              >
                返回结果
              </button>
            </div>
          </div>
        ) : null}

        {phase === 'success' && provenance !== null ? (
          <div className="inspector-sections">
            <section>
              {sectionButton('outcome', '结果与验证')}
              {expandedSections.has('outcome') ? (
                <dl id="inspector-section-outcome" className="inspector-facts">
                  <div>
                    <dt>终态</dt>
                    <dd>{provenance.outcome.status}</dd>
                  </div>
                  <div>
                    <dt>Confirmation decision</dt>
                    <dd>{provenance.outcome.confirmationDecision}</dd>
                  </div>
                  <div>
                    <dt>Mock action</dt>
                    <dd>{provenance.outcome.mockAction}</dd>
                  </div>
                  <div className={!succeeded ? 'inspector-fact-disabled' : undefined}>
                    <dt>Postcondition</dt>
                    <dd>{provenance.outcome.postcondition}</dd>
                  </div>
                </dl>
              ) : null}
            </section>

            <section>
              {sectionButton('plans', '计划与 Flow 版本')}
              {expandedSections.has('plans') ? (
                <dl id="inspector-section-plans" className="inspector-facts">
                  <div>
                    <dt>TaskPlan</dt>
                    <dd>{provenance.plans.taskPlan}</dd>
                  </div>
                  <div>
                    <dt>GoalPlan</dt>
                    <dd>{provenance.plans.goalPlan}</dd>
                  </div>
                  <div>
                    <dt>Flow revision</dt>
                    <dd>{provenance.plans.flowRevision}</dd>
                  </div>
                </dl>
              ) : null}
            </section>

            <section>
              {sectionButton('source', 'Source 与 InputBundle')}
              {expandedSections.has('source') ? (
                <dl id="inspector-section-source" className="inspector-facts">
                  <div>
                    <dt>Source version</dt>
                    <dd>{provenance.source.version}</dd>
                  </div>
                  <div>
                    <dt>Source</dt>
                    <dd>{provenance.source.semanticName}</dd>
                  </div>
                  <div>
                    <dt>授权范围</dt>
                    <dd>{provenance.source.scopeSummary} · {provenance.source.permission}</dd>
                  </div>
                  <div>
                    <dt>InputBundle</dt>
                    <dd>{provenance.input.snapshotSummary} · 不可变</dd>
                  </div>
                  <div>
                    <dt>本次文章</dt>
                    <dd>{provenance.input.articleTitle}</dd>
                  </div>
                </dl>
              ) : null}
            </section>

            <section>
              {sectionButton('timeline', 'Run timeline')}
              {expandedSections.has('timeline') ? (
                <ol id="inspector-section-timeline" className="inspector-timeline">
                  {provenance.timeline.map((entry) => (
                    <li key={entry.label} className={`timeline-${entry.state}`}>
                      <span aria-hidden="true">{entry.state === 'completed' ? '✓' : '−'}</span>
                      <div>
                        <strong>{entry.label}</strong>
                        <p>{entry.detail}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : null}
            </section>
          </div>
        ) : null}

        <p className="inspector-boundary-note">
          这里只展示确定性、已脱敏的 Mock 事实；受保护数据和低层运行细节不会在此显示。
        </p>
      </aside>
    </div>
  );
}
