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

## 验收

1. Ⓕ 段桌面/移动各 4 组帧，PF-16 的行网格、PF-17 的两条吸底条、PF-18 的两个确认层各自可见，无整帧暗色遮罩、无大片空白。
2. registry key 数量不变，preview 文件零改动。
3. 其余 Ⓐ–Ⓚ 段渲染不变。

## 顺带发现（本轮不做，等你确认）

Ⓖ Settled 段的移动帧没有传 `mobileCases`，移动帧渲染的仍是桌面 case（帧内文本与桌面完全一致）。要不要同轮补移动 key，请示下。
