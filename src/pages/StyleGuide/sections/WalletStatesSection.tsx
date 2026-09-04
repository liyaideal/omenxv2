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
      { state: "empty", when: "transactions.length === 0", visual: "站点统一 EmptyState（无筛选 pill 行）+ lynx 插画", source: "TransactionHistory.tsx" },
      { state: "插画资产", when: "同上", visual: "src/assets/wallet/lynx-empty-activity.png（330×330 PNG）", source: "Foundations › Brand assets · IP 插画" },
    ],
  },
  {
    key: "wallet-lite-tx-empty-filtered",
    label: "W-4 · 交易流水 · 筛选后为空",
    spec: [
      {
        state: "empty-filtered",
        when: "filter !== 'all' 且该筛选下无行",
        visual: "保留 pill 行，正文为「该筛选下暂无记录」语气的空态；插画同 W-3",
        source: "TransactionHistory.tsx filter 分支",
      },
      { state: "插画资产", when: "同上", visual: "src/assets/wallet/lynx-empty-activity.png（330×330 PNG）", source: "Foundations › Brand assets · IP 插画" },
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
      {
        state: "插画资产",
        when: "同上",
        visual: "src/assets/wallet/lynx-empty-addresses.png（330×330 PNG）",
        source: "Foundations › Brand assets · IP 插画",
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


/* ---- 2026-09-03 · M7b 收官轮：Ⓓ 充值流 / Ⓔ 提现流 / Ⓖ Recovery 与服务件 ---- */

const DEPOSIT_FLOW_CASES: SectionCase[] = [
  {
    key: "wallet-deposit-to-screen",
    label: "W-21 · Deposit-to 前屏（DepositToScreen）",
    note: "账户选择记忆现为 localStorage（useAccountPreference）；服务端化已于 08-31 拍板转研发，见 lite-wallet-spec-v1.md §3。",
    spec: [
      { state: "未选择", when: "selected === null", visual: "两张账户行（Standard / Boost）均未高亮，页面不进入下一步", source: "AccountPickerRows（src/components/wallet/AccountPicker.tsx）" },
      { state: "已选择", when: "selected === 'spot' | 'futures'", visual: "选中行描边高亮 + 勾选态，进入 Address tab", source: "Deposit.tsx 前屏" },
    ],
  },
  {
    key: "wallet-deposit-checklist",
    label: "W-22 · 充值确认清单（DepositChecklist）",
    note: "两态同帧：未全勾（CTA 锁）与全勾放行（露出地址）见 W-23。",
    spec: [
      { state: "未全勾", when: "acknowledged === false（三项复选未全部勾选）", visual: "三条风险须知 + disabled 继续按钮，地址与二维码不渲染", source: "WalletDeposit.tsx" },
      { state: "全勾放行", when: "三项全部勾选", visual: "清单收起，切换为地址态（W-23）", source: "WalletDeposit.tsx" },
    ],
  },
  {
    key: "wallet-deposit-address",
    label: "W-23 · 充值地址与 QR（DepositAddress）",
    note: "帧接 fixtureAddress（固定演示地址 0x8f2a91…c4d071），不调用 get-deposit-address 边缘函数 —— 该 case 零网络请求。",
    spec: [
      { state: "Network", when: "恒显", visual: "Base（演示值）", source: "WalletDeposit.tsx InfoRow" },
      { state: "Token", when: "恒显", visual: "USDC（演示值）", source: "WalletDeposit.tsx InfoRow" },
      { state: "Fee", when: "恒显", visual: "0（演示值）", source: "WalletDeposit.tsx InfoRow" },
      { state: "确认数", when: "恒显", visual: "12 confirmations（演示值）", source: "types/deposit.ts confirmationBlocks" },
      { state: "地址区", when: "fixtureAddress 提供或 EF 返回", visual: "QR + §6 ColoredAddress + Copy；文案 Only send USDC on Base network.", source: "WalletDeposit.tsx" },
    ],
  },
  {
    key: "wallet-deposit-dialog-wallet-tab",
    label: "W-24 · 跨链充值 tab（CrossChainDeposit）",
    note: "bridge 为真业务（仅 deposit，withdraw 不支持）；本前端流程为演示语义，接真 bridge 归研发。",
    spec: [
      { state: "选链", when: "step === 'swap'", visual: "来源链 / 币种选择 + 金额输入；Bridge Fee 行为中性灰 Varies by route", source: "CrossChainDeposit.tsx" },
      { state: "报价", when: "amount > 0", visual: "报价明细行（到账估算 / 路由 / 滑点设置入口）", source: "CrossChainDeposit.tsx" },
      { state: "review", when: "点击继续后的确认步", visual: "确认页 + 假进度阶段（本字典按静态步帧解读，不做动画取证）", source: "CrossChainDeposit.tsx processingStage" },
    ],
  },
  {
    key: "wallet-deposit-dialog-fiat",
    label: "W-14 · Deposit 弹窗 · Fiat tab（已退役，仅存档深链）",
    note: "fiat_* 随 Banxa 弃用退役（2026-09-03），Fiat tab 入口已从 /deposit 与 DepositDialog 移除；BuyWithFiat.tsx 保留在仓库，MoonPay 轮重启前不再展示。",
  },
];

const WITHDRAW_FLOW_CASES: SectionCase[] = [
  {
    key: "wallet-withdraw-form",
    label: "W-25 · 提现表单全态（WithdrawForm）· mobile",
    note: "接 fixtureWallets（1 条 Base primary + 1 条 Tron 非 Base），零 supabase 请求。金额相关分支（insufficient / invalid / MAX）由组件内部 state 驱动，本轮无 docs 通道可外部注入，故只出初始 / 地址预填帧；分支判定逐条列在下表。",
    spec: [
      { state: "初始", when: "amount === '' 且未选地址", visual: "地址行为占位，CTA disabled", source: "WalletWithdraw.tsx" },
      { state: "选中地址", when: "primary 且 network === 'Base'", visual: "自动预填 primary 地址（非 Base primary 不预填）", source: "WalletWithdraw.tsx（09-03 Base-only）" },
      { state: "insufficient（含 fee）", when: "amount + fee > sourceBalance", visual: "红字 Insufficient balance (including fee)，CTA disabled", source: "useWithdraw.validateWithdrawal" },
      { state: "invalid address", when: "地址非 0x + 40 hex", visual: "红字 Invalid wallet address", source: "useWithdraw.validateWithdrawal（Base-only）" },
      { state: "MAX", when: "点击 Max", visual: "金额填入 availableBalance，明细行同步 fee / You'll receive", source: "WalletWithdraw.tsx" },
      { state: "限额（演示值，真值待运营定）", when: "恒显于明细/校验", visual: "min 20 / max 10,000 / 日限 50,000 / fee 1", source: "useWithdraw.ts DEFAULT_LIMITS + getWithdrawFee" },
    ],
  },
  {
    key: "wallet-withdraw-desktop-form",
    label: "W-16 · Withdraw · desktop 表单（同 W-25 判定）",
    note: "桌面帧同样接 fixtureWallets；判定表见 W-25，不重复。",
  },
  {
    key: "wallet-withdraw-address-drawer",
    label: "W-26 · 地址选择（WithdrawAddressSelect · list + 空态）",
    spec: [
      { state: "Base 地址行", when: "wallet.network 含 'base'", visual: "可点击选中，行尾勾选态", source: "WithdrawAddressSelect.tsx" },
      { state: "非 Base 地址行 · disabled", when: "!wallet.network.toLowerCase().includes('base')", visual: "整行 disabled，caption 逐字 `Base only — this address can't receive withdrawals`", source: "WithdrawAddressSelect.tsx（09-03 Base-only）" },
      { state: "空态", when: "wallets.length === 0", visual: "只剩 Add new address 行", source: "WithdrawAddressSelect.tsx" },
    ],
  },
  {
    key: "wallet-withdraw-address-add",
    label: "W-26b · 新增地址（同抽屉 add step）",
    spec: [
      { state: "network 固定", when: "恒显", visual: "Network 固定 Base，无选择器", source: "AddAddressFields / EMPTY_FORM.network = 'Base'（09-03）" },
    ],
  },
  {
    key: "wallet-withdraw-verify",
    label: "W-27a · 提现验证 · email OTP",
    note: "demo 码 111111 属切真开关（src/lib/demoOtp.ts），接真验证码归研发，见 lite-wallet-spec-v1.md §3。",
    spec: [
      { state: "email_otp", when: "profile.withdraw_2fa_mode 含 email 且 profile.email 非空", visual: "邮箱 OTP 输入", source: "WithdrawVerifyDialog.tsx（fixtureMode='email_otp'）" },
    ],
  },
  {
    key: "wallet-withdraw-verify-bind-email",
    label: "W-27b · 提现验证 · 绑定邮箱",
    spec: [
      { state: "bind_email", when: "模式含 email 且 profile.email 为空", visual: "先绑定邮箱再发码", source: "WithdrawVerifyDialog.tsx（fixtureMode='bind_email'）" },
    ],
  },
  {
    key: "wallet-withdraw-verify-totp",
    label: "W-27c · 提现验证 · TOTP",
    spec: [
      { state: "totp", when: "模式含 totp 且 totp_enabled === true", visual: "6 位验证器码输入", source: "WithdrawVerifyDialog.tsx（fixtureMode='totp'）" },
    ],
  },
  {
    key: "wallet-withdraw-verify-bind-totp",
    label: "W-27d · 提现验证 · 绑定验证器",
    note: "演示密钥固定为 OMENXDEMOSECRET234567（demoSecret prop），生产路径仍走随机生成。",
    spec: [
      { state: "bind_totp", when: "模式含 totp 且 totp_enabled === false", visual: "二维码 + base32 密钥 + 首次验证输入", source: "WithdrawVerifyDialog.tsx（fixtureMode='bind_totp'）" },
    ],
  },
  {
    key: "wallet-withdraw-status",
    label: "W-28 · 提现状态追踪（WithdrawStatusTracker）",
    note: "failed 帧的句子「Your funds have been unfrozen and returned to your available balance.」当前无冻结实现——资金边界见 docs/delivery/lite-wallet-spec-v1.md §3。",
    spec: [
      { state: "processing", when: "status ∈ {REQUESTED, APPROVED, SENT}", visual: "四步进度条推进到当前步", source: "WithdrawStatusTracker STATUS_STEPS" },
      { state: "done", when: "status === 'CONFIRMED'", visual: "全绿完成态 + tx 链接 basescan.org/tx/{txHash}", source: "WithdrawStatusTracker" },
      { state: "failed", when: "status ∈ {FAILED, REJECTED}", visual: "红色 XCircle + 失败说明 + 解冻返还句", source: "WithdrawStatusTracker" },
    ],
  },
  {
    key: "wallet-withdraw-sticky-bar",
    label: "W-29 · 提现 sticky 栏（StickyWithdrawBar）",
    spec: [
      { state: "disabled", when: "state.disabled === true && loading === false", visual: "整条 CTA 置灰不可点", source: "WithdrawSubmitContext.state" },
      { state: "可提交", when: "state.disabled === false", visual: "primary 实心 Withdraw", source: "WithdrawSubmitContext.state" },
      { state: "提交中", when: "state.loading === true", visual: "Loader2 + Processing...", source: "StickyWithdrawBar.tsx" },
      { state: "贴底偏移", when: "offsetBottomNav === true（生产 /withdraw）", visual: "bottom / marginBottom 取 var(--bottom-nav-h, 76px) + safe-area", source: "StickyWithdrawBar.tsx（DESIGN.md §5）" },
    ],
  },
];

const RECOVERY_CASES: SectionCase[] = [
  {
    key: "wallet-recovery-intro",
    label: "W-30 · Recovery 入口与表单（RecoveryRequest）",
    note: "intro 卡与 Sign in required 为 chrome 复刻（文案与生产一致，卡片本体写在 src/pages/RecoveryRequest.tsx 内未导出）；表单为生产 RecoveryForm。",
    spec: [
      { state: "intro", when: "恒显于 /wallet/recovery", visual: "10% flat fee / 3–7 business days 两枚 Pill + 「A flat 10% recovery fee applies」段", source: "RecoveryRequest.tsx intro" },
      { state: "表单校验", when: "字段未通过 zod schema", visual: "字段下红字（Enter a valid transaction hash / Amount must be greater than 0 等）", source: "RecoveryForm.tsx schema" },
      { state: "未登录门", when: "!user", visual: "全局 LiteAuthGate：开门 lynx 插画 + 'Sign in to view your recovery requests' + 说明句 + 渐变 Sign in / 描边 Create account，blur 底层为 intro 卡 + Your requests 灰块骨架", source: "RecoveryRequest.tsx 未登录分支 → src/components/auth/LiteAuthGate" },
    ],
  },
  {
    key: "wallet-recovery-list",
    label: "W-31 · Recovery 列表（RecoveryList）",
    note: "行 chrome 为复刻；空态为生产 RecoveryEmptyState，状态徽标为生产 RecoveryStatusBadge。",
    spec: [
      { state: "loading", when: "list.isLoading", visual: "居中 Loader2", source: "RecoveryRequest.tsx" },
      { state: "空态", when: "requests.length === 0", visual: "lynx 插画（渲染宽 96）+ `No recovery requests yet` + 副句，无默认图标", source: "RecoveryEmptyState.tsx" },
      { state: "插画资产", when: "同上", visual: "src/assets/wallet/lynx-empty-recovery.png（330×330 PNG）", source: "Foundations › Brand assets · IP 插画" },
      { state: "行态", when: "requests.length > 0", visual: "金额 font-mono + token on network + 状态徽标 + 日期 + chevron", source: "RecoveryRequest.tsx" },
    ],
  },
  {
    key: "wallet-recovery-detail-submitted",
    label: "W-32a · Recovery 详情 · submitted",
    note: "quoted_at / accepted_at 为 schema 残留字段，UI 无任何渲染（3 态机于 05-20 定稿）。",
    spec: [
      { state: "submitted", when: "status === 'submitted'", visual: "时间线停在第 1 步 + 「typically takes 3–7 business days」+ Estimated payout 卡（10% 费自洽）", source: "RecoveryStatusTimeline / RecoveryRequestDetail.tsx" },
    ],
  },
  {
    key: "wallet-recovery-detail-completed",
    label: "W-32b · Recovery 详情 · completed",
    spec: [
      { state: "completed", when: "status === 'completed'", visual: "绿色 Funds credited 卡（Credited to balance +$108.00 / Internal ref）+ Message from OmenX 管理员留言", source: "RecoveryRequestDetail.tsx payoutCard + adminCard" },
    ],
  },
  {
    key: "wallet-recovery-detail-rejected",
    label: "W-32c · Recovery 详情 · rejected",
    spec: [
      { state: "rejected", when: "status === 'rejected'", visual: "红框 Request rejected；payout 卡不渲染；仅 Message from OmenX", source: "RecoveryStatusTimeline rejected 分支" },
    ],
  },
  {
    key: "wallet-maintenance-notice",
    label: "W-33 · 维护横幅（MaintenanceNotice）",
    note: "自 WalletSection 整节收编；数据源 src/config/maintenanceNotices.ts，恢复服务时删除条目即可（不做「已恢复」横幅）。",
    spec: [
      { state: "single", when: "active.length === 1", visual: "黄框单条：Network maintenance · BASE_ETH + 说明句", source: "MaintenanceNoticeBannerView" },
      { state: "multiple", when: "active.length > 1", visual: "多条纵向堆叠 space-y-2", source: "MaintenanceNoticeBannerView" },
      { state: "withNote", when: "notice.note 非空", visual: "说明句下追加第二行灰字备注", source: "NoticeRow" },
      { state: "empty（隐藏）", when: "active.length === 0", visual: "整块 return null，/wallet 该位零高度", source: "MaintenanceNoticeBannerView" },
    ],
  },
];

const MERGE_LEDGER: { from: string; to: string }[] = [
  { from: "DepositWithdrawSection · Funding flows 10 帧 · wallet-deposit-to-screen", to: "Ⓓ W-21" },
  { from: "DepositWithdrawSection · wallet-deposit-checklist", to: "Ⓓ W-22" },
  { from: "DepositWithdrawSection · wallet-deposit-address", to: "Ⓓ W-23" },
  { from: "DepositWithdrawSection · wallet-withdraw-form", to: "Ⓔ W-25" },
  { from: "DepositWithdrawSection · wallet-withdraw-address-drawer", to: "Ⓔ W-26" },
  { from: "DepositWithdrawSection · wallet-withdraw-address-add", to: "Ⓔ W-26b" },
  { from: "DepositWithdrawSection · wallet-withdraw-verify", to: "Ⓔ W-27a（并新增 W-27b/c/d 四模式静态帧）" },
  { from: "DepositWithdrawSection · wallet-withdraw-status", to: "Ⓔ W-28" },
  { from: "DepositWithdrawSection · wallet-account-picker", to: "Ⓔ 账户选择（沿用原 key，归 Ⓔ 区）" },
  { from: "DepositWithdrawSection · wallet-address-delete", to: "Ⓕ 地址簿" },
  { from: "DepositWithdrawSection · Recovery Request Status（Badge + 三条 Timeline）", to: "Ⓖ W-32a/b/c" },
  { from: "DepositWithdrawSection · Withdraw Verification（运行时 live 弹窗按钮）", to: "Ⓔ W-27 四帧静态化（不再挂 live 按钮）" },
  { from: "WalletSection · Maintenance Notice（4 preset 切换器）", to: "Ⓖ W-33（4 preset 拆静态分帧）" },
  { from: "DepositWithdrawSection · Funding assets 手抄卡（Base / USDC / Banxa）", to: "退场（Banxa 已退役；Base/USDC 口径见 lite-wallet-spec-v1.md §1）" },
  { from: "DepositWithdrawSection · Typography Standards 手抄表", to: "退场 → 移交 lite-wallet-spec-v1.md §9（6 条：Amount input / CTA button / Balance display / Wallet address / Status step label / Result amount）" },
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

    <SubSection title="Ⓓ 充值流" platform="shared">
      <SectionFrame cases={[DEPOSIT_FLOW_CASES[0], DEPOSIT_FLOW_CASES[1], DEPOSIT_FLOW_CASES[2]]} device="mobile" minHeight={900} />
      <div className="mt-3">
        <SectionFrame cases={DEPOSIT_DIALOG_CASES.slice(0, 2)} device="desktop" minHeight={620} />
      </div>
      <div className="mt-3">
        <SectionFrame cases={[DEPOSIT_FLOW_CASES[3]]} device="desktop" minHeight={640} />
      </div>
      <div className="mt-3">
        <SectionFrame cases={[DEPOSIT_FLOW_CASES[4]]} device="desktop" minHeight={520} />
      </div>
    </SubSection>

    <SubSection title="Ⓔ 提现流" platform="shared">
      <SectionFrame cases={[WITHDRAW_FLOW_CASES[0]]} device="mobile" minHeight={820} />
      <div className="mt-3">
        <SectionFrame cases={[WITHDRAW_FLOW_CASES[1]]} device="desktop" minHeight={620} />
      </div>
      <div className="mt-3">
        <SectionFrame cases={[WITHDRAW_FLOW_CASES[2], WITHDRAW_FLOW_CASES[3]]} device="mobile" minHeight={900} />
      </div>
      <div className="mt-3">
        <SectionFrame cases={WITHDRAW_FLOW_CASES.slice(4, 8)} device="mobile" minHeight={1200} />
      </div>
      <div className="mt-3">
        <SectionFrame cases={WITHDRAW_FLOW_CASES.slice(4, 8)} device="desktop" minHeight={1200} />
      </div>
      <div className="mt-3">
        <SectionFrame cases={[WITHDRAW_FLOW_CASES[8]]} device="mobile" minHeight={760} />
      </div>
      <div className="mt-3">
        <SectionFrame cases={[WITHDRAW_FLOW_CASES[9]]} device="mobile" minHeight={340} />
      </div>
      <div className="mt-3">
        <SectionFrame cases={[{ key: "wallet-account-picker", label: "Ⓔ · 账户选择抽屉（From account）" }]} device="mobile" minHeight={340} />
      </div>
    </SubSection>

    <SubSection title="Ⓕ 地址簿" platform="shared">
      <SectionFrame cases={ADDRESS_DESKTOP_CASES} device="desktop" minHeight={200} />
      <div className="mt-3">
        <SectionFrame cases={ADDRESS_MOBILE_CASES} device="mobile" minHeight={380} />
      </div>
      <div className="mt-3">
        <SectionFrame cases={ADDRESS_EMPTY_CASES} device="desktop" minHeight={300} />
      </div>
      <div className="mt-3">
        <SectionFrame
          cases={[
            {
              key: "wallet-address-delete",
              label: "Ⓕ · 删除地址确认抽屉",
              spec: [
                {
                  state: "确认删除",
                  when: "点击 ⋯ → Delete address",
                  visual: "MobileDrawerStatus + MobileDrawerActions（Cancel / 红色 Delete）",
                  source: "DeleteAddressDrawer.tsx",
                },
                {
                  state: "新增地址网络",
                  when: "Add address（抽屉 add step / 桌面 AddAddressDialog）",
                  visual: "network 固定 Base，无选择器",
                  source: "09-03 Base-only 收敛（EMPTY_FORM.network = 'Base'）",
                },
              ],
            },
          ]}
          device="mobile"
          minHeight={380}
        />
      </div>
    </SubSection>

    <SubSection title="Ⓖ Recovery 与服务件" platform="shared">
      <SectionFrame cases={[RECOVERY_CASES[0]]} device="desktop" minHeight={1100} />
      <div className="mt-3">
        <SectionFrame cases={[RECOVERY_CASES[1]]} device="desktop" minHeight={760} />
      </div>
      <div className="mt-3">
        <SectionFrame cases={[RECOVERY_CASES[1]]} device="mobile" minHeight={860} />
      </div>
      <div className="mt-3">
        <SectionFrame cases={RECOVERY_CASES.slice(2, 5)} device="desktop" minHeight={1400} />
      </div>
      <div className="mt-3">
        <SectionFrame cases={RECOVERY_CASES.slice(2, 5)} device="mobile" minHeight={1600} />
      </div>
      <div className="mt-3">
        <SectionFrame cases={[RECOVERY_CASES[5]]} device="desktop" minHeight={560} />
      </div>
    </SubSection>

    <SubSection title="并账列账表（旧节 → 本节）" platform="shared">
      <div className="overflow-x-auto rounded-md border border-border/40">
        <table className="w-full min-w-[640px] border-collapse text-left text-[11px]">
          <thead>
            <tr className="bg-muted/20 text-[10px] uppercase tracking-wider text-muted-foreground/70">
              <th className="px-2 py-1.5 font-medium">原文位置</th>
              <th className="px-2 py-1.5 font-medium">去向</th>
            </tr>
          </thead>
          <tbody>
            {MERGE_LEDGER.map((r) => (
              <tr key={r.from} className="border-t border-border/30 align-top">
                <td className="px-2 py-1.5 font-mono text-[10.5px] text-muted-foreground">{r.from}</td>
                <td className="px-2 py-1.5 text-muted-foreground">{r.to}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SubSection>

  </SectionWrapper>
);
