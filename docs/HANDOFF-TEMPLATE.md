# Agent 交接模板

每个 bounded FlowPilot Agent 任务结束时使用。

## 角色

Builder | Reviewer | Planner

## 任务

本轮完成的是哪个 bounded task？

## 已完成

- ...
- ...

## 变更文件

- ...

## 已执行验证

列出真实执行的检查和结果。

例如：

    pnpm typecheck — PASS
    pnpm test — PASS
    prototype golden path — PASS (manual)

没有真正执行的检查不能写 PASS。

## 验收映射

写出实际满足的条目和证据。

- D0.1 — PASS, evidence: ...
- P0.4 — PARTIAL, remaining: ...

## 产品 / 架构 / 安全说明

记录实质影响或决策。

## 已知限制

哪些问题有意留到后续？

## 剩余工作

当前阶段还缺什么？

## 下一推荐切片

推荐下一个最小 coherent task。

## 阻塞项 / 所需 Maintainer 决策

没有就写 `None`。
