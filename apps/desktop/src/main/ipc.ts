import {
  IPC_CHANNELS,
  SHELL_PROTOCOL_VERSION,
  shellInfoRequestSchema,
  shellInfoResultSchema,
  type AppError,
  type ShellInfoResult,
} from '@flowpilot/ipc-contracts';
import type { IpcMain, IpcMainInvokeEvent } from 'electron';

type ShellIpcDependencies = Readonly<{
  getAppVersion(): string;
  isTrustedSender(event: IpcMainInvokeEvent): boolean;
  platform: string;
}>;

function failure(error: AppError): ShellInfoResult {
  return shellInfoResultSchema.parse({ ok: false, error });
}

export function createShellInfoHandler(dependencies: ShellIpcDependencies) {
  return async (event: IpcMainInvokeEvent, payload: unknown): Promise<ShellInfoResult> => {
    if (!dependencies.isTrustedSender(event)) {
      return failure({
        code: 'IPC_SENDER_NOT_TRUSTED',
        message: '该请求不是来自 FlowPilot 的可信界面。',
        retryable: false,
      });
    }

    const request = shellInfoRequestSchema.safeParse(payload);
    if (!request.success) {
      return failure({
        code: 'INVALID_IPC_PAYLOAD',
        message: 'Shell 信息请求格式无效。',
        retryable: false,
      });
    }

    try {
      return shellInfoResultSchema.parse({
        ok: true,
        value: {
          protocolVersion: SHELL_PROTOCOL_VERSION,
          appVersion: dependencies.getAppVersion(),
          platform: dependencies.platform,
        },
      });
    } catch {
      return failure({
        code: 'IPC_HANDLER_FAILED',
        message: 'FlowPilot 无法读取桌面运行时信息。',
        retryable: true,
      });
    }
  };
}

export function registerShellIpc(ipcMain: IpcMain, dependencies: ShellIpcDependencies): () => void {
  ipcMain.handle(IPC_CHANNELS.shellGetInfo, createShellInfoHandler(dependencies));

  return () => {
    ipcMain.removeHandler(IPC_CHANNELS.shellGetInfo);
  };
}
