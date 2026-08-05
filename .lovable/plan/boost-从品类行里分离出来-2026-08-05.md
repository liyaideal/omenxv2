# Boost 从品类行里分离出来

## 问题
移动端筛选行里，Boost 按钮和 All / Intraday / Sports / Crypto… 这些**事件品类**并排放在同一条横滑列表里，看起来像是又一个品类。但 Boost 是一个**筛选开关**（在当前列表基础上过滤出可加成的事件），语义完全不同。

## 改法
把 Boost 移到分隔线右侧的固定控件区，和 Watchlist、Calendar 一起——那里放的都是「作用于当前列表的开关」，语义一致，也和桌面端契约一致（Boost 本来就在分隔线之后）。

顺序变为：

```text
[ 品类横滑区（All · Intraday · Sports · …） ]  |  [⚡] [★7] [📅]
```

屏幕只有 393px，文字版 Boost 药丸放进右侧固定区会把品类横滑区挤没。所以 **Boost 改成与 Watchlist / Calendar 同规格的 44px 纯图标按钮**（Zap 闪电图标）：

- 未激活：描边 #23262D + 灰色图标，与旁边两个图标按钮完全一致。
- 激活：Volt 绿 (#CFFF4A) 实心底 + 深色图标，一眼看出正处于加成筛选态。
- 三个图标按钮 + 分隔线共约 145px，品类横滑区仍留约 210px 可滑动，不会被挤压。
- 顺序：分隔线 → Boost → Watchlist → Calendar。
- 加 `aria-label="Boost"` 与 `aria-pressed`，无障碍与另外两个按钮对齐。
- 行为、状态、数据逻辑完全不变，只调整位置与呈现形态。

## 技术细节
- 只改 `src/components/lite/mobile/MobileCategoryRow.tsx`：把 Boost 按钮从横滑容器内移出，放到分隔线之后、Watchlist 之前；props 不变（`boostActive` / `onBoost`），调用方 `LiteEventsPage.tsx` 无需改动。
- 同步更新 `/style-guide` → "Lite · Final touches (11)" 的 Mobile category row 预设：加上 Boost inactive / Boost active 两个状态，保证 playground 穷尽状态（按 new-feature-playground-mandate）。
