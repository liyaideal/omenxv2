# 全站换标：新 OMENX logo 家族 + favicon / OG 图 — 交付说明 v1

> 2026-09-19。品牌方出了正式品牌书（Figma `OmenX_Branding-Assets`，中英双版），字标从「圆 O 版」换成品牌书的超宽几何字标（X 带 Volt→Pulse 渐变）。本文说清换了哪些地方、每个地方用哪一版、以及品牌书里哪些东西**没**进站。给从未看过品牌书的人写。

## 0. 读者须知

- 长什么样 → `/style-guide` →「Design tokens」第一节 **Wordmark · 4 variants**（四版字标 × 四档尺寸 × X 单标），以及「Brand assets · IP 插画」Ⓑ 品牌标识（17 行台账，旧字标标 LEGACY）
- 规则条文 → `DESIGN.md` §1.1 Logo family + §10 Logo Usage
- 颜色 / 字体 token **没变**：品牌书的 Volt `#CFFF4A`、Pulse Blue `#33D6FF`、Archivo 与站内现有 token 完全一致；只新增一个渐变 token `--brand-signal`

## 1. 功能目标

1. 全站每一处 OMENX 标识都换成品牌书版本，同一处的尺寸位置不变。
2. 深底 / 彩底 / 白底各用对应变体，不靠 CSS 反色凑。
3. 浏览器标签图标、iOS 主屏图标、社交分享卡（og:image）三件补齐——之前 og:image 为空，发链接出去是空白卡。

## 2. 口径（2026-09-19 Liya 批，A–G 全批）

| 条 | 规则 |
|---|---|
| A 资产 | 4 版字标 + 4 版 X 单标（`src/assets/brand/`），路径数据直接取自品牌书 Figma 导出，只去掉导出附带的画板底色，不重绘 |
| B 组件 | `<Logo variant>`：`white-gradient`（默认，深底）/ `white`（彩底、艺术底）/ `black-gradient`（白底）/ `black`（浅色花底）；四档高度不变（16 / 20 / 24 / 32px），新字标同高下宽约 35%（433:65） |
| C 裸引用 | 7 处直接引旧 svg 的地方全部改走 `@/components/Logo` 导出：分享海报 ×2 → 纯白；Leaderboard ×2 → 默认；Affiliate 桌面/手机 h1 mask → 纯白 + 比例改 433/65；活动卡 / H2E 详情 28px Host 头像格 → **X 单标**（旧写法把字标压进 18×10px，新字标塞进去只剩 2.7px 高） |
| D favicon | `public/favicon.ico`（16/32/48）+ `public/brand/app-icon.svg`（现代浏览器）+ `apple-touch-icon.png` 180；`index.html` 三条 `<link rel=icon>` |
| E OG | `public/brand/og-image.png` 1200×630：Omen Black 底 + 右下 Signal 光晕 + 居中字标（纯矢量合成，**无 tagline**——品牌方出带 "Trade Outcomes, Not Hype." 的正式版时原路径替换即可）；`index.html` 补 `og:url` / `og:image` / `twitter:image`，`twitter:site` 从 `@Lovable` 改 `@OmenX_Official` |
| F Mainnet | 徽标按品牌书 lockup 改成 Volt 描边胶囊 + Archivo 常规 + 句首大写 `Mainnet`，尺寸随 logo 高度（0.88H / 圆角 0.30H / 字 0.49H）；删掉原来的等宽大写 + 闪点 |
| G 不动 | 体育子品牌 `OMENX | SPORTS` 与合作 lockup 不入站；中文字体鸿蒙体留给多语言轮；`--background` 不向 `#080A0F` 微调（肉眼不可分） |

## 3. 实现指引

- `src/components/Logo.tsx`：导出 `Logo`、`wordmark` / `mark` 两张变体表、`omenxLogo`（兼容旧名 = 默认字标）、`omenxLogoSolid`、`omenxMark`。徽标间距按尺寸 `gap-1 / gap-1 / 5px / 7px`。
- `src/components/MainnetBadge.tsx`：`size` 与 `LogoSize` 同名同义；`leading-none` 必须写在 `text-[..]` 之后（tailwind-merge 会把排在字号前面的 `leading-*` 当冲突丢掉）。
- `src/index.css` `--brand-signal` + `tailwind.config.ts` `backgroundImage.signal` → `bg-signal`。
- 旧文件 `src/assets/omenx-logo.svg` 保留在盘上只为台账缩略图，**生产代码零引用**（`grep omenx-logo.svg src` 只应命中 BrandAssetsSection）。

## 4. 验收（打开 / 应该看到 / 看什么）

| 打开 | 应该看到 | 看什么 |
|---|---|---|
| `/events` 手机 375 | 左上新字标 160×24 + `Mainnet` 胶囊 21px，右侧不溢出 | 字标右缘 176px、胶囊右缘 243px |
| `/events` 桌面 1440 | 字标 213×32 + 胶囊 28px，导航从 428px 起 | 无重叠 |
| Sign In 弹窗 | teal 顶上是**纯白**字标（X 不带渐变） | 变体选对 |
| `/affiliate` h1 "Build with OMENX" | 字标 Pulse Blue 着色、比例 6.66:1 不缩框 | mask 比例 |
| `/style-guide` → Design tokens | 四版字标各在对应底色上、四档尺寸带胶囊、X 单标五枚 | 新节渲染 |
| `/style-guide` → Brand assets | 台账 82 枚 / 18 LEGACY，Ⓑ 组 17 行全出图 | 缩略图不裂 |
| 浏览器标签 | 黑底渐变 X 图标 | favicon 生效（可能要硬刷新） |
| 任意分享海报（style-guide Share SH-1） | 页脚纯白字标 18px | 变体选对 |

## 5. 追加 · 页面级尺寸校正（2026-09-19 下午，Liya 全批 L1–L7）

换标当天按品牌书"同高替换"上线后，对照 omenx_lite 页面稿（桌面 `140:68980` / 手机 `203:92708`）复量，发现设计师在页面里把 logo 压小了一档；全站的 4 档通用尺寸不动，新增两档**页面 chrome 专用尺寸**：

| 位置 | 稿 | 落地 | 徽标 | 间距 |
|---|---|---|---|---|
| 桌面顶部导航 | 字标 26.5 × 178 | `size="nav"` 26 × 173 | 22px 胶囊 | 6px |
| 手机品牌栏（Lite 各根页） | 字标 14.75 × 99，页头 43.5 | `size="brand-bar"` 15 × 100，**页头 44px**（内页仍 56） | 17px 胶囊，字 9px 下限 | 6px |

变体与徽标样式**仍按品牌书**（白字 + 渐变 X、Archivo 句首大写胶囊）——页面稿里的纯白 X 与"圆点 + 大写 MAINNET"是品牌书定稿前的旧版，Liya 拍板听品牌书。

实现：`Logo.tsx` / `MainnetBadge.tsx` 各加 `nav` / `brand-bar` 两档；`MobileHeader` brand 变体行高 `h-11`，header 带 `data-mobile-header`，`index.css` 用 `:root:has(header[data-mobile-header="brand"])` 把 `--mobile-header-h` 改成 44px，Portfolio / Rewards 的吸顶子栏自动跟随（实测 `top: 44px`）。

## 6. 已知边界

- OG 图是站内矢量合成版，不是品牌方排版稿；`public/brand/og-image.png` 同名替换即升级。
- `og:image` 用绝对地址 `https://omenx.com/brand/og-image.png`——preview 域名分享出去时爬虫仍会去取正式域名的图，正式域名上线前分享卡可能空。
- 头像 `avatar.svg` 的白环 / 黑底几何是按品牌书头像页比例重建的（导出只带了 X 路径），环宽 5.2%。
