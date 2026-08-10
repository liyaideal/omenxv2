# 专属链接参与资格不符 — style-guide 演示

只在 `/style-guide#rewards` 新增一个演示小节，展示「用户通过 Lao Wang 专属链接进入活动，但当前账号不符合参与资格 → 提示后自动返回主页」这一状态。生产页面（LiteCampaignDetailPage / CampaignCard / GrantTaskRow / Referral / 移动端版式）零改动。

## 交互定义（写进演示说明）
- 形态：sonner toast + 立即 `navigate("/")`，用户不停留在详情页。
- 文案采用正式、克制口径，不暴露具体原因：
  - 标题：`This entry is not available`
  - 说明：`Your account isn't eligible for this exclusive link. Redirecting you to the home page.`
- 不逐条区分名额已满 / 已锁定其他 entry / 账号不符 / 链接失效，后续新增拦截原因无需改文案。
- 拦截是瞬时的，演示用「冻结帧」呈现：静态 toast + 一行触发条件说明 + 跳转目标标注，不做真实计时或真实跳转。

## 改动点
1. `src/pages/StyleGuide/preview/rewardsPreviews.tsx`
   - 新增 `CampaignIneligibleRedirectPreview`：冻结的 sonner 风格 toast（与全站 toast 视觉一致：深色卡、13px 标题、11.5px #6B7280 说明），下方一行 muted 注解「Triggered on `?entry=LAOWANG` when binding is refused · redirects to `/`」。
   - 桌面右下角浮层位置、移动 375 全宽贴顶，贴合 sonner 两端真实表现。
2. `src/pages/StyleGuide/preview/registry.tsx` — 注册 `rewards-ineligible-redirect`。
3. `src/pages/StyleGuide/sections/RewardsSection.tsx` — 在小节 8（fine print）之后追加小节 9「Exclusive link — ineligible redirect」，用 `DualDevicePreview`，描述写明通用文案口径与「不列举具体原因」的理由。

## 明确不做
- 不在 `CampaignAttribution` / campaign 详情页接入真实资格判断与跳转逻辑（本轮只出规范）。
- 不新增数据库字段、RPC 或 edge function。