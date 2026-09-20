# Task Packet 模板

需要给 Agent 一个边界清晰的执行任务时，可以复制本模板。

Task Packet 可以放在 PR 描述、临时工作说明或 `work/` 文档中，不必变成 GitHub Issue。

---

# <Task ID>: <简短名称>

## 角色

Builder | Reviewer | Planner

## 阶段

例如：D0 — Design Contract

## 目标

用一两句话说明具体要交付什么。

## 为什么现在做

说明它推进哪个当前 Gate / 前置目标。

## 规范参考

必须读取：

- AGENTS.md
- PROJECT-STATE.md
- DEVELOPMENT-PLAN.md
- ACCEPTANCE.md
- 当前任务相关的设计 / 架构文档

## 范围内

- ...
- ...

## 范围外

- ...
- ...

## 预期文件 / 产物

- ...
- ...

## 约束

列出不可违反的产品 / 架构 / 安全 / 设计规则。

## 验收映射

明确指出该任务需要满足哪些验收条目。

例如：

    Acceptance: D0.1, D0.3, Global Definition of Done

## 验证

列出需要实际执行的命令 / Review / 证据。

例如：

    pnpm typecheck
    pnpm test

设计任务还应：

- 对照 DESIGN-PRINCIPLES
- 检查所有必需状态
- 检查 simple / professional disclosure hierarchy

## 停止条件

以下情况停止并升级，而不是猜：

- ...
- ...

## 交接

使用 `docs/HANDOFF-TEMPLATE.md`。
