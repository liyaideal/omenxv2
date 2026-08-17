# 日历 week 视图：移动端与桌面端的跳转口径统一

## 现状（已核对代码）
`src/components/lite/calendar/LiteCalendarView.tsx`

- 桌面 week：点日期头或任意 ticket（含 Intraday 场次）→ `setDayKey(c.key); setMode("day")`，留在日历里进入 Day 视图，能看到当天全部场次。注释写明「week 模式不直接交易，ticket 只负责打开当天」。
- 移动 week：ticket 点击走 `openItem(it)`。`item.kind === "session"`（Intraday 那类）直接调 `onOpenIntraday()`，而 `LiteEventsPage` 里该回调对移动端是 `setCalendarOn(false); setSector("all")` —— 于是日历被关掉，用户被丢回 All 列表，看起来「没数据」。

也就是说：移动端 week 的 ticket 少了「先进 Day 视图」这一层，直接跨页跳走了。

## 目标
移动端 week 的 ticket 点击行为与桌面对齐：先聚焦当天（Day），交易/跳转只发生在 Day 视图里。

## 改动

1. `LiteCalendarView.tsx`（唯一改动文件）
   - 移动端 week 模式（`mode === "week"`）下，`MobileTicket` / `SpanBar` 的点击改为：`setMobileDay(c.key); setMode("day")`，与桌面 week ticket 一致，留在日历内。
   - 移动端 Day 模式（`mode === "day"`）下，ticket 点击才执行原来的 `openItem`：sports/market → `/trade`，stock/market → 对应行情页。
   - `item.kind === "session"` 的 Intraday 场次在 Day 模式点击时，仍调 `onOpenIntraday()`（这是唯一合理的落点，因为场次本身不是单个市场）。
   - 底部说明文案由「Tap a day to trade it.」保持不变（现在语义反而正确了）。

2. `src/pages/lite/LiteEventsPage.tsx`
   - `onOpenIntraday` 移动端分支由 `setSector("all")` 改为 `setSector("intraday")`。页面已经存在 `isMobileIntraday`（`sector === "intraday"` 的移动端 Intraday 视图），所以移动端有专属落地页，不需要退回 All 列表。

## 不动的部分
- 桌面端全部行为不变。
- 日历数据源、分组、SpanBar/Ticket 视觉、Day 视图版式均不动。
- style-guide 里日历相关 preview 是活体组件，自动跟随，无需另改。
