# 消息中心（Notifications）— 交付说明 v1

> **已并入 [`message-center-v1.md`](./message-center-v1.md)（2026-10-15），本文只留档，研发交付只看那一份。**

> 这是站内消息中心：顶栏铃铛 → 下拉面板，和一个完整页面 `/notifications`。以前平台没有任何通知承接面（2026-08 删掉了唯一一个野生空投 toast 之后，到账、结算、过期这些事用户都不知道）。
> 这次用户能看见：登录后顶栏 Equity 右边多了一个铃铛（有未读显示数字），点开是最近 20 条通知，分 **Trading / Account** 两个 tab；手机在品牌栏右上和「我的」菜单里各有一个入口；点「See all」进全页。通知来源 35 种：结算结果、Boost 检查预警、买入 / 变现确认、充提、券与奖励、账号安全。
> 没动的：Settings › Notifications 里的四个邮件开关只管邮件，站内通知不受它们影响；交易、钱包、奖励的业务逻辑一行没改，只在它们落库的地方多写一条通知。
> 怎么读：先看 §0 查什么去哪儿，再看通俗导读；文案与字段在词典「Notifications」节；状态看字典节点 Notifications（NT-1…NT-19）。

## 0. 读者须知

查什么去哪儿：
- 长什么样 → 生产页 `/notifications`、顶栏铃铛（登录 alex_carter 看）
- 什么时候变成什么样 → `/style-guide` → Lite → **Notifications** 状态字典（NT-1…NT-19，每个 case 有「状态 / 触发条件 / 视觉 / 数据来源」表）
- 字段名、文案、公式、时间口径、术语 → `docs/copy-dictionary.md`（顶部有「Lite 术语对照表」）→「Notifications（/notifications，2026-10-13）」节
- 设计法则（铃铛槽位、tab 两级、Popover vs Dialog、icon 色轴作用域）→ `DESIGN.md` §Addendum 2026-10-13
- 数据与投递边界 → `docs/backend-boundary.md`「2026-10-13 消息中心」

提问前先按上面顺序查一遍；查不到再提，提问时写明"我查了 X 没有"。

## 0.1 字典怎么看

1. 打开 `/style-guide`（不用登录），左栏 Lite 组点 **Notifications**。
2. 节点顶部「本页目录」= Ⓐ铃铛 · ⒷPopover · Ⓒ全页 · Ⓓ移动入口 · Ⓔ行组件 + 35 type；右侧编号范围，点了滚过去。
3. 小节顶部黄框「定位行」= 路由 / 词典节 / 本文档。
4. 每张样张 = `NT-n · 状态名` + iframe 里的真组件（桌面 100% / 手机 375），可交互。
5. 样张下表列固定「状态 / 触发条件 / 视觉 / 数据来源」，触发条件就是判定表达式。
6. 页头搜索框敲 `NT-5` 或文字，结果「编号 · 名 → 节点 › 小节」，点了落到样张。
7. 单张查看 / 截图：`/style-guide/preview?c=notif-popover-empty`（key 见 §7）。

编号规则：`NT-n` 桌面或双端共用；`NT-nb` 同状态手机帧。
只在字典可见、生产凑不出条件的态：NT-1 角标 `99+`（需 ≥100 未读）；NT-6 / NT-7 / NT-12b / NT-13b 加载与出错（固定夹具）；NT-17 未知 type 的 default 分支（生产不会写入未知 type，是防御态不是 bug）；登录态桌面顶栏本体与头像菜单 Language 行需登录，看生产 alex_carter。

## 通俗导读

> 本节是给没读过正文的人的 3 分钟通俗解读；不替代正文、不构成需求依据，一切口径以正文为准。

**一分钟看懂**——旧版：业务发生了什么只能去各页面翻（结算去 Portfolio、到账去 Wallet、券过期根本没人提醒）。新版：所有「要告诉用户一件事」统一进一张 `notifications` 表，前端一个铃铛 + 一个页面读它。

```
业务落库（positions / transactions / vouchers / grants / …）
   └─ 触发器 ──► notify()  ──► notifications 表 ──► realtime ──► 铃铛角标 + 列表
cron（到期前 24h）─┘                                    └── 90 天后清理
```

**一条故事线**（用户小 A）：① 买了一手 BTC 5 分钟轮 → 列表里出现 `Bought Up · $25.00`（不计角标）；② 5 分钟后结算赢了 → 铃铛变 `1`，面板 Trading tab 亮点；③ 点那一行 → 行变已读、跳到结算详情；④ 同时他的 $25 券明天到期 → cron 写一条 `Voucher expires in 24h`，Account tab 亮点；⑤ 他点铃铛里的 `Mark all read` → 角标归零；⑥ 90 天后这些记录自动清掉。

**概念词典**

| 概念 | 是什么 | 判定表达式 | 一句话类比 |
|---|---|---|---|
| type | 一条通知的机器键，决定标题 / 正文模板、icon、颜色 | `notifications.type`，35 个枚举（词典表） | 邮件模板编号 |
| category → tab | 库里 7 个细分类，前端映射成 2 个 tab | `settled/autoclose/trades → Trading`；`funds/rewards/account → Account`；`system` 留给 v2 Updates | 抽屉里的分格 |
| 计角标 | 铃铛数字 = Trading + Account 未读数，**不含 `trade.*`** | `read_at IS NULL AND type NOT LIKE 'trade.%'` | 自己发的消息不算新消息 |
| 已读 | 点行或 Mark all read 才已读；打开面板不算 | `read_at` 非空 | 邮件打开列表 ≠ 打开邮件 |
| dedupe_key | 同一事件不重复写 | `UNIQUE (user_id, dedupe_key)`，`ON CONFLICT DO NOTHING` | 快递单号 |
| round_batch | 同一事件 ≥3 条在一次结算里一起 Closed → 合成一条 | 语句级触发器按 `(user_id, event_name)` 分组 `count ≥ 3` | 把一叠回执装一个信封 |
| 保留期 | 90 天后物理删除，未读也删 | `purge_notifications()` 每日 03:40 UTC | 短信 90 天自动清理 |

**易混点**
- 不是「打开铃铛就全部已读」，而是「只有点到的那条才已读」；全读要点 Mark all read。
- 不是「每一条都计角标」，而是「Buy / Cash out 这两种不计」：它们进列表、有未读样式，但不点亮铃铛和 tab 圆点。
- 不是「Settings 关掉 Trade confirmations 站内就不显示」，而是「那四个开关只管邮件」；站内 v1 全量不可关。
- 不是「一个 tab 一张表」，而是「一张表、`category` 列细分、tab 只是前端映射」；v2 加 Updates tab 不动旧数据。
- 不是「新消息弹 toast」，而是「只刷角标和列表」（2026-08-25 删野生 toast 的决策延续）。

**用户视角**——看到：铃铛 + 数字角标、两 tab 面板、按日分组的行、See all 全页、手机品牌栏铃铛与 Me 菜单行。看不到：category 细分、dedupe_key、params 原始 JSON、trade.* 不计数的规则本身（只会感觉"自己下的单不吵"）。

## 1. 功能目标

- 一个承接面收全站通知：结算 / Boost 检查 / 交易确认 / 资金 / 奖励 / 账号安全，35 种 type（v1），`system`（活动 / 公告）预留给 v2 的 Updates tab。
- 登录用户才有；游客无铃铛，`/notifications` 走 LiteAuthGate。
- 服务端只存 `type + params`，标题 / 正文由前端 i18n（7 语种）渲染。
- 单一写入口 `notify()`，所有生产者幂等。

## 2. 数据模型

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | 收件人 |
| category | text | `settled / autoclose / trades / funds / rewards / account / system`（由 type 前缀派生，`notification_category()`） |
| type | text | 机器键，i18n key = `notifications.<type>.title / .body` |
| params | jsonb | 插值参数（金额、事件名、side、side_labels…），**不存渲染文本** |
| entity_type / entity_id | text / uuid | 来源实体（position / transaction / voucher / campaign_grant / …） |
| deep_link | text | 点击去哪（站内路由） |
| dedupe_key | text | `UNIQUE (user_id, dedupe_key)`；默认 `<type>:<entity_id>` |
| read_at | timestamptz | null = 未读 |
| created_at | timestamptz | 排序键 |

索引：`(user_id, created_at desc)`；`(user_id) WHERE read_at IS NULL`。RLS：本人 SELECT；无 INSERT / UPDATE / DELETE 策略，写全部走 SECURITY DEFINER 函数。Realtime：`supabase_realtime` 发布，REPLICA IDENTITY FULL。

### 2.1 函数

| 函数 | 作用 | 调用方 |
|---|---|---|
| `notify(user, type, params, entity_type, entity_id, deep_link, dedupe)` | 唯一写入口；冲突即跳过 | 触发器 / cron（REVOKE 自 anon / authenticated） |
| `notify_self(type, params, dedupe)` | 客户端可写的白名单：`autoclose.tight / soon`、`account.new_session / password_changed` | 前端（Lovable 演示；正式版由风控引擎 / 认证服务产出） |
| `mark_notifications_read(ids uuid[] \| null)` | 单条 / 多条 / 全部已读 | 前端 |
| `notify_expiring()` | 券 / 空投 / grant 到期前 24h 提醒（cron */30） | pg_cron `notify-expiring` |
| `purge_notifications()` | 删 90 天前 | pg_cron `purge-notifications` 03:40 UTC |

### 2.2 生产者（触发器）

| 来源表 | 事件 | type |
|---|---|---|
| positions | INSERT status=Open | `trade.bought` |
| positions | UPDATE → Closed（语句级）| `close_reason=settlement` → `settled.win / loss / flat`（按 pnl 正负零），同事件 ≥3 条合成 `settled.round_batch`；`cashout` → `trade.cashed_out`；`auto_close` → `autoclose.done`。close_reason 空且 pnl=0 = 撤回的下注，不发 |
| transactions | INSERT / UPDATE status | 出金 pending → `funds.withdraw_submitted`；completed → `deposit_done / withdraw_done`；failed / rejected → `deposit_failed / withdraw_failed`；`bonus` 正数 → `funds.credit`。`transfer_to_*` 不发 |
| position_vouchers | INSERT / status→expired | `reward.voucher_issued / voucher_expired` |
| campaign_grants | status→claimable | `reward.grant_claimable`（金额与币种从 `campaign_entries.rules.tasks[task_key].reward` 取） |
| user_tasks | status→completed | `reward.task_claimable` |
| referrals | INSERT | `reward.referral_joined`（发给 referrer） |
| airdrop_positions | INSERT | `reward.airdrop_credited` |
| voucher_earnings_ledger | INSERT type=accrual | `reward.voucher_earnings_unlocked` |
| treasure_drops | INSERT | `reward.treasure_opened` |
| api_keys | INSERT / status→revoked | `account.api_key_created / revoked` |
| connected_accounts | INSERT | `account.wallet_linked` |
| recovery_requests | status→completed / rejected | `funds.recovery_update` |
| profiles | email 变更 / totp_enabled 变更 | `account.email_changed` / `account.2fa_on / 2fa_off` |
| cron | 到期前 24h | `reward.voucher_expiring / airdrop_expiring / grant_expiring` |
| 前端 | Boost usage ≥80 / ≥95 进入档位；SIGNED_IN | `autoclose.tight / soon`；`account.new_session` |

## 3. 用户端

### 3.1 入口

| 端 | 位置 | 规则 |
|---|---|---|
| 桌面 | 顶栏右簇 `Equity → 🔔 → 头像 → (交易页 Lite/Pro)` | 登录态才渲染；游客右簇不变 `🌐 EN → Sign In`。登录态的语言 chip 退役，语言改为头像菜单 `Language · EN ▸` 子菜单行（Settings 之上），列表与原 chip 同一份 |
| 手机 | 品牌栏（/ /events /portfolio /wallet）右槽 `[🔔][🌐]` | 登录 = 两个 icon button；游客 = 只有 🌐；inner 页不放铃铛 |
| 手机 | Me 菜单 `Notifications` 行（Rewards 之后） | 右侧未读计数胶囊，0 隐藏 |

角标：数字 1–99，≥100 显示 `99+`，0 不渲染；计数口径见导读。

### 3.2 桌面 Popover（铃铛点击）

400 × ≤560，`align=end`。头 `Notifications` + `Mark all read`（0 未读隐藏）→ 局部 tab `Trading · Account`（有未读的 tab 右上 4px 点）→ 按日分组列表（TODAY / YESTERDAY / OCT 10），最近 20 条 → 底 `See all` → `/notifications`。打开时落第一个有未读的 tab，全读落 Trading。点行 = 该行已读 + 关闭 + 跳 deep_link。纯信息无确认按钮，所以是 Popover 不是 Dialog。

### 3.3 `/notifications` 全页

| 端 | 结构 |
|---|---|
| 桌面 | 顶栏 → 内容页式标题行（`Notifications` 24/30 + 右侧 Mark all read，**无 DSH / 返回件**——2026-10-14 ① 修订）→ 开场级 tab 24/30 → 列表（**Load more** 每次 30、按 tab 分页——N2）→ 底句：Trading `That's everything — results and Boost alerts from the last 90 days, Buy / Cash out confirmations from the last 7 days`，其他 `That's everything from the last 90 days` |
| 手机 | inner header（返回 + `Notifications` + 右槽 CheckCheck = Mark all read，0 未读不渲染）→ 开场级 tab 19/26 sticky → 列表 → BottomNav |

`?tab=trading|account` 可直达；切 tab 写回 URL（replace）。游客 = LiteAuthGate（`Sign in to see your notifications`）。

### 3.4 行组件

`[6px 未读点][lucide 20][标题 14/500 单行 ellipsis + 正文 13 muted ≤2 行][时间 mono 11]`。未读：点 + 标题白 + icon 语义色；已读：点隐、标题 #9AA1AC、icon #5C636D。时间 `notifTime()`：今天 `14:05` / `Yesterday 14:05` / `Oct 3` / `Oct 3, 2025`，本地 24h 无时区。整行可点；无 deep_link 只标已读。未知 type → Bell muted + 原样 type 作标题（default 分支，不进语义色）。

### 3.5 状态

| 状态 | 条件 | 视觉 |
|---|---|---|
| loading | 查询中 | 5 行骨架 |
| error | 查询失败 | `Couldn't load notifications` / `Check your connection and try again.` / `Retry` |
| empty（Trading） | 本 tab 无行 | 品牌猞猁插画 `empty-celebrate.png` + `You're all caught up` / `Results, auto-close alerts and trade confirmations land here.` |
| empty（Account） | 本 tab 无行 | 品牌猞猁插画 `empty-no-boost.png` + `Nothing here yet` / `Deposits, withdrawals, rewards and security alerts land here.` |
| 插画 | 同一张图桌面 / 移动按视口取 `/assets/desktop|mobile/`；Popover 内 `py-7`。线稿猞猁不再用于空态（CPO 2026-10-13） | |

## 4. Lovable / 正式版边界

| 项 | Lovable | 正式版 |
|---|---|---|
| 表结构 / RLS / 函数 | 演示引擎（🟡 B） | type、params 语义、已读规则、保留期照抄；存储与投递自选 |
| 生产者 | DB 触发器 + pg_cron | 由交易引擎 / 资金 / 奖励 / 认证服务在同一业务点发出，同一 dedupe 语义 |
| `autoclose.tight / soon` | 前端算 Boost usage 后 `notify_self()`（🔴 演示） | 风控引擎服务端产出，每次进入档位一次 |
| `account.new_session` | 前端 SIGNED_IN 事件（无地理位置） | 认证服务产出，带设备 + 城市 |
| `trade.order_filled / cancelled` | 无（Lovable 没有订单账本） | **v1 正式版必做**：Pro 挂单成交 / 撤单 → Trading tab |
| 邮件副本 | 只存偏好不发信 | 按 `profiles.notification_prefs` 四开关发邮件副本 |
| `system`（活动 / 公告） | 预留 category | v2 Updates tab + 运营后台 |

## 5. 演示数据

alex_carter（`968a2b3a…`）已种 36 条 / 35 type（今天 5 条未读，其中 1 条 `trade.bought` 不计角标 → 角标 4）；dedupe `seed:<type>:<时间>`，重跑不重复。此后 `roll_demo_positions` 等演示引擎自然产生新通知（结算、买入），无需再种。

## 6. 实现偏离 mock（待 CPO 追认）

| # | mock | 实现 | 原因 |
|---|---|---|---|
| 1 | `reward.treasure_available`「A treasure box is waiting / open it in Rewards」 | `reward.treasure_opened`「Treasure box opened / +120 points」 | `treasure_drops` 行是开箱记录，没有"可开"状态可触发 |
| 2 | `autoclose.tight / soon` 正文 `auto-close ≈{c}¢ · add funds or cash out` | `Boost usage 83% · add funds or cash out` | 账户级没有单一 auto-close 价（多仓）；`Boost usage` 是 Portfolio Boost check 既有行词 |
| 3 | `reward.grant_claimable` 标题 `$40.00 ready to claim` | `$40 USDC ready to claim` / `$5 Voucher ready to claim` | 奖励双色规则：券与 USDC 必须分清 |
| 4 | `reward.grant_expiring` 标题 `Claim $40.00 before Oct 14, 09:00` | `$40 USDC expires in 24h` / 正文 `{campaign} · {task} · claim before Oct 14, 09:00` | 375 宽标题被截掉截止时间；改与 voucher / airdrop 到期句同构 |
| 5 | type 数 34 | 35 | `account.2fa_on` / `2fa_off` 各一条 |

## 7. 状态索引

NT-1 铃铛三态 `notif-bell-states` · NT-2…8 Popover `notif-popover-trading / account / allread / empty / empty-trading(5b) / loading / error / notif-panel-bare` · NT-9…11 桌面页 `notif-page-desktop-trading / account / empty` · NT-9b…13b 手机页 `notif-page-mobile-trading / account / empty / empty-trading(11c) / loading / error` · NT-14 `notif-mobile-brandbar` · NT-15 `notif-mobile-menu-row` · NT-16 `notif-row-states` · NT-17 `notif-row-unknown` · NT-18 `notif-types-trading` · NT-19 `notif-types-account`。

## 8. 涉及文件

- 前端：`src/lib/notifications.ts`（注册表 / 计数 / 时间）· `src/hooks/useNotifications.ts` · `src/components/notifications/*`（Row / List / Tabs / Bell / Runtime）· `src/pages/NotificationsPage.tsx` · `EventsDesktopHeader.tsx` · `MobileHeader.tsx` · `BottomNav.tsx` · `App.tsx`
- i18n：`src/locales/*.json` 命名空间 `notifications`（91 key × 7 语）
- 字典：`src/pages/StyleGuide/preview/notificationsPreviews.tsx` · `sections/pages/LiteNotificationsPage.tsx`
- 数据库：`supabase/migrations/20261013120000_notifications_center.sql`
- 工具：`scripts/sg-overflow-scan.js` 排除 `text-overflow: ellipsis`（标题单行截断是设计）

## 9. 未变更项

交易 / 钱包 / 奖励 / 认证业务逻辑；Settings › Notifications 卡与四个邮件开关；游客顶栏；i18n 其他命名空间；Pro 终端。

## 轮次代号 ↔ 章节

| 代号 | 白话 | 章节 |
|---|---|---|
| 方案 v0 D1–D12 | 2026-10-13 拍板的 12 条行为规则 | §3 |
| mock v1 M1–M8 | 视觉稿批点（桌面顺序、Language 行、Popover、全页、移动入口、行规格、35 文案、空态） | §3 |
| 方案 A | 桌面入口：铃铛顶替登录态语言 chip | §3.1 |
| LE-1（2026-09-28） | 语言入口交付项，本轮修订登录态部分 | §3.1 |
