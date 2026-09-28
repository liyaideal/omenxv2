# 多语言（i18n）一期 · 外壳 — 交付说明 v1

日期：2026-09-28 · 范围：Lovable 全站 i18n 基建 + 外壳文案（顶栏 / 底栏 / 页脚 / Me 抽屉 / 登录门 / 登录首屏 / Settings 全页 / 通用状态）· 决策：Liya（CPO）「直接做 B」+ 提供线上 i18n 总表 · 配套：[language-entry-v1.md](./language-entry-v1.md)（入口）

## 通俗导读

上午把语言**入口**整理好了，但 Lovable 只存偏好不翻页面，选了中文页面还是英文，很怪。这轮把 Lovable 真做成多语言：切换语言后，顶栏、底栏、页脚、登录、Settings 这些"外壳"立刻换语言；事件标题、赛事名、活动文案等**内容数据不翻**（正式版也是内容源自带语言）。

最关键的一点：**文案来源就是线上要用的那份 `OMENX-i18n.xlsx`**（27 个命名空间、5,822 条 key、7 语）。Lovable 不另起一套 key，直接用线上的；Lovable 有而线上还没有的功能（Settings 的 Notifications / Sessions / Account / Preferences 等 87 条），我按同样格式**追加到同一份表**里，标 `source = Lovable 2026-09-28`，回传给研发合并。这样 Lovable 的文案和线上是同一份真相源，以后一处改两边生效。

### 易混点辨析

1. **key 是线上的 key**，不是按 Lovable 组件起的名。例：安全卡标题 = `settings.screen.sections.settings_account_security_card.account_security`。研发一眼能对上自己代码。
2. **大小写差异是真差异**：线上 `Total equity` / `Sign Out` / `Not Set` vs Lovable 字典 `Total Equity` / `Sign out` / `Not set`。本轮按"英文只差大小写 = 同一条"合并，**以线上表为准显示**；哪边是最终口径请 CPO 定（见 §4 差异清单），定了改表即可。
3. 页脚底部三行（©、免责、牌照）是 FROZEN 法务文案，**只有英文**，不进翻译。
4. 非英文语言包按需加载（切换时才下载），首屏不变重；切换瞬间先显示英文、包到了自动刷新，肉眼不可见。
5. 线上表里约 100 条/语的空翻译（多在 api-management / market），Lovable 回落英文显示，不造译文。

### 用户视角

看到：切到简体中文后，顶栏 事件 / 持仓管理 / 联盟 / 洞察、去登录、登录门文案、页脚四栏、Settings 全部卡片、toast「语言已切换为 简体中文」全部中文；切日文/韩文/俄文/越南文同理。
看不到：事件卡内容、赛事名、Rewards 活动内容、交易页文案变化（交易页是二期）；页脚法务三行仍英文。

## 0. 读者须知

- 长什么样 → 生产任意页切语言；`/style-guide/preview?c=<key>&lang=ja` 可把任一字典帧钉在指定语言看布局。
- 文案表 → `OmenX/OMENX-i18n-2026-09-28-lovable-additions.xlsx`（线上表 + Lovable 追加行，第 9 列 `source`）。
- 代码 → `src/i18n/index.ts`（引擎）· `src/locales/<lang>.json`（由表导出，`{ namespace: { key: text } }`）。
- 边界 → §5。

## 1. 引擎（`src/i18n/index.ts`，零依赖）

| 项 | 规则 |
|---|---|
| key | `namespace.flatKey`，namespace = 表的 sheet 名 |
| 插值 | `{{var}}`（与 i18next 同）；旧 `{var}` 兼容 |
| 复数 | 传 `{ count }` 时先找 `key_one` / `key_other` |
| 回落 | 当前语言 → 英文 → key 本身，永不抛错 |
| 加载 | en 随主包；其余 6 语 `import()` 按需，`loadLanguage(code)` 返回 Promise |
| API | `useT()`（组件）· `t()` / `tIn(code, …)`（非组件）· `setI18nLanguage()`（只由 `useLanguage` 调）· `lockI18nLanguage()`（字典预览钉语言） |
| `<html lang>` | 随语言同步 |

为什么不装 i18next：Mac 的 autopush 脚本不跑 `bun install`，加依赖会让本地构建挂掉；格式与 i18next 完全兼容，正式版直接用同一份 JSON。

## 2. 一期覆盖（共 192 个 key 接线）

| 面 | 文件 | 备注 |
|---|---|---|
| 桌面顶栏 | `EventsDesktopHeader.tsx` | 导航 / Equity 卡 / 头像菜单 / Sign In |
| 底栏 + Me 抽屉 | `BottomNav.tsx` | 四 tab / 抽屉全部行 / Equity 卡 |
| 页脚 | `seo/SeoFooter.tsx` | 四栏 + tagline；法务三行不翻 |
| 登录门 | `auth/LiteAuthGate.tsx` | 默认标题副标题 + 两按钮（页面自传的标题随该页轮次） |
| 登录首屏 | `auth/AuthContent.tsx` | 标题 / 页签 / 三按钮 / 提示 / 条款行 / toast；后续步骤（资料补全）二期 |
| 通用状态 | `states/ErrorState.tsx` `LoadingState.tsx` | 默认文案 |
| Settings | `pages/Settings.tsx` + `settings/*` 10 张卡 | 门 / hero / Sign-in / Account security / Withdrawal / Notifications / Sessions / Account / More / Preferences；`Setup2FADialog` `ChangeLoginEmailDialog` 内部文案二期 |
| 语言件 | `language/LanguagePicker.tsx` | toast 用目标语言 |

## 3. Lovable 追加到总表的 87 条

按命名空间：`nav` 2 · `header` 4 · `auth` 5 · `settings` 74 · `language` 2。全部 7 语齐，zh-CN 由我起草（**请 CPO 过一遍**），其余 5 语 AI 初译（标「机翻待审」）。追加行在 xlsx 各 sheet 末尾，`source` 列可筛。

## 4. 与线上表的英文差异（请 CPO 裁定口径）

| Lovable 字典 | 线上表 | key |
|---|---|---|
| Total Equity | Total equity | `home.screen.HomeGreeting.total_equity` |
| Sign out（Settings 行） | Sign Out | `common.sign_out` |
| Not set | Not Set | `settings.not_set` |
| Try again | Try Again | `common.try_again` |
| Transparency audit / API management（More 卡） | Transparency Audit / API Management | `settings.transparency_audit` / `settings.api_management` |
| Loading… | Loading... | `common.loading` |
| Portfolio（nav） | 中文译「持仓管理」 | `nav.portfolio`（Lite 口径是否要「投资组合」？） |

裁定后只改表，不改代码。

## 5. Lovable / 正式版边界

| 项 | Lovable | 正式版 |
|---|---|---|
| 文案表 | 同一份 xlsx 导出 JSON | 同一份 |
| 引擎 | 自写 80 行 | i18next（格式兼容） |
| 覆盖 | 一期外壳 + Settings；二期交易页 / Wallet / Portfolio / Rewards | 全站 |
| 内容数据 | 不翻 | 内容源自带语言 |
| 首访默认 | en | 建议按 `Accept-Language` |

## 6. 二期清单

交易页（Lite / Pro / 现货）· Wallet / Deposit / Withdraw · Portfolio · Rewards / Vouchers · Leaderboard · Affiliate · 登录后续步骤 · 2FA / 改邮箱弹窗 · 字典页语言开关（工具栏级）。每轮同样先对线上表匹配、缺的追加回表。

## 7. 二期进度（2026-09-28 下午）

自动接线工具（`~/i18n/autowire.py`，不入仓）：扫组件 JSX 文案与 title/label/placeholder 等属性 → 按英文（忽略大小写 / 省略号 / 占位符）匹配线上表 → 命中即换 `{t("key")}`。语言切换时整棵路由树按语言 key 重挂（`App.tsx` `LanguageKeyed`），组件可直接用模块级 `t()`。

| 轮 | commit | 范围 | 命中 |
|---|---|---|---|
| 2a | `aa1fa1c3` | Wallet 家族 + 交易家族 | 125 + 210 |
| 2b | `c1815342` | Portfolio / Rewards / Vouchers / Leaderboard / Affiliate / Home / API / Insights / Auth / Settings 组件 | 522 |
| 2c | `5713c79c` | 其余全部组件（除 `ui/` 与 StyleGuide） | 816 |

累计接线约 1,860 处。**剩余未命中 ≈ 1,135 条真文案（146 个文件）**——全是 Lovable 8–9 月新做、线上表还没有的（Lite 交易页、Rewards 任务体系、体育直播、Home 模块……）。下一步按页面优先级分批：追加回表（7 语）→ 接线。`t` 与局部变量重名的文件改用 `t as tr`（SpotTradingCharts / ProSpotShared / CreateKeySteps / TierQuickAnswer / LitePnlPoster）。
**入口缺口**：Pro 终端顶栏无语言 chip（Pro bar 取代了 EventsDesktopHeader），待补。

## 8. Insights 追加（2026-09-28 晚）

Insights SEO/GEO 重建新增 `insights.*` 150 条（`src/locales/en.json`，含 `insights.seo.*` title / description、`insights.category.intro.*` 八段分类导语、`insights.feed.*` 答句模板）。**只有英文**：其余 6 语随二期追加批一起并入 `OMENX-i18n.xlsx` `insights` sheet（`source = Lovable 2026-09-28`）。SEO title / description / 分类导语上多语言时**每语各写，不机翻**（搜索词汇随语言变）。
