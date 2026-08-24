---
name: Style Guide 触发条件表
description: Style-guide 每个 preview case 必须配「触发条件 → 视觉结果 → 字段来源」表；桌面 frame 禁止出现移动端组件。
type: preference
---

# Style Guide 当需求文档写

## 每个 case 必须有 spec 表

`SectionCase.spec: { state, when, visual, source }[]`，渲染成四列表：状态 / 触发条件（字段·公式）/ 视觉结果 / 数据来源。

- `when` 必须是**可判定表达式**（`hot === true`、`riskRatio ≥ 95`、`Math.abs(net) < 0.005`），禁止形容词式描述（"接近清算时"、"数值较小时"）。
- 只列状态不写触发条件 = 不合格，研发照样写不出来。
- 表里没有列出的组合视为不存在。

## 端隔离

一个 `SectionFrame` 只放同一端的组件。**桌面 frame 内禁止出现任何移动端组件**；双端对照靠两个 frame 上下并列，不是一个 iframe 里左右并排。

**Why:** 桌面 frame 里混进 mobile 组件，读者无法判断某个视觉到底属于哪个断点。
