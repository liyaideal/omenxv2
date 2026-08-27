/**
 * Wallet Lite R1 — state dictionary for the 2026-08 revamp (batches 1–3).
 *
 * Every case mounts a production component with fixture props (see
 * preview/walletLitePreviews.tsx). No hand-copied markup, no sections barrel
 * import — this file rides the lazily-loaded LiteWalletPage chunk.
 */
import { SectionWrapper, SubSection } from "../components/SectionWrapper";
import { SectionFrame, type SectionCase } from "../components/SectionFrame";

const GATE_CASES: SectionCase[] = [
  {
    key: "auth-gate-lite-wallet",
    label: "未登录门 · Lite",
    note: "/wallet 未登录时按 surface 分叉。Lite 走 LiteAuthGate（模糊底层 + lynx + 双 CTA），wallet 专属 title / description。",
    spec: [
      {
        state: "Lite gate",
        when: "surface === 'lite' && !user",
        visual:
          "LiteAuthGate：底层 blur-[3px] opacity-70，覆盖层 LynxFigure 100 + 'Sign in to view your wallet' + 'Deposit, withdraw and move funds between your accounts by signing in.' + btn-primary Sign in / 描边 Create account",
        source: "WalletAuthGate (src/pages/Wallet.tsx)",
      },
      {
        state: "signed in",
        when: "user !== null",
        visual: "children 原样透出，无覆盖层",
        source: "LiteAuthGate",
      },
    ],
  },
  {
    key: "auth-gate-pro",
    label: "未登录门 · Pro（本轮未改）",
    spec: [
      {
        state: "Pro gate",
        when: "surface === 'pro' && !user",
        visual:
          "AuthGateOverlay 原样：'Sign in to view your wallet' / 'Manage your funds and saved addresses by signing in.'",
        source: "WalletAuthGate (src/pages/Wallet.tsx)",
      },
    ],
  },
];

const ADDRESS_DESKTOP_CASES: SectionCase[] = [
  {
    key: "wallet-lite-address-rows-desktop",
    label: "Saved addresses 行 · desktop（Copy + ⋯ Popover 210px）",
    note: "第一行为默认地址（Default 徽标），第二行为非默认且处于 copied 态。",
    spec: [
      {
        state: "默认地址行",
        when: "wallet.isPrimary === true",
        visual: "label 右侧 volt Default 徽标；⋯ Popover 内只有红色 Delete address",
        source: "SavedAddressRowView (src/pages/Wallet.tsx)",
      },
      {
        state: "非默认地址行",
        when: "wallet.isPrimary === false",
        visual: "无 Default 徽标；⋯ Popover 内 Set as default + 红色 Delete address",
        source: "SavedAddressRowView",
      },
      {
        state: "copied",
        when: "copiedWalletId === wallet.id",
        visual: "Copy 图标替换为绿色 Check",
        source: "Wallet.tsx handleCopyWallet",
      },
      {
        state: "Popover 容器",
        when: "desktop（isMobile === false）点击 ⋯",
        visual: "w-[210px] p-1 bg-[#12151A] border-[#1D2026] rounded-xl，align=end side=bottom",
        source: "SavedAddressRowView",
      },
    ],
  },
];

const ADDRESS_MOBILE_CASES: SectionCase[] = [
  {
    key: "wallet-lite-address-rows-mobile",
    label: "Saved addresses 行 · mobile（只有 ⋯）",
    spec: [
      {
        state: "mobile 行",
        when: "isMobile === true",
        visual: "行尾只有 ⋯，无独立 Copy 按钮（Copy 移进抽屉）",
        source: "SavedAddressRowView",
      },
    ],
  },
  {
    key: "wallet-lite-address-actions",
    label: "⋯ MobileDrawer · 非默认地址",
    spec: [
      {
        state: "非默认",
        when: "isMobile && actionsWallet.isPrimary === false",
        visual: "Set as default / Copy address / Delete address（红），发丝分隔",
        source: "SavedAddressActionsList (src/pages/Wallet.tsx)",
      },
    ],
  },
  {
    key: "wallet-lite-address-actions-default",
    label: "⋯ MobileDrawer · 默认地址",
    spec: [
      {
        state: "默认",
        when: "isMobile && actionsWallet.isPrimary === true",
        visual: "只有 Copy address / Delete address —— Set as default 不渲染",
        source: "SavedAddressActionsList",
      },
    ],
  },
];

const BADGE_CASES: SectionCase[] = [
  {
    key: "wallet-lite-product-badges",
    label: "账户徽标 · 单一真相 productLineBadge",
    note: "改色只改 src/lib/productLineBadge.tsx；任何页面不得就地覆写。",
    spec: [
      {
        state: "STANDARD",
        when: "line === 'spot'",
        visual: "border-primary/30 bg-primary/10 text-primary，文字 STANDARD",
        source: "PRODUCT_LINE_BADGE_CLASSES.spot",
      },
      {
        state: "BOOST",
        when: "line === 'futures'",
        visual: "border-accent/40 bg-accent/15 text-accent，文字 BOOST",
        source: "PRODUCT_LINE_BADGE_CLASSES.futures",
      },
    ],
  },
];

const TX_ICON_SPEC = [
  { state: "deposit", when: "type === 'deposit'", visual: "ArrowDownLeft · text-trading-green · 圈底 bg-trading-green/20", source: "getTransactionIcon" },
  { state: "withdraw", when: "type === 'withdraw'", visual: "ArrowUpRight · text-trading-red · bg-trading-red/20", source: "getTransactionIcon" },
  { state: "trade_profit", when: "type === 'trade_profit'", visual: "TrendingUp · text-trading-green · bg-trading-green/20", source: "getTransactionIcon" },
  { state: "trade_loss", when: "type === 'trade_loss'", visual: "TrendingDown · text-trading-red · bg-trading-red/20", source: "getTransactionIcon" },
  { state: "platform_credit", when: "type === 'platform_credit'", visual: "Wallet · text-trading-green · bg-trading-green/20", source: "getTransactionIcon" },
  { state: "bonus", when: "type === 'bonus'", visual: "Gift · text-trading-green · bg-trading-green/20", source: "getTransactionIcon" },
  { state: "fee", when: "type === 'fee'", visual: "Receipt · text-trading-red · bg-trading-red/20", source: "getTransactionIcon" },
  { state: "transfer_to_spot / transfer_to_futures", when: "type.startsWith('transfer_')", visual: "ArrowLeftRight · text-primary · bg-primary/20", source: "getTransactionIcon" },
  { state: "default（未知 type）", when: "以上都不匹配", visual: "Wallet · text-muted-foreground · bg-muted/20（禁止沿用红色亏损语义）", source: "getTransactionIcon 兜底" },
];

const TX_CASES: SectionCase[] = [
  {
    key: "wallet-lite-tx-icon-matrix",
    label: "交易流水 · 全类型 icon 映射",
    note:
      "desktop 单行右侧 cluster 固定列：status 图标（条件渲染）→ 徽标列 w-[78px] flex justify-end → 金额列 w-[120px] text-right font-mono 涨绿跌红 → chevron 固定占位 w-4（无 chevron 也占位，保证跨行右缘同一竖线）。mobile 两层：第一层 icon + 描述 + 金额，第二层 pl-[52px] date · 账户徽标 · status。",
    spec: TX_ICON_SPEC,
  },
  {
    key: "wallet-lite-tx-transfer-legs",
    label: "交易流水 · transfer 方向文案（四腿）",
    spec: [
      {
        state: "Transfer from Standard",
        when: "type === 'transfer_to_futures' && account === 'futures'",
        visual: "描述 'Transfer from Standard'（收款腿）",
        source: "Wallet.tsx 交易映射",
      },
      {
        state: "Transfer to Boost",
        when: "type === 'transfer_to_futures' && account !== 'futures'",
        visual: "描述 'Transfer to Boost'（出款腿）",
        source: "Wallet.tsx 交易映射",
      },
      {
        state: "Transfer from Boost",
        when: "type === 'transfer_to_spot' && account === 'spot'",
        visual: "描述 'Transfer from Boost'",
        source: "Wallet.tsx 交易映射",
      },
      {
        state: "Transfer to Standard",
        when: "type === 'transfer_to_spot' && account !== 'spot'",
        visual: "描述 'Transfer to Standard'",
        source: "Wallet.tsx 交易映射",
      },
    ],
  },
];

const HERO_CASES: SectionCase[] = [
  {
    key: "wallet-lite-hero-note-lite",
    label: "HeroEquityCard · equityNote · Lite",
    spec: [
      {
        state: "Lite",
        when: "surface === 'lite' → equityNote='does not include open trade profit'",
        visual: "副行 'Boost + Standard · does not include open trade profit'",
        source: "Wallet.tsx equityNote={isLite ? … : undefined}",
      },
    ],
  },
  {
    key: "wallet-lite-hero-note-pro",
    label: "HeroEquityCard · equityNote · Pro（默认值）",
    spec: [
      {
        state: "Pro",
        when: "equityNote 未传 → 默认 'does not include unrealized PnL'",
        visual: "副行 'Boost + Standard · does not include unrealized PnL'",
        source: "HeroEquityCard 默认参数",
      },
    ],
  },
];

/* ---- 2026-08-27 audit round · W-1 … W-16 ---- */

const PENDING_CASES: SectionCase[] = [
  {
    key: "wallet-lite-pending-desktop",
    label: "W-1 · PendingConfirmations · desktop",
    note: "只在存在 pending/processing 链上交易时渲染；确认数达标后整块消失。",
    spec: [
      {
        state: "confirming",
        when: "status ∈ {pending, processing} 且 confirmations < required",
        visual: "进度条 6/15 + 链名 Base + 金额 $800 + tx hash 截断可点",
        source: "PendingConfirmations.tsx",
      },
    ],
  },
  {
    key: "wallet-lite-pending-mobile",
    label: "W-2 · PendingConfirmations · mobile",
    spec: [
      { state: "confirming · mobile", when: "isMobile", visual: "同内容，单列堆叠", source: "PendingConfirmations.tsx" },
    ],
  },
];

const TX_EMPTY_CASES: SectionCase[] = [
  {
    key: "wallet-lite-tx-empty",
    label: "W-3 · 交易流水 · 空",
    spec: [
      { state: "empty", when: "transactions.length === 0", visual: "站点统一 EmptyState（无筛选 pill 行）", source: "TransactionHistory.tsx" },
    ],
  },
  {
    key: "wallet-lite-tx-empty-filtered",
    label: "W-4 · 交易流水 · 筛选后为空",
    spec: [
      {
        state: "empty-filtered",
        when: "filter !== 'all' 且该筛选下无行",
        visual: "保留 pill 行，正文为「该筛选下暂无记录」语气的空态",
        source: "TransactionHistory.tsx filter 分支",
      },
    ],
  },
];

const TX_STATE_CASES: SectionCase[] = [
  {
    key: "wallet-lite-tx-status-matrix",
    label: "W-6 · 交易流水 · 五种 status",
    spec: [
      { state: "pending", when: "status === 'pending'", visual: "Clock 图标 + 中性徽标", source: "TransactionHistory statusMap" },
      { state: "processing", when: "status === 'processing'", visual: "Loader 图标 + 中性徽标", source: "TransactionHistory statusMap" },
      { state: "completed", when: "status === 'completed'", visual: "无 status 图标（默认成功态）", source: "TransactionHistory statusMap" },
      { state: "failed", when: "status === 'failed'", visual: "红色 failed 徽标", source: "TransactionHistory statusMap" },
      { state: "rejected", when: "status === 'rejected'", visual: "红色 rejected 徽标", source: "TransactionHistory statusMap" },
    ],
  },
  {
    key: "wallet-lite-tx-unknown-type",
    label: "W-7 · 交易流水 · 未知 type 兜底",
    spec: [
      {
        state: "unknown",
        when: "type 不在映射表内",
        visual: "Wallet 图标 · text-muted-foreground · bg-muted/20，金额按正负取色，绝不套用红色亏损语义",
        source: "getTransactionIcon 兜底",
      },
    ],
  },
  {
    key: "wallet-lite-tx-expanded",
    label: "W-8 · 交易流水 · 展开详情",
    spec: [
      {
        state: "expanded",
        when: "点击带 chevron 的行",
        visual: "展开区显示 network / fee / tx hash（Base → basescan.org 外链）",
        source: "TransactionHistory 展开层 + EXPLORER_URLS",
      },
    ],
  },
  {
    key: "wallet-lite-tx-pro-only",
    label: "W-9 · 交易流水 · Pro 专属四类型",
    note: "cross_chain_in / cross_chain_out / fiat_buy / fiat_sell 只在 Pro 资金动线产生，Lite 不会新增，但历史行仍要正确渲染。",
    spec: [
      { state: "cross_chain_in", when: "type === 'cross_chain_in'", visual: "跨链入账，展开显示 source → dest 链与币种", source: "TransactionHistory.tsx" },
      { state: "cross_chain_out", when: "type === 'cross_chain_out'", visual: "跨链出账，金额为负", source: "TransactionHistory.tsx" },
      { state: "fiat_buy", when: "type === 'fiat_buy'", visual: "法币买入 USDC（Banxa）", source: "TransactionHistory.tsx" },
      { state: "fiat_sell", when: "type === 'fiat_sell'", visual: "法币卖出 USDC，金额为负", source: "TransactionHistory.tsx" },
    ],
  },
];

const ADDRESS_EMPTY_CASES: SectionCase[] = [
  {
    key: "wallet-lite-addresses-empty",
    label: "W-10 · Saved addresses · 空态",
    spec: [
      {
        state: "empty",
        when: "wallets.length === 0",
        visual: "计数显示 0 addresses；虚线 Add address 按钮常驻；下方站点统一 EmptyState",
        source: "Wallet.tsx Saved addresses 卡",
      },
    ],
  },
];

const HERO_HIDDEN_CASES: SectionCase[] = [
  {
    key: "wallet-lite-hero-hidden",
    label: "W-11 · HeroEquityCard · 金额隐藏",
    spec: [
      {
        state: "hidden",
        when: "hidden === true（点击眼睛）",
        visual: "金额替换为掩码字符，副行说明保留，EyeOff 图标",
        source: "HeroEquityCard hidden",
      },
    ],
  },
];

const DEPOSIT_DIALOG_CASES: SectionCase[] = [
  {
    key: "wallet-lite-deposit-dialog-checklist",
    label: "W-12 · Deposit 弹窗 · 风险清单（未确认）",
    note: "弹窗外壳（标题栏 / To: Standard Account 面包屑 / 三 tab 栏）为 docs 复刻，tab 内容为生产组件。",
    spec: [
      {
        state: "checklist",
        when: "demoAcknowledged === false",
        visual: "逐条勾选的入金须知，全部勾完才露出地址",
        source: "WalletDeposit.tsx",
      },
    ],
  },
  {
    key: "wallet-lite-deposit-dialog-address",
    label: "W-13 · Deposit 弹窗 · 地址态",
    spec: [
      {
        state: "address",
        when: "demoAcknowledged === true",
        visual: "二维码 + 链上地址（ColoredAddress）+ Copy；最小入金与到账说明",
        source: "WalletDeposit.tsx",
      },
    ],
  },
  {
    key: "wallet-lite-deposit-dialog-fiat",
    label: "W-14 · Deposit 弹窗 · Fiat tab",
    spec: [
      { state: "fiat", when: "tab === 'fiat'", visual: "法币金额输入 + 报价行 + Banxa 跳转 CTA", source: "BuyWithFiat.tsx" },
    ],
  },
  {
    key: "wallet-lite-deposit-dialog-wallet",
    label: "W-15 · Deposit 弹窗 · Wallet（跨链）tab",
    spec: [
      { state: "crosschain", when: "tab === 'crosschain'", visual: "来源链 / 币种选择 + 金额 + 报价明细", source: "CrossChainDeposit.tsx" },
    ],
  },
];

const WITHDRAW_CASES: SectionCase[] = [
  {
    key: "wallet-lite-withdraw-desktop",
    label: "W-16 · Withdraw · desktop 表单",
    spec: [
      {
        state: "form",
        when: "/withdraw desktop",
        visual: "地址选择 + 金额（Max）+ 手续费与到账金额明细 + 主 CTA",
        source: "WalletWithdraw.tsx",
      },
    ],
  },
];

export const WalletLiteR1Section = ({ isMobile }: { isMobile: boolean }) => (
  <SectionWrapper
    id="wallet-lite-r1"
    title="Wallet Lite R1 · 状态字典"
    platform="shared"
    description="2026-08 Wallet Lite 改版三批：批1 未登录门（登录弹层三步已迁往「登录 / 注册」节）/ 批2 地址 ⋯ 菜单 + 账户徽标配色 + Hero 文案 / 批3 流水行清理 + 列对齐 + icon 全类型映射。"
  >
    <SubSection title="1 · 未登录门（Lite vs Pro）" platform="shared">
      <SectionFrame cases={GATE_CASES} device={isMobile ? "mobile" : "desktop"} minHeight={460} />
    </SubSection>

    <SubSection title="3 · Saved addresses ⋯ 菜单 · desktop" platform="desktop">
      <SectionFrame cases={ADDRESS_DESKTOP_CASES} device="desktop" minHeight={200} />
    </SubSection>

    <SubSection title="3 · Saved addresses ⋯ 菜单 · mobile" platform="mobile">
      <SectionFrame cases={ADDRESS_MOBILE_CASES} device="mobile" minHeight={380} />
    </SubSection>

    <SubSection title="4 · 账户徽标（单一真相）" platform="shared">
      <SectionFrame cases={BADGE_CASES} device="desktop" minHeight={120} />
    </SubSection>

    <SubSection title="5 · 交易流水行 · 全类型 icon 映射" platform="shared">
      <SectionFrame cases={[TX_CASES[0]]} device="desktop" minHeight={620} />
      <div className="mt-3">
        <SectionFrame cases={[TX_CASES[1]]} device="mobile" minHeight={620} />
      </div>
    </SubSection>

    <SubSection title="6 · HeroEquityCard equityNote" platform="shared">
      <SectionFrame cases={HERO_CASES} device="desktop" minHeight={320} />
    </SubSection>

    <SubSection title="7 · 待确认链上交易（W-1 / W-2）" platform="shared">
      <SectionFrame cases={[PENDING_CASES[0]]} device="desktop" minHeight={280} />
      <div className="mt-3">
        <SectionFrame cases={[PENDING_CASES[1]]} device="mobile" minHeight={300} />
      </div>
    </SubSection>

    <SubSection title="8 · 交易流水空态（W-3 / W-4）" platform="shared">
      <SectionFrame cases={TX_EMPTY_CASES} device={isMobile ? "mobile" : "desktop"} minHeight={320} />
    </SubSection>

    <SubSection title="9 · 交易流水 status / 兜底 / 展开 / Pro 类型（W-6 … W-9）" platform="shared">
      <SectionFrame cases={TX_STATE_CASES} device="desktop" minHeight={420} />
    </SubSection>

    <SubSection title="10 · Saved addresses 空态 + Hero 隐藏（W-10 / W-11）" platform="shared">
      <SectionFrame cases={ADDRESS_EMPTY_CASES} device="desktop" minHeight={300} />
      <div className="mt-3">
        <SectionFrame cases={HERO_HIDDEN_CASES} device="desktop" minHeight={240} />
      </div>
    </SubSection>

    <SubSection title="11 · Deposit 弹窗四态（W-12 … W-15）" platform="desktop">
      <SectionFrame cases={DEPOSIT_DIALOG_CASES} device="desktop" minHeight={620} />
    </SubSection>

    <SubSection title="12 · Withdraw desktop 表单（W-16）" platform="desktop">
      <SectionFrame cases={WITHDRAW_CASES} device="desktop" minHeight={520} />
    </SubSection>
  </SectionWrapper>
);
