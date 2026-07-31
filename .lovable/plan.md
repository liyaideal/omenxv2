## 目标

每次新 event 上架时，自动生成一张以我们的猞猁 IP 为主角的配图，写入 `events.image_url`，`/events` 卡片直接沿用现有渲染（不改前端）。

## 画风契约（锁定，写进 DESIGN.md + memory）

- 底：暖灰纸感 `#F2F2F0`（轻微纸纹/颗粒），无渐变、无彩虹配色
- 主体：附件的猞猁 IP —— 黑色粗描边、深炭灰皮毛、驼色 `#B49A6A` 斑纹与眉纹、白胡须、微怒/怀疑表情、chibi 1.5a:a 头身比
- 品牌点缀：每张只允许 **一个**强调色块，Pulse Blue `#33D6FF`（默认）；Volt Green `#CFFF4A` 仅用于"看涨/赢"语义。道具本身允许少量必要色（如 F1 奖杯金），但整幅仍是灰+驼+单一强调色
- 构图：单只 IP 居中，正方形 1:1，边缘留白，无文字、无 logo、无 UI 框、无人类
- 道具由事件语义驱动：股票类 → 拿着该股票 icon 牌子 + 思考状；体育类 → 穿对应赛事队服 / 举奖杯；宏观/加密 → 拿对应符号

## 生成链路（自动）

1. **建 Storage bucket** `event-art`（public read，service_role 写）。
2. **参考图**：把附件三张 IP 设定图作为品牌参考存进项目（CDN asset pointer），生成时以 image 参考块传入，做风格锚定。
3. **新增 edge function `generate-event-image`**
   - 入参：`event_id`（或 `event_ids[]`）、可选 `force`
   - 读 `events`（name / category / event_subtype / side_labels）→ 用 `openai/gpt-5.6-sol`（`reasoning_effort: "none"`）把事件标题压成一句"道具 + 姿态"描述（例：`holding a Coinbase ticker sign, thoughtful pose, one paw on chin`）
   - 把这句填进锁定的画风模板 prompt，调 `google/gemini-3-pro-image`（`/v1/images/generations`，参考图 + 文本，非流式）
   - 结果 PNG 上传到 `event-art/{event_id}.png`，把 public URL 写回 `events.image_url`
   - 已有 `image_url` 且未传 `force` 时跳过（幂等）
4. **接到上架点**：`sim-daily-seed` 与日常股票事件 roll 之后，对新建且 `image_url is null` 的事件批量调用该函数；同时保留手动按 event_id 触发的能力，方便重跑废图。
5. **兜底**：生成失败或超时不阻塞上架，`image_url` 留 null，卡片继续用现有 `CATEGORY_IMAGE` 兜底。

## 技术细节

- 文件：`supabase/functions/generate-event-image/index.ts`（+ `_shared` 里放 prompt 模板与画风常量）
- 密钥：只用已有的 `LOVABLE_API_KEY`，不需要新 secret
- 迁移：仅建 storage bucket + 策略，不改表结构（`image_url` 已存在）
- 前端：零改动；只在 `/style-guide` 加一小节展示画风契约与 2 张样例，便于校验一致性
- 文档：`DESIGN.md` 新增 "Event art direction (LOCKED)"，并写 `.lovable/memory/design/event-art-direction.md`

## 交付验证

用两个现有事件跑真实生成 —— `Coinbase (COIN) — will close higher today?` 和 `Who wins the 2026 F1 drivers' championship?` —— 贴出结果图确认：同一 IP 形象、同一底色、单一强调色、道具正确。
