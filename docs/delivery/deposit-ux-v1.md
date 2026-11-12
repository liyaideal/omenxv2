# 充值引导优化 — 交付说明 v1（2026-11-12）

> 起因是 BD 在主站测充值流程的反馈：注册到充值是主要卡点，用户找不到充值入口。
> 这份文档会随这个需求分批更新。**本次（第一批）只有一处变化**：Lite 交易页的下单卡在余额不到 $1 时，那行提示里的「Add money」变成了可以点的链接。
> 下单按钮、脚注、余额旁的 ⇄ 划转入口都没动。
> 先看 §0 知道去哪儿查，再看 §3。

## 0. 查什么去哪儿

- 长什么样 → 生产页：合约交易页 `/trade?event=…`、现货交易页 `/spot?event=…`（余额不到 $1 的账号才看得到这个态）
- 什么时候变成什么样 → `/style-guide` → Lite → `交易页 ✅`（TR-30）、现货节（SP-20）
- 字段名、文案、术语 → `docs/copy-dictionary.md` › Trading 表「Add money（Lite 下单卡余额不够提示里的链接）」→ 本文
- 交易口径的词（爆仓 / 杠杆 / 限价单……）在 Lite 里叫什么 → copy-dictionary 顶部「Lite 术语对照表」

## 0.1 字典怎么看

| 步 | 做什么 | 看到什么 |
|---|---|---|
| 1 | 打开 `https://omenxv2.lovable.app/style-guide`（不用登录） | 本次涉及 **Lite** 组 `交易页 ✅` 的 TR-30、现货节的 SP-20 |
| 2 | 页头搜索框敲 `TR-30` / `SP-20` | 直接滚到那张样张 |
| 3 | 样张上方编号行 + iframe 里的真组件（可以点 Add money；字典里没登录、两个账户都是 0，所以点了走充值分支——桌面宽度弹充值弹窗，手机宽度跳 `/deposit`，帧里会变成 `Missing preview key`，属预期，刷新即回；划转分支要在生产页用另一个账户有钱的账号看） | 下方表格「状态 / 触发条件 / 视觉 / 数据来源」，新增一行「余额不够 · 点 Add money」 |
| 4 | 单张看 | `https://omenxv2.lovable.app/style-guide/preview?c=trade-tr30`、`?c=spot-sp20`；加 `&lang=ru` 等可切语言 |

只在字典看得到、演示账号凑不出的态：TR-30 / SP-20 本身（alex_carter 有余额）。

## 3. 下单卡余额不够：Add money 做成链接

适用：Lite 合约卡（Boost）+ Lite 现货卡（Standard），桌面右栏和手机下单抽屉是同一张卡。

| 规则 | 内容 |
|---|---|
| 什么时候出现 | 不变：已登录、不是对冲单、`floor(本账户余额) < 1`（沿用 [lite-polish-1105-v1 §1](./lite-polish-1105-v1.md)） |
| 长什么样 | 那行提示整句不变，只有「Add money」那几个字变成链接：主色、下划线、加粗（semibold），字号行高跟整行一样 |
| 点了去哪 | 另一个账户余额 > 0 → 打开划转（桌面弹窗 / 手机底部抽屉），方向是转进当前这个账户；另一个账户余额 = 0 → 打开充值：桌面直接弹出充值弹窗，账户预选成这张卡的账户（Boost 卡 → Boost，Standard 卡 → Standard）；手机进 `/deposit` 充值页 |
| 判定来源 | 跟余额不够时点下单弹的 toast 用同一个分叉，只有一份逻辑（`useInsufficientBalanceToast` 新增 `addMoney`） |
| 不变的 | 下单按钮、按钮下的脚注、余额旁的 ⇄、快捷金额置灰、输入框锁住 |

**多语言**：每种语言词序不同，所以整句是一个带 `{{link}}` 占位的模板，链接那几个字单独一个词条：

| key | en | 说明 |
|---|---|---|
| `trade › screen.lite.lite_contract_order_panel.low_balance_hint` | `{{link}} to your Boost balance to make a call.` | 原 key，值改成模板 |
| `trade › screen.lite.lite_contract_order_panel.low_balance_link` | `Add money` | 新增 |
| `spot › screen.lite_spot_order_panel.low_balance_hint` | `{{link}} to your Standard balance to place an order.` | 原 key，值改成模板 |
| `spot › screen.lite_spot_order_panel.low_balance_link` | `Add money` | 新增 |

7 种语言都已写进 `src/locales/*.json`（链接词：添加资金 / 加入資金 / 資金を追加 / 자금을 추가 / Пополните / Nạp tiền）。西语目前没有这两条，回落英语。

## Lovable / 正式版

| | Lovable | 正式版要做的 |
|---|---|---|
| 链接本身、分叉判定 | 已做 | 照做；主站当前若还没有 11-05 那行提示，需要先做 1105 §1 |
| 充值去处 | 桌面弹 `DepositDialog`（`initialAccount`），手机 `/deposit` 页 | 指向正式版对应的充值弹窗 / 充值页 |
| i18n | 两个 key 已改 / 已加 | 同步进 OMENX-i18n 文案表 |

## 代号 ↔ 章节

| 代号 | 白话 | 章节 |
|---|---|---|
| deposit-ux ③ | 下单卡 Add money 链接 | §3 |
| TR-30 / SP-20 | 合约 / 现货卡余额不够的字典样张 | §0.1 |
