# 多交易所会话展示（新增韩国市场）

## 现状
今天股票时段展示写死了两个市场，而且假设「同一时刻只有一个市场开市」：

- `getMarketSession` 用全局常量 09:30–16:00 判断任何市场（`src/lib/usStockSessions.ts`）。
- `groupStockRows` 只记录**第一个**开市市场（`sessionMarket` / `sessionEnd`），后来的开市市场被丢弃（`verticalBlocks.tsx`）。
- 会话文案三处写死三元判断 `key === "hk" ? "HK" : "US"`：`SessionStatusChip`、`LiteIntradayView`、`IntradayStageCard` 的 close 行。
- `marketCityName` 只有 Hong Kong / New York（选中的那句 "New York opens Fri 09:30 ET" 出自这里）。
- 移动端 `MobileIntradayModule` 手动只取 US / HK 两个 session。

美股与港股不冲突所以侥幸没暴露；韩国 09:00–15:30 KST 与港股几乎全程重叠，一旦接入现有结构只会显示其中一个。

## 本轮要做

### 1. 市场模型泛化
- `StockMarket` 增加 `openMinutes` / `closeMinutes`（沿用现有默认 09:30 / 16:00），`getMarketSession` 改读市场自身时段，不再用全局常量。
- 新增 `KR_STOCK_MARKET`：`Asia/Seoul`、label `KST`、currency `₩`、09:00–15:30。
- `resolveStockMarket` 支持 `kr-` 前缀与 `KR_` subtype；`marketCityName` 加 Seoul，并新增 `market.short`（US / HK / KR）供文案使用。
- 事件数据仍由后端提供，本轮不造韩国假事件。

### 2. 会话分组支持 N 个并行市场
- `groupStockRows` 返回 `openSessions: { market, closeAt }[]`（按收盘时间升序），保留 `sessionMarket` / `sessionEnd` 作为「最早收盘」的兼容字段，避免破坏现有调用点。
- 三处写死的 `hk ? "HK" : "US"` 改读 `market.short`。

### 3. 会话芯片改多芯片并排（已定方案）
- `SessionStatusChip` 对每个开市市场渲染一枚独立芯片：橙点 + `HK session open` + `closes 16:00 HKT · 3h 12m left`，芯片间 8px。
- 宽屏并排；容器窄时横向滚动（隐藏滚动条），芯片本身尺寸不变。
- `LiteIntradayView` 头部同款处理；`IntradayStageCard` 的 "STOCKS CLOSING TODAY" 右侧 close 行改为 `HK closes 16:00 HKT · KR closes 15:30 KST`（· 连接，按收盘时间排序）。
- 移动端 `MobileIntradayModule` 的 SessionRow 改为遍历全部开市市场（现在只查 US/HK），行内城市名走 `marketCityName`。
- footer 的 wake 行（`New York opens Fri 09:30 ET`）已是 N 市场 join，只需补 Seoul 文案。

### 4. style-guide 补状态
在 `LiteAllStageSection` 与相关 Lite 视图 demo 里新增冻结时钟预设（真组件 + `sessionNow`，不手抄）：
- `HK + KR 同时开市`（重叠双芯片）
- `KR 单独开市`（港股已收、韩股未收的尾段）
- `US 开市 · 亚洲两市已休`（footer 出现两条 wake 文案）
caption 说明：多市场同开时每市场一枚芯片，按收盘时间排序。
changelog 记 2026-08-14：新增 KR 市场与多会话并排芯片。

## 不动的部分
- 加密快轮、round tape、Intraday 其它版式、事件抓取逻辑、后端。
- 收盘时间语义仍是「交易时段」口径，不改为用户本地时间。

## 验收
typecheck + build 通过；`src/lib/__tests__/usStockSessions.test.ts` 补 KR 时段与重叠用例；全库无 `"hk" ? "HK" : "US"` 残留。
