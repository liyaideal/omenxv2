# 合规 Footer — 交付说明

> **这份文档讲什么**：OmenX 全站底部那个统一的 Footer——它长什么样、挂在哪些页、为什么底下那三行一个字都不能改。
> **给谁看**：要在真平台上把它实现一遍的前端同学，以及要验它的测试。默认你没见过它，从零讲起。
> **为什么它比一般组件严格**：底栏三行是牌照申请的合规材料的一部分，监管方会实际打开页面核对。改动它需要 CPO 批准。

## §0 读者须知

- **长什么样** → 直接开生产页拉到底：`/`（未登录即可）、`/about`、`/leaderboard`。
- **规范原文** → `DESIGN.md` §16.5「全站统一 Footer 规范」：栏位、视觉语法、官方账号清单、底栏三行的 FROZEN 声明都在那里，本文档不复制，只讲实现与边界。
- **文案用词** → `docs/copy-dictionary.md`；Lite 用词与交易口径的对照见该文件顶部的「Lite 术语对照表」。
- **怎么验** → 见 §8，那一节写的是可复现的检查步骤，不是我们验过的结论。

## §1 为什么有这个东西

牌照申请的合规要求：**未登录用户可达的每一个页面，底部都必须常驻运营实体声明**。这决定了三件事：

1. 它必须是**普通可见的 HTML 文本**——不能是图片、不能藏在 tooltip 里、不能默认折叠、不能等滚动到了才渲染。审核方会用最朴素的方式看这一页。
2. 它必须**在每一个公开页上都有**，不能只在首页。
3. 它的**文案和行序不能改**。

## §2 底栏三行（FROZEN）

```
OmenX is operated by Nuvion Holdings Ltd., a company incorporated in the Cayman Islands.
© 2026 OmenX. All rights reserved.
For informational purposes only. Not financial advice. Trading involves risk of loss.
```

| 项 | 口径 |
|---|---|
| 位置 | 实体声明行在 © 行**正上方**，三行居中堆叠，与上方栏位之间有一条分隔线 |
| 实体声明行样式 | `text-xs text-muted-foreground` |
| © 行样式 | `text-xs text-muted-foreground`——**与实体行完全同级** |
| 免责声明行样式 | `text-xs text-muted-foreground/60`——这一行允许降到 60% 不透明度 |
| 容器 | `border-t border-border/20 mt-8 pt-6 flex flex-col items-center gap-1.5 text-center` |

**为什么第三行可以变淡、前两行不行**：合规要求约束的是实体声明行，它必须与版权行同等醒目——把它做淡就等于弱化了声明。免责声明是产品自己的风险提示，不在合规约束里，视觉上退一档是有意的。

**这三行在两个断点都完整渲染**，不参与移动端的折叠。

**禁止**：跳过或改写其中任意一行；调换行序；把实体声明行的透明度降下来；把它折叠进手风琴。

## §3 Footer 长什么样

桌面是 12 栅格，品牌区占 4 栏，四个链接栏各占 2 栏：

| 栏位 | 内容 |
|---|---|
| **Brand**（4 栏） | Logo（不带 Mainnet 徽章）+ 一句 tagline + 两枚社交按钮 + 客服邮箱 |
| **Platform**（2 栏） | Events · **Resolved（仅 Pro 面）** · Leaderboard · Insights |
| **Learn**（2 栏） | About · FAQ · Glossary · Methodology |
| **Resources**（2 栏） | Developers · On-Chain Transparency |
| **Legal**（2 栏） | Privacy Policy · Terms of Service |

要点：

- **Logo 在两个断点尺寸不同**：桌面大一号、移动小一号，两处都关掉 Mainnet 徽章。
- **tagline 逐字**：`Trade on real-world event outcomes with transparent pricing and instant settlement.` 桌面限宽 240px 换行，移动不限宽。
- **社交与邮箱只认官方三条**（X / Discord / support 邮箱），清单在 `DESIGN.md` §16.5，任何页面不得自定义。社交是描边圆形按钮，不是实心。
- **`Resolved` 在 Platform 栏里排第二**，在 Events 和 Leaderboard 之间，不是排在最后。
- **所有内链必须是真锚点**（react-router 的 `<Link to>`），不许用按钮加跳转——搜索引擎抓不到按钮。客服邮箱是 `mailto:` 锚点。

## §4 移动端

品牌区常驻在顶部不折叠；**四个链接栏各自折叠成手风琴，默认全部收起**，各自独立开合，可以同时展开多个。

一个实现细节必须照抄：**折叠用的是最大高度过渡，不是条件渲染**。收起状态下链接仍然留在 DOM 里，只是高度被压成 0。这是有意的——如果收起时把链接从 DOM 里摘掉，搜索引擎在移动端抓到的锚点就没了。

底栏三行在手风琴之外，不受折叠影响。

## §5 挂在哪些页

**判据是「未登录用户能不能走到这一页」**，不是「这一页属于哪个模块」。

| 类别 | 页面 |
|---|---|
| Lite 公开页 | 首页 / 赛事列表 / 合约交易页 / 现货交易页（含加密快轮）/ Portfolio / Wallet / Rewards / Leaderboard / On-Chain Transparency |
| 内容页 | About / FAQ / Glossary / Methodology / Developers / Privacy Policy / Terms of Service |
| 营销页 | Hedge 落地页 |

内容页统一走一个页面骨架组件，footer 在骨架里挂一次即可；Lite 的功能页因为桌面与移动是两套布局，**多数页面挂了两次**（各断点分支各一次），这是正常的，不是重复挂载。

**明确不挂的两处**：

- `/style-guide`——内部工具页，不对外。
- Rewards 的兑换全屏态——那是一个专注任务态，底部导航都撤掉了，由页头的返回箭头承担退出，footer 一并不挂。

**Pro 面不在强制范围内**：未登录用户只会看到 Lite 面，Pro 面的列表页、交易页对 guest 不可达，因此不属于合规要求的"公开页"。Pro 面页面目前也确实没有挂——这是符合规范的，不是遗漏。

## §6 移动端通栏与让位

这一节是最容易踩坏的地方，两条规则必须一起遵守。

**规则一：footer 必须挂在页面根级。**

移动端整个应用套在一个限宽壳里（`max-w-md mx-auto`），如果 footer 老老实实待在壳里，它两侧会漏出背景色——在宽一点的手机（430–767px）上非常明显。解决办法是在**壳上**用一条后代选择器把任何 `<footer>` 拉回全屏宽：

```
[&_footer]:relative [&_footer]:left-1/2 [&_footer]:w-screen [&_footer]:-translate-x-1/2
```

因为它是挂在壳上的后代选择器，footer 组件自己不需要知道这件事。但代价是：**footer 一旦被塞进任何带水平 padding 或 max-width 的容器里，这个拉伸就会以那个容器为基准，通栏失效**。

**规则二：让位间距放在 footer 外层的 wrapper 上，而且那个 wrapper 不能带水平 padding 或 margin。**

移动端底部有固定元素会盖住 footer，需要给它让位：

| 挡住 footer 的东西 | 让位量 |
|---|---|
| 底部导航栏 | CSS 变量 `--bottom-nav-h`（当前 76px） |
| 交易页的固定下单条 | 96px |
| Hedge 落地页的浮动 CTA | 112px |

## §7 Lite / Pro 的两处差异

1. **`Resolved` 链接只在 Pro 面渲染**。Lite 没有这个页面，路由会把访问弹回赛事列表，所以链接也不能出现。判据取自全局的切面状态；在没有切面上下文的环境里（比如样式字典的独立预览），兜底是 Lite，因此不会渲染 Resolved。
2. **Footer 不承担切面切换入口**。这是产品决定：guest 只见 Lite、零 Pro 入口。切换入口在——登录后的桌面走头像下拉；登录后的移动走底部导航「Me」抽屉，位置在 Settings 与 Help 之间；Pro 面保留返回 Lite 的镜像行。

## §8 怎么验

按这个顺序走，每一步都是可复现的：

1. **三行完整性**：未登录打开首页拉到底，三行文字与 §2 逐字一致、行序一致。前两行的颜色应当肉眼看不出差别，第三行明显淡一档。
2. **通栏**：移动端在 462 / 600 三个宽度下，取 footer 元素的边界矩形，左边应等于 0、右边应等于窗口宽度。任何一页出现两侧留白，就是 footer 被塞进了限宽容器。
3. **覆盖面**：把 §5 表格里每一页都开一遍（未登录），确认底部都有这三行。加密快轮页要特意走一次 `/spot?event=crypto-…`。
4. **不挂的两处**：`/style-guide` 与 Rewards 兑换全屏态应当**没有** footer。
5. **真锚点**：未登录首页上统计 footer 里 `<a href>` 的数量，移动端在手风琴全部收起的状态下数量应当与展开时相同——这验证的是"收起不摘 DOM"。
6. **Lite / Pro 差异**：Lite 面 footer 里不应出现 `Resolved`；切到 Pro 面应出现，且排在 Events 与 Leaderboard 之间。
7. **让位**：移动端每一页拉到底，三行不被底部导航或固定下单条遮住。

## §9 已知缺口与不一致

| 项 | 说明 |
|---|---|
| 底部导航高度有两处声明 | `76px` 在全局样式里声明了一次，底部导航组件自己又内联声明了一次。内联那份只作用于导航自身，footer 让位用的是全局那份。两处若不同步会静默不一致 |
| 让位写法不统一 | 三种写法并存：CSS 变量、字面量 96px、框架的 112px 工具类；且有的用外边距、有的用内边距。视觉结果一致，但改动时要逐页确认 |
| 交易页让位未计安全区 | 交易页的 96px 是字面量，没有叠加设备底部安全区；而它要让位的那条固定下单条自己是叠加了的。在带刘海的机型上这 96px 会被安全区吃掉一部分 |
| Transparency 的未登录门 | 仍在用旧的登录提示组件，没有统一到新的鉴权门。样式统一是另一个需求，不在本特性范围 |

## §10 涉及文件

- `src/components/seo/SeoFooter.tsx` — Footer 组件本体（唯一实现，不允许有第二个）
- `src/components/seo/SeoPageLayout.tsx` — 内容页骨架，footer 在这里挂一次覆盖全部内容页
- `src/App.tsx` — 移动壳的通栏 breakout
- `src/index.css` — 底部导航高度等布局变量
- `src/components/BottomNav.tsx` — 底部导航（含切面切换入口）
- `src/contexts/SurfaceContext.tsx` — Lite / Pro 切面状态，决定 `Resolved` 是否渲染
- Lite 各功能页与营销页 — 各自在断点分支里挂载 footer
- `DESIGN.md` §16.5 — 规范原文

## §11 不在本特性范围内

- 各页面自身的内容与布局——footer 只在页面根级追加一块，不改动页面其余部分。
- 桌面端的页面框架与内容区宽度。
- 登录后才可达的工具页（设置、充提、结算详情等）——不属于公开页，不强制挂载。
