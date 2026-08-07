---
name: 产品页禁止新增 demo 入口
description: 多状态演示放 /style-guide；demo 数据只挂固定演示账号，禁止污染真实用户与公共统计
type: constraint
---
任何功能只要有"按不同用户 / 不同状态展示不同 UI"的演示需求，必须放进 `/style-guide` 对应 section，**严禁**在产品页面（首页、Auth 弹窗、Header、Settings、Wallet、Rewards 等）新增 demo 账号切换、scenario chips、状态切换按钮等入口。

**演示数据同理：** demo 数据只允许挂在固定演示账号（`alex_carter` 等）名下，一律带 `metadata.demo = true`；**禁止**给真实用户塞假数据，**禁止**让演示数据进入公共统计（活动参与数、成交量、排行榜等）。

**Why:** 生产 UI 中混入 demo 入口或假数据会污染真实用户体验、被截图传播、造成信任问题。

**How to apply:**
- 看到"展示一下不同状态 / 不同用户"类需求 → 默认在 `/style-guide` 加 SubSection + PresetRail。
- 已有 demo 入口若混在产品页，下次涉及该模块时一并迁出。
- 配套：`mem://workflow/new-feature-playground-mandate`、`mem://workflow/demo-account-seeding`。

**先例：** Auth 弹窗内的 "Demo accounts (Matched / Welcome gift)" 已迁至 `/style-guide` → UserIdentity section → `DemoAccountsBlock`。
