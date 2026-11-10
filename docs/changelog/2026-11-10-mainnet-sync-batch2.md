# 2026-11-10 · Lovable 展示 omenx.com 真实事件 · 第 2 批（股票日轮、加密轮）

文档：[mainnet-catalog-sync-v1 §7](../delivery/mainnet-catalog-sync-v1.md#7-第-2-批股票日轮加密轮cpo-2026-11-10-批十条)（CPO 2026-11-10 批十条）

- 股票日轮清单、开轮 / 收盘时间、Base 跟主网（美 51 · 港 12 · 韩 7），每 3 分钟同步；主网下架的股票不再开新轮。
- 韩股第一次有轮次；韩元不带小数（`₩1,136,000`），代码 `000660.KR`（原 `.KS`）；港股代码补 4 位。
- 事件名 `短名 (代码) — will close higher today?`，短名表 `mn_stock_names`；前端行里的公司名一律从事件名取（`stockCompanyName`），不再各页各查一张表。
- 价格、成交额照旧模拟；结算按首页小图那条走势线的收盘点（`mn_walk_close`，和前端一致到 8 位小数），不再结算时另抽随机数。
- 旧的两个股票开轮 cron 停用；股票开轮 / 状态 / 结算并进 `mainnet-catalog-sync`；目录多拉一页。
- 加密 1d / 4h 按美东切（1d 中午 12 点，4h 每 4 小时）；同一币 × 周期只开一轮。
- 首页 Stocks 行：长短名折两行不再压到走势线（K3）；`/spot` 图表纵轴按最长标签留宽，不再切掉 `HK$552.17` / 韩元价。
- 后端边界补录；copy-dictionary 股票事件名 / 韩元 / 加密切点三行。
- 同日补：股票 logo 跟主网——同步从主网首页的 daily close 接口取 `asset.iconUrl` 存进 `mn_stock_names`（72 只里 70 只有，阿里 / 汇丰主网没有、留仓库 logo）；`AssetAvatar` 优先用它并铺满圆形，和主网画法一样。
