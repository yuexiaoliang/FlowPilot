# FlowPilot 黄金流程与分支契约

本文件是 D0.3 的流程级实现契约。`G-01` 到 `G-08` 描述黄金路径，`B-01` 到 `B-10` 描述必须诚实处理的分支。G/B 是 Reviewer、Builder 和 [SCREEN-SPECS.md](SCREEN-SPECS.md) 使用的稳定文档锚点，不是 UI 文案、内部 ID 或新的导航目的地。

黄金路径必须保持：

```text
Intent
  → Understanding
  → Source resolution
  → Input preview
  → Run
  → Human confirmation
  → Success
  → Inspect details
```

这里的“Human confirmation”只指不可逆动作前的显式用户确认；登录、QR、CAPTCHA、MFA、安全挑战、同意流程和账号警告属于 Human Takeover，必须保持不同状态。已有授权 Source 可以跳过连接 UI，但绝不能跳过 Source resolution、selection、snapshot、binding、校验或不可变 InputBundle 创建。

## 1. 共同流程规则

### 1.1 确定性、版本和证据

- 每个节点先检查前置条件，再做确定性状态转移；不确定性转为 clarification、typed failure、pause 或 intervention，不隐藏回退。
- Source 在执行前解析并冻结。Run 只使用本次不可变 InputBundle；Source 在执行中变化不得静默改变输入。需要新数据必须显式创建新 snapshot/新 Run。
- 每个有意义的执行 Step 都应有 precondition、target resolution、action、transition/wait、postcondition 和 evidence；没有异常不等于成功。
- Run 绑定确切 Goal/Task plan、Source snapshot、InputBundle、Flow revision、确认/接管事件和结果 evidence；详情不能静默更新到最新版本。
- 正常已知路径不增加不必要的 AI 调用；页面内容是远程不可信输入，不能修改 policy、扩大权限或索要 Secret。

### 1.2 UI 层级与状态

- Simple 负责意图、理解、最小选择和结果；Execution 负责进度、输入、确认、接管和恢复；Inspection 负责来源、版本、证据与差异。
- 临时组件只在当前需要观察、选择、比较、批准或介入时出现；解决后收回并保留可读摘要。
- `idle`、`loading`、`success`、`failure`、`paused`、`disabled` 只在屏幕/组件语义适用时显示。`SKIPPED`、`CANCELLED`、未知安全状态等终态必须有独立文案，不能伪装成 `success`。
- 普通 UI 不显示内部 ID、cron、selector、Workflow DSL、原始日志、cookie、session、token 或密码；技术事实只在已脱敏 Inspection 中按需披露。

### 1.3 每个流程节点的固定字段

下面每个 G/B 节点都明确：触发/前置、源/目标屏幕、组件、可见状态/决策、确定性转移/退出、分支/取消/暂停/安全阻塞、证据/检查锚点、可访问性影响。节点中的 S-* 与组件章节是书面引用，不是用户界面标签。

## 2. 黄金路径 G-01..G-08

<a id="g-01-intent-to-understanding"></a>
### G-01 Intent → Understanding / 表达意图并形成理解

- **触发/前置：** 用户创建新 Goal/Task 或编辑现有自然语言/Markdown；S-01 编辑器可用，用户不需要先连接 Source 或选择 Flow。
- **源/目标屏幕：** [S-01 Intent Home](SCREEN-SPECS.md#s-01-intent-home) → [S-02 AI Understanding Review](SCREEN-SPECS.md#s-02-ai-understanding-review)。
- **组件：** [COMPONENTS.md §3 意图编辑器](COMPONENTS.md#3-意图编辑器)、[§4 语义引用与建议](COMPONENTS.md#4-语义引用与建议)、[§5 理解审阅](COMPONENTS.md#5-理解审阅)。
- **可见状态/决策：** S-01 从 `idle` 开始；分析期间 `loading`；结构化输入和理解校验完成后 S-01/S-02 显示 `success`（只代表理解输入有效，不代表 Run 成功）；理解不完整显示 `failure` 或需要选择的提示。
- **确定性转移/退出：** 保存当前源文本 → 解析语义 → schema/policy 校验 → 生成新的理解 revision → 打开 S-02。源文本不被改写；用户取消分析回 S-01 并保留未保存内容。
- **分支/取消/暂停/安全阻塞：** 源文本为空/不可解析时停留 S-01；实质歧义走 B-02；Source 缺失留待 G-02/G-03；分析服务暂时不可用显示 typed failure 和重试；不把模型输出直接当成可执行 UI。
- **证据/检查锚点：** S-02 的 `检查详情` 指向当前源文本、理解 revision 和语义绑定；S-08 保留用户源文本与编译理解的分离。
- **可访问性影响：** 编辑器保留中文 IME、撤销和多行 `Enter`；焦点在分析后进入理解标题/第一项安全动作，失败时到原因；状态用单一 `aria-live="polite"` 播报，200% 单列，reduced-motion 不阻塞。

<a id="g-02-understanding-and-semantic-resolution"></a>
### G-02 Understanding → Semantic resolution / 理解与语义消歧

- **触发/前置：** S-02 有稳定理解；所有语义短语需要检查是否只有一个兼容实体，实质歧义不能静默绑定。
- **源/目标屏幕：** [S-02 AI Understanding Review](SCREEN-SPECS.md#s-02-ai-understanding-review) → S-02 内的语义选择/歧义上下文；无歧义时直接进入 G-03，必要时 [S-03 Source Connection](SCREEN-SPECS.md#s-03-contextual-source-connection)。
- **组件：** [COMPONENTS.md §4 语义引用与建议](COMPONENTS.md#4-语义引用与建议)、[§5 理解审阅](COMPONENTS.md#5-理解审阅)、[§6 歧义处理器](COMPONENTS.md#6-歧义处理器)、[§7 Source 连接与权限选择器](COMPONENTS.md#7-source-连接与权限选择器)。
- **可见状态/决策：** 明确候选显示语义名称并静默绑定；多个解释显示 `idle` 选择器并说明结果差异；候选检查/权限复核为 `loading`；用户选择后为 `success`；候选失效或仍冲突为 `failure`。
- **确定性转移/退出：** 重新检查候选、目标、时间、数据和安全影响 → 唯一兼容项绑定到隐藏引用 → 更新可读理解摘要 → 进入 G-03。选择只改变隐藏绑定，不改写自然语言源文本。
- **分支/取消/暂停/安全阻塞：** 用户取消保留未解决短语并停留 S-02；实质歧义不能随机选默认；涉及授权转 B-01；有风险但无法确认时暂停，不让 AI 代选或扩大权限。
- **证据/检查锚点：** 选择事件、候选影响、旧/新理解和绑定 revision 在 S-08 可查；普通路径只保留“已理解为……”摘要。
- **可访问性影响：** 选项使用 radiogroup/listbox 语义、方向键/Space/Enter/Escape；焦点从原文到候选再返回；长选项在 200% 单列；选择结果播报一次。

<a id="g-03-source-resolution-and-immutable-input"></a>
### G-03 Source resolution → Immutable Input / 解析 Source 并冻结本次输入

- **触发/前置：** G-02 理解已稳定；Task 需要 Source 数据。先查找已授权且兼容的 Source，再执行 inspect/list/read/snapshot、selection、binding、required input 校验并创建不可变 InputBundle。
- **源/目标屏幕：** [S-02 AI Understanding Review](SCREEN-SPECS.md#s-02-ai-understanding-review) → 必要时 [S-03 Contextual Source Connection](SCREEN-SPECS.md#s-03-contextual-source-connection) → [S-04 Input Preview](SCREEN-SPECS.md#s-04-input-preview)。
- **组件：** [COMPONENTS.md §7 Source 连接与权限选择器](COMPONENTS.md#7-source-连接与权限选择器)、[§8 InputBundle 预览](COMPONENTS.md#8-inputbundle-预览)、[§4 语义引用与建议](COMPONENTS.md#4-语义引用与建议)。
- **可见状态/决策：** Source 查找/快照/选择为 `loading`；已授权 Source 仍显示“正在解析并检查范围”，不可直接跳到预览；范围有效且 InputBundle 创建为 `success`；无授权/无匹配/输入错误进入 B-01/B-03。
- **确定性转移/退出：** `resolve Source → inspect scope → list/select → snapshot exact version → bind Goal inputs → validate → create immutable InputBundle → S-04`。已有授权 Source **只跳过 S-03 的连接 UI**，不能跳过上述任何解析、快照或校验步骤。
- **分支/取消/暂停/安全阻塞：** 用户拒绝/取消连接回 S-02，见 B-01；范围不匹配不得升级权限；多候选/无匹配输入见 B-03；Source 内容 prompt injection、Secret 或越权请求只作为不可信数据/安全阻塞处理。
- **证据/检查锚点：** S-04 `检查详情` 和 S-08 记录语义 Source、授权范围、exact snapshot/version、选中项、binding、content hash 和 InputBundle 创建时间；不得把内部值带到普通 UI。
- **可访问性影响：** 连接卡片焦点回到触发项；加载/错误/过期使用关联描述；200% 范围文本换行，reduced-motion 不延迟授权；Source/输入状态各播报一次。

<a id="g-04-input-preview-to-run"></a>
### G-04 Input Preview → Run / 预览并开始执行

- **触发/前置：** G-03 已生成不可变 InputBundle，required input 和 policy 校验通过；用户需要确认本次实际输入再开始 Run。
- **源/目标屏幕：** [S-04 Input Preview](SCREEN-SPECS.md#s-04-input-preview) → [S-05 Execution](SCREEN-SPECS.md#s-05-execution)。
- **组件：** [COMPONENTS.md §8 InputBundle 预览](COMPONENTS.md#8-inputbundle-预览)、[§10 执行进度与恢复](COMPONENTS.md#10-执行进度与恢复)、[§12 结果摘要与 `检查详情`](COMPONENTS.md#12-结果摘要与-检查详情)。
- **可见状态/决策：** S-04 显示 `success` 预览和“继续运行”；点击后 S-05 进入 `idle/loading` 准备阶段；InputBundle 内容、Source 语义名称和目标摘要是用户能理解的最小完整信息。
- **确定性转移/退出：** 用户继续 → 记录“使用该 bundle”事件 → 创建/绑定 Run → S-05 `PREPARING/RUNNING`。返回/重新选择不修改旧 bundle，重新走 G-03。
- **分支/取消/暂停/安全阻塞：** bundle 在开始前过期/Source 改变走 B-03 重新 snapshot；用户取消回到 S-02 并不产生成功；缺失必需 input 按 policy ask/skip/fail，不能静默派生或替换。
- **证据/检查锚点：** Run 绑定 exact Task/Goal plan、Source snapshot、InputBundle 和 policy；S-08 可检查本次选择；S-04 不显示原始哈希或数据库行。
- **可访问性影响：** 继续/返回是明确按钮，正文/封面有替代文本；焦点到 S-05 标题；状态通过 live region 播报“正在准备输入”，200% 单列，reduced-motion 直接切换。

<a id="g-05-run-to-confirmation-or-human-takeover"></a>
### G-05 Run → Human confirmation or takeover / 执行到确认或接管

- **触发/前置：** S-05 Run 已到达不可逆动作或发现人工/安全风险；InputBundle、目的地和当前 Flow 状态仍有证据。
- **源/目标屏幕：** [S-05 Execution](SCREEN-SPECS.md#s-05-execution) → [S-06 Confirmation / Human Takeover](SCREEN-SPECS.md#s-06-confirmation--human-takeover-屏幕族) → 回 S-05。
- **组件：** [COMPONENTS.md §9 确认卡](COMPONENTS.md#9-确认卡)、[§11 Human Takeover](COMPONENTS.md#11-human-takeover)、[§10 执行进度与恢复](COMPONENTS.md#10-执行进度与恢复)。
- **可见状态/决策：** S-05 的 Run 以 `paused` 说明正在等待确认；Confirmation 卡自身以 `idle` 等待明确确认或取消，不声明自己拥有 `paused` 状态。Human Takeover 为 `paused` 等待登录、QR、安全挑战、同意或人工判断；二者不共用按钮和语义。复核或重新验证期间为 `loading`。
- **确定性转移/退出：** Confirmation：复核去重/目的地/InputBundle → 用户确认 → 记录事件 → S-05 执行动作；Takeover：暂停 BrowserDriver → 用户操作 → 交还 → 新 snapshot/安全状态检查 → 已知安全才回 S-05。
- **分支/取消/暂停/安全阻塞：** 用户显式选择取消确认时进入 B-04；用户停止接管产生明确取消/失败；未知或不安全状态保持 `PAUSED_HUMAN`，不得自动继续；CAPTCHA/MFA/stealth bypass 永远不是分支选项。
- **证据/检查锚点：** S-08 记录确认 policy/事件、Takeover reason、交还事件、前后 snapshot 和验证结果；Confirmation 事件不等于成功，Takeover 事件不等于认证成功。
- **可访问性影响：** Confirmation 是有标题的 dialog 并约束焦点；`Escape` 只关闭卡片并恢复到 S-05 的待决定暂停状态，不记录取消。Takeover 焦点留在 FlowPilot 说明/交还控件，不注入不可信页面；模式播报一次，200% 单列，reduced-motion 无阻塞转场。

<a id="g-06-verified-result"></a>
### G-06 Verified result / 验证结果

- **触发/前置：** S-05 action 完成后必须执行 transition/wait 和 postcondition；只有目标状态和目的地结果经过验证才可进入成功。
- **源/目标屏幕：** [S-05 Execution](SCREEN-SPECS.md#s-05-execution) → [S-07 Result](SCREEN-SPECS.md#s-07-result)。
- **组件：** [COMPONENTS.md §10 执行进度与恢复](COMPONENTS.md#10-执行进度与恢复)、[§12 结果摘要与 `检查详情`](COMPONENTS.md#12-结果摘要与-检查详情)、[§14 证据查看器](COMPONENTS.md#14-证据查看器)。
- **可见状态/决策：** 验证期间 S-05 为 `loading`；后置条件通过为 S-07 `success`；后置条件失败为 B-06/B-07；点击无异常、保存草稿或页面文案声称成功都不算 `success`。
- **确定性转移/退出：** `action → wait/transition → postcondition → evidence → Run terminal result`；成功只显示最小结果；S-07 的 `检查详情` 可进入 G-07。
- **分支/取消/暂停/安全阻塞：** 目标未知、页面导航变化、权限/速率限制等转 typed failure/pause；不可证明时不写 consumption success，不更新 cursor；用户可安全取消但结果必须为 `CANCELLED`。
- **证据/检查锚点：** 记录 postcondition、目的地 provenance、Step evidence、时间线和状态；S-08 保留 exact Flow revision/InputBundle/Source snapshot。
- **可访问性影响：** “正在验证结果”与具体终态各播报一次；焦点到 S-07 结果标题；结果文字/图标/颜色冗余，200% 可读，reduced-motion 不影响证据出现。

<a id="g-07-inspect-details"></a>
### G-07 Result → Inspect details / 从结果检查专业事实

- **触发/前置：** S-07 显示 `SUCCEEDED`、`SKIPPED`、`FAILED` 或 `CANCELLED` 的简洁结果；用户选择 `检查详情` 或失败解释需要证据。
- **源/目标屏幕：** [S-07 Result](SCREEN-SPECS.md#s-07-result) → [S-08 Inspector](SCREEN-SPECS.md#s-08-inspector-professional-detail)。
- **组件：** [COMPONENTS.md §12 结果摘要与 `检查详情`](COMPONENTS.md#12-结果摘要与-检查详情)、[§13 Inspector 外壳与分区](COMPONENTS.md#13-inspector-外壳与分区)、[§14 证据查看器](COMPONENTS.md#14-证据查看器)。
- **可见状态/决策：** S-08 加载为 `loading`，数据可读为 `success`；详情不可用/脱敏为 `failure/disabled`；Run 暂停时显示 `paused` 原因，打开 Inspector 不解除暂停。
- **确定性转移/退出：** 以结果陈述为锚点加载确切 Run/版本 → 先显示结构化分区 → 用户按需展开 evidence/raw sanitized detail → 关闭回 S-07 并恢复焦点；不会静默修改历史事实。
- **分支/取消/暂停/安全阻塞：** 版本缺失/权限不足显示可解释失败；Secret/未脱敏证据被遮蔽；用户关闭/返回不改变 Run/Flow/Source；需要恢复时回 S-05 或 B-06。
- **证据/检查锚点：** 分区固定为源文本/理解、时间/策略、Source/授权、InputBundle、Flow/Run、证据、修复差异；每项明确 exact version 和来源。
- **可访问性影响：** 分区有标题和 `aria-expanded`，打开详情不抢焦点；200% 转单列，哈希/差异局部滚动；reduced-motion 即时展开；加载/错误播报一次。

<a id="g-08-close-inspection-and-return"></a>
### G-08 Inspect details → Return / 关闭检查并返回结果

- **触发/前置：** G-07 已以确切 Run/版本锚点打开 S-08，用户已阅读当前需要的结构化事实或证据。
- **源/目标屏幕：** [S-08 Inspector](SCREEN-SPECS.md#s-08-inspector-professional-detail) → 黄金路径中的 [S-07 Result](SCREEN-SPECS.md#s-07-result)；若 Inspector 来自其他屏幕，则回到其确切来源上下文。
- **组件：** [COMPONENTS.md §13 Inspector 外壳与分区](COMPONENTS.md#13-inspector-外壳与分区)、[§14 证据查看器](COMPONENTS.md#14-证据查看器)、[§12 结果摘要与 `检查详情`](COMPONENTS.md#12-结果摘要与-检查详情)。
- **可见状态/决策：** S-08 保持与打开时相同的 exact version；用户只决定继续展开证据还是关闭检查。关闭不是确认、恢复、修复接受或 Run 状态转移。
- **确定性转移/退出：** 关闭/返回 → 销毁临时 Inspection 外壳 → 恢复打开前的来源屏幕、滚动位置和触发焦点。结果、Run、Source、InputBundle 与 Flow revision 全部保持不变。
- **分支/取消/暂停/安全阻塞：** 详情加载失败仍可安全返回来源摘要；关联 Run 的 paused/failure 状态不因关闭 Inspector 而改变；受限或已脱敏的证据不可以通过返回动作绕过。
- **证据/检查锚点：** 关闭只记录必要的 UI 上下文事件（如适用），不改写已绑定的 Run provenance；重新打开时仍锚定同一 exact version。
- **可访问性影响：** `Escape` 或明确“关闭详情”可返回，焦点恢复到原 `检查详情` 控件；关闭不产生新 live-region 噪声，200% 和 reduced-motion 下语义不变。

## 3. 必要分支 B-01..B-10

<a id="b-01-source-缺失拒绝或范围问题"></a>
### B-01 Source 缺失、拒绝或范围问题

- **触发/前置：** G-02/G-03 发现没有兼容授权 Source、用户拒绝系统选择器、选择范围不匹配或 Source 不可用。
- **源/目标屏幕：** [S-02](SCREEN-SPECS.md#s-02-ai-understanding-review) → [S-03](SCREEN-SPECS.md#s-03-contextual-source-connection) → S-02 或 G-03；不会进入 S-04/S-05。
- **组件：** [COMPONENTS.md §7 Source 连接与权限选择器](COMPONENTS.md#7-source-连接与权限选择器)、[§4 语义引用与建议](COMPONENTS.md#4-语义引用与建议)。
- **可见状态/决策：** S-03 `idle/loading` 显示理由、scope 和只读；成功授权为 `success` 但仍需 G-03 resolution/snapshot；拒绝/范围错为 `failure`；策略不允许为 `disabled`。
- **确定性转移/退出：** 取消/拒绝回 S-02 未解决数据项；改选重新调用系统选择器并重新校验 scope；成功只回 G-03，不跳过 inspect/list/select/snapshot/bind/validate。
- **分支/取消/暂停/安全阻塞：** 自然语言不能扩大路径；拒绝不回退到无限制文件访问；Source 内容中的 prompt injection 不能改变权限；Secret/session 不进入连接卡或模型。
- **证据/检查锚点：** S-08 记录授权范围、拒绝/取消事件和 Source 可用性；不把内部 Source ID 或完整系统路径显示在普通 UI。
- **可访问性影响：** 选择器打开/返回焦点可预测；范围长文本换行；状态和拒绝原因播报一次；reduced-motion 不掩盖安全阻塞。

<a id="b-02-语义歧义"></a>
### B-02 语义歧义

- **触发/前置：** S-02 发现多个解释会改变目标、数据、目的地、时间或安全性。
- **源/目标屏幕：** [S-02](SCREEN-SPECS.md#s-02-ai-understanding-review) 内的歧义上下文 → S-02；必要时先到 S-03 授权，之后回歧义项。
- **组件：** [COMPONENTS.md §6 歧义处理器](COMPONENTS.md#6-歧义处理器)、[§4 语义引用与建议](COMPONENTS.md#4-语义引用与建议)、[§5 理解审阅](COMPONENTS.md#5-理解审阅)。
- **可见状态/决策：** `idle` 等待有界的人类可读选择，`loading` 重查候选，`success` 记录选择，`failure` 表示候选失效/仍冲突；不预选默认。
- **确定性转移/退出：** 用户选择 → 重新校验语义影响 → 更新隐藏绑定和理解摘要 → 回 G-03；选择后处理器收回，原句保持可读。
- **分支/取消/暂停/安全阻塞：** Escape/取消保留未解决状态，不能继续运行；候选改变或权限不足回到选择/Source 连接；AI 不代选，不将不确定性伪装为 success。
- **证据/检查锚点：** S-08 记录原短语、候选、用户选择、时间和影响；普通摘要只显示已选语义名称。
- **可访问性影响：** radiogroup/listbox、方向键/Space/Enter/Escape、焦点恢复；200% 单列；选择/阻塞播报一次，不以颜色标记“推荐”。

<a id="b-03-输入无匹配缺失校验或过期"></a>
### B-03 输入无匹配、缺失、校验或过期

- **触发/前置：** G-03/G-04 在 selection、binding、required input 校验或开始 Run 前发现无匹配、缺少 title/body/cover、格式不合法、Source snapshot 变化或 InputBundle 过期。
- **源/目标屏幕：** [S-04 Input Preview](SCREEN-SPECS.md#s-04-input-preview) ↔ [S-02](SCREEN-SPECS.md#s-02-ai-understanding-review)/[S-03](SCREEN-SPECS.md#s-03-contextual-source-connection)；不得进入 S-05 success。
- **组件：** [COMPONENTS.md §8 InputBundle 预览](COMPONENTS.md#8-inputbundle-预览)、[§7 Source 连接与权限选择器](COMPONENTS.md#7-source-连接与权限选择器)、[§10 执行进度与恢复](COMPONENTS.md#10-执行进度与恢复)。
- **可见状态/决策：** S-04 `loading` 显示校验，`failure` 说明缺失/过期影响；用户可重选、重新 snapshot、按 policy ask/skip/fail；预览不可用为 `disabled`。
- **确定性转移/退出：** 重选/重新 snapshot 生成新 InputBundle 后回 S-04；ask 回 S-02 请求用户；skip 进入 B-07 `SKIPPED`；fail 进入 B-07 `FAILED`；旧 bundle 保持只读。
- **分支/取消/暂停/安全阻塞：** 无匹配不自动上传/随机选；过期不静默刷新；AI 派生仅在显式 policy 且安全时允许并带 provenance；内容越权/Secret 使流程停止或脱敏。
- **证据/检查锚点：** S-08 记录 selection rule、required/optional binding、snapshot、缺失项和新旧 bundle 关系；S-04 只显示可读摘要。
- **可访问性影响：** 缺失字段通过 `aria-describedby` 关联，焦点到第一处可修复问题；预览图有替代文本；加载/过期/跳过播报一次。

<a id="b-04-确认取消"></a>
### B-04 确认取消

- **触发/前置：** G-05 进入 S-06 Confirmation 模式，用户明确选择“取消发布”而不执行不可逆动作。
- **源/目标屏幕：** [S-06 Confirmation](SCREEN-SPECS.md#s-06-confirmation--human-takeover-屏幕族) → [S-07 Result](SCREEN-SPECS.md#s-07-result)，结果为 `CANCELLED`；不进入发布动作。
- **组件：** [COMPONENTS.md §9 确认卡](COMPONENTS.md#9-确认卡)、[§12 结果摘要与 `检查详情`](COMPONENTS.md#12-结果摘要与-检查详情)。
- **可见状态/决策：** 确认卡 `idle` 等待决定；取消事件为 `success`（只代表取消事件记录）；S-07 以中性取消文案显示，不显示成功。
- **确定性转移/退出：** 显式取消 → 记录取消原因/时间和当前 InputBundle → 关闭卡片 → 终止不可逆 action → S-07；不自动重试、不更新 consumption success。
- **分支/取消/暂停/安全阻塞：** `Escape`、遮罩或关闭只收起 Confirmation 卡并回到 S-05 的待决定暂停状态；它们不记录确认、不执行动作、也不产生 `CANCELLED`。如果确认前输入/目的地变更，转 failure 回 S-04/S-03。
- **证据/检查锚点：** S-08 显示 confirmation policy、用户取消事件、Run 状态和未执行的动作边界；不得声称平台已完成。
- **可访问性影响：** dialog 焦点约束且“取消发布/确认发布”标签明确；`Escape` 只关闭卡片并恢复焦点，不触发 B-04 终态。200% 单列，reduced-motion 立即关闭；只有显式取消后才播报取消结果。

<a id="b-05-human-takeover"></a>
### B-05 Human Takeover

- **触发/前置：** S-05 检测 login/QR/CAPTCHA/MFA/security challenge/account warning/consent/unknown interstitial 或需人工判断的破坏性动作。
- **源/目标屏幕：** [S-05 Execution](SCREEN-SPECS.md#s-05-execution) → [S-06 Human Takeover](SCREEN-SPECS.md#s-06-confirmation--human-takeover-屏幕族) → S-05 暂停/恢复或 S-07 取消/失败。
- **组件：** [COMPONENTS.md §11 Human Takeover](COMPONENTS.md#11-human-takeover)、[§10 执行进度与恢复](COMPONENTS.md#10-执行进度与恢复)、[§14 证据查看器](COMPONENTS.md#14-证据查看器)。
- **可见状态/决策：** 自动化进入 `paused`；Takeover 打开/恢复为 `loading`；交还事件为 `success` 但立即重新验证；验证未知为 `failure` 并继续 paused/stop；不能用 confirmation 卡替代。
- **确定性转移/退出：** 暂停 BrowserDriver → 展示真实隔离上下文 → 用户手工操作 → 交还控制 → 重新 snapshot/识别已知安全状态 → 仅验证通过才回 S-05；否则 S-07 明确失败/取消或继续人工。
- **分支/取消/暂停/安全阻塞：** 用户可停止；CAPTCHA/MFA 不自动解决；不得隐藏 webdriver、伪造指纹、轮换代理或绕过 challenge；Secret 留在页面，不复制到 UI/AI/日志。
- **证据/检查锚点：** S-08 记录 risk reason、暂停/交还时间、前后 snapshot、验证结果和安全阻塞；S-06 不把交还显示为成功结果。
- **可访问性影响：** 焦点留在 FlowPilot 说明和交还控件；页面内容不抢辅助技术焦点；暂停和重新验证播报一次；200% 单列、reduced-motion 无动画依赖。

<a id="b-06-类型化失败与安全恢复"></a>
### B-06 类型化失败与安全恢复

- **触发/前置：** S-05 的目标缺失/歧义、导航变化、postcondition 失败、权限拒绝、rate limit、Source 不可用或未知状态形成 typed failure。
- **源/目标屏幕：** [S-05 Execution](SCREEN-SPECS.md#s-05-execution) → [S-08 Inspector](SCREEN-SPECS.md#s-08-inspector-professional-detail) 或 [S-09 Repair Diff](SCREEN-SPECS.md#s-09-repair-diff) → S-05/S-07。
- **组件：** [COMPONENTS.md §10 执行进度与恢复](COMPONENTS.md#10-执行进度与恢复)、[§14 证据查看器](COMPONENTS.md#14-证据查看器)、[§15 修复差异](COMPONENTS.md#15-修复差异)。
- **可见状态/决策：** S-05 `failure/paused` 显示影响、最后成功检查点和允许动作；Inspector `success` 代表证据可读而非 Run 成功；修复 proposal `loading/success/failure/disabled` 按校验显示。
- **确定性转移/退出：** 分类错误 → 保存证据 → 依据 policy 选择安全重试、backoff、重新 snapshot、返回输入、等待人工、保留旧 Flow 或终止；每个恢复后重新验证 postcondition。
- **分支/取消/暂停/安全阻塞：** rate limit 使用 pause/backoff，不快速重试；未知状态不自动继续；安全 hard-stop 不可由 AI/修复覆盖；用户取消进入 B-07 `CANCELLED`。
- **证据/检查锚点：** S-08 固定 typed failure、最后成功 checkpoint、bounded context、脱敏 snapshot、允许恢复和 Run 版本；S-09 固定 repair diff/试运行/新旧 revision。
- **可访问性影响：** 错误与操作关联，焦点到原因/首个安全动作；实时播报一次；200% 失败详情可读；reduced-motion 不延迟阻塞信息。

<a id="b-07-终态分支"></a>
### B-07 终态分支

- **触发/前置：** Run 在 S-05 完成验证、被取消、按 policy 跳过、失败且不可恢复，或 Source 无匹配/已消费。
- **源/目标屏幕：** [S-05 Execution](SCREEN-SPECS.md#s-05-execution) → [S-07 Result](SCREEN-SPECS.md#s-07-result)；需要证据时可进入 S-08。
- **组件：** [COMPONENTS.md §12 结果摘要与 `检查详情`](COMPONENTS.md#12-结果摘要与-检查详情)、[§10 执行进度与恢复](COMPONENTS.md#10-执行进度与恢复)、[§14 证据查看器](COMPONENTS.md#14-证据查看器)。
- **可见状态/决策：** `SUCCEEDED` = postcondition verified；`SKIPPED` = 明确无匹配/已消费/用户 policy skip；`FAILED` = typed failure；`CANCELLED` = 用户/策略取消；四者不能共用成功样式。
- **确定性转移/退出：** 写入对应 terminal result 和 evidence → 显示最小结果 → `检查详情` 可进 S-08；只有成功边界才更新 consumption/cursor，skip/failure/cancel 不错误消费。
- **分支/取消/暂停/安全阻塞：** 尚未验证则留在 S-05 `loading/paused`；证据不足不能成功；跳过不自动重试；失败可按 B-06 恢复；取消不自动重跑。
- **证据/检查锚点：** S-08 记录 outcome reason、目标/输入/Source/Flow/Run provenance、postcondition 和确认/接管事件；每个终态可追溯但不暴露原始日志到默认路径。
- **可访问性影响：** 终态文字必须具体并播报一次；跳过/失败/取消有不同标签/图标/颜色；200% 单列；reduced-motion 不影响结果可见性。

<a id="b-08-inspection"></a>
### B-08 Inspection

- **触发/前置：** 用户从 S-02/S-04/S-05/S-07/S-09/S-10 选择 `检查详情`，或恢复必须显示特定证据；必须绑定确切对象/版本。
- **源/目标屏幕：** 任一来源屏幕 → [S-08 Inspector](SCREEN-SPECS.md#s-08-inspector-professional-detail) → 原来源屏幕。
- **组件：** [COMPONENTS.md §13 Inspector 外壳与分区](COMPONENTS.md#13-inspector-外壳与分区)、[§14 证据查看器](COMPONENTS.md#14-证据查看器)、必要时 [§15 修复差异](COMPONENTS.md#15-修复差异)。
- **可见状态/决策：** Inspector `loading` 后 `success`；详情不可用/权限不足为 `failure/disabled`；关联 Run 暂停显示 `paused`；打开详情不能改变执行状态。
- **确定性转移/退出：** 以陈述/结果为锚点 → 先显示结构化分区 → 按需展开脱敏 evidence/technical detail → 关闭恢复原屏幕和焦点；不重新 resolve Source、不写新 bundle。
- **分支/取消/暂停/安全阻塞：** 版本缺失或证据被脱敏时诚实显示不可用；Secret/原始日志不显示；用户关闭不代表确认/恢复/接受修复。
- **证据/检查锚点：** 分区顺序：源文本/理解、时间/策略、Source/授权、InputBundle、Flow/Run、证据、修复差异；每个分区保留 exact version。
- **可访问性影响：** 标题/锚点/关闭可键盘，分区有 `aria-expanded`；200% 单列；差异/hash 独立滚动；reduced-motion 即时；加载/错误/暂停只播报一次。

<a id="b-09-repair-diff"></a>
### B-09 Repair Diff

- **触发/前置：** B-06 产生 bounded Repair proposal，且差异改变行为、跨 policy 边界或需要用户判断；proposal 已通过 schema/policy 初检。
- **源/目标屏幕：** [S-08 Inspector](SCREEN-SPECS.md#s-08-inspector-professional-detail) 或 [S-05 Execution](SCREEN-SPECS.md#s-05-execution) → [S-09 Repair Diff](SCREEN-SPECS.md#s-09-repair-diff) → S-05/S-08/S-07。
- **组件：** [COMPONENTS.md §15 修复差异](COMPONENTS.md#15-修复差异)、[§14 证据查看器](COMPONENTS.md#14-证据查看器)、[§10 执行进度与恢复](COMPONENTS.md#10-执行进度与恢复)。
- **可见状态/决策：** 差异加载 `loading`；schema/policy/试运行通过为 `success`（只代表 candidate 可审阅）；用户决定为 `paused`；无效/不安全/超范围为 `failure/disabled`。
- **确定性转移/退出：** 展示失败影响和旧/新最小差异 → schema/policy 校验 → bounded trial → 验证到达预期状态 → 展示试运行证据并由用户接受/保留旧版本 → 只在接受后保存新的 immutable Flow revision → 后续 Run 使用新 revision。旧 revision 永不覆盖；试运行或验证失败时不得创建新 revision。
- **分支/取消/暂停/安全阻塞：** 用户拒绝/关闭保留旧 Flow；hard-stop、安全策略、权限或证据不足禁用接受；完整 Workflow DSL、selector、prompt 和无关步骤不进入普通 diff；不自动应用。
- **证据/检查锚点：** S-09 记录 candidate、校验、试运行、用户决定、新旧 revision 和影响；S-08 保留 repair provenance；S-07 只有新 Run 验证成功后才显示成功。
- **可访问性影响：** 旧/新以文字和结构对照，不依赖红绿；键盘可接受/保留/取消，焦点恢复来源；200% 上下堆叠；校验/安全阻塞播报一次。

<a id="b-10-已有-goaltask-连续性"></a>
### B-10 已有 Goal/Task 连续性

- **触发/前置：** 用户打开已有 Goal/Task、从 S-07/S-08 查看历史，或编辑源文本；必须能定位人类源文本、当前理解和最近 Run。
- **源/目标屏幕：** [S-10 Existing Goal/Task](SCREEN-SPECS.md#s-10-existing-goaltask-已有-goaltask-查看页) → [S-01 Intent Home](SCREEN-SPECS.md#s-01-intent-home)/[S-02 Understanding](SCREEN-SPECS.md#s-02-ai-understanding-review) 或 S-05/S-08。
- **组件：** [COMPONENTS.md §3 意图编辑器](COMPONENTS.md#3-意图编辑器)、[§5 理解审阅](COMPONENTS.md#5-理解审阅)、[§12 结果摘要与 `检查详情`](COMPONENTS.md#12-结果摘要与-检查详情)、[§13 Inspector 外壳与分区](COMPONENTS.md#13-inspector-外壳与分区)。
- **可见状态/决策：** S-10 `idle/loading/success` 显示源文本、当前理解和结果；源/版本不可用为 `failure`；受保护历史为 `disabled`；Run 的 paused 状态仍由 S-05/S-06 显示。
- **确定性转移/退出：** 编辑源文本 → 新 source revision → 重新分析/resolve → 新 Source snapshot/InputBundle/Run；继续已有任务也重新检查授权和输入；历史 Run/Flow 只读可检查。
- **分支/取消/暂停/安全阻塞：** 取消编辑保留草稿且不覆盖旧 revision；旧 Source 不再授权时走 B-01；旧 bundle 不可重用到新文本；打开页面不解除已有暂停；不跳到机器配置表单。
- **证据/检查锚点：** S-08 保留 source revision、理解 revision、旧/新 plan、Run provenance；S-10 的结果入口指向确切历史 Run，不静默切换最新 Source。
- **可访问性影响：** 焦点进入源文本/标题；编辑、检查、返回、重新分析可键盘完成；200% 单列；reduced-motion 不自动跳转；源文本/过期理解/加载状态播报一次。

<a id="4-覆盖矩阵与-d0-映射"></a>
## 4. 覆盖矩阵与 D0 映射

### 4.1 G/B 与屏幕、组件双向覆盖

| 锚点 | 屏幕引用 | `COMPONENTS.md` 章节 | 覆盖主题 |
| --- | --- | --- | --- |
| G-01 | S-01、S-02 | §3、§4、§5 | Intent → Understanding、自然语言控制面。 |
| G-02 | S-02、S-03 | §4、§5、§6、§7 | 语义解析、实质歧义和授权前置。 |
| G-03 | S-02、S-03、S-04 | §4、§7、§8 | Source resolution、snapshot、InputBundle。 |
| G-04 | S-04、S-05 | §8、§10、§12 | Input Preview → Run。 |
| G-05 | S-05、S-06 | §9、§10、§11 | Confirmation 与 Human Takeover 分离。 |
| G-06 | S-05、S-07 | §10、§12、§14 | postcondition、verified result。 |
| G-07 | S-07、S-08 | §12、§13、§14 | Result → Inspect details。 |
| G-08 | S-08、S-07（或 exact 来源屏幕） | §12、§13、§14 | 关闭 Inspection、返回来源并恢复焦点。 |
| B-01 | S-02、S-03 | §4、§7 | Source 缺失/拒绝/范围。 |
| B-02 | S-02、S-03 | §4、§5、§6 | 语义歧义。 |
| B-03 | S-02、S-03、S-04 | §7、§8、§10 | 输入无匹配/缺失/校验/过期。 |
| B-04 | S-06、S-07 | §9、§12 | 确认取消。 |
| B-05 | S-05、S-06 | §10、§11、§14 | Human Takeover、安全暂停。 |
| B-06 | S-05、S-08、S-09 | §10、§14、§15 | 类型化失败/恢复。 |
| B-07 | S-05、S-07、S-08 | §10、§12、§14 | 成功/跳过/失败/取消。 |
| B-08 | 所有来源屏幕、S-08 | §12、§13、§14、§15 | Inspection。 |
| B-09 | S-05、S-08、S-09 | §10、§14、§15 | Repair Diff。 |
| B-10 | S-01、S-02、S-05、S-08、S-10 | §3、§5、§12、§13 | 已有 Goal/Task 连续性。 |

### 4.2 D0 验收映射

| 验收条目 | 本轮证据 | 与既有 D0.1/D0.2 的合并审查 |
| --- | --- | --- |
| D0.1 | `design/` 七份要求的契约文档均存在；本轮补齐 `SCREEN-SPECS.md` 与 `FLOWS.md`。 | 与已验收的 README、原则、交互模型、设计系统和组件契约合并检查。 |
| D0.2 | 两份文档把“默认简单，按需透明”落到默认内容、临时上下文和 `检查详情` 路径。 | 对照 DESIGN-PRINCIPLES 的默认简单/按需透明规则。 |
| D0.3 | S-01 是主要入口；S-01、S-07、S-10 明确禁止密集 Dashboard，只保留当前意图或结果所需的主线。 | 对照最小导航和 intent-first 原则。 |
| D0.4 | S-01/S-10 以普通自然语言/Markdown 创作和编辑；S-02 是理解审阅而不是配置表单。 | 对照 PRODUCT-MODEL 与 NATURAL-LANGUAGE-UX。 |
| D0.5 | 普通屏幕与 G/B 路径禁止要求 ID、DSL、cron、selector、Workflow node 或机器配置；它们只能在按需 Inspection 中检查。 | 对照 DESIGN-PRINCIPLES 的自然语言控制面。 |
| D0.6 | 每个 S/G/B 都标明 Simple、Execution 或 Inspection 归属及转移，关闭 Inspection 会返回来源上下文。 | 对照 INTERACTION-MODEL 的三层定义。 |
| D0.7 | 每屏写明默认隐藏、渐进披露触发器和 S-08 检查入口；详情逐层深入且不改变含义。 | 对照按需透明与渐进披露原则。 |
| D0.8 | B-01/B-02/B-04/B-05/B-09 明确覆盖 Source connection、ambiguity、confirmation、takeover、repair；B-08/S-08 覆盖专业详情。 | 对照上下文 UI 触发契约。 |
| D0.9 | 每个 S-* 都写出 `idle/loading/success/failure/paused/disabled` 的适用矩阵，G/B 说明诚实的状态转移。 | 对照 COMPONENTS 的 13 个 primitive 与六状态契约。 |
| D0.10 | S-01..S-10 覆盖开发计划列出的十个 golden screens。 | 本文件的屏幕矩阵供 Gatekeeper 逐项核对。 |
| D0.11 | G-01..G-08 完整覆盖 Intent → Understanding → Source resolution → Input preview → Run → Human confirmation → Success → Inspect details 及关闭返回，B-01..B-10 覆盖必要分支。 | 流程节点均有屏幕、组件、转移、证据和可访问性字段。 |
| D0.12 | 两份文档引用 `design/README.md` 的权威规则：书面契约决定行为，ImageGen/视觉稿只能作为参考。 | 对照 design README 的权威性和评审方法。 |
| D0.13 | 屏幕/流程不使用密集 Dashboard；历史 SaaS/Dashboard 探索稿在 design README 与原则中继续被明确为非规范。 | Gatekeeper 合并复查既有 D0.1 证据。 |
| D0.14 | 每个 S/G/B 都有稳定锚点、引用、状态、证据、恢复与可访问性规则；文末双向矩阵可独立评审。 | 与 D0.1/D0.2 的原则、组件、状态和安全证据合并审查。 |

本轮仍然只创建屏幕/流程设计契约，不实现 React、Electron、P0、fixture、真实 AI/Source/浏览器/持久化/Repair/Human Takeover 服务，也不修改产品实体、架构或安全边界。
