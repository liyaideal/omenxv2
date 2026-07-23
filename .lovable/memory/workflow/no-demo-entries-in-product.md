---
name: 产品页禁止新增 demo 入口
description: 多状态/多用户类型演示一律放 /style-guide，禁止在产品页面塞 demo 按钮或入口
type: constraint
---
任何功能只要有"按不同用户 / 不同状态展示不同 UI"的演示需求，必须放进 `/style-guide` 对应 section，**严禁**在产品页面（首页、Auth 弹窗、Header、Settings、Wallet 等）新增 demo 账号切换、scenario chips、状态切换按钮等入口。

**Why:** 生产 UI 中混入 demo 入口会污染真实用户体验、被截图传播、造成信任问题。

**How to apply:**
- 看到"展示一下不同状态 / 不同用户"类需求 → 默认在 `/style-guide` 加 SubSection + PresetRail。
- 已有 demo 入口若混在产品页，下次涉及该模块时一并迁出。
- 与 `mem://workflow/new-feature-playground-mandate` 配套：新功能的所有状态都进 playground，不在产品页留 demo 入口。

**先例：** Auth 弹窗内的 "Demo accounts (Matched / Welcome gift)" 已迁至 `/style-guide` → UserIdentity section → `DemoAccountsBlock`。
