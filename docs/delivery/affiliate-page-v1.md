# Affiliate Program 页面（/affiliate）— 交付说明 v1

> **2026-09-18 修订**：页面视觉按设计稿（Figma Omenx_Affiliate）整体重绘，文案、数字、路由、外链、功能全部不变。本文 §2–§5、§7 已按新视觉更新；研发以生产页与 `/style-guide#lite-affiliate` 为准照做。

> 本文档覆盖 `/affiliate` 新页面的全部改动：一个新路由、六个营销区块、两个数据陈列件、SeoFooter 一条新链接、DESIGN.md §19.4 新增尺度 L。**页面所有文案与数字来自已批准的 Affiliate Program 页面，逐字冻结，研发不得改写。**

## §0 读者须知

| 查什么 | 去哪 |
|---|---|
| 页面长什么样 | 生产页 `omenxv2.lovable.app/affiliate`（桌面）与 375 宽度（移动） |
| 各区块有哪些状态 | `/style-guide#lite-affiliate`（AF-1…AF-5） |
| 文案、数字、链接 | `src/components/affiliate/affiliateContent.ts`（唯一来源）+ 本文档 §3 |
| 视觉规则 | `DESIGN.md` §19（骨架）与 §19.4（营销页尺度 L，本轮新增） |

本页无 Lite 交易术语对照需求（受众为合作方，见 §19.4 第 9 条豁免）。

## 1. 功能目标

给 KOL / 社区主 / 交易网络一个申请成为 OmenX 联盟伙伴的落地页：说明权益、展示收益示例、申请路径、可交易的市场类别、团队与合作背书、FAQ、申请入口。**纯静态展示页，无登录态、无后端调用。**

## 2. 路由与入口

| 项 | 值 |
|---|---|
| 路由 | `/affiliate`（Lite 公开页，未登录可达） |
| 桌面组件 | `src/pages/AffiliatePage.tsx`（`EventsDesktopHeader` + 内容 + `SeoFooter`） |
| 移动组件 | `src/pages/AffiliatePageMobile.tsx`（`useIsMobile()` <768 时由桌面组件返回；`MobileHeader title="Affiliate Program" showBack`） |
| 站内入口 | 桌面顶栏主导航第三项 `Affiliate`（2026-09-19 起顶掉 Leaderboard；Leaderboard 保留在 footer Platform 列与移动端个人菜单）；`SeoFooter` → Resources 列 → `Affiliate Program`（紧随 Developers）；移动端顶栏入口待定 |
| 页内锚点 | `#benefits` `#earnings` `#how-it-works` `#markets` `#partners` `#faq` `#apply`；桌面：左侧固定竖排点导航（`AffiliateDotNav`，01–06，≥1400px 视口显示，滚动联动高亮当前节）；移动：数据横幅下方一行 pill 跳转链（01–06） |
| 外链 | 申请表（Lark Base form）`https://ljp9k446231p.jp.larksuite.com/share/base/form/shrjpJXdxwMmRq3Y7IftqBNek2g`，所有 Apply 按钮同一目标，新标签打开（仅已登录非 affiliate 时是真链接，见 §5A）；`mailto:affiliates@omenx.com`；Insights `https://www.omenx.com/insights` |

## 3. 页面结构（自上而下）

| # | 区块 | 内容要点 | 组件 |
|---|---|---|---|
| Hero | 标题 + 主 CTA + 视觉位 | eyebrow `OmenX Affiliate Program`；h1 三行 72px（第三行 `Build with` + OMENX 字标，primary 色；字标是站内 logo SVG 用 CSS mask 着色）；实心 primary CTA `Become an affiliate →`（带光晕）/ 文字链 `Explore the program ↓`；注 `For creators, key opinion leaders and trading networks.`；右侧 X 视觉位（桌面 661×496，移动 342×257，见 §5） | `AffiliateArt` |
| 数据横幅 | 平台快照（暗带 `#05070E`） | 左 `A growing platform. / A new opportunity for your community.`（`new opportunity` primary 色）；右 `Latest insights`（灰）+ `Platform snapshot. ↗`（链到 Insights）；下方三指标 60px `$2.7B` / `17.6K` / `730+`，标签两行大写 | 页内 |
| 跳转链 | 页内导航 | `01 Benefits · 02 How you earn · 03 Get started · 04 Markets · 05 Partnerships · 06 FAQ`；桌面为固定点导航，移动为 pill 条 | `AffiliateDotNav` / 页内 |
| 01 Benefits | 六条权益 | 3×2 渐变卡（r14）；每卡 左上编号 / 右上 44px 图标格（lucide：CircleDollarSign · Users · Network · Megaphone · Zap · Handshake）/ 标题 / 一句说明 | 页内 |
| 02 Earnings | 两个陈列 | **02.1** 带插画的标题块（`02.1` / `How you earn with OmenX` / 一句说明 / `ILLUSTRATIVE · MONTHLY`）+ 三张账本卡 + volt 合计条 `$40,000` + 免责脚注；**02.2** 带插画的标题块 + 对比卡（`6.6×` 112px + 四列表，OmenX 行高亮）+ 免责脚注；节尾全幅插画带 `Build a partnership around your community.` + `Apply now →` | `EarningsLedger` / `FeeBaseComparison` / `AffiliateArt` |
| 03 How it works | 三步 | 标题下实心 `Apply to join →` 按钮；三张卡 `01 Tell us about your audience` / `02 Build your partnership` / `03 Launch and keep growing` | 页内 |
| 04 Markets | 三类市场 | 三张全宽横卡，图文左右交替（图-文 / 文-图 / 图-文），每张一幅 lynx 插画：Live sports（UCL/NBA/NFL/UFC）· Intraday crypto（BTC/ETH/SOL/PONS）· Daily finance（NVDA/HOOD/SanDisk/MSTR），logo 走 72px tile；底部注 `More flexibility for active traders. Cross margin and position management before settlement.` + volt 描边 chip `Up to 5x leverage on eligible markets`；节尾全幅带 `Built by trading veterans with experience at` + Binance（字标）/ Bybit / OKX / Coinbase | 页内 / `AffiliateArt` |
| 05 Partnerships | 两张案例卡 + Base 行 | 图上文下卡：`Crypto Banter × Football Legends`、`Part of the Base ecosystem`（eyebrow 用 volt）；节尾全幅带 `Built on [Base] One of its actively supported projects.` | 页内 |
| 06 FAQ | 五问 | shadcn `Accordion` single/collapsible，默认展开首条；左侧 `Questions? Our team is here to help. affiliates@omenx.com` | 页内 |
| Apply | 结尾 CTA（暗带 + 径向光 + 两侧照片马赛克） | 居中：`Your community. / Our next chapter.` 72px + `Apply now →` + `Prefer to get in touch directly? affiliates@omenx.com` + 免责小字 `Affiliate approval, eligibility and program terms apply. Leverage is available on eligible markets and amplifies gains and losses. Trading involves risk.`（免责并入本区，不再单独成行） | 页内 / `AffiliateArt` |
| Footer | 全站 | `SeoFooter` | 共享件 |

### 3.1 收益账本数字（02.1，冻结）

| 栏 | 行 | 值 |
|---|---|---|
| You · Self-rebate | Eligible trading volume | $10,000,000 |
| | Trading fees at 0.4% | $40,000 |
| | Self-rebate assumed | 20% |
| | $40,000 × 20% | $8,000 |
| | **Your self-rebate** | **$8,000** |
| Your invitees · Trading-fee commission | Opening trade volume | $10,000,000 |
| | Active-close volume | $5,000,000 |
| | Total eligible volume | $15,000,000 |
| | Trading fees at 0.4% | $60,000 |
| | $60,000 × 50% assumed commission | $30,000 |
| | **Your invitee commissions** | **$30,000** |
| Affiliates you refer · Affiliate referral reward | Their invitees' volume | $10,000,000 |
| | Trading fees at 0.4% | $40,000 |
| | Their commission at 50% | $20,000 |
| | Your reward assumed | 10% |
| | $20,000 × 10% | $2,000 |
| | **Your affiliate referral reward** | **$2,000** |
| 合计 | **Total rewards & rebates** | **$40,000**（$32,000 commissions + $8,000 self-rebate） |

### 3.2 费率对比（02.2，冻结）

| | Trading volume | Trading fee | Commission rate | Your commission |
|---|---|---|---|---|
| CEX benchmark | $10M | 0.06% | 50% | $3,000 |
| OmenX | $10M | 0.40% | 50% | $20,000 |

头条 `Over 6.6× More Commission`；注 `Same volume. Same assumed commission rate.`；免责脚注含 `$20,000 ÷ $3,000 = approximately 6.67`。

## 4. 视觉规则（研发照做即可，不用自己判断）

- 视觉以设计稿为准：Figma Omenx_Affiliate（`p3V2cA7MbmECbwKwhXtur4`，桌面 `42:11744` / 移动 `46:12621`），生产页即 1:1 落地；规则汇总在 DESIGN.md **§19.4 v2（2026-09-18 附录）**。
- 骨架：Lite 标准容器 `max-w-7xl px-4 lg:px-6`（1232 内容宽）；编号并入 eyebrow（`01 · WHY PARTNER WITH US`）；h2 56px Space Grotesk Medium、CSS `capitalize`；不再有幽灵编号、容器竖线与节内发丝线。
- 底色：页面 `bg-background`；两处暗带（数据横幅 `#05070E`、结尾 CTA `#05070E`）；对象卡 `bg-card`（账本卡、步骤卡、对比卡、logo tile）。
- 色：只用 `--primary`（Pulse Blue：eyebrow、CTA、标题强调行）与 `--accent`（Volt：账本结果值、6.6×、benefit 编号）；不触碰 Yes/No 与盈亏轴。
- 移动：24px 边距；数据横幅三行；账本 / 对比表 `stacked`；市场卡图上文下；sticky `Apply now` 在 hero 滚出后浮出（`IntersectionObserver`）；顶栏沿用 `MobileHeader` 内页形态。

## 5. 资产

| 资产 | 路径 | 状态 |
|---|---|---|
| 12 个市场 logo + 4 个交易所 logo + 2 张合作照片 | `src/assets/affiliate/*.webp`（从原页面原文件提取，未改动） | 已入仓 |
| Base logo | `public/chain-logos/base.svg`（既有） | 复用 |
| 插画 18 幅（hero X 视觉 ×2、收益标题块 ×4、Apply 带 ×2、市场卡 ×6、CTA 马赛克 ×4） | `src/assets/affiliate/<name>.png`，文件名与尺寸清单见 `src/components/affiliate/AffiliateArt.tsx` 头注释 | **待 CPO 从 Figma 导出**（2x、扁平化含叠加渐变、隐藏文字层）；`AffiliateArt` 按文件名解析，缺失时生产不渲染该位、开发显示虚线规格框 |

## 5A. 交互逻辑（Apply 按钮三态）

页面上五处 Apply（hero `Become an affiliate`、02 节尾文字链 `Apply now`、03 `Apply to join`、结尾 CTA `Apply now`、移动端 sticky `Apply now`）**共用同一套行为**（`useAffiliateCta`），其余链接（锚点、Insights、邮件）对所有人一样，不设门。页面内容对游客完全可见。

| 可见项 | 判定 | 数据来源 | 行为 |
|---|---|---|---|
| 未登录 | `!user` | Supabase auth session | 按钮文案不变；点击打开站内登录门（桌面 `AuthDialog` / 移动 `AuthSheet`）。登录后留在本页，按钮按新状态重算文案；**不自动续做动作** |
| 已登录 · 非 affiliate | `user && !profile.is_affiliate` | `profiles.is_affiliate`（默认 false） | 按钮是真链接 `<a target=_blank>` 指向申请表（§2 外链）；文案不变 |
| 已登录 · affiliate | `profile.is_affiliate === true` | 同上 | 五处文案统一改为 `Open affiliate portal`；**真平台：点击直接跳转已开发好的 Affiliate Portal（`/affiliate/portal`）**。蓝图里没有 portal，所以点击弹一个**给研发看的占位说明框**（带 `Blueprint only · dev note` 徽标，中英双语写明"直接跳 portal、不要实现这个弹窗"）——该弹窗不是产品界面，不实现 |
| 已登录 · profile 未返回 | `user && isLoading && !profile` | — | 保持 Apply 文案，点击等待，避免文案闪两次 |

真平台对应：`profiles.is_affiliate` 只是蓝图的标记位，真平台读你们 affiliate 服务的会员状态；`affiliate_since` 仅演示。演示账号：alex_carter 是 affiliate，mia_reyes 不是。

## 6. 没动什么

- 未新增任何后端表 / 函数 / 迁移；页面不读库。
- 未改 `EventsDesktopHeader` / `MobileHeader` / `SeoFooter` 的结构，只在 footer 数据里加一条链接。
- `/developers` 保持 §19 尺度 S，未改。
- 原页面的自建顶栏与页脚**不搬**（由全站 header / SeoFooter 替代）；原页脚免责句保留为页面底部一行。

## 7. 已知缺口

1. ~~插画待资产落仓~~ 2026-09-19 已全部入仓（hero 为视频循环）；CTA 马赛克含真人照片，CPO 已确认素材有权使用。
3. affiliate 用户登录后，站内账户菜单应有「Affiliate portal」入口——不在本页范围，真平台补。
4. 结尾免责「program terms apply」无 Affiliate Terms 可链；真平台需挂条款页。
5. 三种 Apply 点击（登录门 / 申请表 / portal 说明）零埋点，等产品定。
2. 页面 `<title>` / meta description 沿用全站默认，未单独配置 SEO 元信息（原页 title 为 `OmenX Affiliate Program | Built for your community`），如需请在 `SeoPageLayout` 体系下补。

## 附：内部代号对照

| 代号 | 含义 |
|---|---|
| AF-1…AF-5 | `/style-guide#lite-affiliate` 五个 case（整页 / 账本 / 对比表 / FAQ 两态 / 插画位） |
| 尺度 L / S | DESIGN.md §19.4 营销页两档密度 |
