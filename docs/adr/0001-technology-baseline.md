# ADR-0001: Desktop technology baseline

- Status: Accepted
- Date: 2026-09-19
- Decision owners: FlowPilot maintainers

## Context

FlowPilot needs to show real third-party web applications inside a desktop UI while controlling those exact pages, maintaining isolated persistent sessions, observing navigation and page state, and allowing user takeover. The workflow representation must outlive any particular browser automation library.

## Decision

Use:
- Electron as desktop runtime
- React + Vite as trusted renderer UI
- WebContentsView for third-party platform pages
- a FlowPilot-owned BrowserDriver interface
- Electron webContents/CDP as the production embedded driver implementation
- Playwright for E2E, fixture testing, debugging, and an optional adapter
- TypeScript strict mode throughout
- SQLite behind repository interfaces for local-first persistence
- provider-neutral AI adapters for Discovery and Repair only
- pnpm workspaces for repository organization

The Workflow Runtime and Workflow IR are first-party FlowPilot code and must not be replaced by a general agent framework.

## Alternatives considered

### Tauri
Smaller footprint and strong Rust backend model, but system WebViews vary by OS. Persisted cross-platform browser workflows benefit from one Chromium-based runtime.

### Playwright-launched standalone Chrome as the final UX
Fastest prototype path, but creates a second browser surface and separates what the user sees from the application's primary UI. Useful during early development, not the target architecture.

### Persist raw macro/selector recordings
Simple initially, but brittle and difficult to repair or validate. FlowPilot needs semantic targets and state transitions.

### Agent executes every step with an LLM
Flexible but costly, slow, hard to reproduce, and unnecessarily unreliable for known workflows.

## Consequences

### Positive
- consistent Chromium-centric desktop behavior
- user and automation operate on the same embedded page
- workflow runtime stays browser-library independent
- normal runs can be fast and model-free
- account sessions map naturally to Electron partitions

### Negative / trade-offs
- Electron application size/memory overhead
- WebContentsView layout requires coordination with renderer UI
- native SQLite drivers require Electron rebuild/packaging care
- CDP/Electron driver will require custom engineering

### Migration / compatibility impact
Workflow IR may not contain Electron/Playwright object identities. Driver-specific data must remain hints/adapters so alternative drivers remain possible.

## Validation

This decision is validated when the local fixture site can:
1. run inside WebContentsView
2. persist account/session state
3. execute Flow IR through BrowserDriver
4. intentionally break a flow
5. repair it through a provider-neutral repair path
6. rerun successfully without an AI call
