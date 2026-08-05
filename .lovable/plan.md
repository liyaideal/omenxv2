# Boost 从品类行里分离出来

## 问题
移动端筛选行里，Boost 按钮和 All / Intraday / Sports / Crypto… 这些**事件品类**并排放在同一条横滑列表里，看起来像是又一个品类。但 Boost 是一个**筛选开关**（在当前列表基础上过滤出可加成的事件），语义完全不同。

## 改法
把 Boost 移到分隔线右侧的固定控件区，和 Watchlist、Calendar 一起——那里放的都是「作用于当前列表的开关」，语义一致，也和桌面端契约一致（Boost 本来就在分隔线之后）。

顺序变为：

```text
[ 品类横滑区（All · Intraday · Sports · …） ]  |  [Boost] [★ 7] [📅]
```

- Boost 不再随品类横滑，固定在右端，永远可见。
- 保持 Volt 绿 (#CFFF4A) 激活态：激活时实心绿底深色字，未激活时描边 + 灰字，与现有样式一致。
- 尺寸压缩为紧凑药丸（约 60px 宽、44px 高），和旁边 44px 的图标按钮同高，避免右侧控件区过挤。
- 行为、状态、数据逻辑完全不变，只调整位置与样式归属。

## 技术细节
- 只改 `src/components/lite/mobile/MobileCategoryRow.tsx`：把 Boost 按钮从横滑容器内移出，放到分隔线之后、Watchlist 之前；props 不变（`boostActive` / `onBoost`），调用方 `LiteEventsPage.tsx` 无需改动。
- 同步更新 `/style-guide` → "Lite · Final touches (11)" 的 Mobile category row 预设：加上 Boost inactive / Boost active 两个状态，保证 playground 穷尽状态（按 new-feature-playground-mandate）。
