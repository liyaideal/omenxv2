# Affiliate Program 页面（/affiliate）— 交付说明 v1

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
| 站内入口 | `SeoFooter` → Resources 列 → `Affiliate Program`（紧随 Developers） |
| 页内锚点 | `#benefits` `#earnings` `#how-it-works` `#markets` `#partners` `#faq` `#apply`；hero 下方一行 pill 跳转链（01–06） |
| 外链 | 申请表（Lark）`https://ljp9k446231p.jp.larksuite.com/wiki/RQgiw4cQqi4KXKkb4MQjWCncp4g`，所有 Apply 按钮同一目标，新标签打开；`mailto:affiliates@omenx.com`；Insights `https://www.omenx.com/insights` |

## 3. 页面结构（自上而下）

| # | 区块 | 内容要点 | 组件 |
|---|---|---|---|
| Hero | 标题 + 主 CTA + 插画位 | eyebrow `OmenX Affiliate Program`；h1 三行（第三行 `Build with OmenX.` 用 primary 色）；CTA `Become an affiliate` / 文字链 `Explore the program ↓`；注 `For creators, key opinion leaders and trading networks.`；右侧插画位（见 §5） | `AffiliateHeroArt` |
| 数据横幅 | 平台快照 | `$2.7B Total trading volume` / `17.6K Unique traders` / `730+ Active markets`；右侧 `Platform snapshot. Latest insights ↗` | 页内 |
| 跳转链 | 页内导航 | `01 Benefits · 02 How you earn · 03 Get started · 04 Markets · 05 Partnerships · 06 FAQ` | 页内 |
| 01 Benefits | 六条权益 | 2×3 共享边框格；每格 编号 / 标题 / 一句说明 | 页内 |
| 02 Earnings | 两个陈列框 | **02.1** `How you earn with OmenX` 三栏账本 + 合计 `$40,000`；**02.2** `The fee base makes a difference.` 6.6× 对比表；各带免责脚注；节尾 `Build a partnership around your community. Apply now ↗` | `EarningsLedger` / `FeeBaseComparison` |
| 03 How it works | 三步 | `01 Tell us about your audience` / `02 Build your partnership` / `03 Launch and keep growing`；标题下 `Apply to join` 描边按钮 | 页内 |
| 04 Markets | 三类市场 | Live sports（UCL/NBA/NFL/UFC）· Intraday crypto（BTC/ETH/SOL/PONS）· Daily finance（NVDA/HOOD/SanDisk/MSTR）；底部注 `More flexibility for active traders. Cross margin and position management before settlement.` + chip `Up to 5x leverage on eligible markets` | 页内 |
| 05 Partnerships | 团队背书 + 两张案例 | `Built by trading veterans with experience at` Binance（字标）/ Bybit / OKX / Coinbase；案例 `Crypto Banter × Football Legends`、`Part of the Base ecosystem`；`Built on [Base] One of its actively supported projects.` | 页内 |
| 06 FAQ | 五问 | shadcn `Accordion` single/collapsible，默认展开首条；左侧 `Questions? Our team is here to help. affiliates@omenx.com` | 页内 |
| Apply | 结尾 CTA | `Your community. / Our next chapter.` + `Apply now` + `Prefer to get in touch directly? affiliates@omenx.com` | 页内 |
| 免责 | 一行小字 | `Affiliate approval, eligibility and program terms apply. Leverage is available on eligible markets and amplifies gains and losses. Trading involves risk.` | 页内 |
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

- 骨架：DESIGN.md §19.1（max-w-7xl 轨线、发丝线、幽灵编号、Space Grotesk display）。
- 尺度：DESIGN.md **§19.4 尺度 L**（本轮新增）——单一底色不做交替带；h1 64px、h2 40px、正文 15–16px；数字为主角；陈列框三段式；pill 跳转链；72px logo tile。
- 色：只用 `--primary`（Pulse Blue：eyebrow、CTA、标题强调行）与 `--accent`（Volt：账本结果值、6.6×、benefit 编号）；不触碰 Yes/No 与盈亏轴。
- 移动：单列；数据横幅三列；账本 `stacked`；市场 logo 行横滑；sticky `Apply now` 在 hero 滚出后浮出（`IntersectionObserver`）。

## 5. 资产

| 资产 | 路径 | 状态 |
|---|---|---|
| 12 个市场 logo + 4 个交易所 logo + 2 张合作照片 | `src/assets/affiliate/*.webp`（从原页面原文件提取，未改动） | 已入仓 |
| Base logo | `public/chain-logos/base.svg`（既有） | 复用 |
| Hero 插画（桌面 560×560 / 移动 343×200，透明底） | `public/assets/desktop/affiliate-hero-lynx.png` / `public/assets/mobile/affiliate-hero-lynx.png` | **待 CPO 提供**；缺失时生产不渲染该位、开发显示占位框（`AffiliateHeroArt`） |

## 6. 没动什么

- 未新增任何后端表 / 函数 / 迁移；页面不读库。
- 未改 `EventsDesktopHeader` / `MobileHeader` / `SeoFooter` 的结构，只在 footer 数据里加一条链接。
- `/developers` 保持 §19 尺度 S，未改。
- 原页面的自建顶栏与页脚**不搬**（由全站 header / SeoFooter 替代）；原页脚免责句保留为页面底部一行。

## 7. 已知缺口

1. Hero 插画待资产落仓（见 §5）。
2. 页面 `<title>` / meta description 沿用全站默认，未单独配置 SEO 元信息（原页 title 为 `OmenX Affiliate Program | Built for your community`），如需请在 `SeoPageLayout` 体系下补。

## 附：内部代号对照

| 代号 | 含义 |
|---|---|
| AF-1…AF-5 | `/style-guide#lite-affiliate` 五个 case（整页 / 账本 / 对比表 / FAQ 两态 / 插画位） |
| 尺度 L / S | DESIGN.md §19.4 营销页两档密度 |
