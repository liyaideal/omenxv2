# 移动端日历：撤掉 Day/Week 切换器

## 判断
是的，移动端这个 Day|Week 段控是冗余的。移动端本来就没有 7 列网格，week 和 day 两态的差别只有一个：日期条上有没有一枚 chip 被选中（`mobileDay`）。同一件事有两个控件，用户还得先想"我现在在哪个模式"。桌面端不同——它真的有两种版式（7 列网格 vs 单日时间轴），切换器留着。

## 改动（只动 `src/components/lite/calendar/LiteCalendarView.tsx` 移动端分支）

1. 移动端 header 不再渲染 `SegPill`（`SegPill` 组件保留，桌面继续用）。
2. 移动端的"模式"完全由日期条推导：`mobileDay == null` → 全周列表；选中某天 → 只看那天。不再维护移动端的 `mode` 状态分支。
   - 日期 chip：点未选中的 → 聚焦该天；点已选中的 → 取消聚焦，回到全周列表（当前 week 模式下的行为，保留）。
3. Ticket 点击口径同步简化，保持上一轮"先聚焦再交易"的两段式：
   - 未聚焦任何一天时点 ticket → 聚焦它所在的那天（等同桌面 week ticket 打开 Day）。
   - 已聚焦某天时点 ticket → 直接打开市场（sports/market → `/trade`，stock → 行情页，session → Intraday 视图）。
4. `initialMode` prop 在移动端的语义改为"初始是否聚焦某天"：`"day"` → 预选 `todayKey`，`"week"` → 不预选。桌面语义不变，prop 签名不变。
5. 页脚说明句在聚焦态下改为提示"再点一次日期回到整周"，未聚焦时保持现文案「Tap a day to trade it.」。

## style-guide

`src/pages/StyleGuide/sections/LiteCalendarSection.tsx` 的移动端 frames 用的是活体组件，版式自动跟随，只需更新两条 caption：
- `m-week`：说明移动端没有模式切换器，日期条即唯一控件；ticket 首点聚焦当天、再点才进市场。
- `m-day`（重命名为 "Mobile · Day focused"）：说明这是"预选某天"的状态，再点该 chip 可回到整周。

## 不动
桌面端全部行为与版式、日历数据源与分组、Ticket/SpanBar 视觉、Intraday standing row。
