---
name: 演示数据只挂固定演示账号
description: 新功能同轮必须为 alex_carter 种演示数据，并在 /style-guide 穷尽全状态
type: preference
---
每交付一个有"多状态"的新功能，同一轮必须完成两件事：

1. **演示数据**：为固定演示账号 `alex_carter`（`alex.carter@gmail.com` / id `2faf9a43-1ab7-47b7-919b-978c8c02b5ff`，演示密码 `OmenxDemo2026!`）种一份覆盖典型状态的数据（进行中 / 可领取 / 已领取 / 空态各一）。禁止把演示数据挂到真实用户或公共统计上。
2. **Style-guide 全状态**：在 `/style-guide` 对应 section 用 PresetRail 穷尽该模块所有可视状态（见 `mem://workflow/new-feature-playground-mandate`）。

**How to apply:**
- 种数据一律走 service-role 边缘函数（先例：`supabase/functions/seed-demo-alex/index.ts`），不要写迁移。
- 演示行统一带 `metadata.demo = true`，方便后续清理与排除统计。
- 演示账号必须真实可登录（auth.users 记录 + profiles 对齐同一 id），否则 RLS 下没人看得见种下的数据。
