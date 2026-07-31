## 问题

Topics 底部抽屉被移动端底部导航挡住。

原因（已核对代码）：
- `src/components/BottomNav.tsx` 第 61 行使用 `z-[200]`
- `src/components/ui/sheet.tsx` 的遮罩层和内容层都是 `z-50`

所以底部导航一直盖在抽屉之上。

## 修改方案

1. 在 `src/components/ui/sheet.tsx` 中把遮罩层与内容层的 `z-50` 提升到 `z-[300]`，使所有 Sheet（含 Topics 抽屉）整体高于底部导航（`z-[200]`）。遮罩与内容同步提升，避免出现"导航浮在灰色遮罩之上"的割裂效果。
2. 不改动 `LiteListControls.tsx` 中抽屉的任何尺寸、padding、颜色等冻结规格；底部已有的 `calc(16px + env(safe-area-inset-bottom))` 保持不变。

## 影响范围

全站所有使用 shadcn `Sheet` 的位置都会升到导航之上——这本来就是弹层的正确层级，属于修复而非回归。Dialog / Drawer 组件不受影响。

## 验证

移动端视口打开 Lite 列表页的 Topics 抽屉，确认列表最后一项与关闭区域不再被底部导航遮挡。
