// ============================================================
// Lite 页面节 · H2E Campaign（/rewards 网格卡 + /rewards/campaign/h2e 详情）
// 每个状态 = 一个真实渲染 case（生产组件 + 可选 fixture prop），状态表是附注。
// 禁 barrel import：本文件只 import shell / SectionFrame / SubSection。
// ============================================================
import { SubSection } from "../../components";
import { SectionFrame, type SectionCase } from "../../components/SectionFrame";
import { LitePage } from "./shell";

type P = { isMobile: boolean };

/* ------------------ 01–07 · H2eCampaignCard ------------------ */

const C01: SectionCase = {
  key: "h2e-card-s0",
  label: "01 · H2eCampaignCard · S0 游客",
  note: "stage = !user ? S0 : totalEarned > 0 ? S3 : activeAccounts.length > 0 ? S2 : S1。四段互斥，没有第五种。",
  spec: [
    {
      state: "S0 游客",
      when: "!user",
      visual: "机制文案 + `Sign in to track yours`，不出现任何金额；无三步行",
      source: "useAuth.user（fixture.stage 覆盖仅用于本预览）",
    },
  ],
};

const C02: SectionCase = {
  key: "h2e-card-s1",
  label: "02 · H2eCampaignCard · S1 已登录未绑",
  spec: [
    {
      state: "S1",
      when: "user && totalEarned === 0 && activeAccounts.length === 0",
      visual: "三步行 Connect wallet → Receive airdrops → Trade to unlock，第 ① 步 pulse #33D6FF 加粗",
      source: "useConnectedAccounts.activeAccounts",
    },
  ],
};

const C03: SectionCase = {
  key: "h2e-card-s2-scanning",
  label: "03 · H2eCampaignCard · S2 扫描中",
  spec: [
    {
      state: "S2 · scanning",
      when: "activeAccounts.some(a => a.scanStatus === 'scanning')",
      visual: "① 变 ✓ 绿，② 高亮；说明句 = `Scanning positions…`",
      source: "account.scanStatus",
    },
  ],
};

const C04: SectionCase = {
  key: "h2e-card-s2-plural",
  label: "04 · H2eCampaignCard · S2 有空投（复数）",
  spec: [
    {
      state: "S2 · n > 1",
      when: "!scanning && liveAirdropCount > 1",
      visual: "`3 positions scanned · 2 airdrops active — earnings land when hedges settle.`",
      source: "liveAirdropCount = airdrops.filter(source !== 'voucher' && status ∈ {pending, activated}).length",
    },
  ],
};

const C05: SectionCase = {
  key: "h2e-card-s2-singular",
  label: "05 · H2eCampaignCard · S2 有空投（单数）",
  spec: [
    {
      state: "S2 · n === 1",
      when: "!scanning && liveAirdropCount === 1",
      visual: "`3 positions scanned · 1 airdrop active — earnings land when hedges settle.`（单数 airdrop）",
      source: "同上",
    },
  ],
};

const C06: SectionCase = {
  key: "h2e-card-s2-none",
  label: "06 · H2eCampaignCard · S2 无合格仓位",
  spec: [
    {
      state: "S2 · n === 0",
      when: "!scanning && liveAirdropCount === 0",
      visual: "`No qualifying positions yet — positions ≥ $20 held a day qualify.`",
      source: "同上",
    },
  ],
};

const C07: SectionCase = {
  key: "h2e-card-s3",
  label: "07 · H2eCampaignCard · S3 有收益",
  spec: [
    {
      state: "S3",
      when: "totalEarned > 0",
      visual: "Earned / Cap `$11.00 / $100` + pulse 进度条 + Withdrawal unlock `0% · next 10% at $10K`",
      source: "useH2eRewardsSummary",
    },
  ],
};

/* ---------------- 08–09 · ConnectedAccountsCard --------------- */

const C08: SectionCase = {
  key: "h2e-conn-disconnected",
  label: "08 · ConnectedAccountsCard · 未连接",
  note: "连接 Dialog/Drawer 的 detect / signing / verifying 三步是全局模态语法，不做 live case，仅登记于表。",
  spec: [
    { state: "未连接", when: "activeAccounts.length === 0", visual: "说明句 + 白底 `Connect wallet` 按钮 + Kalshi `Coming soon` + QUALIFIES/LIMITS 资格两栏表", source: "useConnectedAccounts" },
    { state: "连接中 · detect", when: "step === 'detect'", visual: "第 1 步 spinner：检测钱包（模态内）", source: "连接状态机" },
    { state: "连接中 · signing", when: "step === 'signing'", visual: "第 2 步：等待 EIP-712 签名", source: "连接状态机" },
    { state: "连接中 · verifying", when: "step === 'verifying'", visual: "第 3 步：校验签名 / 拉取仓位", source: "连接状态机" },
  ],
};

const C09: SectionCase = {
  key: "h2e-conn-linked",
  label: "09 · ConnectedAccountsCard · 已连接",
  note: "计数单一真相源：Airdrops = useAirdropPositions 的 pending+activated（source ≠ voucher），与网格卡 / 进度卡 / 模块徽标同一个数。",
  spec: [
    { state: "已连接", when: "activeAccounts.length > 0", visual: "Connected 徽 + 截断地址 0x742d…bD18 + `Positions: 3 · Airdrops: 2`", source: "useConnectedAccounts / useAirdropPositions" },
    { state: "Airdrops 计数点击", when: "liveAirdropCount > 0", visual: "锚点滚动到 #airdropped-positions（不跳路由、不开弹层）", source: "AirdroppedPositionsCard id" },
  ],
};

/* -------------- 10–12 · AirdroppedPositionsCard --------------- */

const C10: SectionCase = {
  key: "h2e-airdrops-all",
  label: "10 · AirdroppedPositionsCard · 桌面四行全态（徽标 = 2）",
  note: "模块只承载 pending / activated / expired；settled 一律归 Recent settlements。行序固定 pending → activated → expired。",
  spec: [
    { state: "行态 pending", when: "status === 'pending'", visual: "#FFD666 `Activate in 47h 12m` + 白底 Activate（桌面 px-4 py-[7px]）", source: "expiresAt" },
    { state: "行态 activated", when: "status === 'activated'", visual: "volt #CFFF4A 圆点 + `Live · +$0.00`，右侧 pulse `View in portfolio ›`", source: "useRealtimePositionsPnL" },
    { state: "行态 expired", when: "status === 'expired'", visual: "整行 opacity-55，右侧灰字 `Expired`，排尾且不计入徽标", source: "status" },
    { state: "徽标口径", when: "始终", visual: "题头数字 = pending + activated（此 case = 2）", source: "activeCount" },
    { state: "副本行 matched", when: "source === 'matched' && externalEventName", visual: "`Matched: {event} — {side} @ {price}¢ on Polymarket`", source: "sourceLine()" },
    { state: "副本行 未知", when: "其余 source 或缺字段", visual: "省略副本行（不编造来源、不画 `—`）", source: "sourceLine() → null" },
    { state: "voucher 不入列", when: "source === 'voucher'", visual: "取数即过滤，券仓只在 /rewards Vouchers tab", source: "rows filter" },
    { state: "settled 去向", when: "status === 'settled'", visual: "不进本模块，落 Recent settlements，两处不重复计数", source: "useH2eRewardsSummary.settlements" },
  ],
};

const C11: SectionCase = {
  key: "h2e-airdrops-welcome",
  label: "11 · AirdroppedPositionsCard · welcome_gift 行",
  spec: [
    {
      state: "副本行 welcome_gift",
      when: "source === 'welcome_gift'",
      visual: "`Welcome gift — no matching OmenX event for your positions, so we sent one on us`",
      source: "sourceLine()",
    },
  ],
};

const C12: SectionCase = {
  key: "h2e-airdrops-mobile",
  label: "12 · AirdroppedPositionsCard · 移动 375（Activate 整宽 h-11）",
  note: "渲染守卫（游客 / 未连接 / 扫描中 / 零行 → return null，均不画骨架或空态卡）在 fixture 模式下被跳过，仅登记于表。",
  spec: [
    { state: "移动行", when: "isMobile", visual: "两层：文案块在上；倒计时行 → Activate 按钮整宽 h-11；activated 行左右分列", source: "useIsMobile" },
    { state: "不渲染 · 游客", when: "!user", visual: "组件 return null", source: "useUserProfile" },
    { state: "不渲染 · 未连接", when: "activeAccounts.length === 0", visual: "组件 return null", source: "useConnectedAccounts" },
    { state: "不渲染 · 扫描中", when: "!activeAccounts.some(a => a.scanStatus === 'complete')", visual: "组件 return null（不画骨架）", source: "scanStatus" },
    { state: "不渲染 · 零行", when: "rows.length === 0", visual: "组件 return null（不画空态卡）", source: "rows" },
  ],
};

/* ----------------- 13–18 · H2eRewardsCard --------------------- */

const C13: SectionCase = {
  key: "h2e-rewards-s1",
  label: "13 · H2eRewardsCard · S0/S1 三节点引导",
  spec: [
    {
      state: "S0/S1",
      when: "!user || activeAccounts.length === 0",
      visual: "Connect wallet（next，pulse 环）→ Receive airdrops（todo）→ Trade to unlock（todo），每步带说明句",
      source: "stage",
    },
  ],
};

const C14: SectionCase = {
  key: "h2e-rewards-s2",
  label: "14 · H2eRewardsCard · S2 节点态（有空投）",
  spec: [
    {
      state: "S2 · n > 0",
      when: "connected && liveAirdropCount > 0",
      visual: "① ✓ Wallet connected 0x742d…bD18；② next 子行 `3 positions scanned · 2 airdrops active`；③ `Starts once earnings land`",
      source: "liveAirdropCount",
    },
  ],
};

const C15: SectionCase = {
  key: "h2e-rewards-s2-scanning",
  label: "15 · H2eRewardsCard · S2 扫描中子态",
  spec: [
    { state: "S2 · scanning", when: "activeAccounts.some(scanStatus === 'scanning')", visual: "节点②=next，子行 spinner + `Scanning positions…`", source: "scanStatus" },
  ],
};

const C16: SectionCase = {
  key: "h2e-rewards-s2-none",
  label: "16 · H2eRewardsCard · S2 无合格仓位子态",
  spec: [
    { state: "S2 · n === 0", when: "liveAirdropCount === 0", visual: "子行 `No qualifying positions yet — positions ≥ $20 held a day qualify`", source: "liveAirdropCount" },
  ],
};

const C17: SectionCase = {
  key: "h2e-rewards-s3",
  label: "17 · H2eRewardsCard · S3 完整（已连接）",
  note: "S3 横条逐项真值渲染：三个勾各自判定，禁止用 totalEarned > 0 一个条件反推全勾。",
  spec: [
    { state: "横条 · 已连接", when: "activeAccounts.length > 0", visual: "绿 `✓ Connected`", source: "useConnectedAccounts" },
    { state: "横条 · Airdrops", when: "stage === 'S3'", visual: "绿 `✓ Airdrops`", source: "stage" },
    { state: "横条 · Trade to unlock", when: "stage === 'S3'", visual: "pulse #33D6FF 加粗", source: "stage" },
    { state: "Earned / Cap", when: "stage === 'S3'", visual: "`$11.00 / $100` + 5px pulse 进度条，宽度 = earningsPercent%", source: "useH2eRewardsSummary" },
    { state: "解锁进度", when: "stage === 'S3'", visual: "`$5,653 / $10,000` + 六档 stepper（Starter + 10/25/50/75/100%）", source: "unlockTiers / volumeCompleted" },
    { state: "Recent settlements", when: "settlements.length > 0", visual: "最多 3 行：事件名 · trigger + 盈亏色值（+$6.20 / +$4.80）；无行时整段不渲染", source: "settlements" },
  ],
};

const C18: SectionCase = {
  key: "h2e-rewards-s3-disconnected",
  label: "18 · H2eRewardsCard · S3 未连接变体",
  spec: [
    {
      state: "横条 · 未连接",
      when: "activeAccounts.length === 0 && totalEarned > 0",
      visual: "收纳行第一项 = #FFD666 `Wallet not connected`（不勾绿、不隐藏），其余两项照常",
      source: "useConnectedAccounts",
    },
  ],
};

const C19: SectionCase = {
  key: "h2e-aside-signed-out",
  label: "19 · aside `Your rewards here` · 游客态 = SignInPromptCard",
  spec: [
    { state: "游客", when: "!user（signedOut）", visual: "SignInPromptCard 顶替整个 aside，不渲染任何金额位", source: "H2eCampaignDetailPage.signedOut" },
    { state: "登录 · 桌面", when: "user && !isMobile", visual: "Earned / Credited / Locked 三行（credited = max(0, totalEarned − lockedAmount)）+ Open Wallet → + host chip", source: "useH2eRewardsSummary" },
    { state: "登录 · 移动", when: "user && isMobile", visual: "三项改 3 列小卡：Earned pulse / Credited 白 / Locked 灰", source: "同上" },
    { state: "零收益", when: "totalEarned === 0", visual: "三项照常渲染为 $0.00，不隐藏、不换空态文案", source: "同上" },
  ],
};

const READ_ME =
  "怎么读这一节：H2E 四个生产组件都接受一个可选 fixture prop（纯展示覆盖；不传 = 生产行为与视觉零变化，按钮/跳转在 fixture 模式下 inert）。下面每一个状态都是真实渲染，状态表是附注不是替代品。fixture 里的日期全部是相对函数（inHours / inDays），金额为演示值，不取自任何真实账户。";

const DESKTOP_CASES = [C01, C02, C03, C04, C05, C06, C07, C08, C09, C10, C11, C13, C14, C15, C16, C17, C18, C19];
const MOBILE_CASES = [C01, C07, C09, C12, C14, C17, C19];

export const LiteH2ePage = ({ isMobile }: P) => (
  <LitePage
    id="lite-h2e"
    title="H2E Campaign"
    route="/rewards（网格卡） · /rewards/campaign/h2e（详情）"
    status="done"
    note="Hedge-to-Earn 迁入 Rewards 后的终态：网格卡四段旅程、Connected accounts、Airdropped positions 模块、进度卡（Earned/Cap + 解锁 stepper + Recent settlements）与 aside。全部挂载生产组件 + fixture。"
  >
    <div className="rounded-lg border border-border/40 bg-muted/10 p-3 text-[11px] leading-relaxed text-muted-foreground">
      {READ_ME}
    </div>

    <SubSection
      title="桌面端（单 iframe）"
      description="case 01–11、13–19：桌面宽度下 Activate 收成右侧小按钮，进度卡展开六档 stepper。"
    >
      <SectionFrame device="desktop" minHeight={860} cases={DESKTOP_CASES} />
    </SubSection>

    <SubSection
      title="移动端（375 · 单 iframe）"
      description="case 12 为移动专属：Activate 整宽 h-11；其余为同状态的移动排版对照。"
    >
      <SectionFrame device="mobile" minHeight={860} cases={MOBILE_CASES} />
    </SubSection>
  </LitePage>
);
