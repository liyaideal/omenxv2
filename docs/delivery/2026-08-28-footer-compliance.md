# 牌照合规 Footer（Footer Compliance）— 交付说明 v1

> 本文档合并三轮改动：FT-1（实体声明行 + 全站挂载）→ FT-2（footer 改版 + 切面入口调整）→ FT-2b（移动壳通栏根因修复）。研发以本文档为准。除文末「本轮尾巴清理」两处外，本归档轮生产代码零改动；底栏三行为牌照合规 FROZEN，逐字节不动。

## 1. 需求背景

牌照申请合规要求：全站公开页必须常驻统一 Footer，且 Footer 内必须包含运营实体声明行。

| 项 | 口径 |
|---|---|
| 文案（逐字） | `OmenX is operated by Nuvion Holdings Ltd., a company incorporated in the Cayman Islands.` |
| 位置 | © 行**正上方**（底栏三行第一行） |
| 呈现 | 普通可见 HTML 文本，非图片、非 tooltip、非折叠 |
| 样式 | `text-xs text-muted-foreground`，与 © 行同级（不得降透明度） |

底栏三行最终态：

```
OmenX is operated by Nuvion Holdings Ltd., a company incorporated in the Cayman Islands.
© 2026 OmenX. All rights reserved.
For informational purposes only. Not financial advice. Trading involves risk of loss.
```

## 2. 三单 commit 链

| 单 | commit | 内容 |
|---|---|---|
| FT-1 | `2e831005` | 实体声明行落地；`SeoFooter` 挂到 8 个缺失页：LiteEventsPage / LiteContractTrade / LiteSpotTrade / LitePortfolio / Wallet / LiteRewardsPage / Leaderboard / Transparency（移动分支）。`/style-guide` 不挂；redeem 全屏态除外 |
| FT-2 | `45267cf9` | Footer 改版：12 栅格栏位重排（Brand col-4 + Platform / Learn / Resources / Legal 各 col-2）；Connect 并入品牌区；`font-display` 栏标题；社交 pill 描边；Logo 去 Mainnet 徽章；内链 `button` → `<Link>` 真锚点；Lite 面不渲染 Resolved；贴底（`mt-auto`）与通栏挂载；删除 Lite 页尾 Switch-to-Pro 行；BottomNav「Me」抽屉新增切面项；style-guide EV-27 下架 |
| FT-2b | `2ff78866` | 根因修复：`App.tsx` 移动壳 `max-w-md mx-auto` 限宽导致 431–767 区间 footer 两侧漏底，改为 `[&_footer]` `w-screen` breakout；补挂 Transparency guest 门与移动详情分支 |

## 3. 栏位结构（最终态）

| 栏位 | 内容 |
|---|---|
| Brand | Logo（`showMainnetBadge={false}`）+ tagline + 社交 pill（X / Discord）+ `support@omenx.com` |
| Platform | Events / Leaderboard / Insights；**Resolved 仅 Pro 面** |
| Learn | About / FAQ / Glossary / Methodology |
| Resources | Developers / On-Chain Transparency |
| Legal | Privacy Policy / Terms of Service |

移动端：Brand 区常驻不折叠，四个链接栏折叠为手风琴。

## 4. 切面（Lite / Pro）入口口径（CPO 拍板）

| 场景 | 入口 |
|---|---|
| Guest | 只见 Lite 面，**零 Pro 入口**（有意决策，非遗漏） |
| 登录 · 桌面 | 头像下拉内切换 |
| 登录 · 移动 | BottomNav「Me」抽屉，位置在 Settings 与 Help 之间 |
| Pro → Lite | 镜像行保留（Pro 面可返回 Lite） |

Footer 不再承担切面入口职责。

## 5. 技术注记

- 移动壳 `App.tsx` 的 `max-w-md mx-auto` 会限宽子元素；壳上对 footer 施加 `w-screen` breakout（`relative left-1/2 w-screen -translate-x-1/2`）。
- 因此 footer **必须挂在页面根级**；让位间距（BottomNav `var(--bottom-nav-h)`、交易页 96px、sticky bar）放在 footer 外层 wrapper 上，wrapper 不得带水平 padding / margin。
- 内链一律 react-router `<Link to>`，产出真锚点供抓取。

## 6. 验收结论

| 项 | 结果 |
|---|---|
| 通栏 | 11 页 × 462 / 600 / 1280 三宽，`footer.getBoundingClientRect()` 均 `left = 0`、`right = window.innerWidth` |
| FROZEN | 底栏三行 diff 断言通过，逐字节未变 |
| SEO | guest `/` footer 真锚点 30 个 |
| 生产 | omenxv2 guest 首页已实测三行完整可见 |

## 7. 遗留挂账

| 项 | 说明 |
|---|---|
| Transparency guest 门 | 仍为旧式 `LoginPrompt`，未统一到 `LiteAuthGate`；样式统一另立需求，不在本轮范围 |

## 8. 本轮（FT-arch）尾巴清理

| 项 | 说明 |
|---|---|
| `EventsStatesSection.tsx` | description 去掉已下架的「⑧页尾」，改为「①…⑦加载与空态」 |
| `LiteEventsPage.tsx` | 删除 SW-1 下架后遗留的死变量 `const navigate = useNavigate();` 及多余 import |

## 9. 涉及文件

**前端**
- `src/components/seo/SeoFooter.tsx`
- `src/App.tsx`（移动壳 footer breakout）
- `src/pages/lite/LiteEventsPage.tsx` / `LiteContractTrade.tsx` / `LiteSpotTrade.tsx` / `LitePortfolio.tsx` / `LiteRewardsPage.tsx`
- `src/pages/Wallet.tsx` / `Leaderboard.tsx` / `TransparencyPage.tsx`
- `src/components/BottomNav.tsx`（Me 抽屉切面项）
- `src/pages/StyleGuide/`（EV-27 下架）

**文档**
- `DESIGN.md` §16.5
- `.lovable/memory/design/footer-compliance.md`

## 10. 未变更项

- 底栏三行文案与行序
- `/style-guide` 不挂 footer、redeem 全屏态不挂
- 桌面端页面框架、内容区居中宽度
