import { SectionWrapper, SubSection } from "../components/SectionWrapper";
import { SectionFrame, type SectionCase, type SectionSpecRow } from "../components/SectionFrame";

/**
 * Vouchers state dictionary — M4a-② lands Ⓐ (composition) and Ⓑ (row + state
 * machine). Ⓒ redeem desk / Ⓓ market picker / Ⓔ compliance land in M4b.
 *
 * Framework rules (mock9): every case is a pair of frames (desktop 1280 above,
 * mobile 375 below), fixtures are deterministic (relative dates, fixed ids, no
 * runtime fetch), and cases whose two ends are different production layouts get
 * their own `-mobile` key instead of a runtime `useIsMobile()` component switch.
 */

const CASES: SectionCase[] = [
  {
    key: "vouchers-body-layout",
    label: "VC-1 · 组合层 · 桌面（VouchersBody）",
    note: "VouchersBody 本体自带三个 live hook（usePositionVouchers / useVoucherDailyPool / useSearchParams），无法整体 fixture 化。本帧用它自己导出的真件按生产顺序真拼：VoucherEarningsCard(fixture) → SectionHead「Ready to claim」→ VoucherRow ×1 → SectionHead「Active」→ VoucherRow ×2 → VoucherHistoryArchive → fine print，桌面外层为生产同款 `400px minmax(0,1fr)` 双栏，右列常驻 desk（此帧为未选态 VoucherDeskEmpty；已载入的 desk 见 vouchers2-desk）。",
    spec: [
      {
        state: "分区头",
        when: "grantedVouchers.length > 0 / claimedVouchers.length > 0",
        visual: "SectionHead：Ready to claim 带 7px volt 圆点 + volt 计数；Active 无圆点 + 灰计数",
        source: "VouchersBody.VoucherSectionHead",
      },
      {
        state: "节序",
        when: "恒定",
        visual: "Hero → Ready to claim → Active → Voucher history → fine print，节间 20px / 节内 14px",
        source: "VouchersBody（组合层规范）",
      },
      {
        state: "桌面 desk 常驻",
        when: "!isMobile",
        visual: "右列 400px/1fr 网格常驻 desk；选中券进 desk，行本身变 volt 边框 + Selected 读出",
        source: "VouchersBody desk 分支",
      },
      {
        state: "移动无 desk",
        when: "isMobile && !searchParams.redeem",
        visual: "list-only，无右列；点 Redeem 写 URL `?tab=vouchers&redeem=<id>` 进全屏 redeem 屏",
        source: "VouchersBody openMobileRedeem（全屏壳口径见 RW-2）",
      },
      {
        state: "fine print",
        when: "恒定，每页唯一",
        visual: "底部单段 11.5px #6B7280：USDC amounts are estimates and not guaranteed…",
        source: "VouchersBody.FINE_PRINT（合规规则同 RW-18）",
      },
    ],
  },
  {
    key: "vouchers-body-layout-mobile",
    label: "VC-1 · 组合层 · 移动（VouchersBody）",
    note: "移动帧走独立 key（两端版式不同：list-only vs 双栏），非运行时 useIsMobile 选组件。行动作下沉为全宽 44px，Selected 态在移动端不存在。",
  },
  {
    key: "vouchers2-earnings",
    label: "VC-2 · 收益 hero 五态（VoucherEarningsCard）",
    note: "本 case 走 M4a-① 的 `fixture` prop：`useVoucherEarnings({ enabled: false })` 直接返回，字典 iframe 零 supabase 查询、零 realtime 订阅，Claim 按钮 inert。",
    spec: [
      {
        state: "canClaim",
        when: "tierState.claimable > 0",
        visual: "白底实心按钮「Claim $18.40 to wallet」（44px）",
        source: "lib/voucherTiers.deriveVoucherTierState",
      },
      {
        state: "不可 claim",
        when: "tierState.claimable === 0（pending 为 0，或 lifetimeCredited ≥ 当前档 cap）",
        visual: "描边按钮「Redeem a voucher」；无 onRedeemPrompt 时置灰 inert",
        source: "VoucherEarningsCard canClaim 分支",
      },
      { state: "loading", when: "live.loading（fixture.loading）", visual: "金额位显示 `$—`，其余布局不变", source: "useVoucherEarnings.loading" },
      { state: "claiming", when: "live.claiming（fixture.claiming）", visual: "按钮文案「Claiming…」、cursor default、禁点", source: "useVoucherEarnings.claiming" },
      { state: "档位轨", when: "恒定五段", visual: "已过档实心 volt，当前档 volt 描边，未达档 #1A1D22；段下挂解锁条件", source: "lib/voucherTiers.VOUCHER_TIERS" },
      { state: "T0", when: "无门槛", visual: "cap $2 · 轨下 `$0`", source: "lib/voucherTiers.ts" },
      { state: "T1", when: "depositTotal ≥ $10", visual: "cap $5 · 轨下 `$10 dep`", source: "lib/voucherTiers.ts" },
      { state: "T2", when: "volume ≥ $1,000", visual: "cap $10 · 轨下 `$1k`", source: "lib/voucherTiers.ts" },
      { state: "T3", when: "volume ≥ $10,000", visual: "cap $20 · 轨下 `$10k`", source: "lib/voucherTiers.ts" },
      { state: "T4", when: "volume ≥ $50,000", visual: "cap $50 · 顶档句「Top tier reached — the full pending balance is claimable.」", source: "lib/voucherTiers.ts" },
    ],
  },
  {
    key: "vouchers-empty",
    label: "VC-3a · 空态（VouchersListEmpty）",
    spec: [
      {
        state: "No vouchers yet",
        when: "grantedVouchers.length === 0 && claimedVouchers.length === 0",
        visual: "#0A0B0D r12 卡，34/24 内距，标题 14px 700「No vouchers yet」+ 说明句 11.5px #9AA1AC",
        source: "VouchersBody.VouchersListEmpty",
      },
      {
        state: "History 仍渲染",
        when: "空态成立且 history.length > 0",
        visual: "空态卡下方照常渲染 Voucher history 折叠条——空态只吃 Ready/Active 两桶，不吃档案",
        source: "VouchersBody list（空态与 archive 并列，非互斥）",
      },
    ],
  },
  {
    key: "vouchers-async",
    label: "VC-3b · 异步二态（LoadingState / ErrorState）",
    spec: [
      {
        state: "loading",
        when: "usePositionVouchers.isLoading",
        visual: "整面替换为 LoadingState skeleton 三行（label「Loading vouchers…」）",
        source: "@/components/states.LoadingState",
      },
      {
        state: "error",
        when: "usePositionVouchers.isError",
        visual: "ErrorState「Couldn't load vouchers」+ 说明句 + Retry 触发 refetch()",
        source: "@/components/states.ErrorState",
      },
      {
        state: "互斥",
        when: "isLoading || isError",
        visual: "两态都在 hero 之前整面 return，hero / 列表 / desk 均不渲染",
        source: "VouchersBody 状态段（早 return）",
      },
    ],
  },
  {
    key: "vouchers2-rows",
    label: "VC-5 · 券行全态（VoucherRow）· 含 VC-4 池行",
    spec: [
      { state: "Ready 正常", when: "status === 'granted' && pool.remaining > 0", visual: "volt 左轨 + volt 面额，白底 Claim 按钮；meta「Claim by <date> · 653/1000 left today」", source: "VouchersBody.grantedRow" },
      { state: "Ready · soldOut", when: "pool.remaining <= 0", visual: "meta 后半红字「Sold out today — resets in 8h 12m」，Claim 置灰 disabled", source: "useVoucherDailyPool.byFaceValue" },
      { state: "Ready · claiming", when: "claimingId === v.id", visual: "按钮文案「Claiming…」且 disabled", source: "VouchersBody.handleClaim" },
      { state: "Active · tiered", when: "status ∈ {claimed, issued} 且未过期，payoutMode === 'tiered'", visual: "两行（来源行 + Expires in Xd），描边 Redeem 按钮，无第三行", source: "VouchersBody.activeRow" },
      { state: "Active · instant", when: "payoutMode === 'instant'", visual: "第三行 volt 11px「Profit goes straight to your wallet」", source: "标注例外不标注默认 · v2 裁定" },
      { state: "selected（桌面专属）", when: "!isMobile && v.id === selectedId", visual: "volt 边框 + 右侧 volt「Selected」，动作按钮撤下；移动端无此态（redeem 走全屏）", source: "VouchersBody.activeRow isSelected" },
      { state: "动作列 · 移动", when: "mobile", visual: "action 下沉为整行下方全宽 44px 按钮；readout 永不下沉", source: "VoucherRow mobile 分支" },
    ],
  },
  {
    key: "vouchers2-archive",
    label: "VC-7 · 历史档案（VoucherHistoryArchive）",
    note: "fixture 日期全部为相对偏移（daysAgoAt），不含任何绝对日期字面量。",
    spec: [
      { state: "折叠 bar", when: "items.length > 0", visual: "44px 条「Voucher history (6)」+ 有盈利时 volt「$13.85 profit settled」+ 右「Show ▾」；items 为 0 时整块不渲染", source: "VoucherHistoryArchive" },
      { state: "settled · won", when: "settled && pnl > 0", visual: "右列 volt `+$9.60`", source: "PositionVoucher.redeemedSettledPnl" },
      { state: "去向 · instant", when: "won && payoutMode === 'instant'", visual: "caption「Credited to wallet」", source: "docs/copy-dictionary.md" },
      { state: "去向 · tiered", when: "won && payoutMode === 'tiered'", visual: "caption「Added to pending」", source: "docs/copy-dictionary.md" },
      { state: "settled · lost", when: "settled && (pnl == null || pnl <= 0)", visual: "中性灰 `$0.00`（无负号、禁红字）+ caption「Voucher lost · nothing owed」", source: "v2 裁定 4" },
      { state: "Open 行", when: "redeemed 且 redeemedAirdropStatus !== 'settled'", visual: "右列单词「Open」（#9AA1AC），无金额", source: "VoucherHistoryArchive settled 分支兜底" },
      { state: "expired · 已领未用", when: "status === 'expired' && claimedAt != null", visual: "灰轨行，meta「$5 voucher · Claimed, not redeemed」，右「Expired」", source: "usePositionVouchers.status" },
      { state: "expired · 未领", when: "status === 'expired' && claimedAt == null", visual: "meta「$5 voucher · Unclaimed」，右「Expired」", source: "usePositionVouchers.status" },
    ],
  },
];

const byKey = (...keys: string[]): SectionCase[] =>
  keys.map((k) => {
    const hit = CASES.find((c) => c.key === k);
    if (!hit) throw new Error(`VouchersStatesSection: unknown case key ${k}`);
    return hit;
  });

const Pair = ({
  cases,
  mobileCases,
  desktopMin,
  mobileMin,
}: {
  cases: SectionCase[];
  mobileCases?: SectionCase[];
  desktopMin?: number;
  mobileMin?: number;
}) => (
  <>
    <SectionFrame cases={cases} device="desktop" minHeight={desktopMin ?? 360} />
    <div className="mt-3">
      <SectionFrame cases={mobileCases ?? cases} device="mobile" minHeight={mobileMin ?? 420} />
    </div>
  </>
);

/* ---- spec-only cases (no frame): rendered as a plain decision table ---- */

const SpecOnly = ({ title, note, rows }: { title: string; note?: string; rows: SectionSpecRow[] }) => (
  <div className="space-y-2 text-[11px] leading-relaxed">
    <div className="font-mono uppercase tracking-wider text-muted-foreground/80">{title}</div>
    {note && <p className="text-muted-foreground">{note}</p>}
    <div className="overflow-x-auto rounded-md border border-border/40">
      <table className="w-full min-w-[640px] border-collapse text-left">
        <thead>
          <tr className="bg-muted/20 text-[10px] uppercase tracking-wider text-muted-foreground/70">
            <th className="px-2 py-1.5 font-medium">状态</th>
            <th className="px-2 py-1.5 font-medium">触发条件（字段 / 公式）</th>
            <th className="px-2 py-1.5 font-medium">视觉结果</th>
            <th className="px-2 py-1.5 font-medium">来源</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.state} className="border-t border-border/30 align-top">
              <td className="px-2 py-1.5 text-foreground/90">{r.state}</td>
              <td className="px-2 py-1.5 font-mono text-[10.5px] text-muted-foreground">{r.when}</td>
              <td className="px-2 py-1.5 text-muted-foreground">{r.visual}</td>
              <td className="px-2 py-1.5 font-mono text-[10.5px] text-muted-foreground/80">{r.source}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const POOL_ROWS: SectionSpecRow[] = [
  {
    state: "有余量",
    when: "pool.remaining > 0",
    visual: "meta 行拼接「· {remaining}/{totalQuota} left today」（例：653/1000 left today）",
    source: "get_voucher_pool_today RPC → useVoucherDailyPool.byFaceValue(faceValue)",
  },
  {
    state: "售罄",
    when: "pool.remaining <= 0",
    visual: "红字「Sold out today — resets in {Xh Ym}」+ Claim 按钮 disabled（灰底灰字）",
    source: "formatResetCountdown(pool.resetsAt)（每分钟 useMinuteTick 刷新）",
  },
  { state: "无池记录", when: "byFaceValue(faceValue) === null", visual: "meta 只剩「Claim by <date>」，不拼池片段", source: "VouchersBody.grantedRow" },
  { state: "池 · $10 档", when: "face_value = 10", visual: "quota 1000 / 天", source: "voucher_daily_pools" },
  { state: "池 · $25 档", when: "face_value = 25", visual: "quota 500 / 天", source: "voucher_daily_pools" },
  { state: "池 · $50 档", when: "face_value = 50", visual: "quota 100 / 天", source: "voucher_daily_pools" },
  { state: "重置", when: "resets_at = 次日 UTC 00:00", visual: "跨点后 remaining 回满，倒计时归零", source: "get_voucher_pool_today RPC" },
];

const STATE_MACHINE_ROWS: SectionSpecRow[] = [
  { state: "granted → Ready to claim", when: "status === 'granted'", visual: "Ready 分区，白底 Claim 按钮；受当日池限量约束（VC-4）", source: "usePositionVouchers.VoucherStatus" },
  { state: "claimed → Active", when: "status === 'claimed' && expiresAt > now", visual: "Active 分区，描边 Redeem 按钮，meta「Expires in Xd」", source: "usePositionVouchers.claimedVouchers" },
  { state: "issued → Active", when: "status === 'issued' && expiresAt > now", visual: "同 claimed（DB 现 0 行，保留兼容分支）", source: "usePositionVouchers.VoucherStatus（DB 现 0 行）" },
  { state: "redeemed → History", when: "status === 'redeemed'", visual: "档案行；未结算显示「Open」，结算后转 settled 行", source: "VoucherHistoryArchive" },
  { state: "settled → History", when: "status === 'settled' || redeemedAirdropStatus === 'settled'", visual: "档案行，+$x / $0.00 + 去向 caption", source: "VoucherHistoryArchive" },
  { state: "expired → History", when: "status === 'expired' || (status === 'issued' && expiresAt <= now)", visual: "档案行，右「Expired」，meta 带过期原因", source: "VouchersBody.history" },
  { state: "revoked → 无分支", when: "status === 'revoked'", visual: "代码枚举存在、UI 无分支、DB 0 行——已判退役（CPO 2026-09-02），真平台如需撤销另立需求", source: "usePositionVouchers.VoucherStatus" },
];

const READ_ME =
  "怎么读这一节：Ⓐ 区状态由组合层字段驱动（isLoading / isError / grantedVouchers / claimedVouchers / history / isMobile / searchParams.redeem）；Ⓑ 区状态由单张券驱动（status / payoutMode / expiresAt / claimingId / selectedId）与当日池（get_voucher_pool_today）。每个 case 下方的表给出「状态 → 触发条件 → 视觉结果 → 数据来源」，条件都是可判定表达式，可直接照抄进实现。fixture 红线：redeemableCapPct 一律 0.5（DB 真值），日期一律相对偏移。";

export const VouchersStatesSection = () => (
  <SectionWrapper
    id="vouchers-states"
    title="Vouchers · 状态字典（VC-1…VC-17 · Ⓐ–Ⓔ 区）"
    platform="shared"
    description="分区序 = 生产模块序：Ⓐ组合层 · Ⓑ券行与状态机 · Ⓒ兑换台 · Ⓓ市场选择器 · Ⓔ合规。本单（M4a-②）只落 Ⓐ Ⓑ（VC-1…VC-7），Ⓒ–Ⓔ（VC-8…VC-17）在 M4b。每个 case 双帧（desktop 1280 / mobile 375），两端版式不同的走 `-mobile` 分 key，禁运行时 useIsMobile 选组件；fixture 一律确定性注入（相对日期、固定 id、禁运行时 fetch）。表里没有列出的组合视为不存在。"
  >
    <div className="space-y-12">
      <div className="rounded-lg border border-border/40 bg-muted/10 p-3 text-[11px] leading-relaxed text-muted-foreground">
        {READ_ME}
      </div>

      <SubSection
        title="Ⓐ 组合层（VC-1 … VC-4）"
        description="路由 /rewards?tab=vouchers（/vouchers 302 重定向）。移动 redeem 全屏壳属页面壳，口径见 Rewards 节 RW-2。"
      >
        <Pair
          cases={byKey("vouchers-body-layout")}
          mobileCases={byKey("vouchers-body-layout-mobile")}
          desktopMin={720}
          mobileMin={1200}
        />
        <div className="mt-6">
          <Pair cases={byKey("vouchers2-earnings")} desktopMin={420} mobileMin={620} />
        </div>
        <div className="mt-6">
          <Pair cases={byKey("vouchers-empty")} desktopMin={240} mobileMin={260} />
        </div>
        <div className="mt-6">
          <Pair cases={byKey("vouchers-async")} desktopMin={360} mobileMin={420} />
        </div>
        <div className="mt-6">
          <SpecOnly
            title="VC-4 · 每日限量池行（无独立帧 · 帧并入 VC-5）"
            note="池行只出现在 Ready 券的 meta 第二段；Active 券不带池信息。"
            rows={POOL_ROWS}
          />
        </div>
      </SubSection>

      <SubSection
        title="Ⓑ 券行与状态机（VC-5 … VC-7）"
        description="VoucherRow 家族沿用 GrantTaskRow 解剖（3px 左轨 / 40px 面额格 / 两到三行文本 / 右动作）。"
      >
        <Pair cases={byKey("vouchers2-rows")} desktopMin={260} mobileMin={320} />
        <div className="mt-6">
          <SpecOnly
            title="VC-6 · 券状态机分桶（spec-only case · 无独立帧）"
            note="7 枚举 → 三桶（Ready / Active / History）。三桶之外无第四种落点。"
            rows={STATE_MACHINE_ROWS}
          />
        </div>
        <div className="mt-6">
          <Pair cases={byKey("vouchers2-archive")} desktopMin={320} mobileMin={360} />
        </div>
      </SubSection>
    </div>
  </SectionWrapper>
);
