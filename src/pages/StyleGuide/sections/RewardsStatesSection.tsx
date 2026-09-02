/**
 * Rewards · 状态字典（M3a-② 分区 Ⓐ–Ⓑ · RW-1…RW-6 · mock9 框架）。
 *
 * 每个 case = 生产组件 + SectionFrame 双帧（desktop 1280 在上 / mobile 375 在下）。
 * fixture 只注数据与状态（相对日期、固定 id、无运行时 fetch）；生产代码零改动。
 * Ⓒ–Ⓔ 区（RW-7…RW-18）在 M3b。
 */
import { SectionWrapper, SubSection } from "../components/SectionWrapper";
import { SectionFrame, type SectionCase } from "../components/SectionFrame";

/* ---------------- Ⓐ 页面壳（RW-1 … RW-3） ---------------- */

const SHELL_CASES: SectionCase[] = [
  {
    key: "rewards-lite-tabs",
    label: "RW-1 · Tabs 三分页（Tabs）",
    note: "生产 LiteRewardsPage 内联 Tabs 组件纯导出后直挂，JSX 与行为未改。三帧分别是 Campaigns / Vouchers / Referral 各自选中，第四帧是移动 sticky 形态。",
    spec: [
      {
        state: "Campaigns 选中",
        when: 'tab === "campaigns"',
        visual: "该 tab 字重 700 色 #F2F3F5 + 下方 2.5px 白条；另两枚字重 500 色 #6B7280",
        source: "Tabs value",
      },
      {
        state: "Vouchers 选中",
        when: 'tab === "vouchers"',
        visual: "同上镜像",
        source: "Tabs value",
      },
      {
        state: "Referral 选中",
        when: 'tab === "referral"',
        visual: "同上镜像",
        source: "Tabs value",
      },
      {
        state: "URL 同步",
        when: 'onChange → setSearchParams({ tab: v }, { replace: true })；进场 searchParams.get("tab") ∈ {campaigns, vouchers, referral} 时回填',
        visual: "地址栏 `?tab=` 与选中 tab 恒一致；replace 不产生历史栈",
        source: "LiteRewardsPage useSearchParams",
      },
      {
        state: "移动吸顶",
        when: "sticky === true（isMobile）",
        visual: "追加 `sticky top-[var(--mobile-header-h)] z-30 -mx-4 bg-background px-4`",
        source: "Tabs sticky 分支",
      },
      {
        state: "游客",
        when: "signedOut === true",
        visual: "三 tab 均可点；Vouchers / Referral 的内体换成登录门卡，tabs 条本身不变",
        source: "SignInPromptCard（cap VOUCHERS / REFERRAL）",
      },
    ],
  },
  {
    key: "rewards-lite-redeem-shell",
    label: "RW-2 · 移动 redeem 全屏壳（MobileHeader · 移动单端，无桌面帧）",
    note: "桌面无此形态（载壳判定含 isMobile），故省桌面帧。券内体与兑换流程 → M4。header title 逐字取自生产：`Redeem voucher`，backTo `/rewards?tab=vouchers`。",
    spec: [
      {
        state: "进入载壳",
        when: 'mobileRedeeming = isMobile && tab === "vouchers" && !!searchParams.get("redeem")',
        visual: "整页去 tabs 条、去 BottomNav、去 SeoFooter；main 无内边距占满",
        source: "LiteRewardsPage mobileRedeeming",
      },
      {
        state: "壳头",
        when: "mobileRedeeming === true",
        visual: "MobileHeader variant inner：title `Redeem voucher`、‹ 返回、无 logo",
        source: 'MobileHeader title="Redeem voucher" showBack showLogo={false}',
      },
      {
        state: "唯一出口",
        when: "点 ‹",
        visual: "回 `/rewards?tab=vouchers`，退出载壳恢复 tabs + BottomNav",
        source: 'MobileHeader backTo="/rewards?tab=vouchers"',
      },
      {
        state: "非载壳",
        when: "!mobileRedeeming",
        visual: "MobileHeader title `Rewards`、flushBottom（分隔线交给吸顶 tabs）+ BottomNav",
        source: "LiteRewardsPage isMobile 分支",
      },
    ],
  },
  {
    key: "rewards-points-notice",
    label: "RW-3 · 积分退役提示（PointsRetiredNotice）",
    note: "位置分叉不是 bug：桌面在网格上方，移动在卡片下方（生产 `{!isMobile && <PointsRetiredNotice />}` 与 `{isMobile && <PointsRetiredNotice />}` 两处挂载）。预览用 CSS order 还原，未引入运行时设备判断。",
    spec: [
      {
        state: "可见",
        when: 'localStorage.getItem("omenx_points_retired_notice_dismissed") !== "1"',
        visual: "#0F1114 底 + #23262D 边圆角卡，文案 `Points have retired. Rewards now come as Trial Position Vouchers.` + `Open vouchers →`（#33D6FF）+ 右侧 × ",
        source: "PointsRetiredNotice dismissed",
      },
      {
        state: "已关闭",
        when: '点 × → localStorage["omenx_points_retired_notice_dismissed"] = "1"',
        visual: "整卡 return null，永久不再渲染（按设备，不跨设备同步）",
        source: "NOTICE_KEY",
      },
      {
        state: "位置 · 桌面",
        when: "!isMobile",
        visual: "渲染在 campaigns 网格上方",
        source: "LiteRewardsPage campaigns 分支",
      },
      {
        state: "位置 · 移动",
        when: "isMobile",
        visual: "渲染在卡片与 fine print 之下（页尾）",
        source: "LiteRewardsPage campaigns 分支",
      },
    ],
  },
];

/* ---------------- Ⓑ Campaigns 网格（RW-4 … RW-6） ---------------- */

const GRID_CASES: SectionCase[] = [
  {
    key: "rewards-campaign-cards",
    label: "RW-4 · CampaignCard 全相（CampaignCard）",
    note: "八相依次：live / KOL special / always-on / upcoming / ended / no key visual / claimableCount=2 / signedOut。日期一律相对 now 生成。",
    spec: [
      {
        state: "live",
        when: 'phase === "live"',
        visual: "volt 徽标 `Live`（rgba(207,255,74,.14) 底 / #CFFF4A 字），整卡不透明",
        source: "useCampaigns.CampaignPhase",
      },
      {
        state: "always-on",
        when: 'phase === "always-on"（campaign.endsAt === null）',
        visual: "灰徽标 `Always on`，日期行 `Always valid`，meta 无 `Ends in Xd`",
        source: "CampaignPhase · formatDateRange",
      },
      {
        state: "upcoming",
        when: 'phase === "upcoming"',
        visual: "灰徽标 `Starts {MMM d}`，整卡 opacity 0.65",
        source: "CampaignPhase · campaign.startsAt",
      },
      {
        state: "ended",
        when: 'phase === "ended"',
        visual: "灰徽标 `Ended`，卡不透明；进度块照常渲染",
        source: "CampaignPhase",
      },
      {
        state: "special（KOL）",
        when: 'entry.kind === "special"',
        visual: "橙色 partner 徽标（rgba(255,138,61,.16) 底 / #FF8A3D 边字）+ 16px 圆形头像 + display_name，优先级高于 phase 徽标",
        source: "campaign_entries.kind · branding.display_name/avatar_url",
      },
      {
        state: "signedOut",
        when: "signedOut === true",
        visual: "`Your progress` 行与 5px 进度条整块不渲染；claim 行恒空",
        source: "CampaignCard signedOut",
      },
      {
        state: "可领计数",
        when: "!signedOut && claimableCount > 0",
        visual: "`● {n} ready to claim`（11px 粗体 #CFFF4A）",
        source: "CampaignView.claimableCount",
      },
      {
        state: "无主视觉",
        when: "entry.branding.key_visual_url == null",
        visual: "CampaignKeyVisual 兜底：纯色底 + accent 竖轨，标题层不变",
        source: "CampaignKeyVisual fallback",
      },
      {
        state: "画幅比例",
        when: "isMobile ? '16 / 7' : '16 / 6.4'",
        visual: "移动更高一点的主视觉",
        source: "CampaignCard isMobile 分支",
      },
      {
        state: "移动 meta 行",
        when: "isMobile === true",
        visual: "meta 去掉 `{n} joined`（joined 上移到主视觉日期行），claim 行与 meta 行堆叠两行",
        source: "CampaignCard isMobile 分支",
      },
    ],
  },
  {
    key: "rewards-grid-loading",
    label: "RW-5 · 网格 loading 骨架（CampaignGridSkeleton）",
    note: "挂 M3a-① 提取的真件；tabs 条在 loading 期间是实底静态 chrome，不参与骨架。",
    spec: [
      {
        state: "加载中",
        when: "useCampaignViews().isLoading === true",
        visual: "2 块 h-[300px] rounded-[14px] #0F1114 pulse，桌面两列 / 移动单列",
        source: "LiteRewardsPage isLoading 分支",
      },
      {
        state: "缓存命中",
        when: "isLoading === false（react-query 缓存）",
        visual: "直渲网格，不闪骨架帧",
        source: "useCampaignViews",
      },
      {
        state: "chrome 不骨架",
        when: "恒真",
        visual: "tabs 条实底渲染，骨架只覆盖网格区",
        source: "LiteRewardsPage body 结构",
      },
    ],
  },
  {
    key: "rewards-ended-archive",
    label: "RW-6 · 已结束活动归档（EndedCampaignsArchive）",
    note: "两帧各含收起与展开两态。列表为空时整块 return null。",
    spec: [
      {
        state: "收起（默认）",
        when: "open === false（defaultOpen 缺省）",
        visual: "单条汇总条 `Ended campaigns (N) · $X in vouchers earned` + 右侧 `Show` + ChevronDown",
        source: "EndedCampaignsArchive open",
      },
      {
        state: "展开",
        when: "open === true",
        visual: "顶边分隔后逐行渲染，右侧改 `Hide` + ChevronUp；行尾一条 `All rewards you've received live in Position Vouchers →`",
        source: "EndedCampaignsArchive open",
      },
      {
        state: "行版式 · 桌面",
        when: "isMobile === false",
        visual: "96×54 缩略图 + 名称/`Ended {MMM d}` + 右对齐合计（$X in vouchers / $Y USDC / N / M tasks）",
        source: "组件内 isMobile 分支",
      },
      {
        state: "行版式 · 移动",
        when: "isMobile === true",
        visual: "72×40 缩略图 + 名称 + 堆叠 meta（`Ended {d} · N/M tasks` 与 volt 合计行），无右列",
        source: "组件内 isMobile 分支",
      },
      {
        state: "无缩略图",
        when: "entry.branding.key_visual_url == null",
        visual: "缩略框以 accent 纯色填充",
        source: "EndedCampaignsArchive style background",
      },
      {
        state: "空归档",
        when: "views.length === 0",
        visual: "整块不渲染",
        source: "EndedCampaignsArchive 早退",
      },
    ],
  },
];

const ALL_CASES: SectionCase[] = [...SHELL_CASES, ...GRID_CASES];

const byKey = (...keys: string[]): SectionCase[] =>
  keys.map((k) => {
    const hit = ALL_CASES.find((c) => c.key === k);
    if (!hit) throw new Error(`RewardsStatesSection: unknown case key ${k}`);
    return hit;
  });

const Pair = ({
  cases,
  mobileCases,
  desktopMin,
  mobileMin,
}: {
  cases: SectionCase[];
  /** 两端是不同生产组件时，mobile 帧挂这组；缺省与 desktop 帧同组。 */
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

const READ_ME =
  "怎么读这一节：Ⓐ 区状态由 LiteRewardsPage 的壳字段驱动（tab / searchParams.tab / redeem / isMobile / signedOut）；Ⓑ 区状态由 useCampaignViews 派生的 CampaignView 驱动（phase / entry.kind / claimableCount / signedOut / branding.key_visual_url）。每个 case 下方的表给出「状态 → 触发条件 → 视觉结果 → 数据来源」，条件都是可判定表达式，可直接照抄进实现。";

export const RewardsStatesSection = () => (
  <SectionWrapper
    id="rewards-states"
    title="Rewards · 状态字典（RW-1…RW-18 · Ⓐ–Ⓔ 区）"
    platform="shared"
    description="分区序 = 生产模块序：Ⓐ页面壳 · ⒷCampaigns 网格 · Ⓒ活动详情 · Ⓓ任务行 · ⒺReferral。本单只交付 Ⓐ Ⓑ（RW-1…RW-6），Ⓒ–Ⓔ（RW-7…RW-18）在 M3b。每个 case 双帧（desktop 1280 / mobile 375），同一编号两帧各挂各端生产真组件；fixture 一律确定性注入（相对日期、固定 id、禁运行时 fetch）。表里没有列出的组合视为不存在。"
  >
    <div className="space-y-12">
      <div className="rounded-lg border border-border/40 bg-muted/10 p-3 text-[11px] leading-relaxed text-muted-foreground">
        {READ_ME}
      </div>

      <SubSection title="Ⓐ 页面壳（RW-1 … RW-3）">
        <Pair cases={byKey("rewards-lite-tabs")} mobileMin={520} />
        <div className="mt-6">
          <SectionFrame cases={byKey("rewards-lite-redeem-shell")} device="mobile" minHeight={280} />
        </div>
        <div className="mt-6">
          <Pair cases={byKey("rewards-points-notice")} desktopMin={520} mobileMin={720} />
        </div>
      </SubSection>

      <SubSection
        title="Ⓑ Campaigns 网格（RW-4 … RW-6）"
        description="网格首位恒为 H2eCampaignCard，状态机见 lite-h2e 节 01–07，本区不重建。"
      >
        <Pair cases={byKey("rewards-campaign-cards")} desktopMin={900} mobileMin={1600} />
        <div className="mt-6">
          <Pair cases={byKey("rewards-grid-loading")} desktopMin={420} mobileMin={720} />
        </div>
        <div className="mt-6">
          <Pair cases={byKey("rewards-ended-archive")} desktopMin={320} mobileMin={360} />
        </div>
      </SubSection>
    </div>
  </SectionWrapper>
);
