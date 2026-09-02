import { SectionWrapper, SubSection } from "../components/SectionWrapper";
import { SectionFrame, type SectionCase, type SectionSpecRow } from "../components/SectionFrame";

/**
 * Vouchers state dictionary — VC-1…VC-17 across Ⓐ composition, Ⓑ row + state
 * machine, Ⓒ redeem picker, Ⓓ desk + confirm, Ⓔ out-of-page service parts.
 * M4b closed the dictionary and retired the legacy Vouchers2Section from the
 * page (the ledger table at the bottom accounts for every line of it).
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

  /* ------------------------- Ⓒ Redeem picker (VC-8…12) ------------------- */
  {
    key: "vouchers2-picker",
    label: "VC-8 · EventPickerCard 态",
    note: "市场卡本体：#0F1114 / 1px #1D2026 / r12 / pad 13。BOOST = product_lines 含 futures，STANDARD = 含 spot——这是 Lite 术语，禁写 Futures / Spot。",
    spec: [
      { state: "eligible", when: "eventEligibility.get(event.id) === true && !usedEventIds.has(event.id)", visual: "opacity 1，边框 #1D2026，方向控件可点", source: "EventPickerList.eventEligibility" },
      { state: "locked（一券锁）", when: "usedEventIds.has(event.id)", visual: "opacity .5 + Lock 图标 +「Voucher already used」，卡内只剩解释句，无方向控件", source: "event 级一券锁 · v2 产品新规 2（usedEventIds）" },
      { state: "picked", when: "selected?.eventId === event.id && !locked", visual: "卡边框换 volt #CFFF4A", source: "EventPickerCard picked" },
      { state: "dim（不可选但未锁）", when: "cardEligible === false && !locked", visual: "opacity .62，标题降为 VT.ink2，方向按钮置灰 + PickerBlockedReason", source: "EventPickerCard eligible=false" },
      { state: "BOOST 徽标", when: "product_lines 含 'futures'", visual: "LineBadge strong「Boost」（9.5px 桌面 / 9px 移动）", source: "Lite 术语，禁 Futures/Spot" },
      { state: "STANDARD 徽标", when: "product_lines 含 'spot'", visual: "LineBadge strong「Standard」", source: "Lite 术语，禁 Futures/Spot" },
      { state: "N options 尾签", when: "!locked && event.options.length !== 2", visual: "尾部弱 LineBadge「4 options」；complementary（2 选项）不带尾签", source: "EventPickerList tail" },
    ],
  },
  {
    key: "vouchers-picker-direction",
    label: "VC-9 · 方向控件（SideButton / PickerDirectionPair / PickerOptionRow）",
    note: "AXIS 双色是市场方向轴，不是盈亏轴：long = --yes Pulse Blue #33D6FF，short = --no Volt #CFFF4A，永不使用 trading-green / trading-red。",
    spec: [
      { state: "pair 形态", when: "SideButton pair", visual: "min-h 44 · r11 · pad 0 14；label 12px 左、价格 15px(移动)/17px(桌面) 右", source: "EventPickerCard.SideButton（pair 分支）" },
      { state: "多选形态", when: "SideButton price !== undefined && !pair", visual: "min-h 44 · r8 · pad 0 14；左 label / 右价格 12px", source: "EventPickerCard.SideButton（price 分支）" },
      { state: "纯文本形态", when: "SideButton price === undefined", visual: "r8 小按钮，只有 label，无价格位", source: "EventPickerCard.SideButton（兜底分支）" },
      { state: "long 配色", when: "tone === 'yes'", visual: "fg #33D6FF · border rgba(51,214,255,.4) · tint rgba(51,214,255,.08)", source: "DESIGN §2 Market Axis + 2026-08-13 统一手术裁定" },
      { state: "short 配色", when: "tone === 'no'", visual: "fg #CFFF4A · border rgba(207,255,74,.35) · tint rgba(207,255,74,.06)", source: "DESIGN §2 Market Axis + 2026-08-13 统一手术裁定" },
      { state: "picked", when: "picked === true", visual: "实心 AXIS.fill 底 + #0A0B0D 字；带价形态文案由 label 换成「Picked」", source: "EventPickerCard.SideButton picked" },
      { state: "disabled", when: "disabled === true", visual: "透明底 + 1px #23262D 边 + VT.muted2 字，cursor default", source: "EventPickerCard.SideButton disabled" },
      { state: "互补收拢", when: "event.options.length === 2", visual: "两个 Buy 行收拢成一个 PickerDirectionPair；移动与桌面 desk 同一分支——这是数据规则，不是视口规则", source: "EventPickerList isBinary 分支" },
      { state: "No 价推导", when: "PickerOptionRow", visual: "Yes 用 opt.price，No 用 `1 − price`（32¢ → 68¢），不另取行情", source: "EventPickerCard.PickerOptionRow" },
    ],
  },
  {
    key: "vouchers-picker-fold",
    label: "VC-10 · 多选折叠（MultiOptionRows）",
    note: "三个帧全部由受控 fixture 呈现（rows / defaultExpanded），字典内不做任何自动点击。",
    spec: [
      { state: "不折叠", when: "rows.length <= 2", visual: "全部渲染，无「Show more」行", source: "EventPickerList.MultiOptionRows" },
      { state: "折叠", when: "rows.length > 2 && !expanded", visual: "只渲染前两行 + 文本行「Show {rows.length − 2} more options」（11.5px #9AA1AC）", source: "EventPickerList.MultiOptionRows" },
      { state: "picked 提升", when: "!expanded && 命中行不在 rows.slice(0,2) 内", visual: "可见对变为 [rows[0], pickedRow]——被选中的尾部选项顶进可见区，不会藏在折叠里", source: "MultiOptionRows visible 计算" },
      { state: "展开", when: "expanded", visual: "全部行渲染，文本行改「Show fewer」", source: "PickerMoreOptionsRow expanded" },
    ],
  },
  {
    key: "vouchers-picker-states",
    label: "VC-11 · picker 周边态（search / skeleton / empty / no-eligible / blocked）",
    spec: [
      { state: "SearchBar", when: "searchOpen === true", visual: "min-height 移动 44 / 桌面 40，#101216 底 + 1px #1D2026 + r10，placeholder「Search markets」", source: "EventPickerCard.PickerSearchBar mobile" },
      { state: "Skeleton", when: "useActiveEvents.isLoading", visual: "恒定两张假卡（标题条 70% / meta 条 38% + 两个 44px 方向位）", source: "EventPickerCard.PickerSkeleton" },
      { state: "Empty（搜索未命中）", when: "!isLoading && !nothingEligible && filtered.length === 0", visual: "「No markets match “{query}”」+ 说明句 + 44px「Clear filters」（清 query 与 activeCat）", source: "EventPickerCard.PickerEmpty" },
      { state: "NoEligible（等待态非失败）", when: "!isLoading && !query && !activeCat && eligibleCount === 0", visual: "标题「No eligible markets right now」；正文逐字：This voucher opens a trial position on Boost and Standard markets priced between 20¢ and 80¢. None are open at the moment — the voucher stays valid until {expiresLabel}. 按钮「Browse all events」→ /events", source: "EventPickerCard.PickerNoEligible（券不作废，故为等待态）" },
      { state: "BlockedReason", when: "cardEligible === false && !eventLocked", visual: "Lock 小图标 + 原因句（价带外 / 距结算过近 / 已结算），11px #9AA1AC", source: "EventPickerList.checkEligibility.reason" },
      { state: "pills 渲染判定", when: "categories.length > 0 && eligibleCount > 8", visual: "满足才渲染分类 pill 行；否则整行不占位（44px 不白给）", source: "EventPickerList.showPills" },
    ],
  },
  {
    key: "vouchers-picker-chrome",
    label: "VC-12 · CAPTION 头行 + 分类 pills（PickerCaptionRow / Chip）",
    note: "两件都是 M4a-① 从 EventPickerList 抽出的真件（DOM / class / 内联样式与生产逐字相同）。",
    spec: [
      { state: "CAPTION 行", when: "恒定，picker 首行", visual: "左「Pick a market — one voucher opens one trial position」12px #9AA1AC；右 44×44 放大镜按钮", source: "EventPickerList.PickerCaptionRow" },
      { state: "放大镜 open", when: "searchOpen === true", visual: "图标色由 #9AA1AC 变 VT.ink，下方展开 PickerSearchBar", source: "EventPickerList.searchOpen" },
      { state: "pill 集", when: "TOP_CATEGORIES.filter(c => c.id !== 'all' && liveCategoryIds.has(c.id))", visual: "顺序与文案取自 taxonomy；只渲染当前有 live 事件的品类，前置固定「All」", source: "EventPickerList.categories（taxonomy 为唯一真相）" },
      { state: "Chip active", when: "activeCat === c.id（All 为 activeCat === null）", visual: "白底 #fff / #0A0B0D 字 / 700；非选中为透明底 + 1px #23262D + #9AA1AC", source: "EventPickerList.Chip" },
      { state: "移动排布", when: "isMobile", visual: "单行横滚（overflow-x-auto scrollbar-hide），不换行", source: "EventPickerList pills 容器" },
      { state: "桌面排布", when: "!isMobile", visual: "flex-wrap 换行铺满", source: "EventPickerList pills 容器" },
    ],
  },

  /* ------------------------ Ⓓ Desk 与确认 (VC-13…16) --------------------- */
  {
    key: "vouchers2-desk",
    label: "VC-13a · 兑换台头（旧大拼盘 · 沿用 key）",
    note: "旧 playground key 保留以维持深链；确定性帧组见下方 VC-13b。",
  },
  {
    key: "vouchers-desk-header",
    label: "VC-13b · VoucherDeskHeader / 票根（确定性帧组）",
    note: "compact 展开态由受控 fixture `stubDefaultOpen` 呈现，不做自动点击。",
    spec: [
      { state: "桌面全幅", when: "!compact", visual: "pad 18/20；「REDEEMING VOUCHER」小帽 + 34px volt 面值 + 「Trial Position Voucher · From {source}」+ 右侧 code chip", source: "VoucherDeskHeader" },
      { state: "三 meta cell", when: "!compact", visual: "#101216 r10 三格：Max profit `$${faceValue × redeemableCapPct}` / Hold window `{maxHoldingHours}h` / Payout", source: "VoucherDeskHeader.cells" },
      { state: "披露句 · instant", when: "payoutMode === 'instant'", visual: "逐字：Instant payout: profit lands straight in your Standard balance when the trial position closes.", source: "VoucherDeskHeader（payout 披露）" },
      { state: "披露句 · tiered", when: "payoutMode !== 'instant'", visual: "逐字：Tiered payout: profit lands in your pending balance, and how much you can claim at once unlocks with traded volume.", source: "VoucherDeskHeader（payout 披露）" },
      { state: "票根收起", when: "compact && !open", visual: "56px 单行：3px volt 左轨 + 24px volt 面值 + From {campaign} + INSTANT 尾标（仅 instant）+ chevron", source: "VoucherDeskHeader.VoucherStub" },
      { state: "票根展开", when: "compact && open", visual: "同一张卡里长出非模态 terms 面板（三 term 格 + code + payout 短句），不是 Dialog / Drawer", source: "VoucherStub open 分支" },
    ],
  },
  {
    key: "vouchers-meta-cells",
    label: "VC-14 · 派生 metaCells（RedeemMetaCells）",
    note: "fixture redeemableCapPct 一律 0.5（DB 现值）。三格只在 picked 之后渲染。",
    spec: [
      { state: "渲染条件", when: "picked !== null", visual: "picker 下方出现三格；未 picked 时整块不存在", source: "RedeemVoucherContent.metaCells" },
      { state: "Entry", when: "Math.round(picked.price × 100)", visual: "`61¢`（0.61 → 61¢）", source: "RedeemMetaCells" },
      { state: "Size", when: "faceValue ÷ picked.price，toFixed(0)", visual: "$10 ÷ 0.61 = 16 shares；$10 ÷ 0.24 = 42 shares；$25 ÷ 0.44 = 57 shares", source: "RedeemVoucherContent.size" },
      { state: "Max profit", when: "faceValue × redeemableCapPct（capPct = 0.5）", visual: "$10 → $5.00，$25 → $12.50；volt 字色。恒显券的固定上限，不随所选项实算——换选项它不变", source: "v2 裁定 7（RedeemVoucherContent.cap）" },
    ],
  },
  {
    key: "vouchers-summary-bar",
    label: "VC-15a · RedeemSummaryBar · 桌面 inline 卡",
    spec: [
      { state: "未 picked · 桌面", when: "picked === null && !isMobile", visual: "卡仍在，左侧提示「Pick an outcome above to see your trial position.」，确认按钮 disabled 描边态", source: "RedeemSummaryBar card 分支" },
      { state: "未 picked · 移动", when: "picked === null && isMobile && variant === 'inline'", visual: "return null——整条不渲染，页面底部没有任何 chrome", source: "RedeemSummaryBar 移动早 return" },
      { state: "摘要第一行", when: "picked !== null", visual: "`{eventName}`（多选再拼 ` · {displayLabel}`）+ ` · {Yes|No|displayLabel} at {round(price×100)}¢`", source: "RedeemSummaryBar lineOne" },
      { state: "摘要第二行", when: "恒定", visual: "`${faceValue} voucher · closes automatically after {maxHoldingHours}h · Max profit ${maxProfit}`", source: "RedeemSummaryBar lineTwo" },
      { state: "Reset", when: "picked !== null", visual: "44px 文字按钮「Reset」，清空所选项", source: "RedeemVoucherContent onReset" },
      { state: "确认按钮", when: "picked !== null && !isRedeeming", visual: "白底 #FFFFFF / #0A0B0D 字「Confirm & open position」", source: "RedeemSummaryBar confirmButton" },
      { state: "进行中", when: "isRedeeming === true", visual: "文案换「Redeeming…」，按钮 disabled", source: "usePositionVouchers.isRedeeming" },
    ],
  },
  {
    key: "vouchers-summary-bar-mobile",
    label: "VC-15b · RedeemSummaryBar · 移动 fixed 贴底",
    note: "两端是不同版式（fixed 贴底条 vs inline 卡），所以走独立 key，不用运行时 useIsMobile 选组件。",
    spec: [
      { state: "贴底", when: "variant === 'inline' && isMobile && picked", visual: "fixed inset-x-0 bottom-0 z-[199]，#101216 底 + 1px #1D2026 上边，padding-bottom max(24px, safe-area)", source: "RedeemSummaryBar 移动分支" },
      { state: "无 BottomNav", when: "移动 redeem 全屏", visual: "该屏 BottomNav 退场，所以贴底条直接压安全区，不叠导航高度", source: "LiteRewardsPage mobileRedeeming（口径 RW-2）" },
      { state: "按钮布局", when: "移动", visual: "Reset 定宽 + 确认按钮 flex-1 撑满", source: "RedeemSummaryBar confirmButton(true)" },
    ],
  },
  {
    key: "vouchers-desk-empty",
    label: "VC-16 · desk 空态 + 桌面 desk 真拼",
    note: "第二帧用真件按生产顺序拼装（DeskHeader → CaptionRow → EventPickerCard → RedeemMetaCells → RedeemSummaryBar），取代旧 F 态手抄拼帧。",
    spec: [
      { state: "空态", when: "!isMobile && selected === null", visual: "desk 内 300px 居中卡：「Pick a voucher to redeem」+「Choose one on the left and the market picker opens here. Your own balance is never used — the voucher funds the trial position.」", source: "VouchersBody.VoucherDeskEmpty" },
      { state: "已载入", when: "!isMobile && selected !== null", visual: "DeskHeader（VC-13）+ RedeemVoucherContent(inline)：caption → picker → metaCells → inline summary 卡", source: "VouchersBody.desk" },
      { state: "移动无 desk", when: "isMobile", visual: "desk 整列不存在；redeem 走 URL 全屏屏", source: "VouchersBody isMobile 分支" },
    ],
  },

  /* --------------------------- Ⓔ 服务件 (VC-17) -------------------------- */
  {
    key: "voucher-banner",
    label: "VC-17a · VoucherBanner（Pro /portfolio 入口件）",
    spec: [
      { state: "隐藏", when: "grantedCount === 0 && claimedCount === 0", visual: "返回 null，/portfolio 不占任何高度", source: "VoucherBanner" },
      { state: "granted 优先", when: "grantedCount > 0", visual: "Gift 图标 + 领取 CTA，压过 claimed CTA", source: "VoucherBannerView" },
      { state: "claimed only", when: "grantedCount === 0 && claimedCount > 0", visual: "Ticket 图标 + 兑换 CTA", source: "VoucherBannerView" },
      { state: "去向", when: "点击 CTA", visual: "跳 /rewards?tab=vouchers（Vouchers 页为唯一落点，/vouchers 302 重定向）", source: "src/pages/Portfolio.tsx 挂载点" },
    ],
  },
  {
    key: "voucher-close",
    label: "VC-17b · CloseVoucherContent（平仓确认 · 6 PnL 态）",
    note: "M4a-① 修齐后：cap 动态取自券，文案按 payout_mode 分流。",
    spec: [
      { state: "contracts", when: "faceValue × 5 ÷ max(entry, 0.0001)", visual: "Contracts 行整数显示（券固定 5x）", source: "supabase/functions/close-trial-position（同一公式）" },
      { state: "rawPnl", when: "(mark − entry) × contracts × (side === 'short' ? −1 : 1)", visual: "盈 volt-green / 亏 trading-red", source: "CloseVoucherContent" },
      { state: "cap", when: "redeemableCap ?? faceValue × (redeemableCapPct ?? 0.5)", visual: "「Max profit」行；capPct 缺省回落 0.5（DB 现默认值）", source: "CloseVoucherContent.DEFAULT_CAP_PCT" },
      { state: "credit", when: "clamp(rawPnl, 0, cap)", visual: "底行 `+$X.XX`；为 0 时中性灰", source: "CloseVoucherContent" },
      { state: "instant 句组", when: "payoutMode === 'instant'", visual: "底行标签「Credited to your wallet」；脚注逐字：Profit goes straight to your wallet on settlement. Losses are floored at $0 — your wallet is never debited.", source: "CloseVoucherContent isInstant 分支" },
      { state: "tiered 句组", when: "payoutMode !== 'instant'", visual: "底行标签「Added to pending balance」；脚注逐字：Profit lands in your pending balance, unlocked by volume. Losses are floored at $0 — your wallet is never debited.", source: "CloseVoucherContent isInstant 分支" },
      { state: "submitting", when: "isClosing === true", visual: "按钮 spinner +「Closing…」，两个按钮均 disabled", source: "CloseVoucherContent isClosing" },
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

/* ---- M4b 并账：旧 Vouchers2Section 每一段规范文字的去向 ---- */
const LEDGER: { from: string; to: string }[] = [
  { from: "旧 §1 VoucherRow — every state（description）", to: "VC-5 spec 全表（3px volt 轨 / 已用转灰 / volt 面额 / 两行文本 / instant 例外第三行 / 移动 44px 全宽动作）" },
  { from: "旧 §2 VoucherEarningsCard（description）", to: "VC-2 spec 全表 + 档位轨 T0–T4 行；claimable = min(pending, tier cap − lifetimeCredited) 写进 VC-2「不可 claim」行" },
  { from: "旧 §3 VoucherHistoryArchive（description）", to: "VC-7 spec 全表（计数 + 盈利汇总 bar、双模式 caption、expired 原因）" },
  { from: "旧 §4 Market picker（description）", to: "VC-8（卡态）+ VC-9（互补收拢、方向轴双色、多选各自带价）+ VC-11（search / skeleton / empty）" },
  { from: "旧 §5 Redeem desk（description）", to: "VC-13b spec（三 meta cell、票根 56px 收起 / 就地展开 terms）" },
  { from: "旧 §6 Redeem screen v2.1 六态（description）", to: "VC-15b（移动全屏无 BottomNav、‹ owns the exit）+ VC-11 pills 判定行（eligibleCount > 8）" },
  { from: "旧 §7 VoucherBanner（description）", to: "VC-17a spec（granted 压过 claimed、零时返回 null、/portfolio 挂载点）" },
  { from: "旧 §8 CloseVoucherContent（description）", to: "VC-17b spec（credit floors at 0 / caps at Max profit、long·short × profit·loss·capped·submitting）" },
  { from: "preview key `vouchers2-mobile-flow`（A–F 六态 playground）", to: "页内退场（框架铁律 1：字典不挂 PresetRail 大拼盘）。key 保留在 registry 以维持既有深链；六态分别落到 VC-8（E 锁态）/ VC-9（C 互补 picked）/ VC-10（D 多选）/ VC-13b（B 票根展开）/ VC-15（A 无 chrome、贴底条）/ VC-16（F 桌面 desk）" },
  { from: "preview key `vouchers2-picker`（7 态大拼盘）", to: "保留为 VC-8 帧；拆出的确定性帧组为 vouchers-picker-direction / -fold / -states / -chrome" },
  { from: "preview key `vouchers2-desk`（3 态大拼盘）", to: "保留为 VC-13a 帧；确定性帧组为 vouchers-desk-header（含受控展开票根）" },
  { from: "旧手抄①：desk 空态内联 JSX（vouchers2Previews）", to: "删除，改挂真件 VouchersBody.VoucherDeskEmpty（VC-16）" },
  { from: "旧手抄②：CAPTION 行 + 分类 Chip 内联 JSX", to: "删除，改挂真件 EventPickerList.PickerCaptionRow / Chip（VC-12）" },
  { from: "旧手抄③：F 态桌面 desk 手工拼帧", to: "删除，改用真件按生产顺序拼装（VC-16 第二帧）" },
  { from: "HISTORY fixture 的 Date.now() 绝对日期", to: "已冻结为相对偏移 daysAgoAt / daysFromNow（M4a-② 完成）" },
];

const READ_ME =
  "怎么读这一节：Ⓐ 区状态由组合层字段驱动（isLoading / isError / grantedVouchers / claimedVouchers / history / isMobile / searchParams.redeem）；Ⓑ 区状态由单张券驱动（status / payoutMode / expiresAt / claimingId / selectedId）与当日池（get_voucher_pool_today）；Ⓒ 区由 picker 数据驱动（eventEligibility / usedEventIds / eligibleCount / rows.length / searchOpen / activeCat）；Ⓓ 区由 picked 与券字段驱动（picked / faceValue / redeemableCapPct / maxHoldingHours / payoutMode / isRedeeming）；Ⓔ 区为页外服务件。每个 case 下方的表给出「状态 → 触发条件 → 视觉结果 → 数据来源」，条件都是可判定表达式，可直接照抄进实现。fixture 红线：redeemableCapPct 一律 0.5（DB 真值），日期一律相对偏移。";


export const VouchersStatesSection = () => (
  <SectionWrapper
    id="vouchers-states"
    title="Vouchers · 状态字典（VC-1…VC-17 · Ⓐ–Ⓔ 区）"
    platform="shared"
    description="分区序 = 生产模块序：Ⓐ组合层 · Ⓑ券行与状态机 · Ⓒ兑换台 · Ⓓ市场选择器 · Ⓔ合规。M4b 收官后 VC-1…VC-17 全部落地，旧 Vouchers2Section 已页内退场（并账列账表见本节末尾）。每个 case 双帧（desktop 1280 / mobile 375），两端版式不同的走 `-mobile` 分 key，禁运行时 useIsMobile 选组件；fixture 一律确定性注入（相对日期、固定 id、禁运行时 fetch）。表里没有列出的组合视为不存在。"
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

      <SubSection
        title="Ⓒ Redeem picker（VC-8 … VC-12）"
        description="市场选择器：卡 → 方向控件 → 折叠 → 周边态 → 头行与 pills。方向色一律走 Market Axis（long #33D6FF / short #CFFF4A），互补收拢是数据规则不是视口规则。"
      >
        <Pair cases={byKey("vouchers2-picker")} desktopMin={420} mobileMin={480} />
        <div className="mt-6">
          <Pair cases={byKey("vouchers-picker-direction")} desktopMin={480} mobileMin={520} />
        </div>
        <div className="mt-6">
          <Pair cases={byKey("vouchers-picker-fold")} desktopMin={640} mobileMin={720} />
        </div>
        <div className="mt-6">
          <Pair cases={byKey("vouchers-picker-states")} desktopMin={720} mobileMin={800} />
        </div>
        <div className="mt-6">
          <Pair cases={byKey("vouchers-picker-chrome")} desktopMin={280} mobileMin={320} />
        </div>
      </SubSection>

      <SubSection
        title="Ⓓ Desk 与确认（VC-13 … VC-16）"
        description="兑换台：券头 / 票根 → 派生 metaCells → 确认条 → 空态与桌面真拼。移动确认条与桌面 inline 卡是两种版式，分 key 呈现。"
      >
        <Pair cases={byKey("vouchers2-desk", "vouchers-desk-header")} desktopMin={640} mobileMin={620} />
        <div className="mt-6">
          <Pair cases={byKey("vouchers-meta-cells")} desktopMin={320} mobileMin={360} />
        </div>
        <div className="mt-6">
          <Pair
            cases={byKey("vouchers-summary-bar")}
            mobileCases={byKey("vouchers-summary-bar-mobile")}
            desktopMin={420}
            mobileMin={340}
          />
        </div>
        <div className="mt-6">
          <Pair cases={byKey("vouchers-desk-empty")} desktopMin={720} mobileMin={760} />
        </div>
      </SubSection>

      <SubSection
        title="Ⓔ 服务件（VC-17）"
        description="Vouchers 页之外仍在服役的两件：Pro /portfolio 的入口 Banner，与 /trade · /spot 的券仓平仓确认面板。"
      >
        <Pair cases={byKey("voucher-banner")} desktopMin={260} mobileMin={300} />
        <div className="mt-6">
          <Pair cases={byKey("voucher-close")} desktopMin={620} mobileMin={680} />
        </div>
      </SubSection>

      <div className="space-y-2">
        <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground/80">
          并账列账表 · 旧节（Vouchers2Section）原文位置 → 去向
        </div>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          旧节已从 /style-guide 页内退场（section 文件保留在仓库，不再挂载）。被批过的规范文字全部有去向，一条未静默丢弃。
        </p>
        <div className="overflow-x-auto rounded-md border border-border/40">
          <table className="w-full min-w-[720px] border-collapse text-left text-[11px]">
            <thead>
              <tr className="bg-muted/20 text-[10px] uppercase tracking-wider text-muted-foreground/70">
                <th className="px-2 py-1.5 font-medium">原文位置</th>
                <th className="px-2 py-1.5 font-medium">去向</th>
              </tr>
            </thead>
            <tbody>
              {LEDGER.map((r) => (
                <tr key={r.from} className="border-t border-border/30 align-top">
                  <td className="px-2 py-1.5 font-mono text-[10.5px] text-muted-foreground">{r.from}</td>
                  <td className="px-2 py-1.5 text-muted-foreground">{r.to}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </SectionWrapper>
);

