// Pro /spot terminal — state dictionary (SP-1 · B3).
// Every case mounts the production components (ProSpotPanel / ProSpotOrderPreview /
// ProTerminalLayout). Nothing here is hand-drawn.
import { SectionWrapper } from "../components/SectionWrapper";
import { SectionFrame, type SectionCase } from "../components/SectionFrame";

const PANEL_CASES: SectionCase[] = [
  {
    key: "pro-spot-panel-buy-market",
    label: "SP-B1 · Buy · Market（ProSpotPanel）",
    note: "面板唯一整宽选择器是 BinarySideToggle；Buy/Sell 为文字页签，订单类型收进右上角下拉。滑点 chip 选中态为中性 bg-foreground text-background，禁止 trading-purple。",
    spec: [
      {
        state: "Buy · Market",
        when: 'side === "buy" && orderType === "Market"',
        visual: "汇总为 Cost / Est. fill @ x.xx / Shares / To win ⓘ / Fee (0.15%)，无 Max loss",
        source: "ProSpotPanel props（SpotTrading 计算）",
      },
    ],
  },
  {
    key: "pro-spot-panel-buy-limit",
    label: "SP-B2 · Buy · Limit",
    spec: [
      {
        state: "Limit 价格输入",
        when: 'orderType === "Limit"',
        visual: "多出 Limit price 输入（USD，4 位小数）；隐藏 Max slippage 与 Est. fill 行",
        source: "ProSpotPanel.orderType",
      },
    ],
  },
  {
    key: "pro-spot-panel-sell-held",
    label: "SP-B3 · Sell · 单边持仓",
    spec: [
      {
        state: "未持有的一边禁用",
        when: 'side === "sell" && heldNoQty <= 0',
        visual: "该 tile opacity-40 pointer-events-none，价格条文案变 `0 sh`；金额单位变 sh；汇总为 Proceeds / Shares / Est. commission / You receive",
        source: "ProSpotPanel.heldYesQty / heldNoQty",
      },
      {
        state: "份额为小数",
        when: "heldQty 非整数（例 40.512）",
        visual: "Held 行与 Shares 行保留最多 3 位小数并去尾零，绝不四舍五入成整数",
        source: "ProSpotPanel.formatShares",
      },
    ],
  },
  {
    key: "pro-spot-panel-sell-held-down",
    label: "SP-B3b · Sell · 仅持有 Down（2,034.879 sh）",
    note: "回归护栏（SP-1-FIX3 Bug 1）：持有哪一边由持仓的 option_id 决定，与 Positions 表 Outcome 列同源；Up tile 禁用显示 `0 sh`。数量全链路取精确值——Held 行、Amount 预填、滑杆 100%、校验与下单请求都是 2034.879。",
    spec: [
      {
        state: "Down-only 持仓",
        when: 'side === "sell" && heldYesQty === 0 && heldNoQty === 2034.879',
        visual: "Down tile 选中，Up tile 禁用 `0 sh`；`Held · 2,034.879 sh Down`；Amount `2034.879`；CTA `Sell Down · You receive $X`",
        source: "SpotTrading heldYesQty / heldNoQty（经 side_labels 解析 option）",
      },
      {
        state: "全平吸附（FIX4）",
        when: "sell qty 与 heldQty 差 < 0.001，或 qty ≥ heldQty × 0.9995（滑杆 100%）",
        visual: "3 位小数字符串仅作展示；下单发送精确 heldQty，全平不留 <0.001 dust，也不因四舍五入超出持仓被拒",
        source: "SpotTrading orderQty（FIX4 snap）",
      },
    ],
  },

  {
    key: "pro-spot-panel-sell-none",
    label: "SP-B4 · Sell · 无持仓",
    spec: [
      {
        state: "两边都禁用",
        when: 'side === "sell" && heldYesQty <= 0 && heldNoQty <= 0',
        visual: "两个 tile 均禁用，下方出现 text-[11px] 提示 `No shares to sell yet`",
        source: "ProSpotPanel 派生 disabledSide === \"both\"",
      },
    ],
  },
  {
    key: "pro-spot-panel-insufficient",
    label: "SP-B5 · 余额不足",
    spec: [
      {
        state: "CTA 禁用",
        when: "ctaDisabled === true",
        visual: "TradeSubmitButton 置灰，文案由页面给出（例：Insufficient balance）",
        source: "SpotTrading ctaDisabled",
      },
    ],
  },
  {
    key: "pro-spot-panel-frozen",
    label: "SP-B8 · 市场已冻结（FIX5）",
    note: "下单封锁 = `isOrderingBlocked(dbLifecycle) || isFrozenByTime`。过了 freeze_time / end_date 的市场即便库里还写着 EXTENDED_TRADING 也不可下单：两个 tile 仍可点选（只为看价），CTA 置灰显示原因，预览弹窗打不开，提交与 Positions 行 `Close` 均直接 toast 拦截。",
    spec: [
      {
        state: "Frozen by time",
        when: "now > freeze_time（或 end_date）",
        visual: "CTA 置灰，文案 `Market frozen`；tile 仍可切换查看价格",
        source: "SpotTrading blocked / blockedReason",
      },
    ],
  },
  {
    key: "pro-spot-panel-pending-limit",
    label: "SP-B6 · 限价将挂单",
    spec: [
      {
        state: "Pending 提示",
        when: "willBePending && !tickInvalid",
        visual: "黄色 10px 提示说明会挂为 Pending 并占用预留资金，金额为 cost + fee（含手续费）；CTA 文案变 `Place limit · Buy Up`",
        source: "ProSpotPanel.willBePending",
      },
    ],
  },
];

const DIALOG_CASES: SectionCase[] = [
  {
    key: "pro-spot-preview-dialog",
    label: "SP-B7 · Order preview 弹窗（ProSpotOrderPreview）",
    note: "与合约终端同一 Dialog 框架：事件名 + outcome chip + 两张 rounded-lg border-border/50 bg-muted/20 p-3 卡片 + TradeSubmitButton size=\"lg\"。不出现杠杆 / 保证金 / 强平 / Position impact。两个入口：面板 CTA，以及 Positions 行的 `Close`（预置 Sell · 该 outcome · Market · 全量精确份额，直接开这个弹窗）。",
    spec: [
      {
        state: "Buy 预览",
        when: 'side === "buy"',
        visual: "第二张卡片为 Cost / Fee (0.15%) / To win",
        source: "ProSpotOrderPreview props",
      },
      {
        state: "Sell 预览",
        when: 'side === "sell"',
        visual: "第二张卡片为 Proceeds / Est. commission / You receive",
        source: "ProSpotOrderPreview props",
      },
    ],
  },
];

const MOBILE_CASES: SectionCase[] = [
  {
    key: "pro-spot-mobile-charts",
    label: "SP-M1 · 移动 Charts 视图（375）",
    note: "移动 Pro 现货长在 MobileTradingLayout variant=\"spot\" 上：price/mark、图表、tabs 与卡片逐块复用 /trade 规格；市场 chip 行是多 market 专属，binary 事件（含 Up/Down 别名）不渲染；仅保留 32px spot strip、SPOT 徽章与 dock 安全区。",

    spec: [
      {
        state: "Charts 默认",
        when: "isMobile && surface === pro && !blocked",
        visual: "32px strip → price/change/Mark Price/24h Volume → 450px 图表 → contract-class cards → dock（Lite/Pro + Up / Down）；无市场 chip 行",
        source: "SpotMobileStatsStrip / SpotMobileMarkLine / ProSpotMobileDock",
      },
    ],
  },
  {
    key: "pro-spot-mobile-charts-360",
    label: "SP-M1b · 移动 Charts 视图（360 · 无截断）",
    note: "SP-2-FIX3：360px 最坏数据用 $57,907.84。PRE/AH 徽标在 Base 格；涨跌按 strip 容器宽度隐藏，价格与标的永不截断。",
    spec: [
      {
        state: "360px 极窄",
        when: "viewport < 375",
        visual: "左格 `BASE $577.18 PRE`；右格 `META $57,907.84`；页头标题走短名 `META · Up or down?`",
        source: "SpotMobileStatsStrip / spotMobileTitle",
      },
    ],
  },
  {
    key: "pro-spot-mobile-charts-frozen",
    label: "SP-M2 · 移动 Charts · 已冻结",
    spec: [
      {
        state: "Frozen",
        when: "blocked === true",
        visual: "倒计时 00:00:00；两个 dock 按钮禁用，文案 `Market frozen`",
        source: "useSpotTerminal blocked / blockedReason",
      },
    ],
  },
  {
    key: "pro-spot-mobile-order-buy",
    label: "SP-M3 · /spot/order · Buy",
    note: "SP-2-FIX5：下单子页挂生产 ProSpotPanel chrome=\"bare\"，零额外卡片与标题；表单直接长在页面上，右侧为完整 120px / 10+10 档盘口。此页永不出现 Lite/Pro 切换。",
    spec: [
      {
        state: "Buy · Market",
        when: 'activeTab === "Trade" && side === "buy"',
        visual: "左侧无卡片外壳表单 + 右 120px 迷你盘口（10 asks / mid / 10 bids / Depth 0.1）；摘要为 plain kv rows",
        source: "SpotTradePanel（ProSpotPanel）",
      },
    ],
  },
  {
    key: "pro-spot-mobile-order-sell-held",
    label: "SP-M4 · /spot/order · Sell（持有 Down）",
    note: "SP-2-FIX5：与 Buy 共用 bare chrome；CTA 默认 row，只在真实测量放不下时自动 stacked。",
    spec: [
      {
        state: "Sell 全平",
        when: 'side === "sell" && heldNoQty > 0',
        visual: "Up tile 禁用 `0 sh`；数量走 FIX4 精确吸附；Proceeds / Est. commission / You receive 为无底色 kv rows",
        source: "useSpotTerminal orderQty",
      },
    ],
  },
  {
    key: "pro-spot-mobile-dock",
    label: "SP-M5 · Sticky dock 四态",
    spec: [
      {
        state: "default / 选中一边 / frozen",
        when: "selected === null | 'yes' | blocked",
        visual: "第一次点选中（描边 + 箭头），第二次跳 /spot/order；frozen 全禁用",
        source: "ProSpotMobileDock",
      },
      {
        state: "Lite/Pro 在最前",
        when: "showSurfaceSwitch（生产默认）",
        visual: "SurfaceSwitch size=\"dock\" 是这一行的第一个子元素，两个方向键仍平分剩余宽度",
        source: "ProSpotMobileDock（预览用 surfaceSwitchPreview 置为惰性）",
      },
    ],
  },
];

const SKELETON_CASES: SectionCase[] = [

  {
    key: "pro-terminal-skeleton",
    label: "SP-C1 · Pro 终端骨架（ProTerminalLayout + ProBottomTabs）",
    note: "`src/components/pro/` 是搭建 Pro 桌面终端的唯一方式：/trade 与 /spot 共用同一套槽位，宽度与间距不得各写一份。",
    spec: [
      {
        state: "槽位几何",
        when: "always",
        visual: "header / chart(flex-1) / orderBook(280px) / bottomTabs / 右栏 280px（panel + account, gap-2 m-1）",
        source: "ProTerminalLayout",
      },
    ],
  },
  {
    key: "pro-bottom-tabs-guest",
    label: "SP-I · 未登录门（ProBottomTabs → LiteAuthGate panel）",
    note: "SP-2-FIX8：未登录用户恒为 Lite，理论上到不了 Pro；万一到了，底部面板用站点唯一的 LiteAuthGate（panel 变体），不再有旧的 AuthGateOverlay（Log In / Sign Up）。",
    spec: [
      {
        state: "未登录",
        when: "!user",
        visual: "bg-card 纯色（无模糊）+ 72px lynx + 单行标题 + Sign in / Create account 同排，总高 ≤ 220px",
        source: "LiteAuthGate variant=\"panel\"",
      },
    ],
  },
];

interface Props {
  isMobile: boolean;
}

export const ProSpotSection = (_: Props) => (
  <div className="space-y-8">
    <SectionWrapper
      id="pro-spot-panel"
      title="Pro /spot 下单面板（SP-1 · B2）"
      description="生产件 src/components/pro/ProSpotPanel.tsx。方案 A：Buy/Sell 文字页签 + 订单类型下拉在同一行，整宽选择器只有 BinarySideToggle；汇总区不再有 Max loss，盈利口径统一为扣除 5% winning commission 后的 To win。"
    >
      <SectionFrame cases={PANEL_CASES} device="desktop" minHeight={520} />
    </SectionWrapper>

    <SectionWrapper
      id="pro-spot-preview"
      title="Pro /spot 订单预览"
      description="CTA 先开预览弹窗，确认后才提交。"
    >
      <SectionFrame cases={DIALOG_CASES} device="desktop" minHeight={460} />
    </SectionWrapper>

    <SectionWrapper
      id="pro-terminal-skeleton"
      title="Pro 终端骨架（SP-1 · B1）"
      description="ProTerminalLayout / ProBottomTabs / OrderTypeDropdown / BinarySideToggle 四件套，/trade 与 /spot 共用。"
    >
      <SectionFrame cases={SKELETON_CASES} device="desktop" minHeight={560} />
    </SectionWrapper>

    <SectionWrapper
      id="pro-spot-mobile"
      title="Pro /spot 移动端（SP-2）"
      description="移动 Pro 现货重建在合约 Pro 移动骨架上：/spot 为 Charts 视图 + sticky dock，/spot/order 为下单子页（同一个 ProSpotPanel）。"
    >
      <SectionFrame cases={MOBILE_CASES} device="mobile" minHeight={560} />
    </SectionWrapper>

  </div>
);
