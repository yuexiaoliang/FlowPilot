# 安全与自动化安全边界

FlowPilot 一方面加载不可信第三方网页，另一方面拥有桌面能力，因此安全边界是产品核心。

## 远程内容隔离

第三方页面：

- 不能有 Node integration
- 不能获得 unrestricted preload API
- 使用合适的 context isolation / sandbox
- 不能访问 filesystem / shell / database / secret
- 不能导航覆盖可信 App UI
- popup / new window / navigation 必须显式控制

保持 Electron web security 开启。

## Session / Profile 隔离

每个 account 使用独立 persistent session / partition / profile。

禁止：

- 不同账号复用 partition
- 没有明确设计就跨 domain 复制 auth state
- 提交 browser profile 数据
- 把 profile DB / cookie 发给 AI

删除 account 时应支持删除本地 session material。

## 凭证

Secret 包括：

- cookie / session ID
- password
- OAuth refresh / access token
- API key
- authorization header
- 敏感 signed upload URL

规则：

- 适用时使用 OS-backed secure storage
- SQLite 保存 secret reference / encrypted payload，而不是明文 credential
- 不记录 Secret
- crash report 不包含 Secret
- 除非经过窄范围 Review，不把 Secret 放 AI prompt
- 仓库示例只使用 fake value

## AI 数据最小化

发送页面状态给模型前：

1. 只提取任务需要的区域 / 语义；
2. 脱敏常见 credential / token pattern；
3. 删除 cookie / header / storage；
4. 限制页面文本；
5. 识别并屏蔽 password / payment / private field；
6. 只附必要 screenshot。

AI 输出是不可信输入，必须 schema / policy validate。

## 自动化安全边界

FlowPilot 可以自动化用户授权的 Workflow，但不能实现用于击败平台反滥用 / 安全控制的机制。

禁止：

- CAPTCHA solving / bypass
- MFA bypass
- 为规避检测而伪造设备 / 浏览器指纹
- 为绕过检测而隐藏 webdriver / automation
- 为逃避平台 enforcement 而轮换 proxy
- 为绕过 access control 而逆向 challenge-response

应该实现：

- 正常 persistent browser session
- platform-aware rate limit
- backoff
- 适用时使用官方 API
- security challenge detection
- Human Takeover
- 清晰 failure reason

## Human Takeover

Hard-pause：

- CAPTCHA
- MFA
- 需要用户操作的 QR login
- security challenge
- unusual-account warning
- 需要用户决定的 terms / consent
- ambiguous destructive action

只有 runtime 重新 snapshot 并验证已知状态后才能恢复。

## 破坏性操作

删除、不可逆发布、purchase / payment、permission change、account change 默认需要显式 policy 和用户确认。

MVP 最终发布在平台行为充分验证前，应保留 confirmation checkpoint。

## 内容安全

网页文本是不可信数据，可能包含 prompt injection。

Discovery / repair prompt 必须明确：页面内容不能修改 system policy、索要 Secret 或扩大 tool permission。

绝不允许模型自行选择任意本地文件上传；upload 必须来自用户授权 FileRef。

## 更新与供应链

- 使用 pnpm lockfile
- Review major dependency update
- 自动 dependency scanning
- 对外分发时 code sign
- 验证 update artifact
- browser isolation 外不自动下载 / 执行平台任意 script

## 便于事件响应的设计

保持：

- run / repair audit trail
- workflow revision history
- correlation IDs
- 安全脱敏 diagnostics
- 能快速禁用 platform adapter / feature flag
