# Affiliate Program 页面（/affiliate）— 交付说明 v2

> 讲什么：`/affiliate` 是面向 KOL、社区主和交易网络的联盟计划落地页，本文说明它的入口、结构、文案数据来源、Apply 按钮的三种状态和所有素材。
> 给谁看：真平台前端与测试；后端只需要看 §6 的一个字段。
> 怎么读：先照 §0 的顺序找答案，本文只写生产页和字典里看不到的东西。

## §0 读者须知

| 查什么 | 去哪 |
|---|---|
| 页面长什么样 | 生产页 `omenxv2.lovable.app/affiliate`（桌面）与 375 宽度（移动） |
| 各区块有哪些状态 | `/style-guide` → Lite → Affiliate Program（AF-1…AF-7，每一态都是生产组件挂固定数据渲染，不是截图） |
| 文案、数字、链接 | `src/components/affiliate/affiliateContent.ts`（唯一来源，逐字冻结）+ 本文 §4 |
| 状态文案与概念定义 | `docs/copy-dictionary.md` 的「Affiliate Program」节 |
| 视觉规则 | `DESIGN.md` 文末 `§Addendum 2026-09-14`（营销页尺度 L）与 `§Addendum 2026-09-18`（§19.4 v2，按设计稿修订） |
| 后端边界 | `docs/backend-boundary.md` 的 `profiles` 行 |

Lite 术语对照表在 `docs/copy-dictionary.md` 顶部；本页受众是合作方而非 Lite 交易者，页面文案里的 Leverage / Cross margin 等词是**有意保留**的（DESIGN §19.4 第 9 条），不要改写。

## 1. 功能目标

给合作方一个申请加入 OmenX Affiliate Program 的落地页：权益、收益示例、申请步骤、可交易的市场类别、团队与合作背书、FAQ、申请入口。页面内容对所有人可见；只有 Apply 按钮随登录态和联盟身份变化（§5）。

## 2. 入口与路由

| 项 | 值 |
|---|---|
| 路由 | `/affiliate`（Lite 公开页，未登录可达） |
| 桌面组件 | `src/pages/AffiliatePage.tsx`（`EventsDesktopHeader` + 内容 + `SeoFooter`） |
| 移动组件 | `src/pages/AffiliatePageMobile.tsx`（视口 <768 时由桌面组件切换；顶栏 `MobileHeader` 内页形态：返回 + 标题 `Affiliate Program`） |
| 桌面入口 | 顶栏主导航第三项 `Affiliate`（Events · Portfolio · Affiliate · Insights）；footer Resources 列 `Affiliate Program` |
| 移动入口 | 底栏 Me → 个人菜单 → `Affiliate Program`（Rewards 之后，握手图标，仅登录用户可见）；footer Resources 列 `Affiliate Program` |
| Leaderboard | 不在顶栏；从 footer Platform 列和移动个人菜单进 |
| 页内锚点 | `#benefits` `#earnings` `#how-it-works` `#markets` `#partners` `#faq` `#apply` |
| 页内导航 | 桌面：左侧固定竖排点导航（01–06，视口 ≥1400px 才显示，滚动时高亮当前节，点击跳转）；移动：数据横幅下方一行 pill 跳转链（01–06） |
| 外链 | 申请表（Lark 表单）`https://ljp9k446231p.jp.larksuite.com/share/base/form/shrjpJXdxwMmRq3Y7IftqBNek2g`，新标签打开；`mailto:affiliates@omenx.com`；Insights `https://www.omenx.com/insights` |

## 3. 页面结构（自上而下）

| # | 区块 | 内容要点 |
|---|---|---|
| Hero | 标题 + 主 CTA + X 视觉 | eyebrow `OmenX Affiliate Program`；h1 三行（第三行 `Build with` + OMENX 字标，主色）；实心主色按钮 `Become an affiliate →`；文字链 `Explore the program ↓`（锚到 #earnings）；注 `For creators, key opinion leaders and trading networks.`；右侧 X 液态金属视频循环（§7） |
| 数据横幅 | 平台快照（暗带） | `A growing platform. / A new opportunity for your community.`；右上 `Latest insights` + `Platform snapshot. ↗`（链到 Insights）；三指标 `$2.7B Total trading volume` / `17.6K Unique traders` / `730+ Active markets` |
| 01 Benefits | 六张权益卡 | 编号 + 图标（lucide：CircleDollarSign · Users · Network · Megaphone · Zap · Handshake）+ 标题 + 一句说明 |
| 02 Earnings | 两个陈列 | **02.1** 带插画的标题块 `How you earn with OmenX` + 三张账本卡 + 合计条 `$40,000` + 免责脚注；**02.2** 带插画的标题块 `The fee base makes a difference.` + 对比卡（`6.6×` + 四列表，OmenX 行高亮）+ 免责脚注；节尾全幅插画带 `Build a partnership around your community.` + `Apply now →` |
| 03 How it works | 三步 | 标题下按钮 `Apply to join →`；三张卡 `01 Tell us about your audience` / `02 Build your partnership` / `03 Launch and keep growing` |
| 04 Markets | 三张横卡 | 图文左右交替，每张一幅插画：Live sports（UCL/NBA/NFL/UFC）· Intraday crypto（BTC/ETH/SOL/PONS）· Daily finance（NVDA/HOOD/SanDisk/MSTR）；底部注 `More flexibility for active traders. …` + 描边 chip `Up to 5x leverage on eligible markets`；节尾全幅行 `Built by trading veterans with experience at` + Binance / Bybit / OKX / Coinbase |
| 05 Partnerships | 两张案例卡 + Base 行 | `Crypto Banter × Football Legends`、`Part of the Base ecosystem`；节尾全幅行 `Built on [Base] One of its actively supported projects.` |
| 06 FAQ | 五问 | 手风琴，单开、可全收，默认展开首条；左侧 `Questions? Our team is here to help. affiliates@omenx.com` |
| Apply | 结尾 CTA（暗带 + 径向光 + 两侧照片马赛克） | 居中 `Your community. / Our next chapter.` + `Apply now →` + `Prefer to get in touch directly? affiliates@omenx.com` + 免责小字 `Affiliate approval, eligibility and program terms apply. Leverage is available on eligible markets and amplifies gains and losses. Trading involves risk.` |
| Footer | 全站 `SeoFooter` | — |
| 移动端附加 | sticky `Apply now` | hero 自带的按钮滚出视口后才浮出（IntersectionObserver），行为同 §5 |

## 4. 冻结数字

### 4.1 收益账本（02.1）

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

### 4.2 费率对比（02.2）

| | Trading volume | Trading fee | Commission rate | Your commission |
|---|---|---|---|---|
| CEX benchmark | $10M | 0.06% | 50% | $3,000 |
| OmenX | $10M | 0.40% | 50% | $20,000 |

头条 `Over 6.6× More Commission`；注 `Same volume. Same assumed commission rate.`；免责脚注含 `$20,000 ÷ $3,000 = approximately 6.67`。

## 5. Apply 按钮的三种状态

页面上五处 Apply（hero `Become an affiliate`、02 节尾文字链 `Apply now`、03 `Apply to join`、结尾 CTA `Apply now`、移动 sticky `Apply now`）**行为完全相同**（`useAffiliateCta`）。其余链接（锚点、Insights、邮件）对所有人一样，不设门。

| 可见项 | 判定 | 数据来源 | 行为 |
|---|---|---|---|
| 未登录 | `!user` | 登录会话 | 按钮文案不变；点击打开站内登录门（桌面 `AuthDialog` / 移动 `AuthSheet`）。登录后留在本页，按钮按新状态重算文案；**不自动续做动作** |
| 已登录 · 非 affiliate | `user && !profile.is_affiliate` | `profiles.is_affiliate`（默认 false） | 按钮是真链接 `<a target=_blank>`，指向 §2 的申请表；文案不变 |
| 已登录 · affiliate | `profile.is_affiliate === true` | 同上 | 五处文案统一改为 `Open affiliate portal`；**真平台：点击直接跳转已开发好的 Affiliate Portal（`/affiliate/portal`）**。蓝图里没有 portal，所以蓝图上点击弹一个带 `Blueprint only · dev note` 徽标的占位说明框（中英双语写明"直接跳 portal，不要实现这个弹窗"）——**该弹窗不是产品界面，不要实现** |
| 已登录 · 会员信息未返回 | `user && isLoading && !profile` | — | 保持 Apply 文案，点击等待，避免文案闪两次 |

字典 AF-7a–d 四帧对应上面四态（帧内按钮可真点）。演示账号：alex_carter 是 affiliate，mia_reyes 不是。

## 6. 后端边界

| 项 | 蓝图实现 | 真平台 |
|---|---|---|
| "是不是 affiliate" | `profiles.is_affiliate boolean default false` + `affiliate_since timestamptz`（迁移 `supabase/migrations/20260919060000_affiliate_profile_flag.sql`） | 读你们 affiliate 服务的会员状态，字段放哪自选；`affiliate_since` 仅演示 |
| 申请 | 无后端，跳外部表单 | 同左 |
| 页面其余内容 | 纯静态，不读库 | 同左 |

## 7. 素材（全部已入仓 `src/assets/affiliate/`）

| 文件 | 尺寸 | 用在哪 |
|---|---|---|
| `hero-x-loop.webm`（VP9 + alpha）/ `hero-x-loop.mp4`（H.264，深蓝底） | 858×638，9.8s 循环 | Hero X 视觉：`<video>` 先 webm 后 mp4，静音 / 自动 / 循环 / inline，`mix-blend-mode: screen`（透明 webm 下无影响；只能播 mp4 的浏览器靠 screen 把深蓝底融进页面底色）；桌面 661×496、移动 342×257 |
| `earn-1-desktop.webp` / `earn-1-mobile.webp` | 2448×372 / 684×408 | 02.1 标题块底图（桌面 1224×186 / 移动 342×204） |
| `earn-2-desktop.webp` / `earn-2-mobile.webp` | 2448×372 / 684×408 | 02.2 标题块底图 |
| `earn-band-desktop.webp` / `earn-band-mobile.webp` | 2880×518 / 732×366 | `Build a partnership` 插画带（桌面 1440×260 / 移动 342×193） |
| `market-sports.webp` / `market-crypto.webp` / `market-finance.webp` | 1232×752 | 04 三张横卡，双端共用，`object-cover` 裁切 |
| `cta-mosaic.webp` | 2881×973 | 结尾 CTA 两侧照片马赛克，整条一张，贴区块底边（桌面 1440×486 / 移动 131 高） |
| 12 个市场 logo、4 个交易所 logo、2 张合作照片 | `*.webp` | 04 / 05 |
| Base logo | `public/chain-logos/base.svg` | 05 |

叠加渐变都已烘进图片的 alpha，代码里不再画渐变。图片一律装饰件（`aria-hidden`、不可点选），层级在文字与按钮之下。素材台账在 `/style-guide` → Foundations → Brand assets · IP 插画 → Ⓗ 组。

## 8. 不在本特性范围内

- `/developers` 页保持原有营销页尺度 S。
- `EventsDesktopHeader` / `MobileHeader` / `SeoFooter` / 底栏个人菜单只改了导航条目（§2），结构未动。
- Leaderboard 页面本身未改，只是退出顶栏。

## 9. 已知缺口

1. 结尾免责「program terms apply」没有 Affiliate Terms 页面可链；真平台需挂条款页。
2. affiliate 用户的账户菜单里应有 portal 入口；真平台补，本页不做。
3. 三种 Apply 点击（登录门 / 申请表 / portal）没有埋点。
4. 页面 `<title>` / meta description 沿用全站默认，未单独配置（原稿 title 为 `OmenX Affiliate Program | Built for your community`）。

## 附：字典编号对照

| 编号 | 含义 |
|---|---|
| AF-1 | 整页（桌面 / 375） |
| AF-2 | 02.1 账本 `EarningsLedger` |
| AF-3 | 02.2 对比 `FeeBaseComparison` |
| AF-4a / 4b | FAQ 全收起 / 首条展开 |
| AF-5 | Hero 视频循环 + 插画位 |
| AF-6 | 桌面点导航 |
| AF-7a–d | Apply 按钮：未登录 / 已登录非 affiliate / affiliate / portal 说明框 |
