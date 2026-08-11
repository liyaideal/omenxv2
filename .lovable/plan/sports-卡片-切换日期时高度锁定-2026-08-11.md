# Sports 卡片：切换日期时高度锁定

## 问题
右栏 Sports stage 卡片按日期切换时，不同日期的场次数量不同（有的日子 2 场、有的 0 场），下方 upcoming 行数随之增减，整张卡片高度跳动。

## 方案（只动 `src/components/lite/sports/SportsStageCard.tsx`，仅 stage 变体）
1. **固定行位**：stage 下 upcoming 区始终渲染 `ROW_BUDGET - live.length` 个行位。真实场次不足时补等高的空行占位（与 UpcomingRow 同高，无边框内容，只有极淡的分隔线），保证任何日期下卡片高度一致。
2. **空日期文案**：该日期一场都没有时，在第一个占位行位内居中显示一行 11.5px `#6B7280` 的说明（例如 “No matches on this day”），其余行位保持空占位，不额外增减高度。
3. **底部区块不动**：日期条、All matches 页脚、Next kickoff 行保持现有版式与位置。
4. `variant === "full"`（Sports 分类页）维持现状，不做行位锁定，仍展示全部场次。

## 技术说明
- 从 `UpcomingRow` 量出单行高度，抽一个常量供占位行复用，避免出现 1px 抖动。
- 只改渲染层，数据/路由/取数逻辑不变。
