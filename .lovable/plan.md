# 修复 /style-guide Ⓕ 批量平仓段的大片空白

## 现象

Ⓕ 批量平仓（PF-16 … PF-18）这一段桌面帧和移动帧里，上半部大片空白、只在中间浮着一个 Cash out 弹层，PF-16 选择模式行、PF-17 吸底动作条看起来「没加载出来」。

## 原因（已在实机核对）

这一段用一个 iframe 批量承载 4 个 case：

```text
portfolio-lite-live-select-desktop   (PF-16)
portfolio-lite-batch-bar             (PF-17)  BatchActionBar → fixed inset-x-0 bottom
portfolio-lite-batch-confirm         (PF-18)  Dialog open    → fixed inset-0 遮罩
portfolio-lite-batch-closing         (PF-18)  Dialog open    → fixed inset-0 遮罩
```

`fixed` 元素相对的是整个 iframe 文档视口，不是各自 case 的容器。于是：

- 两个常开 Dialog 的全屏暗色遮罩铺满整帧，把 PF-16 / PF-17 的内容整个盖住变黑；
- 两个 Dialog 内容框互相重叠，只看得见最后一个；
- 两条 `fixed` 吸底动作条也脱离各自 case，落到帧底。

内容其实都渲染出来了（帧内文本抓取里 PF-16 的行、Select all / Cancel 工具条都在），是被遮罩盖住 + 定位错位，不是加载失败。

## 改法

只改 Style Guide 的分帧方式，不动生产组件、不动 preview 的渲染内容。

在 `src/pages/StyleGuide/sections/PortfolioStatesSection.tsx` 的 Ⓕ SubSection 里，把当前一个 `Pair` 拆成 4 个 `Pair`，每个 case 独立成帧：

- Pair 1：`portfolio-lite-live-select-desktop` / `portfolio-lite-live-select`
- Pair 2：`portfolio-lite-batch-bar` / `portfolio-lite-batch-bar-mobile`
- Pair 3：`portfolio-lite-batch-confirm` / `portfolio-lite-batch-confirm-mobile`
- Pair 4：`portfolio-lite-batch-closing` / `portfolio-lite-batch-closing-mobile`

每个 Pair 的 `desktopMin` / `mobileMin` 按内容给合理占位（选择模式约 520，动作条约 380，两个确认层各约 560），高度最终仍由 iframe 回报接管。

这样每个 `fixed` 遮罩/吸底条各自相对自己那一帧的视口，互不遮挡；case key、label、spec 表、注释一字不改，编号与文档口径不变。

## 同轮补 Ⓖ Settled 的移动 key

现状：Ⓖ 的 `Pair` 没传 `mobileCases`，移动帧复用桌面 key；且 `SettledList.tsx` 内部零端分叉（无 `useIsMobile`、无 `lg:` / `md:` 断点），两端渲染本就同构。

改法（对齐 PF-24…27 的双 key 模式）：在 `registry.tsx` 为 Ⓖ 的 5 个 case 各注册一个 `-mobile` key，指向**同一个 preview 组件**（不新建 preview 函数）：

```text
portfolio-lite-settled-mobile
portfolio-lite-settled-row-mobile
portfolio-lite-series-row-mobile
portfolio-lite-standard-settled-mobile
portfolio-lite-settled-loadmore-mobile
```

`PortfolioStatesSection.tsx` 里 Ⓖ 的 `Pair` 加 `mobileCases`，label 沿用原编号加后缀「（移动）」，spec 表同一份（用现有的 mirror 复制方式，不重写 spec）。同时在 PF-19 的 note 里加一句：SettledList 无端分叉，移动 key 只是 375px 实测帧，视觉与桌面一致。

`docs/delivery/lite-portfolio-spec-v2.md` §6 对应 5 行补上新 mobile key。

## 验收

1. Ⓕ 段桌面/移动各 4 组帧，PF-16 的行网格、PF-17 的两条吸底条、PF-18 的两个确认层各自可见，无整帧暗色遮罩、无大片空白。
2. Ⓖ 段移动帧走 5 个新 mobile key，桌面 key 一字未改；registry key 净增 5，preview 文件零改动。
3. `docs/delivery/lite-portfolio-spec-v2.md` §6 五行已补 key；typecheck 通过。
4. 其余 Ⓐ–Ⓚ 段渲染不变。

