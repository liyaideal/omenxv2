# 邮箱 + 密码登录（Other email）— 交付说明 v1

> 讲什么：登录弹窗里新增的「Other email」邮箱密码通路——注册（邮箱验证码）、登录、忘记密码、设置页改密码，以及它们落在哪几个页面。
> 给谁看：真平台前端、后端与测试。
> 怎么读：先照 §0 找答案，本文只写生产页和字典里看不到的东西。

## §0 读者须知

| 查什么 | 去哪 |
|---|---|
| 长什么样 | 生产页任意登录门 → `Sign in` → Google 页签 → `Other email`（桌面弹窗 / 375 宽度抽屉）；`/reset-password`；`/settings` → Account security |
| 每一态什么时候出现 | `/style-guide` → Lite → 登录 / 注册 → 第 6、7、8 节（AU-E1…E11 / AU-R1…R6 / AU-S1…S2，每一态都是生产组件挂固定数据渲染） |
| 文案、错误句、概念 | `docs/copy-dictionary.md` 的「Auth · Email」节 + 本文 §4 |
| 视觉规则 | `DESIGN.md` 文末 `§Addendum 2026-09-19 · 邮箱登录与向导步语法` |
| 后端边界 | `docs/backend-boundary.md` 的「2026-09-19 邮箱登录」节 |

Lite 术语对照表在 `docs/copy-dictionary.md` 顶部。本功能不涉及交易词汇。

## 1. 功能目标

给打不开 Google 的用户（主要是中国大陆）一条不依赖第三方的登录通路：用邮箱 + 密码注册和登录。注册必须验证邮箱；密码只能通过发到邮箱的重置链接来修改（登录前的「忘记密码」和登录后的「改密码」是同一条线，不存在「输旧密码改新密码」的界面）。

## 2. 入口与路由

| 项 | 值 |
|---|---|
| 入口 | 登录弹窗（桌面 `AuthDialog` / 移动 `AuthSheet`）→ Google 页签 → `Sign in with Google` 按钮下方的描边副钮 `Other email` |
| 弹窗内步骤 | 原三步 login → createWallet → completeProfile 之间插入 `email` 步：login → **email** → createWallet → completeProfile |
| 重置链接落地页 | 新路由 `/reset-password`（公开可达，页面自己判断链接是否有效） |
| 设置页 | `/settings` → Account security 卡 → `Password` 行（只有邮箱注册的账号才有这一行） |
| 组件 | `src/components/auth/EmailAuthPanel.tsx`（email 步全部内容）· `src/pages/ResetPassword.tsx` · `src/components/settings/AccountSecurityCard.tsx` |
| 逻辑 | `src/lib/emailAuth.ts`（登录 / 注册 / 发重置链接 / 改密码 + 错误句映射）· `src/lib/starterProfile.ts`（首次登录建 profile 行，所有登录方式共用） |

## 3. 流程

### 3.1 登录（已有账号）

Email + Password → `Sign in`。成功后弹窗直接关闭，进入站内，**不走** createWallet / completeProfile（这两步只给新账号）。

### 3.2 注册（新账号）

1. 在登录表单点 `Create account` → Email + Password（至少 8 位）→ `Continue`。
2. 进入 `Verify your email`：6 格验证码，`Resend code` 60 秒冷却。
3. 验证码通过 → **此时才创建账号** → 建 profile 行（随机用户名 + 头像，`auth_method = "email"`，`email` 写入）→ 进入 createWallet → completeProfile。completeProfile 里的邮箱框只读（它就是登录凭证），下方提示 `This is the email you sign in with`。

**蓝图站的验证码是固定的 111111**，界面上不出现这个数字，也不真的发邮件。真平台必须发真实验证码（见 §6）。

### 3.3 忘记密码（登录前）

登录表单 `Forgot password?` → 输入邮箱 → `Send reset link` → `Check your inbox`。不论邮箱是否存在，界面都显示已发送（不能泄露某个邮箱有没有账号）。邮件里的链接落到 `/reset-password`。

### 3.4 改密码（登录后）

`/settings` → Account security → `Password` 行 → `Change`。点一下就往登录邮箱发重置链接，按钮变成 `✓ 60s` 倒计时，说明文字变成 `Reset link sent — check your inbox.`；倒计时归零按钮回到 `Change`。没有弹窗、不输旧密码。

### 3.5 `/reset-password`

| 态 | 何时 | 内容 |
|---|---|---|
| loading | 打开链接后等待会话就位（最多 4 秒） | `Checking your reset link…` |
| form | 会话就位 | `Set a new password` + `for {email}`；New password / Confirm new password；`Update password` |
| success | 改成功 | `Password updated` + `You're signed in. Use your new password next time.` + `Go to markets`（→ `/events`） |
| expired | 4 秒内没有会话 | `This link has expired` + 说明（一次性、1 小时）+ `Back to markets` |

### 3.6 改登录邮箱（登录后，仅邮箱账号）

`/settings` → Linked Account 卡 → 邮箱行右侧 `Change`（Profile 卡的 Email「Edit」对邮箱账号隐藏——那是给 Google / Wallet / Telegram 账号改联系邮箱的，邮箱账号的邮箱就是登录凭证）。

1. 弹窗（桌面）/ 抽屉（手机）：输新邮箱 → `Send links`。行内错误：格式错 / 和当前一样 `That's already your email.` / 已被注册 `This email is already registered.`。
2. 成功态 `Check both inboxes`，列出 CURRENT / NEW 两个邮箱。**旧邮箱和新邮箱各收一封确认链接，两封都点了才真正换**（Supabase「安全改邮箱」，2026-09-19 查库确认两个 token 都生成）。
3. 卡片进入等待中：`Email` 旁 `Pending` 徽标，框里仍是旧邮箱（账号此刻还是旧邮箱），按钮 `✓ 60s` 倒计时 → `Resend`；说明 `Changing to {新} — open the link in both inboxes to finish. Links expire in 24 hours.`。刷新页面等待态还在（读 `user.new_email`）。
4. 两封都点了 → 链接落回 `/settings` → 页面发现登录邮箱变了 → 同步 `profiles.email` → toast `Email updated to {新}` → 卡片回默认态显示新邮箱。
5. 没有「取消」：Supabase 没有取消接口，链接 24 小时后自动作废。

## 4. 全部状态与文案（逐项）

### 4.1 email 步（弹窗内）

| 模式 | 标题 / 副标题 | 表单 | 主按钮 | 脚注 | Back 去哪 |
|---|---|---|---|---|---|
| signin | Sign in with email / Use the email and password you registered with. | Email、Password（眼睛显隐）、右对齐 `Forgot password?` | Sign in | New to OMENX? **Create account** · 条款行 | login 步 |
| signup | Create your account / We'll send a 6-digit code to verify your email. | Email、Password（hint `At least 8 characters`） | Continue | Already have an account? **Sign in** · 条款行 | login 步 |
| verify | Verify your email / Enter the 6-digit code we sent to {email} | 6 格验证码 | Verify & create account | Didn't get it? **Resend code** / `Resend in {n}s` | signup |
| forgot | Reset your password / We'll email you a link to set a new password. | Email | Send reset link | — | signin |
| sent | Check your inbox / If an account exists for {email}, we've sent a link to reset your password. | ✓ 图标 | `Back to sign in`（描边副钮） | — | signin |

### 4.2 错误句（行内红字，不用 toast）

| 情况 | 句子 | 出现在 |
|---|---|---|
| 邮箱或密码错 | Email or password is incorrect. | signin，两个输入框同时红边，句子在 Password 下 |
| 邮箱格式不对 | Please enter a valid email address | 所有含 Email 的表单 |
| 密码不足 8 位 | Use at least 8 characters. | signup、/reset-password |
| 密码在泄露库里（太常见） | This password is too easy to guess. Choose a different one. | signup（蓝图在验证码通过后才得知，退回表单显示在 Password 下）、/reset-password |
| 邮箱已注册 | This email is already registered. **Sign in** | signup（蓝图站在验证码通过后才得知，退回表单显示；`Sign in` 一键切换） |
| 验证码错 | Incorrect code. Try again. | verify，6 格全红 |
| 两次密码不一致 | Passwords don't match. | /reset-password |
| 请求过多 | Too many attempts. Please wait a minute and try again. | toast |
| 其他 | Something went wrong. Please try again. | toast（唯一走 toast 的两类） |

### 4.3 设置页

| 项 | 文案 |
|---|---|
| Linked Account 卡 | 图标 Mail，标签 `Email`，说明 `Email & password`；`You signed in via Email.` |
| Password 行（默认） | `Password` / `Change it with a link sent to your email` / 按钮 `Change` |
| Password 行（已发） | `Password` / `Reset link sent — check your inbox.` / 按钮 `✓ {n}s`（禁用） |
| toast | `Reset link sent to {email}` |

## 5. 数据

| 字段 | 值 | 谁写 |
|---|---|---|
| `auth.users` | Supabase 邮箱密码账号 | Supabase Auth |
| `profiles.auth_method` | `"email"` | 前端在验证码通过、账号建立后写（`starterProfile.ts`），与 Google / Wallet / Telegram 三条演示通路同一段代码 |
| `profiles.email` | 注册邮箱 | 同上 |
| `profiles.username` / `avatar_url` | 随机（与其他通路一致） | 同上 |

本库的 `auth.users` 上**没有**建 profile 的触发器（2026-09-19 查库确认），profile 行一律由前端在拿到会话后创建；正式后端应改为服务端创建。

## 6. 真平台必须补的（蓝图做不到或有意没做）

| # | 项 | 说明 |
|---|---|---|
| 1 | 真实邮箱验证码 | 蓝图固定 111111；正式版发 6 位验证码，5–10 分钟有效，60 秒重发 |
| 2 | 发码前查邮箱是否已注册、查密码策略 | 蓝图只能在验证码通过后（尝试建号时）得知「已注册」和「密码太常见」；正式版应在 `Continue` 时就拦下并行内显示 |
| 3 | 重置链接的邮件投递 | 蓝图用 Supabase 默认邮件通道，能否送达取决于环境；正式版走自有邮件服务，链接一次性、1 小时有效 |
| 3b | 改邮箱的邮件投递 | 同上；正式版两封确认邮件走自有通道；CEX 惯例改邮箱后 24 小时禁提现，蓝图未做、界面未写 |
| 4 | 改密码后的资金保护 | CEX 惯例：改密码后 24 小时禁止提现。蓝图没有提现冻结机制，所以界面上没写这句话；正式版加上并在 Password 行说明 |
| 5 | 登录失败限速 | 蓝图依赖 Supabase 默认限速；正式版按 IP + 邮箱限速并接验证码 |
| 6 | 服务端建 profile | 见 §5 |

## 7. 同轮附带：品牌字体自托管

`index.html` 不再从 fonts.googleapis.com 加载字体。四款字体（Archivo 400/500/600/700、Space Grotesk 400/500/600/700、Bebas Neue、Anton）的 woff2 放在 `public/fonts/`，由 `public/fonts/fonts.css` 声明，字体族名不变。原因同本功能：国内打不开 Google。真平台照搬 `public/fonts/` 目录即可。

## 7b. 登录门内注册的向导（2026-09-21 修）

Portfolio / Wallet 这类「登录后才能看」的门（`LiteAuthGate`）里点 Sign in 注册新号：以前验证码一过门就放行，弹窗被一起卸掉，用户看不到 Create wallet → Complete profile。现在门放行后弹窗留在页面上继续走完向导；老号登录仍是弹窗直接关。

## 8. 不在本功能范围内

Google 账号选择器、Wallet / Telegram 页签、createWallet 步的内容、LiteAuthGate 未登录门、Settings 里改邮箱的流程。

## 9. 验收剧本（测试用）

| # | 操作 | 应该看到 |
|---|---|---|
| 1 | 未登录 → 任意 `Sign in` → Google 页签 | Google 按钮下有 `Other email` 描边副钮 |
| 2 | 点 `Other email` | 顶左 `← Back`、标题 `Sign in with email`，没有山猫和页签 |
| 3 | 随便填邮箱 + 错密码 → Sign in | 两框红边 + `Email or password is incorrect.` |
| 4 | `Create account` → 新邮箱 + 7 位密码 → Continue | Password 红边 + `Use at least 8 characters.` |
| 5 | 改成 8 位 → Continue | `Verify your email`，6 格，`Resend in 60s` |
| 6 | 输 123456 → Verify | 6 格红边 + `Incorrect code. Try again.` |
| 7 | 输 111111 → Verify | toast `Email verified — welcome to OMENX!` → `Create your wallet` → `Complete your profile`（邮箱只读） |
| 8 | 用已注册邮箱走 4–7 | 退回 `Create your account`，Email 红边 + `This email is already registered. Sign in` |
| 9 | 退出 → `Other email` → 刚注册的邮箱密码 → Sign in | toast `Welcome back!`，弹窗直接关闭，不再走 createWallet |
| 10 | `Forgot password?` → 任意邮箱 → Send reset link | `Check your inbox`（存在与否都一样） |
| 11 | 登录态 `/settings` | Linked Account 显示 `Email`；Account security 有 `Password` 行 |
| 12 | 点 `Change` | 按钮 `✓ 60s`，说明 `Reset link sent — check your inbox.`，toast |
| 13 | 打开邮件链接（或登录态直接开 `/reset-password`） | `Set a new password`；两次不一致 → `Passwords don't match.`；成功 → `Password updated` |
| 14 | 未登录直接开 `/reset-password` | 4 秒后 `This link has expired` |
| 15 | Google / Wallet / Telegram 账号开 `/settings` | 没有 `Password` 行 |
| 16 | 邮箱账号 `/settings` | Profile 卡没有 Email Edit；Linked Account 邮箱行右侧有 `Change` |
| 17 | 点 Change → 输当前邮箱 → Send links | 红边 + `That's already your email.` |
| 18 | 输别人已注册的邮箱 | `This email is already registered.` |
| 19 | 输新邮箱 → Send links | `Check both inboxes` + CURRENT / NEW 两行；Done 后卡片出现 `Pending` 徽标 + `✓ 60s`，刷新仍在 |
| 21 | 未登录开 `/portfolio` → 门里的 Sign in → Other email → 注册新号 → 111111 | 门放行、Portfolio 内容出来，弹窗继续 `Create your wallet` → `Complete your profile` → Start trading 关闭 |
| 20 | 两个邮箱各点一次链接（需真实邮箱） | 回到 /settings，toast `Email updated to {新}`，卡片显示新邮箱、徽标消失 |
