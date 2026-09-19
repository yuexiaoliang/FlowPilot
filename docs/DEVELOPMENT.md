# Development Guide

## Toolchain

Baseline:
- Node.js: repository-pinned active LTS line
- pnpm: repository-pinned via packageManager
- TypeScript strict
- Electron
- React + Vite
- Electron Forge for packaging/release unless an ADR changes it
- Vitest for unit/integration tests
- Playwright for E2E/browser integration tests
- ESLint + Prettier
- GitHub Actions

Do not globally install project dependencies. Use Corepack/pnpm as pinned by the repo.

## Monorepo

Use pnpm workspaces. Do not introduce Turborepo/Nx until build scale demonstrates a real need.

Root scripts should eventually expose:
```
pnpm dev
pnpm build
pnpm typecheck
pnpm lint
pnpm test
pnpm test:e2e
pnpm package
```

Agents should prefer root scripts over package-specific incantations in documentation.

## Branching and commits

- `main` should stay releasable.
- Work on short-lived branches: `feat/*`, `fix/*`, `docs/*`, `refactor/*`.
- Prefer small commits with Conventional Commit style.
- Do not mix broad refactors with functional feature changes.
- Architecture-changing work requires an ADR in the same PR.

## Pull request checklist

A PR should state:
- problem being solved
- architecture impact
- key implementation choices
- tests run
- screenshots/video for visible UI changes where useful
- security/session implications
- migration impact
- follow-up work

## Test pyramid

### Unit
Pure domain rules, schemas, workflow compiler, validators, policy, redaction.

### Contract
All BrowserDriver implementations must run the same behavior contract suite.

### Integration
SQLite repositories, migrations, IPC boundaries, Electron session setup, worker orchestration.

### Fixture-based AI tests
Discovery/repair tests operate on checked-in sanitized DOM/accessibility/snapshot fixtures. Assert structured proposals and policy constraints; do not rely on model prose.

### E2E
Use local fixture websites that simulate:
- normal editor flow
- selector/DOM change
- extra interstitial
- login expiry
- ambiguous button
- security challenge
- upload
- publish success/failure

CI must not publish to real services.

## Deterministic fixtures

Create an internal test site under the repository rather than testing repair against live WeChat. It should have versioned variants (v1/v2/v3) so we can deliberately break known workflows and verify repair.

This fixture site is essential to prevent flaky tests and accidental real-world actions.

## Dependency policy

Before adding a dependency ask:
1. Is this capability already provided by Node/Electron?
2. Is it maintained and widely used?
3. Does it add native build complexity?
4. Does it execute in Renderer or touch remote content?
5. Can we isolate it behind an interface?

Do not upgrade Electron/Playwright/React across major versions in a feature PR.

## Database development

- migrations are append-only
- migration execution is atomic
- backup/rollback behavior is tested
- repositories map persistence rows to domain types
- never query SQLite directly from Renderer

## IPC

Preload exposes a minimal, typed API. IPC channel names and payloads live in `packages/ipc-contracts`.

Rules:
- validate every incoming payload
- do not expose generic `invoke(channel, payload)` to Renderer
- no arbitrary filesystem path access
- no arbitrary shell/process execution
- no direct webContents object leakage

## Error handling

Errors crossing package/process boundaries must use a stable serializable envelope:
```ts
type AppError = {
  code: string;
  message: string;
  retryable: boolean;
  details?: Record<string, unknown>;
  correlationId?: string;
}
```

Sensitive details are omitted/redacted.

## Feature flags

Experimental discovery/repair behavior should be feature flagged until fixtures and runtime telemetry show acceptable reliability.

## Development sequence

Implement in vertical slices, not by building all infrastructure first.

Preferred first slice:
1. desktop shell
2. embedded test page
3. BrowserDriver snapshot/find/click/fill
4. hardcoded Flow IR
5. executor + validators
6. persistence
7. intentional break
8. repair interface with deterministic fake provider
9. real AI provider
10. WeChat adapter/manual login

This makes architecture testable before depending on live platforms.
