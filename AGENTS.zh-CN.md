# AGENTS.md 中文镜像

> 本文件仅供中文阅读。Codex 的规范源是仓库根目录的 [AGENTS.md](./AGENTS.md)。如果两者冲突，以英文版为准。

## 必读顺序

开始任何工作前，阅读：

1. `docs/PROJECT-STATE.md`
2. `docs/DEVELOPMENT-PLAN.md`
3. `docs/ACCEPTANCE.md`
4. `docs/AGENT-OPERATING-PROTOCOL.md`
5. `docs/PRODUCT-MODEL.md`
6. `docs/NATURAL-LANGUAGE-UX.md`
7. `docs/TASK-SOURCE-RUNTIME.md`
8. 与当前任务相关的设计、架构、安全、领域文档和 ADR

FlowPilot 是**文档驱动，而不是 Issue 驱动**。GitHub Issues 只是可选协作工具。

## 使命

将 FlowPilot 构建为一个意图优先的桌面自动化运行时。

用户用自然语言 / Markdown 表达结果和规则。FlowPilot 将意图编译成结构化计划，解析经过授权的 Source，执行确定性、可版本化的 Flow，并在适合的环节使用 AI 做理解、发现和修复。

架构必须避免绑定某个特定 LLM 厂商、浏览器自动化库或目标平台。

## 不可违反的产品规则

1. **默认简单，按需透明。**
2. **自然语言是控制层。** 普通用户不能被要求编写内部 ID、`@goal/...`、`@source/...`、cron、selector、workflow node 或另一套 FlowPilot DSL。
3. **用户写语义，系统保存引用。**
4. **Goal、Task、Source、InputBundle、Flow、Run 必须分离。**
5. **UI 是上下文式的，而不是配置优先。**
6. **专业细节必须可以检查。** 简单不能变成黑箱。
7. **实现阶段不得重新设计已确定的产品方向。**

## 不可违反的运行时规则

8. **确定性运行时优先。**
9. **所有浏览器操作必须经过 BrowserDriver。**
10. **Workflow 数据必须版本化并经过 Schema 校验。**
11. **有意义的 Step 必须包含前置/后置条件。**
12. **Repair 默认只做局部修复。**
13. **Human Takeover 是一等运行时状态。**
14. **禁止反风控规避功能。**
15. **远程网页内容是不可信输入。**
16. **Secret 默认不得进入 AI prompt。**
17. **Source 权限必须显式、最小化。**
18. **执行前先解析 Source。** Run 使用不可变 InputBundle。
19. **定时不可逆操作必须具备幂等/去重能力。**
20. **禁止隐藏式 fallback。** 不确定性必须转成明确的 failure / clarification / intervention。

## 架构变更规则

以下已锁定基线发生变化时必须走 ADR：

- Electron
- React
- WebContentsView
- BrowserDriver 边界
- 持久化模型
- Workflow IR 语义
- 信任/安全边界

## 事实源优先级

发生冲突时：

1. Maintainer 的直接决定
2. 已接受 ADR
3. `docs/ACCEPTANCE.md`
4. `docs/DEVELOPMENT-PLAN.md`
5. `docs/PROJECT-STATE.md`（当前阶段/状态）
6. 产品 / 设计 / 架构 / 安全文档
7. Task Packet
8. GitHub Issue / 临时任务说明

## Codex 执行规范

FlowPilot 默认以 **OpenAI Codex** 作为开发 Agent 框架。

优先使用 Codex 原生机制：

- `AGENTS.md`
- `.codex/agents/*.toml`
- `.codex/config.toml`
- 只有在有明确重复价值时才引入 Codex skills / MCP / hooks

对于“继续开发”“继续”“按计划开发”或指定 Task Packet 等非 trivial 请求，主 Codex 必须执行：

    plan_guard
    → builder（或主线程承担 Builder）
    → gatekeeper
    → state_keeper（仅在 GATEKEEPER: PASS 后）

要求：

1. 实现前必须调用 `plan_guard`。
2. 一次只完成一个 bounded slice。
3. 实现后必须调用 `gatekeeper`。
4. FAIL 时只修阻塞项，然后重新 Gatekeeper。
5. FAIL 时不得调用 `state_keeper`。
6. PASS 后必须调用 `state_keeper`。
7. 除非 Maintainer 明确要求多个 slice，否则一轮验收一个 slice 后停止。

Builder 默认是强通才 Agent，不要无必要建立永久的技术 Specialist。

## 双语文档规则

英文稳定文档是规范源；中文是同步阅读镜像。具体见 `docs/DOCUMENTATION-POLICY.md`。

如果当前任务实质修改了长期双语文档，Builder 应同步修改中文镜像，Gatekeeper 在验收时检查这一点。

## 完成定义

一个任务只有同时满足以下条件才算完成：

- 实现/设计产物已存在
- 实际执行了相关验证
- Acceptance 条目映射到证据
- 项目状态在需要时已同步
- 给下一位 Agent 留下了 handoff

“我这里能跑”或“看起来不错”都不是充分的完成标准。