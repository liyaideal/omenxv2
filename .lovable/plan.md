# Calendar empty states — use the site-wide lynx EmptyState

确认了：日历视图的两个空状态是手写的，没走站内统一的 `EmptyState` 原语，所以既没有 lynx IP 图，也用了已被废止的蓝色下划线文字链。

## 现状

`src/components/lite/calendar/LiteCalendarView.tsx` 里有两处硬编码空态：
- 第 ~492 行：Week 模式 "Nothing scheduled this week" + 蓝色 "Back to all markets →" 文字链，外面套 `1px dashed #23262D` 面板。
- 第 ~670 行：Day 模式 "Nothing scheduled this day" + 一句下一个决策时刻的说明 + 同样的蓝色文字链。

两处都违反 `mem://design/empty-state-standard`：必须用 `src/components/states/EmptyState.tsx`，禁止手搓，禁止蓝色文字链（改 pill）。

## 改法

两处都替换为 `EmptyState`：

- variant：`section`（日历本身是页面内的一个视图块，不是整页空），保留 `bordered`（组件自带 dashed 边框，删掉手写的 dashed 容器，避免双层边框）。
- mascot：默认 `figure`（LynxFigure 100）。
- 文案沿用现有语义，line 1 = 事实，line 2 = 方法：
  - Week：title `Nothing scheduled this week`，description 用现有 footer 语义的一句方法说明。
  - Day：title `Nothing scheduled this day`，description 保留现有"下一个决策时刻在 X 时间"的动态句子（无下一个时则退回 `N markets decide this week.`）。
- 动作：`actionLabel="Back to all markets"` + `onAction={onBackToList}`，渲染成 pill，不再是蓝色链接。

其余日历逻辑、footer 计数行、Intraday 常驻行、date stepper 全部不动。

## Style guide

`/style-guide → Lite · Calendar` 已有 `Empty day` 与 `Mobile · Empty week` 两个 preset，会自动反映新外观；只更新这两条 caption 的描述文字，说明现在走统一 lynx EmptyState。

## 文件

- `src/components/lite/calendar/LiteCalendarView.tsx`
- `src/pages/StyleGuide/sections/LiteCalendarSection.tsx`（仅 caption 文案）
