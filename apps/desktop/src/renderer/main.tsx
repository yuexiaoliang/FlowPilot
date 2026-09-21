import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import './styles.css';

const rootElement = document.getElementById('root');

if (rootElement === null) {
  throw new Error('FlowPilot renderer root element is missing.');
}

const rendererRoot = rootElement;

async function bootstrapRenderer(): Promise<void> {
  const shellInfo = await window.flowPilot.getShellInfo();

  if (!shellInfo.ok) {
    rendererRoot.setAttribute('role', 'alert');
    rendererRoot.textContent = `${shellInfo.error.message}（${shellInfo.error.code}）`;
    return;
  }

  document.documentElement.dataset.flowpilotShellProtocol = String(shellInfo.value.protocolVersion);

  createRoot(rendererRoot).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void bootstrapRenderer().catch(() => {
  rendererRoot.setAttribute('role', 'alert');
  rendererRoot.textContent = 'FlowPilot 无法连接桌面安全桥。请重新启动应用。';
});
