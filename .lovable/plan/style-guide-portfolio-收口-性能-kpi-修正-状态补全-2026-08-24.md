# Style Guide · Portfolio 收口（性能 + KPI 修正 + 状态补全）

三件事一轮做完，做完 Portfolio 就可以整体交付研发。

## 1. 为什么 Portfolio 这节还是慢

现状：`/style-guide/preview` 的 iframe 已经走精简入口（`PreviewApp`，不加载 App.tsx 全图），窗口化挂载也在了。剩下的瓶颈是 **preview registry 是一个巨型模块**：`src/pages/StyleGuide/preview/registry.tsx`（439 行）在顶部静态 import 了全站所有 preview（wallet、vouchers v2、api、settlement、sports、rewards…）。因此每个 iframe 只为渲染一张 KPI 卡，也要下载并执行整份 registry 的模块图。Portfolio 这节一共 12 个 iframe，等于把这份大图在 12 个独立 React root 里各跑一次。

改法：
- registry 改为 **按 key 动态 import**：`Record<string, () => Promise<{default: ComponentType}>>`，用 `React.lazy` + `Suspense` 在 `StyleGuidePreview` 里加载。每个 iframe 只拉自己那个 preview 文件的 chunk（portfolio 那组共用一个 `portfolioPreviews` chunk，浏览器缓存后第 2–12 个 iframe 几乎零成本）。
- 挂载并发限流：DeviceFrame 的 `near` rootMargin 从 600px 收到 300px，避免一屏外一次性并发起 6~8 个 iframe。
- Portfolio 节内合并可合并的 iframe：`detail-desktop` 与 `detail-mobile` 合成一个双端并排 preview（和 auto-closed / series 一致），iframe 数从 12 降到 11 并少一次冷启。

不做：不改 DeviceFrame 的 iframe 隔离机制（它是 `md:` 断点为真的唯一手段）。

## 2. KPI 卡这一节确实不对

两个问题：
- 演示把桌面口径的 3 列 KPI 塞进了 375px 的 mobile iframe，`NET PROFIT` 卡数值被挤到溢出、盖住 RECORD 卡（截图即此）。
- 覆盖也不对：生产的 **Live 桌面**是 `COST / NOW WORTH / PROFIT` 三卡，演示里根本没有；演示里的三卡是 Settled 桌面口径。

改法：这一节拆成两个 frame，标题写清口径。
- `portfolio-lite-kpi-mobile`（mobile 375）：Live 正 2 卡 → Live 负 2 卡 → Settled 移动 2 卡。
- `portfolio-lite-kpi-desktop`（desktop）：Live 桌面 3 卡（COST / NOW WORTH / PROFIT）→ Settled 桌面 3 卡（WIN RATE / NET PROFIT / RECORD `7W 5L`）。
- 补一个 **全零/零盈亏**卡（`$0.00` muted、`0 calls`、`0%`），这是 `isZeroMoney` 的负零规则在 KPI 上的表现，现在没演示。

## 3. 状态覆盖审计（对齐生产）

已覆盖：live 卡 6 态 + 挂单行、gauge 三态、settled 月份分组 4 态、单仓详情 won（双端）、auto-closed（双端）、series（双端）、两个空态。

缺口（本轮补齐）：

| 缺的状态 | 生产依据 | 补法 |
|---|---|---|
| 桌面行式网格缺 voucher 行 | `LiveRow` 对 `isVoucher` 有单独徽标 | 在 desktop rows preview 加 voucher 行 |
| 桌面 preview 里 hot 行错用了 `LiveCard` | `portfolioPreviews.tsx` 现状 bug | 改回 `LiveRow`，热行 inset 左轨才可见 |
| 单仓详情 **cashout** 态 | `closeReason: "cashout"` → `Closed at 42¢ · cashed out early` | 新增双端并排 preview |
| 单仓详情 **settlement + lost** 态 | `outcomeWon:false` + `Payout $0.00 · nothing returned` | 加入 cashout 那个 frame 一并并排 |
| Series **全胜 / 全败** 两极 | `wins = rounds.length` / `wins = 0` 的眉线 `WON n OF n` | series preview 增加两组 |
| Series **Standard / 非 daily-rounds** 口径 | `segmentLabel`、`isDailyRounds` 驱动文案 | series preview 加一组 Standard 非日轮 |
| 零盈亏行（`net` 绝对值 < $0.005） | `isZeroMoney` → muted `$0.00` 不带符号 | settled 列表加一行 + KPI 零态卡 |
| SegmentChips 计数为 0 | 生产会出现 boost 0 / standard 0 | chrome preview 增加一组 0 计数 |
| VoucherHairline count=0（不渲染） | `VoucherHairline` 的隐藏分支 | chrome preview 说明 + 两态并列 |
| 挂单行空态 | `PendingOrdersRow orders=[]` | live cards preview 补一行空态 |
| 未登录门 `LiteAuthGate` | 生产 /portfolio 未登录即此态 | 新增 `portfolio-lite-auth-gate` mobile frame |
| 加载骨架 / 错误边界 | `p.isLoading`、`PortfolioErrorBoundary` | 各一个小 frame（错误边界用抛错的假子组件触发） |
| 移动端 series 独立整页（inner header + 返回） | `LitePortfolio.tsx` mobile series 分支 | series preview 里补 mobile 整页壳说明 |

同时更新每个 SubSection 的中文 description，让研发看描述就知道该状态由哪个字段驱动（`autoCloseState` / `closeReason` / `remark` / `segment` / `isVoucher`）。

## 技术改动清单

- `src/pages/StyleGuide/preview/registry.tsx` — 改为动态 import map（全站生效，非仅 portfolio）。
- `src/pages/StyleGuide/preview/StyleGuidePreview.tsx` — `React.lazy` + `Suspense` 骨架。
- `src/pages/StyleGuide/components/DeviceFrame.tsx` — near rootMargin 600 → 300。
- `src/pages/StyleGuide/preview/portfolioPreviews.tsx` — KPI 拆双端、修 hot 行、补上表全部 fixture 与新 preview 导出。
- `src/pages/StyleGuide/sections/pages/litePages.tsx` — Portfolio 节重排 SubSection 与描述。
- 不动任何 `src/components/portfolio/lite/**` 与 `useLitePortfolio.ts`：全部是演示层改动，生产行为零变更。
