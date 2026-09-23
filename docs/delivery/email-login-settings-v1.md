# 邮箱登录与 Settings 页改版（Email login & Settings）— 交付说明 v1

> 讲什么：两件事，一条线。① 登录弹窗多了一条「Other email」邮箱 + 密码通路——注册（邮箱验证码）、登录、忘记密码、登录后改密码、改登录邮箱；② `/settings` 整页按账户页家族重做，并补上 Notifications、Language、Sessions、Sign out / Close account 四个模块。
> 给谁看：正式平台的前端、后端与测试。
> 什么没动：Google / Wallet / Telegram 三种登录方式本身、Create wallet 步、2FA 设置弹窗、头像与用户名弹窗、`/settings/transparency` 与 `/settings/api` 两个子页。
> 怎么读：先看 §0 找答案，再看导读；正文只写生产页和字典里看不到的口径。分轮文档 `auth-email-v1.md`、`settings-lite-v1.md` 已并入本文，只留档。

## 通俗导读

> 本节是给没读过正文的人的 5 分钟通俗解读；不替代正文、不构成需求依据，一切口径以正文为准。

### 一分钟看懂

旧版：登录只有 Google / Wallet / Telegram 三个页签；Settings 是一列窄卡片（Profile / Username / Email / Linked Account / Account security / Withdrawal verification / 两个入口按钮），每张卡自带标题和图标砖。
新版：Google 页签下多一颗 `Other email`，邮箱 + 密码也能注册登录；Settings 变成和 Wallet 同一家的「账户页」——没有页面标题，顶部一张通栏个人 hero，下面按卡片排布，新增四块。

```
登录弹窗                         /settings（桌面）
┌ Wallet · Google · Telegram ┐   ┌ PROFILE hero（头像 · 用户名 · ID · Joined · 两颗胶囊）┐
│ [Sign in with Google]      │   ├ SIGN-IN ────────────┬ ACCOUNT SECURITY ────────────┤
│ [Other email] ← 新         │   ├ WITHDRAWAL VERIF. ──┬ MORE / PREFERENCES / SESSIONS ┤
└────────────────────────────┘   ├ NOTIFICATIONS · ACCOUNT ┘（左 8 / 右 4）            │
   → email 步：登录 / 注册 /       └ SeoFooter ───────────────────────────────────────┘
     验证码 / 忘记密码
```

### 一条完整故事线

1. 用户小 A 在中国大陆打不开 Google，点登录 → Google 页签 → `Other email` → `Create account`，填邮箱和密码。
2. 进 `Verify your email`，输 6 位码（Lovable 上固定 111111，正式版发真码）→ 账号此时才建立 → Create wallet → Complete profile（邮箱只读）→ Start trading。
3. 小 A 打开 `/settings`：顶部 hero 是他的头像和用户名；SIGN-IN 卡显示 `Email & password`，右边 `Change` 可以换登录邮箱（旧新两封确认信都点了才换）。
4. 他在 ACCOUNT SECURITY 点 Password `Change` → 邮箱收到重置链接 → `/reset-password` 设新密码。
5. 他关掉 Notifications 里的「Trade confirmations」，切语言到 日本語（页头 chip 同步变 JA），在 Sessions 看到手机上还登着，点 `Sign out other devices`。
6. 某天他想注销：Close account → 余额没提完先被拦到 Wallet；提完后输入 CLOSE 确认（Lovable 上只登出并提示 `Account closed`，正式平台真删号）。

### 概念词典

| 概念 | 是什么 | 判定表达式 | 一句话类比 |
|---|---|---|---|
| email account（邮箱账号） | 用邮箱 + 密码注册的账号；邮箱就是登录凭证 | `profiles.auth_method === "email"` | 用户名密码式账号 |
| verify code（验证码） | 注册时发到邮箱的 6 位数字；Lovable 固定 111111 且不真发 | `code === DEMO_VERIFY_CODE` | 短信验证码 |
| reset link（重置链接） | 一次性、1 小时有效的改密码链接，落 `/reset-password`；登录前「忘记密码」和登录后「改密码」共用 | `resetPasswordForEmail(email, { redirectTo: origin + "/reset-password" })` | 「找回密码」邮件 |
| email change（改登录邮箱） | 邮箱账号换登录邮箱；旧、新各收一封链接，两封都点才换 | `updateUser({ email })`；等待中 `user.new_email` 有值 | 银行改预留手机号要旧号新号各确认 |
| Sign-in（登录方式卡） | 账号用什么登录：Email & password / Google account / Wallet / Telegram；方式本身不可改 | `profiles.auth_method` | 「绑定账号」页 |
| Notification email | Google / Wallet / Telegram 账号收通知与找回用的邮箱；邮箱账号的登录邮箱即通知邮箱 | `auth_method !== "email"` 时可编辑 | 联系邮箱 |
| Notifications | 四类邮件提醒开关；本批只做 email；Lovable 只存偏好不发信 | `profiles.notification_prefs.{settled,auto_close,trades,funds}`，缺省键 = true | 手机「通知设置」 |
| Language | 站点语言偏好，页头切换器与 Settings 共用；本轮不翻译页面文案 | `profiles.language`（登录）/ `localStorage omenx.language`（游客） | 系统语言 |
| Sessions | 当前账号活跃会话；本机 = JWT `session_id`；设备 = user-agent，地点 = 会话最近 IP | RPC `list_my_sessions()` | 微信「登录设备管理」 |
| Close account | 注销：余额（Standard + Boost）为 0 才可进确认；Lovable 止于确认 | `balance + spot_balance > 0` → blocked | 注销账号 |

### 易混点辨析

1. 「改密码」**不是**输旧密码改新密码，**而是**点一下发重置链接、去邮件里改——登录前后同一条线，没有旧密码框。
2. Sign-in 卡里的邮箱**不是**一个概念：邮箱账号的邮箱 = 登录凭证（走两封链接的改邮箱流程）；Google / Wallet / Telegram 账号的邮箱 = Notification email（走原来的通知邮箱弹窗）。
3. 注册**不是**填完就建号，**而是**验证码通过才建号；所以「邮箱已注册」「密码太常见」在 Lovable 上是验证码之后才得知并退回表单，正式版应在 `Continue` 时就拦。
4. Notifications 开关**不是**发信开关本身：Lovable 只存偏好；无邮箱时整卡是空态，不是四个灰开关。
5. Language **不是**页面翻译：偏好只驱动页头 chip 与邮件语言；页面 i18n 是后续批次。
6. Sessions 的「地点」**不是**城市，**而是** IP：城市解析要 geo-IP 服务，归正式后端。
7. Close account 在 Lovable 里**不会**删数据：余额为 0 → 输入 CLOSE → 登出 + toast；真删号在正式平台。
8. Withdrawal verification 里未就绪的 Authenticator 选项**仍可点**（就地打开 2FA 设置），只有「什么都没配置」时三项才全部禁用。

### 用户视角

看到：Google 页签下的 `Other email`；email 步的登录 / 注册 / 验证码 / 忘记密码 / 已发送五个画面；`/reset-password` 四态；Settings 通栏 hero、SIGN-IN、ACCOUNT SECURITY（含 Password 行）、WITHDRAWAL VERIFICATION、NOTIFICATIONS 四开关、ACCOUNT（Sign out / Close account 红行）、MORE、PREFERENCES（Language chip）、SESSIONS、页尾 SeoFooter。
看不到：验证码数字 111111；页面标题；「Username」「Email Address」独立卡和黄色「Recommended to Add Email」框；头像上的相机徽章；旧密码输入框；任何 Margin / Liquidation 交易黑话（More 卡 "liquidations" 已改 "auto-closes"）。

## 0. 读者须知

| 查什么 | 去哪 |
|---|---|
| 长什么样 | 任意登录门 → `Sign in` → Google 页签 → `Other email`（桌面弹窗 / 375 宽抽屉）；`/reset-password`；`/settings`（需登录；手机 = 375 宽）。演示账号 `alex_carter` 是 Google 账号形态；邮箱账号形态用任一 `Other email` 注册的号 |
| 每一态什么时候出现 | `/style-guide` → **Lite** 组 `登录 / 注册` 节点（AU-E1…E11 / AU-R1…R6 / AU-S1…S8）和 `Settings` 节点（ST-1…ST-31） |
| 字段名、文案、错误句、术语 | `docs/copy-dictionary.md`「Auth · Email」+「Settings（`/settings`，Lite 改版 2026-09-22）」两节（顶部有 Lite 术语对照表） |
| 视觉规则 | `DESIGN.md` `§Addendum 2026-09-19`（邮箱登录与向导步语法）+ `§Addendum 2026-09-22`（Settings 归入 ACCOUNT family + 账户页卡片语法；§4 Layout Narrow 已废止） |
| Lovable / 正式版边界 | `docs/backend-boundary.md` 的 2026-09-19 与 2026-09-22 两节 → 本文 §7 |

提问前先按上面顺序查一遍；查不到再提，提问时写明"我查了 X 没有"。

## 0.1 字典怎么看（`/style-guide` 阅读指南）

字典 = 每个模块「全部状态 × 桌面 / 手机」的活体样张：每一态都是**生产组件挂固定数据渲染出来的**，不是截图，可以直接对着抄；旁边的表告诉你这一态什么时候出现。看的顺序：

| 步 | 做什么 | 看到什么 |
|---|---|---|
| 1 | 打开 `https://omenxv2.lovable.app/style-guide`（不用登录） | 左栏节点树。本次交付只在 **Lite** 组两个节点：`登录 / 注册`（第 6–10 节）和 `Settings` |
| 2 | 点节点，先看顶部「本页目录」和黄框「定位行」 | 目录 = 小节按产品页从上到下；定位行写着路由 / 词典节 / 交付文档（本文） |
| 3 | 每张样张上方一行小字 = **编号 · 状态名** | 如 `AU-E3 · email · verify`、`ST-17 · Withdrawal verification · 什么都没配置`；样张本体是 iframe 里的真组件（桌面帧 100% 宽、手机帧 375 宽），能 hover、能点 |
| 4 | 样张下面的表 | 列固定为「状态 / 触发条件（字段 · 公式）/ 视觉结果 / 数据来源」——触发条件就是判定表达式 |
| 5 | 找某个编号 | 页头搜索框敲 `AU-S4` 或 `ST-23`，点结果自动切节点并滚到样张 |
| 6 | 单看一张 | `https://omenxv2.lovable.app/style-guide/preview?c=<key>`，多张用逗号；key 见 §11 |

编号规则：`AU-E` 弹窗 email 步 · `AU-R` /reset-password · `AU-S` Settings 里的 Password 行与改邮箱 · `AU-G` 未登录门 · `ST` Settings 页各模块；`b` = 同一状态另一端。
只在字典可见、生产暂时凑不出条件的态：Sessions loading / error（ST-25 / ST-26）、Unknown device（ST-27）、Authenticator 已启用（ST-14，需真配 2FA）、`/reset-password` 的 expired（AU-R 系列，需过期链接）。都是既定状态不是 bug。

## 1. 功能目标

1. 给打不开 Google 的用户一条不依赖第三方的登录通路：邮箱 + 密码注册登录；注册必须验证邮箱；密码只能经邮件链接重置。
2. Settings 视觉并入 ACCOUNT family，与 Wallet 同骨架同卡片语法。
3. 补齐消费级账户页应有的四块：Notifications、Preferences · Language、Sessions、Account（Sign out / Close account）。
4. 游客有门、加载失败有错误态；全部状态进字典。

## 2. 入口与路由

| 项 | 值 |
|---|---|
| 邮箱登录入口 | 登录弹窗（桌面 `AuthDialog` / 移动 `AuthSheet`）→ Google 页签 → `Sign in with Google` 下方描边副钮 `Other email` |
| 弹窗步骤 | login → **email** → createWallet → completeProfile（老账号登录成功直接关弹窗，不走后两步） |
| 重置链接落地页 | 新路由 `/reset-password`（公开可达，页面自己判断链接是否有效） |
| Settings | `/settings`：页头头像菜单 `Settings`；移动 Me 抽屉。子页 `/settings/transparency`、`/settings/api` 从 MORE 卡进（不变） |
| Close account 拦截 | `Go to Wallet` → `/wallet` |
| Sign out / Close 完成 | → `/` |

## 3. 邮箱登录通路

### 3.1 登录（已有账号）
Email + Password → `Sign in`。成功后弹窗直接关闭，**不走** createWallet / completeProfile。

### 3.2 注册（新账号）
1. `Create account` → Email + Password（至少 8 位）→ `Continue`。
2. `Verify your email`：6 格验证码，`Resend code` 60 秒冷却。
3. 验证码通过 → **此时才创建账号** → 前端建 profile 行（随机用户名 + 头像，`auth_method = "email"`，`email` 写入）→ createWallet → completeProfile（邮箱只读，提示 `This is the email you sign in with`）。
4. 在 Portfolio / Wallet / Settings 这类登录门里注册：门放行后弹窗留在页面上继续走完向导（2026-09-21 修）；老号登录仍是直接关。

Lovable 上验证码固定 111111，界面不出现这个数字，也不真发邮件。

### 3.3 忘记密码（登录前）
`Forgot password?` → 输邮箱 → `Send reset link` → `Check your inbox`。不论邮箱是否存在都显示已发送（不泄露账号存在性）。

### 3.4 改密码（登录后）
`/settings` → ACCOUNT SECURITY → Password 行 `Change`：点一下就往登录邮箱发重置链接，按钮变 `✓ 60s`，说明变 `Reset link sent — check your inbox.`，归零回 `Change`。没有弹窗、不输旧密码。只有邮箱账号有这一行。

### 3.5 `/reset-password`

| 态 | 何时 | 内容 |
|---|---|---|
| loading | 打开链接后等待会话就位（最多 4 秒） | `Checking your reset link…` |
| form | 会话就位 | `Set a new password` + `for {email}`；New / Confirm；`Update password` |
| success | 改成功 | `Password updated` + `You're signed in. Use your new password next time.` + `Go to markets` |
| expired | 4 秒内没有会话 | `This link has expired` + 说明 + `Back to markets` |

### 3.6 改登录邮箱（登录后，仅邮箱账号）
`/settings` → SIGN-IN 卡 → Email 行 `Change`：
1. 弹窗 / 抽屉输新邮箱 → `Send links`。行内错误：格式错 / `That's already your email.` / `This email is already registered.`
2. 成功态 `Check both inboxes`，列 CURRENT / NEW。**旧新各收一封确认链接，两封都点了才换**。
3. 卡片等待中：`Email` 旁 `PENDING` 胶囊，行内仍是旧邮箱，按钮 `✓ 60s` → `Resend`；说明 `Changing to {新} — open the link in both inboxes to finish. Links expire in 24 hours.`；刷新仍在（读 `user.new_email`）。
4. 两封都点 → 落回 `/settings` → 同步 `profiles.email` → toast `Email updated to {新}` → 回默认态。
5. 没有「取消」：链接 24 小时后自动作废。

## 4. Settings 页

### 4.1 骨架

| 端 | 结构 |
|---|---|
| 桌面 | `EventsDesktopHeader` → `LiteAuthGate`（游客门）→ `<main className="mx-auto w-full max-w-7xl px-4 py-10 lg:px-6 space-y-6">`：**ProfileHero**（通栏）→ `grid-cols-2 gap-6`：SIGN-IN + ACCOUNT SECURITY → `grid-cols-12 gap-6`：左 8 = WITHDRAWAL VERIFICATION / NOTIFICATIONS / ACCOUNT，右 4 = MORE / PREFERENCES / SESSIONS → `SeoFooter`。无页面标题 |
| 移动 | `MobileHeader`（preset B：`Settings` + back）→ 门 → `px-4 py-6 space-y-4`：hero(compact) → SIGN-IN → ACCOUNT SECURITY → WITHDRAWAL VERIFICATION → MORE → NOTIFICATIONS → PREFERENCES → SESSIONS → ACCOUNT → `BottomNav` |
| 游客 | `LiteAuthGate`：`Sign in to view your settings` / `Manage your profile, security and notifications by signing in to your account.`；登录后原地展开 |
| loading / error | `LoadingState "Loading profile…"` / `ErrorState`：`Couldn't load your settings` · `Check your connection and try again.` · `Try again` |

### 4.2 卡片语法（DESIGN §Addendum 2026-09-22 第 3 条，此处只列判定）
卡头 = 11px 大写微标签，**右槽只放值或计数**（`Email & password` / `3 devices`），可选一行 12px 说明；行 = hairline 行（图标 · 标题 + 内联胶囊 · 副文 · 右槽）；**句子型副文允许折两行、禁止截断**，只有邮箱 / 地址 / IP 等 mono 值单行截断；右槽只允许描边 sm 按钮 / 胶囊 / Switch / chevron；胶囊三色 muted（`NOT SET`）· primary（`THIS DEVICE`）· accent（`PENDING` / `ENABLED`）；破坏性行 `#FF5C5C`。

### 4.3 模块与行为规则

| 模块 | 规则 |
|---|---|
| Profile hero | 用户名未设置 → 灰色 `Set a username`，主胶囊 `Set username`；点头像或 `Change avatar` → 现有头像选择器；`Edit username` → 现有用户名弹窗；头像无图 → 首字母圆 |
| SIGN-IN | 邮箱账户：`Email & password`，Email 行 + `Change`（§3.6）。Google / Wallet / Telegram：右槽 `Google account` / `Wallet` / `Telegram`；行 1 登录方式（Google 显示邮箱；Wallet / Telegram 无地址 / 句柄列，值行省略）；行 2 `Notification email` + `Edit`，无邮箱 → `NOT SET` + `Needed for alerts and account recovery` + `Add`（现有通知邮箱弹窗，验证码步不变）。原 Email 卡与 Linked Account 卡不再存在 |
| ACCOUNT SECURITY | Password 行（仅邮箱账号，§3.4）；Authenticator `NOT SET` + `Set up` → Setup2FADialog；`ENABLED`（accent）+ `Disable` → confirm（提现校验依赖 2FA 时提示回落 Email only）。逻辑不变 |
| WITHDRAWAL VERIFICATION | 三选一 hairline 行 + radio；未就绪选项 dim + 琥珀 `Requires … to be configured`，点 Authenticator 类选项就地打开 2FA 设置；既无邮箱也无 2FA → 琥珀框 `Add an email in Sign-in or set up an authenticator in Account security to enable withdrawal verification.` + 三项禁用。逻辑不变 |
| NOTIFICATIONS | Settled results / Auto-close warnings / Trade confirmations / Deposits & withdrawals 四开关，存 `profiles.notification_prefs`，新用户默认全开（缺省键 = true）；切换即保存（乐观更新），失败回滚 + toast `Couldn't save that. Try again.`，无保存按钮；无邮箱 → 整卡空态 `Add an email to get alerts` + `Add email`；脚注 `Sent to {email}.`，改邮箱等待中仍显示当前地址 + ` — until your email change is confirmed.` |
| PREFERENCES · Language | 7 项 English / 简体中文 / 繁體中文 / 日本語 / 한국어 / Русский / Tiếng Việt（值 `en / zh-CN / zh-TW / ja / ko / ru / vi`）；桌面 chip + 下拉，移动 chip + 底部抽屉；选中即保存 `profiles.language` + toast `Language set to {label}`；与页头切换器共用列表与存储（`useLanguage()`），页头 chip 显示两字母 short；页面文案本轮不翻译；第二批 Español / Bahasa Indonesia / Türkçe |
| SESSIONS | 行 = 设备（user-agent → `Chrome · macOS`，解析不出 `Unknown device`）· 本机 `THIS DEVICE` · mono `{ip} · {now / n min ago / n h ago / Sep 15}`（ip 空 → `Unknown location`）；右槽 `{n} device(s)`；仅本机 → 隐藏按钮 + 脚注 `You're only signed in here.`；`Sign out other devices` → `signOut({ scope: "others" })` → toast → 列表收缩；加载失败 → `Couldn't load sessions` + `Retry`；加载中 3 组骨架 |
| ACCOUNT | `Sign out` → 立即登出回首页，无确认。`Close account`（按钮全称，与行标题一致）：`balance + spot_balance > 0` → `Withdraw your balance first` / `You still have {$x} across Standard and Boost. Withdraw it before closing your account.` + `Go to Wallet`；余额 0 → `Close your account?` / `Your profile, history and API keys are deleted. This cannot be undone.` / `Type CLOSE to confirm`，输入 `CLOSE`（不分大小写）后红钮可点；确认后 Lovable 只登出 + toast `Account closed` → `/`。两弹窗外观（2026-09-23 按设计稿重绘）：登录弹窗同款壳 + lynx 插画 + 17px 标题 + 12px 居中说明；桌面两钮并排（Cancel 描边 / 主钮），手机竖排 Cancel 在上；`Close account` 红底深字。规格在 DESIGN §Addendum 2026-09-23，字典 ST-29 / ST-30 |
| MORE | `Transparency audit / Verify assets, trades and auto-closes on-chain` → `/settings/transparency`；`API management / API keys for programmatic trading` → `/settings/api` |
| 移动 | 375 单列同模块；所有弹窗 MobileDrawer；语言选择为 drawer 列表 |

## 5. 全部状态与文案

### 5.1 弹窗 email 步

| 模式 | 标题 / 副标题 | 表单 | 主按钮 | 脚注 | Back 去哪 |
|---|---|---|---|---|---|
| signin | Sign in with email / Use the email and password you registered with. | Email、Password（眼睛显隐）、`Forgot password?` | Sign in | New to OMENX? **Create account** · 条款行 | login 步 |
| signup | Create your account / We'll send a 6-digit code to verify your email. | Email、Password（hint `At least 8 characters`） | Continue | Already have an account? **Sign in** · 条款行 | login 步 |
| verify | Verify your email / Enter the 6-digit code we sent to {email} | 6 格验证码 | Verify & create account | Didn't get it? **Resend code** / `Resend in {n}s` | signup |
| forgot | Reset your password / We'll email you a link to set a new password. | Email | Send reset link | — | signin |
| sent | Check your inbox / If an account exists for {email}, we've sent a link to reset your password. | ✓ 图标 | `Back to sign in` | — | signin |

### 5.2 错误句（行内红字，不用 toast）

| 情况 | 句子 | 出现在 |
|---|---|---|
| 邮箱或密码错 | Email or password is incorrect. | signin，两框同红，句子在 Password 下 |
| 邮箱格式不对 | Please enter a valid email address | 所有含 Email 的表单 |
| 密码不足 8 位 | Use at least 8 characters. | signup、/reset-password |
| 密码在泄露库里 | This password is too easy to guess. Choose a different one. | signup（Lovable 在验证码通过后才得知，退回表单显示）、/reset-password |
| 邮箱已注册 | This email is already registered. **Sign in** | signup（同上，退回表单；`Sign in` 一键切换） |
| 验证码错 | Incorrect code. Try again. | verify，6 格全红 |
| 两次密码不一致 | Passwords don't match. | /reset-password |
| 新邮箱与当前相同 | That's already your email. | Change email 弹窗 |
| 请求过多 / 其他 | Too many attempts. Please wait a minute and try again. / Something went wrong. Please try again. | toast（唯一走 toast 的两类） |

### 5.3 Settings 文案
全部固定句子（卡头、行、脚注、弹窗、toast）在 `docs/copy-dictionary.md`「Settings（`/settings`，Lite 改版 2026-09-22）」节，本文不复制。

## 6. 数据库与后端

| 项 | Lovable 实现 |
|---|---|
| `auth.users` | Supabase 邮箱密码账号；本库**没有**建 profile 的触发器，profile 行由前端 `upsertStarterProfile()` 在拿到会话后创建（`auth_method` / `email` / 随机用户名头像） |
| `profiles.auth_method = "email"` | 决定 Settings 是否显示 Password 行、completeProfile 邮箱只读 |
| 改邮箱 | `supabase.auth.updateUser({ email })`，Supabase「安全改邮箱」开启：`email_change_token_current` / `_new` 两个 token，`user.new_email` 等待中 |
| `profiles.notification_prefs jsonb NOT NULL DEFAULT '{"settled":true,"auto_close":true,"trades":true,"funds":true}'` | 迁移 `supabase/migrations/20260922090000_settings_prefs_sessions.sql`（已应用） |
| `profiles.language text NOT NULL DEFAULT 'en'` | 同上 |
| `public.list_my_sessions()` → `(id, created_at, last_active_at, user_agent, ip, is_current)` | SECURITY DEFINER 读 `auth.sessions`，`WHERE user_id = auth.uid() AND (not_after IS NULL OR not_after > now())`，`is_current = (id::text = auth.jwt()->>'session_id')`；仅 `authenticated` 可执行 |
| 登出其他设备 | `supabase.auth.signOut({ scope: "others" })` |
| 前端类型 | `src/integrations/supabase/types.ts` 已补三项（Lovable 重生成时保持一致） |

## 7. Lovable / 正式版边界（正式版必须补）

| # | 项 | 说明 |
|---|---|---|
| 1 | 真实邮箱验证码 | Lovable 固定 111111；正式版发 6 位码，5–10 分钟有效，60 秒重发 |
| 2 | 发码前查邮箱是否已注册、查密码策略 | Lovable 只能在验证码通过后得知；正式版在 `Continue` 时拦下并行内显示 |
| 3 | 重置链接 / 改邮箱两封确认信的投递 | Lovable 用 Supabase 默认邮件通道；正式版走自有邮件服务，链接一次性、1 小时（改邮箱 24 小时）有效 |
| 4 | 改密码 / 改邮箱后 24 小时禁提现 | CEX 惯例；Lovable 无提现冻结机制，界面未写；正式版加上并在 Password 行说明 |
| 5 | 登录失败限速 | Lovable 依赖 Supabase 默认限速；正式版按 IP + 邮箱限速并接验证码 |
| 6 | 服务端建 profile | 见 §6 |
| 7 | 真实发信（四类通知按 `notification_prefs` + `language`） | Lovable 只存偏好；浏览器推送 / Telegram 通知第二批 |
| 8 | 页面 i18n | 偏好已存；页面文案翻译后续批次；第二批语言 es / id / tr |
| 9 | Sessions 地点 IP → 城市（geo-IP）、更完整的 UA 解析 | Lovable 显示 IP |
| 10 | Close account 真实异步注销 + 二次验证（邮箱码 / 2FA）+ 合规保留交易记录 | Lovable 确认后只登出 |
| 11 | Authenticator 行的启用日期 | `user_security` 不暴露时间 |
| 12 | hero 底图 | Wallet 同位素材槽，待 CPO 提供 |

## 8. 已删除 / 已废弃

| 项 | 说明 |
|---|---|
| Settings 页面标题 / `max-w-3xl` 容器 | DESIGN §4「Layout Narrow」同日废止，Settings 归 ACCOUNT family，全站零 `max-w-3xl` |
| Username 卡、Email Address 卡（含黄色「Recommended to Add Email」框）、Linked Account 卡 | 合并为 hero + SIGN-IN 卡 |
| 头像相机徽章 | 换成 `Change avatar` 胶囊；点头像仍可换 |
| 卡片 h3 标题 + 图标砖、`bg-muted/30 rounded-xl` 内框 | 换成微标签 + hairline 行 |
| More 卡 "liquidations" | Lite 禁词，改 "auto-closes" |
| `index.html` 从 fonts.googleapis.com 加载字体 | 四款字体自托管在 `public/fonts/`（`fonts.css`），字体族名不变；正式版照搬目录 |

## 9. 未变更项

Google 账号选择器、Wallet / Telegram 页签、createWallet 步内容、头像选择器与用户名弹窗、通知邮箱弹窗（含验证码步）、Setup2FADialog、提现校验逻辑、`/settings/transparency`、`/settings/api`。

## 10. 状态索引

| 模块 | 编号 |
|---|---|
| 弹窗 email 步：signin / signup / verify / forgot / sent + 错误态 | AU-E1…E11 |
| `/reset-password` 四态 | AU-R1…R6 |
| Settings Password 行默认 / 已发送 | AU-S1 / AU-S2（= ST-12 / ST-13） |
| Sign-in 卡（邮箱账号）默认 / pending / cooldown；Change email 弹窗 input / error / sent | AU-S3…S8（= ST-6…ST-8） |
| 登录门 + 门内注册向导 | AU-G1 / AU-G2 |
| Settings 页面 guest / loading / error | ST-1 / ST-2 / ST-3 |
| Profile hero 已设 / 未设 / 移动 | ST-4 / ST-5 / ST-4b |
| Sign-in Google / Wallet / Telegram | ST-9 / ST-10 / ST-11 |
| Account security Authenticator ENABLED | ST-14 |
| Withdrawal verification 默认 / 全可选 / 什么都没配置 | ST-15 / ST-16 / ST-17 |
| Notifications 全开 / 部分关 / 无邮箱 | ST-18 / ST-19 / ST-20 |
| Preferences chip / 下拉 | ST-21 / ST-22 |
| Sessions 多设备 / 仅本机 / loading / error / 未知设备 | ST-23…ST-27 |
| Account 行 / 余额未清弹窗 / 确认弹窗 | ST-28 / ST-29 / ST-30 |
| More | ST-31 |

## 11. 验收记录

2026-09-22 在 mainnet（`omenxv2.lovable.app`）实机走过，桌面 1280 + 手机 375，测试号注册后删除：

| # | 操作 | 应该看到 | 结果 |
|---|---|---|---|
| 1 | 游客开 `/settings` | 登录门 `Sign in to view your settings` | ✅ |
| 2 | 门内 Create account → Other email → 邮箱 + 密码 → 111111 | 门放行，向导继续 Create wallet → Complete profile（邮箱只读）→ Start trading | ✅ |
| 3 | 桌面页 | 通栏 hero、SIGN-IN + ACCOUNT SECURITY 并排、8/4 栅格、footer、无标题 | ✅ |
| 4 | Notifications 关一个开关再开 | 即时保存，DB `notification_prefs` 同步 | ✅ |
| 5 | Language 选 日本語 | toast `Language set to 日本語`，chip 变 日本語，页头菜单 Language 显示 JA，刷新保持 | ✅ |
| 6 | 两处登录 → Sessions | `2 devices`，本机 `THIS DEVICE`；`Sign out other devices` → toast → `1 device` + `You're only signed in here.` | ✅ |
| 7 | 余额 > 0 点 `Close account` | `Withdraw your balance first … $12.50 across Standard and Boost` + Go to Wallet | ✅ |
| 8 | 余额 0 点 `Close account` | 确认弹窗，输入 CLOSE 后红钮可点，Cancel 关闭 | ✅ |
| 9 | 手机 375 | hero compact + 两颗胶囊；单列；Language chip → 底部抽屉；`Close account` → 底部抽屉 | ✅ |
| 10 | 副文折行 | Language 说明折两行完整显示，不再截断 | ✅ |
| 10b | Account 卡按钮（09-23 修） | 按钮全称 `Close account`，不再是 `Close…` | ✅ |
| 10c | Close account 两弹窗（09-23 重绘） | 桌面：渐变壳 + 插画 + 并排两钮；手机 375：抽屉同壳、竖排 Cancel 在上；输入 CLOSE 后红钮（深字）可点 | ✅ |
| 11 | 邮箱登录剧本（登录 / 注册 / 错误句 / 忘记密码 / 重置页四态 / 改密码行 / 改邮箱两封链接） | 见 2026-09-19 记录（`auth-email-v1.md` §9，21 步全过） | ✅ |
| 12 | 字典 | `/style-guide` 登录 / 注册 节点 35 case + Settings 节点 30 key 全部渲染；`npm run sg:audit` PASS | ✅ |

## 12. 涉及文件

前端：`src/components/auth/EmailAuthPanel.tsx` · `AuthContent.tsx` · `AuthDialog.tsx` · `AuthSheet.tsx` · `LiteAuthGate.tsx` · `src/pages/ResetPassword.tsx` · `src/pages/Settings.tsx` · `src/components/settings/{SettingsCard,ProfileHero,LinkedEmailAccountCard,ProviderSignInCard,ChangeLoginEmailDialog,AccountSecurityCard,WithdrawalVerificationCard,NotificationsCard,PreferencesCard,SessionsCard,AccountCard,MoreCard}.tsx` · `src/lib/emailAuth.ts` · `src/lib/starterProfile.ts` · `src/lib/languages.ts` · `src/hooks/useLanguage.ts` · `src/hooks/useUserProfile.ts` · `src/components/EventsDesktopHeader.tsx` · `public/fonts/` · `src/assets/settings/lynx-close-{blocked,confirm}.png`
后端：`supabase/migrations/20260922090000_settings_prefs_sessions.sql` · `src/integrations/supabase/types.ts`
字典：`src/pages/StyleGuide/preview/authPreviews.tsx` · `settingsPreviews.tsx` · `sections/pages/AuthPage.tsx` · `LiteSettingsPage.tsx`
文档：`DESIGN.md` §Addendum 2026-09-19 / 2026-09-22 / 2026-09-23 · `docs/copy-dictionary.md` · `docs/backend-boundary.md` · `docs/changelog/INDEX.md` · `STATUS.md`

字典 key（`/style-guide/preview?c=`）：`auth-email-*`（AU-E）、`auth-reset-*`（AU-R）、`settings-security-email-default` `settings-security-email-sent` `settings-linked-email-default` `settings-linked-email-pending` `settings-linked-email-cooldown` `settings-change-email-input` `settings-change-email-error` `settings-change-email-sent` `settings-page-guest` `settings-page-loading` `settings-page-error` `settings-hero-default` `settings-hero-unset` `settings-hero-mobile` `settings-signin-google` `settings-signin-wallet` `settings-signin-telegram` `settings-security-totp-enabled` `settings-withdrawal-default` `settings-withdrawal-all-enabled` `settings-withdrawal-nothing` `settings-notifications-default` `settings-notifications-some-off` `settings-notifications-no-email` `settings-preferences-default` `settings-preferences-open` `settings-sessions-many` `settings-sessions-single` `settings-sessions-loading` `settings-sessions-error` `settings-sessions-unknown` `settings-account-default` `settings-account-blocked` `settings-account-confirm` `settings-more`

## 13. 轮次代号 ↔ 章节

| 代号 | 白话含义 | 本文章节 |
|---|---|---|
| EM-1 / EM-A…EM-L | 2026-09-19 邮箱 + 密码登录轮（含改登录邮箱 plan A、登录门向导修复、字体自托管） | §3、§5、§7 #1–6、§8 末行 |
| ST-1 / ST-A…ST-M | 2026-09-22 Settings 改版轮（mock v1–v5，A 方案 hero） | §4、§6、§7 #7–12、§8 |
| 分轮文档 | `docs/delivery/auth-email-v1.md`、`docs/delivery/settings-lite-v1.md` | 已并入本文，只留档 |
