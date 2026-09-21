import type { FlowPilotDesktopApi } from '@flowpilot/ipc-contracts';

declare global {
  interface Window {
    flowPilot: FlowPilotDesktopApi;
  }
}

export {};
