# FlowPilot

FlowPilot is a desktop AI-assisted workflow automation product focused on learning web workflows once, persisting them as deterministic workflows, executing them repeatedly, and repairing them when websites change.

> Learn → Compile → Run → Detect → Repair → Learn

## Product scope

The first product is a desktop application for content-publishing workflows. The initial reference platform is WeChat Official Accounts, with manual first-time login and article publishing as the MVP.

FlowPilot is **not** designed as a bot-evasion product. It uses normal browser sessions, persistent profiles, rate limiting, risk detection, and human takeover. CAPTCHA, MFA, security challenges, account anomalies, or other explicit platform security gates must pause automation for user intervention.

## Core architecture

FlowPilot follows one rule above all others:

**Deterministic execution first; AI only for discovery and repair.**

Normal runs should not require an LLM. AI is invoked when a workflow is being learned, when the runtime cannot reach an expected state, or when a previously known workflow needs repair.

Core concepts:

- **Flow** — a persisted, versioned workflow.
- **Step** — an atomic transition with preconditions, action, and expected result.
- **Run** — one execution of a Flow.
- **Driver** — browser abstraction used by the runtime.
- **Discovery** — AI-assisted process that learns a new Flow.
- **Repair** — AI-assisted local patch of a failed portion of a Flow.
- **Validator** — verifies state before and after steps.
- **Account** — isolated browser/session identity for a platform.
- **Human Takeover** — first-class pause/resume mechanism for login, CAPTCHA, MFA, security checks, or ambiguous operations.

## Technology baseline

- Desktop: Electron
- Language: TypeScript (strict mode)
- UI: React + Vite
- Embedded browser: Electron WebContentsView
- Automation abstraction: internal BrowserDriver
- Browser automation/testing: Playwright
- Persistence: SQLite
- Runtime validation: Zod
- UI state: Zustand
- Package manager: pnpm workspaces
- Tests: Vitest + Playwright
- Formatting/linting: ESLint + Prettier
- CI: GitHub Actions

Exact dependency versions are pinned by the lockfile. Agents must not casually replace framework choices; architecture changes require an ADR.

## Repository documentation

Read these before development:

- [AGENTS.md](./AGENTS.md) — mandatory rules for coding agents.
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) — system boundaries and module responsibilities.
- [docs/WORKFLOW-IR.md](./docs/WORKFLOW-IR.md) — canonical workflow model.
- [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md) — development, testing, branching, and review rules.
- [docs/SECURITY.md](./docs/SECURITY.md) — session, secret, remote-content, and automation safety rules.
- [docs/ROADMAP.md](./docs/ROADMAP.md) — staged delivery plan.

## MVP success condition

The MVP is complete when FlowPilot can:

1. Open WeChat Official Accounts in an embedded/persistent browser session.
2. Let a user log in manually and reuse that session later.
3. Learn an article-publishing flow and persist it.
4. Execute that persisted flow without an LLM during the happy path.
5. Detect a deliberately broken step.
6. Invoke AI repair only for the failing region.
7. validate the repaired route, create a new Flow version, and complete the run.
8. Pause safely for security challenges or user confirmation.

Do not broaden the MVP until this loop works reliably.

## Status

Planning baseline established. Implementation should follow the roadmap and repository rules before feature expansion.
