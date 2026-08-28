---
name: Footer compliance
description: 牌照合规 Footer——底栏三行 FROZEN 文案、挂载覆盖面、切面入口口径、App.tsx 移动壳 w-screen breakout
type: constraint
---

任何改动 footer 或切面（Lite/Pro）入口的单，先读本文件。

## 底栏三行（FROZEN · 牌照合规）

逐字，行序不得调换、不得删减、不得改写：

```
OmenX is operated by Nuvion Holdings Ltd., a company incorporated in the Cayman Islands.
© 2026 OmenX. All rights reserved.
For informational purposes only. Not financial advice. Trading involves risk of loss.
```

实体声明行必须在 © 行正上方，普通可见 HTML 文本，`text-xs text-muted-foreground` 与 © 行同级。不得降透明度、折叠、图片化或懒渲染。**未经 CPO 批准不得改动。**

## 挂载覆盖面

唯一组件 `src/components/seo/SeoFooter.tsx`，禁止任何页面自建 footer。

已挂载：`/`、`/events`、`/trade`、`/spot`、`/portfolio`、`/wallet`、`/rewards`、`/leaderboard`、`/settings/transparency`（含 guest 门与移动详情分支）、`/hedge`、以及所有 `SeoPageLayout` 页（about / faq / glossary / methodology / developers / privacy-policy / terms-of-service）。

不挂：`/style-guide`、voucher redeem 全屏态。

## 栏位

Brand（Logo 无 Mainnet 徽章 + tagline + 社交 pill + email）/ Platform（Events、Leaderboard、Insights；**Resolved 仅 Pro 面**）/ Learn（About、FAQ、Glossary、Methodology）/ Resources（Developers、On-Chain Transparency）/ Legal（Privacy、Terms）。内链一律 react-router `<Link>` 真锚点。

## 切面入口口径（CPO 拍板）

- Guest：只见 Lite，**零 Pro 入口**（有意决策，不要"补回"）。
- 登录桌面：头像下拉。登录移动：BottomNav「Me」抽屉，Settings 与 Help 之间。
- Pro → Lite 镜像行保留。
- Footer 不承担切面入口，禁止再加 Switch to Pro 行。

## App.tsx 移动壳 breakout

移动壳 `max-w-md mx-auto` 会限宽子元素，壳上对 footer 施加 `w-screen` breakout（`relative left-1/2 w-screen -translate-x-1/2`）。所以 footer **必须挂在页面根级**；让位间距（BottomNav / sticky bar / 交易页 96px）放 footer 外层 wrapper，wrapper 不得带水平 padding 或 margin。否则 431–767px 区间两侧漏底。

## 遗留

Transparency guest 门仍为旧式 `LoginPrompt`，未统一到 `LiteAuthGate`。
