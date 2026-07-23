---
name: H2E wallet integration
description: Three-tier balance display, withdrawal limits, and H2E reward tier unlock rules
type: feature
---
钱包页面采用三档余额显示：Available for Trading（总余额）、Available for Withdraw（扣除仍锁定的 H2E 奖励）和 Hedge Airdrop Locked（未解锁的空投结算收益）。Hedge Airdrop Rewards 卡片用于追踪 $100 的账户累计收益上限，以及阶梯式交易量提现解锁进度。

阶梯共 6 档（含 0% 起点）：$0→0%、$10K→10%、$50K→25%、$100K→50%、$200K→75%、$400K→100%。可提现 H2E 金额 = frozenBalance × unlockedPercent；未解锁部分继续锁定提现，但仍可用于交易。累计解锁，无线性插值。

Starter Unlock = $5（常量，独立于 H2E frozenBalance），来源为 trialBalance，登录即赠、随时可提现。在 0% 档位以 `+$5 / Starter` / `Starter unlock +$5 / included` 文案与绿色 trading-green 样式呈现，与 H2E primary 色阶梯节点视觉区分。
