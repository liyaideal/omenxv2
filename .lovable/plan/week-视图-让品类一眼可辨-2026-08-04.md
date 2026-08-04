# Week 视图：让品类一眼可辨

## 现状（已核对代码）

Week 模式的 ticket 目前把品类放在卡片**最底部**，8px 大写、颜色 `#6B7280`（Intraday 例外，用橙色）。三个问题叠加：

1. 品类是卡片里最小、最暗的一行，视觉优先级最低。
2. 体育票直接打印联赛全称（`UEFA CHAMPIONS LEAGUE`），在 7 列窄栏里会折行，读起来像标题而不是品类标签。
3. 除 Intraday 外所有品类共用同一个灰色，扫一眼分不出 Economy / Politics / Sports。

## 要改成什么

品类从"脚注"升级为 ticket 的**第一识别位**：

- **品类标记移到卡片顶部**，与时间同一行左侧，时间右移。窄栏里第一眼落点就是品类。
- **三档视觉身份**（严格遵守既有色轴，不新造颜色）：
  - Intraday：橙色实心小徽章（与现有 Intraday 身份一致）
  - Sports：白垩色（chalk）实心小徽章
  - 其他品类：`#1D2026` 底 + `#C9CED6` 文字的中性徽章
- **卡片左侧 3px 竖条**，跟随上面三档着色（其他品类为透明），做列内快速扫描锚点。
- **体育票文案缩短**：徽章显示 `SPORTS`，联赛以短码形式跟在标题下（UCL / CSL / K1 / UFC），不再打印联赛全称。
- 一般事件徽章用 `categoryLabel`（Economy / Politics / Tech / Culture …），超长时截断而非折行。

Day 模式的卡片已经有明确的品类徽章，本轮不动。

## 移动端

Mobile week ticket 采用同一套逻辑：左侧 3px 竖条 + 品类徽章置于标题行上方，保持 56px 行高不变。

## 与冻结稿的偏差（需要你点头）

`docs/design-contracts/calendar-final.html` 的 Final·Week 帧把品类微标签放在 ticket 底部、统一灰色。本轮改动**主动偏离该帧**以解决可读性问题。改完后同步在 DESIGN.md 记录这条偏差，冻结稿文件本身不改。

## 技术细节

- `src/components/lite/calendar/calendarData.ts`：`TicketView` 增加 `tone: "intraday" | "sports" | "neutral"`、`catShort`、`leagueShort`；新增联赛→短码映射；`ticketOf` 填充这些字段。
- `src/components/lite/calendar/CalendarBlocks.tsx`：重排 `WeekTicket` 与 `MobileTicket` 的内部结构，新增复用的 `TicketCategoryBadge` 与左侧竖条。
- `src/index.css`：`.lite-cal-ticket` 增加左竖条所需的 padding 调整；hover 规则保持。
- CHK-5：`src/pages/StyleGuide/sections/LiteCalendarSection.tsx` 的 Week 预设补一条 "Week · 品类识别" 说明，并确保 mock 覆盖 Sports / Intraday / Economy / Politics / Tech / Culture 六种徽章状态。
- 不动数据层、不动路由、不动 Day 模式区块。