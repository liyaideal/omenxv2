# 活动详情页：新增「Campaign rules」可折叠规则区

在 `/rewards/campaign/:id` 上加一个只读的规则模块：内容由活动数据配置，页面默认折叠成一行，点开展示分段落长文。

## 规则内容从哪来

规则文本写在活动入口数据 `campaign_entries.rules` 里，新增一个可选字段 `details`：

```text
rules: {
  tasks: [...],                 // 现有，不动
  details: {
    heading?: "Campaign rules", // 可选，缺省用默认标题
    paragraphs: [
      "第一段……",
      "第二段……"
    ]
  }
}
```

- 没有 `details` 时，整个模块不渲染（现有活动零影响）。
- 段落是纯文本数组，一段一个 `<p>`，不做 markdown 解析。
- 同一活动的不同入口（public / KOL 专属）可以各写各的规则，页面按当前命中的入口取。

## 页面表现

新组件 `CampaignRulesDisclosure`，沿用详情页现有 rule-card 配方，不引入新 chrome：

- 折叠态：一行 44px 触控高度，左侧 `CAMPAIGN RULES` 小标（10px / 700 / .14em / #6B7280），右侧 chevron 16px #6B7280；容器 `#131519` 底、1px `#1D2026` 边、radius 16。
- 展开态：`border-top 1px #1D2026` 下接正文面板，段落 12.5px / line-height 20 / `#9AA1AC`，段间 10px。
- 展开状态只存组件内部，不进 URL。

位置：桌面与移动端都放在 Grant tasks 列表之后、fine print 之前（移动端顺序为 hero → tasks → rules → rewards card → fine print，桌面 rules 跟在 tasks 面板下方同一列）。

## 数据侧

一条迁移，把现有活动（Starter Rewards 及演示活动）的 `rules` 补上 `details.paragraphs` 示例文案，作为口径样板；后续新活动照此字段写即可。不新增表、不改 RLS。

## 技术清单

- 新增 `src/components/campaigns/CampaignRulesDisclosure.tsx`（纯展示件，props: `paragraphs: string[]`, `heading?: string`）。
- `src/hooks/useCampaigns.ts`：`CampaignEntry` 增加 `details?: { heading?: string; paragraphs: string[] }`，`mapEntry` 里从 `rules.details` 解析（非数组或空数组时置 undefined）。
- `src/pages/lite/LiteCampaignDetailPage.tsx`：在 `tasksPanel` 之后挂载该组件（`entry?.details` 存在才渲染）。
- Style Guide：Rewards 节新增 SubSection，真组件 + mock props，穷举折叠 / 展开 两态（走 DualDevicePreview 375 真 iframe）。
- 一条 SQL 迁移更新现有 `campaign_entries.rules`。
- 文案不引入 Lite 禁词；不动 Rewards 冻结画布的其他部分。
