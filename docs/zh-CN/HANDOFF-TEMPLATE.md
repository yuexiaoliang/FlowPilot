# Agent Handoff 模板

> [English canonical](../HANDOFF-TEMPLATE.md)

每个 bounded FlowPilot Agent 任务结束时使用。

## Role

Builder | Reviewer | Planner

## Task

本轮完成的是哪个 bounded task？

## Completed

- ...
- ...

## Files changed

- ...

## Validation performed

列出真实执行的检查和结果。

例如：

    pnpm typecheck — PASS
    pnpm test — PASS
    prototype golden path — PASS (manual)

没有真正执行的检查不能写 PASS。

## Acceptance mapping

写出实际满足的条目和证据。

- D0.1 — PASS, evidence: ...
- P0.4 — PARTIAL, remaining: ...

## Product / architecture / security notes

记录实质影响或决策。

## Known limitations

哪些问题有意留到后续？

## Remaining work

当前阶段还缺什么？

## Recommended next slice

推荐下一个最小 coherent task。

## Blockers / maintainer decisions needed

没有就写 `None`。