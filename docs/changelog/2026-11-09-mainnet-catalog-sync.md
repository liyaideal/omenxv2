# 2026-11-09 · Lovable 展示 omenx.com 真实事件（第 1 批：体育 + 长期事件）

- **做了什么**：Lovable 数据库每 3 分钟从 www.omenx.com 公开接口同步赛程、两队、队徽、联赛、开赛时间、比分、比赛状态、直播标记 + 截图、长期事件、封面图、规则；新事件 id `mn-<主网 eventId>`。价格和成交额只在第一次进库时取主网值，之后由演示引擎动（CPO 批 A）。结算按主网结果。
- **退役**：演示引擎自编的 172 个未结算赛事 + 45 个长期事件打 `metadata.retired`，任何列表不再出现；持仓、历史照常可开；有人持仓的赛事照常结算、不再重排。演示直播样板赛 `demo-live-cs2` / `demo-prekick-cs2` 保留（CPO 批 B）。
- **前端**：所有列表查询过 `isListed`；`Crest` 支持 `logoUrl` / `tileColor`（S1 规则扩到 Sports 品类页、手机 Sports 模块、直播预告、舞台卡）；首页 `TeamBadge` 接上 logo / tile；live 位优先显示主网状态文字；taxonomy 加 UEFA Nations League。
- **字典**：EV-47 队徽四种画法（桌面 + 375）。
- **文档**：`docs/delivery/mainnet-catalog-sync-v1.md`、CLAUDE.md 红线 5、`.lovable/memory/index.md`、`docs/backend-boundary.md`、copy-dictionary「主网同步事件 · 退役事件 · 队徽」、DESIGN §Addendum 2026-11-09b、`docs/taxonomy.md`。
- **没动**：股票日轮、加密轮（第 2 批）、Quick Play、交易页记分牌。
- **migration**：`supabase/migrations/20261109190000_mainnet_catalog_sync.sql`（已在 Lovable 库执行）。
