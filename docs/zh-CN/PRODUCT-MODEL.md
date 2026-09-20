# FlowPilot 产品模型

> [English canonical](../PRODUCT-MODEL.md)

FlowPilot 是一个**意图优先**的自动化运行时。

用户用自然语言表达**语义**。FlowPilot 将这些语义编译成结构化、可版本化、可由机器确定性执行的产物。

> 越接近人，越自然语言。
> 越接近执行，越结构化、越确定。

## 核心原则

**用户写语义，系统保存引用。**

普通用户不应该需要写：

- `@goal/publish-wechat`
- `source://industry-learning`
- `goal_01JXYZ...`

这些都是实现细节。

用户只需要写自然语言任务，例如：

    # 每天发布行业文章
    每天早上 8 点检查我的行业学习内容。
    如果今天有新的文章，就发布到微信公众号。
    数据来自我的行业学习仓库。
    正式发布之前让我确认。

FlowPilot 内部可以把它编译成稳定 ID、schedule、Source binding、policy 和 Workflow revision。

---

# 核心实体

## Goal — 用户想达到什么结果

Goal 表示稳定的目标意图。

示例：

    # 发布微信公众号文章
    把准备好的文章发布到微信公众号。
    需要标题、正文和封面，摘要可选。
    如果需要登录或安全验证，让我接管。
    正式发布前让我确认。
    只有真正发布成功才算完成，保存草稿不算完成。

Goal **不描述**按钮路径、selector、schedule 或数据存放位置。

Goal 回答：

> 完成后，现实世界里应该出现什么结果？

内部会编译成 GoalPlan，包含：

- intent
- required / optional inputs
- success criteria
- failure / non-success criteria
- safety / confirmation policy
- semantic capabilities

自然语言 Source 仍然是人类可读事实源。

## Task — 什么时候、按什么规则追求 Goal

Task 是围绕 Goal 的自动化执行策略。

示例：

    # 每日行业文章发布
    每天早上 8 点运行。
    从我的行业学习仓库中找到今天最新的文章。
    如果今天没有新内容，就跳过。
    发布到微信公众号。
    只发布从未发布过的版本。
    正式发布之前让我确认。

Task 回答：

> 什么时候执行？使用什么数据？有哪些规则？

内部 TaskPlan 可能包含：

- trigger / schedule
- resolved Goal reference
- resolved Source references
- data selection rules
- input bindings
- deduplication / idempotency strategy
- missed schedule policy
- confirmation policy
- retry / backoff policy

用户不直接编写这些内部引用。

## Source — 数据被允许从哪里来

Source 是显式授权的数据边界。

例如：

- 本地文件夹
- 本地 Git 仓库
- GitHub Repository
- Google Drive folder
- HTTP API
- database
- RSS feed

Source 包含：

- stable internal ID
- 面向用户的语义名称
- connector / type
- scoped permissions
- location / configuration
- capability metadata
- 可选 cursor / watermark

用户写：

> 数据来自我的行业学习仓库。

内部解析成 Source ID，但 Markdown 不要求用户写这个 ID。

## Flow — 如何实现 Goal

Flow 是可版本化的执行策略。

例如：

    Check login
    → Open editor
    → Fill title
    → Fill content
    → Upload cover
    → Publish
    → Verify success

Flow 根据 Goal 和当前平台环境被发现 / 编译。

Goal 可以长期稳定，而 Flow revision 可以不断变化。

Repair 修改 Flow，不修改 Goal。

## Run — 一次具体执行

Run 是历史执行记录。

它绑定不可变版本 / 快照：

- TaskPlan revision
- GoalPlan revision
- Flow revision
- Source snapshot / commit / file hashes
- resolved InputBundle
- Run policy
- result / evidence

这样每次执行都可追溯、可审计。

---

# 编译层

用户层 Source：

- Goal.md
- Task.md
- Preferences.md

编译链：

    Natural Language / Markdown
            ↓
    Semantic Resolution
            ↓
    GoalPlan / TaskPlan
            ↓
    Flow Discovery / Selection
            ↓
    Versioned Flow
            ↓
    Runtime Run

结构化 Plan 是编译产物。

人类可见 Markdown 离开 FlowPilot 后也必须仍然可读。

---

# 语义解析

当 Task 写：

> 发布到微信公众号。

FlowPilot 应解析到已有兼容 Goal。

如果只有一个无歧义匹配，静默绑定。

如果有多个实质匹配，不猜。

可以临时显示：

    你说的“发布到微信公众号”是指：
    ○ 发布文章
    ○ 发布视频

用户选择后，内部 TaskPlan 保存稳定 Goal reference；原 Markdown 仍保持自然语言。

Source、account、platform、policy 等实体遵守同样原则。

---

# 禁止用户层 DSL

普通用户不能被要求写：

- `@goal/...`
- `@source/...`
- YAML IDs
- UUID references
- cron expressions
- selector expressions
- retry codes
- workflow node syntax

编辑器可以提供富文本 mention / autocomplete，但最终用户可见文本仍应是正常人类语言。

导出的 Markdown 必须能独立理解。

---

# 版本

以下产物独立版本化：

- Goal source revision
- GoalPlan revision
- Task source revision
- TaskPlan revision
- Flow revision

Run 保存 exact versions。

Markdown 修改后：

1. 检测 source hash 变化；
2. 重新编译；
3. 比较 old / new structured plan；
4. 只有行为 / 安全发生实质变化时才要求用户 Review；
5. 创建新 plan revision；
6. 保留旧 revision 供审计。

---

# 设计后果

FlowPilot 不是 configuration-first。

主要交互是：

1. 表达意图；
2. FlowPilot 理解 / 编译；
3. 只 Review 实质歧义或风险；
4. 执行；
5. 只有需要观察、选择、比较或介入时才出现上下文 UI。

产品不应该迫使用户理解机器层表示。