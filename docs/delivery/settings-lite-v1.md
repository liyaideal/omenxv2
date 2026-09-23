# Settings 页 Lite 改版 — 交付说明 v1

> 已并入 [email-login-settings-v1.md](./email-login-settings-v1.md)（邮箱登录与 Settings 页改版总文档，2026-09-23），本文只留档；研发以总文档为准。

日期：2026-09-22 · 范围：`/settings`（桌面 + 移动）· 决策：Liya（CPO）逐条签字 24 条行为规则 + mock v5（A 方案 hero）· Lovable commits `e2e5c96d`（产品）/ `65ddc440`（字典）/ 本文档同轮

## 通俗导读

Settings 以前是一列窄卡片（`max-w-3xl`），每张卡自带标题和图标砖，和 Wallet 长得不像一家人。这轮把它并进「账户页家族」：页面不再有标题，顶部一张通栏的个人 hero（头像、用户名、ID、加入日期、两颗胶囊按钮），下面是两张并排卡（登录方式、账户安全），再下面 8 / 4 两列。所有卡片统一「小写大写微标签 + 细线行」的语法，右上角只放值或计数，不放句子。

功能上补了四块以前没有的东西：**Notifications**（四类邮件提醒开关）、**Preferences · Language**（7 种语言，和页头的语言切换是同一份设置）、**Sessions**（你在哪些设备登录着，可以一键登出其他设备）、**Account**（登出、注销）。登录方式卡把原来的 Email 卡和 Linked Account 卡合成一张。游客打开 `/settings` 会看到登录门，不再是空白。

### 易混点辨析

1. Sign-in 卡里的邮箱**不是**一个概念：邮箱账号的邮箱 = 登录凭证（走「改登录邮箱」两封链接流程）；Google / Wallet / Telegram 账号的邮箱 = Notification email（只用于通知与找回，走原来的通知邮箱弹窗）。
2. Notifications 开关**不是**发信开关本身：Lovable 只存偏好，真正发信在正式平台；无邮箱时整卡是空态，不是四个灰开关。
3. Language **不是**页面翻译：本轮页面文案仍全英文，偏好只驱动页头 chip 与邮件语言；页面 i18n 是后续批次。
4. Sessions 的「地点」 Lovable 显示的是 IP**不是**城市：城市解析要 geo-IP 服务，归正式后端。
5. Close account 在 Lovable 里**不会**删数据：余额为 0 → 输入 CLOSE → 登出 + toast `Account closed`；真删号在正式平台。
6. Withdrawal verification 里未就绪的 Authenticator 选项**仍可点**（就地打开 2FA 设置），只有「什么都没配置」时三项才全部禁用。

### 用户视角

看到：通栏 hero（用户名、ID、Joined、Edit username / Change avatar 胶囊）；SIGN-IN 卡（登录方式 + 通知邮箱）；ACCOUNT SECURITY；WITHDRAWAL VERIFICATION；NOTIFICATIONS 四开关；ACCOUNT（Sign out / Close account 红行）；MORE（Transparency audit / API management）；PREFERENCES（Language chip）；SESSIONS（设备列表 + Sign out other devices）；页尾 SeoFooter。
看不到：页面标题；「Username」独立卡；「Email Address」独立卡与黄色「Recommended to Add Email」框；头像上的相机小徽章；任何 Margin / Liquidation 等交易黑话（More 卡 "liquidations" 已改 "auto-closes"）。

## 0. 读者须知

查什么去哪儿：
- 长什么样 → 生产页 `/settings`（需登录；手机 = 375 宽）。演示账号 `alex_carter`（Google 账号形态）；邮箱账号形态用任一 `Other email` 注册的号。
- 什么时候变成什么样 → `/style-guide` → **Lite** 组 **Settings** 节点（ST-1…ST-31）；改登录邮箱与密码行的既有 case 在 **登录 / 注册** 节点第 8–10 节（AU-S1…S8）。
- 字段名、文案、术语 → `docs/copy-dictionary.md`「Settings（`/settings`，Lite 改版 2026-09-22）」+「Auth · Email」
- 设计法则（容器、hero、卡片语法、胶囊、弹层） → `DESIGN.md` §Addendum 2026-09-22（并注意 §4 Layout Narrow 已废止、Two Openings 里 Settings 移到 A）
- Lovable / 正式版边界 → `docs/backend-boundary.md` 2026-09-22 节 → 本文 §8

## 0.1 字典怎么看（`/style-guide` 阅读指南）

字典 = 每个模块「全部状态 × 桌面 / 手机」的活体样张：每一态都是**生产组件挂固定数据渲染出来的**，不是截图，可以直接对着抄；旁边的表告诉你这一态什么时候出现。看的顺序：

| 步 | 做什么 | 看到什么 |
|---|---|---|
| 1 | 打开 `https://omenxv2.lovable.app/style-guide`（不用登录） | 左栏节点树。本次交付在 **Lite** 组的 `Settings` 节点；改邮箱 / 密码行沿用 `登录 / 注册` 节点第 8–10 节 |
| 2 | 点节点，先看顶部黄框「定位行」 | 写着：这页对应哪个路由；字段 / 文案去 `copy-dictionary.md` 哪一节；口径去哪份交付文档（本文） |
| 3 | 小节 Ⓐ–Ⓙ = 生产页从上到下的模块序 | Ⓐ页面外壳 · Ⓑhero · ⒸSign-in · ⒹAccount security · ⒺWithdrawal verification · ⒻNotifications · ⒼPreferences · ⒽSessions · ⒾAccount · ⒿMore |
| 4 | 每张样张上方一行小字 = **编号 · 状态名** | 如 `ST-17 · Withdrawal verification · 什么都没配置（Wallet 账号）`；样张本体是 iframe 里的真组件（桌面帧 100% 宽、手机帧 375 宽），能 hover、能点 |
| 5 | 样张下面的表 | 列固定为「状态 / 触发条件（字段 · 公式）/ 视觉结果 / 数据来源」——触发条件就是判定表达式 |
| 6 | 找某个编号 | 页头搜索框敲 `ST-23` 或文字，点结果自动切节点并滚到样张 |
| 7 | 单看一张 | `https://omenxv2.lovable.app/style-guide/preview?c=<key>`，key 见 §10 |

只在字典可见、生产暂时凑不出条件的态：Sessions loading / error（ST-25 / ST-26）、Unknown device（ST-27）、Authenticator 已启用（ST-14，需真配 2FA）。

## 1. 功能目标

1. Settings 视觉并入 ACCOUNT family，与 Wallet 同一套骨架与卡片语法（DESIGN §Addendum 2026-09-22）。
2. 补齐消费级账户页应有的四个模块：Notifications、Preferences · Language、Sessions、Account（Sign out / Close account）。
3. 游客有门、加载失败有错误态，不再渲染空页。
4. 全部状态进字典，研发按 ST-1…ST-31 逐条实现 / 验收。

## 2. 入口与路由

- `/settings`：页头头像菜单 `Settings`；移动 Me 抽屉。路由不变。
- `/settings/transparency`、`/settings/api`：More 卡两行 → 各自页面（不变）。
- `Go to Wallet`（Close account 余额拦截）→ `/wallet`。
- Sign out / Close account 完成 → `/`。

## 3. 页面骨架

| 端 | 结构 |
|---|---|
| 桌面 | `EventsDesktopHeader` → `LiteAuthGate`（游客门）→ `<main className="mx-auto w-full max-w-7xl px-4 py-10 lg:px-6 space-y-6">`：**ProfileHero**（通栏）→ `grid-cols-2 gap-6`：**Sign-in** + **Account security** → `grid-cols-12 gap-6`：左 8 = Withdrawal verification / Notifications / Account，右 4 = More / Preferences / Sessions → `SeoFooter` |
| 移动 | `MobileHeader`（preset B：`Settings` + back）→ 门 → `px-4 py-6 space-y-4`：hero(compact) → Sign-in → Account security → Withdrawal verification → More → Notifications → Preferences → Sessions → Account → `BottomNav` |
| loading | `LoadingState "Loading profile…"` |
| error | `ErrorState`：`Couldn't load your settings` / `Check your connection and try again.` / `Try again` → `refetchProfile()` |

## 4. 模块与行为规则（CPO 2026-09-22 签字 24 条，逐条对应）

### 4.1 页面（规则 1–2）
- 游客 → LiteAuthGate（`Sign in to view your settings` / `Manage your profile, security and notifications by signing in to your account.`），登录后原地展开，不跳转。
- profile 拉取失败 → 整页 ErrorState + Try again。

### 4.2 Profile hero（规则 3–4）· `ProfileHero.tsx`
- 用户名未设置 → display 位灰色 `Set a username`，主胶囊 `Set username`；设置后 `Edit username`。
- 点头像或 `Change avatar` → 现有头像选择器；`Edit username` → 现有用户名弹窗（3–20 字符）。逻辑不改。
- 头像无图 → 首字母圆（用户名或邮箱首字母）。

### 4.3 Sign-in（规则 5–7）· `LinkedEmailAccountCard.tsx` / `ProviderSignInCard.tsx`
- 邮箱账号：`SIGN-IN · Email & password`，一行 Email / 地址 / `Change`；pending / cooldown / Resend / 同步 toast 逻辑沿用 09-19（AU-S3…S8）。
- Google / Wallet / Telegram：右槽 `Google account` / `Wallet` / `Telegram`；行 1 登录方式（Google 显示邮箱；Wallet / Telegram Lovable 无地址 / 句柄列，值行省略）；行 2 `Notification email` + `Edit`，无邮箱 → `NOT SET` 胶囊 + `Needed for alerts and account recovery` + `Add`（现有通知邮箱弹窗，验证码步不变）。
- 原 Email 卡与 Linked Account 卡不再存在。

### 4.4 Account security / Withdrawal verification（规则 8–9）
- 逻辑全部沿用：密码重置链接 + 60s 冷却；2FA Set up / Disable（confirm）；三种提现校验的可选条件与就地 2FA 设置。
- 换皮：hairline 行；Authenticator `NOT SET`（muted）/ `ENABLED`（accent）胶囊；未就绪选项 `opacity-55` + 琥珀 `Requires … to be configured`。
- 既无邮箱也无 2FA → 琥珀框 `Add an email in Sign-in or set up an authenticator in Account security to enable withdrawal verification.`，三项全禁用。

### 4.5 Notifications（规则 10–13）· `NotificationsCard.tsx`
- 四个开关：Settled results / Auto-close warnings / Trade confirmations / Deposits & withdrawals；存 `profiles.notification_prefs`（jsonb），新用户默认全开（缺省键读作 true）。
- 切换即保存（乐观更新）；失败回滚 + toast `Couldn't save that. Try again.`；无保存按钮。
- 无邮箱 → 整卡空态 `Add an email to get alerts` + `Add email`（打开 4.3 的通知邮箱弹窗）。
- 脚注 `Sent to {email}.`；改邮箱等待中仍显示当前地址 + ` — until your email change is confirmed.`
- Lovable 只存偏好不发信（§8）。

### 4.6 Preferences · Language（规则 14–15）· `PreferencesCard.tsx` / `src/lib/languages.ts` / `useLanguage()`
- 7 项：English / 简体中文 / 繁體中文 / 日本語 / 한국어 / Русский / Tiếng Việt（值 `en / zh-CN / zh-TW / ja / ko / ru / vi`）；选中即保存 `profiles.language` + toast `Language set to {label}`。
- 与页头语言切换器共用同一份列表与存储（登录：profile；游客：`localStorage omenx.language`），任一处改另一处同步；页头 chip 显示两字母 `short`（EN / ZH / TW / JA / KO / RU / VI）。
- 页面文案本轮不翻译。第二批：Español / Bahasa Indonesia / Türkçe。

### 4.7 Sessions（规则 16–18）· `SessionsCard.tsx` · RPC `list_my_sessions()`
- 行：设备（user-agent → `Chrome · macOS` / `Safari · iPhone` …，解析不出 → `Unknown device`）· 本机 `THIS DEVICE` 胶囊 · mono `{ip} · {now | n min ago | n h ago | Sep 15}`（ip 为空 → `Unknown location`）。**Lovable 显示 IP，城市解析归正式后端。**
- 仅本机 → 隐藏按钮，脚注 `You're only signed in here.`；右槽 `{n} device(s)`。
- `Sign out other devices` → `signOut({ scope: "others" })` → toast `Signed out other devices` → 列表收缩为本机；加载失败 → 卡内 `Couldn't load sessions` + `Retry`；加载中 3 组骨架。

### 4.8 Account（规则 19–21）· `AccountCard.tsx`
- `Sign out` → 立即登出回首页，无确认。
- `Close account`（按钮，2026-09-23 由 `Close…` 改全称）：`balance + spot_balance > 0` → 弹窗 `Withdraw your balance first` / `You still have {$x} across Standard and Boost. Withdraw it before closing your account.` + `Go to Wallet`；余额为 0 → 弹窗 `Close your account?` / `Your profile, history and API keys are deleted. This cannot be undone.` / `Type CLOSE to confirm`，输入 `CLOSE` 后红色 `Close account` 才可点。
- 确认后：Lovable 只登出 + toast `Account closed` → `/`；真实注销在正式平台（§8）。

### 4.9 移动端（规则 22）
375 下单列同模块；所有弹窗 MobileDrawer（语言选择为 drawer 列表，当前项 ✓）；MobileHeader preset B。

### 4.10 规范 / 归档（规则 23–24）
- DESIGN.md §Addendum 2026-09-22（ACCOUNT family 卡头语法 + Settings 归入 ACCOUNT family）；§4「Layout Narrow max-w-3xl 仅 Settings」划掉；Two Openings 里 Settings 从 B 移到 A。
- style-guide `Lite › Settings` ST-1…ST-31；copy-dictionary「Settings」节；本文档；STATUS ST-A…ST-M；INDEX 一行。

## 5. 全部状态索引（模块 × 状态 → 字典编号）

| 模块 | 状态 | 编号 |
|---|---|---|
| 页面 | guest / loading / error | ST-1 / ST-2 / ST-3 |
| Profile hero | 已设 · 未设 + 头像回退 · 移动 compact | ST-4 / ST-5 / ST-4b |
| Sign-in | 邮箱默认 · pending · cooldown · Google · Wallet 无邮箱 · Telegram | ST-6 / ST-7 / ST-8 / ST-9 / ST-10 / ST-11（弹窗 AU-S6…S8） |
| Account security | Password 默认 + Authenticator NOT SET · Password 已发送 · Authenticator ENABLED | ST-12 / ST-13 / ST-14 |
| Withdrawal verification | 默认 · 全部可选（both 选中）· 什么都没配置 | ST-15 / ST-16 / ST-17 |
| Notifications | 全开 · 部分关 · 无邮箱空态 | ST-18 / ST-19 / ST-20 |
| Preferences | chip · 下拉展开 | ST-21 / ST-22 |
| Sessions | 多设备 · 仅本机 · loading · error · 未知设备 | ST-23 / ST-24 / ST-25 / ST-26 / ST-27 |
| Account | 行 · 余额未清弹窗 · 确认弹窗 | ST-28 / ST-29 / ST-30 |
| More | 静态 | ST-31 |
| toast-only | Withdrawal verification updated · Couldn't save that. Try again. · Language set to … · Signed out other devices · Account closed · Email updated to … | 复用全站 toaster |

## 6. 数据与后端

| 项 | Lovable 实现 |
|---|---|
| `profiles.notification_prefs jsonb NOT NULL DEFAULT '{"settled":true,"auto_close":true,"trades":true,"funds":true}'` | 迁移 `supabase/migrations/20260922090000_settings_prefs_sessions.sql`（已应用） |
| `profiles.language text NOT NULL DEFAULT 'en'` | 同上 |
| `public.list_my_sessions()` → `(id, created_at, last_active_at, user_agent, ip, is_current)` | SECURITY DEFINER，`search_path = public, auth`，`WHERE user_id = auth.uid() AND (not_after IS NULL OR not_after > now())`，`is_current = (id::text = auth.jwt()->>'session_id')`；仅 `authenticated` 可执行 |
| 登出其他设备 | `supabase.auth.signOut({ scope: "others" })` |
| 前端类型 | `src/integrations/supabase/types.ts` 已手动补 `notification_prefs` / `language` / `list_my_sessions`（Lovable 重生成时保持一致） |

## 7. 验收剧本（测试用）

1. 游客开 `/settings` → 登录门（ST-1）；登录后页面原地展开。
2. 桌面 1280：hero 通栏、Sign-in + Account security 并排、下方 8/4 两列、页尾 footer；无页面标题。
3. 邮箱账号：Sign-in 右槽 `Email & password`，`Change` 走改邮箱流程（09-19 剧本 12–21）。
4. Google 账号：Sign-in 行 1 Google + 邮箱，行 2 Notification email `Edit`；Wallet 账号无邮箱 → `NOT SET` + `Add`。
5. Notifications：关一个开关 → 刷新仍关（DB `notification_prefs`）；再开回。
6. Language：选 `日本語` → toast，页头头像菜单 `Language` 显示 `JA`；刷新保持；改回 English。
7. Sessions：两处登录 → `2 devices`，本机有 `THIS DEVICE`；点 `Sign out other devices` → toast，另一处失效，本卡 `1 device` + `You're only signed in here.`
8. Account：余额 > 0 点 `Close account` → 余额弹窗 `Go to Wallet`；余额 0 → 确认弹窗，输入 `close`（大小写不敏感）红钮可点；Cancel 关闭。
9. Withdrawal verification：Wallet 账号无邮箱无 2FA → 琥珀框 + 三项禁用（ST-17）。
10. 移动 375：单列；Language chip → 底部抽屉列表；`Close account` → 底部抽屉；hero compact 两颗胶囊。
11. 字典：`/style-guide` Lite › Settings 30 张样张全部渲染；`npm run sg:audit` PASS。

已在 preview 实机跑过 1–11（2026-09-22，账号 `qa-vis-1@omenx.dev`，桌面 1280 + 移动 375；DB 侧核对 `notification_prefs` / `language` 落库、`list_my_sessions()` 返回、登出其他设备后行数从 2 → 1）。

## 8. 真平台必须补的（Lovable 做不到或有意没做）

- 真实发信：四类邮件按 `notification_prefs` + `language` 发；浏览器推送 / Telegram 通知第二批。
- 页面 i18n：语言偏好已存，页面文案翻译后续批次；第二批语言 es / id / tr。
- Sessions 地点：IP → 城市（geo-IP）；设备名可用更完整的 UA 库。
- Close account：真实异步注销 + 二次验证（邮箱码 / 2FA）+ 合规保留交易记录。
- Authenticator 行的启用日期（`user_security` 不暴露时间）。
- hero 底图：Wallet 同位素材槽，待 CPO 提供。

## 9. 不在本范围内

- 交易偏好（默认 Boost、滑点）、反钓鱼码、KYC、责任交易限额（竞品有，CPO 裁定不做 / 未决）。
- Notifications 的浏览器推送、Telegram 通道。
- 页面文案翻译。

## 10. 涉及文件

新增：`src/components/settings/SettingsCard.tsx` · `ProfileHero.tsx` · `ProviderSignInCard.tsx` · `NotificationsCard.tsx` · `PreferencesCard.tsx` · `SessionsCard.tsx` · `AccountCard.tsx` · `MoreCard.tsx` · `src/lib/languages.ts` · `src/hooks/useLanguage.ts` · `supabase/migrations/20260922090000_settings_prefs_sessions.sql` · `src/pages/StyleGuide/preview/settingsPreviews.tsx` · `src/pages/StyleGuide/sections/pages/LiteSettingsPage.tsx`
修改：`src/pages/Settings.tsx` · `LinkedEmailAccountCard.tsx` · `AccountSecurityCard.tsx` · `WithdrawalVerificationCard.tsx` · `src/hooks/useUserProfile.ts` · `src/components/EventsDesktopHeader.tsx` · `src/integrations/supabase/types.ts` · `src/pages/StyleGuide/nav.tsx` · `registry.tsx` · `AuthPage.tsx` · `LiteStubPages.tsx` · `DESIGN.md` · `docs/copy-dictionary.md` · `docs/backend-boundary.md` · `docs/changelog/INDEX.md` · `STATUS.md`

字典 key（`/style-guide/preview?c=`）：`settings-page-guest` `settings-page-loading` `settings-page-error` `settings-hero-default` `settings-hero-unset` `settings-hero-mobile` `settings-linked-email-default` `settings-linked-email-pending` `settings-linked-email-cooldown` `settings-signin-google` `settings-signin-wallet` `settings-signin-telegram` `settings-security-email-default` `settings-security-email-sent` `settings-security-totp-enabled` `settings-withdrawal-default` `settings-withdrawal-all-enabled` `settings-withdrawal-nothing` `settings-notifications-default` `settings-notifications-some-off` `settings-notifications-no-email` `settings-preferences-default` `settings-preferences-open` `settings-sessions-many` `settings-sessions-single` `settings-sessions-loading` `settings-sessions-error` `settings-sessions-unknown` `settings-account-default` `settings-account-blocked` `settings-account-confirm` `settings-more`
