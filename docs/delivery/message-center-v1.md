# 消息中心（Notifications + Announcements）— 交付说明 v1（总文档）

> **研发交付用的唯一总文档**（并入 `notifications-v1.md` 与 `notifications-v2.md`，那两份只留档）。
> 这是站内消息中心：登录后顶栏铃铛 → 下拉面板，和一个完整页面 `/notifications`，分 **Trading / Account / Updates** 三个 tab；另外两个公开页 `/announcements`（公告列表）和 `/announcements/:id`（公告正文），游客也能看。以前平台没有任何通知承接面——结算、到账、券过期这些事用户都不知道。
> 这次用户能看见：铃铛和未读数字；最近 20 条通知的面板；全页按日分组的列表；39 种通知（你自己的结算 / Boost 检查 / 买入变现确认 / 充提 / 券与奖励 / 账号安全，以及所有人的公告 / 维护 / 活动上线 / 活动将结束 / 关注赛事开盘）；公告正文页能放图和表格，维护公告有黄色时间窗口卡；页脚 Resources 多了「Announcements」。
> 没动的：Settings › Notifications 里的四个邮件开关只管邮件；交易、钱包、奖励、认证的业务逻辑一行没改，只在它们落库的地方多写一条通知；Pro 终端不碰。
> 怎么读：先看 §0 查什么去哪儿，再看通俗导读；文案与字段在词典「Notifications」「Announcements」两节；状态看字典节点 Notifications（NT-1…NT-23）与 Announcements（AN-1…AN-14）。

## 0. 读者须知

查什么去哪儿：
- 长什么样 → 生产页 `/notifications`、顶栏铃铛（登录 alex_carter 看）；`/announcements`、`/announcements/:id`（游客可看）
- 什么时候变成什么样 → `/style-guide` → Lite → **Notifications**（NT-1…NT-23）与 **Announcements**（AN-1…AN-14），每个 case 有「状态 / 触发条件 / 视觉 / 数据来源」表
- **哪个 type 用什么 icon / 什么颜色** → 字典 **NT-23 icon 台账**（40 type → lucide → tone）、**AN-14 kind 台账**（kind → 列表 icon → 详情 chip → 广播成的通知）；词典两张表都有 `icon · 色` 列
- 字段名、文案、公式、时间口径、术语 → `docs/copy-dictionary.md`（顶部有「Lite 术语对照表」）→「Notifications」「Announcements」节
- 设计法则（铃铛槽位、tab 两级、Popover vs Dialog、icon 色轴、移动行结构、公告页无面包屑、kind 双色、Markdown 子集）→ `DESIGN.md` §Addendum 2026-10-13 第 1–19 条
- 数据与投递边界 → `docs/backend-boundary.md`「2026-10-13 消息中心」「消息中心 v2」

提问前先按上面顺序查一遍；查不到再提，提问时写明"我查了 X 没有"。

## 0.1 字典怎么看

1. 打开 `/style-guide`（不用登录），左栏 Lite 组点 **Notifications**；**Announcements** 在它下面。
2. 节点顶部「本页目录」：Notifications = Ⓐ铃铛 · ⒷPopover · Ⓒ全页 · Ⓓ移动入口 · Ⓔ行组件 + 40 type 全枚举 + icon 台账；Announcements = Ⓐ列表 · Ⓑ详情 · Ⓒ部件 + kind 台账。右侧编号范围，点了滚过去。
3. 小节顶部黄框「定位行」= 路由 / 词典节 / 本文档。
4. 每张样张 = `NT-n` / `AN-n` + 状态名 + iframe 里的真组件（桌面 100% / 手机 375），可交互。
5. 样张下表列固定「状态 / 触发条件 / 视觉 / 数据来源」，触发条件就是判定表达式。
6. 页头搜索框敲 `NT-5` / `AN-8` 或文字，结果「编号 · 名 → 节点 › 小节」，点了落到样张。
7. 单张查看 / 截图：`/style-guide/preview?c=<key>`（key 见 §7）。

编号规则：`NT-n` / `AN-n` 桌面或双端共用；`NT-nb` / `AN-nb` 同状态手机帧。
只在字典可见、生产凑不出条件的态：NT-1 角标 `99+`（需 ≥100 未读）；NT-6 / NT-7 / NT-12b / NT-13b、AN-4 / AN-5 / AN-10 加载与出错（固定夹具）；NT-17 未知 type 的 default 分支（生产不会写入未知 type，是防御态不是 bug）；NT-20b Updates 空态；AN-3 / AN-3b 列表空态（生产已有公告）；AN-9 / AN-9b 已撤回（生产没有撤回的公告，拿不存在的 id 能看到同一页）。

## 通俗导读

> 本节是给没读过正文的人的 3 分钟通俗解读；不替代正文、不构成需求依据，一切口径以正文为准。

**一分钟看懂**——原来：业务发生了什么只能去各页面翻（结算去 Portfolio、到账去 Wallet、券过期没人提醒），运营要通知所有人也没有地方。现在：所有「要告诉用户一件事」统一进一张 `notifications` 表，前端一个铃铛 + 一个页面读它；「你自己的事」进 Trading / Account 两个 tab，「所有人的事」进 Updates tab；公告有自己的正文页。

```
业务落库（positions / transactions / vouchers / grants / …）── 触发器 ──┐
cron（到期前 24h）───────────────────────────────────────────────┤
运营发公告（announcements.status → published）── 触发器 fan-out 全员 ──┤──► notify() ──► notifications 表 ──► realtime ──► 铃铛角标 + 列表
campaigns.status → live ── 全员；ends_at 24h 内 ── 只给参与者 ─────────┤                         └── trade.* 7 天 / 其余 90 天后清理
user_watchlist × events.start_date 到点（cron */5）──────────────────┘
```

**一条故事线**（用户小 A）：① 买了一手 BTC 5 分钟轮 → 列表里出现 `Bought Up · $25.00`（不计角标）；② 5 分钟后结算赢了 → 铃铛变 `1`，Trading tab 亮点；③ 点那一行 → 行变已读、跳到结算详情；④ 他的 $25 券明天到期 → cron 写一条 `Voucher expires in 24h`，Account tab 亮点；⑤ 运营发了「Oct 15 维护」→ 铃铛 +1，Updates tab 亮点，行是黄扳手，点进去是黄色窗口卡「Oct 15, 02:00–04:00 UTC（10:00–12:00 your time）」和「Go to Wallet」钮；⑥ 他星标了今晚的 Dodgers vs Yankees，开赛那一刻 Updates 里多一条「… is live」；⑦ 点 `Mark all read` → 角标归零；⑧ 运营发现公告写错了，撤回 → 那条通知消失，链接打开是「This announcement is no longer available」；⑨ 7 天后他的买入确认自动清掉，90 天后其余记录清掉。

**概念词典**（每条在 copy-dictionary 有定义行）

| 概念 | 是什么 | 判定表达式 | 一句话类比 |
|---|---|---|---|
| type | 一条通知的机器键，决定标题 / 正文模板、icon、颜色 | `notifications.type`，39 个枚举（词典表 + 字典 NT-23） | 邮件模板编号 |
| category → tab | 库里 7 个细分类，前端映射成 3 个 tab | `settled/autoclose/trades → Trading`；`funds/rewards/account → Account`；`system → Updates` | 抽屉里的分格 |
| 计角标 | 铃铛数字 = 三个 tab 未读数之和，**不含 `trade.*`** | `read_at IS NULL AND type NOT LIKE 'trade.%'` | 自己发的消息不算新消息 |
| 已读 | 点行或 Mark all read 才已读；打开面板不算 | `read_at` 非空 | 邮件打开列表 ≠ 打开邮件 |
| 默认 tab | 打开落第一个有未读的 tab，全读落 Trading | `firstUnreadTab()` | 先看有红点的抽屉 |
| dedupe_key | 同一事件不重复写 | `UNIQUE (user_id, dedupe_key)`，`ON CONFLICT DO NOTHING` | 快递单号 |
| round_batch | 同一事件 ≥3 条在一次结算里一起 Closed → 合成一条 | 语句级触发器按 `(user_id, event_name)` 分组 `count ≥ 3` | 一叠回执装一个信封 |
| 保留期 | `trade.*`（Buy / Cash out 确认）7 天，其余 90 天，未读也删 | `purge_notifications()` 每日 03:40 UTC | 回执的正本在 Portfolio，消息中心不是账本 |
| announcement | 运营写的一条公告，`kind` 两种（announcement / maintenance） | `announcements` 表一行，`status = published` 才可见 | 公司内网一篇公告 |
| 发布 = 广播 | 发布那一刻给每个账号写一条通知，内容 = 公告的 title / summary | `trg_announcements_notify`，dedupe `ann:<id>` | 群发 |
| 撤回 | 公告下架 + 已发通知删除 | `status → withdrawn` | 撤回群发 |
| 窗口卡 | 维护公告的时间窗口 + 影响范围 | `window_starts_at / window_ends_at / affects / not_affected` | 停水通知的那一行 |
| 只给参与者 | 活动快结束只提醒参与过的人 | `campaign_participations` 有记录 | 只提醒报了名的人 |
| 关注开盘 | 星标赛事到开赛时间 | `user_watchlist × events.start_date` 落在最近 10 分钟 | 比赛开始的推送 |

**易混点**
- 不是「打开铃铛就全部已读」，而是「只有点到的那条才已读」；全读要点 Mark all read。
- 不是「每一条都计角标」，而是「Buy / Cash out 这两种不计」：它们进列表、有未读样式，但不点亮铃铛和 tab 圆点；Updates 的五种**全计**。
- 不是「Settings 关掉 Trade confirmations 站内就不显示」，而是「那四个开关只管邮件」；站内全量不可关。
- 不是「一个 tab 一张表」，而是「一张表、`category` 列细分、tab 只是前端映射」。
- 不是「新消息弹 toast」，而是「只刷角标和列表」。
- 不是「所有通知都留 90 天」，而是「买入 / 变现确认只留 7 天」——Trading tab 到底处写着这两句。
- 不是「公告类通知也走模板」，而是「标题正文 = 公告的 title / summary 原样」。
- 不是「活动快结束广播全员」，而是「只发给参与过的」；活动上线才是全员。
- 不是「桌面公告页有返回链」，而是「没有」：桌面详情页禁放面包屑 / 返回文字链，去列表页靠右栏 See all 和页脚。
- 不是「移动端行和桌面一样时间在右上」，而是「移动端标题占满列宽、时间落行底」——通知行和公告行同一结构。

**用户视角**——看到：铃铛 + 数字角标、三 tab 面板、按日分组的行、Load more / 到底句、手机品牌栏铃铛与 Me 菜单行、公告列表与正文页（图、表、窗口卡、CTA、More announcements）、页脚 Announcements。看不到：category 细分、dedupe_key、params 原始 JSON、广播的 fan-out、撤回删行、Markdown 原文。

## 1. 功能目标

- 一个承接面收全站通知：39 种 type——34 种「你自己的事」（结算 / Boost 检查 / 交易确认 / 资金 / 奖励 / 账号安全）+ 5 种「所有人的事」（公告 / 维护 / 活动上线 / 活动将结束 / 关注赛事开盘）。
- 登录用户才有铃铛；游客无铃铛，`/notifications` 走 LiteAuthGate。公告两页公开。
- 服务端只存 `type + params`，标题 / 正文由前端 i18n（7 语种）渲染；公告类通知的标题正文 = 公告 title / summary 原样。
- 单一写入口 `notify()`，所有生产者幂等。

## 2. 数据模型

### 2.1 `notifications` 表

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | 收件人 |
| category | text | `settled / autoclose / trades / funds / rewards / account / system`（由 type 前缀派生，`notification_category()`） |
| type | text | 机器键，i18n key = `notifications.<type>.title / .body` |
| params | jsonb | 插值参数（金额、事件名、side、公告 title / summary / kind…），**不存渲染文本** |
| entity_type / entity_id | text / uuid | 来源实体（position / transaction / voucher / campaign_grant / announcement / …） |
| deep_link | text | 点击去哪（站内路由） |
| dedupe_key | text | `UNIQUE (user_id, dedupe_key)`；默认 `<type>:<entity_id>` |
| read_at | timestamptz | null = 未读 |
| created_at | timestamptz | 排序键 |

索引：`(user_id, created_at desc)`；`(user_id) WHERE read_at IS NULL`。RLS：本人 SELECT；无 INSERT / UPDATE / DELETE 策略，写全部走 SECURITY DEFINER 函数。Realtime：`supabase_realtime` 发布，REPLICA IDENTITY FULL。

### 2.2 `announcements` 表

| 列 | 说明 |
|---|---|
| `id` uuid | 深链 `/announcements/:id` |
| `kind` text | `announcement` / `maintenance` |
| `title` / `summary` text | 标题 / 导语；通知行标题正文同字段 |
| `body_md` text | 正文，Markdown 子集（§3.7） |
| `cta_label` / `cta_href` text | 可选一枚 CTA；缺一不渲染 |
| `window_starts_at` / `window_ends_at` timestamptz | 维护窗口（UTC 存，页面显示 UTC + 本地） |
| `affects` / `not_affected` text | 窗口卡第二行 |
| `status` text | `draft` / `published` / `withdrawn` |
| `locale` text | 默认 `en`（只有英文正文；页面 chrome 走 i18n 7 语） |
| `published_at` timestamptz | 发布时间；发布时为空则触发器补 `now()` |

RLS：`status = 'published'` 对 anon + authenticated 可读；写只给 admin 角色（Lovable 阶段用 query_database）。

### 2.3 函数 / cron

| 函数 | 作用 | 调用方 |
|---|---|---|
| `notify(user, type, params, entity_type, entity_id, deep_link, dedupe)` | 唯一写入口；冲突即跳过 | 触发器 / cron（REVOKE 自 anon / authenticated） |
| `notify_self(type, params, dedupe)` | 客户端可写的白名单：`autoclose.tight / soon`、`account.new_session / password_changed` | 前端（Lovable 演示；正式版由风控引擎 / 认证服务产出） |
| `mark_notifications_read(ids uuid[] \| null)` | 单条 / 多条 / 全部已读 | 前端 |
| `notify_expiring()` | 券 / 空投 / grant 到期前 24h 提醒 | pg_cron `*/30` |
| `notify_campaign_ending()` | live 且 `ends_at` 在 24h 内 → 参与者 `system.campaign_ending`，dedupe `camp-end:<campaign>` | pg_cron `*/30` |
| `notify_watchlist_live()` | `user_watchlist × events`，`start_date` 落在最近 10 分钟且未结算 → `system.watchlist_live`，deep link `/trade?event=<id>`，dedupe `wl:<event>` | pg_cron `*/5` |
| `purge_notifications()` | 删 `trade.*` 7 天前、其余 90 天前 | pg_cron 03:40 UTC |

### 2.4 生产者（触发器）

| 来源表 | 事件 | type |
|---|---|---|
| positions | INSERT status=Open | `trade.bought` |
| positions | UPDATE → Closed（语句级）| `close_reason=settlement` → `settled.win / loss / flat`（按 pnl 正负零），同事件 ≥3 条合成 `settled.round_batch`；`cashout` → `trade.cashed_out`；`auto_close` → `autoclose.done`。close_reason 空且 pnl=0 = 撤回的下注，不发 |
| transactions | INSERT / UPDATE status | 出金 pending → `funds.withdraw_submitted`；completed → `deposit_done / withdraw_done`；failed / rejected → `deposit_failed / withdraw_failed`；`bonus` 正数 → `funds.credit`。`transfer_to_*` 不发。**回填守卫**：INSERT 的 `created_at` 早于 1 小时不发（演示引擎每晚重插历史，不能当新事件） |
| position_vouchers | INSERT / status→expired | `reward.voucher_issued / voucher_expired` |
| campaign_grants | status→claimable | `reward.grant_claimable`（金额与币种从 `campaign_entries.rules.tasks[task_key].reward` 取） |
| user_tasks | status→completed | `reward.task_claimable` |
| referrals | INSERT | `reward.referral_joined`（发给 referrer） |
| airdrop_positions | INSERT | `reward.airdrop_credited` |
| voucher_earnings_ledger | INSERT type=accrual | `reward.voucher_earnings_unlocked` |
| api_keys | INSERT / status→revoked | `account.api_key_created / revoked` |
| connected_accounts | INSERT | `account.wallet_linked` |
| recovery_requests | status→completed / rejected | `funds.recovery_update` |
| profiles | email 变更 / totp_enabled 变更 | `account.email_changed` / `account.2fa_on / 2fa_off` |
| announcements | BEFORE INSERT / UPDATE OF status → published | 对 `profiles` 全员 `system.announcement \| system.maintenance {title, summary, kind}`，deep link `/announcements/<id>`，dedupe `ann:<id>`；→ withdrawn：删 `entity_type='announcement' AND entity_id=id` 的通知 |
| campaigns | status → live | 全员 `system.campaign_live {campaign, task, ends_at}`，deep link `/rewards/campaign/<id>`，dedupe `camp-live:<id>` |
| cron | 见 §2.3 | `reward.*_expiring`、`system.campaign_ending`、`system.watchlist_live` |
| 前端 | Boost usage ≥80 / ≥95 进入档位；SIGNED_IN | `autoclose.tight / soon`；`account.new_session` |

## 3. 用户端

### 3.1 入口

| 端 | 位置 | 规则 |
|---|---|---|
| 桌面 | 顶栏右簇 `Equity → 🔔 → 头像 → (交易页 Lite/Pro)` | 登录态才渲染；游客右簇不变 `🌐 EN → Sign In`。登录态的语言 chip 退役，语言改为头像菜单 `Language · EN ▸` 子菜单行 |
| 手机 | 品牌栏（/ /events /portfolio /wallet）右槽 `[🔔][🌐]` | 登录 = 两个 icon button；游客 = 只有 🌐；inner 页不放铃铛 |
| 手机 | Me 菜单 `Notifications` 行（Rewards 之后） | 右侧未读计数胶囊，0 隐藏 |
| 公告 | 页脚 Resources「Announcements」；详情页右栏「See all announcements」；通知行 deep link | 顶栏 / Me 菜单 / BottomNav **不加** |

角标：数字 1–99，≥100 显示 `99+`，0 不渲染；计数口径见导读。

### 3.2 桌面 Popover（铃铛点击）

400 × ≤560，`align=end`。头 `Notifications` + `Mark all read`（0 未读隐藏）→ 局部 tab `Trading · Account · Updates`（有未读的 tab 右上 4px 点）→ 按日分组列表（TODAY / YESTERDAY / OCT 10），最近 20 条 → 底 `See all` → `/notifications`。打开时落第一个有未读的 tab，全读落 Trading。点行 = 该行已读 + 关闭 + 跳 deep_link。纯信息无确认按钮，所以是 Popover 不是 Dialog。行标题单行 ellipsis（See all 兜底）。

### 3.3 `/notifications` 全页

| 端 | 结构 |
|---|---|
| 桌面 | 顶栏 → 内容页式标题行（`Notifications` 24/30 + 右侧 `Mark all read`，**无 DSH / 返回件**）→ 开场级 tab 24/30 → 列表 → `Load more`（每次 30，**按 tab 分页**：服务端 `category IN (…)`）→ 到底句（两行短句）：Trading `That's everything from the last 90 days` / `Buy / Cash out confirmations are kept for 7 days`；其他 tab 只有第一句 |
| 手机 | inner header（返回 + `Notifications` + 右槽 CheckCheck = Mark all read，0 未读不渲染）→ 开场级 tab 19/26 sticky → 列表（滚到底自动加载）→ 到底句 → BottomNav |

`?tab=trading|account|updates` 可直达；切 tab 写回 URL（replace）。游客 = LiteAuthGate（`Sign in to see your notifications`）。

### 3.4 通知行（桌面 / Popover vs 移动）

| 端 | 结构 |
|---|---|
| 桌面全页 / Popover | `[6px 未读点][lucide 20][标题 14/500 单行 ellipsis · 正文 13 muted ≤2 行][时间 mono 11 右上]` |
| 移动全页 | `[6px 未读点][lucide 20][标题 14/500 占满列宽 ≤3 行 · 正文 13 muted ≤2 行 · 时间 mono 11 落行底]`——右侧时间列最宽 `Yesterday 21:00` 占 375 行宽 45%，标题怎么折都放不下真实的结算标题，所以时间不留右上（Binance / Bybit 通知列表式） |

未读：点 + 标题白 + icon 语义色；已读：点隐、标题 #9AA1AC、icon #5C636D。时间 `notifTime()`：今天 `14:05` / `Yesterday 14:05` / `Oct 3` / `Oct 3, 2025`，本地 24h 无时区。整行可点；无 deep_link 只标已读。未知 type → Bell muted + 原样 type 作标题（default 分支，不进语义色）。**icon 与颜色按 type 查字典 NT-23**：盈 / 入账 volt；亏 / 出账 muted；失败 / auto-close done / 安全类 red；tight / 要注意时间 yellow；Rewards / 信息类 Updates primary；icon 是唯一染色元素。

### 3.5 `/announcements` 列表页（公开）

| 端 | 结构 |
|---|---|
| 桌面 | `EventsDesktopHeader` → `max-w-7xl px-4 lg:px-6 py-10` → 标题 font-display 24/30 + 副题 → 列表（行 = kind icon 20 + 标题 15/22 单行 + 摘要 ≤2 行 + 日期 mono 11 右上 `Oct 13, 2026`）→ `Load more`（每页 20，有下一页才显示）/ 到底 `That's everything`（≥5 行才显示）→ SeoFooter |
| 手机 | inner header「Announcements」→ 列表直接接页头分隔线（**不放副题**，页头就是标题）→ 行 = kind icon + 标题占满列宽 ≤3 行 + 摘要 ≤2 行 + 日期落行底 mono 11（当年省年份 `Oct 13`）→ 全宽 Load more 44h → SeoFooter。不挂 BottomNav |

空态 / 骨架 / 出错：AN-3 / AN-4 / AN-5。

### 3.6 `/announcements/:id` 详情页（公开）

- 桌面：12 栅格 8 + 4。左 = 文章；右 = More announcements（最近 3 条排除当前 + See all，lucide 箭头；0 条整栏隐藏，左栏不拉宽）。**无面包屑 / 返回链**。
- 文章：kind chip（22px，Announcement = primary，Maintenance = trading-yellow；查字典 AN-14）+ 发布时间 mono 12 `Oct 13, 2026 · 15:02` → 标题 24/30（移动 19/26）→ 导语 15/24 muted（移动 14/22）→ 窗口卡（仅 maintenance 且有 `window_starts_at`）→ 正文（1px 分隔 + 22px）→ CTA 行。
- 窗口卡：`Window · Oct 15, 02:00–04:00 UTC (10:00–12:00 your time)` / `Affects: … · Not affected: …`；浏览器时区 = UTC 时省括号；跨日 `Oct 15, 22:00 – Oct 16, 02:00 UTC`；无结束 `Oct 15, 02:00 UTC`。
- CTA 行：主钮 `btn-primary`（`cta_label` + ArrowRight；外链新开）；副钮 outline `Back to Notifications` 只在登录且从通知行进来（`navigate(deep_link, { state: { from: "notifications" } })`）时渲染；两钮都没有 → 整行不渲染。
- 移动：inner header 标题按 kind（`Announcement` / `Maintenance`，加载中 / 不可用回落 `Announcements`）→ `px-4 py-5` 单列 → CTA 竖排全宽 44h → More announcements（rail 行移动端同列表行结构：标题 ≤2 行 + 日期落底）→ SeoFooter。
- 已撤回 / 不存在：同一页，彩绘猞猁 `empty-error.png` + `This announcement is no longer available` + 胶囊钮 `All announcements`；右栏隐藏；`document.title` 回落 `Announcements · OmenX`。

### 3.7 正文 Markdown 子集（含图片与表格）

`src/lib/markdownLite.ts`，零依赖、无 HTML 透传（`<script>` 按文本渲染），链接只放行 `http(s)://` / `/` / `mailto:`，其余降为 `#`。

| 语法 | 渲染 |
|---|---|
| 段落 | `p 15/24 fg/86 mb-3.5`（移动 14/22） |
| `#` / `##` → h2；`###` → h3 | h2 `font-display 18/24 600 mt-6`；h3 `15/22 600 mt-[22px]` |
| `- ` / `1. ` 列表 | `ml-[18px] marker muted space-y-1`（一层） |
| `**粗**` `*斜*` `` `code` `` `[t](href)` | strong 600 白；code mono 13 `bg-muted/60 border`；a primary underline offset-3 |
| `![alt](src)` 独占一行 | figure：img `rounded-[10px] border max-w-full`，桌面封顶 `md:max-h-[480px]` + alt 作 12px 图注；行内图片无图注 |
| `\| a \| b \|` + `\|---\|---:\|` | `rounded-[10px] border` 外框 `overflow-x-auto`；th 11/600 uppercase muted `bg-muted/30`；td 14 tabular-nums；`---:` 右对齐 |
| `> ` | `border-l-2 pl-3 muted` |
| `---` | `hr my-5` |

不支持：嵌套列表、任务列表、脚注、原始 HTML、h4+。

### 3.8 状态

| 状态 | 条件 | 视觉 |
|---|---|---|
| loading | 查询中 | 5 行骨架 |
| error | 查询失败 | `Couldn't load notifications` / `Check your connection and try again.` / `Retry` |
| empty（Trading） | 本 tab 无行 | 彩绘猞猁 `empty-celebrate.png` + `You're all caught up` / `Results, auto-close alerts and trade confirmations land here.` |
| empty（Account） | 本 tab 无行 | `empty-no-boost.png` + `Nothing here yet` / `Deposits, withdrawals, rewards and security alerts land here.` |
| empty（Updates） | 本 tab 无行 | `empty-no-starred-event.png` + `Nothing new` / `Campaign news and announcements land here.` |
| 插画 | 同一张图桌面 / 移动按视口取 `/assets/desktop|mobile/`；Popover 内 `py-7` | |

公告页状态 AN-1…AN-14，见 §7。

## 4. Lovable / 正式版边界

| 项 | Lovable | 正式版 |
|---|---|---|
| 两张表 / RLS / 函数 | 演示引擎（🟡 B） | type、params 语义、已读规则、保留期、公告字段语义照抄；存储与投递自选 |
| 生产者 | DB 触发器 + pg_cron | 交易引擎 / 资金 / 奖励 / 认证 / 活动 / 赛事服务在同一业务点发出，同一 dedupe 语义 |
| `autoclose.tight / soon` | 前端算 Boost usage 后 `notify_self()`（🔴 演示） | 风控引擎服务端产出，每次进入档位一次 |
| `account.new_session` | 前端 SIGNED_IN 事件（无地理位置） | 认证服务产出，带设备 + 城市 |
| `trade.order_filled / cancelled` | 无（Lovable 没有订单账本） | **正式版必做**：Pro 挂单成交 / 撤单 → Trading tab |
| 邮件副本 | 只存偏好不发信 | 按 `profiles.notification_prefs` 四开关发邮件副本 |
| 分页 | offset 分页（`range(from, from+29)`，按 tab 服务端过滤）；新行插入时下一页可能重复 / 跳过一条 | keyset 分页（`created_at, id` 游标） |
| 未读计数 | 客户端拉最多 500 条未读行自算（`countsAsUnread` 排除 `trade.*`），realtime 触发重拉 | 服务端 count / 已读表；口径不变 |
| 已读 | `mark_notifications_read(null)` = 三个 tab 全部已读（Popover 与全页的 Mark all read 都是全量，不按 tab） | 同语义 |
| 写公告 | **用 query_database 手工插**，没有后台页 | 运营后台（发布 / 定时 / 撤回 / 预览 / 多语言副本），研发侧立项 |
| 发布 = 广播 | 触发器 fan-out 到 `profiles` 全员（53 人） | 消息服务 fan-out；大用户量改「一条广播 + 每人已读表」的拉模式，字段语义不变 |
| 关注「临近结算」 | **本轮不做**。`events` 有 `end_date` / `expected_settlement_time`，技术上可做，等 CPO 要 | — |
| 公告多语言 | 只有 en 正文；chrome 7 语 | 正文按 locale 多副本 |

## 5. 演示数据

- alex_carter（`968a2b3a…`）：35 种自有 type 各至少一条（dedupe `seed:<type>:<时间>`，重跑不重复）；Updates 9 行（今天 3 条未读：关注开盘 Dodgers vs Yankees · 维护 · Crypto 结算；活动将结束 CPI Print Week、活动上线 World Cup Qualifiers、4 条历史公告已读）。
- `announcements` 6 条已发布：维护 Oct 15 · Crypto 2 分钟结算（含表格）· Autumn Volume Ladder（含图片 + 奖励表 + 有序列表，CTA → /rewards，「公告即活动」样板）· NFL/MLB/NHL · Payout tier 30 天 · 7 语。广播到 53 个账号，今天之前的已置已读。
- `roll_demo_positions` 等演示引擎此后自然产生新通知；`notify-watchlist-live` cron 已活体验证（Alcaraz vs Sinner 18:00 UTC 准点命中）。
- 种子脚本幂等（先删后插）。

## 6. 实现偏离 mock（CPO 已追认）

| # | mock | 实现 | 原因 |
|---|---|---|---|
| 1 | `reward.treasure_available`「A treasure box is waiting」 | `reward.treasure_opened`「Treasure box opened / +120 points」 | `treasure_drops` 行是开箱记录，没有"可开"状态可触发 |
| 2 | `autoclose.tight / soon` 正文 `auto-close ≈{c}¢ · …` | `Boost usage 83% · add funds or cash out` | 账户级没有单一 auto-close 价；`Boost usage` 是 Portfolio 既有行词 |
| 3 | `reward.grant_claimable` 标题 `$40.00 ready to claim` | `$40 USDC ready to claim` / `$5 Voucher ready to claim` | 奖励双色规则：券与 USDC 必须分清 |
| 4 | `reward.grant_expiring` 标题 `Claim $40.00 before Oct 14, 09:00` | `$40 USDC expires in 24h` / 正文带截止时间 | 375 宽标题被截掉截止时间 |
| 5 | type 数 34 | 35（+5 = 40；2026-10-20 退役 treasure_opened → 39） | `account.2fa_on` / `2fa_off` 各一条 |
| 6 | 桌面详情页左上「← Announcements」面包屑 | 删除 | DESIGN 桌面详情页规则 / PD-6 |
| 7 | 列表页 Load more 始终显示 | 有下一页才显示；到底且 ≥5 行显示 `That's everything` | 常显是死按钮 |
| 8 | 桌面 `/notifications` DSH 返回方钮 | 内容页式标题行 + Mark all read | CPO 10-14：与 Announcements 同级，不是账户子页 |
| 9 | 全页无限滚动 | 桌面 Load more（按 tab 分页）、移动自动加载 | CPO 10-14 N2 |
| 10 | 所有通知 90 天 | `trade.*` 7 天、其余 90 天，Trading 到底句写明 | CPO 10-14 N1：回执正本在 Portfolio |
| 11 | 行标题单行 ellipsis（双端） | 桌面 / Popover 单行；移动端标题占满列宽 ≤3 行、时间落行底，公告行同结构 | CPO 10-14 / 10-15 设计师验收：375 不能把事件名吃掉；两张列表一个体系 |
| 12 | 移动公告列表页头有副题 | 不放 | CPO 10-14：孤零零一行会被读成列表第一行 |

## 7. 状态索引

**Notifications**：NT-1 铃铛三态 `notif-bell-states` · NT-2…8 Popover `notif-popover-trading / account / allread / empty / empty-trading(5b) / loading / error / notif-panel-bare` · NT-9 / 9c…11 桌面页 `notif-page-desktop-trading / -trading-end / -account / -empty` · NT-9b…13b 手机页 `notif-page-mobile-trading / account / empty / empty-trading(11c) / loading / error` · NT-14 `notif-mobile-brandbar` · NT-15 `notif-mobile-menu-row` · NT-16 `notif-row-states` · NT-17 `notif-row-unknown` · NT-18 `notif-types-trading` · NT-19 `notif-types-account` · NT-20 / 20b `notif-popover-updates / -empty` · NT-21 / 21b `notif-page-desktop-updates / -mobile-updates` · NT-22 `notif-types-updates` · **NT-23 `notif-icon-ledger`（39 type → icon → tone 台账）**。

**Announcements**：AN-1…5 `ann-list-desktop / -end / -empty / -loading / -error` · AN-1b / 3b `ann-list-mobile / -empty` · AN-6…10 `ann-detail-desktop-maintenance / -announcement / -campaign / -unavailable / -loading` · AN-6b / 8b / 9b `ann-detail-mobile-maintenance / -campaign / -unavailable` · AN-11 `ann-kind-chips` · AN-12 `ann-window-card` · AN-13 `ann-markdown-sink` · **AN-14 `ann-kind-ledger`（kind → 列表 icon → 详情 chip → 广播通知台账）**。

## 8. 涉及文件

- 前端：`src/lib/notifications.ts`（39 type 注册表 `NOTIFICATION_TYPES` / tab 映射 / 计数 / 时间）· `src/lib/announcements.ts`（`ANNOUNCEMENT_KIND`）· `src/lib/markdownLite.ts` · `src/hooks/useNotifications.ts` · `src/hooks/useAnnouncements.ts` · `src/components/notifications/*`（Row / List / Tabs / Bell / Runtime）· `src/components/announcements/*`（Parts / Article / Views / MarkdownBody）· `src/pages/NotificationsPage.tsx` · `AnnouncementsPage.tsx` · `AnnouncementPage.tsx` · `EventsDesktopHeader.tsx` · `MobileHeader.tsx` · `BottomNav.tsx` · `SeoFooter.tsx` · `App.tsx`
- i18n：`src/locales/*.json` 命名空间 `notifications`（109 key）、`announcements`（20 key）、`legal.footer.links.announcements`（×7 语）
- 字典：`src/pages/StyleGuide/preview/notificationsPreviews.tsx` · `announcementsPreviews.tsx` · `components/NotificationIconLedger.tsx` · `AnnouncementKindLedger.tsx` · `sections/pages/LiteNotificationsPage.tsx` · `LiteAnnouncementsPage.tsx` · `registry.tsx` · `nav.tsx`
- 数据库：`supabase/migrations/20261013120000_notifications_center.sql` · `20261013180000_notifications_updates.sql` · `20261014060000_notifications_backfill_guard.sql` · `20261014070000_notifications_trade_retention.sql` · `20261020090000_notifications_qa_round.sql`

## 8.5 测试反馈轮（2026-10-20，CPO 批）

| # | 测试问题 | 改法 | 落点 |
|---|---|---|---|
| Q1 / Q3 | 结算 / 变现 / 提现的数字要不要扣费 | 全部改净额，和钱包账单对得上：`settled.* / trade.cashed_out / round_batch` 的 `pnl` / `net` = 盈亏 − winning commission（触发器算，params 另带 `gross_pnl` / `winning_commission`）；提现 submitted / sent 显示 `申请额 − $1` + `$1.00 fee`。**正文不写 "after commission"**（CPO：用户截图去 X 上骂）。cashout 路径改为一条 UPDATE 同时落 `winning_commission`，否则触发器先于手续费跑 | migration `20261020090000`；`useSupabasePositions.closePositionInDb`；`notificationVars` |
| Q2 | 美股 / 港股日内轮看不出哪一天 | `*_DAILY_UPDOWN_SPOT` 的 bought / 各类 close 带 `session_date`（= 事件 `end_date` 的日期），正文加 `Oct 17 session`（结算类在前、买入在后）；快轮不加 | `notif_session_date()`；i18n `notifications.session` ×7 |
| Q6 | 充值区分直充 / 跨链 / 法币 | 正文按 `tx_type` 加 `on Base` / `via bridge` / `via card` | i18n `notifications.deposit.source.*` ×7 |
| Q7 | "usually within 30 min" | 去掉，改 `processing`（与充值侧一致） | i18n ×7 |
| Q12 | treasure_opened 是不是老积分 | 是，积分宝箱已下线 → type 退役：触发器 / 注册表 / 词典 / 字典 NT-19 · NT-23 / 已存在通知一起删，**39 type** | migration；`NOTIFICATION_TYPES` |
| Q9 | API key 那条有中文 | "但是" 是用户起的 key 名，原样显示不是 bug；顺手去掉模板末尾多出的 `…`（prefix 自带打码） | i18n ×7 |
| Q5 / Q8 / Q10 / Q11 / Q13 | 已成文 | 划转不发（§2.4）、muted = 中性色档（NT-23 图例）、新登录正式版只在新设备 / 新地区发（§4）、recovery_update / credit 释义（词典）、round_batch 同事件 ≥3 笔同次结算（NT-18 第 4 行） | — |

## 9. 未变更项

交易 / 钱包 / 奖励 / 认证 / 活动业务逻辑；Settings › Notifications 卡与四个邮件开关；游客顶栏；i18n 其他命名空间；Pro 终端。

## 轮次代号 ↔ 章节

| 代号 | 白话 | 章节 |
|---|---|---|
| 方案 v0 D1–D12 | 2026-10-13 批的 12 条行为规则 | §3 |
| mock v1 M1–M8 | 视觉稿批点（桌面顺序、Language 行、Popover、全页、移动入口、行规格、35 文案、空态） | §3 |
| 方案 A / LE-1 | 桌面入口：铃铛顶替登录态语言 chip | §3.1 |
| V1–V5 | 2026-10-13 批的 v2 范围：5 个 type / 全计角标 / 公告手工发 / 默认 tab / 演示数据 | §1 §3.1 §5 |
| A1–A9（A6 修订） | 公告页 mock 批点：路由公开 / 入口只页脚 / 8+4 / 两种 kind / CTA / Markdown 含图表 / 撤回 / 只给参与者 / 不做临近结算 | §3.5–3.7 §4 |
| ① + N1–N3 | 2026-10-14 桌面终验：去 DSH / 7 天保留 / Load more / Popover 不变 | §3.3 §2.3 |
| D1–D4 两批 + 10-15 补 | 设计师验收修订：到底句两行 / 底注 mono / 移动无副题 / 移动行结构两张列表同构 | §3.4 §3.5 |
| NT-23 / AN-14 | icon 台账 / kind 台账 | §0 §7 |
| PD-6 | Insights 那轮被打回的「← INSIGHTS」返回链——同一条规则 | §3.6 |
