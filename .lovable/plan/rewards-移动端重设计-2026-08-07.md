# /rewards 移动端重设计

目标：`/rewards`（Campaigns / Referral 两个 tab）和 `/rewards/campaign/:id` 在手机上按移动端阅读习惯重排——竖向堆叠、单列节奏、拇指可达的主行动、避免横向挤压。桌面端布局与视觉保持不变（仅在 `isMobile` 分支或 `md:` 断点以下调整）。

## 现在移动端的问题

- 任务行 `TaskRowShell` 是横向三段（图标 / 文案 / 右侧 92px 奖励 + 132px 按钮），在 393px 宽度下标题被压窄、进度条被截、按钮贴边。
- Campaign 详情页在手机上把「奖励汇总卡」放在任务列表**上面**（order-1），用户先看到统计、后看到能做的事。
- Referral tab 同样把右栏概览卡顶到最上，邀请链接和邀请列表被推到下面。
- 卡片/面板都用桌面内边距（18px、16px），手机上层层套壳导致内容宽度进一步变窄。
- Tabs 不吸顶，长列表滚动后无法切换；Points 退役通知占据首屏。
- 详情页 hero 文案（36px 标题 / 一行日期+人数+天数）在手机上换行成 3–4 行。

## 移动端新结构

### 1. /rewards 列表页
- Tabs 改为吸顶（sticky 在 MobileHeader 之下，背景同 background，底边 1px），滚动时常驻。
- Points 退役通知下移到卡片列表之后（一次性、非首要信息）。
- Campaign 卡片：单列全宽，key visual 比例改为更矮的 16/7；卡片内文案两行式——标题一行，`日期 · N joined` 一行；奖励 chip 与进度条各自独占一行，`Ends in Nd` 与 `ready to claim` 合并成一行 meta，不再左右对撑。
- 已结束归档：折叠区在手机上把缩略图缩到 72×40，右侧金额改为标题下方的一行 meta，避免三列挤压。

### 2. 任务行（TaskRowShell / GrantTaskRow / Referral invite 行）
新增移动端两层排版（同一组件内按 `isMobile` 切换，桌面分支不动）：

```text
[36px icon]  Task title
             subtitle
             ▓▓▓▓▓░░░░  $60 / $100
------------------------------------
$25 voucher                  [ Trade ]
```

- 上层：图标 + 标题 + 副标题 + 全宽进度条。
- 下层：细分隔线之后，左侧奖励金额、右侧动作按钮（Claim / Trade / 状态词），按钮高度 44px。
- 移除移动端的 `w-[92px]` / `w-[132px]` 固定列（那是桌面对齐规则）。

### 3. /rewards/campaign/:id 详情页
- 顺序改为：hero → 任务面板 → 奖励汇总卡 → 细则文案。做事在前，统计在后。
- Hero：标题 22px，日期/joined/days left 拆成两行（第一行日期区间，第二行 `N joined · Nd left`），奖励 chip 自成一行横向可滚动不折断。KOL band 保持橙色胶囊，副行文案手机上截断为一行。
- 奖励汇总卡：三个数值行改成三栏并排的紧凑统计条（Claimed / USDC / Available），下方保留 44px 白色 “Open Position Vouchers” 按钮；Entry 卡保留在其下。
- 未登录时 `SignInPromptCard` 同样落在任务面板之后。

### 4. Referral tab
- 顺序改为：INVITE A FRIEND（链接 + 全宽 Copy 按钮）→ 概览卡（紧凑三栏统计）→ YOUR INVITES → THE FINE PRINT。
- 链接输入框与 Copy 按钮上下堆叠，Copy 全宽 44px。
- 邀请行复用上面的两层任务行排版。

## 技术说明

改动文件：
- `src/pages/lite/LiteRewardsPage.tsx`（sticky tabs、通知位置、单列间距）
- `src/pages/lite/LiteCampaignDetailPage.tsx`（移动端 order、hero 排版、汇总卡紧凑版）
- `src/components/campaigns/TaskRowShell.tsx`（两层移动端布局 + 移动端按钮）
- `src/components/campaigns/GrantTaskRow.tsx`（移动端去掉固定列宽）
- `src/components/campaigns/ReferralPanel.tsx`（移动端顺序与堆叠）
- `src/components/campaigns/CampaignCard.tsx`（移动端比例与 meta 行）
- `src/components/campaigns/EndedCampaignsArchive.tsx`（移动端行排版）

约束：
- 沿用现有色值与字号（#131519 / #1D2026 / #CFFF4A / #33D6FF / font-display），不引入新配色。
- 所有可点元素移动端最小 44px 命中区。
- 不改数据层、hooks、edge function 与文案词典（Buy / Cash out、not guaranteed、Trial Position Voucher 保持原样）。
- 桌面渲染结果逐像素不变。

交付后按 `new-feature-playground-mandate` 在 `/style-guide` 补移动端任务行两层状态（not started / in progress / claimable / claimed / not eligible / signed out）的 PresetRail 演示。