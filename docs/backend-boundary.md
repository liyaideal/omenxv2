# 后端参考边界说明（Backend Reference Boundary）

> **本仓库的 Supabase 是演示引擎（Demo Engine），不是正式后端。**
> 它的职责是让前端 Lovable 端到端可跑（下单 → 持仓 → 流水 → 奖励处处可见），不是给研发照抄的实现。
> 本文档逐表、逐函数标注研发的参考边界。评审需求时先查本表，再看代码。

## 分类定义

| 标记 | 类别 | 含义 |
|---|---|---|
| 🟢 A | 业务规则 | 规则本身就是需求：数值、状态机、门槛、流程可直接照抄 |
| 🟡 B | 规则在此、实现自选 | 业务语义是需求，但存储结构 / 触发方式 / 技术实现由正式架构决定 |
| 🔴 C | 仅演示 | 为让原型可跑而存在，正式版另有方案，**禁止参考实现** |

## 通用红线（先读这个）

1. 所有模拟数据不进正式系统：价格模拟、假链上确认、demo 用户、新用户回填的演示成交
2. 底层 `side: long/short` 与展示层 Yes/No 的映射**只存在于前端渲染层**（见 `docs/changelog/2026-05-25-yes-no-terminology.md`），正式后端沿用 long/short 底层语义
3. Guest 的 localStorage 持久化是演示便利，正式版无此逻辑
4. 本仓库**没有 orders 表**（挂单在前端 store），正式系统必须有真实订单账本——这是原型缺口，不是设计
5. 出入金正式方案 = Cobo 托管 + Banxa（仅充值）+ Socket，本仓库相关表/函数全部是模拟
6. 新增演示专用 Edge Function 一律 `sim-` 前缀；存量不改名，以本文档标注为准

## 数据表（35）

### 交易域

| 表 | 类别 | 说明 |
|---|---|---|
| events | 🟡 | event → options 层级、结算时间等语义是需求；正式事件源自参考指数 + 运营后台 |
| event_options | 🟡 | `option_id` 作为价格追踪主键的语义照抄；数据由引擎产生 |
| event_mappings | 🟡 | 与 Polymarket/Kalshi 外部市场映射的概念是需求，映射维护方式自选 |
| event_relations | 🟡 | 相关事件推荐语义 |
| positions | 🟡 | 字段语义（entry/leverage/tp/sl/liq、cross-zero 禁令）是需求；持仓账本由交易引擎生成 |
| trades | 🟡 | 成交记录粒度与状态语义是需求；由撮合引擎产生 |
| price_history | 🔴 | 由 update-prices 模拟生成；正式行情来自引擎与指数 |
| position_funding_ledger | 🟡 | 每结算期一行、window/settlementTs 字段粒度是审计需求；计算在引擎 |

### 资产域

| 表 | 类别 | 说明 |
|---|---|---|
| wallets | 🟡 | 单一 Available 余额（`profiles.balance`）为需求；账本实现在引擎。**2026-07-21 更新**：早期"双余额（Available + Trial Bonus 先耗）"口径作废——Trial Bonus 从未真正上线、发放源已死，已全站下线；新口径为合约账户单余额，Total Equity = spot + balance |
| transactions | 🟡 | 类型/状态生命周期 + "写入必须服务端收敛"是需求（见 SEC1/SEC2）；表结构自选 |
| deposit_addresses | 🔴 | 正式充值地址由 Cobo 分配 |
| recovery_requests | 🟢 | v2 规则照抄：3 态状态机（submitted/completed/rejected）+ 固定 10% 费率；`quoted_at/accepted_at` 是 v1 遗留字段，不实现 |

### 增长域

| 表 | 类别 | 说明 |
|---|---|---|
| position_vouchers | 🟢 | 仓位券完整生命周期照抄 |
| voucher_daily_pools | 🟢 | 每日 UTC 池配额（$10×1000 / $25×500 / $50×100）是运营规则；正式版应做成可配置，不要学本仓库硬编码在 DB 函数里 |
| voucher_earnings | 🟢 | 券收益 pending 池 |
| voucher_earnings_ledger | 🟢 | 5 阶解冻账本（T0 $2 → T4 $50，配置见 `src/lib/voucherTiers.ts`，服务端必须复用同一配置） |
| points_accounts / points_ledger | 🟢 | 积分账户与流水，全部走服务端处理 |
| points_config | 🟢 | 积分规则配置 |
| points_redemptions | 🟢 | 兑换记录；当前"暂停兑换返回 403"也是需求（等 Beta→Mainnet 换算比例） |
| tasks / user_tasks | 🟢 | 任务前置依赖 + 完成流程；奖励永不自动发放，必须手动 Claim |
| treasure_drops | 🟢 | 宝箱概率与频控 |
| referral_codes / referrals | 🟢 | 6 位字母数字推荐码规则 |

### H2E 域

| 表 | 类别 | 说明 |
|---|---|---|
| airdrop_positions | 🟢 | 空投仓状态机 + 自动结算规则 + $100 账户收益上限 |
| h2e_fund | 🟢 | 活动预算池 |
| budget_limits | 🟢 | 反滥用限额 |
| asset_verifications | 🟡 | EIP-712 验签概念照抄；验签服务实现自选 |
| connected_accounts | 🟡 | 外部账户（Polymarket）绑定语义 |

### 账户与其他

| 表 | 类别 | 说明 |
|---|---|---|
| profiles | 🟡 | `totp_enabled` / `withdraw_2fa_mode` 是需求；`is_affiliate` / `affiliate_since`（2026-09-19）是 /affiliate CTA 三态的 Lovable 标记位，真平台读 affiliate 服务的会员状态；`notification_prefs` / `language`（2026-09-22）是需求（用户偏好），存哪里自选；其余演示字段忽略 |
| user_security | 🟢 | TOTP 秘钥独立表、客户端零可见的隔离设计照抄（见 SEC3） |
| user_roles | 🟡 | RBAC 概念 |
| user_watchlist | 🟡 | 自选收藏；guest localStorage 部分不实现 |
| trade_verifications | 🔴 | 透明度审计快照是模拟的"链上数据"；审计产品形态是需求，但正式数据源为真实链上合约 |

## Edge Functions（16）

| 函数 | 类别 | 说明 |
|---|---|---|
| claim-position-voucher | 🟢 | 券领取规则 |
| redeem-position-voucher | 🟢 | 券核销开仓规则 |
| claim-voucher-earnings | 🟢 | 5 阶解冻校验（必须与前端 voucherTiers 同配置）。**2026-10-08：成交量档读近 30 天 `trades`（Filled + Closed，`created_at ≥ now − 30d`）；cap 仍终身累计（`min(pending, cap − lifetime_credited)`）** |
| close-trial-position | 🟢 | 券仓平仓盈利只进 pending，不直接进钱包 |
| claim-task | 🟢 | 任务奖励，达标 ≠ 发放 |
| claim-treasure | 🟢 | 宝箱发放 |
| redeem-points | 🟢 | 积分兑换（含当前 403 暂停逻辑） |
| record-transaction | 🟡 | "资金流水写入收敛到服务端、客户端直插被 RLS 拒绝"的原则照抄；实现自选 |
| totp-manage | 🟡 | 秘钥全程服务端处理的原则照抄 |
| verify-wallet-signature | 🟡 | EIP-712 验签概念 |
| accrue-funding | 🟡 | 结算周期与费率语义是需求；计算发生在引擎 |
| update-prices | 🔴 | 价格模拟引擎 |
| simulate-confirmations | 🔴 | 假链上确认 |
| generate-deposit-address | 🔴 | 正式走 Cobo |
| get-deposit-address | 🔴 | 正式走 Cobo |
| ensure-demo-user | 🔴 | demo 账号供 QA/style-guide 使用 |

## 2026-07-15 Pro / Spot 产品线扩容（append-only 补录）

| 表 / 字段 | 类别 | 说明 |
|---|---|---|
| `events.product_lines` / `event_subtype` / `lifecycle_status` / `base_price` | 🟡 | 产品线模型（futures/spot 共存）、事件子类型、状态机、结算基准价语义是需求；存储字段与状态机实现由正式架构决定 |
| `events.freeze_time` / `events.expected_settlement_time` | 🟡 | 时间字段语义是需求（技术对接 v1.0 §4.1/§12.2）：freeze_time 到达时冻结新单 + 批量撤销未成交挂单；expected_settlement_time 用于结算入账提示。值由后端按交易所日历作业写入，前端只消费字段；禁止在前端硬编码 16:00 / 16:30 假设——提前收盘日字段值会与常量不一致 |
| `trades.product_line` | 🟡 | 同上；成交按产品线区分是需求 |
| `positions.product_line` | 🟡 | 同上；持仓按产品线区分是需求。现货采用 SIGNED_YES_SHARE 单净仓（技术对接 §7），同一事件 Up/Not Up 至多一边有仓位；反向买入自动冲减 |
| `profiles.preferred_surface` | 🟡 | Pro/Lite 表面选择是需求，具体持久化位置自选 |
| `category_boost_configs` | 🟢 | Boost 板块开关是运营规则，须做成可后台配置（本轮硬编码在 DB 属演示便利） |

## 2026-07-15 Open API v1 用户侧管理页（append-only 补录）

| 表 / 字段 | 类别 | 说明 |
|---|---|---|
| `api_keys`（label / key_prefix / tier / scopes[] / ip_whitelist[] / status / last_used_at / revoked_at） | 🟡 | 三层准入门槛（Read-only / Trading / Pro-MM，参见《创建 api 条件》）与 7 项 scope 语义（FD-API-04：`read_public` / `read_private` / `trade_order` / `trade_cancel` / `trade_conditional` / `ws_public` / `ws_private`）是需求；本表结构可参照。**红线**：本项目前端生成 `omx_live_<48hex>` 假 secret 并只落 `key_prefix`，仅演示；正式版 secret 必须由后端 HMAC/JWT 签发 + 哈希存储 + 永不回读，鉴权中间件负责 IP whitelist / scope 校验 / 2FA 二次验证 |

## 2026-07-21 现货数据链路收敛（append-only 补录）

| 函数 / 前端约束 | 类别 | 说明 |
|---|---|---|
| `redeem-position-voucher`（spot 开放 + event 级一券锁） | 🟢 | **2026-08-06 Vouchers v2 Round A 更新：撤销 futures-only 限制**，Boost（futures）与 Standard（spot）市场均可兑换，前端 `EventPickerList` 亦不再过滤 spot。改为强制 **event 级一券锁（跨产品线）**：兑换前查 `position_vouchers.redeemed_event_id = eventId AND user_id = uid`，命中即 409 `One voucher per event — you already opened a trial position here.`；前端据同一口径把该 event 整卡置灰。 |
| `position_vouchers.payout_mode` 双轨 | 🟢 | `instant` = 结算盈利由服务端触发器 `pay_instant_voucher_settlement()` 直接入 Standard 余额（`profiles.spot_balance`）并写一条 `bonus` 交易，`instant_paid_at` 保证幂等，不进 pending 池、不看 tier；`tiered`（默认，存量回填值）维持 `voucher_earnings` 池 + 阶梯解冻。发券路径从 campaign entry 的 reward 配置继承 `payout_mode`。 |
| `useSupabaseOrders.fillOrder` / `cancelOrder`（product_line 分流） | 🟢 | 撮合/撤单必须按 `trades.product_line` 分流：`spot` 走 `fillSpotLimitOrder` / `cancelSpotLimitOrder`（SIGNED_YES_SHARE 净仓、撤单退预扣款）；`futures` 走原插入 positions 的路径。**红线**：任何路径不得给 spot 建 `side='short'` 的持仓（现货不支持做空），fill 路径显式抛错兜底。 |
| `DesktopPositionsPanel`（futures-only 视图） | 🟢 | `/trade` 主面板的 Positions / Pending Orders / History 三个 Tab 均**只展示 `product_line !== 'spot'`** 的行；spot 行在 `/spot` 页面自己的 spot-scoped 面板中展示，两条产品线互不串。 |
| `PositionDetailContent`（spot 分支） | 🟢 | Spot 持仓详情面板**必须隐藏** leverage / liquidation price / funding / est. close fee，改用 Shares / Avg cost / Current value / Cost basis + "Each winning share pays $1 at settlement" 提示。桌面 dialog 与移动 drawer 共用同一组件、行为一致。 |

## 2026-07-21 双账户改造 · 轮次 2a 资金内核（append-only 补录）

| 表 / 字段 / 函数 | 类别 | 说明 |
|---|---|---|
| `profiles.spot_balance` | 🟡 | 现货账户 Available 余额。双账户模型（现货 / 合约 CEX 范式）是需求；用一列存储属演示简化，正式版应有独立账户账本 / 总账体系（accounts + entries）。合约账户读 `profiles.balance`（`profiles.trial_balance` 已于 2026-07-21 全站下线，见下方章节），两账户可通过 `sim-transfer` 划转，`Total Equity = balance + spot_balance`。 |
| `profiles.balance` 默认值 13530 → 0；`handle_new_user` 不再注入演示金 / 演示 transactions | 🟢 | 产品口径：新注册用户两账户 $0 起步，充值或领取 voucher 后才有资金进入。存量用户余额不动。（历史默认与 `v_initial_balance := 13530` 一致；Guest 侧本就无 localStorage 演示金，不涉及。） |
| `transactions.account`（'spot' \| 'futures'，可空） | 🟡 | 账户归属维度是需求；本轮起新流水必须写入 account，历史行留空。放行新类型 `transfer_to_spot` / `transfer_to_futures`。存储在同一张表属演示简化，正式版按账户拆表或走总账。 |
| `sim-transfer` Edge Function | 🟡 | 双账户划转的原子性 + 一入一出两条流水是需求；技术实现（RPC / 事务 / 消息队列）由正式架构决定。**DEMO-STATE**：当前演示允许客户端直改 `balance` / `spot_balance` 列（RLS 未收敛）；正式版目标为客户端直改被拒、必须走 Edge Function（对齐 record-transaction 口径）。 |
| `useRealtimeRiskMetrics` 过滤 `product_line='futures'` | 🟢 | 现货持仓由 spot_balance 全额现金抵押，**不进** IM / MM / Risk Ratio / close-only 判定。修复现货虚高 Risk Ratio bug。合约结算入账目标为 `balance`，现货结算入账目标为 `spot_balance`（结算演示流在轮次 4）。 |

## 2026-07-21 Trial Bonus 全面下线（append-only 补录）

背景：Trial Bonus 从未真正上线（`profiles.trial_balance` 存量 21 户 $3,317 均来自早期 `handle_new_user` 演示注入，已停止发放；`redeem-points` 唯一在途发放源已被 mainnet-launch 403 硬停）；产品拍板全面下线，重做时另行规划。Position Voucher / voucher_earnings / 体验仓（`close-trial-position`）全链路与 `trial_balance` 零依赖，逐函数审计确认后一行未动。

| 表 / 字段 / 函数 | 类别 | 说明 |
|---|---|---|
| `profiles.trial_balance` | 🔴 | 列本身**保留**（数据清零与 drop 列由产品侧另行执行），代码路径全部下线：所有读点删除、所有写点删除、Total Equity 口径不再包含。**不得**在新代码中读写该列。 |
| `redeem-points` Edge Function | 🔴 | 函数顶部 mainnet-launch 403 硬停保留；其后 unreachable 的 `trial_balance` 写入段删除。积分兑换重做时另建 target。 |
| `close-trial-position` Edge Function | 🟢 | 命名澄清：此处 `trial` 指 Trial Position（券承兑的体验仓，Position Voucher 域），与钱包层 `trial_balance` 无关。文件头已加护栏注释，**不得**作为本次下线目标移除。 |
| `deductBalance` / `deductBalanceWithDetails` / `deductAvailableOnly`（`src/hooks/useUserProfile.ts`） | 🟢 | 合并为单一"扣 Available"语义；`deductBalance` 别名保留以减少调用方改动。Trial 优先混合扣逻辑已删除。 |
| `computeTotalEquity`（`src/lib/equity.ts`） | 🟢 | 签名去掉 `trialBalance` 入参，口径 = `spot_balance + balance`。全站 UI（顶栏 Equity 胶囊 / HoverCard / Hero / /wallet Band 1 / style-guide 镜像）已同步。 |
| `src/components/home/TrialCallout.tsx` / `src/components/rewards/RedeemDialog.tsx` | 🔴 | 死文件删除。前者是从未上线的 "$10 to try" 引导；后者在 mainnet 后不可达。 |



## 2026-07-22 现货结算演示流 + 种子日常化（append-only 补录）

| 表 / 字段 / 函数 | 类别 | 说明 |
|---|---|---|
| `sim-settle-spot` Edge Function | 🔴 | 现货结算判定（YES mark ≥ 0.5 胜）为 DEMO；正式版按 databento 官方收盘价 vs `base_price` 判定。手动 POST + `sim-daily-seed` cron 触发。 |
| `events.lifecycle_status='SETTLED' ↔ is_resolved=true` | 🟢 | 硬契约：置 SETTLED 时**必须**同步 `is_resolved=true`（Resolved 页/搜索/收藏依赖后者）。 |
| `sim-daily-seed` Edge Function + pg_cron `sim-daily-seed-2105utc` (`5 21 * * *`) | 🔴 | 每日 21:05 UTC 先结算再种下一交易日 10 只 US 股票 up/down 事件；周末跳过；**美国假日忽略**（DEMO 简化）。正式版由行情/清结算服务按交易日历生成。 |
| `accrue-funding` `product_line='futures'` 硬过滤 | 🟡 | 规则明确（现货无 funding），实现自选：本仓库在查询边界过滤，不再依赖 `funding_rate=0` 的间接效果。 |





## 治理规则（即日生效）

1. **事件目录同步主网，价格和状态走演示引擎**（2026-11-09 起，原「状态走库，内容走 mock」）：事件目录（赛程、比分、队徽、长期事件）从 www.omenx.com 同步；需要跨模块流转的状态（下单/持仓/流水/券/积分）必须落 Supabase；其余纯展示内容（行情形态、社区帖子）仍 mock。
2. **单一演示引擎**：本仓库的 Supabase 是全部前端 Lovable（主站 / Sports / 未来 Pro / Lite）唯一的后端，其他前端项目不得自建数据库。
3. **Schema 只在本项目变更**：其他前端项目只能调用现成的 RPC / Edge Function。
4. **sim- 前缀**：新增演示专用函数一律 `sim-` 前缀命名。
5. **本文档 append-only**：新表 / 新函数上线的同一轮，必须在本文档补一行标注；产品线扩张（现货、Pro/Lite 分面）时新增 `product_line` / `surface` 维度也在此登记。

## 未来扩张预告（研发知悉）

- 平台将拆分 **Pro / 小白（Lite）** 两个版本：同一引擎，不同前端 surface
- 产品线将从合约扩展到**现货**：events/positions 层将增加 `product_line` 维度
- Sports 子站将接入本演示引擎（替换其纯 mock 状态）

## 2026-08-31 · 充值路由偏好（CPO 拍板）
- 充值地址：每用户每链**一个**，不按账户分地址。
- 「Deposit to」（Standard / Boost）选择必须落服务端（用户级充值路由偏好，可改，记住上次）；前端 `useAccountPreference` 的 localStorage 只是缓存，不是真相源。
- 到账（入账任务）按该偏好记入 `spot_balance` 或 `balance`；用户未做过选择时的默认账户 = Boost Account。
- 当前后端只支持合约账户充提，与 2026-07-21 双账户 2b §4 拍板不符，列为 P0 待实现。

## 2026-09-19 邮箱 + 密码登录（append-only 补录）

| 项 | 类别 | 说明 |
|---|---|---|
| Supabase Auth 邮箱密码 provider（`signInWithPassword` / `signUp`） | 🟡 | 「邮箱 + 密码可注册登录、注册须验证邮箱、密码只能经邮件链接重置」的规则照抄；账号存储与会话实现由正式架构决定 |
| 注册验证码 `DEMO_VERIFY_CODE = 111111`（`src/lib/emailAuth.ts`） | 🔴 | 仅演示，不真发邮件；正式版发真实 6 位码，并在发码前查邮箱是否已注册 |
| `resetPasswordForEmail` → `/reset-password`（`updateUser({ password })`） | 🟡 | 一次性、1 小时有效、登录前后共用同一落地页的规则照抄；邮件通道与令牌实现自选 |
| 本库 `auth.users` 无 profile 触发器；profile 行由前端 `upsertStarterProfile()` 在拿到会话后创建 | 🔴 | 演示便利；正式版由服务端在账号创建时建 profile（`auth_method` / `email` / 随机用户名头像） |
| `profiles.auth_method = "email"` | 🟡 | 「账号来源」语义是需求（决定 Settings 是否显示 Password 行、completeProfile 邮箱只读）；字段位置自选 |
| 改密码后 24 小时禁提现 | 🟢（正式版必做，Lovable 未做） | Lovable 没有提现冻结机制，界面上未写；见 `docs/delivery/auth-email-v1.md` §6 |

## 2026-09-22 Settings 改版（Notifications / Preferences / Sessions / Close account，append-only 补录）

| 项 | 类别 | 说明 |
|---|---|---|
| `profiles.notification_prefs`（jsonb：settled / auto_close / trades / funds，默认全 true） | 🟡 | 「四类邮件提醒可分别开关、新账号默认全开、无邮箱不发」的规则照抄；字段位置自选 |
| 真实发信（结算 / 自动平仓预警 / 成交 / 出入金邮件） | 🟢（正式版必做，Lovable 未做） | Lovable 只存偏好；正式版由通知服务按偏好 + 用户语言发信；浏览器推送 / Telegram 通知为第二批 |
| `profiles.language`（en / zh-CN / zh-TW / ja / ko / ru / vi） | 🟡 | 「站点语言偏好登录后跟账号走、页头与 Settings 共用一份」照抄；游客 localStorage `omenx.language`。页面文案 i18n 本轮未做；第二批语言 es / id / tr |
| RPC `list_my_sessions()`（SECURITY DEFINER 读 `auth.sessions`，按 `auth.uid()` 过滤，`is_current` = JWT `session_id`） | 🟡 | 「用户能看到自己的活跃会话、标出本机、能登出其他设备」的规则照抄；正式版由认证服务提供会话列表，**IP → 城市**由服务端解析（Lovable 显示 IP） |
| `supabase.auth.signOut({ scope: "others" })` | 🟡 | 语义照抄（撤销本机以外全部 refresh token） |
| Close account | 🟢（正式版必做，Lovable 部分模拟） | 2026-10-12 定稿四步：余额 ≥ 起提额拦截去 Wallet；0 < 余额 < 起提额 → 发到已保存地址或放弃；确认 = 提现验证设置（邮箱 / 验证器 / 两者 / 无）+ CLOSE；确认即关闭，无冷静期、不可恢复。Lovable：打款走 `record-transaction` + 余额清零、码固定 111111、写 `profiles.closed_at` 不删数据，已关账号再登录由 `ClosedAccountGate` 全站拦一屏 + Sign out。正式版：链上打款（USDC on Base）、真验码、确认即异步注销（删 profile / API key / 全部会话，保留合规交易记录；登录直接失败）、放弃余额归平台。见 `docs/delivery/email-login-settings-v1.md` §4.4 / §7 #10 |
| Authenticator「Added {date}」 | ⬜ | Lovable `user_security` 不暴露启用时间，行内显示 `Codes from your authenticator app`；正式版可显示启用日期 |


## 2026-09-23 Rewards 阶梯任务（append-only 补录）

| 项 | 类别 | 说明 |
|---|---|---|
| `campaign_entries.rules.tasks[].type` / `tiers[]`（jsonb，无表结构变更） | 🟡 | 任务类型字段：缺省 `threshold`；`tiered` 带 `tiers:[{target,reward}]`。配置校验（2–8 档、升序、单一奖励单位）正式版后台做 |
| `campaign_grants` 每档一行 `<task_key>#t<n>`，`progress.credited_usdc` / `credited_at` | 🟡 | 键法与 progress 键名照抄；前端按 `#t` 前缀汇总 |
| `apply_campaign_progress()` 阶梯分支：USDC 档达标 → 行级闩锁 `status <> 'claimed'` → `profiles.spot_balance += usdc` → `transactions(bonus, spot, 'Campaign reward · <task> · Tier n')` | 🟢（正式版必做，口径以 `docs/delivery/rewards-tiered-tasks-v1.md` §3.1 为准） | Lovable 用 Postgres 触发器做参考实现；正式版接自有事件管线 + 真实记账，**必须保留一档只入账一次的幂等语义**，入账写路径唯一 |
| `claim-campaign-grant` 解析 `<task_key>#t<n>` → `tiers[n-1].reward.voucher` | 🟡 | 只服务券档；USDC 档不经此函数 |
| 自动入账通知 | 🟡 | Lovable：详情页加载时 toast（localStorage seen-set）；正式版可换服务端推送 / 站内信，文案沿用 RW-12b |

## 2026-09-25 Rewards 任务类型第二轮（append-only 补录）

| 项 | 类别 | 说明 |
|---|---|---|
| 触发器三层：`campaign_metric_value()`（指标重算）/ `apply_campaign_progress(…, _metrics[])`（类型分发）/ `campaign_settle_grant()`（唯一入账点，行级闩锁） | 🟢（正式版必做，口径以 `docs/delivery/rewards-task-types-v1.md` §2.2 / §3 为准） | Lovable 用 Postgres 触发器 + pg_cron 做参考实现；正式版接自有事件管线 + 真实记账，保留「一档 / 一期 / 一次 bonus 只入账一次」幂等语义 |
| `type: recurring` 期 grant `<key>@<YYYY-MM-DD \| IYYY-Www>`、bonus `<key>#s<n>`、`max_periods` | 🟡 | 键法与 progress 键名照抄；UTC 日 / ISO 周边界 |
| `referrals_campaign_hook()`：好友合格 → 只驱动邀请人所在活动里 `referrals_qualified` 任务 +1，**不写 referrals 表** | 🟢 | 与 Referral 分页每人 $5 券各算各的（2026-09-26 Liya 拍板，取代 09-25 的"不叠加 / counted_toward"）；正式版同样两条独立路径，不需要跨模块判断 |
| `hold_positions`：平仓事件 + pg_cron `campaign-hold-sweep`（每小时 :15） | 🟡 | 正式版可改事件驱动；含自动平仓 |
| 演示滚动器 `roll_demo_campaign_daily()` + pg_cron `roll-demo-campaign-daily`（00:02 UTC） | 🔴 演示专用 | 只重写 alex_carter 的 daily_trade 期记录与对应流水；正式版不存在 |
| 演示补量 `top_up_demo_voucher_volume()` + pg_cron `top-up-demo-voucher-volume`（05:25 UTC） | 🔴 演示专用 | alex_carter 近 30 天成交量 < $12k 时补一笔已结算合约单（trade + Closed position + trade_profit 流水，≤ $4k/次，目标 $15k）让 Vouchers 页 Payout tier 常驻 T3；正式版不存在。migration `20261008120000` |
| `active_days`：distinct UTC 日，`min_notional` 缺省 $10 | 🟡 | 照抄 |
| `claim-campaign-grant` 解析 `@period` / `#s<n>` | 🟡 | 只服务券 |

## 2026-10-12 美式运动 NFL / MLB / NHL（append-only 补录）

| 项 | 标记 | 说明 |
|---|---|---|
| `events.metadata.sport` ∈ `american_football` / `baseball` / `hockey` 决定记分牌形态 | 🟢 A | 正式版照抄：形态规格在前端 `sportSegments.ts`，服务端只需保证字段值 |
| `segment_results[i].{home, away}`：棒球未轮到的半局为 `null`；`half` / `outs` / `possession` / `clock` 新字段 | 🟢 A | 数据契约见 delivery §4.8；正式版由真实赛事源填 |
| 让分 / 大小分兄弟行：主行自指 `fixture_id`，`market_type` handicap / total，`line` 主队视角带符号；美式运动**按终场比分（含加时 / 加赛局）结算** | 🟢 A | 结算口径是产品规则，必须照抄；足球仍按常规时间 |
| `tick_live_us_sports()` + pg_cron `tick_live_us_sports`（*/5）；`ensure_us_sport_lines()` | 🔴 演示专用 | 随机推进与结算只为 Lovable 演示；正式版接真实比分源 |
| 常驻演示 `demo-live-nfl` / `demo-live-mlb`（结算后立即重开） | 🔴 演示专用 | 不上正式版 |

## 2026-10-13 消息中心 Notifications（append-only 补录）

| 项 | 标记 | 说明 |
|---|---|---|
| `notifications` 表：`type` / `params`（只存插值参数，不存文本）/ `deep_link` / `dedupe_key` 唯一 / `read_at` / 90 天保留 | 🟡 B | type 枚举、params 键、已读规则、保留期是需求（词典「Notifications」）；存储 / 投递实现自选 |
| `notify()` 单一写入口 + `ON CONFLICT (user_id, dedupe_key) DO NOTHING` | 🟡 B | "同一事件只发一次"是需求；正式版可用消息队列幂等键实现同一语义 |
| 生产者触发器（positions / transactions / position_vouchers / campaign_grants / user_tasks / referrals / airdrop_positions / voucher_earnings_ledger / api_keys / connected_accounts / recovery_requests / profiles） | 🟡 B | 触发点与 type 映射是需求（delivery §2.2）；正式版在各服务的同一业务点发出 |
| `settled.round_batch`：同一事件 ≥3 条在一次结算里一起 Closed → 一条 | 🟢 A | 合并规则照抄 |
| `trade.*` 不计角标；`close_reason` 空且 pnl = 0 不发（撤回的下注） | 🟢 A | 照抄 |
| `notify_expiring()` cron */30（券 / 空投 / grant 到期前 24h）；`purge_notifications()` 每日 | 🟡 B | 提前 24h 与 90 天是需求；调度方式自选 |
| `notify_self()`：前端产出 `autoclose.tight / soon`（Boost usage ≥ 80 / ≥ 95 进入档位）与 `account.new_session` | 🔴 演示专用 | 正式版由风控引擎 / 认证服务在服务端产出（带设备 + 城市）；前端禁止写通知 |
| `mark_notifications_read(ids | null)` | 🟡 B | 已读语义照抄 |
| `trade.order_filled / order_cancelled`（Pro 挂单） | 🟢 A · 正式版必做 | Lovable 没有订单账本（红线 4），正式版 v1 必须补这两条进 Trading tab |
| `system` category（活动 / 公告 → v2 Updates tab） | 预留 | 需运营后台，不在 v1 |
| 邮件副本按 `profiles.notification_prefs` 四开关分发 | 🟡 B | Lovable 只存偏好不发信 |

## 2026-10-13 消息中心 v2 · Updates tab + 公告页（append-only 补录）

| 项 | 标记 | 说明 |
|---|---|---|
| `announcements` 表（kind / title / summary / body_md / cta / window / affects / status / published_at / locale） | 🟡 B | 字段语义、两种 kind、published 才公开、withdrawn 删通知是需求；存储自选 |
| 发布 = 广播：`trg_announcements_notify` 对 `profiles` 全员 `notify()`，dedupe `ann:<id>` | 🟡 B | "发布那一刻全员各一条、同一公告只一条"是需求；大用户量正式版可改「一条广播 + 每人已读表」拉模式，前端语义不变 |
| 写公告：Lovable 阶段用 SQL 手工插，无后台页 | 🔴 演示专用 | 正式版需**运营后台**（发布 / 定时 / 撤回 / 预览 / 多语言副本），研发侧立项 |
| `system.campaign_live` 触发器（campaigns → live 广播全员） | 🟡 B | 活动服务同一业务点发出 |
| `notify_campaign_ending()` cron */30，只给 `campaign_participations` 里的人（A8） | 🟡 B | "只提醒参与过的"是需求 |
| `notify_watchlist_live()` cron */5：`user_watchlist × events.start_date` 最近 10 分钟 | 🟡 B | 赛事服务按 kickoff 推；「临近结算」本轮不做（A9），`events.end_date / expected_settlement_time` 字段在，等 CPO 要 |
| 公告正文 Markdown 子集（含图片 / 表格，无 HTML） | 🟢 A | 渲染规则照抄（`src/lib/markdownLite.ts`）；正式版若换渲染器须保持同一子集与安全策略 |
| 公告多语言 | 预留 | v2 只有 en 正文；`locale` 列在；正式版按 locale 多副本 |
| **回填守卫**（2026-10-14）：`notif_transaction` 对 INSERT 且 `created_at < now() − 1h` 的行不发通知 | 🟢 A | "导入 / 回填 / 重跑的历史记录不算新事件" 是需求——正式版任何批量回填、对账重放、迁移都不得触发用户通知；Lovable 的触发源是演示引擎 `roll_demo_campaign_daily` 每晚重插历史 bonus |

## 2026-10-30 Quick Play · BTC 30 秒合约 + 场次（append-only 补录）

| 项 | 标记 | 说明 |
|---|---|---|
| `arcade_params`（费率 3% / 0.15% / 5%、筹码档位、单账户未到期 ≤ $500、每秒 ≤ 2 笔、全桌最坏损失 ≤ $10,000、熔断 10 bps、模型系数、报价钳位 0.40–0.60） | 🟢 A | 数值照抄研发稿 + CPO 修订（`docs/delivery/quick-play-v1.md` §3.1）；存成表还是配置自选 |
| `arcade_place(side, gross, quote_ts)`：按用户看到的报价成交、校验链、t0 = 接单时刻、派彩当场锁定、失败不扣钱 | 🟢 A | 校验顺序与拒单文案是需求（词典「Quick Play v2」）；`quote_ts` 对账 + 指数漂移 ≤ 1 bp 是防"抢价"的硬规则 |
| `arcade_cancel(id)`：2 秒内、退 `gross − 0.15%`（**4 位小数**，2026-11-02：`cancel_fee` / `pnl` 为 numeric(12,4)）、开仓费一起退 | 🟢 A | 照抄 |
| `20261104170000_arcade_no_undo.sql`（CPO 2026-11-04）：**关闭撤销**——`arcade_params.cancel_window_ms = 0` + 收回 `arcade_cancel` 的 EXECUTE（PUBLIC / anon / authenticated）；函数留档，历史 `cancelled` 单不动。正式版：没有撤单接口，下单即锁定 30 秒 | 🟢 A | 照抄 |
| `arcade_combo_vouchers(user)`（2026-11-02）：按 t1 顺序重算连赢（void / 撤单不算、30 分钟断场），每满 `combo_voucher_every`(3) 发一张 `combo_voucher_face`($2) tiered 仓位券，UTC 日 ≤ `combo_voucher_cap_day`($10)；`position_vouchers.source_arcade_call_id` 唯一 = 幂等；`arcade_settle_due` 结完赢单即调；`arcade_table_now().combo_today` 回给机柜 | 🟢 A | 规则照抄；调用时机自选（结算同事务最好）。全站每日券池要不要扣待 CPO 定 |
| `arcade_settle_due()`：S0 = t0 后第一条有效指数、S1 = t1 前最近一条（等 ≤ 2 s）、平局 / 无价 void 全退、赢扣 5% 利润；幂等 | 🟢 A | 口径照抄；调度（每 tick 扫 + 客户端到点 `arcade_settle_mine()`）自选 |
| 指数：Binance / Hyperliquid（现货 `@142`）/ Coinbase 三家中间价换算 USDT 取中位数，点差 ≤ 2 bps、≥2 源、2 源偏差 > 5 bps 判无效；500 ms 采样 | 🟡 B | 规则在此（`arcade_feed_tick()` 是参考实现）；正式版用自己的行情服务，**不走 pg_cron + pg_net** |
| 报价模型 `p = clip(sigmoid(a + b·z30 + c·z60), 0.40, 0.60)`，600 s 历史起报 | 🟡 B | 系数是研发稿候选值，模型归研发 |
| 桌态 `arcade_table_state`（index / breaker / loss / full / off）与"已开的照常结算" | 🟢 A | 暂停触发条件照抄；Lovable 把阈值拨到够不着（见下） |
| `arcade_acks` 免责接受记录（每账号一次） | 🟢 A | 照抄 |
| `arcade_my_sessions()` / `arcade_my_session_calls()`：30 分钟断场、字段口径（calls = won + lost、payout = staked + pnl） | 🟢 A | 口径照抄（quick-play-v1 §2.2）；窗口函数实现自选 |
| `arcade_table_feed()` 匿名化 `al***er`；`arcade_sim_tick` 匿名模拟单 | 🟡 B / 🔴 | 打码规则照抄；模拟单是演示（运营决定正式版要不要） |
| `arcade_sim_feed` 每 2 秒模拟 tick、`arcade_synth_tick` 补合成 tick、`arcade_always_on` 阈值拨开、`arcade_housekeeping`、`arcade_probe` / `arcade_stall_probe`、`arcade_feed_req` | 🔴 演示专用 | 正式版禁止参考；Lovable 小实例跑不动真取价才改的（quick-play-v1 §3.2） |
| 站内其他页 BTC 价锚指数（`roll_arcade_rounds` → `arcade_real_btc()`）；`arcade_rounds` 旧轮次流 | 🔴 演示专用 | 正式版各页读同一行情服务 |
| 钱包流水 description（`Quick Play fee · 3% · …` 等六种） | 🟢 A | 文案照抄（词典） |

## 2026-11-04 Sports 列表 · 直播提醒（append-only 补录）

| 项 | 标记 | 说明 |
|---|---|---|
| `stream_reminders` 表（`user_id` × `event_id` 主键、`created_at`、`notified_at`），RLS 只读写本人行 | 🟡 B | "一人一场一条、可取消、游客不能设"是需求；存储自选 |
| 写入校验（RLS insert，`20261104150000_stream_reminders_insert_check.sql`）：只收有 `stream_url`、未结算、kickoff 在 `now()` 之后且 48 小时内的比赛；不限每人条数；取消不设限。前端写入用 upsert（重复设置不报错） | 🟡 B | 规则是需求（CPO 2026-11-04 第二轮）；正式版在提醒服务入口做同样校验 |
| 触发锚点与改期：以 kickoff 为准，30 分钟窗口从 kickoff 起算；每次都读最新 kickoff，比赛改期按新时间发；比赛取消（结算 / 作废）不发；正式版若开播事件早于 kickoff，以先到者为准 | 🟡 B | 需求（第二轮） |
| 送达渠道：v1 只发站内消息中心（铃铛 / Updates），不发邮件 / 推送，不设偏好开关 | 🟡 B | 需求（第二轮）；人不在站上就收不到，CPO 已接受 |
| `notify_stream_reminders()` cron 每分钟：kickoff（`metadata.kickoff_at`，否则 `start_date`）已过且在 30 分钟内、未结算、仍有 `stream_url` → `notify(…, 'system.stream_live', …, dedupe 'stream:<event_id>')` + 盖 `notified_at`；过了 30 分钟没发的直接盖章不补发 | 🟡 B | "开播时提醒、只提醒一次、不迟发"是需求；正式版由提醒服务按直播开始事件推（不必轮询） |
| `metadata.stream_url`（HLS `.m3u8`） | 🔴 演示专用 | Lovable 用 mux 测试流种在演示赛事上；正式版由直播源服务提供，CPO 口径「LoL 与大的足球比赛都有直播」 |
| 演示：alex 一条待开播提醒（`sp-ucl-mci-int`）+ 一条已发出的 `system.stream_live`（`demo-live-cs2`）——`supabase/migrations/20261104130500_stream_demo_seed.sql` | 🔴 演示专用 | 清理 SQL 写在文件尾 |

## 2026-11-04 体育比赛 · 比赛状态（append-only 补录）

| 项 | 标记 | 说明 |
|---|---|---|
| `metadata.match_status`（scheduled / live / final / postponed / cancelled） | 🟡 B | 需求：比赛打没打完只看它，由体育数据源写；`end_date` 只是预计结束。Lovable 演示引擎不写（前端按 kickoff 推）。见 `docs/delivery/sports-match-clock-v1.md` §4 |
| 收到 `final` → 停止交易、lifecycle `REVIEW`、确认后结算 | 🟡 B | 需求 |
| 兜底：`live` 且 `now > end_date + 3h` 未收到结束 → 停交易、`REVIEW`、告警 | 🟡 B | 需求；Lovable 只在前端按同规则显示与禁下单 |
| `roll_sports_matches()` 跳过 `match_status = 'live'` 的比赛（`20261104160000_sports_match_status.sql`） | 🔴 演示专用 | 演示结算引擎跟上“结束只看状态”的规则 |
| 演示赛 `demo-live-ot-nhl`（加时中、预计结束已过 20 分钟）+ `keep_demo_overtime_fixture()` | 🔴 演示专用 | 每 10 分钟的保持定时任务待 CPO 确认；未加时约 3 小时后进入兜底显示 |


## 2026-11-04 Quick Play · 交付前修订（append-only 补录，与 2026-10-30 节冲突时以本节为准）

| 项 | 标记 | 说明 |
|---|---|---|
| `arcade_cancel(id)` | 🔴 已关闭 | 2026-11-04 起 `cancel_window_ms = 0` 且收回 EXECUTE（`20261104170000_arcade_no_undo.sql`）。**正式版不做撤单接口**；10-30 节里「🟢 A 照抄」作废 |
| `arcade_place` 超限文案 | 🟢 A | 统一为 `Limit reached · $500 in play · room frees up as your calls settle`（`20261104230000_arcade_limit_copy.sql`）；完整校验顺序与原文见交付文档 §3.1.4 |
| `arcade_params` 数值 | 🟢 A / 研发稿 | 产品参数（费率、筹码、$500、每秒 2 张、模型系数、券）见交付文档 §3.1.1；**熔断、亏损上限、全桌最坏赔付等风控数值以《BTCUSDT_30秒与1分钟涨跌产品设计_v1.0》为准** |
| `arcade_table_feed()` + `arcade_sim_tick` | 🟢 A / 🔴 | 正式版 LIVE TABLE **只放真实用户**的未到期单（打码规则照抄）；模拟单 `arcade_sim_tick` / `sim_table` 是演示专用 |
| 钱包流水（`transactions`） | 🟢 A | 每种结果写哪几行、金额多少见交付文档 §3.1.7；撤单相关两行只存在于历史数据 |
| 演示行情节奏 | 🔴 演示专用 | 实际约 2 秒一条（`arcade_sim_feed` 每秒跑、1.2 秒节流），不是 10-30 节写的 1 秒 |

## 2026-11-05 Quick Play · 交付前批项落地（append-only 补录）

| 项 | 标记 | 说明 |
|---|---|---|
| `arcade_calls.client_id` + 唯一索引 `(user_id, client_id)`；`arcade_place(side, gross, quote_ts, client_id)` | 🟢 A | 每次点击带一个前端生成的 uuid；同一用户同一编号只认一次，重发 / 并发第二份都拿回第一份建的单（`20261105110000_arcade_pre_handoff.sql`）。旧的三参数 `arcade_place` 已删 |
| `arcade_lookup(client_id)` | 🟢 A | 本人这个编号的那张单 + 当前余额；前端下单 5 秒没回音时每 2 秒问一次、最多 15 秒。配合 `quote_ttl_ms` 保证放弃之后不会再成交 |
| `voucher_daily_pools` 加 $2 档；`arcade_params.combo_pool_day`（演示 2,000）；`arcade_combo_vouchers` 发券前 `consume_daily_voucher_pool(2)`；`arcade_table_now().combo_pool_left` | 🟢 A / 配额值 🟡 | combo 券算进全站每日券池：个人 ≤ $10 且池里有剩才发；配额正式值在《BTCUSDT_30秒与1分钟涨跌产品设计_v1.0》 |
| `arcade_settle_due` void 分支多写一行 `fee +fee · Quick Play fee returned · tie / no valid price · Up` | 🟢 A | 该单流水合计 = pnl = 0（B2） |
| `arcade_housekeeping` 多删 `user_id is null and t1 < now() - 24h` 的模拟单；`arcade_sim_feed` 计入秒级 job 的 1 小时运行记录 | 🔴 演示专用 | B9：首跑清掉 28,817 行 |
| `arcade_table_feed()` 用户名短于 5 个字符 → `pl***er` | 🟢 A | B10：打码规则照抄 |
| 运营参数 | 🟡 B | CPO 2026-11-05：正式版参数（开关桌、费率、筹码档位、单账户上限、每秒单数、报价系数、券池配额）走后台配置，不单独做页面 |
| `ensure_voucher_pool_today()` 整体重写 | 🔴 演示专用 | 为加 $2 档把建池函数重写了一遍，$10 / $25 / $50 档的日配额 1000 / 500 / 100 原样保留（这三档是注册送券用的，Quick Play 不碰）；正式版按自己的券池表加一档即可 |
| `arcade_table_now().params` 现在把 `arcade_params` 整表（含风控阈值）回给所有人，`arcade_params` 对 anon 可读 | 🟡 B | 演示库为了方便；正式版只下发前端要用的几项（费率、筹码档、单账户上限、`quote_ttl_ms` / `tick_max_age_ms`、`combo_*`、`live`），风控阈值不出后端 |
| `arcade_table_state.paused_reason` 新增值 `loss_hour`（60 分钟滚动亏损上限）；`arcade_place` 对应拒单文案（`20261105120000_arcade_loss_hour.sql`） | 🟡 B | 由风控引擎置位 / 清除；Lovable 没有风控引擎，只有字典 AR-68 / AR-69 能看到这一态 |

## 2026-11-09 主网事件目录同步 · 第 1 批（append-only 补录）

| 项 | 标记 | 说明 |
|---|---|---|
| `mn_sync_requests`、`mn_sync_log`（RLS 开、无策略） | 🔴 演示专用 | pg_net 请求号 ↔ 种类；每轮统计留 3 天 |
| `mn_logo_tiles(url, color)` | 🟡 B | 方块队徽的颜色。**规则是需求**（方块队徽画成同色圆 + 缩写，S1）；正式版由队伍资料直接给颜色，不用这张表 |
| `mn_sync_request()` / `mn_sync_apply()`；cron `mainnet-catalog-sync` `*/3` | 🔴 演示专用 | 拉主网公开接口写 Lovable 自己的事件表；正式版就是主网，不需要 |
| `mn_apply_calendar` / `mn_apply_catalog` / `mn_apply_homepage` / `mn_apply_detail` / `mn_settle` / `mn_sport_of` / `mn_match_status` / `mn_unique_name` | 🔴 演示专用 | 字段映射见 `docs/delivery/mainnet-catalog-sync-v1.md` §3；其中「状态文字原样显示」「主网结果结算」两条语义 🟢 |
| `events.metadata.retired` | 🔴 演示专用 | 演示引擎自编事件退役标记；列表一律过 `isListed`（`sportsData.ts`） |
| `roll_sports_matches` / `tick_live_us_sports` 跳过 `metadata.source = 'mainnet'`；退役赛事只在有人持仓时结算、结算后不重排 | 🔴 演示专用 | |
| `sim_price_tick`：跳过退役行、上限 100 → 400、`metadata.independent_options` 的多档事件逐档独立游走（不归一） | 🔴 演示专用 | 主网多档事件每档是独立的 Yes / No 盘，价格不是一组加起来为 1 的概率 |
| `sim_market_activity_tick` 跳过退役行、随机抽 60 个；`roll_demo_positions` 新仓只开在未退役、主盘、`futures` 或 `contract` 的事件上 | 🔴 演示专用 | |
| `mn_matches_to_calendar()`；`mn_sync_request` 换成 `/pub/sports/matches` + 请求头 `X-Time-Zone`（主站首页 `/?tab=sports` 同一份）；主网不再列出的比赛 30 分钟后隐藏 | 🔴 演示专用 | `20261109200000_mainnet_sync_home_tab.sql` |
| `mn_refresh_demo_picks()`：Editor's Desk 三条常驻演示精选跟着各自系列的当前一轮走 | 🔴 演示专用 | 正式版精选来自运营后台 `/pub/event/featured-markets` |
| `events.metadata.demo_pinned`（More 段常驻的 4 个演示长期事件） | 🔴 演示专用 | |


## 2026-11-10 主网事件目录同步 · 第 2 批（股票日轮、加密轮）（append-only 补录）

| 项 | 标记 | 说明 |
|---|---|---|
| `mn_apply_stock_rounds(jsonb)` / `mn_tick_stock_rounds()`；`mn_sync_apply` 调用两者；`mn_sync_request` 多拉目录第 2 页 | 🔴 演示专用 | 按主网目录开股票日轮、刷新盘中状态、到点结算（`20261110120000_mainnet_sync_batch2_rounds.sql`） |
| cron `roll-daily-stock-events`、`roll-daily-hk-stock-events` 停用（函数保留不再调用） | 🔴 演示专用 | |
| `mn_stock_names(code, short)`（RLS 开、无策略） | 🟡 B | 公司短名表。**短名本身是需求**（行里写 `AMD` 不写 `Advanced Micro Devices, Inc.`），正式版放进股票资料 |
| `mn_walk_close(id, base)`、`mn_fnv1a`、`mn_u32_mul`；`settle_prior_stock_session` 改用 `mn_walk_close` | 🔴 演示专用 | 演示结算 = 首页小图走势线的最后一点；正式版按真实收盘价 |
| `mn_stock_tz` / `mn_stock_open_at` | 🔴 演示专用 | 美 / 港 09:30、韩 09:00 当地开盘 |
| `roll_crypto_quick_rounds`：1d / 4h 按美东切；同一币 × 周期只开一轮 | 🟢 A（切点规则） | 1d = 美东中午 12 点，4h = 美东 0/4/8/12/16/20 点，与主网一致 |
| `mn_stock_names.icon_url / icon_at` + 公开只读策略；`mn_apply_daily_close` / `mn_note_stock_code` / `mn_mainnet_stock_code` / `mn_display_stock_code`；`mn_sync_request` 每轮取 12 只缺 logo 的股票（`/pub/event/daily-close/rounds/current?assetCode=`） | 🔴 演示专用 | 股票 logo 跟主网（`20261110130000_mainnet_stock_icons.sql`）；正式版直接用主网资产资料的 `iconUrl` |
