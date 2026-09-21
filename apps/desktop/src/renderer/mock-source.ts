export type MockSourceSelection =
  | 'industry-learning-repository'
  | 'downloads-folder'
  | 'selection-cancelled'
  | 'permission-declined';

export type MockSourceCandidate = {
  selection: Exclude<MockSourceSelection, 'selection-cancelled' | 'permission-declined'>;
  name: string;
  kind: string;
  description: string;
};

export const MOCK_SOURCE_CANDIDATES: readonly MockSourceCandidate[] = [
  {
    selection: 'industry-learning-repository',
    name: '行业学习仓库',
    kind: '本地 Git 仓库',
    description: '包含行业文章与配套封面，授权范围仅限这个仓库。',
  },
  {
    selection: 'downloads-folder',
    name: '下载文件夹',
    kind: '本地文件夹',
    description: '不包含当前意图需要的行业学习内容。',
  },
] as const;

export type MockConnectedSource = {
  semanticName: '行业学习仓库';
  kind: '本地 Git 仓库';
  permission: '只读';
  scopeSummary: '所选的行业学习 Git 仓库';
  capabilities: readonly ['读取文章', '读取配套封面'];
};

export type MockSourceResolution = {
  semanticName: '行业学习仓库';
  permission: '只读';
  scopeSummary: '所选的行业学习 Git 仓库';
  inputBundleCreated: false;
};

export type MockSourceErrorCode =
  | 'SOURCE_SELECTION_CANCELLED'
  | 'SOURCE_PERMISSION_DECLINED'
  | 'SOURCE_SCOPE_MISMATCH'
  | 'SOURCE_CONNECTION_CANCELLED'
  | 'SOURCE_UNAVAILABLE';

export class MockSourceError extends Error {
  readonly code: MockSourceErrorCode;
  readonly retryable: boolean;

  constructor(code: MockSourceErrorCode, message: string, retryable: boolean) {
    super(message);
    this.name = 'MockSourceError';
    this.code = code;
    this.retryable = retryable;
  }
}

export type MockSourceOptions = {
  signal?: AbortSignal;
  delayMs?: number;
};

function cancellationError(): MockSourceError {
  return new MockSourceError(
    'SOURCE_CONNECTION_CANCELLED',
    '连接检查已取消。数据来源仍未授权。',
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

export async function connectMockSource(
  selection: MockSourceSelection,
  options: MockSourceOptions = {},
): Promise<MockConnectedSource> {
  await waitForMockDelay(options.delayMs ?? 360, options.signal);

  if (selection === 'selection-cancelled') {
    throw new MockSourceError(
      'SOURCE_SELECTION_CANCELLED',
      '你取消了范围选择。FlowPilot 没有获得任何文件访问权限。',
      true,
    );
  }

  if (selection === 'permission-declined') {
    throw new MockSourceError(
      'SOURCE_PERMISSION_DECLINED',
      '你选择了暂不授权。FlowPilot 会保留当前理解，但不能继续准备输入。',
      true,
    );
  }

  if (selection === 'downloads-folder') {
    throw new MockSourceError(
      'SOURCE_SCOPE_MISMATCH',
      '所选文件夹不包含当前意图需要的行业学习内容。权限没有扩大，请重新选择。',
      true,
    );
  }

  return {
    semanticName: '行业学习仓库',
    kind: '本地 Git 仓库',
    permission: '只读',
    scopeSummary: '所选的行业学习 Git 仓库',
    capabilities: ['读取文章', '读取配套封面'],
  };
}

export async function resolveMockSource(
  source: MockConnectedSource,
  options: MockSourceOptions = {},
): Promise<MockSourceResolution> {
  await waitForMockDelay(options.delayMs ?? 520, options.signal);

  if (source.semanticName !== '行业学习仓库' || source.permission !== '只读') {
    throw new MockSourceError(
      'SOURCE_UNAVAILABLE',
      '已授权的数据来源与当前意图不兼容。请重新选择一个只读范围。',
      true,
    );
  }

  return {
    semanticName: source.semanticName,
    permission: source.permission,
    scopeSummary: source.scopeSummary,
    inputBundleCreated: false,
  };
}

export function isMockSourceError(error: unknown): error is MockSourceError {
  return error instanceof MockSourceError;
}
