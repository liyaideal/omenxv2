# 移动端日历：点击 event 直接进市场

## 现象
撤掉 Day/Week 段控后，移动端第一次点任何 ticket 都不会跳转——因为点击逻辑仍保留"未聚焦时先选中当天"的两段式：`tapTicket` 在 `mobileDay == null` 时只做 `setMobileDay(dayKey)`，不打开市场。默认就是未聚焦状态，所以用户感知是"点了没反应"（列表只是收窄到那一天，视觉变化很小）。

## 修复
把日期条和 ticket 的职责彻底分开：

- 日期条 chip = 唯一的筛选控件（选中 = 只看那天，再点 = 看整周），行为不变。
- ticket / open-all-day 行 = 永远直接打开对应市场，无论当前是否聚焦某一天。
  - sports → `/trade?event=…`
  - 普通市场 → `/trade?event=…`
  - session（intraday 时段行）→ 切到 Intraday 视图（现有 `onOpenIntraday`）
- 底部说明文案随之改成筛选语义，不再写"Tap a day to trade it"。

## 技术细节
- `src/components/lite/calendar/LiteCalendarView.tsx`：删除 `tapTicket` 的两段式分支，直接调用 `openItem(item)`；`MobileTicket` 与 `SpanBar` 的 `onClick` 同步；更新底部 footer 文案（未选中："Tap a market to trade it."；已选中：追加"Tap the day again to see the whole week."）。
- 桌面端 week/day 逻辑完全不动。
- style-guide 日历 section 若有相关 caption，一并对齐。
- 跑 typecheck + build。
