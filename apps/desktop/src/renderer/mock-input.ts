import type { MockSourceResolution } from './mock-source';

export type MockInputErrorCode =
  | 'INPUT_PREPARATION_CANCELLED'
  | 'SOURCE_NOT_READY'
  | 'REQUIRED_INPUT_MISSING'
  | 'INPUT_BUNDLE_STALE'
  | 'INPUT_PREPARATION_FAILED';

export class MockInputError extends Error {
  readonly code: MockInputErrorCode;
  readonly retryable: boolean;

  constructor(code: MockInputErrorCode, message: string, retryable: boolean) {
    super(message);
    this.name = 'MockInputError';
    this.code = code;
    this.retryable = retryable;
  }
}

export type MockInputBinding = Readonly<{
  label: '标题' | '正文' | '封面';
  required: true;
  sourceSummary: string;
}>;

export type MockInputBundle = Readonly<{
  source: Readonly<{
    semanticName: '行业学习仓库';
    scopeSummary: '所选的行业学习 Git 仓库';
    permission: '只读';
  }>;
  snapshotSummary: '演示快照 · 固定内容版本 1';
  selectedArticle: Readonly<{
    title: '让自动化真正可维护：从意图到确定性执行';
    summary: string;
    body: readonly string[];
  }>;
  cover: Readonly<{
    alt: string;
    description: string;
  }>;
  bindings: readonly MockInputBinding[];
  immutable: true;
}>;

export type PrepareMockInputOptions = {
  signal?: AbortSignal;
  delayMs?: number;
};

function cancellationError(): MockInputError {
  return new MockInputError(
    'INPUT_PREPARATION_CANCELLED',
    '输入准备已取消。没有创建可继续使用的本次输入。',
    true,
  );
}

function waitForMockDelay(delayMs: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted === true) {
      reject(cancellationError());
      return;
    }

    const timeoutId = setTimeout(() => {
      signal?.removeEventListener('abort', handleAbort);
      resolve();
    }, delayMs);

    function handleAbort(): void {
      clearTimeout(timeoutId);
      reject(cancellationError());
    }

    signal?.addEventListener('abort', handleAbort, { once: true });
  });
}

function freezeBundle(bundle: {
  source: MockInputBundle['source'];
  snapshotSummary: MockInputBundle['snapshotSummary'];
  selectedArticle: {
    title: MockInputBundle['selectedArticle']['title'];
    summary: string;
    body: string[];
  };
  cover: MockInputBundle['cover'];
  bindings: MockInputBinding[];
  immutable: true;
}): MockInputBundle {
  Object.freeze(bundle.source);
  Object.freeze(bundle.selectedArticle.body);
  Object.freeze(bundle.selectedArticle);
  Object.freeze(bundle.cover);
  bundle.bindings.forEach((binding) => Object.freeze(binding));
  Object.freeze(bundle.bindings);
  return Object.freeze(bundle);
}

export async function prepareMockInputBundle(
  source: MockSourceResolution,
  options: PrepareMockInputOptions = {},
): Promise<MockInputBundle> {
  await waitForMockDelay(options.delayMs ?? 1200, options.signal);

  if (
    source.semanticName !== '行业学习仓库' ||
    source.permission !== '只读' ||
    source.scopeSummary !== '所选的行业学习 Git 仓库'
  ) {
    throw new MockInputError(
      'SOURCE_NOT_READY',
      '已连接的数据来源不满足本次输入要求。请返回并重新选择只读范围。',
      true,
    );
  }

  return freezeBundle({
    source: {
      semanticName: source.semanticName,
      scopeSummary: source.scopeSummary,
      permission: source.permission,
    },
    snapshotSummary: '演示快照 · 固定内容版本 1',
    selectedArticle: {
      title: '让自动化真正可维护：从意图到确定性执行',
      summary: '一篇介绍如何把自然语言意图、不可变输入与确定性执行边界分开的行业学习文章。',
      body: [
        '自动化的起点应该是人真正想得到的结果，而不是一组脆弱的页面步骤。',
        '当数据来源完成授权后，系统先选择、绑定并冻结本次输入，再把同一份内容交给后续运行。这样重试和检查都不会悄悄换用新数据。',
        '确定性路径负责重复执行；只有出现理解、发现或局部修复需求时，才需要 AI 参与。',
      ],
    },
    cover: {
      alt: '蓝色路径穿过浅色网格，连接“意图”“输入”和“执行”三个节点',
      description: '文章配套封面 · 横版插图',
    },
    bindings: [
      { label: '标题', required: true, sourceSummary: '所选文章标题' },
      { label: '正文', required: true, sourceSummary: '所选文章正文' },
      { label: '封面', required: true, sourceSummary: '文章配套封面' },
    ],
    immutable: true,
  });
}

export function isMockInputError(error: unknown): error is MockInputError {
  return error instanceof MockInputError;
}
