# FlowPilot Codex Agent 执行协议

本协议用于让不同 Codex 会话、不同主 Agent 可以持续、稳定地推进开发。

## 原则

**仓库是共享记忆。**

一个新的 Main Agent 不需要聊天历史，也应该能通过仓库判断当前切片、完成实现、获得独立验收、更新状态并留下 handoff。

## 最小控制闭环

使用 `.codex/agents/` 中四个项目级 Codex custom agents：

    Plan Guard
       ↓
    Builder
       ↓
    Gatekeeper
       ↓
    State Keeper

通常：

- Main Agent 负责调度闭环
- Main Agent 可以自己承担 Builder
- Plan Guard、Gatekeeper、State Keeper 提供必要的职责分离
- 没有明确需要时，不增加永久技术 Specialist

## 必读顺序

开始前：

1. `AGENTS.md`
2. `docs/PROJECT-STATE.md`
3. `docs/DEVELOPMENT-PLAN.md`
4. `docs/ACCEPTANCE.md`
5. 如果有指定 Task Packet，则读取它
6. 当前阶段相关的产品 / 设计 / 架构 / 安全文档
7. 相关 ADR

已有仓库事实时，不依赖聊天历史。

## 步骤 1 — Plan Guard

实现前必须确定：

- 当前阶段
- 当前最小正确未完成切片
- 前置条件
- 对应 Acceptance
- 明确的 out-of-scope

如果用户指定任务与当前 Gate / 规范冲突，应停止并说明冲突。

使用 Codex custom agent `plan_guard`。它不实现代码。

## 步骤 2 — Builder

实现一个 bounded slice。

规则：

- 完成完整垂直切片，不只改零散文件
- 不提前开始相邻未来工作
- 不修改 Acceptance 来迁就实现
- 不添加没有当前需求的抽象
- 遵守设计、架构、安全和产品边界
- 执行适用验证
- 只报告真正执行过的验证

可以使用 Codex custom agent `builder`，也可以由主线程承担 Builder。

默认是强通才 Builder，不要把日常任务拆成永久技术 Specialist。

## 步骤 3 — Gatekeeper

使用 `gatekeeper` 独立检查实际产物 / diff 是否满足当前 Acceptance。

Gatekeeper 只返回：

- PASS
- FAIL + blocking gaps

只要必需 Acceptance 仍失败，就不能进入下一切片。

“看起来不错”或 Builder 自己说完成都不是证据。

## 步骤 4 — State Keeper

只有 Gatekeeper PASS 后才使用 `state_keeper`。

它负责：

- 必要时更新 `PROJECT-STATE.md`
- 只有验证通过才推进阶段 / slice
- 维护 `work/` 的短期执行队列
- 删除 / 退役已完成 Task Packet
- 只在需要时创建 / 调整接下来 1–3 个 Task Packet

State Keeper 不实现产品代码，也不重新规划产品方向。

## Task Packet

Task Packet 是可选执行辅助。

在以下情况建议使用 `TASK-PACKET-TEMPLATE.md`：

- 任务范围容易误解
- 多个 Agent 可能独立工作
- Acceptance 映射需要明确

`work/` 不是第二套 Roadmap，应始终能从规范文档重建。

## 任务大小

一轮闭环通常只交付一个可 Review 的垂直切片。

合理：

- 完成 Design Contract 中的一层
- 实现 Intent → Understanding 的 Mock 交互
- 实现 LocalFolderSource + 测试
- 实现一个 BrowserDriver contract slice

不合理：

- “把整个 App 做完”
- 同时改设计、迁移存储、接真实平台
- 做与当前 Acceptance 无关的大范围清理

## 临时研究 / 评审 subagent

只有有明确收益时 Builder 才使用临时 subagent，例如：

- 聚焦安全 Review
- 调查不确定的 Electron/CDP/库行为
- 高风险决策的独立第二意见
- 大量隔离分析，避免污染 Builder 上下文

临时 helper：

- 不拥有 Roadmap 状态
- 不修改 Acceptance
- 默认不沉淀为永久 Agent 文件
- 返回结论给 Builder / Main Agent 集成

## 架构 / 设计漂移

实现与规范冲突时：

1. 修改实现以符合规范；或
2. 如果规范本身确实错误，走 ADR / 设计决策变更，并同步修改受影响规范。

不能静默偏离。

## 并行开发

多个主 Agent 并行时：

- 使用独立 branch / worktree
- 分配互不重叠的 Task Packet
- 避免并发修改 PROJECT-STATE / work queue
- 先合并规范变化，再合并依赖它的实现
- 上游合并后重新读取 PROJECT-STATE

## 交接

每个 bounded slice 完成后使用 `HANDOFF-TEMPLATE.md`。

必须说明：

- 改了什么
- 实际执行了哪些验证
- Acceptance 映射
- 已知限制
- 剩余工作
- 推荐下一切片

## 只在真正需要时升级给 Maintainer

以下情况才询问 Maintainer：

- 产品意图存在实质歧义
- 需要修改已锁定架构
- 安全 / 隐私 tradeoff 需要人的决定
- 规范文档互相冲突且会改变行为
- 涉及不可逆外部操作

仓库已经有答案的问题不要再问。

## 自治成功标准

当 Maintainer 只说：

> 继续开发。

Main Agent 就能执行 Plan Guard → Builder → Gatekeeper → State Keeper，并正确进入下一步，说明机制达标。
