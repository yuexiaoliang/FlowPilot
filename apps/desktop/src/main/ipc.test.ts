// @vitest-environment node

import { SHELL_PROTOCOL_VERSION, shellInfoResultSchema } from '@flowpilot/ipc-contracts';
import type { IpcMainInvokeEvent } from 'electron';
import { describe, expect, it, vi } from 'vitest';

import { createShellInfoHandler } from './ipc';

const TRUSTED_EVENT = Object.freeze({ sender: Object.freeze({ id: 1 }) }) as IpcMainInvokeEvent;
const UNTRUSTED_EVENT = Object.freeze({ sender: Object.freeze({ id: 2 }) }) as IpcMainInvokeEvent;

function createHandler(getAppVersion: () => string = () => '0.0.0') {
  return createShellInfoHandler({
    getAppVersion,
    isTrustedSender: (event) => event === TRUSTED_EVENT,
    platform: 'test-platform',
  });
}

describe('typed shell IPC', () => {
  it('returns schema-validated shell information to the trusted Renderer', async () => {
    const result = await createHandler()(TRUSTED_EVENT, {
      protocolVersion: SHELL_PROTOCOL_VERSION,
    });

    expect(shellInfoResultSchema.parse(result)).toEqual({
      ok: true,
      value: {
        protocolVersion: 1,
        appVersion: '0.0.0',
        platform: 'test-platform',
      },
    });
  });

  it('rejects unknown, extra, and outdated request data without invoking the service', async () => {
    const getAppVersion = vi.fn(() => '0.0.0');
    const handler = createHandler(getAppVersion);

    for (const payload of [
      undefined,
      null,
      {},
      { protocolVersion: 0 },
      { protocolVersion: 1, extra: true },
    ]) {
      await expect(handler(TRUSTED_EVENT, payload)).resolves.toEqual({
        ok: false,
        error: {
          code: 'INVALID_IPC_PAYLOAD',
          message: 'Shell 信息请求格式无效。',
          retryable: false,
        },
      });
    }

    expect(getAppVersion).not.toHaveBeenCalled();
  });

  it('rejects an untrusted sender before handling its payload', async () => {
    await expect(
      createHandler()(UNTRUSTED_EVENT, { protocolVersion: SHELL_PROTOCOL_VERSION }),
    ).resolves.toEqual({
      ok: false,
      error: {
        code: 'IPC_SENDER_NOT_TRUSTED',
        message: '该请求不是来自 FlowPilot 的可信界面。',
        retryable: false,
      },
    });
  });

  it('returns a stable redacted error when the service fails', async () => {
    const handler = createHandler(() => {
      throw new Error('sensitive-internal-value');
    });

    const result = await handler(TRUSTED_EVENT, { protocolVersion: SHELL_PROTOCOL_VERSION });

    expect(result).toEqual({
      ok: false,
      error: {
        code: 'IPC_HANDLER_FAILED',
        message: 'FlowPilot 无法读取桌面运行时信息。',
        retryable: true,
      },
    });
    expect(JSON.stringify(result)).not.toContain('sensitive-internal-value');
  });
});
