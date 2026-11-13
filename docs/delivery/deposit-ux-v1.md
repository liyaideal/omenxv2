# 充值引导优化 — 交付说明 v1（2026-11-12 起，2026-11-13 定稿交付）

> 起因是 BD 在主站测充值流程的反馈：注册到充值是主要卡点，用户找不到充值入口。
>
> **原来**：桌面顶栏右上角是一个「Equity: $xx」胶囊，充值要先点它进 Wallet 再找按钮；下单卡余额不够时只有一行提示，没有去处；Portfolio 没钱时的空态只有 `Browse events`。
>
> **这次多了什么**：
> - 桌面顶栏：余额旁边常驻一个 `Deposit` 按钮，点了原地弹充值弹窗（§1）
> - 全站把 Equity 改叫 Balance（§2）
> - 下单卡余额不到 $1 时，提示里的 `Add money` 可以点：另一个账户有 ≥ $1 就打开划转，否则打开充值；点下单弹出的余额不够 toast 也走同一条规则（§3）
> - Portfolio 的 Live 页没持仓又没钱时，空态主按钮变成 `Deposit to start`（§4）
> - 正式版跨链充值默认币改回 USDC（§5，只有正式版要改）
>
> **顺手修的**：手机 Me 抽屉的账户行和 Transfer 各语言统一译法、划转弹窗补齐翻译、手机底部导航任何时候只亮一个 tab、手机上 toast 按钮在下单抽屉打开时能点、没有语言切换器的页面也按账号语言显示（§2 / §3 / §6）。
>
> 手机品牌栏、下单按钮、余额旁的 ⇄、有钱时的 Portfolio 空态都没动。先看 §0 知道去哪儿查，再按章节看。

**BD 六条反馈对应到哪儿**

| BD 反馈 | 这次 | 位置 |
|---|---|---|
| 1. 顶栏没有 Deposit | 做了（桌面）；手机品牌栏不加，入口仍是 Wallet tab 与 Me 抽屉 | §1 |
| 2. Equity / Wallet 命名不统一，俄语 Капитал 难懂 | 做了：数字统一叫 Balance（俄语 Баланс），页面仍叫 Wallet | §2 |
| 3. 登录后语言切换藏在头像菜单 | 不在本次（桌面登录后放头像菜单是 10-13 定的；手机品牌栏一直有地球） | — |
| 4. 充值弹窗摩擦大（只收 Base USDC + 三个勾选） | 不在本次 | — |
| 5. 跨链 tab 默认 AALON | 正式版改默认 USDC（Lovable 本来就是） | §5 |
| 6. 余额为 0 时引导充值 | 做了：下单卡 Add money、Portfolio Deposit to start | §3 / §4 |

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
| 点余额 | 进 `/wallet`；鼠标停上去出悬浮卡（两个账户分别多少 + 合计 + Transfer），合计那一行叫 `Total balance`；卡顶不再放标题（原来顶部眉行也写 TOTAL BALANCE，和合计行重复，CPO 2026-11-13 删掉） |
| 点 Deposit | 原地弹出充值弹窗，不预选账户：沿用用户上次的账户——包括从下单卡「Add money」进充值时预选的那次（那次会记成偏好）；从来没有过才先让他选 |
| 窄屏让位 | 导航不折行、不钻到托盘下面：1280 以下隐藏头像旁的用户名（交易页 1536 以下就隐藏，因为多一个 Lite/Pro 开关），托盘和导航内边距收紧（交易页再收一档）、导航字号 13，头像按钮不被压缩；钱包图标 1024 以下隐藏（交易页 1280 以下隐藏）。余额数字和 Deposit 任何宽度都在 |
| 读屏 | 余额按钮念「Balance $x」 |
| 手机 | 品牌栏不加 Deposit，保持 `[🔔][🌐]` |

## 2. 命名：Equity 改叫 Balance

| 位置 | 原来 | 现在 |
|---|---|---|
| 桌面顶栏 | `Equity: $xx` | 不写标签（见 §1） |
| 顶栏悬浮卡合计行（卡顶标题 2026-11-13 已删） | `Total equity` | `Total balance` |
| 手机 Me 抽屉余额卡 | `Equity` | `Balance` |
| Wallet 页头大数标签（2026-11-13 第二批） | `Est. Total Equity` | `Total balance`（key `wallet.equity`；下面那行当时不变；2026-11-13 起 Lite 改为单独一句 `Cash in your accounts now. Open calls count once you close them.`（见 lite-winloss-display-v1 §7）） |

key 名不变，只改值（7 语）：`common.equity` = Balance / 余额 / 餘額 / 残高 / 잔액 / Баланс / Số dư（西语 Saldo）；`home.screen.HomeGreeting.total_equity` = Total balance / 总余额 / 總餘額 / 合計残高 / 총 잔액 / Общий баланс / Tổng số dư。繁中原来的「股權」是误译，一并改掉。

**手机 Me 抽屉 · 账户行与 Transfer 统一译法**（2026-11-13）：

| 词条 | 改动 |
|---|---|
| `header.accountsLine`（Me 抽屉余额下那行） | 原来各语言都是英文 `Standard $x · Boost $y`；现在 Standard 翻译、Boost 保持品牌词：标准 / 標準 / スタンダード / 스탠다드 / Стандарт；越南语保留 Standard |
| Transfer（抽屉按钮 `nav › screen.navigation.bottom_navigation.transfer`、Wallet 页 `wallet.transfer`、悬浮卡 `header.transfer`） | 三处同一个词：日语 送金 → **振替**（划转弹窗里的按钮、成功 / 失败提示、记录、From / To 标签也一起改，见下一段）；简中抽屉 转账 → **划转**；繁中抽屉 轉帳 → **劃轉**、Wallet 与划转弹窗里的「划轉」→ **劃轉**（简体字混入）；简中划转失败提示 转账失败 → 划转失败；越南语三处统一 **Chuyển tiền** |

**划转弹窗 / 抽屉补齐翻译**（2026-11-13，三方验收发现）：账户名用 `wallet.standardAccount` / `wallet.boostAccount`；「To」标签原来借用日期区间的 `market.date_to`（日语显示「〜」）→ 改 `wallet.to`（日语 振替先，`wallet.from` 振替元；跨链充值的「From」改用自己的 `wallet › screen.cross_chain_deposit.from`，不受影响）；`Available $x` → `wallet.availableAmount`；按钮 → `wallet.transfer` / `wallet.transferAmount` / `wallet.transferring`；余额不足提示新 key `wallet › transfer_insufficient`；成功 / 失败 toast → `wallet.transferSuccess` / `transferFailed`。方向切换里的 `Boost → Standard` 没动。

**手机底部导航高亮**（2026-11-13）：在 Portfolio 页时 Portfolio 和 Me 两个 tab 曾同时高亮。现在 Me 只在它的抽屉打开时高亮；抽屉开着时其他 tab 都不亮，任何时候只亮一个。

**日语导航换短译法**（2026-11-13，交易页 1024 宽时导航最后一项会压到托盘）：`nav.portfolio` ポートフォリオ → **ポジション**，`nav.insights` インサイト → **分析**。其他语言不变。Pro 风险相关的 Equity（Account Equity、Risk Ratio = MM / Equity）含浮盈，不改。

## 3. 下单卡余额不够：Add money 做成链接

适用：Lite 合约卡（Boost）+ Lite 现货卡（Standard），桌面右栏和手机下单抽屉是同一张卡。

| 规则 | 内容 |
|---|---|
| 什么时候出现 | 不变：已登录、不是对冲单、`floor(本账户余额) < 1`（沿用 [lite-polish-1105-v1 §1](./lite-polish-1105-v1.md)） |
| 长什么样 | 那行提示整句不变，只有「Add money」那几个字变成链接：主色、下划线、加粗（semibold），字号行高跟整行一样 |
| 点了去哪 | 另一个账户余额 ≥ $1（按整数美元算，`floor(余额) >= 1`）→ 打开划转（桌面弹窗 / 手机底部抽屉），方向是转进当前这个账户；不足 $1（含 $0 和几美分）→ 打开充值：桌面直接弹出充值弹窗，账户预选成这张卡的账户（Boost 卡 → Boost，Standard 卡 → Standard）；手机进 `/deposit` 充值页，同样预选这张卡的账户 |
| 判定来源 | 跟余额不够时点下单弹的 toast 用同一个分叉，只有一份逻辑（`useInsufficientBalanceToast` 新增 `addMoney`） |
| 点下单弹的 toast（2026-11-13） | 提示句 `Not enough balance — add funds to continue`（key `wallet › insufficient_toast.message`，7 语）。同一个 ≥ $1 分叉：够划转 → 按钮 `Transfer`（`wallet.transfer`，打开划转）；不够 → 按钮 `Add funds`（`wallet › insufficient_toast.add_funds`），点了和 Add money 链接走同一个充值（桌面原地弹充值弹窗、预选这张卡的账户；手机进 `/deposit` 并预选）。原来 Add funds 在桌面跳 `/deposit`，实际只落到 Wallet 页，已改 |
| 手机：toast 盖在下单抽屉上（2026-11-13） | toast 按钮在下单抽屉打开时必须能点（Toaster `pointer-events-auto`）；点 toast 不算「点抽屉外面」，抽屉不关（划转抽屉挂在下单面板里，抽屉一关它就没了）。点 `Add funds` 时手机直接跳 `/deposit` |
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

## 5. 跨链充值默认币（只有正式版要改）

充值弹窗的跨链 tab，打开时默认来源链 Ethereum、来源币 **USDC**——Lovable 一直是这样（`CrossChainDeposit` 初始 `fromChain = 'ethereum'`、`fromToken = 'USDC'`）。BD 在正式版看到默认选中的是一个不知名代币（AALON），正式版改成和 Lovable 一致即可。如果某条链没有 USDC，退而选 USDT。

## 6. 其他顺手修的（研发照做）

| 改了什么 | 为什么 | 在哪 |
|---|---|---|
| 手机上，下单抽屉开着时 toast 的按钮能点；点 toast 不会把下单抽屉关掉 | 原来抽屉把整页设成不可点，toast 按钮点不到，点下去只会关抽屉 | `components/ui/sonner.tsx`（Toaster 加 `pointer-events-auto`）、`components/ui/sheet.tsx`（`onInteractOutside` 里点在 toast 上不算外部点击） |
| 没有语言切换器的页面也按账号语言显示 | 手机交易页没有页头，原来新设备直接打开是英文 | `App.tsx` 根挂 `LanguageRuntime`（调用一次 `useLanguage()`） |
| 手机 Me 抽屉账户行折行时只在两个账户之间断，不留孤立的「·」；Transfer 按钮不折行 | 越南语、大额余额时会折坏 | `BottomNav.tsx` 余额卡 |

## Lovable / 正式版

| | Lovable | 正式版要做的 |
|---|---|---|
| 链接本身、分叉判定 | 已做 | 照做；主站当前若还没有 11-05 那行提示，需要先做 1105 §1 |
| 充值去处 | 桌面弹 `DepositDialog`（`initialAccount`），手机 `/deposit` 页 | 指向正式版对应的充值弹窗 / 充值页 |
| 顶栏余额托盘、Balance 命名 | 已做 | 照做（§1 / §2） |
| 11-13 小改：≥ $1 才划转、toast Add funds 弹充值、悬浮卡去眉行、Me 抽屉译法、底部导航高亮 | 已做 | 照做（§1 / §2 / §3） |
| Portfolio 空态 Deposit to start | 已做 | 照做（判定见 §4） |
| 跨链充值默认币 | 本来就是 Ethereum + USDC | 改成一致（§5） |
| toast 与划转弹窗翻译、toast 在抽屉上可点、App 根语言、Me 抽屉折行 | 已做 | 照做（§2 / §3 / §6）；toast 能不能点取决于正式版用的 toast 库和抽屉实现，同样要验手机 |
| i18n | `low_balance_hint` ×2 改值、`low_balance_link` ×2 新增、`lite.live.deposit_to_start` 新增、`common.equity` / `HomeGreeting.total_equity` 改值；11-13：`header.accountsLine`、`header.transfer`、`wallet.transfer`、`nav › …bottom_navigation.transfer`、划转弹窗内各条（ja 振替 / zh-TW 劃轉）改值，`wallet › insufficient_toast.message` / `.add_funds` / `transfer_insufficient` 新增；ja `wallet.from` / `wallet.to` 改 振替元 / 振替先（跨链充值的 From 改用 `wallet › screen.cross_chain_deposit.from`） | 同步进 OMENX-i18n 文案表 |

## 代号 ↔ 章节

| 代号 | 白话 | 章节 |
|---|---|---|
| deposit-ux ① | 顶栏余额托盘 + Deposit | §1 |
| deposit-ux ② | Equity → Balance | §2 |
| deposit-ux ③ | 下单卡 Add money 链接 | §3 |
| deposit-ux ④ | Portfolio 空态 Deposit to start | §4 |
| deposit-ux ⑤ | 正式版跨链默认 USDC | §5 |
| PF-33b | Portfolio Live 空态没钱的字典样张 | §0.1 |
| TR-30 / SP-20 | 合约 / 现货卡余额不够的字典样张 | §0.1 |
