# 充值引导优化 — 交付说明 v1（2026-11-12）

> 起因是 BD 在主站测充值流程的反馈：注册到充值是主要卡点，用户找不到充值入口。
> 这份文档按批次更新，目前落地四处：① 桌面顶栏右上角原来的「Equity: $xx」换成一块余额托盘，里面是余额和一个常驻的 Deposit 按钮（§1）；② Equity 改叫 Balance（§2）；③ 下单卡余额不到 $1 时，提示里的「Add money」可以点（§3）；④ Portfolio 的 Live 页没持仓又没钱时，空态主按钮变成「Deposit to start」（§4）。
> 手机品牌栏、下单按钮、余额旁的 ⇄、有钱时的 Portfolio 空态都没动。
> 先看 §0 知道去哪儿查，再按章节看。

## 0. 查什么去哪儿

- 长什么样 → 生产页：任何页面的桌面顶栏（登录后）；合约交易页 `/trade?event=…`、现货交易页 `/spot?event=…`、`/portfolio`（Live）——都要余额不到 $1 的账号才看得到
- 什么时候变成什么样 → `/style-guide` → Common UI › EventsDesktopHeader 卡里的「登录态右簇 · 余额托盘」（顶栏本身在字典里是未登录态）；Lite → `交易页 ✅`（TR-30）、现货节（SP-20）、`Portfolio ✅`（PF-33b）
- 字段名、文案、术语 → `docs/copy-dictionary.md` › Trading 表「Add money（Lite 下单卡余额不够提示里的链接）」、Portfolio (Lite) 表「Deposit to start」→ 本文
- 交易口径的词（爆仓 / 杠杆 / 限价单……）在 Lite 里叫什么 → copy-dictionary 顶部「Lite 术语对照表」

## 0.1 字典怎么看

| 步 | 做什么 | 看到什么 |
|---|---|---|
| 1 | 打开 `https://omenxv2.lovable.app/style-guide`（不用登录） | 本次涉及 **Lite** 组 `交易页 ✅` 的 TR-30、现货节的 SP-20、`Portfolio ✅` 的 PF-33b |
| 2 | 页头搜索框敲 `TR-30` / `SP-20` / `PF-33b`；顶栏托盘在 Common UI › EventsDesktopHeader 卡里 | 直接滚到那张样张；托盘可点（余额进 /wallet、Deposit 弹充值窗），鼠标停在余额上出悬浮卡 |
| 3 | 样张上方编号行 + iframe 里的真组件（可以点 Add money；字典里没登录、两个账户都是 0，所以点了走充值分支——桌面宽度弹充值弹窗，手机宽度跳 `/deposit`，帧里会变成 `Missing preview key`，属预期，刷新即回；划转分支要在生产页用另一个账户有钱的账号看） | 下方表格「状态 / 触发条件 / 视觉 / 数据来源」，新增一行「余额不够 · 点 Add money」 |
| 4 | 单张看 | `https://omenxv2.lovable.app/style-guide/preview?c=trade-tr30`、`?c=spot-sp20`、`?c=portfolio-lite-empty-nofunds`；加 `&lang=ru` 等可切语言 |

只在字典看得到、alex_carter 凑不出的态：TR-30 / SP-20 / PF-33b（alex 有余额；演示账号 Mia 两个账户都是 0，用她登录可在生产页看到）。

## 1. 桌面顶栏：余额托盘 + 常驻 Deposit

| 规则 | 内容 |
|---|---|
| 什么时候出现 | 桌面顶栏，已登录。没登录的顶栏不变（语言 + Sign in） |
| 长什么样 | 一块浅灰托盘（高 40、圆角 10），里面左边是钱包图标 + 余额数字（白色、等宽粗体），右边是 `Deposit` 按钮（品牌渐变绿到蓝，和 Wallet 页的 Deposit 同款）。不写「Balance」或「Equity」标签，任何宽度都一样，窄屏不缩 |
| 余额是什么 | Standard + Boost 两个账户的可用余额相加，不含持仓浮盈（和原来的 Equity 同一个数） |
| 点余额 | 进 `/wallet`；鼠标停上去出悬浮卡（两个账户分别多少 + 合计 + Transfer），标题改叫 `Total balance`（标题是小号大写眉行，屏幕上显示 TOTAL BALANCE） |
| 点 Deposit | 原地弹出充值弹窗，不预选账户：沿用用户上次的账户——包括从下单卡「Add money」进充值时预选的那次（那次会记成偏好）；从来没有过才先让他选 |
| 窄屏让位 | 导航不折行、不钻到托盘下面：1280 以下隐藏头像旁的用户名（交易页 1536 以下就隐藏，因为多一个 Lite/Pro 开关），托盘和导航内边距收紧（交易页再收一档）、导航字号 13，头像按钮不被压缩；钱包图标 1024 以下隐藏（交易页 1280 以下隐藏）。余额数字和 Deposit 任何宽度都在 |
| 读屏 | 余额按钮念「Balance $x」 |
| 手机 | 品牌栏不加 Deposit，保持 `[🔔][🌐]` |

## 2. 命名：Equity 改叫 Balance

| 位置 | 原来 | 现在 |
|---|---|---|
| 桌面顶栏 | `Equity: $xx` | 不写标签（见 §1） |
| 顶栏悬浮卡标题 / 合计行 | `Total equity` | `Total balance` |
| 手机 Me 抽屉余额卡 | `Equity` | `Balance` |
| Wallet 页头大数标签（2026-11-13 第二批） | `Est. Total Equity` | `Total balance`（key `wallet.equity`；下面那行 `Boost + Standard · does not include open trade profit` 不变） |

key 名不变，只改值（7 语）：`common.equity` = Balance / 余额 / 餘額 / 残高 / 잔액 / Баланс / Số dư（西语 Saldo）；`home.screen.HomeGreeting.total_equity` = Total balance / 总余额 / 總餘額 / 合計残高 / 총 잔액 / Общий баланс / Tổng số dư。繁中原来的「股權」是误译，一并改掉。

**日语导航换短译法**（2026-11-13，交易页 1024 宽时导航最后一项会压到托盘）：`nav.portfolio` ポートフォリオ → **ポジション**，`nav.insights` インサイト → **分析**。其他语言不变。Pro 风险相关的 Equity（Account Equity、Risk Ratio = MM / Equity）含浮盈，不改。

## 3. 下单卡余额不够：Add money 做成链接

适用：Lite 合约卡（Boost）+ Lite 现货卡（Standard），桌面右栏和手机下单抽屉是同一张卡。

| 规则 | 内容 |
|---|---|
| 什么时候出现 | 不变：已登录、不是对冲单、`floor(本账户余额) < 1`（沿用 [lite-polish-1105-v1 §1](./lite-polish-1105-v1.md)） |
| 长什么样 | 那行提示整句不变，只有「Add money」那几个字变成链接：主色、下划线、加粗（semibold），字号行高跟整行一样 |
| 点了去哪 | 另一个账户余额 > 0 → 打开划转（桌面弹窗 / 手机底部抽屉），方向是转进当前这个账户；另一个账户余额 = 0 → 打开充值：桌面直接弹出充值弹窗，账户预选成这张卡的账户（Boost 卡 → Boost，Standard 卡 → Standard）；手机进 `/deposit` 充值页，同样预选这张卡的账户 |
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

## 4. Portfolio Live 空态：没钱时引导充值

| 规则 | 内容 |
|---|---|
| 什么时候出现 | `/portfolio` 的 Live 页当前分段空着（原空态 `No live calls yet`），并且：Boost 和 Standard **两个分段都没有持仓**、已登录、余额已读完且没读错、`Standard + Boost < $1`（两个账户合计，不取整） |
| 长什么样 | 插画和 `No live calls yet` 不变；主按钮 `Deposit to start`（主色实心，h 40、圆角 10），`Browse events` 变成旁边的描边次按钮。桌面两个按钮并排；手机竖排，宽 240，两个按钮占满 |
| 点了去哪 | `Deposit to start`：桌面原地弹充值弹窗（不预选账户，沿用用户上次的选择）；手机进 `/deposit` 充值页。`Browse events` 不变，去 `/events` |
| 余额还在读 / 读取失败 | 都按「有钱」处理，只出 `Browse events`；读失败时余额会回落成 0，不能当成没钱 |
| 另一个分段有持仓 | 不出 Deposit（钱在持仓里），只出 `Browse events` |
| 不变的 | 有钱时的 Live 空态、Settled 空态、未登录门 |

文案：新 key `portfolio › lite.live.deposit_to_start` = `Deposit to start`（充值开始 / 儲值開始 / 入金して始める / 입금하고 시작하기 / Пополнить и начать / Nạp tiền để bắt đầu）。西语没有这条，回落英语。

门槛和 §3 不同是有意的：§3 下单卡问的是「这个账户够不够下这一单」，所以按单个账户、取整；这里问的是「这个人还有没有钱可以交易」，所以两个账户合计。

## Lovable / 正式版

| | Lovable | 正式版要做的 |
|---|---|---|
| 链接本身、分叉判定 | 已做 | 照做；主站当前若还没有 11-05 那行提示，需要先做 1105 §1 |
| 充值去处 | 桌面弹 `DepositDialog`（`initialAccount`），手机 `/deposit` 页 | 指向正式版对应的充值弹窗 / 充值页 |
| 顶栏余额托盘、Balance 命名 | 已做 | 照做（§1 / §2） |
| Portfolio 空态 Deposit to start | 已做 | 照做（判定见 §4） |
| i18n | `low_balance_hint` ×2 改值、`low_balance_link` ×2 新增、`lite.live.deposit_to_start` 新增、`common.equity` / `HomeGreeting.total_equity` 改值 | 同步进 OMENX-i18n 文案表 |

## 代号 ↔ 章节

| 代号 | 白话 | 章节 |
|---|---|---|
| deposit-ux ① | 顶栏余额托盘 + Deposit | §1 |
| deposit-ux ② | Equity → Balance | §2 |
| deposit-ux ③ | 下单卡 Add money 链接 | §3 |
| deposit-ux ④ | Portfolio 空态 Deposit to start | §4 |
| PF-33b | Portfolio Live 空态没钱的字典样张 | §0.1 |
| TR-30 / SP-20 | 合约 / 现货卡余额不够的字典样张 | §0.1 |
