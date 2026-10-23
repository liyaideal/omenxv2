# 法币入金 · Card tab（MoonPay）— 交付说明 v1

> 这份文档说的是充值页新加的 **Card** 标签：用户用 Visa / Mastercard / Apple Pay / Google Pay（部分地区还有银行转账、PIX、PayPal）直接买 USDC，钱落到 Base 链上自己的充值地址，再记进 Standard 或 Boost 账户。收单方是 MoonPay，刷卡、3D Secure、KYC、拒付都在它那边；我们只做"选金额 → 看到手多少 → 选支付方式 → 点 Buy"，然后盯着订单直到入账。
> 之前的 Banxa 法币入口（2026-09-03 隐藏）这轮正式删掉：`BuyWithFiat.tsx`、`banxa.png` 和 Banxa 文案都不在了。
> 这次用户能看见：充值页三个 tab（Card / Crypto / Cross-chain），支持卡支付的地区默认落在 Card；一个"Pay with"选择行，换支付方式会重新报价；点 Buy 之后弹 MoonPay 的结账浮层；关掉浮层回到一张四步进度卡；成功页有庆祝猞猁和"Start trading"，失败页说清楚为什么、没扣钱；钱包流水里多了"Card purchase"这类行，处理中的能点回去看进度。
> 没动的：链上直充和跨链两个 tab 原样；余额、双账户卡、Transfer、提现没碰。
> 怎么读：先看 §0 查什么去哪儿，再看通俗导读；逐条规则在 §2；Lovable 和正式版的分界在 §4，研发接真只看那一节。

## 0. 读者须知

查什么去哪儿：
- 长什么样 → 生产页 `/deposit`（手机）和 `/wallet` 右上 Deposit（桌面弹窗），登录 alex_carter 看；钱包流水里三条 Card purchase 示例
- 什么时候变成什么样 → `/style-guide` → Lite → Wallet 状态字典 → Ⓓ 充值流 → **W-14a…W-14h**（手机）与 **W-14**（桌面弹窗），每张样张都有「状态 / 触发条件 / 视觉 / 数据来源」表；流水行看 **W-17**
- 字段名、文案 → 本文 §3；i18n 新增三个 tab 文案 key 在 `src/locales/en.json`（`settings.wallet.deposit_tab_card / _crypto / _cross_chain`）
- 设计法则（主 CTA 用信号绿、移动 sticky 底栏、Pay with 的 Drawer / Popover 对等、猞猁空态只认灰色款）→ `DESIGN.md` §9 Deposit & Withdraw Patterns 与 §Addendum 2026-10-23
- 后端边界、要配的密钥、要部署的函数 → §4

提问前先按上面顺序查一遍；查不到再提，提问时写明"我查了 X 没有"。

## 通俗导读

1. **打开充值页。** 页面先悄悄问一次 MoonPay"这个 IP 能刷卡吗"。能 → tab 栏是 Card / Crypto / Cross-chain，默认停在 Card；不能 → tab 栏还是以前的 Crypto / Cross-chain 两个，Card 根本不出现。问不到（接口挂了、超时）按"能"处理，让 MoonPay 自己拦。这个答案一次会话只问一次。
2. **第一屏只有三件事。** 顶上一个大金额框（币种跟着所在国走，不认识的国家用美元），下面四个快捷档；中间一行"你会拿到 ≈ 95.18 USDC"，费用默认折叠；再下面一行"Pay with · Credit / Debit card ›"。按钮上写的是到手数字：**Buy 95.18 USDC**。
3. **换支付方式。** 点"Pay with"，手机弹底部抽屉、桌面弹 Popover，每个方式右边直接写用它能拿到多少 USDC、手续费多少；不能用的方式灰掉并写原因。选完回到第一屏，报价按新方式重算。
4. **点 Buy。** 我们先在后台登记一笔订单，然后把金额、币种、你的 Base 充值地址、邮箱、支付方式预填好，弹出 MoonPay 的结账浮层。里面是 MoonPay 的页面：第一次要做身份验证，然后输卡号、过银行的 3D Secure。
5. **关掉浮层。** 回到我们的订单卡：四步固定（Payment received → Order confirmed by MoonPay → Sending USDC to Base → Credited），进行中那步有脉冲点和预计时长。如果还没付款就关了，第一步显示"Waiting for payment"，按钮是 Resume checkout / Cancel order。
6. **到账。** 庆祝款猞猁 + "+95.18 USDC" + "Credited to your Boost Account. Ready to trade."，按钮 Start trading 去首页。失败则是趴地猞猁 + "Payment didn't go through"，底下一张红框写人话原因（银行拒付 / 3DS 没过 / 身份验证没过），强调没扣钱。
7. **回到钱包。** 流水里这笔叫"Card purchase · Visa •• 4242"，带紫色 Card 小标；处理中的多一个 In progress 胶囊（蓝，和流水里 processing 同色），展开有"View order status"回到进度卡；失败的金额划掉，写"Failed · not charged"。

## 1. 入口与结构

| 端 | 入口 | 结构 |
|---|---|---|
| 手机 | `/deposit`（`src/pages/Deposit.tsx`） | 账户前屏不变 → "To: Boost Account" 面包屑 → Tabs（支持地区 3 列，否则 2 列）→ Card tab 内容 + sticky 底栏 CTA（在 BottomNav 之上）|
| 桌面 | `/wallet` Deposit 按钮 → `DepositDialog`（480 宽） | 同结构，CTA 内联在内容底部 |

tab 文案：**Card · Crypto · Cross-chain**（以前的 Address / Wallet 两个文案本来就串了，这轮一并改掉）。

## 2. 规则（逐条，编号即 CPO 2026-10-23 批准的方案条目）

**A 入口**
1. 三个 tab，顺序 Card / Crypto / Cross-chain，桌面弹窗与手机全屏同结构。
2. 支持卡支付的地区默认选中 Card；不支持的地区默认 Crypto。
3. 不支持的地区 **不渲染 Card tab**，tab 栏回到两列，页面与今天一样。判断用 MoonPay 的 IP 接口，页面打开时静默调一次，会话内缓存；接口失败按"支持"处理。

**B 第一屏**
4. 金额优先：大号金额输入 + 币种下拉；四个快捷档，默认预选第二档。
   4a. 默认币种 = 所在国本币（在我们支持的 18 种里）否则 USD；用户手动切过币种后本次会话不再按地区覆盖。
   4b. 快捷档按币种给整数档（USD 50/100/250/500，JPY 5,000/10,000/30,000/50,000 …），不做汇率换算的零碎数。
   4c. 区间提示用本币，取该币种的 min / max；越界才在输入框下内联红字，不弹 toast。
5. "You get ≈ X USDC" 实时报价，500ms 防抖；Fee details 默认折叠，展开三行 MoonPay fee / Network fee (Base) / Rate。
6. "Pay with" 是一个选择行，默认 Credit / Debit card；iOS 且设备支持时默认 Apple Pay。点开：手机 MobileDrawer、桌面 Popover；每个选项右侧显示该方式的到手 USDC 与手续费；不可用的置灰写原因；iOS 不列 Google Pay，Android 不列 Apple Pay。选完首屏按该方式重算报价，并把 paymentMethod 预填给 MoonPay。
7. 主 CTA 一个：**Buy {到手数} USDC**（信号绿 `.btn-trading-green`），手机 sticky 底栏。
8. CTA 下一行信任行：Powered by MoonPay · 160+ countries · Secure checkout。
9. 第一屏不出现 KYC 字样、不出现限额表。

**C 点击后**
10. 点 Buy → 后台登记订单并签名 → MoonPay 浮层（手机和桌面都是 overlay，不跳新标签页）。预填：金额、币种、Base 充值地址、邮箱、支付方式、`externalTransactionId = 我们的订单 id`、`theme: dark`。
11. 浮层关闭或 MoonPay 回调触发 → 订单跟踪态：订单头（付了多少 · 卡尾号 → 到手多少 · 入哪个账户）+ 四步进度 + Order ID；状态由 webhook 推进（前端每 4 秒轮询一次），不再 setTimeout 假跑。
12. completed → 成功态（庆祝款猞猁 `empty-celebrate` 130×130，+X USDC，Start trading / Done）；failed → 失败态（趴地款猞猁 `empty-no-boost` 150 宽，人话原因卡，Try again / Contact support）。

**D 钱包流水**
13. `fiat_buy` 行文案 "Card purchase · Visa •• 4242"，类型 badge **Card**（沿用类型 badge 的紫色轴，只把 "Fiat Buy" 改成 "Card"——绿色会和旁边 BOOST 账户胶囊撞色，设计师裁定），图标与链上充值同构（绿色入账箭头）。
14. 处理中（pending / processing）："In progress" 胶囊（primary 蓝，与 processing 同色轴） + 转圈；展开区 "View order status ›"（手机 → `/deposit?order=<流水 id>`，桌面 → DepositDialog 直接开在跟踪态）；桌面状态列文字 Sending to Base / Waiting for payment。
15. 失败：金额灰色划线、无正负号，胶囊 "Failed · not charged"，不计入余额。
16. Wallet 首页"最近流水"的描述兜底以前只认 deposit / withdraw（fiat_buy 会显示成 Withdraw），这轮改为按类型给人话。

**E 配套**
17. style-guide：Wallet 字典 Ⓓ 充值流新增 W-14a…h（手机 8 帧）+ W-14 桌面 5 帧；W-17 改为卡购三态；W-20 注记更新。
18. 演示账号 alex_carter 种三条 `fiat_buy` 流水（completed / processing / failed）。
19. Banxa 退役：删 `BuyWithFiat.tsx`、`public/brand-logos/banxa.png`；`wallet.deposit_fiat_banxa_*` 文案 key 留在 catalog 不再引用（平台 i18n 表回收时一起删）。

## 3. 文案与字段

| 位置 | 文案（逐字） |
|---|---|
| 金额标签 | `You pay` · 右侧 `$30 – $12,000`（按币种） |
| 越界 | `Minimum is $30 for card payments.` / `Maximum is $12,000 per purchase.` |
| 报价卡 | `You get` · `USDC on Base` · `≈ 95.18 USDC` · `Fee details ▾` · `Total $4.82` · 展开 `MoonPay fee` / `Network fee (Base)` / `Rate · 1 USDC = $1.00` |
| 报价中 | `Updating…`（费用行）· CTA `Getting quote…` |
| Pay with 行 | `Pay with` · `Credit / Debit card` + `Visa · Mastercard · Instant`；`Apple Pay · Instant`；`Google Pay · Instant · Android`；`Bank transfer · SEPA · 1–3 business days`；`PayPal · Not available in your region` |
| CTA | `Buy 95.18 USDC`；信任行 `Powered by MoonPay · 160+ countries · Secure checkout` |
| 跟踪四步 | `Payment received` / `Waiting for payment`（未付款时）· `Order confirmed by MoonPay` · `Sending USDC to Base` · `Credited to your account`；预计 `Finish checkout to continue` / `Usually under a minute` / `Usually 1–3 minutes` |
| 跟踪底注 | `You can close this page. We’ll notify you when it lands.` |
| 跟踪按钮 | `Resume checkout` / `Cancel order`（未付款）· `Back to deposit`（已付款） |
| 成功 | `Deposit complete` · `+95.18 USDC` · `Credited to your Boost Account. Ready to trade.` · `Start trading` / `Done` |
| 失败 | `Payment didn’t go through` · `Nothing was charged. You can try again with a different card.` · `Reason · …`（三类人话见 `lib/moonpay.failureCopy`）· `Try again` / `Contact support`；取消：`Order cancelled` |
| 流水 | `Card purchase · Visa •• 4242` · badge `Card` · 胶囊 `In progress` / `Failed · not charged` · 展开 `View order status ›` · 桌面状态 `Sending to Base` / `Waiting for payment` |

数据表 `fiat_orders`（新，迁移 `20261023120000_fiat_orders.sql`）：

| 字段 | 含义 |
|---|---|
| `id` | 我们的订单号 = 传给 MoonPay 的 `externalTransactionId` |
| `status` | `waiting_payment → pending → sending → completed \| failed` |
| `fiat_code / fiat_amount` | 用户付的币种和金额 |
| `quote_amount / total_fee` | 报价时的到手 USDC 与总费用；webhook 回来用成交值覆盖 |
| `payment_method` | MoonPay 的方法码（`credit_debit_card` …） |
| `card_brand / card_last4` | webhook 回填 |
| `failure_reason` | MoonPay 的失败码（前端翻成人话，不直接显示）；用户取消 = `cancelled` |
| `account` | `spot` / `futures`（记入哪个账户）|
| `wallet_address` | 预填给 MoonPay 的 Base 收币地址 |
| `transaction_id` | 关联 `transactions` 账本行（`type = fiat_buy`）|
| `paid_at / confirmed_at / completed_at` | 四步时间戳 |

账本行（`transactions`）状态映射：`waiting_payment → pending`，`pending / sending → processing`，`completed → completed`，`failed → failed`。

## 4. Lovable / 正式版边界

| 项 | Lovable（现在能点通） | 正式版要做的 |
|---|---|---|
| MoonPay 账号 | 无 key → **演示引擎**：地区按浏览器语言猜、报价本地算（4.5% 最低 $4.50 + $0.32 网络费）、浮层是一个写明 Demo 的替身，点"Pay now (demo)"走 pending → sending → completed 定时器，"Simulate a declined card"走 failed | Dashboard 注册 → Account Review → KYB → Enabled assets 勾 USDC (Base) → 设 ecosystem fee（建议 0）→ 激活 On-ramp；前端 env `VITE_MOONPAY_API_KEY=pk_live_…`（沙盒 `pk_test_…` 可先开发）|
| 订单登记与签名 | 浏览器直接插 `fiat_orders` + 账本行（RLS 允许本人插/改） | 部署 `supabase/functions/moonpay-sign-url`（secrets：`MOONPAY_SECRET_KEY`）；它用 service role 建订单，再对 SDK 生成的 URL 做 HMAC 签名，并返回 IP-matching 哈希（上生产必需）。部署后删掉 `useFiatOrders.ts` 里标 `DEMO_ENGINE` 的分支和迁移里给 `transactions` 的本人 UPDATE 策略 |
| 状态推进 | 定时器 | 部署 `supabase/functions/moonpay-webhook`（secrets：`MOONPAY_WEBHOOK_KEY`；`config.toml` 里 `verify_jwt = false`），在 MoonPay Dashboard 订阅 `transaction_created / updated / failed`；幂等、不回退 |
| 余额入账 | completed 时前端 `addBalance / addSpotBalance` | webhook 里有一段"completed 时加余额"——如果正式版靠链上充值检测入账，**删掉那段**避免重复记账 |
| USDC 币种码 | 写死 `usdc_base` | 以 Dashboard 里的 code 为准，改 `lib/moonpay.USDC_BASE_CODE` |
| 地区判断 | 浏览器语言 | `GET /v4/ip_address?apiKey=`（publishable key，前端直调）|
| 报价 | 本地算 | `GET /v3/currencies/usdc_base/buy_quote`（publishable key，前端直调）|
| 支付方式可用性 | `lib/moonpay.paymentMethodsFor` 按国家/币种/设备的静态表 | 同上表；MoonPay 浮层内会再按真实情况过滤 |
| 法币 min / max | `FIAT_CURRENCIES` 静态表 | `GET /v3/currencies` 的 `minBuyAmount / maxBuyAmount` |
| 品牌标 | 单色白标已接：`public/brand-logos/{visa,mastercard,apple-pay,google-pay,paypal,pix}.svg`（simple-icons CC0 集的官方 mark）+ `moonpay-wordmark.svg`（moonpay.com 官方字标），`BrandMark` 组件用 CSS mask 填 currentColor；银行转账保留 lucide Landmark | 同左（品牌标不入素材台账，按台账"纯功能图标不入账"规则） |
| 多语言 | tab 三个 key 已进 en.json；其余 Card tab 文案本轮英文硬编码 | 平台 i18n 表（`OMENX-i18n.xlsx`）补齐后再提 key |

MoonPay 文档坐标：Web SDK `dev.moonpay.com/widget/on-ramp/integration-methods/sdks/web`；URL 签名 `…/docs/ramps-sdk-url-signing`；IP matching `…/widget/on-ramp/customization/ip-matching`；买入参数 `…/docs/ramps-sdk-buy-params`；webhook `…/api-reference/widget/webhooks/overview`；上线流程 `support.moonpay.com/customers/docs/how-to-go-live-with-moonpay`。

## 5. 演示数据

alex_carter（user_id 见 `seed-demo-alex`）三条 `fiat_buy`：

| 状态 | 描述 | 金额 | 账户 |
|---|---|---|---|
| processing | Card purchase · Visa •• 4242 | +95.18 | Boost |
| completed | Card purchase · Mastercard •• 8810 | +237.90 | Boost |
| failed | Card purchase · Visa •• 4242 | 50.00（划线） | Boost |

对应 `fiat_orders` 三行（sending / completed / failed），processing 那条展开 "View order status" 能开到跟踪态。

## 6. 文件

| 文件 | 作用 |
|---|---|
| `src/components/deposit/BuyWithCard.tsx` | Card tab 全部状态 + `useCardRegion` + 演示浮层 |
| `src/components/deposit/PayWithPicker.tsx` | Pay with 选择行 + Drawer / Popover |
| `src/hooks/useFiatOrders.ts` | 建单、轮询、取消；`DEMO_ENGINE` 分支 |
| `src/lib/moonpay.ts` | 地区 / 币种表 / 支付方式表 / 报价 / SDK 加载 / 失败文案 |
| `src/pages/Deposit.tsx` · `src/components/deposit/DepositDialog.tsx` | 三 tab 与默认逻辑、`?order=` / `cardOrderTransactionId` 深链 |
| `src/components/wallet/TransactionHistory.tsx` · `src/pages/Wallet.tsx` | 卡购行三态、View order status、首页描述兜底 |
| `supabase/migrations/20261023120000_fiat_orders.sql` | 订单表 |
| `supabase/functions/moonpay-sign-url` · `moonpay-webhook` | 正式版后端（见 §4）|
| `src/pages/StyleGuide/…/walletLitePreviews.tsx` · `WalletStatesSection.tsx` · `registry.tsx` | 字典 W-14a…h / W-14 / W-17 |

## 附：内部代号对照

| 代号 | 指什么 |
|---|---|
| W-14 / W-14a…h | style-guide Wallet 字典里 Card tab 的样张编号 |
| W-17 / W-20 | 流水行样张编号 |
| DEMO_ENGINE | 代码里标注的、正式版要删的演示分支 |
| 规则 1–19 | 本文 §2 的条目，与 CPO 2026-10-23 批准的方案清单一一对应 |
