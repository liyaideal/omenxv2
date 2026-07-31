## 问题根因（已核实）

- 存储桶 `event-art` 里每张图都是 **PNG，1.5–1.7 MB**（查询 storage.objects 确认，最大 1741 KB）。一个 /events 列表 20+ 张 ≈ **30 MB** 首屏流量。
- 卡片用的是 **CSS `background-image`**（`LiteEventCard.tsx` 第 240–241 行），浏览器不做 `loading="lazy"`、不做优先级调度，屏幕外的图也照样下载。
- 原图分辨率远超展示尺寸：卡片图块只有 130px 高。

## 优化方案

**1. 生成端改格式（`supabase/functions/_shared/event-art.ts` + `generate-event-image/index.ts`）**
- 21:9 裁剪后，缩放到 **840×360**（2x 于展示尺寸，足够高分屏），用 imagescript 以 **JPEG q78** 编码上传为 `${event.id}.jpg`。预计单张 1.6 MB → **50–80 KB**（约 –95%）。
- 同时生成一张 **24px 宽的极小模糊缩略图**，以 base64 data URI 写入 events 新列 `image_blur`（约 300 字节），用作占位。
- 艺术指导 prompt 不变，构图/安全区规则不变。

**2. 一次性回填现有图片**
- 新增 `optimize-event-art` edge function：遍历桶内 PNG → 缩放 → JPEG → 上传 `.jpg` → 更新 `events.image_url` 与 `image_blur` → 删除旧 PNG。跑一次即可，全部 20+ 事件生效。

**3. 卡片渲染改造（`LiteEventCard.tsx`）**
- 图块从 `background-image` 换成真实 `<img>`：`loading="lazy"` `decoding="async"` `width/height` 固定（避免 CLS），scrim 作为绝对定位覆盖层保留，视觉零变化。
- 列表前 4 张改为 `loading="eager"` + `fetchpriority="high"`，保证首屏立刻出图。
- 加载完成前显示 `image_blur` 模糊底图，加载后 200ms 淡入，避免灰块闪烁。
- 同步 `LiteSettledCard` / `LiteSettledSeriesCard` 等复用同一图源的卡片。

**4. 数据库**
- 迁移：`alter table public.events add column image_blur text;`（可空，不影响现有读取）。

## 技术细节

- 签名 URL TTL 已是 10 年，URL 稳定 → Supabase Storage CDN 可长期缓存，不需要改动。
- 不引入新前端依赖；imagescript 已在 edge function 中使用。
- 不改任何交易/定价逻辑，纯资源与展示层。

## 验证

- 回填后重新查询 storage.objects 体积，确认单张 <100 KB。
- 用 Playwright 打开 /events，统计图片请求总字节与首屏加载耗时，前后对比。
