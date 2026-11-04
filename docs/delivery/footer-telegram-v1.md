# Footer · Telegram 入口（Footer Telegram Entry）— 交付说明 v1

> 全站统一 footer（`SeoFooter`，所有对未登录用户开放的页面底部那一块）左下角的社交按钮，原来只有 X 和 Discord 两个。
> 这次在 Discord 后面加了一个 Telegram 按钮：点开先选语言，再跳到对应语言的官方 Telegram 群（English / 中文 / Русский / Tiếng Việt 四个群）。
> footer 的其他部分（链接列、合规三行、移动端折叠）都没动；头像菜单和手机首页顶栏的 Discord 入口也没动。
> 先看 §0 怎么查，再看 §1 的规则表；每条规则都标了对应的字典编号。

日期：2026-11-04 · 范围：`SeoFooter` 社交行 · 决策：Liya（CPO）批 R1–R9 + 视觉 mock

## 0. 读者须知

查什么去哪儿：
- 长什么样 → 生产任意带 footer 的页（如 `/leaderboard`、`/events`），拉到页底
- 什么时候变成什么样 → `/style-guide` → **Common UI** 节点 → **Site-wide Footer Specification** 小节 → 「Telegram 入口（FT-TG1 … FT-TG3）」
- 文案 → 本文 §3（只有两条新文案）
- 设计法则 → `DESIGN.md` §16.5「Telegram 入口」
提问前先按上面顺序查一遍；查不到再提，提问时写明"我查了 X 没有"。

### 0.1 字典怎么看

1. 打开 `/style-guide`（不用登录），左栏 **Foundations** 组里的 **Common UI**。
2. 页内往下找到 **Site-wide Footer Specification**，Live Preview 下面就是「Telegram 入口（FT-TG1 … FT-TG3）」。
3. 上面一个桌面 iframe 放 FT-TG1 + FT-TG2，下面两个手机 375 iframe 放 FT-TG1 + FT-TG3，都是真组件，可以点。
4. 每张样张下的表固定四列「状态 / 触发条件 / 视觉 / 数据来源」，触发条件就是判定规则。
5. 页头搜索框敲 `FT-TG` 直达。
6. 单张查看：`/style-guide/preview?c=footer-tg-default` / `footer-tg-menu-open` / `footer-tg-drawer-open`。

编号规则：`FT-TG` = Footer · Telegram，1 默认 / 2 桌面展开 / 3 手机展开。
只在字典可见的态：FT-TG2 是「站点语言简体中文」、FT-TG3 是「站点语言俄语」时的展开画面；生产上要先切站点语言才能看到同样的高亮，是既定状态不是 bug。

## 1. 规则（R1–R9）

| # | 规则 | 字典 |
|---|---|---|
| R1 | 社交行顺序 X · Discord · Telegram，Telegram 最后；桌面、手机一样（手机仍和 `support@omenx.com` 同一行） | FT-TG1 |
| R2 | 图标 = 单色纸飞机，和 X / Discord 同一颗 34px 描边圆钮；不用登录方式那个蓝底 Telegram 图标 | FT-TG1 |
| R3 | 桌面：点按钮在上方弹出 220px 下拉菜单，上方放不下自动往下；点外面或按 Esc 关闭；菜单开着时按钮保持"打开态"（描边提亮 + 底色加深） | FT-TG2 |
| R4 | 手机：点按钮拉起底部抽屉，标题 + 一句说明，只有四个选项、没有按钮；点遮罩、下拉或右上 ✕ 关闭 | FT-TG3 |
| R5 | 四个群顺序固定（见 §2），群名用各自语言写，不翻译 | FT-TG2 / 3 |
| R6 | 每一行都是真链接，点了**新标签页**打开对应 t.me 群，菜单 / 抽屉同时关闭；手机装了 Telegram 会直接跳 App | FT-TG2 / 3 |
| R7 | 跟站点当前语言对应的那一行加底色（推荐），不打 ✓、不改顺序；对应关系见 §2 | FT-TG2 / 3 |
| R8 | 只有标题和说明两条文案跟站点语言走（§3） | — |
| R9 | 规范与字典同轮更新（DESIGN §16.5、style-guide footer 小节） | — |

## 2. 四个群与推荐规则

| 行 | 显示 | 地区标 | 链接 | 哪些站点语言会高亮这一行 |
|---|---|---|---|---|
| EN | English | Global | `https://t.me/omenx_news` | English、日本語、한국어（没有自己语言群的都落到 Global） |
| ZH | 中文 | — | `https://t.me/+hcIqv6toxwdhY2Fh` | 简体中文、繁體中文 |
| RU | Русский | CIS | `https://t.me/omenx_news_ru` | Русский |
| VI | Tiếng Việt | — | `https://t.me/omenxvietnam` | Tiếng Việt |

站点语言 = 用户当前选的界面语言（未登录看浏览器本地保存值，登录看账号设置），与语言入口同一个值。

## 3. 文案

| key | English | 用在 |
|---|---|---|
| `legal.footer.telegram.title` | Join our Telegram | 桌面菜单顶部眉标；手机抽屉标题 |
| `legal.footer.telegram.description` | Pick the group in your language. | 手机抽屉标题下的说明 |

7 语都已在 `src/locales/*.json` 的 `legal` 命名空间里；俄语标题用 `Мы в Telegram`（短，避免 220px 菜单折行）。按钮的无障碍名直接写 `Telegram`，不翻译。

## 4. 状态索引

| 模块 | 字典 |
|---|---|
| Telegram 按钮 默认 / 悬停 / 打开态 | FT-TG1（悬停看 spec 行，静态帧不展示） |
| 桌面下拉展开 + 推荐行 | FT-TG2 |
| 手机抽屉展开 + 推荐行 | FT-TG3 |

## 5. 涉及文件

- 前端：`src/components/seo/TelegramGroupsMenu.tsx`（新，群列表 + 推荐规则 + 菜单 / 抽屉）、`src/components/seo/SeoFooter.tsx`
- 文案：`src/locales/{en,zh-CN,zh-TW,ja,ko,ru,vi}.json`
- 字典：`src/pages/StyleGuide/sections/CommonUISection.tsx`、`src/pages/StyleGuide/preview/footerPreviews.tsx`、`registry.tsx`
- 规范：`DESIGN.md` §16.5
- 后端：无

## 6. 未变更项

- footer 链接列、合规三行、移动端手风琴：不变
- 头像下拉菜单「Join Discord」行、手机首页顶栏 Discord 图标：不变（本轮只改 footer）
- 语言切换本身：不变；Telegram 选择不会改站点语言
