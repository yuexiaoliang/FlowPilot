# E0 全量 Gate：Engineering Foundation Acceptance 1–8

## 角色

Reviewer / Gatekeeper

## 阶段

E0 — Engineering Foundation

## 目标

在 E0.1–E0.4 四个切片均已验收后，独立逐条复核 `docs/ACCEPTANCE.md` 的 E0 Acceptance 1–8，并决定 E0 是否真正完成。只有 Gatekeeper 明确返回 PASS，才能推进到 E1。

## 为什么现在做

E0.4 Fixture Site 已通过独立 Gatekeeper，E0 的实现切片已经闭环。现在需要一次独立的阶段级 Gate，确认 clean-environment 命令、Electron 安全边界、typed IPC、CI、fixture variants、root 文档和 credential 边界共同满足 E0，而不是把四个局部 PASS 拼接成阶段 PASS。

## 规范参考

必须读取：

- `AGENTS.md`
- `docs/PROJECT-STATE.md`
- `docs/DEVELOPMENT-PLAN.md`
- `docs/ACCEPTANCE.md`
- `docs/AGENT-OPERATING-PROTOCOL.md`
- `docs/TECH-STACK.md`
- `docs/ARCHITECTURE.md`
- `docs/SECURITY.md`
- `docs/DEVELOPMENT.md`
- `docs/E0-ENGINEERING-BASELINE-AUDIT.md`
- `docs/adr/0001-technology-baseline.md`

## 范围内

- 逐条映射 E0 Acceptance 1–8：Renderer Node integration、context isolation、最小 typed preload、third-party WebContentsView privileged preload、CI、deterministic fixture variants、root commands 文档、生产 credential 边界。
- 复核 E0.1–E0.4 的 Gatekeeper 结论和实际证据，不把历史审计或单个切片证据扩大解释。
- 在可复查的 clean copy / 当前工作区中重跑或核对适用的 frozen install、typecheck、lint、format、CI contract、unit tests、build、Electron E2E、fixture smoke、dev smoke、package / ASAR smoke 和 audit。
- 检查 E0 之后的 handoff 是否足以让新会话继续，并记录 E0 是否完成。

## 范围外

- 不实现或修改 E1 Intent Compiler。
- 不接入真实 AI、真实平台、生产 credential、外部网络或生产 BrowserDriver。
- 不新增产品行为、Workflow Runtime、SQLite persistence、Repair 或 Human Takeover runtime。
- 不降低 `docs/ACCEPTANCE.md` 的 E0 标准，不以单个切片 PASS 替代阶段 Gate。

## 预期文件 / 产物

- Gatekeeper 的明确 `PASS` 或 `FAIL + blocking gaps` 结论。
- 若 PASS，由 State Keeper 更新 `docs/PROJECT-STATE.md` 并将下一推荐切片设为 E1；若 FAIL，只记录阻塞项并保持 E0 未完成。

## 约束

- 端口 `43127` 保留给 P0 Renderer；Fixture 默认端口 `43128`，覆盖值必须经过 `1024–65535` 且不得等于 `43127` 的校验。
- third-party content 必须保持无 privileged preload、Node / filesystem / shell / DB / Secret 权限，popup、权限和越界导航保持拒绝。
- CI 不使用生产账号或真实服务；package ASAR 不包含源码、测试、Secret、auth state 或数据库。
- E0 PASS 前不得推进 E1。

## 验收映射

- E0 Acceptance 1–8：逐条 PASS / FAIL，并附文件、命令或 smoke 证据。
- Global Definition of Done：typecheck、测试、架构边界、安全、文档和 handoff 证据可复查。

## 验证

至少核对或实际执行：

```text
corepack pnpm install --frozen-lockfile
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm format:check
corepack pnpm ci:validate
corepack pnpm test
corepack pnpm build
corepack pnpm test:e2e
corepack pnpm package
corepack pnpm audit --audit-level high
```

另外检查：

- Electron security smoke 与 fixture WebContentsView smoke；
- `127.0.0.1:43127` dev smoke、fixture `43128` / 显式合法覆盖值和端口释放；
- ASAR 必需入口和禁止文件；
- root 命令文档、GitHub Actions contract、E0.1–E0.4 证据链；
- `git diff --check`、尾随空白和 Markdown 相对链接。

## 停止条件

- 任一 E0 Acceptance 仍无证据或失败；
- 安全边界、CI、fixture、packaging 或 clean-environment 证据存在阻塞缺口；
- 需要修改锁定架构、Acceptance 或产品范围才能通过。

## 交接

使用 `docs/HANDOFF-TEMPLATE.md`。Gatekeeper 结论后必须由 State Keeper 更新项目状态；在此之前不要开始 E1。
