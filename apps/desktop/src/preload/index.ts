import type {
  FlowPilotDesktopApi,
  IPC_CHANNELS,
  SHELL_PROTOCOL_VERSION,
  ShellInfoResult,
} from '@flowpilot/ipc-contracts';
import { contextBridge, ipcRenderer } from 'electron';

const SHELL_GET_INFO_CHANNEL: typeof IPC_CHANNELS.shellGetInfo = 'flowpilot:shell:get-info';
const CURRENT_SHELL_PROTOCOL: typeof SHELL_PROTOCOL_VERSION = 1;

const desktopApi: FlowPilotDesktopApi = Object.freeze({
  getShellInfo: () =>
    ipcRenderer.invoke(SHELL_GET_INFO_CHANNEL, {
      protocolVersion: CURRENT_SHELL_PROTOCOL,
    }) as Promise<ShellInfoResult>,
});

contextBridge.exposeInMainWorld('flowPilot', desktopApi);
