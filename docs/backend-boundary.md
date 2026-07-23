# 后端参考边界说明（Backend Reference Boundary）

> **本仓库的 Supabase 是演示引擎（Demo Engine），不是正式后端。**
> 它的职责是让前端蓝图端到端可跑（下单 → 持仓 → 流水 → 奖励处处可见），不是给研发照抄的实现。
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
| profiles | 🟡 | `totp_enabled` / `withdraw_2fa_mode` 是需求；其余演示字段忽略 |
| user_security | 🟢 | TOTP 秘钥独立表、客户端零可见的隔离设计照抄（见 SEC3） |
| user_roles | 🟡 | RBAC 概念 |
| user_watchlist | 🟡 | 自选收藏；guest localStorage 部分不实现 |
| trade_verifications | 🔴 | 透明度审计快照是模拟的"链上数据"；审计产品形态是需求，但正式数据源为真实链上合约 |

## Edge Functions（16）

| 函数 | 类别 | 说明 |
|---|---|---|
| claim-position-voucher | 🟢 | 券领取规则 |
| redeem-position-voucher | 🟢 | 券核销开仓规则 |
| claim-voucher-earnings | 🟢 | 5 阶解冻校验（必须与前端 voucherTiers 同配置） |
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
| `redeem-position-voucher`（spot 拒绝） | 🟢 | Position vouchers 明确**仅限 futures**。函数在读取 event 时必须一并读 `product_lines`，若数组含 `'spot'` 立即返回 409 `Position vouchers cannot be redeemed on spot markets`。前端 `EventPickerList` 同步过滤 spot 事件（防御性双闸），文案与错误码对齐。 |
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

1. **状态走库，内容走 mock**：需要跨模块流转的状态（下单/持仓/流水/券/积分）必须落 Supabase；纯展示内容（行情形态、联赛资料、社区帖子）永远 mock。
2. **单一演示引擎**：本仓库的 Supabase 是全部前端蓝图（主站 / Sports / 未来 Pro / Lite）唯一的后端，其他前端项目不得自建数据库。
3. **Schema 只在本项目变更**：其他前端项目只能调用现成的 RPC / Edge Function。
4. **sim- 前缀**：新增演示专用函数一律 `sim-` 前缀命名。
5. **本文档 append-only**：新表 / 新函数上线的同一轮，必须在本文档补一行标注；产品线扩张（现货、Pro/Lite 分面）时新增 `product_line` / `surface` 维度也在此登记。

## 未来扩张预告（研发知悉）

- 平台将拆分 **Pro / 小白（Lite）** 两个版本：同一引擎，不同前端 surface
- 产品线将从合约扩展到**现货**：events/positions 层将增加 `product_line` 维度
- Sports 子站将接入本演示引擎（替换其纯 mock 状态）
