# 语言切换入口整理 — 交付说明 v1

日期：2026-09-28 · 范围：全站语言入口（桌面顶栏 / 移动品牌栏 / Me 抽屉 / Settings）· 决策：Liya（CPO）批 R1–R8 + 视觉 mock · Lovable commit 见 changelog

## 通俗导读

以前语言切换有三个入口、三种长相：未登录时顶栏有个「🌐 EN」chip（而且只在 1280 宽以上才显示）；登录以后 chip 消失，语言藏进头像下拉的二级菜单里；手机上除了 Settings › Preferences 根本没有入口。用户登录后就找不到语言在哪。

这轮把它整理成**一个组件、一个位置、双端双态常驻**：

- **桌面**：顶栏右侧固定一个「🌐 短码」chip，未登录在 Sign In 左边、登录后在 Equity 左边，1024 宽起就显示。头像菜单里那个 Language 子菜单删掉。
- **手机**：首页那类带 logo 的品牌栏，右上角固定一个 🌐 图标，点开是底部抽屉；登录后 Me 抽屉里 Settings 上方多一行「Language · 简体中文」，点开同一个抽屉。
- **Settings › Preferences** 保留，是次入口，用的是同一份列表。

所有入口共用一份语言列表、一个存储口、一个点选行为：点了立刻生效、弹 toast；未登录存在浏览器里，登录存在账号上；**未登录时选的语言，登录后会带进账号**（以前会被丢掉）。

### 易混点辨析

1. **Lovable 不翻译页面**：这轮和之前一样，页面文案全英文，语言偏好只驱动 chip 显示和邮件语言。正式版上多语言 = 切换后整站文案 + 邮件都跟着换，这是研发的 i18n 工程，本文只定「入口在哪、怎么存」。
2. chip 显示的是 **2 字母短码**（EN / ZH / TW / JA / KO / RU / VI），不是语言名，避免 `Tiếng Việt` 把顶栏撑宽；列表里才是「短码 + 本名」。
3. 语言本名用各语言自己的文字（简体中文 / 日本語 / Русский），这是「站内文案一律英文」规则的唯一具名例外。
4. 品牌栏 🌐 只在**品牌形态** header（/、/events、/portfolio、/wallet）出现；内页（标题 + 返回）不加，靠 Settings 或回首页。
5. 「登录后带入」只发生在账号**从没设过语言**（`profiles.language` 为空）时；账号已有语言的，以账号为准，本地值被覆盖。

### 用户视角

看到：桌面顶栏 🌐 EN chip（双态）；手机品牌栏右上 🌐；Me 抽屉 Language 行；Settings 里 Language 行；点选后 toast `Language set to 简体中文`。
看不到：头像菜单里的 Language ▸ 子菜单（已删）；任何页面文案变化（Lovable 不翻译）。

## 0. 读者须知

- 长什么样 → 生产：桌面任意页顶栏；手机 `/`；登录后 Me 抽屉。演示账号 `alex_carter`。
- 什么时候变成什么样 → `/style-guide` → **Lite** 组 **Settings** 节点 **Ⓚ 语言入口（ST-32…ST-35）**；Preferences 的 ST-21 / 22 同步改成共用列表；移动 header 节 A 形态帧已带 🌐。
- 字段名、文案 → `docs/copy-dictionary.md`「Settings」节 Language 行（本轮追加入口矩阵）。
- 设计法则 → `DESIGN.md` §Addendum 2026-09-28。
- Lovable / 正式版边界 → 本文 §5。

### 0.1 字典怎么看

- 网址：https://omenxv2.lovable.app/style-guide
- 本次节点：左栏 **Lite** 组 → `Settings ✅`；页内目录到 **Ⓚ 语言入口（ST-32 … ST-35）**。相关但非本轮新建：同节 Ⓑ Preferences 的 ST-21 / ST-22（Language 行改为共用列表）；**Foundations** 组 → `Mobile patterns` 的 header A 形态帧（品牌栏右上 🌐）。
- 定位行：每张样张上方一行「编号 · 名称 · 平台」，下方 Desktop / Mobile · 375 两个 iframe 各挂一份生产组件 + 固定数据。
- 一张样张怎么读：ST-32 看 chip 在 Sign In 左的位置与尺寸；ST-33 看列表形态（灰短码 + 本名 + ✓）；ST-34 看品牌栏 🌐 的位置；ST-35 看底部抽屉列表。
- 搜索：页顶搜索框敲 `ST-32` 直达。单张预览：`/style-guide/preview?c=<previewKey>`（本轮 `settings-lang-header-guest` / `settings-lang-chip-open` / `settings-lang-brandbar` / `settings-lang-drawer-open`）。
- 编号前缀：`ST-` = Settings 节；语言入口的四张都在 Ⓚ 区。
- 只在字典可见的态：ST-33 / ST-35 的「展开且当前为简体中文」是固定数据帧，生产上要先切一次语言才能看到同样画面，是既定状态。

## 1. 入口矩阵（R1–R4）

| 端 × 态 | 主入口 | 次入口 | 备注 |
|---|---|---|---|
| 桌面 · 未登录 | 顶栏 `LanguageChip`，Sign In 左侧 | — | lg（≥1024）起显示 |
| 桌面 · 登录后 | 顶栏 `LanguageChip`，Equity 左侧 | Settings › Preferences | 头像菜单 Language 子菜单**已删** |
| 移动 · 未登录 | 品牌栏右槽 `LanguageIconButton` → `LanguageDrawer` | — | 品牌形态 header 默认右槽 |
| 移动 · 登录后 | 品牌栏 🌐（同上） | Me 抽屉「Language · {本名}」行 → 同一抽屉；Settings › Preferences | Me 行位于 Settings 上方 |

## 2. 组件（一套件，四个入口共用）

`src/components/language/LanguagePicker.tsx`

| 件 | 用在哪 | 形态 |
|---|---|---|
| `useLanguagePick()` | 全部入口 | 点选 = `useLanguage().setLanguage` + toast；同值不动作；失败 toast `Couldn't save that. Try again.` |
| `LanguageMenuItems` | 顶栏 chip 下拉 / Settings 桌面下拉 | 灰色短码（w-6 mono 11px）+ 本名 + 当前项 `text-primary` ✓，200px |
| `LanguageDrawer` | 品牌栏 🌐 / Me 行 / Settings 移动 | `MobileDrawer` title `Language`，同一列表形态，点选收起 |
| `LanguageChip` | 桌面顶栏 | h-9 / rounded-lg / `border-border/50 bg-muted/30` / Globe 16 + 短码，与 Equity 块同规格 |
| `LanguageIconButton` | 移动品牌栏 | h-9 w-9 Globe 20 1.5 描边，与 back 钮同规格 |

数据：`src/lib/languages.ts`（`SITE_LANGUAGES` 7 语，第二批 es / id / tr 未做）；存储：`src/hooks/useLanguage.ts`。

## 3. 行为规则（R5）

1. 点选即生效 + toast `Language set to {本名}`。
2. 未登录 → `localStorage omenx.language`；登录 → `profiles.language`（并镜像到 localStorage 防刷新闪动）。
3. **带入**：登录 / 注册后 profile 加载完成且 `language` 为 `null` → 把本地值写入 profile 一次（`useLanguage` 内 `carriedFor` 守卫，每个 user 只写一次）。账号已有值 → 账号优先。
4. 四个入口读写同一个值，任一处改动其余同步（同一 hook，无需广播）。

## 4. 字典（R7）

Settings 节点 Ⓚ：ST-32 顶栏 chip 未登录（生产 `EventsDesktopHeader`）· ST-33 chip 展开 · ST-34 品牌栏 🌐（生产 `MobileHeader`）· ST-35 抽屉展开。ST-22 加移动帧。**未入字典**（需登录态）：登录后 chip 位置、Me 抽屉 Language 行——看生产 alex_carter。

## 5. Lovable / 正式版边界（R8）

| 项 | Lovable | 正式版 |
|---|---|---|
| 入口位置与形态 | 照本文 | 照抄 |
| 语言列表 | 7 语（第二批 3 语未开） | 同 |
| 存储 | `profiles.language` / localStorage | 用户偏好存哪里自选，语义照抄 |
| 切换效果 | 本交付只含**入口与偏好存储**；Lovable 上页面文案是否跟随切换属于 i18n 交付（`i18n-phase-b-v1.md`，另行交付），不在本文范围 | **整站文案切换 + 邮件语言**（i18n 工程，研发） |
| 首次访问默认语言 | `en` | 建议按浏览器 `Accept-Language` 命中列表则用之，否则 `en`（本文未实现，研发定） |
| 带入规则 | 登录后 null → 写本地值 | 同 |

## 6. 改动清单

- 新建 `src/components/language/LanguagePicker.tsx`
- `EventsDesktopHeader.tsx`：双分支改用 `LanguageChip`（`hidden lg:flex`）；删 Language 子菜单与相关 import
- `MobileHeader.tsx`：品牌形态默认右槽 = `LanguageIconButton`
- `BottomNav.tsx`：Me 抽屉 Language 行 + `LanguageDrawer`
- `ui/mobile-drawer.tsx`：`MobileDrawerListItem` 新增 `right` 槽
- `settings/PreferencesCard.tsx`：改用共用列表 / 抽屉 / pick
- `hooks/useLanguage.ts`：R5 带入
- 字典：`settingsPreviews.tsx` 四件 + `registry.tsx` 四 key + `LiteSettingsPage.tsx` Ⓚ 区；`mobileHeaderPreviews.tsx` / `MobilePatternsSection.tsx` 注记
- 文档：本文 · `DESIGN.md` §Addendum 2026-09-28 · `copy-dictionary.md` Language 行 · `changelog/INDEX.md`
