# E0 工程基线与缺口审计

本文件是 E0.1 审计的稳定事实记录。它记录 2026-09-21 审计时 P0 原型在进入 E0 实现前的工程基线、实际验证证据、E0 Acceptance 1–8 矩阵和后续有界切片。它不替代 `docs/ACCEPTANCE.md`；审计当时尚未完成 E0 Gate，后续 Gate 结论以 [`docs/PROJECT-STATE.md`](./PROJECT-STATE.md) 为准。

审计日期：2026-09-21

## 结论摘要

审计时，当前仓库已经具备可运行的 P0 Electron + React 原型、严格 TypeScript、Vitest、Playwright Electron E2E 和一组可信 Renderer 安全默认值，但**尚不满足 E0 Gate**。随后 E0.2–E0.4 和独立 E0 全量 Gate 已完成；当前阶段状态不在本历史审计结论中重复维护。

主要阻塞缺口是：

1. 没有 ESLint / Prettier、root `lint` 或 `package` 命令，也没有 Electron Forge packaging 配置；
2. 没有 preload、最小 typed API 或 IPC contracts；
3. 没有 third-party WebContentsView 安全边界的实现证据；
4. 没有 GitHub Actions；
5. 没有本地 deterministic fixture web app 或规定的 variants；
6. 当前 P0/E0 基线文件仍处在未提交工作区，无法从当前 Git `HEAD` 证明 clean clone 可运行。

本审计没有修改产品行为、正式 Acceptance、D0 契约或锁定架构，也不把 P0 的运行证据误写成 E0 完成。

## 环境与版本证据

| 项目 | 实际证据 | 结论 |
| --- | --- | --- |
| Node.js | `node --version` → `v24.18.0`；满足 `package.json` 的 `>=24.15.0 <25` | 已满足 |
| pnpm | `corepack pnpm --version` → `12.5.1`；`packageManager` 固定为 `pnpm@12.5.1` | 已满足 |
| workspace | `pnpm-workspace.yaml` 包含 `apps/*` | 已满足 |
| dependency lock | `pnpm-lock.yaml` 存在，lockfile version 9；应用依赖使用精确版本 | 已满足 |
| TypeScript | 根 `tsconfig.json` 开启 `strict`、`noUncheckedIndexedAccess`、`exactOptionalPropertyTypes`；扫描未发现 `any` / `@ts-ignore` | 已满足 |

## 实际命令记录

| 命令 / 检查 | 结果 | 证据 |
| --- | --- | --- |
| `node --version` | PASS | `v24.18.0` |
| `corepack pnpm --version` | PASS | `12.5.1` |
| `corepack pnpm typecheck` | PASS | main、renderer、test 三个 tsconfig 均通过 |
| `corepack pnpm test` | PASS | 15 个 test files / 55 tests |
| `corepack pnpm build` | PASS | main TypeScript + Vite production build；29 modules |
| `corepack pnpm test:e2e` | PASS | 1 条 Electron golden-path E2E；约 23 秒 |
| `corepack pnpm dev` | PASS（短时 smoke） | Vite 在 `127.0.0.1:43127` 返回 HTTP 200，Electron Renderer 成功加载；停止后端口释放 |
| `corepack pnpm run lint` | FAIL（预期缺口） | `ERR_PNPM_NO_SCRIPT`，缺少 `lint` script |
| `corepack pnpm run package` | FAIL（预期缺口） | `ERR_PNPM_NO_SCRIPT`，缺少 `package` script |
| `corepack pnpm audit --audit-level high` | PASS | 无已知漏洞 |
| clean clone 验证 | 未执行 / 未证明 | 当前 `package.json`、workspace、app 等基线仍未被当前 Git `HEAD` 跟踪；不能用现工作区替代 clean clone 证据 |

## E0 交付物差距矩阵

| E0 交付物 | 状态 | 文件 / 静态证据 | 缺口 |
| --- | --- | --- | --- |
| pnpm workspace | 已满足 | `package.json`、`pnpm-workspace.yaml`、`pnpm-lock.yaml` | clean clone 仍待 CI 证明 |
| 固定 Node / pnpm 策略 | 已满足 | `package.json#engines`、`packageManager` | 无 |
| strict TypeScript | 已满足 | `tsconfig.json` 与三个 desktop tsconfig | 无 |
| Electron main / preload / renderer | 部分满足 | `apps/desktop/src/main/`、`apps/desktop/src/renderer/` 存在 | `apps/desktop/src/preload/` 缺失 |
| React + Vite | 已满足 | `apps/desktop/package.json`、`vite.config.mts` | 无 |
| ESLint + Prettier | 缺失 | 无配置、依赖或 root script | 需要统一 lint / format 基线 |
| Vitest | 已满足 | `vite.config.mts`、15 个测试文件 | 无 |
| Playwright Test | 已满足（P0 范围） | `playwright.config.ts`、Electron E2E | fixture E2E 尚缺 |
| typed IPC skeleton | 缺失 | 无 `packages/ipc-contracts`、`ipcMain`、`ipcRenderer` 或 `contextBridge` | 需要最小、可校验、非通用 invoke 的边界 |
| 安全 Electron 默认值 | 部分满足 | `security.ts` / `security.test.ts`：Node off、context isolation、sandbox、web security；`index.ts`：拒绝 popup/navigation/permissions | 仅覆盖 trusted Renderer；尚无 third-party WebContentsView/session 边界 |
| GitHub Actions | 缺失 | `.github/workflows/` 不存在 | 需要 frozen install + typecheck/lint/test/build |
| deterministic fixture web app | 缺失 | 无 fixture app / 目录 | 所有规定 variants 均缺失 |
| packaging | 缺失 | 无 Electron Forge、`package` script 或 packaging smoke | 需要可重复的本地 packaging 基线 |

## E0 Acceptance 1–8 矩阵

这里的编号对应 `docs/ACCEPTANCE.md` 的 E0 条目。

| Acceptance | 状态 | 可复查证据 | 仍缺什么 |
| --- | --- | --- | --- |
| 1. Renderer 没有 Node integration | 已满足（当前 trusted Renderer） | `trustedRendererWebPreferences.nodeIntegration === false`，`security.test.ts` 覆盖；dev smoke 的 Renderer 带 sandbox | 后续 WebContentsView 仍需独立安全配置 |
| 2. context isolation 开启 | 已满足（当前 trusted Renderer） | `contextIsolation === true` 且有单测 | 后续所有新 webContents 必须复用或独立证明 |
| 3. preload API 最小且 typed | 缺失 | 没有 preload 目录、context bridge、IPC contract | 需要 E0.3 实现与契约测试 |
| 4. third-party WebContentsView 没有 privileged preload | 缺失 / 无法证明 | 当前没有 WebContentsView、第三方 fixture 或其 webPreferences | 需要先建立安全壳，再由本地 fixture 证明 |
| 5. CI 跑 typecheck / lint / test / build | 缺失 | `.github/workflows/` 不存在，`lint` script 也不存在 | 需要 E0.2 |
| 6. deterministic fixture site 支持所需 variants | 缺失 | 没有 fixture site；normal、DOM/layout、ambiguity/interstitial、auth expired、security challenge、upload、publish success/failure 均无证据 | 需要 E0.4 |
| 7. root commands 有文档 | 部分满足 | root `dev/build/typecheck/test/test:e2e` 存在；README 记录当前可用命令 | `lint/package` 缺失；README 尚未记录完整 E0 命令和 packaging |
| 8. 不依赖未记录的生产 credential | 已满足（当前基线） | app/code/config 中无 `.env`、credential 文件、真实服务调用或生产账号；`.gitignore` 排除 env、key、browser auth/profile；P0 只用本地 Mock | 后续 fixture、IPC 和 CI 必须继续保持 fake/local-only |

横向事实：clean clone 尚未证明。当前工作区中的 P0/E0 基线文件仍有未提交 / 未跟踪状态，因此现有命令通过不能替代从当前 Git `HEAD` 安装并运行的证据。

## Electron、IPC 与信任边界审计

- `app.enableSandbox()` 已启用。
- trusted BrowserWindow 明确设置 `nodeIntegration: false`、`contextIsolation: true`、`sandbox: true`、`webSecurity: true`、`webviewTag: false`，并禁用 insecure content / experimental features。
- 主窗口拒绝 `window.open`、阻止导航覆盖可信 UI，并拒绝所有默认 Session 权限请求。
- 开发 Renderer URL 被限制为 `http://127.0.0.1:43127/` 的精确 origin / path。
- 当前不存在 preload 或 IPC，因此不存在通用 `invoke` 暴露，但也不满足 typed IPC skeleton 验收。
- 当前不存在 WebContentsView，不能把“不存在 privileged preload”当成 E0.4 的通过证据。
- 没有发现 `fetch`、WebSocket、外部 HTTP、shell/process 执行或真实服务依赖；唯一 URL 是受限的本地 Vite dev origin。

## Fixture variant 缺口

以下本地、确定性 variants 全部缺失：

- normal editor flow；
- DOM / layout change；
- ambiguity / interstitial；
- auth expired；
- security challenge；
- upload；
- publish success；
- publish failure。

后续 fixture 必须只用 fake/local data，不使用生产账号、真实微信或外部网络；security challenge 只能验证暂停/分类，不能实现规避。

## Maintainer 决策

无。现有规范、ADR-0001 与安全边界足以界定后续三个切片，不需要架构或产品决策。

## 后续有界 Task Packets

审计完成时建议的三个切片如下。E0.2 已于本审计之后通过独立 Gatekeeper 并退休短期 packet；当前状态与证据以 `docs/PROJECT-STATE.md` 为准。

1. E0.2 工具链、CI 与 Packaging 基线：已验收，短期 packet 已退休。
2. E0.3 Desktop Shell、typed IPC 与安全边界：已验收，短期 packet 已退休。
3. E0.4 本地确定性 Fixture Site：已验收，短期 packet 已退休。

这些 Task Packet 是 `DEVELOPMENT-PLAN.md` 的执行辅助，不构成第二套 Roadmap。审计时要求 E0.2–E0.4 全部完成后再执行独立 E0 全量 Gate；该 Gate 后续已返回 `GATEKEEPER: PASS — E0 COMPLETE`。

## 审计交接

### 已完成

- 逐条盘点 E0 交付物与 Acceptance 1–8；
- 实际运行当前可用命令，并把缺失命令保留为明确失败证据；
- 复核 Electron 安全默认值、preload / IPC、CI、fixture、credential 和 root 文档；
- 将剩余工作拆为三个有界 E0 Task Packet。

### 变更边界

本切片只记录审计时事实。Electron、React、WebContentsView、BrowserDriver、SQLite 和信任边界未改变；审计之后 E0 全量 Gate 已通过。

### 下一推荐切片

`work/E1.1-goal-plan-foundation.md`

### 阻塞项 / 所需 Maintainer 决策

无。
