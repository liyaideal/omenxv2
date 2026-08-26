// ============================================================
// Lite 页面节 · H2E Campaign（/rewards 网格卡 + /rewards/campaign/h2e 详情）
// 归档轮收录。每个 case 挂生产组件，状态表是规范本体。
// 禁 barrel import：本文件只 import shell / SectionFrame / SubSection。
// ============================================================
import { SubSection } from "../../components";
import { SectionFrame, type SectionCase } from "../../components/SectionFrame";
import { LitePage } from "./shell";

type P = { isMobile: boolean };

/* ---------------------------------------------------------------- */

const CARD_CASE: SectionCase = {
  key: "h2e-campaign-card",
  label: "H2eCampaignCard · /rewards 网格卡（四段旅程）",
  note: "stage = !user ? S0 : totalEarned > 0 ? S3 : activeAccounts.length > 0 ? S2 : S1。四段互斥，没有第五种。预览无会话 → 活体渲染恒为 S0，其余三段以本表为准。",
  spec: [
    {
      state: "S0 游客",
      when: "!user",
      visual: "机制文案（把 Polymarket 敞口对冲成 $10 空投）+ 底部 `Sign in to track yours`，不出现任何金额",
      source: "useAuth.user",
    },
    {
      state: "S1 已登录未绑",
      when: "user && totalEarned === 0 && activeAccounts.length === 0",
      visual: "三步旅程行 Connect wallet → Receive airdrops → Trade to unlock，第 1 步 pulse #33D6FF 高亮加粗",
      source: "useConnectedAccounts.activeAccounts",
    },
    {
      state: "S2 已绑未赚 · 扫描中",
      when: "activeAccounts.some(a => a.scanStatus === 'scanning')",
      visual: "① 变 ✓ Connect wallet（绿），② 高亮；s2Meta = `Scanning positions…`",
      source: "account.scanStatus",
    },
    {
      state: "S2 · 有活空投",
      when: "!scanning && liveAirdropCount > 0",
      visual: "s2Meta = `{acct.positionsDetected} positions scanned · {n} airdrop(s) active — earnings land when hedges settle.`，n===1 用单数 airdrop，否则 airdrops",
      source: "liveAirdropCount = airdrops.filter(source !== 'voucher' && status ∈ {pending, activated}).length",
    },
    {
      state: "S2 · 无合格仓位",
      when: "!scanning && liveAirdropCount === 0",
      visual: "s2Meta = `No qualifying positions yet — positions ≥ $20 held a day qualify.`",
      source: "同上",
    },
    {
      state: "S3 有收益",
      when: "totalEarned > 0",
      visual: "Earned / Cap 行（$X.XX / $100）+ pulse 进度条 + Withdrawal unlock 行",
      source: "useH2eRewardsSummary.totalEarned / earningsCap",
    },
  ],
};

const CONNECTED_CASE: SectionCase = {
  key: "h2e-connected-accounts",
  label: "ConnectedAccountsCard · 连接态 + 资格表",
  note: "计数单一真相源：Airdrops 计数取 useAirdropPositions 的 pending+activated（source ≠ voucher），与卡片 / 进度卡 / 模块徽标同一个数，不使用任何演示常量。",
  spec: [
    { state: "未连接", when: "activeAccounts.length === 0", visual: "说明句 + `Connect wallet` 主按钮", source: "useConnectedAccounts" },
    { state: "连接中 · detect", when: "step === 'detect'", visual: "第 1 步 spinner：检测钱包", source: "连接状态机" },
    { state: "连接中 · signing", when: "step === 'signing'", visual: "第 2 步：等待 EIP-712 签名", source: "连接状态机" },
    { state: "连接中 · verifying", when: "step === 'verifying'", visual: "第 3 步：校验签名 / 拉取仓位", source: "连接状态机" },
    {
      state: "已连接",
      when: "activeAccounts.length > 0",
      visual: "截断地址 + 两个计数：Positions（positionsDetected）/ Airdrops（liveAirdropCount）",
      source: "useAirdropPositions",
    },
    {
      state: "Airdrops 计数点击",
      when: "点击 Airdrops 计数且 liveAirdropCount > 0",
      visual: "锚点滚动到 #airdropped-positions（不跳路由、不开弹层）",
      source: "AirdroppedPositionsCard id",
    },
    {
      state: "资格表",
      when: "始终",
      visual: "QUALIFIES / LIMITS 双列对照 + 底行说明每个合格仓位配 $10 对冲",
      source: "静态文案",
    },
  ],
};

const AIRDROPPED_CASE: SectionCase = {
  key: "h2e-airdropped-positions",
  label: "AirdroppedPositionsCard · 渲染条件 + 三行态 + source 副本行",
  note: "模块只承载「待动作 / 进行中 / 作废」三态；settled 空投一律归 Recent settlements，绝不在此重复出现。行序固定 pending → activated → expired。",
  spec: [
    { state: "不渲染 · 游客", when: "!user", visual: "组件 return null", source: "useUserProfile" },
    { state: "不渲染 · 未连接", when: "activeAccounts.length === 0", visual: "组件 return null", source: "useConnectedAccounts" },
    { state: "不渲染 · 扫描中", when: "!activeAccounts.some(a => a.scanStatus === 'complete')", visual: "组件 return null（不画骨架）", source: "scanStatus" },
    { state: "不渲染 · 零行", when: "rows.length === 0", visual: "组件 return null（不画空态卡）", source: "rows" },
    { state: "渲染", when: "以上皆不成立", visual: "题头 `Airdropped positions` + 徽标数 + 说明句 + 行列表 + 底部 fine print", source: "AirdroppedPositionsCard" },
    { state: "行态 pending", when: "status === 'pending'", visual: "#FFD666 倒计时 `Activate in {h}h {m}m` + 白底 Activate 按钮（mobile 整宽 h-11 / 桌面右侧 px-4 py-[7px]）", source: "expiresAt" },
    { state: "行态 activated", when: "status === 'activated'", visual: "volt #CFFF4A 圆点 + `Live · {±$pnl}`，右侧 pulse `View in portfolio ›`", source: "useRealtimePositionsPnL" },
    { state: "行态 expired", when: "status === 'expired'", visual: "整行 opacity-55 灰显，右侧灰字 `Expired`，不计入徽标", source: "status" },
    { state: "副本行 matched", when: "source === 'matched' && externalEventName", visual: "`Matched: {externalEventName} — {side} @ {price}¢ on Polymarket`", source: "sourceLine()" },
    { state: "副本行 welcome_gift", when: "source === 'welcome_gift'", visual: "`Welcome gift — no matching OmenX event for your positions, so we sent one on us`", source: "sourceLine()" },
    { state: "副本行 未知", when: "其余 source 或缺字段", visual: "省略副本行（不编造来源、不画 `—`）", source: "sourceLine() → null" },
    { state: "voucher 不入列", when: "source === 'voucher'", visual: "取数即过滤，本模块永不出现券仓（券仓在 /rewards Vouchers tab）", source: "rows filter" },
    { state: "徽标口径", when: "始终", visual: "题头数字 = pending + activated，与 Connected accounts 的 Airdrops 计数同源同值", source: "activeCount" },
    { state: "settled 去向", when: "status === 'settled'", visual: "不进本模块，落 H2eRewardsCard 的 Recent settlements，且两处不重复计数", source: "useH2eRewardsSummary.settlements" },
  ],
};

const REWARDS_CASE: SectionCase = {
  key: "h2e-rewards-card",
  label: "H2eRewardsCard · 进度卡（S0/S1 · S2 · S3 横条逐项真值）",
  note: "S3 头部横条逐项真值渲染：三个勾各自判定，禁止用 totalEarned > 0 一个条件反推全勾。活体渲染用 fixture summary，但 stage 由会话决定，预览恒为 S0。",
  spec: [
    { state: "S0/S1 三节点", when: "!user || activeAccounts.length === 0", visual: "Connect wallet（next，pulse 环）→ Receive airdrops（todo）→ Trade to unlock（todo）", source: "stage" },
    { state: "S2 节点 · 扫描中", when: "activeAccounts.some(scanStatus === 'scanning')", visual: "节点①=done 显示截断地址；节点②=next 子行 spinner + `Scanning positions…`", source: "scanStatus" },
    { state: "S2 节点 · 有空投", when: "liveAirdropCount > 0", visual: "子行 `{positionsDetected} positions scanned · {n} airdrop(s) active`（单复数按 n）", source: "liveAirdropCount" },
    { state: "S2 节点 · 无空投", when: "liveAirdropCount === 0", visual: "子行 `No qualifying positions yet — positions ≥ $20 held a day qualify`", source: "liveAirdropCount" },
    { state: "S3 横条 · 已连接", when: "activeAccounts.length > 0", visual: "绿 `✓ Connected`", source: "useConnectedAccounts" },
    { state: "S3 横条 · 未连接", when: "activeAccounts.length === 0 && totalEarned > 0", visual: "#FFD666 `Wallet not connected`（不勾绿、不隐藏）", source: "同上" },
    { state: "S3 横条 · Airdrops", when: "stage === 'S3'", visual: "绿 `✓ Airdrops`", source: "stage" },
    { state: "S3 横条 · Trade to unlock", when: "stage === 'S3'", visual: "pulse #33D6FF 加粗 `Trade to unlock`", source: "stage" },
    { state: "Earned / Cap", when: "stage === 'S3'", visual: "`${totalEarned} / ${earningsCap}` + 5px 高 pulse 进度条，宽度 = earningsPercent%", source: "useH2eRewardsSummary" },
    { state: "六档 stepper", when: "桌面宽度", visual: "Starter + 10/25/50/75/100% 六档；reached=pulse 实心环，next=半亮环，其余灰（移动端改竖排时间线）", source: "unlockTiers" },
    { state: "Recent settlements", when: "settlements.length > 0", visual: "最多 3 行落库 settled 行：事件名 · trigger + 盈亏色值；无行时整段不渲染", source: "settlements" },
  ],
};

const ASIDE_CASE: SectionCase = {
  key: "h2e-aside-signed-out",
  label: "aside `Your rewards here` · 游客态 = SignInPromptCard",
  note: "登录态 aside 为三行数值卡（Earned / Credited / Locked）+ `Open Wallet →` + host chip；游客态整卡替换成 SignInPromptCard，不渲染任何金额位。",
  spec: [
    { state: "游客", when: "!user（signedOut）", visual: "SignInPromptCard 顶替整个 aside", source: "H2eCampaignDetailPage.signedOut" },
    { state: "登录 · 桌面", when: "user && !isMobile", visual: "Earned / Credited / Locked 三行（credited = max(0, totalEarned − lockedAmount)）+ Open Wallet → + host chip", source: "useH2eRewardsSummary" },
    { state: "登录 · 移动", when: "user && isMobile", visual: "同三项改 3 列小卡：Earned pulse / Credited 白 / Locked 灰", source: "同上" },
    { state: "零收益", when: "totalEarned === 0", visual: "三项照常渲染为 $0.00，不隐藏、不换空态文案", source: "同上" },
  ],
};

const READ_ME =
  "怎么读这一节：H2E 四个模块的状态全部由 hook 判定（useAuth.user / useConnectedAccounts.activeAccounts / useAirdropPositions.airdrops / useH2eRewardsSummary），组件不接受状态 props。style-guide 预览 iframe 没有会话，所以活体渲染恒为 S0/游客分支；S1/S2/S3 与各行态以每个 case 下方的状态表为准（表里没有列出的组合视为不存在）。要在预览里注入非 S0，必须先给生产组件加 fixture props —— 归档轮不做，留作后续。";

export const LiteH2ePage = ({ isMobile }: P) => (
  <LitePage
    id="lite-h2e"
    title="H2E Campaign"
    route="/rewards（网格卡） · /rewards/campaign/h2e（详情）"
    status="done"
    note="Hedge-to-Earn 迁入 Rewards 后的终态：网格卡四段旅程、Connected accounts、Airdropped positions 模块、进度卡（Earned/Cap + 解锁 stepper + Recent settlements）与 aside。全部挂载生产组件。"
  >
    <div className="rounded-lg border border-border/40 bg-muted/10 p-3 text-[11px] leading-relaxed text-muted-foreground">
      {READ_ME}
    </div>

    <SubSection
      title="移动端（375 · 单 iframe）"
      description="整节移动案例合并在一个 375px iframe，按 case 顺序纵向排列；Activate 按钮的整宽 h-11 口径只在这里成立。"
    >
      <SectionFrame
        device="mobile"
        minHeight={760}
        cases={[CARD_CASE, CONNECTED_CASE, AIRDROPPED_CASE, REWARDS_CASE, ASIDE_CASE]}
      />
    </SubSection>

    <SubSection
      title="桌面端（单 iframe）"
      description="桌面宽度：Activate 按钮收成右侧小按钮，进度卡展开六档 stepper。"
    >
      <SectionFrame
        device="desktop"
        minHeight={760}
        cases={[CARD_CASE, CONNECTED_CASE, AIRDROPPED_CASE, REWARDS_CASE, ASIDE_CASE]}
      />
    </SubSection>
  </LitePage>
);
