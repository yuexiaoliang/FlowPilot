# FlowPilot 验收规范

本文件定义**什么才算完成**。

一个阶段只有在验收条目有证据支持时才算完成。只有代码、截图或说明文字都不足以证明通过。

---

# 全局完成定义

适用的变更必须满足：

## 产品一致性

- 遵守 PRODUCT-MODEL.md
- 遵守 NATURAL-LANGUAGE-UX.md
- 普通用户不需要学习内部 ID / DSL
- 默认界面保持简单
- 需要时可以查看专业细节

## 代码质量

- 有代码时 TypeScript strict 必须通过
- 不允许无说明的 `any`
- 保持架构边界
- 外部 / 持久化 / 模型输入做 runtime validation
- failure 必须 typed / actionable

## 测试 / 证据

- 有相关测试
- 修复缺陷时增加 regression test
- CI 不依赖生产账号
- handoff 中明确指出 Acceptance 证据

## 安全

- 不提交 / 记录 Secret
- 默认不把 session / auth 数据发给 AI
- remote content 不获得 Node / filesystem / shell 权限
- 不绕过安全验证

## 文档

行为、架构、产品语义、验收标准变化时更新规范文档。

## 运行事实

- 外部操作按需支持 timeout / cancellation
- failure 不会静默变 success
- evidence / provenance 可检查
- 敏感字段会被脱敏

---

# D0 — 设计契约验收

D0 完成条件：

1. 所有要求的 `design/` 合同文档存在。
2. “默认简单，按需透明”被明确写出并可操作化。
3. Intent Home 是主要入口，不是密集 Dashboard。
4. 自然语言 / Markdown 是主要创作方式。
5. 普通流程不要求 ID、DSL、cron、selector、workflow node 或机器配置。
6. Simple / Execution / Inspection 三层定义清楚。
7. 渐进披露规则明确哪些默认隐藏、哪些可检查。
8. 上下文 UI 规则覆盖 Source connection、ambiguity、confirmation、takeover、repair、专业详情。
9. 组件规范覆盖 idle / loading / success / failure / paused / disabled 等适用状态。
10. Screen spec 覆盖 DEVELOPMENT-PLAN 中的 golden screens。
11. Golden user flow 有完整端到端文档。
12. ImageGen mockup 仅作为视觉参考，文字规范才是实现权威。
13. 之前密集 SaaS / Dashboard 探索稿明确标记为非规范。
14. Reviewer 无需自己补设计，就能判断实现是否符合合同。

必须有：

- 已提交 Design Contract
- Reviewer 对 D0 条目的检查 / 映射

---

# P0 — 交互式 Mock 原型验收

P0 完成条件：

1. Electron + React 原型可启动。
2. 使用确定性 Mock，不依赖真实 AI / WeChat / Git / backend automation。
3. 用户可以用普通自然语言描述示例任务。
4. FlowPilot 展示简洁的 AI Understanding Review。
5. 只有因为 Source 缺失 / 未连接时才出现 Source connection。
6. Source 授权不暴露内部 ID。
7. Input Preview 展示本次真正选中的 article / cover。
8. 模拟执行默认只显示有用进度。
9. 不可逆发布前必须显式确认。
10. 成功态刻意保持极简。
11. 用户可以在成功后展开专业详情。
12. 专业详情展示 Mock provenance：TaskPlan / GoalPlan / Flow revision、Source version、InputBundle / run timeline。
13. 技术细节不永久暴露在默认路径。
14. 导航和页面密度符合 D0 合同。
15. 不需要额外解释隐藏 UI 规则，就能演示完整黄金路径。

必须有：

- 适用的 build / typecheck 自动验证
- screenshot / video 或 deterministic E2E walkthrough
- design-contract review
- handoff 中记录发现的可用性问题

---

# E0 — 工程基础验收

从 clean clone 可以运行：

    pnpm install
    pnpm typecheck
    pnpm lint
    pnpm test
    pnpm build
    pnpm dev

另外：

1. Renderer 没有 Node integration。
2. context isolation 开启。
3. preload API 最小且 typed。
4. third-party WebContentsView 没有 privileged preload。
5. CI 跑 typecheck / lint / test / build。
6. deterministic fixture site 支持所需 variants。
7. root commands 有文档。
8. 不依赖未记录的生产 credential。

---

# E1 — 意图编译器验收

1. Goal 可以写成普通 Markdown。
2. Task 可以写成普通 Markdown。
3. 不要求内部 ID / DSL / cron。
4. Goal source 编译成 schema-validated versioned GoalPlan。
5. Task source 编译成 schema-validated versioned TaskPlan。
6. 无歧义语义引用解析到稳定内部实体。
7. 实质歧义返回 structured clarification requirement。
8. 面向用户文本离开 FlowPilot 后仍可读。
9. 修改 Markdown 会产生新的 compiled-plan revision。
10. 旧 plan revision 仍可审计。
11. Provider 通过 provider-neutral interface。
12. fake / deterministic compiler provider 支持 CI。
13. unsafe / invalid structured model output 会被拒绝。

必须证明：

- natural-language fixture → structured plans
- ambiguity fixture → clarification
- modified source → revision N+1

---

# E2 — Source / InputBundle / 调度验收

1. Local Folder Source 明确授权并限制范围。
2. Local Git Repository Source 明确授权并限制范围。
3. 自然语言不能把文件访问扩大到已授权 Source 之外。
4. Flow 执行前完成 Source resolve。
5. Run 获得不可变 InputBundle。
6. InputBundle 创建后修改 Source 文件，不会静默改变正在运行的 Run。
7. Git provenance 记录 exact commit SHA + selected paths / hashes。
8. 执行前校验 Goal 必需 inputs。
9. 缺失 input 按显式 Task policy 处理。
10. 同一逻辑 input / destination 的重复不可逆发布会被 deterministic idempotency 阻止。
11. failed Run 不会错误推进 consumption state。
12. successful Run 记录 exact TaskPlan、GoalPlan、Source snapshot、InputBundle 和 destination provenance。
13. 当天无内容可以以 typed reason 结束为 SKIPPED，而不是 FAILED。
14. 自然语言 schedule 标准化时明确 timezone。
15. 支持 SKIP 和 RUN_ON_NEXT_START missed-schedule semantics。
16. 测试只使用本地 fixture。

---

# E3 — 确定性 Workflow 运行时验收

1. Workflow IR 可验证。
2. 完整 fixture flow 通过 BrowserDriver 执行。
3. happy path 不调用 LLM。
4. 每个有意义 Step 验证 postcondition。
5. target 缺失 → TARGET_NOT_FOUND。
6. target 歧义 → TARGET_AMBIGUOUS。
7. unexpected state / navigation → typed failure。
8. successful Run 记录 step evidence。
9. failed Run 记录 typed context。
10. browser-library object 不泄漏到持久化 Workflow IR。
11. BrowserDriver contract tests 通过。
12. 至少一个 E2E fixture run 通过。

---

# E4 — AI 发现 / 修复验收

以下自动场景全部通过才算完成：

1. 启动 fixture v1。
2. discover / compile 有效 Flow。
3. 执行成功。
4. 再执行一次且零 model call。
5. 切换 fixture v2。
6. 旧 Flow 在局部产生 typed failure。
7. 创建 bounded RepairContext。
8. Repair 提出 local patch。
9. Patch 通过 schema / policy validation。
10. Candidate trial-executed。
11. 到达预期状态。
12. 保存 revision N+1。
13. revision N 仍存在。
14. revision N+1 再执行成功。
15. 第二次成功为零 model call。

另外：

- Secret / session state 不进入 model context。
- Repair 不能覆盖 hard-stop safety policy。
- invalid repair 不影响旧 Flow。
- repair provenance / diff 可检查。

---

# E5 — Human Takeover / 风险验收

1. CAPTCHA fixture 暂停自动化。
2. MFA / security fixture 暂停自动化。
3. QR login 可请求 takeover。
4. Runtime 不会让 AI 绕过这些控制。
5. 用户可以手工操作。
6. 交回控制后重新 snapshot。
7. 只有验证为已知安全状态才恢复。
8. unsafe / unknown state 不自动恢复。
9. destructive confirmation 可以在执行前暂停。
10. rate limit 使用 backoff / pause，而不是快速重试。
11. 默认 UI 保持简单，同时专业详情能解释暂停原因。

---

# E6 — 微信公众号 MVP 验收

真实平台验证使用受控测试账号，不要求 CI 自动完成。

1. 可以添加 account / platform。
2. 官方页面在隔离的 persistent session 中打开。
3. 用户手工完成 QR login。
4. 有效 session 可以跨 App restart 复用。
5. 已学习并持久化的 article Flow 能打开 editor。
6. title 可写入。
7. body 可写入。
8. cover / summary 在适用时可写入。
9. Run 能到 publish confirmation。
10. 不可逆 publish 遵守 confirmation policy。
11. Success 根据 platform / page state 验证，而不是 click 不报错。
12. login expiry 变成 typed intervention state。
13. 小幅兼容 UI 变化可以 bounded repair。
14. 不尝试 CAPTCHA / MFA / security / stealth bypass。
15. Run evidence 能定位 exact input / source / Flow。

---

# 发布验收

可分发版本还需要：

- supported targets 的 packaging smoke test
- 不打包 development secret
- 从上一 release 的 migration path 测试
- startup smoke test
- application-data location 文档
- account / source removal 行为 Review
- release notes / version
- 面向公众分发时 code signing

---

# 验收权威顺序

1. Maintainer 的直接决定
2. accepted ADR
3. 本规范
4. DEVELOPMENT-PLAN.md
5. 产品 / 设计 / 架构 / 安全文档
6. Task Packet / Issue

Task Packet / Issue 可以更严格，但不能静默降低 Gate 标准。
