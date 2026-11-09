# 2026-11-09 · Lovable 展示 omenx.com 真实事件（第 1 批：体育 + 长期事件）

- **做了什么**：Lovable 数据库每 3 分钟从 www.omenx.com 公开接口同步赛程、两队、队徽、联赛、开赛时间、比分、比赛状态、直播标记 + 截图、长期事件、封面图、规则；新事件 id `mn-<主网 eventId>`。价格和成交额只在第一次进库时取主网值，之后由演示引擎动（CPO 批 A）。结算按主网结果。
- **退役**：演示引擎自编的 172 个未结算赛事 + 45 个长期事件打 `metadata.retired`，任何列表不再出现；持仓、历史照常可开；有人持仓的赛事照常结算、不再重排。演示直播样板赛 `demo-live-cs2` / `demo-prekick-cs2` 保留（CPO 批 B）。
- **前端**：所有列表查询过 `isListed`；`Crest` 支持 `logoUrl` / `tileColor`（S1 规则扩到 Sports 品类页、手机 Sports 模块、直播预告、舞台卡）；首页 `TeamBadge` 接上 logo / tile；live 位优先显示主网状态文字；taxonomy 加 UEFA Nations League。
- **字典**：EV-47 队徽四种画法（桌面 + 375）。
- **文档**：`docs/delivery/mainnet-catalog-sync-v1.md`、CLAUDE.md 红线 5、`.lovable/memory/index.md`、`docs/backend-boundary.md`、copy-dictionary「主网同步事件 · 退役事件 · 队徽」、DESIGN §Addendum 2026-11-09b、`docs/taxonomy.md`。
- **没动**：股票日轮、加密轮（第 2 批）、Quick Play、交易页记分牌。
- **migration**：`supabase/migrations/20261109190000_mainnet_catalog_sync.sql`（已在 Lovable 库执行）。
- **同日追加（CPO 2026-11-09 晚）**：体育改用主站首页 `/?tab=sports` 的同一份数据（`/pub/sports/matches` + 请求头 `X-Time-Zone`），主网不再列出的比赛 30 分钟后隐藏；封面请求改成首页同一个 `?page=1&pageSize=100&surface=STANDARD`；Editor's Desk 常驻首页 mock 的三条精选（BTC 当日收盘 / NVDA 今日收盘 / 本周最大体育盘，跟着各自当前一轮走）；More 段常驻 4 个演示长期事件（5 档互斥 / 4 档互斥 / 时间段 / 二元）；直播一律放演示动画流。migration `20261109200000_mainnet_sync_home_tab.sql`。
- **终验补字典**：首页 TeamBadge 图加载失败退回灰底短码；新增 HA-16 首页队徽四种画法（桌面 + 375）；home-all-v1 补 S1b（眉行 N matches 含正在打、日历条 ALL 只算没开赛的）与队徽数据来源。
- **终验冷读（研发视角）**：首页规则台账补 R1–R8（数字口径、+N more、多路直播默认顺序、价钮取哪两个选项、倒计时写法、加载 / 出错、断点、语言），C2 / C3 / C5 / K2 / K3 / K6 / E4 / M3 / S0 / S2 / S3 补口径；交付文档 §2 改为从台账生成（不再两份不一致）；修 4 处代码与已批规则不符：Stocks 按本轮成交量取前 10、首页多路直播默认放成交额最大的一路、直播截图加载失败按封面 → 深色底兜底、Editor's Desk 的比赛 pick 只放两队；4h / 1D 轮的钟写 `1:31:12` 不写 `91:12`；字典新增 HA-17 日历条选中某天、HA-18a/b/c Crypto 15m / 4h / 1D、HA-19 历史不足 8 轮、HA-20 两条 pick + 普通二元；sports-list-streams-v1 正文按「点了才播」改写，EV-46 作废处全部清掉；4 条待 CPO 拍板见 home-all-v1 §8。

