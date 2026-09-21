import { useEffect, useRef, useState } from 'react';

import { InspectorPanel } from './InspectorPanel';
import type { MockTerminalResult } from './mock-result';

type ResultPanelProps = {
  result: MockTerminalResult;
  onAnnouncement: (message: string) => void;
  onReturnToInput: () => void;
};

export function ResultPanel({ result, onAnnouncement, onReturnToInput }: ResultPanelProps) {
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const inspectorTriggerRef = useRef<HTMLButtonElement>(null);
  const isSucceeded = result.status === 'SUCCEEDED';

  useEffect(() => {
    requestAnimationFrame(() => headingRef.current?.focus());
  }, []);

  function closeInspector(): void {
    setInspectorOpen(false);
    requestAnimationFrame(() => inspectorTriggerRef.current?.focus());
  }

  return (
    <section
      className={`result-panel ${isSucceeded ? 'result-panel-success' : 'result-panel-cancelled'}`}
      aria-labelledby="result-title"
    >
      <div className="result-heading">
        <div>
          <p className="result-state-label">模拟结果 · {isSucceeded ? '已验证' : '已取消'}</p>
          <h2 ref={headingRef} id="result-title" tabIndex={-1}>
            {isSucceeded ? '模拟发布已验证' : '本次发布已取消'}
          </h2>
          <p>
            {isSucceeded
              ? '固定的本地 Mock 后置条件已经通过。未连接微信，也没有执行真实发布。'
              : '你明确取消了本次发布。没有执行动作，也不会自动重试。'}
          </p>
        </div>
        <span className={`result-badge ${isSucceeded ? 'result-badge-success' : ''}`}>
          {isSucceeded ? '已验证' : '已取消'}
        </span>
      </div>

      <dl className="result-summary">
        <div>
          <dt>目的地</dt>
          <dd>{result.targetSummary}</dd>
        </div>
        <div>
          <dt>本次文章</dt>
          <dd>{result.articleTitle}</dd>
        </div>
        <div>
          <dt>固定输入</dt>
          <dd>{result.snapshotSummary}</dd>
        </div>
      </dl>

      <div className={`result-impact ${isSucceeded ? 'result-impact-success' : ''}`}>
        <strong>{isSucceeded ? '本地验证通过' : '未发布'}</strong>
        <span>
          {isSucceeded
            ? '这里只证明确定性 Mock 达到了固定模拟目标；不代表真实平台上已有文章。'
            : '取消结果保留原冻结输入，但不会推进任何成功状态或消费记录。'}
        </span>
      </div>

      <div className="result-actions">
        <div>
          <button
            ref={inspectorTriggerRef}
            type="button"
            className="primary-button"
            aria-haspopup="dialog"
            onClick={() => setInspectorOpen(true)}
          >
            检查详情
          </button>
          <span>按需查看本次结果绑定的计划、来源、输入和运行时间线。</span>
        </div>
        <button type="button" className="secondary-button" onClick={onReturnToInput}>
          返回输入预览
        </button>
      </div>

      {inspectorOpen ? (
        <InspectorPanel
          result={result}
          onAnnouncement={onAnnouncement}
          onClose={closeInspector}
        />
      ) : null}
    </section>
  );
}
