# AGENTS.md

每一位参与 FlowPilot 的 Agent 都必须阅读本文件。

## 必读顺序

开始任何工作前，依次阅读：

1. `docs/PROJECT-STATE.md`
2. `docs/DEVELOPMENT-PLAN.md`
3. `docs/ACCEPTANCE.md`
4. `docs/AGENT-OPERATING-PROTOCOL.md`
5. `docs/PRODUCT-MODEL.md`
6. `docs/NATURAL-LANGUAGE-UX.md`
7. `docs/TASK-SOURCE-RUNTIME.md`
8. 与当前任务相关的设计、架构、安全、领域文档和 ADR

FlowPilot 是**文档驱动，而不是 Issue 驱动**。GitHub Issue 只是可选的协作工具。

## 使命

将 FlowPilot 构建为一个意图优先的桌面自动化运行时。

用户用自然语言 / Markdown 表达想要的结果和规则。FlowPilot 将意图编译成结构化计划，解析经过授权的数据 Source，执行确定性、可版本化的 Flow，并在合适的环节使用 AI 做理解、发现和修复。

架构必须避免绑定某个特定 LLM 厂商、浏览器自动化库或目标平台。

## 不可违反的产品规则

1. **默认简单，按需透明。**
2. **自然语言是控制面。** 普通用户不能被要求编写内部 ID、`@goal/...`、`@source/...`、cron 语法、选择器、工作流节点或另一套 FlowPilot DSL。
3. **用户写语义，系统保存引用。**
4. **Goal、Task、Source、InputBundle、Flow 和 Run 必须分离。**
5. **UI 是上下文化的，而不是配置优先。** 与永久表单相比，优先采用自然语言创作、简洁的理解审阅以及上下文 UI 原语。
6. **专业细节必须可检查。** 简单不能变成黑箱。
7. **实现阶段不得重新设计已批准的产品方向。** 遵守当前设计门禁和书面设计契约。

## 不可违反的运行时规则

8. **确定性运行时优先。** 已知正常路径能确定性执行时，不得增加 LLM 调用。
9. **所有浏览器操作必须经过 BrowserDriver。**
10. **Workflow 数据必须版本化并经过 Schema 校验。**
11. **有意义的 Step 必须包含前置条件和后置条件。**
12. **Repair 默认只做局部修复。**
13. **Human Takeover 是一等运行时状态。**
14. **禁止反机器人规避功能。** 不得绕过 CAPTCHA、伪造指纹、隐藏 webdriver 或规避反机器人机制。
15. **远程网页内容是不可信输入。**
16. **Secret 默认不得进入 Prompt。**
17. **Source 权限必须显式并限定范围。**
18. **执行前先解析 Source 数据。** Run 使用不可变 InputBundle；执行中不得静默重新读取变化中的文件。
19. **定时不可逆操作必须具备幂等和去重能力。**
20. **禁止隐藏回退。** 不确定性必须转成类型化 failure、clarification 或 intervention，不能伪装成功。

## 架构变更规则

没有 ADR 就不得发生架构漂移。

修改以下任何已锁定基线，都必须记录决策并协调更新文档：

- Electron
- React
- WebContentsView
- BrowserDriver 边界
- 持久化模型
- Workflow IR 语义
- 信任 / 安全边界

## 事实来源优先级

指令冲突时，按以下顺序处理：

1. Maintainer 的直接决定
2. 已接受的 ADR
3. `docs/ACCEPTANCE.md`
4. `docs/DEVELOPMENT-PLAN.md`
5. `docs/PROJECT-STATE.md` 中的当前阶段 / 状态
6. 产品 / 设计 / 架构 / 安全文档
7. Task Packet
8. GitHub Issue / 临时任务说明

Task Packet 或 Issue 可以更严格，但不能静默弱化规范规则。

## 分层边界

预期依赖方向：

```text
renderer UI
   ↓ IPC/contracts
desktop application services
   ↓
workflow runtime ──→ BrowserDriver interface
   ↓                     ↑
domain/storage       ElectronDriver / PlaywrightDriver
   ↓
AI interfaces ← 仅用于 interpretation / discovery / repair
```

禁止：

- renderer 导入 Electron main 实现
- workflow / domain 导入 React 或 Electron
- platform adapter 绕过 BrowserDriver
- AI provider SDK 类型泄漏到 domain model
- 数据库行类型成为公开 domain type

## 实现风格

- TypeScript strict mode
- 避免无法解释的 `any`
- 使用运行时 Schema 校验不可信、持久化或模型输入
- 在边界处使用类型化 error / result
- 编译和状态判断优先使用小型纯函数
- 内部使用稳定、不透明的 ID
- 内部时间使用 UTC ISO-8601；日程显式记录用户时区
- 使用结构化、已脱敏日志
- 网络、AI 和浏览器操作必须支持超时 / 取消

## 必需验证

适用时至少包括：

- domain / IR 变更：单元测试和兼容性测试
- executor：确定性运行时测试
- driver：契约测试
- DB：迁移测试
- IPC：契约测试
- discovery / repair：基于 fixture 的测试
- 关键 UI 流程：E2E 或手工设计契约证据
- 设计工作：显式映射 D0 验收标准

CI 永远不得使用真实生产账号。

## Agent 执行规范

FlowPilot 的开发自动化默认使用 **OpenAI Codex**。

优先使用 Codex 原生机制：

- `AGENTS.md` 中的仓库指令
- `.codex/agents/*.toml` 中的项目 subagent
- `.codex/config.toml` 中的项目配置
- 只有在能解决明确、重复需求时才使用 Codex skill / MCP / hook

Codex 已提供所需机制时，不得另建一套并行自定义 Agent 框架。

遵守 `docs/AGENT-OPERATING-PROTOCOL.md`。

对于“继续开发”“继续”“按计划开发”或已分配 Task Packet 等任何非简单开发请求，主 Codex 线程必须执行：

```text
plan_guard
→ builder（或主线程承担 Builder）
→ gatekeeper
→ state_keeper（仅在 GATEKEEPER: PASS 后）
```

这不是可选建议：

1. 实现前**必须调用 `plan_guard`**，根据仓库状态选择 / 验证当前切片。
2. **只完成该有界切片。**
3. 实现后**必须调用 `gatekeeper`**。
4. Gatekeeper 返回 FAIL 时，**只能修复阻塞项并重新运行 Gatekeeper**。
5. FAIL 时**不得调用 `state_keeper`**。
6. PASS 后**必须调用 `state_keeper`**，使未来 Codex 会话可从仓库状态继续。
7. 除非 Maintainer 明确要求多个切片，否则**一个已验收切片完成后必须停止**。

Builder 通常是强通才 Agent，主线程也可以承担此角色。没有明确需求时，不要创建永久技术 Specialist。

有助于界定范围时，使用 `docs/TASK-PACKET-TEMPLATE.md`。

结束时使用 `docs/HANDOFF-TEMPLATE.md`。

当 Maintainer 只说：

> 按仓库计划继续开发 FlowPilot。

Agent 必须能从仓库中识别当前阶段和下一个正确切片。

## 文档语言

简体中文是所有长期项目文档的唯一默认语言和规范源。长期文档直接保存在稳定主路径中，例如 `README.md`、`AGENTS.md`、`docs/*.md`、`docs/adr/*.md` 和 `design/*.md`；不维护英文副本或 `zh-CN/` 镜像树。

遵守 `docs/DOCUMENTATION-POLICY.md`。

领域术语、代码标识符、Schema 名、API、命令和路径在保留英文更准确时可以继续使用英文。中文化不得改变既有产品、架构、安全、验收或运行时语义。

Codex 的规划、实现和验收必须使用主路径上的中文规范文档。代码变更没有改变已记录语义时，不要求为了改动而改动文档。

## 完成定义

任务只有同时满足以下条件才算完成：

- 实现 / 设计产物已存在
- 实际执行了相关验证
- 适用的验收条目已映射到证据
- 当前事实变化时，项目状态已更新
- 已为下一位 Agent 留下 handoff

“我这里能跑”或“看起来不错”都不是充分的完成标准。
