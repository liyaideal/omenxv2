/**
 * Wallet Lite R1 — state dictionary for the 2026-08 revamp (batches 1–3).
 *
 * Every case mounts a production component with fixture props (see
 * preview/walletLitePreviews.tsx). No hand-copied markup, no sections barrel
 * import — this file rides the lazily-loaded LiteWalletPage chunk.
 */
import { SectionWrapper, SubSection } from "../components/SectionWrapper";
import { SectionFrame, type SectionCase } from "../components/SectionFrame";

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
        source: "PRODUCT_LINE_BADGE_CLASSES.spot；数据来源 transactions.account 枚举（'spot'）",
      },
      {
        state: "BOOST",
        when: "line === 'futures'",
        visual: "border-accent/40 bg-accent/15 text-accent，文字 BOOST",
        source: "PRODUCT_LINE_BADGE_CLASSES.futures；数据来源 transactions.account 枚举（'futures'）",
      },
    ],
  },
];

const TX_ICON_SPEC = [
  { state: "deposit", when: "type === 'deposit'", visual: "ArrowDownLeft · text-trading-green · 圈底 bg-trading-green/20", source: "getTransactionIcon" },
  { state: "withdraw", when: "type === 'withdraw'", visual: "ArrowUpRight · text-trading-red · bg-trading-red/20", source: "getTransactionIcon" },
  { state: "trade_profit / trade_loss · 净额 ≥ 0", when: "type ∈ {trade_profit, trade_loss} && amount >= 0", visual: "TrendingUp · text-trading-green · bg-trading-green/20（图标随净额符号）", source: "getTransactionIcon" },
  { state: "trade_profit / trade_loss · 净额 < 0", when: "type ∈ {trade_profit, trade_loss} && amount < 0", visual: "TrendingDown · text-trading-red · bg-trading-red/20（图标随净额符号）", source: "getTransactionIcon" },
  { state: "win 语法", when: "amount >= 0", visual: "金额 text-trading-green 带 + 号；描述尾词改写为「· Won」", source: "formatDescription + 金额列取色" },
  { state: "loss 语法", when: "amount < 0", visual: "金额 text-trading-red 带 − 号；描述尾词改写为「· Lost」", source: "formatDescription + 金额列取色" },
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

const TRANSFER_CASES: SectionCase[] = [
  {
    key: "wallet-transfer-normal",
    label: "Transfer · Normal（Boost → Standard）",
    spec: [
      {
        state: "normal",
        when: "0 < amount ≤ 来源账户可用余额",
        visual: "主 CTA 可点，明细行显示转出 / 转入账户与到账金额",
        source: "TransferForm；提交走 supabase/functions/sim-transfer",
      },
    ],
  },
  {
    key: "wallet-transfer-insufficient",
    label: "Transfer · Insufficient balance",
    spec: [
      {
        state: "insufficient",
        when: "amount > 来源账户可用余额（客户端余额比对）；服务端二次判定为 sim-transfer 400 `Insufficient {fromKey} balance`",
        visual: "输入框下红字提示，主 CTA disabled",
        source: "TransferForm 客户端比对 + supabase/functions/sim-transfer",
      },
    ],
  },
  {
    key: "wallet-transfer-zero",
    label: "Transfer · Amount 0 · disabled",
    spec: [
      {
        state: "zero",
        when: "amount ≤ 0（含空输入）",
        visual: "无错误文案，主 CTA disabled",
        source: "TransferForm 提交门",
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
        source: "Wallet.tsx equityNote={isLite ? … : undefined}；句子登记于 docs/copy-dictionary.md §Wallet",
      },
      {
        state: "equity 数值",
        when: "hidden === false",
        visual: "font-mono 主数，两位小数",
        source: "computeTotalEquity = spot_balance + balance（src/lib/equity.ts）",
      },
    ],
  },
];

/* ---- 2026-08-27 audit round · W-1 … W-16 ---- */

const PENDING_CASES: SectionCase[] = [
  {
    key: "wallet-lite-pending-confirmations",
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
    key: "wallet-lite-pending-confirmations-mobile",
    label: "W-2 · PendingConfirmations · mobile",
    note: "移动端为两层行式（非桌面单行自适应）：上层 icon + Deposit + Confirming chip + 右对齐金额；下层 pl-[52px] 依次为 meta、blocks 计数、满宽进度条。卡片内边距 p-4。",
    spec: [
      {
        state: "confirming · mobile",
        when: "viewport < 768px（md: 断点，DOM 内 md:hidden 分支）",
        visual: "两层行：金额右对齐，meta / 6/15 blocks / 满宽进度条左对齐到 pl-[52px]",
        source: "PendingConfirmations.tsx",
      },
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
    key: "wallet-lite-tx-status-column",
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
    key: "wallet-lite-tx-pro-only-types",
    label: "W-20 · 平台入账与跨链行（TxRowPlatformTypes）",
    note: "fiat_* 类型随 Banxa 弃用退役（2026-09-03），MoonPay 轮重启前不再展示。cross-chain 为真业务（bridge 仅支持 deposit）。",
    spec: [
      { state: "cross_chain_in", when: "type === 'cross_chain_in'", visual: "跨链入账，展开显示 source → dest 链与币种", source: "TransactionHistory.tsx" },
      { state: "cross_chain_out", when: "type === 'cross_chain_out'", visual: "跨链出账，金额为负", source: "TransactionHistory.tsx" },
      { state: "fiat_buy", when: "type === 'fiat_buy'", visual: "见 W-17：与 crypto deposit 同构（ArrowDownLeft 绿 · bg-trading-green/20）", source: "TransactionHistory.tsx" },
      { state: "fiat_sell", when: "type === 'fiat_sell'", visual: "法币卖出 USDC，金额为负", source: "TransactionHistory.tsx" },
    ],
  },
];

const TX_FIAT_CASES: SectionCase[] = [
  {
    key: "wallet-lite-tx-fiat-buy",
    label: "W-17 · 交易流水 · fiat_buy + 净额符号判定",
    note: "win/lose 与图标一律看净额符号；type 只决定来源注记。",
    spec: [
      {
        state: "fiat_buy",
        when: "type === 'fiat_buy'",
        visual: "ArrowDownLeft · text-trading-green · bg-trading-green/20；金额 +$250.00 绿；来源注记来自描述通道字段（Banxa）；Deposits 筛选包含此行",
        source: "TransactionHistory getTransactionIcon / pillFilter",
      },
      {
        state: "type=trade_loss 但净额 > 0",
        when: "type === 'trade_loss' && amount >= 0",
        visual: "TrendingUp · text-trading-green · bg-trading-green/20；金额 +$28.87 绿；描述尾词渲染为「· Won」（不再是 Lost）",
        source: "formatDescription 尾词改写 + getTransactionIcon",
      },
      {
        state: "type=trade_profit 但净额 < 0",
        when: "type === 'trade_profit' && amount < 0",
        visual: "TrendingDown · text-trading-red · bg-trading-red/20；金额 −$12.40 红；描述尾词渲染为「· Lost」",
        source: "formatDescription 尾词改写 + getTransactionIcon",
      },
    ],
  },
];

const ADDRESS_EMPTY_CASES: SectionCase[] = [
  {
    key: "wallet-lite-address-empty",
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
        source: "HeroEquityCard hidden（Wallet.tsx equityHidden 本地态，不落库）",
      },
    ],
  },
];

const DEPOSIT_DIALOG_CASES: SectionCase[] = [
  {
    key: "wallet-deposit-dialog-checklist",
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
    key: "wallet-deposit-dialog-address",
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
    key: "wallet-deposit-dialog-fiat",
    label: "W-14 · Deposit 弹窗 · Fiat tab",
    spec: [
      { state: "fiat", when: "tab === 'fiat'", visual: "法币金额输入 + 报价行 + Banxa 跳转 CTA", source: "BuyWithFiat.tsx" },
    ],
  },
  {
    key: "wallet-deposit-dialog-wallet-tab",
    label: "W-15 · Deposit 弹窗 · Wallet（跨链）tab",
    spec: [
      { state: "crosschain", when: "tab === 'crosschain'", visual: "来源链 / 币种选择 + 金额 + 报价明细", source: "CrossChainDeposit.tsx" },
    ],
  },
];

const WITHDRAW_CASES: SectionCase[] = [
  {
    key: "wallet-withdraw-desktop-form",
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

/* ---- 2026-09-03 · M7a-② 迁移轮：Ⓐ 组合层与登录门 ---- */

const LAYOUT_CASES: SectionCase[] = [
  {
    key: "wallet-page-layout",
    label: "W-18 · Wallet 组合层（WalletPageLayout）",
    note:
      "桌面为三段：Hero（满宽）→ 双账户卡 grid-cols-2 → 12 栅格 8（流水 / recovery 文字链）+ 4（Saved addresses）。帧内 recovery 文字链为 chrome 复刻，文案与生产一致。",
    spec: [
      {
        state: "Total equity",
        when: "恒显",
        visual: "Hero 主数 $15,885.23 + 副行 'Boost + Standard · does not include open trade profit'",
        source: "computeTotalEquity = spot_balance + balance（src/lib/equity.ts）",
      },
      {
        state: "双账户卡",
        when: "恒显",
        visual: "Standard $482.95 / Boost $15,402.28；桌面 grid-cols-2、移动纵排 space-y-3",
        source: "SpotAccountCard / FuturesAccountCard（src/pages/Wallet.tsx）",
      },
      {
        state: "Mainnet chip",
        when: "恒显",
        visual: "Mainnet 文字 + 绿色 pulse 点；属 header chrome（不随 wallet body 滚动），不属 wallet 组合层",
        source: "MainnetBadge via Logo（showMainnetBadge 默认 true）→ EventsDesktopHeader / MobileHeader brand",
      },
      {
        state: "维护公告位",
        when: "MAINTENANCE_NOTICES 中存在 startAt ≤ now < endAt 的条目",
        visual: "Hero 上方整宽公告条；无生效条目时该位零高度",
        source: "MaintenanceNoticeBanner + src/config/maintenanceNotices.ts",
      },
      {
        state: "recovery 文字链",
        when: "恒显（与 PendingConfirmations 是否渲染无关）",
        visual: "桌面在 8 栏底部、移动在流水卡下方：`Sent funds to the wrong network? Request recovery →`",
        source: "Wallet.tsx → navigate('/wallet/recovery')",
      },
      {
        state: "栅格",
        when: "desktop（>= 768px）",
        visual: "grid grid-cols-12 gap-6，主列 col-span-8、侧列 col-span-4",
        source: "Wallet.tsx Band 3",
      },
    ],
  },
];

const AUTH_GATE_CASES: SectionCase[] = [
  {
    key: "wallet-auth-gate",
    label: "W-19 · 登录门（WalletAuthGate）",
    note:
      "/wallet · /deposit · /withdraw 三路由自 2026-09-03 起同门；guest 底层一律为 WalletGatePlaceholder 占位灰块，不挂任何真实余额 / 地址 / 表单组件。两帧由 forceSignedOut fixture 强制 guest 形态，不依赖运行时 auth 状态。",
    spec: [
      {
        state: "Lite 门",
        when: "surface === 'lite' && !user",
        visual: "LiteAuthGate 形态：占位灰块 + 居中标题 'Sign in to view your wallet' + 说明 + 登录 CTA",
        source: "WalletAuthGate（src/pages/Wallet.tsx）→ LiteAuthGate",
      },
      {
        state: "Pro 门",
        when: "surface === 'pro' && !user",
        visual: "AuthGateOverlay 形态：底层模糊 + Log In / Sign Up 双按钮；maxPreviewHeight 400px 截断预览区",
        source: "WalletAuthGate → AuthGateOverlay",
      },
      {
        state: "已登录",
        when: "user !== null",
        visual: "门整体不渲染，children 原样透传",
        source: "AuthGateOverlay / LiteAuthGate 早返回",
      },
    ],
  },
];

export const WalletStatesSection = ({ isMobile }: { isMobile: boolean }) => (
  <SectionWrapper
    id="wallet-lite-r1"
    title="Wallet · 状态字典"
    platform="shared"
    description="Wallet 字典唯一主节：组合层与 Hero / 账户与 Transfer / 流水与 pending / 充值流 / 提现流 / 地址簿 / Recovery 与服务件。"
  >
    <div className="space-y-1 rounded-lg border border-[#CFFF4A]/30 bg-[#CFFF4A]/5 px-3 py-2 text-[12px] text-foreground">
      <div>
        本页 = 产品页 <code className="font-mono">/wallet · /deposit · /withdraw · /wallet/recovery</code> 的状态字典。
      </div>
      <div>样式与布局 → 生产页；状态与判定 → 本页。</div>
      <div>
        字段名 / 文案 / 公式 / 术语 → <code className="font-mono">docs/copy-dictionary.md</code>（顶部有 Lite 术语对照表）+{" "}
        <code className="font-mono">docs/delivery/lite-wallet-spec-v1.md</code>（M7b 入库）。
      </div>
    </div>

    <SubSection title="Ⓐ 组合层与 Hero" platform="shared">
      <SectionFrame cases={LAYOUT_CASES} device="desktop" minHeight={900} />
      <div className="mt-3">
        <SectionFrame
          cases={[{ ...LAYOUT_CASES[0], key: "wallet-page-layout-mobile", label: "W-18 · Wallet 组合层 · mobile" }]}
          device="mobile"
          minHeight={900}
        />
      </div>
      <div className="mt-3">
        <SectionFrame cases={AUTH_GATE_CASES} device="desktop" minHeight={720} />
      </div>
      <div className="mt-3">
        <SectionFrame cases={AUTH_GATE_CASES} device="mobile" minHeight={720} />
      </div>
      <div className="mt-3">
        <SectionFrame cases={[...HERO_CASES, ...HERO_HIDDEN_CASES]} device="desktop" minHeight={520} />
      </div>
      <div className="mt-3">
        <SectionFrame cases={[...HERO_CASES, ...HERO_HIDDEN_CASES]} device="mobile" minHeight={560} />
      </div>
    </SubSection>

    <SubSection title="Ⓑ 账户与 Transfer" platform="shared">
      <SectionFrame cases={[{ key: "wallet-equity-bands", label: "Standard / Boost 双账户卡" }]} device="desktop" minHeight={340} />
      <div className="mt-3">
        <SectionFrame cases={TRANSFER_CASES} device="desktop" minHeight={460} />
      </div>
      <div className="mt-3">
        <SectionFrame cases={BADGE_CASES} device="desktop" minHeight={140} />
      </div>
    </SubSection>

    <SubSection title="Ⓒ 流水与 pending" platform="shared">
      <SectionFrame cases={[PENDING_CASES[0]]} device="desktop" minHeight={280} />
      <div className="mt-3">
        <SectionFrame cases={[PENDING_CASES[1]]} device="mobile" minHeight={300} />
      </div>
      <div className="mt-3">
        <SectionFrame
          cases={[TX_CASES[0], TX_CASES[1], ...TX_EMPTY_CASES, ...TX_STATE_CASES, ...TX_FIAT_CASES]}
          device={isMobile ? "mobile" : "desktop"}
          minHeight={620}
        />
      </div>
    </SubSection>

    <SubSection title="Ⓓ 充值流（M7b 填充）" platform="desktop">
      <SectionFrame cases={DEPOSIT_DIALOG_CASES} device="desktop" minHeight={620} />
    </SubSection>

    <SubSection title="Ⓔ 提现流（M7b 填充）" platform="desktop">
      <SectionFrame cases={WITHDRAW_CASES} device="desktop" minHeight={520} />
    </SubSection>

    <SubSection title="Ⓕ 地址簿" platform="shared">
      <SectionFrame cases={ADDRESS_DESKTOP_CASES} device="desktop" minHeight={200} />
      <div className="mt-3">
        <SectionFrame cases={ADDRESS_MOBILE_CASES} device="mobile" minHeight={380} />
      </div>
      <div className="mt-3">
        <SectionFrame cases={ADDRESS_EMPTY_CASES} device="desktop" minHeight={300} />
      </div>
    </SubSection>

    <SubSection title="Ⓖ Recovery 与服务件（M7b 填充）" platform="shared">
      <div className="rounded-lg border border-dashed border-border/60 px-3 py-4 text-[12px] text-muted-foreground">
        空壳：/wallet/recovery 表单三态、WithdrawVerifyDialog 四模式、WithdrawStatusTracker —— M7b 填充。
      </div>
    </SubSection>
  </SectionWrapper>
);
