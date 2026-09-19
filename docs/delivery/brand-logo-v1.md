# 全站换标：新 OMENX logo 家族 + favicon / 分享卡 — 交付说明 v2（研发版）

> 这份文档给真平台研发看。OmenX 的字标从"圆 O 版"换成了品牌书定稿的新字标：超宽几何字母 + 带绿→蓝渐变的 X。全站每一处出现 logo 的地方都换了，同时补齐了浏览器标签图标、iOS 主屏图标和社交分享卡图。除了换图，只有一处布局改动：手机端品牌栏页头从 56px 变成 44px。所有资产和组件都已经在蓝图仓库里，pull 下来按同路径搬即可，不需要碰 Figma。
>
> 长什么样：https://omenxv2.lovable.app/style-guide → 左栏 Foundations「Design tokens」第一节 **Wordmark · 4 variants**（四版字标 × 七档尺寸 × X 单标）；「Brand assets · IP 插画」Ⓑ 品牌标识（每个文件一行卡）。字典里每一态都是生产组件渲染的，不是截图，可以对着抄。

## 1. 换了什么

| | 旧 | 新 |
|---|---|---|
| 字标 | 圆 O 字标，比例 376:76（≈ 4.9:1） | 品牌书几何字标，比例 **433:65（≈ 6.66:1）**，X 带 Signal 渐变（`#31E5FD → #CFFF4A`） |
| 同高宽度 | 24px 高 → 119px 宽 | 24px 高 → **160px 宽**（宽 35%） |
| Mainnet 徽标 | 圆点 + 大写 `MAINNET`（Space Grotesk） | 描边胶囊 + 句首大写 `Mainnet`（Archivo），尺寸随 logo 档位 |
| 浏览器标签图标 | Lovable 默认 | 黑底渐变 X（`favicon.ico` + `app-icon.svg`） |
| 分享卡图 `og:image` | 空 | `public/brand/og-image.png` 1200×630 |

颜色和字体 **没有变**：品牌书的 Volt `#CFFF4A`、Pulse Blue `#33D6FF`、Archivo 与现有 token 完全一致。只新增一个渐变 token：`--brand-signal: linear-gradient(90deg, #CFFF4A, #33D6FF)`（Tailwind `bg-signal`），目前只有 logo 的 X 在用，其它地方不要拿它做背景。

## 2. 资产清单

全部在蓝图仓库，路径即交付路径。SVG 的路径数据直接取自品牌书导出，**不要重绘、不要改色**。

### 2.1 矢量（`src/assets/brand/`）

| 文件 | 尺寸 | 用途 |
|---|---|---|
| `omenx-wordmark-white-gradient.svg` | 433 × 65 | **站内默认**：白色字母 + 渐变 X，用在所有深底 UI |
| `omenx-wordmark-white.svg` | 433 × 65 | 纯白：只用在艺术底（分享海报、hero 插画） |
| `omenx-wordmark-black-gradient.svg` | 433 × 65 | 黑字 + 渐变 X：纯白底（邮件、印刷、浅色演示稿） |
| `omenx-wordmark-black.svg` | 433 × 65 | 纯黑：浅色花纹底 |
| `omenx-mark-gradient-dark.svg` | 201 × 149 | X 单标（深底用渐变） |
| `omenx-mark-gradient-light.svg` | 201 × 149 | X 单标（浅底用渐变） |
| `omenx-mark-white.svg` | 201 × 149 | X 单标纯白 —— 站内 28px 头像格用这个 |
| `omenx-mark-black.svg` | 201 × 149 | X 单标纯黑 |

### 2.2 位图与图标（`public/`）

| 文件 | 尺寸 | 用途 |
|---|---|---|
| `public/favicon.ico` | 16 / 32 / 48 三层 | 传统 favicon |
| `public/brand/app-icon.svg` | 矢量 | 现代浏览器标签图标（黑底圆角 + 渐变 X） |
| `public/brand/apple-touch-icon.png` | 180 × 180 | iOS 添加到主屏 |
| `public/brand/app-icon-192.png` / `app-icon-512.png` | 192 / 512 | PWA manifest（若接） |
| `public/brand/og-image.png` | 1200 × 630 | 社交分享卡（Omen Black 底 + 右下渐变光晕 + 居中字标） |
| `public/brand/avatar.svg` / `avatar-400.png` | 矢量 / 400 | 社媒头像（白环黑底 + 渐变 X） |

### 2.3 下线

旧文件 `src/assets/omenx-logo.svg` **生产代码零引用**（仓库里只剩 style-guide 台账的 LEGACY 缩略图在引它）。真平台迁完后请 `grep omenx-logo` 确认没有残留。

## 3. 组件规格

### 3.1 `<Logo>`（`src/components/Logo.tsx`）

```tsx
<Logo size="nav" />                          // 白字 + 渐变 X + Mainnet 胶囊（默认）
<Logo size="xl" showMainnetBadge={false} />  // 不带胶囊
<Logo size="lg" variant="white" />           // 纯白，只给艺术底
```

Props：`size`（下表 7 档）、`variant`（`white-gradient` 默认 / `white` / `black-gradient` / `black`）、`showMainnetBadge`（默认 true）。字标只设高度，宽度 `auto`，**永远不要同时设宽高**。

| `size` | 字标高 | 字标宽（约） | 字标↔胶囊间距 | 胶囊高 / 圆角 / 左右内边距 / 字号 | 用在哪 |
|---|---|---|---|---|---|
| `brand-bar` | 15px | 100px | 6px | 17 / 5 / 5 / 9px | 手机品牌栏（Lite 各根页页头） |
| `sm` | 16px | 107px | 4px | 14 / 4 / 4 / 9px | 备用 |
| `modal` | 17px | 113px | 8px | 21 / 7 / 6 / 13px | 登录弹窗（桌面）与登录抽屉（手机） |
| `md` | 20px | 133px | 4px | 18 / 6 / 5 / 11px | 备用 |
| `lg` | 24px | 160px | 5px | 21 / 7 / 6 / 13px | 手机页脚 |
| `nav` | 26px | 173px | 6px | 22 / 7 / 6 / 12px | 桌面顶部导航 |
| `xl` | 32px | 213px | 7px | 28 / 9 / 7 / 15px | 桌面页脚、落地页 |

`brand-bar` / `modal` / `nav` 三档的数值是从页面设计稿量出来的，不是从通用尺寸推的——新字标同高下更宽，chrome 里用通用档会显得过大。

### 3.2 Mainnet 胶囊（`src/components/MainnetBadge.tsx`）

- 文案 `Mainnet`（句首大写，不是全大写，不带圆点）
- 字体 Archivo Regular（站内 `font-sans`），字距 `0.02em`，`line-height: 1`
- 1px 描边 `--accent`（Volt），文字同色，**无填充**
- 高度 / 圆角 / 内边距 / 字号按上表随 `size` 走；`size` 与 `<Logo>` 同名同义
- `aria-label="Live on mainnet"`
- 这是"平台已上主网"的永久品牌信号，不随 Launch 活动结束下线

### 3.3 X 单标与 mask 用法

- 宽度装不下 ~90px 字标的位置（头像格、图标位、社交头像）**换 X 单标**，不要把字标缩到更小。站内示例：活动详情页 Host 头像格 28px 圆内 `<img src={mark.white} className="h-3 w-auto" />`
- 把字标当 CSS mask 着色时（Affiliate 页 h1 "Build with OMENX"），用纯白版做 mask，宽度按 **433/65** 算：`h-[0.57em] w-[calc(0.57em*433/65)]`，且 `mask-image: url("…")` 的 URL **必须带双引号**（Vite 内联的 SVG data URI 含单引号，不加引号生产构建会丢掉整条 mask）

## 4. 放置表

| 页面 / 位置 | 档位 | 变体 | 备注 |
|---|---|---|---|
| 桌面顶部导航（所有页） | `nav` 26 | 默认 | 左边距 104px（容器 80 + 24），胶囊 22，导航项从 logo 右侧 ≥ 32px 起 |
| 手机品牌栏（Events / Portfolio / Wallet 等 Lite 根页） | `brand-bar` 15 | 默认 | **页头行高 44px**（原 56），左边距 16，滚动后出 1px 底线；见 §5 |
| 手机内页页头（返回 + 标题） | — | — | 不放 logo，行高仍 56 |
| 交易页 | — | — | 不放 logo，只有返回 |
| 登录弹窗（桌面，448 宽） | `modal` 17 | 默认 | 居中，距弹窗顶 24，胶囊 21 |
| 登录抽屉（手机） | `modal` 17 | 默认 | 居中，同上 |
| SEO 页脚 | 桌面 `xl` 32 / 手机 `lg` 24 | 默认 | 不带胶囊 |
| Affiliate 页 h1 "Build with OMENX" | mask | 纯白做 mask，Pulse Blue 着色 | 比例 433/65，见 §3.3 |
| 活动卡 / 活动详情 Host 头像格（28px 圆） | X 单标 h-3 | `mark.white` | 不用字标 |
| 分享海报页脚（Lite 盈亏海报、通用海报） | 18px 裸 `<img>` | **纯白** | 艺术底，唯一允许纯白的站内位置 |
| Leaderboard 页头与排名分享卡 | 现状 24 | 默认 | **本轮不动**，随 Leaderboard 整页重做 |

**变体规则一句话**：站内所有 UI——导航、品牌栏、登录弹窗/抽屉、页脚——一律 `white-gradient`，暗色渐变顶（登录弹窗的 teal 顶）也算深底；纯白只给海报、插画这类真·艺术底。

## 5. 唯一的布局改动：手机品牌栏 44px

- 品牌栏（`MobileHeader variant="brand"`）行高 `h-11`（44px），内页头 `h-14`（56px）不变
- header 元素带 `data-mobile-header="brand" | "inner"`
- 吸顶子栏统一用 CSS 变量 `--mobile-header-h` 定 `top`。`index.css` 里：

```css
:root { --mobile-header-h: calc(56px + env(safe-area-inset-top)); }
:root:has(header[data-mobile-header="brand"]) { --mobile-header-h: calc(44px + env(safe-area-inset-top)); }
```

  这样 Portfolio、Rewards 等页的吸顶页签条在品牌栏页面自动贴到 44px，内页仍是 56px，不用逐页改。
- 需要 `:has()` 支持（Chrome 105+ / Safari 15.4+ / Firefox 121+）；若目标浏览器矩阵更老，改为在 `<body>` 上打 class 即可，效果相同。

## 6. `<head>` 标签

```html
<link rel="icon" href="/favicon.ico" sizes="48x48" />
<link rel="icon" type="image/svg+xml" href="/brand/app-icon.svg" />
<link rel="apple-touch-icon" href="/brand/apple-touch-icon.png" />

<meta property="og:type" content="website" />
<meta property="og:url" content="https://omenx.com/" />
<meta property="og:image" content="https://omenx.com/brand/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:image" content="https://omenx.com/brand/og-image.png" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:site" content="@OmenX_Official" />
```

`og:image` 必须是绝对地址（爬虫不解析相对路径）；域名按真平台正式域名填。

## 7. 规则：做 / 不做

做：
- 站内 UI 统一白字 + 渐变 X；按高度定尺寸；chrome 三档用表里的数值
- 宽度不够时换 X 单标
- 纯白底用 `black-gradient`，浅色花底用 `black`

不做：
- **禁止 `filter: invert()`**——会把渐变 X 变成紫色
- 不重新着色、不旋转、不拉伸、不加投影/发光/描边、不降透明度、不改字距
- 不在页面里直接 `import` SVG 文件，统一走 `<Logo>` 或它导出的 `wordmark` / `mark` 表
- 不把字标缩到 90px 以下

## 8. 验收

| 打开 | 应该看到 | 看什么 |
|---|---|---|
| 任意页 桌面 1440 | 左上字标 26 高 × 173 宽，X 带渐变；右侧 `Mainnet` 描边胶囊 22 高，间距 6 | 与 https://omenxv2.lovable.app/events 并排一致 |
| `/events` 手机 375 | 字标 15 × 100，胶囊 17，页头 44 + 1px 底线（滚动后出现） | 品牌栏比内页薄 |
| `/portfolio` 手机，往下滚 | 吸顶页签条贴在 44px 品牌栏正下方，无空隙 | `top: 44px` |
| 任意手机内页（如 `/wallet` 子页、活动详情） | 页头 56，返回 + 标题，无 logo | 内页未被波及 |
| 未登录点 Sign In（桌面） | 弹窗顶字标 17 × 113 居中，X 带渐变，胶囊 21 | 与导航同一版字标 |
| 未登录手机点底栏 Me | 抽屉顶同上 | 同上 |
| 页面底部页脚 | 桌面 32 × 213，手机 24 × 160，不带胶囊 | 渐变 X |
| `/affiliate` h1 | "Build with OMENX" 中字标 Pulse Blue 着色，宽高比 6.66 | mask 未被生产构建丢掉 |
| `/rewards/campaign/h2e` Host 行 | 28px 圆内是白色 X 单标，不是被压扁的字标 | X 单标 |
| 任一分享海报 | 页脚字标纯白 18px | 唯一纯白处 |
| 浏览器标签 | 黑底渐变 X 图标 | 硬刷新（Cmd+Shift+R）后生效 |
| 把链接贴到 X / Telegram | 出黑底居中字标的分享卡 | `og:image` 可访问 |

## 9. 不在本轮范围

- 分享卡 `og-image.png` 目前是站内矢量合成版（无 tagline）；品牌方出带 "Trade Outcomes, Not Hype." 的正式版后同名替换即可，不改代码
- 体育子品牌 `OMENX | SPORTS` 与合作 lockup 未入站
- 中文伴侣字体 HarmonyOS Sans SC 随多语言轮
- Leaderboard 页头 / 排名分享卡 logo 尺寸、分享卡二维码旧域名 —— 随 Leaderboard 整页重做

---

### 附：内部对照（研发不用看）

| 项 | 来源 |
|---|---|
| 品牌书 | Figma `Cc085WLhF9zz1wJP5iafS0`：Logo Usage `1:4812`，Mainnet lockup `1:4921`，X 单标 `1:6299`，头像 `1:6409` |
| 桌面导航尺寸 | omenx_lite `e1gJg4USia95DSju3Eqx09` Event_All `140:68990`（26.5 × 178） |
| 手机品牌栏尺寸 / 页头 44 | omenx_lite event_all Header `203:92635`（14.75 × 99，页头 43.5） |
| 登录弹窗尺寸 | omenx_lite Connect / PC `409:4736`（17 × 114） |
| 蓝图 commit | `e8ac0db1` `43e263e0` `3e68fff8` `6bfff58c` `0d5f5393` |
| 拍板 | 2026-09-19 上午 A–G、下午 L1–L7、A1–A4；Leaderboard R1/R2 不做 |
| 台账 | style-guide「Brand assets · IP 插画」Ⓑ 组 17 行，82 枚 / 18 LEGACY |
