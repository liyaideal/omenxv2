---
name: 演示数据只挂固定演示账号
description: 新功能同轮必须为 alex_carter 种演示数据，并在 /style-guide 穷尽全状态
type: preference
---
每交付一个有"多状态"的新功能，同一轮必须完成两件事：

1. **演示数据**：为固定演示账号 `alex_carter`（`alex.carter@gmail.com` / profiles id `2faf9a43-1ab7-47b7-919b-978c8c02b5ff`）种一份覆盖典型状态的数据（进行中 / 可领取 / 已领取 / 空态各一）。禁止把演示数据挂到真实用户或公共统计上。
2. **Style-guide 全状态**：在 `/style-guide` 对应 section 用 PresetRail 穷尽该模块所有可视状态（见 `mem://workflow/new-feature-playground-mandate`）。

**How to apply:**
- 种数据一律走 service-role 边缘函数（临时函数，用完即删），不要写迁移。
- 演示行统一带 `metadata.demo = true`，方便后续清理与排除统计。
- **绝对禁止（2026-08-06 CPO 裁定）**：不得为演示账号创建 auth 用户、设置密码或任何密码式登录。`alex.carter@gmail.com` 是 CPO 的 Google OAuth 账号，auth 侧一律不动。演示数据先挂 profiles id 种下，待 CPO 用 Google 登录一次后，由人工把种子行的 `user_id` 对齐到真实 uid。
