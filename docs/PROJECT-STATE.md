# FlowPilot 项目状态

本文件是项目**当前状态**的规范快照。

最近一次架构/产品规划更新：2026-09-21

## 当前阶段

**E1 — Intent Compiler**

状态：**进行中（E1.1 已验收；等待 E1.2）**

上一阶段 **E0 — Engineering Foundation** 已由独立 Gatekeeper 完成全量验收，E0 Acceptance 1–8 全部 PASS。E1.1 Goal source / GoalPlan 基础编译切片也已由独立 Gatekeeper 验收；当前 E1 正在进行，下一步是 E1.2 Task source / TaskPlan 基础编译切片。当前没有需要 Maintainer 决策的阻塞项。

已确认的产品方向：

> 默认简单，按需透明。

> 用户写语义，系统保存引用。

> 自然语言是控制层。结构化计划 / Workflow 负责执行。只有在人需要观察、选择、比较、批准或介入时，UI 才出现。

## 已确认事项

### 产品模型

已确认：

- Goal = 想要达到的结果
- Task = 什么时候、按什么规则执行 Goal
- Source = 明确授权的数据边界
- InputBundle = 某一次 Run 使用的不可变输入
- Flow = 可版本化的执行策略
- Run = 带来源信息的一次具体执行

规范源：`PRODUCT-MODEL.md`

### UX 模型

已确认：

- intent-first，而不是 dashboard-first
- 自然语言 / Markdown 创作
- 不要求用户学习 FlowPilot DSL
- 默认 UI 极简
- 专业 / 技术透明性按需展开
- 使用渐进披露，而不是永久展示复杂度
- 使用上下文式 / 临时 UI primitive，而不是巨大的设置表单

规范源：`NATURAL-LANGUAGE-UX.md`

### 视觉方向

已确认方向：

- 浅色、安静、现代的桌面 UI
- 宽松留白
- 最少导航
- 自然语言意图界面作为主要入口
- AI Understanding 是结构化解释，而不是配置表单
- 执行 / 数据来源细节隐藏在可展开的专业 Inspector 中
- 之前密集的 SaaS / Dashboard 探索稿仅作为历史参考，不是规范设计

### 技术

已确认基线：

- Electron
- TypeScript
- React + Vite
- WebContentsView
- BrowserDriver 抽象
- Playwright 用于测试 / 开发适配
- SQLite
- Zod
- pnpm
- Vitest + Playwright Test

规范源：`TECH-STACK.md`、ADR-0001

## 当前交付目标

上一阶段交付目标是构建 **Interactive Mock Prototype**，在不接入生产基础设施前验证 D0 Design Contract 的黄金路径；P0.1–P0.7 及 P0 全量 Gate 均已验收。随后 E0.1–E0.4 四个工程切片和独立 E0 Acceptance 1–8 全量 Gate 均已验收完成。当前交付目标是完成 E1 Intent Compiler：E1.1 Goal source / GoalPlan 已验收，下一步只做 E1.2 Task source / TaskPlan 基础编译；不得跳过 E1 Gate 或提前进入 E2。

已验证进展：

- **D0.1 — Design principles + interaction hierarchy：已验收。** Gatekeeper 于 2026-09-20 对当时提交的六个中英文设计产物返回 PASS。这一历史验收事实仍然有效：该合同已将十条原则操作化，定义 Simple / Execution / Inspection 界面及其转场，覆盖所有必需的上下文触发器，保留文字规范的权威性和 Reviewer 指引，并明确密集 Dashboard 探索稿不是规范设计。历史验证证据：六个产物均非空，中英文标题结构一致，无尾随空白，英文和中文各 50 个标题、50 个自检字段，以及六个上下文触发器章节。
- **D0-PREFLIGHT — 中文规范源迁移：已验收。** Gatekeeper 已返回 PASS。简体中文现为长期项目文档唯一默认语言和规范源；稳定主路径保持不变；26 个重复语言镜像文件已移除；`.codex/agents/*.toml` 与 `work/*.md` 已中文化；原英文规范中的关键 AGENTS、架构接口、SourceProvider、InputBundle provenance、D0.1 设计和安全约束均已保留。验证证据：规则 1–20、分层边界、实现风格、验证要求和四 Agent 闭环完整；根目录长期文档、`docs/`、`docs/adr/` 与 `design/` 中无英文副本；相对链接 0 失效；TOML 结构与行为保持；`git diff --check` PASS；ACCEPTANCE 编号 125/125、DEVELOPMENT-PLAN 标题 59/59。
- **D0-PREFLIGHT-COMPLETE — 规范完整性复核：已验收。** Gatekeeper 已返回 PASS。第二轮复核确认限定的 8 份文档已补回原英文规范中曾被压缩的条目、代码示例和退出条件，包括 ROADMAP 阶段 2–7 / Repair 闭环、AppError、10 步切片、StructuredModel、Workflow JSON、revision 6→7、sourceId、隐藏语义元数据、UX 示例、授权路径和 WebContentsView 依据；接口 / 技术标识符与原文一致，语义和计划顺序不变。证据：链接、镜像扫描和 `git diff --check` PASS；ROADMAP bullets 65/65、DEVELOPMENT 41/41（编号 15/15）、WORKFLOW 92/92（编号 5/5），inline 技术标识符缺失 0。
- **D0.2 — Design system + components：已验收。** Gatekeeper 于 2026-09-20 对 `design/DESIGN-SYSTEM.md` 与 `design/COMPONENTS.md` 返回 PASS，并在复验中确认设计系统覆盖语义颜色 / 状态 Token、排版与可读行宽、间距 / 尺寸 / 圆角 / 层级 / 密度，以及焦点、键盘、200% 缩放、对比度、减少动态效果和状态播报；组件契约覆盖 13 个上下文 primitive，每个均定义三层归属、触发、内容、交互、无障碍和 `idle` / `loading` / `success` / `failure` / `paused` / `disabled` 六状态行为。关键对比度证据为 disabled text `4.543:1`、disabled border `3.282:1`。验收变更范围仅为这两份目标设计文件；没有 `SCREEN-SPECS`、`FLOWS`、代码、P0 或架构变更。
- **D0.3 — Screen specs + golden flows：已验收。** Gatekeeper 于 2026-09-20 返回 PASS；`design/SCREEN-SPECS.md` 覆盖 S-01..S-10，`design/FLOWS.md` 覆盖 G-01..G-08 与 B-01..B-10。Source resolution / InputBundle、Confirmation 与 Human Takeover 的区分、终态、Repair 顺序和 D0.1–D0.14 均有对应证据。
- **D0 — Design Contract：已完成。** Gatekeeper 结论为 `GATEKEEPER: PASS — D0 COMPLETE`。七份 Design Contract 均存在且非空；10/10 屏幕、18/18 流程节点、30 个稳定锚点以及 156 个内部链接 / fragment 检查全部通过。验收范围没有 React / Electron / P0 代码、fixture 或真实服务实现；已验收的 D0.1、D0.2 和 D0.3 产物均保留。其后 P0 已完成全量 Gate。
- **P0.1 — Intent → Understanding Mock：已验收。** Gatekeeper 返回 `GATEKEEPER: PASS`；P0 条目 1–4 及相关 13–15 PASS，安全/架构及无障碍/响应式检查 PASS。证据：typecheck、3 files/9 tests、production build、Electron E2E（含 200% zoom/no horizontal overflow）、audit 0 vulnerabilities、`git diff --check` 和 dev smoke 均 PASS；`evidence/P0.1-intent-understanding.png` 已视觉复核。确定性 Mock 只识别一个演示意图，默认预填示例；其余 P0 能力已由 P0.2–P0.7 补齐并通过全量 Gate。
- **P0.2 — Source resolution / contextual Source connection：已验收。** Gatekeeper 最终结论为 `GATEKEEPER: PASS`；P0.5 / S-03 / G-03 与 P0.6 PASS，相关 P0.13–15 也 PASS。确定性 Mock 仅在 Source 缺失时显示上下文连接卡片，连接动作显式、scoped、默认只读；连接取消、拒绝、范围不匹配和取消检查均保持 typed recoverable failure，成功后只显示语义名称与范围摘要。loading 标题焦点、Escape 取消选择并恢复触发按钮、200% 无横向溢出、无永久技术面板和黄金路径 walkthrough 均已验证；范围边界确认没有真实文件系统/Git/权限 API/持久化/InputBundle/Execution/真实 AI。证据：typecheck PASS；5 files/22 tests PASS；build PASS；1 Electron E2E PASS；audit 0 vulnerabilities；`git diff --check` PASS；`evidence/P0.2-source-resolution.png` 已视觉复核。连接成功不等于 InputBundle 创建；其 P0 范围边界随后已在全量 P0 Gate 中复核通过。
- **P0.3 — Input Preview / immutable mock input：已验收。** Gatekeeper 返回 `GATEKEEPER: PASS`；P0 条目 7 及相关 13–15 PASS。确定性 Mock 只在 P0.2 的 scoped、默认只读 Source 成功后选择固定文章、正文和配套封面，完成必需输入绑定、校验和仅存在于本次原型流程的不可变 InputBundle 摘要；S-04 展示语义 Source / 范围、固定内容版本、文章标题、正文摘要/展开、封面和“继续准备运行”边界，但不创建 Run 或宣称发布成功。取消准备、缺少必需输入、输入过期、键盘焦点、状态播报和 200% 单列重排均保持可恢复且诚实；普通路径不暴露内部 ID、完整路径、原始 hash 或持久化结构。证据：typecheck PASS；7 files/29 tests PASS；production build PASS；audit 0 vulnerabilities；1 Electron E2E PASS；`evidence/P0.3-input-preview.png` 已视觉复核；`docs/MANUAL-ACCEPTANCE.md` 已覆盖 P0.3 人工走查。真实文件系统/Git、持久化 snapshot、真实 AI/平台能力属于范围外；Mock Execution、Confirmation、Result、Inspector 当时尚未实现，随后由 P0.4–P0.7 补齐并全量验收。
- **P0.4 — Deterministic Mock Execution / pre-confirmation Run：已验收。** Gatekeeper 独立返回 `GATEKEEPER: PASS`；覆盖 P0 条目 8 及相关 13–15，并验证 G-04/S-05 的 `InputBundle → Run` 边界与 G-05 的发布前暂停入口。用户明确继续后，当前会话创建确定性 Mock Run，绑定原冻结输入，展示三项一次性有意义里程碑，并在不可逆边界进入 `paused` 的“等待你的确认”；取消、重试、返回保持 typed recoverable failure 和原 bundle，不伪装成成功。禁用的“等待确认后继续”明确说明需要后续 Confirmation 界面；未实现 Confirmation/Human Takeover/Result/Inspector、真实平台动作、真实 BrowserDriver、网络或持久化。证据：`corepack pnpm typecheck` PASS；9 个 test files / 34 tests PASS；production build PASS；`corepack pnpm audit --audit-level high` 无已知漏洞；1 条 Electron E2E PASS（覆盖 S-04→S-05、取消/返回恢复、发布前 `paused`、禁用原因、200% 无横向溢出、意图修改不替换当前绑定输入）；`evidence/P0.4-mock-execution.png` 已视觉复核；`docs/MANUAL-ACCEPTANCE.md` 已覆盖 P0.1–P0.4；`git diff --check` 与 Markdown 相对链接检查 PASS。其余确认、结果和详情能力随后由 P0.5–P0.7 补齐，并在全量 P0 Gate 中统一复核通过。
- **P0.5 — Confirmation / pre-publication decision：已验收。** Gatekeeper 独立返回 `GATEKEEPER: PASS`；覆盖 P0 条目 9 及相关 13–15，并验证 G-05/S-06 与 B-04/B-06/B-07 的确认边界。当前会话从 P0.4 的 `paused` 状态打开临时 Confirmation dialog，继续绑定 exact frozen InputBundle，展示动作、目的地语义名、文章/输入摘要和不可逆影响；只有明确点击“确认发布”才记录确认事件，明确“取消发布”才记录取消事件。关闭、遮罩、`Escape` 均只收起卡片并回到待决定暂停，不等于确认或取消；确认只记录会话级决定，尚未发布，也不伪装成成功。失效/取消准备保持 typed recoverable failure，重新开始继续使用原冻结输入；真实动作、平台调用、Human Takeover、持久化属于范围外，Mock Result/Inspector 当时待由 P0.6–P0.7 补齐且现已完成。证据：`corepack pnpm typecheck` PASS；11 个 test files / 41 tests PASS；production build PASS；`corepack pnpm audit --audit-level high` 无已知漏洞；1 条 Electron E2E PASS（覆盖关闭、`Escape`、显式取消、重新开始、显式确认、冻结输入稳定与 200% 无横向溢出）；`evidence/P0.5-confirmation.png` 已视觉复核；`docs/MANUAL-ACCEPTANCE.md` 已覆盖 P0.1–P0.5；`git diff --check`、尾随空白和 Markdown 相对链接检查 PASS。随后 P0.6–P0.7 及全量 P0 Gate 已通过。
- **P0.6 — Result / verified mock outcome：已验收。** Gatekeeper 独立返回 `GATEKEEPER: PASS`；覆盖 P0 条目 10 及相关 9、13–15，并验证 G-06/B-07 的诚实成功/取消边界。显式确认后，当前会话只执行确定性的本地 Mock action，并在固定 postcondition 通过后才显示 `SUCCEEDED`；显式取消才显示中性的 `CANCELLED`，关闭、遮罩、`Escape` 和确认前失败不会被改写为取消或成功。结果继续绑定原 exact frozen InputBundle，提供极简结果摘要、语义目的地/输入信息和一次性状态播报；`检查详情` 已由 P0.7 补齐。证据：`corepack pnpm typecheck` PASS；13 个 test files / 48 tests PASS；production build PASS；`corepack pnpm audit --audit-level high` 无已知漏洞；1 条 Electron E2E PASS（覆盖确认→Mock action→postcondition→`SUCCEEDED`、显式取消→`CANCELLED`、失败/取消恢复、冻结 bundle 稳定、200% 无横向溢出与结果边界）；`evidence/P0.6-result.png` 已视觉复核；`docs/MANUAL-ACCEPTANCE.md` 已覆盖 P0.1–P0.6；`git diff --check`、尾随空白和 Markdown 相对链接检查 PASS。真实平台、Human Takeover、持久化、真实 AI 等均是明确的 P0 范围外能力。
- **P0.7 — Result → Inspector provenance：已验收。** Gatekeeper 独立返回 `GATEKEEPER: PASS`；覆盖 P0 条目 11–12 及相关 13–15、G-07/G-08、B-08/B-09。`SUCCEEDED` / `CANCELLED` 结果均可通过明确的 `检查详情` 入口打开上下文 Inspector；详情锚定当前结果、Run 与 exact frozen InputBundle，展示可读的 TaskPlan / GoalPlan / Flow revision、语义 Source / read-only scope / Source version、InputBundle 摘要、按序 Run timeline，以及与终态一致的确认、Mock action 和 postcondition 事实。默认 Result 保持简洁，Inspector 渐进披露；关闭、返回和 `Escape` 恢复结果与触发焦点；无内部 ID、selector、Secret、完整路径或原始日志；非法 provenance 保持 typed failure，且未实现真实平台、Human Takeover、持久化或完整历史 Inspector，这些均是明确范围边界。证据：`corepack pnpm typecheck` PASS；15 个 test files / 55 tests PASS；production build PASS；`corepack pnpm audit --audit-level high` 无已知漏洞；1 条 Electron E2E PASS（覆盖 `SUCCEEDED` / `CANCELLED`、打开不抢焦点、首次 Tab 进入 Inspector、`Escape` / 关闭恢复并触发焦点、200%）；`git diff --check` PASS；`evidence/P0.7-inspector-provenance.png` 已视觉复核；`docs/MANUAL-ACCEPTANCE.md` 已覆盖 P0.7 人工走查。随后独立全量 P0 Gate 已通过。
- **P0-MANUAL-ACCEPTANCE — P0.1–P0.7 人工验收入口：已验收。** `docs/MANUAL-ACCEPTANCE.md` 提供启动（端口 `43127`）、黄金路径、P0.5 Confirmation、P0.6 Result、P0.7 Inspector、取消/失败恢复、冻结输入、键盘与焦点、200% 缩放、信息边界、自动验证和验收记录模板；`README.md` 与 `docs/README.md` 提供维护者入口。该文档入口复核通过，仍不替代正式 Acceptance 标准；其对应的 P0 全量 Gate 已独立通过。

- **P0 — Interactive Mock Prototype 全量 Gate：已完成。** 独立 Gatekeeper 于 2026-09-21 返回 `GATEKEEPER: PASS — P0 COMPLETE`，逐条确认 `docs/ACCEPTANCE.md` 的 P0 1–15 全部通过：

  | Acceptance | 已验证事实与证据 |
  | --- | --- |
  | 1 | Electron + React 可启动；dev smoke 在 `127.0.0.1:43127` 返回 HTTP 200，Electron renderer 成功加载，停止后端口释放。 |
  | 2 | 使用确定性本地 Mock；代码、测试和 E2E 均未连接真实 AI、微信、Git、网络或后端自动化。 |
  | 3 | 用户通过普通自然语言输入示例意图。 |
  | 4 | 展示简洁的 Understanding Review，保留原始意图。 |
  | 5 | 仅在 Source 缺失时出现上下文连接卡片。 |
  | 6 | Source 授权路径只展示语义名称、范围和只读权限，不暴露内部 ID。 |
  | 7 | Input Preview 展示固定文章正文和配套封面，且绑定 exact frozen InputBundle。 |
  | 8 | Execution 只显示三个有意义的确定性进度里程碑。 |
  | 9 | 不可逆边界前必须通过 Confirmation 显式确认或显式取消。 |
  | 10 | `SUCCEEDED` 只在 Mock action 与 postcondition 通过后出现；默认结果保持极简。 |
  | 11 | 成功或取消后可通过明确入口打开上下文 Inspector。 |
  | 12 | Inspector 展示 TaskPlan / GoalPlan / Flow revision、Source version、InputBundle 摘要和 Run timeline provenance。 |
  | 13 | 默认路径和专业详情均不永久暴露内部 ID、Secret、完整路径、selector 或原始日志。 |
  | 14 | D0 最少导航、Simple / Execution / Inspection 分层、页面密度与无障碍约束通过设计契约复核。 |
  | 15 | Electron E2E 与人工指南可在无需额外解释隐藏 UI 规则的情况下完成完整黄金路径。 |

  全量证据：`corepack pnpm typecheck` PASS；`corepack pnpm test` PASS（15 个文件 / 55 tests）；`corepack pnpm build` PASS（29 modules）；`corepack pnpm audit --audit-level high` PASS（无已知漏洞）；1 条 Electron E2E PASS（约 22 秒，覆盖成功/取消、冻结输入、Confirmation、provenance、Tab/Shift+Tab/Escape 和 200%）；`git diff --check` 与尾随空白检查 PASS；33 个 Markdown 文件 / 210 个相对链接检查 PASS；P0.1–P0.7 七张截图均已视觉复核；D0 设计契约、`docs/MANUAL-ACCEPTANCE.md` 和 handoff 可用性均已复核。未发现阻塞性 usability issue。真实服务、Human Takeover、持久化和生产 Inspector 等是明确范围外能力，不是 P0 缺口。

- **E0.1 — 工程基线与缺口审计：已验收。** 独立 Gatekeeper 已返回 `GATEKEEPER: PASS`；审计结论已从短期 Task Packet 提升为稳定文档 [`docs/E0-ENGINEERING-BASELINE-AUDIT.md`](E0-ENGINEERING-BASELINE-AUDIT.md)。在该审计时点 E0 尚未通过全量 Gate，以下事实只表示基线和缺口已被验证：

  - 环境：Node `v24.18.0`、pnpm `12.5.1`；workspace、lockfile 和 strict TypeScript 基线存在。
  - 实际命令：`corepack pnpm typecheck` PASS；`corepack pnpm test` PASS（15 个文件 / 55 tests）；`corepack pnpm build` PASS（29 modules）；`corepack pnpm test:e2e` PASS（1 条 Electron E2E，约 23 秒）；`corepack pnpm audit --audit-level high` PASS（无已知漏洞）。
  - dev smoke：`127.0.0.1:43127` 返回 HTTP 200，Electron Renderer 成功加载，停止后端后端口已释放。
  - 预期缺口证据：`corepack pnpm run lint` 与 `corepack pnpm run package` 均为 `ERR_PNPM_NO_SCRIPT`；clean clone 验证未执行 / 未证明。
  - E0 交付物缺口：preload、最小 typed IPC、third-party WebContentsView 安全边界、GitHub Actions CI、deterministic fixture site、Electron Forge packaging 均缺失；ESLint / Prettier 与 `lint/package` root 命令也缺失。
  - Acceptance 矩阵：1（Renderer 无 Node integration）、2（context isolation）和 8（无未记录生产 credential）在当前 trusted Renderer / P0 基线下已满足；3（最小 typed preload API）、4（third-party WebContentsView 无 privileged preload）、5（CI）和 6（fixture variants）缺失；7（root commands 文档）部分满足；clean clone 不能由当前工作区证据替代。
  - Maintainer 决策：无。P0 产品行为、D0 设计契约、Electron / WebContentsView / BrowserDriver / SQLite 锁定架构和信任边界均未改变。后续 E0 全量 Gate 已另行完成。

- **E0.2 — 工具链、CI 与 Packaging 基线：已验收。** 独立 Gatekeeper 已返回 `GATEKEEPER: PASS`。在该切片验收时，本切片只补齐工程门禁和本机未签名 packaging，不扩展产品行为，也不单独宣称 E0 完成：

  - 独立 clean copy 验证：`corepack pnpm install --frozen-lockfile`、`corepack pnpm typecheck`、`corepack pnpm lint`、`corepack pnpm format:check`、`corepack pnpm ci:validate`、`corepack pnpm test`、`corepack pnpm build`、`corepack pnpm test:e2e` 和 `corepack pnpm package` 均 PASS。
  - CI contract 已验证 workflow 使用固定 Node / Corepack / pnpm、frozen lockfile、只读 `contents` 权限，并包含 typecheck、lint、format check、test 和 build；CI 不使用生产账号或真实服务。
  - dev smoke：`127.0.0.1:43127` 返回 HTTP 200，Electron Renderer 成功加载，停止开发服务后端口已释放；现有 P0 E2E 行为保持通过。
  - Packaging smoke：生成当前主机平台的本地未签名 Electron Forge 产物；ASAR 必须包含 `dist/main/index.js`、`dist/renderer/index.html` 和 manifest，并明确排除 root `index.html`、源码、测试、`.env` / 密钥、browser profile / auth state、本地数据库和测试结果。
  - 供应链检查：`corepack pnpm audit --audit-level high` PASS；未发现高严重度已知漏洞。E0.2 仍不包含 code signing、notarization、installer maker 或跨平台发布。
  - 交付物：ESLint、Prettier、root `lint` / `format:check` / `package` / `ci:validate`、GitHub Actions workflow、Electron Forge packaging 配置及命令文档已存在；在该切片之后 E0.3 的 preload / typed IPC / WebContentsView 安全壳和 E0.4 的 fixture site 仍待实现，随后已补齐。
  - Maintainer 决策：无。既有 Electron、React、WebContentsView、BrowserDriver、SQLite 和信任边界未改变。

- **E0.3 — Desktop Shell、typed IPC 与安全边界：已验收。** 独立 Gatekeeper 已返回 `GATEKEEPER: PASS`。在该切片验收时，本切片只补齐最小 shell boundary 和安全默认值，不扩展产品行为，也不单独宣称 E0 完成：

  - typed IPC / preload：新增最小 `ipc-contracts` 包、单一明确 channel、`contextBridge` 暴露的 typed `flowPilot.getShellInfo` API，以及可序列化的 `AppError` / result envelope；Renderer 不直接获得 Node、filesystem、shell、database、`webContents` 或任意 channel 能力。
  - 边界校验：main handler 在处理前校验 sender，使用 runtime schema 校验 payload，拒绝缺失、过期和额外字段，返回 typed `IPC_SENDER_NOT_TRUSTED` / `INVALID_IPC_PAYLOAD` / `IPC_HANDLER_FAILED`，内部错误不会泄漏敏感值。
  - third-party WebContentsView：具备独立 account partition、Node integration off、context isolation / sandbox / webSecurity on、无 privileged preload、deny-by-default permissions、popup 拒绝和 allowed-origin navigation / redirect 约束；third-party 页面不能读取 `flowPilot`、Node `process` 或 `require`。
  - 实际验证：`corepack pnpm test` PASS（64 tests）；IPC contract / sender / payload validation、trusted Renderer 与第三方 surface 安全配置测试 PASS；Electron security smoke PASS；Electron E2E PASS；dev 与 packaged Electron smoke PASS。
  - 工程回归：`corepack pnpm typecheck`、`corepack pnpm lint`、`corepack pnpm format:check`、`corepack pnpm build` 和 `corepack pnpm audit --audit-level high` 均 PASS；`corepack pnpm package` PASS，ASAR 检查确认入口、manifest 存在且排除 root `index.html`、源码、测试、Secret、auth state、数据库和测试结果。
  - Maintainer 决策：无。该切片之后 E0.4 fixture site、variants 和其确定性 WebContentsView E2E 仍待实现；随后已补齐并通过 E0 全量 Gate。

- **E0.4 — 本地确定性 Fixture Site：已验收。** 独立 Gatekeeper 已返回 `GATEKEEPER: PASS`。本切片只提供本地测试表面和安全隔离证据，不实现 BrowserDriver、Workflow Runtime、Repair、Human Takeover 或真实平台动作：

  - fixture package：新增 workspace package `@flowpilot/fixture-site`（`apps/fixture`），只监听 loopback，提供 `/health`、`/manifest` 和本地 fake upload asset；根命令 `fixture:dev` 默认使用 `127.0.0.1:43128`。
  - 9 个显式、可重放场景均已覆盖：`v1/normal`、`v1/upload`、`v1/publish-success`、`v1/publish-failure`、`v2/dom-change`、`v2/ambiguity`、`v2/interstitial`、`v3/auth-expired`、`v3/security-challenge`。
  - 端口边界：`FLOWPILOT_FIXTURE_PORT` 只能是 `1024–65535` 的整数，明确拒绝 P0 Renderer 端口 `43127`；不随机选端口、不静默回退，fixture smoke 结束后验证端口释放。
  - 实际 WebContentsView 隔离验证：Electron fixture smoke 在真实 `WebContentsView` 中逐场景加载，确认页面看不到 `window.flowPilot`、Node `process` 或 `require`，没有 privileged preload；独立 partition、权限、popup、越界导航和外部请求均保持拒绝。
  - 实际验证：fixture 单元 / server 测试 PASS（7 tests）；desktop 测试 PASS（64 tests）；Electron fixture security smoke PASS；P0 golden-path E2E PASS；Electron dev / packaged smoke PASS；`corepack pnpm install --frozen-lockfile` PASS；`corepack pnpm package` PASS；`corepack pnpm audit --audit-level high` PASS。
  - 约束与剩余边界：场景不访问外部网络、不使用生产 credential、不执行真实发布；在该切片验收时 E0 Acceptance 1–8 尚未进行独立全量 Gate，随后已由独立 Gatekeeper 完成。

- **E0 — Engineering Foundation 全量 Gate：已完成。** 独立 Gatekeeper 于 2026-09-21 基于 clean copy `HEAD 1864a73` 返回 `GATEKEEPER: PASS — E0 COMPLETE`，逐条确认 `docs/ACCEPTANCE.md` 的 E0 Acceptance 1–8 全部 PASS。该结论已把 E0 从“等待 Gate”推进为完成阶段，但不改变 E0 的范围边界，也不替代后续 E1 Gate：

  | Acceptance | 已验证事实与证据 |
  | --- | --- |
  | 1. Renderer 没有 Node integration | PASS：trusted Renderer 配置关闭 `nodeIntegration`；实际 third-party WebContentsView smoke 也确认页面拿不到 Node 能力。 |
  | 2. context isolation 开启 | PASS：trusted Renderer 与 third-party WebContentsView 均使用 context isolation / sandbox / webSecurity 安全配置，并有 Electron smoke 证据。 |
  | 3. preload API 最小且 typed | PASS：最小 `ipc-contracts`、sandbox-compatible preload、`contextBridge` typed `flowPilot.getShellInfo`、sender / payload runtime validation 和 typed error envelope 均已验证；没有通用任意 channel / filesystem / shell API。 |
  | 4. third-party WebContentsView 没有 privileged preload | PASS：真实 WebContentsView fixture smoke 逐场景确认 `window.flowPilot`、Node `process`、`require` 均为不可用；独立 partition、权限、popup、越界导航和外部请求均受控。 |
  | 5. CI 跑 typecheck / lint / test / build | PASS：GitHub Actions workflow 使用固定 Node / Corepack / pnpm 与 frozen install；CI contract、typecheck、lint、format、test、build 均通过。 |
  | 6. deterministic fixture site 支持所需 variants | PASS：`@flowpilot/fixture-site` 提供 9 个显式场景；fixture 7 tests、desktop 64 tests、Electron fixture smoke 和 P0 E2E 均通过。 |
  | 7. root commands 有文档 | PASS：README / `docs/DEVELOPMENT.md` 记录 install、dev、fixture、typecheck、lint、format、test、build、E2E、CI contract 和 package；`43127`、`43128` 及合法 `54321` 覆盖值 smoke 均验证并释放端口。 |
  | 8. 不依赖未记录的生产 credential | PASS：clean copy、fixture、E2E 和 package 均只使用 loopback / fake asset / 本地状态；audit high PASS；ASAR 检查 591 个文件，排除 root `index.html`、源码、测试、Secret、auth state、数据库和测试结果。 |

  全量验证证据：clean copy `corepack pnpm install --frozen-lockfile` PASS；`corepack pnpm typecheck` PASS；`corepack pnpm lint` PASS；`corepack pnpm format:check` PASS；`corepack pnpm ci:validate` PASS；`corepack pnpm test` PASS（fixture 7 + desktop 64）；`corepack pnpm build` PASS；Electron fixture smoke / security smoke / P0 E2E PASS；`corepack pnpm package` PASS（ASAR 591 files）；`corepack pnpm audit --audit-level high` PASS；端口 `43127`、`43128`、合法覆盖端口 `54321` 的启动、Renderer / fixture smoke 和释放均 PASS；`git diff --check`、尾随空白检查 PASS；Markdown 34 个文件 / 215 个相对链接 PASS。

  E0 范围边界保持明确：尚未实现 E1 Intent Compiler、真实 AI / 平台、生产 BrowserDriver、SQLite persistence、Repair、Human Takeover runtime 或生产账号；下一阶段只能按 `DEVELOPMENT-PLAN.md` 进入 E1，并需独立 E1 Gate。

- **E1.1 — Goal source / GoalPlan 基础编译：已验收。** 独立 Gatekeeper 已返回 `GATEKEEPER: PASS`。本切片只建立 Goal 的 provider-neutral、deterministic 编译边界，不宣称 E1 完成，也不实现 Task、Source、InputBundle、Workflow Runtime 或 SQLite persistence：

  - 交付物：workspace package `@flowpilot/goal-ir`；`GoalSource` / `GoalPlan` v1 schema、typed compiler / provider / error boundary、`GoalPlan` policy validation、revision compatibility decoder 和 append-only `InMemoryGoalRevisionStore`。
  - 版本与 provenance：source body 使用 SHA-256 source hash；source / plan revision 均记录 UTC ISO-8601 时间；source revision 与 compiled-plan revision 独立递增，source 变更产生新的 plan revision，旧 source / plan revision 可按版本读取和审计；不接入 SQLite。
  - Provider 与安全边界：provider-neutral `StructuredGoalProvider` 和 deterministic fixture provider 不访问网络或真实 credential；schema-invalid、schema-valid 但 policy-unsafe output、unsupported version、stale revision、provider failure 和 cancellation 均返回 typed failure，不静默接受、覆盖旧 revision 或泄漏内部错误。
  - 真实验证：`@flowpilot/goal-ir` 通过 14 个 goal-ir tests；fixture site 7 tests、desktop 64 tests 保持通过；独立 Gatekeeper 复核的 frozen install、typecheck、lint、format check、CI contract、build、Electron E2E、audit high 和 `git diff --check` 均 PASS。
  - E1 Acceptance 映射：1（Goal 普通 Markdown）、4（schema-validated versioned GoalPlan）、8（source 文本可读）、9（修改 source 生成新 revision）、10（旧 plan 可审计）、11（provider-neutral interface）、12（fake / deterministic provider）和 13（invalid / unsafe output 被拒绝）已由该切片证据覆盖；E1 Acceptance 2、3、5、6、7 仍待后续切片全量覆盖。
  - 范围边界：没有实现 Task source / TaskPlan、schedule、Goal/Source 语义解析、ambiguity UI、Source reference、InputBundle、真实 AI provider、网络、生产 credential 或 E2；E1 仍未完成。

必须包含：

- `design/README.md`
- `design/DESIGN-PRINCIPLES.md`
- `design/DESIGN-SYSTEM.md`
- `design/INTERACTION-MODEL.md`
- `design/COMPONENTS.md`
- `design/SCREEN-SPECS.md`
- `design/FLOWS.md`

至少覆盖：

- Intent Home
- AI Understanding Review
- 上下文式 Source Connection
- Input Preview
- Execution
- Confirmation / Human Takeover
- Result
- 渐进透明 / Inspector

## D0 之后的 Gate

**P0 — Interactive Mock Prototype**

使用 Mock service 构建 Electron + React 原型，不接真实 AI、微信、Git 解析或生产自动化。

黄金路径：

    Intent
    → Understanding
    → Source resolution
    → Input preview
    → Run
    → Human confirmation
    → Success
    → Inspect details

## P0 阶段明确不开始的能力

在 P0 验收前，不要投入大量精力到：

- 真实微信接入
- AI Repair
- 生产 BrowserDriver / CDP
- 复杂 SQLite 持久化
- Cloud runner
- Analytics / Dashboard
- Template marketplace
- Team / Billing

## P0 实现需保持的设计约束

- 遵守 D0.3 已定义的最小导航模型，不为内部实体或运行时能力增加永久顶层入口。
- 在主工作区以自然语言 / Markdown 表示 Intent 文档，并保持源文本可读、可编辑。
- 按 D0.3 和 D0.2 契约确定专业 Inspector 的深度与入口，只在上下文需要时披露。
- 显示语义实体绑定和影响，但不在普通路径暴露内部 ID、DSL 或机器语法。
- 按 D0.3 的 Understanding Review 规格控制默认结构化内容，避免配置表单化。
- 编辑已有 Task / Goal 时回到自然语言 Source，而不是只编辑编译后的解释。

## 下一推荐切片

**E1.2 — Task source / TaskPlan 基础编译切片**（`work/E1.2-task-plan-foundation.md`）

在已验收的 Goal IR 边界上，建立普通 Markdown Task source → schema-validated versioned TaskPlan 的最小 provider-neutral、deterministic 闭环；只覆盖 Task source / revision、TaskPlan v1、自然语言 trigger / timing 的结构化表达和可审计 revision，不提前实现 Source、InputBundle、调度执行、Workflow、真实 AI 或 E2。

## 当前短期工作队列

E0 已完成，E0 全量 Gate packet 已退休；E1.1 已验收并退休；当前只保留一个有界 E1 实现包，它不是第二套 Roadmap：

- **E1.2**：[`work/E1.2-task-plan-foundation.md`](../work/E1.2-task-plan-foundation.md)（下一步，未开始）

## 当前 Handoff

### 角色

State Keeper

### 任务

E1.1 Goal source / GoalPlan 基础编译验收后的状态同步与 E1.2 下一切片交接。

### 已完成

- 独立 Gatekeeper 对 E1.1 返回 `GATEKEEPER: PASS`；`@flowpilot/goal-ir` 的 GoalSource / GoalPlan v1、SHA-256 / UTC provenance、独立 append-only revision、provider-neutral deterministic provider、schema / policy typed rejection 和 in-memory store 均已验证。
- E1.1 通过 14 个 goal-ir tests；fixture site 7 tests、desktop 64 tests 以及 Gatekeeper 复核的 frozen install、typecheck、lint、format、CI contract、build、Electron E2E、audit high 和 `git diff --check` 均 PASS。
- E1.1 packet 已退休；E1.2 Task source / TaskPlan 基础编译 packet 已建立。E1 仍未完成。

### 变更文件

- `docs/PROJECT-STATE.md`
- `docs/E0-ENGINEERING-BASELINE-AUDIT.md`
- `docs/MANUAL-ACCEPTANCE.md`
- E1.1 Goal source / GoalPlan packet（已退休）
- `work/E1.2-task-plan-foundation.md`

E1.1 已验收产物：`packages/goal-ir/`、`package.json`、`pnpm-lock.yaml`。

### 已执行验证

- E1.1 Gatekeeper 证据：`@flowpilot/goal-ir` 14 tests、fixture 7 tests、desktop 64 tests；frozen install、typecheck、lint、format、CI contract、build、Electron E2E、audit high 和 `git diff --check` 均 PASS。
- 本轮 State Keeper 验证：文档相对链接、尾随空白、`git diff --check` 均 PASS；已确认 E1.1 packet 删除且没有残留引用。

### 验收映射

- E0 Acceptance 1–8：PASS，详见本文件的 E0 全量 Gate 矩阵。
- E1.1：覆盖 E1 Acceptance 1、4、8、9、10、11、12、13；E1 Acceptance 2、3、5、6、7 尚待后续 Task / semantic resolution 切片完成。
- E1：进行中但尚未完成；E1.2 仅作为下一有界实现包，不代表 E1 已通过。

### 产品 / 架构 / 安全说明

本轮只同步 E1.1 已验证事实和执行队列，没有实现 E1.2，也没有改变 Electron、WebContentsView、BrowserDriver、IPC、持久化或信任边界。E1.1 仅使用 in-memory store、deterministic fixtures、无网络 / 无真实 provider / 无生产 credential；SQLite、Source、InputBundle 和运行时仍未开始。

### 已知限制

E1 Task source / TaskPlan、完整 Goal / Task semantic reference、ambiguity clarification、真实 AI provider、Source / InputBundle、Workflow Runtime、Repair、Human Takeover runtime、真实平台和 production persistence 均尚未实现。

### 剩余工作

执行 `work/E1.2-task-plan-foundation.md`，通过 Plan Guard → Builder → Gatekeeper → State Keeper 闭环；不得提前开始 E2。

### 下一推荐切片

`work/E1.2-task-plan-foundation.md`

### 阻塞项 / 所需 Maintainer 决策

无。
