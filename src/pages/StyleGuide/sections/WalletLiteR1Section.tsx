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
    key: "wallet-lite-gate-lite",
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
    key: "wallet-lite-gate-pro",
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

const AUTH_DESKTOP_CASES: SectionCase[] = [
  {
    key: "wallet-lite-auth-login-desktop",
    label: "AuthContent · login · isLite · desktop（AuthDialog 内）",
    spec: [
      {
        state: "login · lite",
        when: "step === 'login' && surface === 'lite'",
        visual:
          "lynx 图 /lynx-auth-placeholder.png + 'Trade what happens next' + 'Intraday crypto, stock and sports markets — settled in USDC.'；tab active = bg-[#F2F3F5] text-[#090A0C]",
        source: "AuthContent.tsx isLite 分支",
      },
      {
        state: "login · pro",
        when: "step === 'login' && surface === 'pro'",
        visual: "原 Pro 版式（本轮零改动）",
        source: "AuthContent.tsx",
      },
    ],
  },
  {
    key: "wallet-lite-auth-create-desktop",
    label: "AuthContent · createWallet · isLite · desktop",
    spec: [
      {
        state: "createWallet · lite",
        when: "step === 'createWallet' && surface === 'lite'",
        visual: "三行 volt 勾价值点 + Cloudflare Turnstile 占位块 + btn-primary 'Create wallet'",
        source: "AuthContent.tsx isLite 分支",
      },
      {
        state: "loading",
        when: "isLoading === true",
        visual: "主按钮内 Loader2 自旋，按钮禁用",
        source: "AuthContent isLoading",
      },
    ],
  },
  {
    key: "wallet-lite-auth-profile-desktop",
    label: "AuthContent · completeProfile · isLite · desktop",
    spec: [
      {
        state: "completeProfile · lite",
        when: "step === 'completeProfile' && surface === 'lite'",
        visual:
          "volt 横幅 + bg-muted/30 rounded-lg 卡片（username / email）+ btn-primary 'Start trading →'",
        source: "AuthContent.tsx isLite 分支",
      },
      {
        state: "email 非法",
        when: "emailError !== ''",
        visual: "email 输入下方红色错误行，提交拦截",
        source: "AuthContent emailError",
      },
    ],
  },
];

const AUTH_MOBILE_CASES: SectionCase[] = [
  {
    key: "wallet-lite-auth-login-mobile",
    label: "AuthContent · login · isLite · mobile（AuthSheet 内）",
    note: "AuthSheet = MobileDrawer；a11y 补了 VisuallyHidden SheetTitle 'Sign in'，视觉零变化。",
    spec: [
      {
        state: "login · lite · mobile",
        when: "step === 'login' && surface === 'lite' && variant === 'mobile'",
        visual: "同 desktop 文案与 tab 配色，容器为底部抽屉（max-h-[85vh]，无关闭按钮）",
        source: "AuthSheet.tsx + AuthContent.tsx",
      },
    ],
  },
  {
    key: "wallet-lite-auth-create-mobile",
    label: "AuthContent · createWallet · isLite · mobile",
    spec: [
      {
        state: "createWallet · lite · mobile",
        when: "step === 'createWallet' && variant === 'mobile'",
        visual: "三行 volt 勾 + Turnstile 占位块（静态，非真实校验）",
        source: "AuthContent.tsx",
      },
    ],
  },
  {
    key: "wallet-lite-auth-profile-mobile",
    label: "AuthContent · completeProfile · isLite · mobile",
    spec: [
      {
        state: "completeProfile · lite · mobile",
        when: "step === 'completeProfile' && variant === 'mobile'",
        visual: "volt 横幅 + bg-muted/30 卡片 + btn-primary 'Start trading →'",
        source: "AuthContent.tsx",
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
    key: "wallet-lite-tx-icon-matrix",
    label: "交易流水 · transfer 方向文案",
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

export const WalletLiteR1Section = ({ isMobile }: { isMobile: boolean }) => (
  <SectionWrapper
    id="wallet-lite-r1"
    title="Wallet Lite R1 · 状态字典"
    platform="shared"
    description="2026-08 Wallet Lite 改版三批：批1 未登录门 + Lite 登录弹层三步 / 批2 地址 ⋯ 菜单 + 账户徽标配色 + Hero 文案 / 批3 流水行清理 + 列对齐 + icon 全类型映射。"
  >
    <SubSection title="1 · 未登录门（Lite vs Pro）" platform="shared">
      <SectionFrame cases={GATE_CASES} device={isMobile ? "mobile" : "desktop"} minHeight={460} />
    </SubSection>

    <SubSection title="2 · Lite 登录弹层三步 · desktop（AuthDialog）" platform="desktop">
      <SectionFrame cases={AUTH_DESKTOP_CASES} device="desktop" minHeight={640} />
    </SubSection>

    <SubSection title="2 · Lite 登录弹层三步 · mobile（AuthSheet）" platform="mobile">
      <SectionFrame cases={AUTH_MOBILE_CASES} device="mobile" minHeight={640} />
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
  </SectionWrapper>
);
