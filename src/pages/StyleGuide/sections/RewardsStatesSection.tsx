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

/* ---------------- Ⓒ Campaign 详情（RW-7 … RW-13） ---------------- */

const DETAIL_CASES: SectionCase[] = [
  {
    key: "rewards-campaign-hero",
    label: "RW-7 · 详情 Hero（CampaignKeyVisual + KolBand）",
    note: "三态依次：public 素 hero / special 挂 KolBand / frozen（ENDED 徽章 + 日期行 `· Ended`）。桌面帧走 KolBandDesktop + ratio 1232/300，移动帧走 KolBandMobile + ratio 16/9.5，两端分 key（`-mobile`），不做运行时设备判断。hero 组合仍内联在 LiteCampaignDetailPage，本帧按生产同一组合挂真组件。",
    spec: [
      {
        state: "public hero",
        when: 'entry.kind === "public"',
        visual: "主视觉 + scrim + 标题 + 日期/joined 行 + 奖励 pill；无 KolBand",
        source: "LiteCampaignDetailPage desktopHero / mobileHero",
      },
      {
        state: "special hero",
        when: 'isSpecial = entry.kind === "special"',
        visual: "标题上方插 KolBand（桌面 KolBandDesktop 实心橙胶囊 34px 头像两行；移动 KolBandMobile 单行 22px 头像）",
        source: "KolBandDesktop / KolBandMobile · branding.display_name/avatar_url",
      },
      {
        state: "frozen",
        when: 'frozen = view.phase === "ended"',
        visual: "pill 行尾追加 `Ended` 徽章（#242830 底 / #C9CED6 字）；移动日期行追加 ` · Ended`",
        source: "LiteCampaignDetailPage frozen",
      },
      {
        state: "奖励 pill · voucher",
        when: "view.rewardVoucherUpTo > 0",
        visual: "`${n} Trial Position Voucher`，字色 #CFFF4A（奖励币种双色：券 volt）",
        source: "DESIGN.md 奖励币种双色规范 · CampaignView.rewardVoucherUpTo",
      },
      {
        state: "奖励 pill · USDC",
        when: "view.rewardUsdcUpTo > 0",
        visual: "`${n} USDC`，字色 #33D6FF（奖励币种双色：USDC 蓝）",
        source: "DESIGN.md 奖励币种双色规范 · CampaignView.rewardUsdcUpTo",
      },
      {
        state: "画幅 · 移动",
        when: "isMobile === true",
        visual: "ratio `16 / 9.5`，scrim 从 0% 透明到 98% 实底，标题 22/28",
        source: "LiteCampaignDetailPage mobileHero",
      },
      {
        state: "画幅 · 桌面",
        when: "isMobile === false",
        visual: "ratio `1232 / 300`，scrimHeight 190px，标题 36px",
        source: "LiteCampaignDetailPage desktopHero",
      },
      {
        state: "无主视觉",
        when: "entry.branding.key_visual_url == null",
        visual: "CampaignKeyVisual 兜底：#101216 实底 + 3px accent 竖轨",
        source: "CampaignKeyVisual fallback",
      },
    ],
  },
  {
    key: "rewards-kol-band",
    label: "RW-7b · KolBand 双端本体（KolBandDesktop / KolBandMobile）",
    note: "并入 RW-7：hero 内的品牌带单独放大看。桌面实心 #FF8A3D 胶囊 + 34px 头像 + 两行 lockup；移动单行胶囊 + 22px 头像，无解释句。",
    spec: [
      {
        state: "桌面带",
        when: "isSpecial && !isMobile",
        visual: "实心橙胶囊，34px 圆头像，两行（display_name + 解释句）",
        source: "KolBandDesktop",
      },
      {
        state: "移动带",
        when: "isSpecial && isMobile",
        visual: "细单行胶囊，22px 头像，无解释句，位于 hero scrim 内标题之上",
        source: "KolBandMobile",
      },
    ],
  },
  {
    key: "rewards-grant-rows",
    label: "RW-8 · GrantTaskRow 九分支（GrantTaskRow）",
    note: "帧内自上而下：signedOut / not_started+Trade / not_started+Connect / in_progress+进度条 / claimable·voucher / claiming / claimable·usdc / claimed / not_eligible / frozen。并入旧 `rewards-taskrow-board` 的全量板职责。",
    spec: [
      {
        state: "signedOut",
        when: "signedOut === true && !frozen",
        visual: "动作位渲染灰字 `Sign in to start`，无按钮",
        source: "GrantTaskRow signedOut 分支",
      },
      {
        state: "not_started + CTA",
        when: 'status === "not_started" && !signedOut && !frozen && !notEligible',
        visual: "描边次级按钮（44px 移动 / 40px 桌面），文案由 cta 推断",
        source: "GrantTaskRow showAction · fallbackCta",
      },
      {
        state: "in_progress + CTA",
        when: 'status === "in_progress" && !signedOut && !frozen',
        visual: "同上按钮保留；标题下加进度条",
        source: "GrantTaskRow showAction",
      },
      {
        state: "进度条",
        when: 'status === "in_progress" && typeof progressValue === "number" && typeof task.target === "number"',
        visual: "TaskRowShell 5px 进度条 + `$180 / $500` 计数",
        source: "TaskRowShell progress",
      },
      {
        state: "CTA 推断表",
        when: 'task.cta 缺省时按 task_key 推断：includes("discord") → Join（discord.gg）· includes("connect") → Connect（/settings）· includes("share") → Share（/events?sector=…）· 其余 → Trade（/events?sector=… 或 /events）',
        visual: "按钮文案与目标随推断变化；task.cta 显式给出时覆盖推断",
        source: "GrantTaskRow fallbackCta",
      },
      {
        state: "claimable · voucher",
        when: 'status === "claimable" && task.reward.voucher > 0 && !frozen',
        visual: "白底 `Claim voucher` 按钮",
        source: "ClaimButton",
      },
      {
        state: "claiming",
        when: "isClaiming === true",
        visual: "同按钮 disabled + Loader2 旋转图标",
        source: "GrantTaskRow isClaiming",
      },
      {
        state: "claimable · USDC",
        when: 'status === "claimable" && task.reward.usdc > 0 && voucher === 0',
        visual: "无按钮，右侧纯文字 `Credited to Standard after review`",
        source: "GrantTaskRow STATUS 文案分支",
      },
      {
        state: "claimed",
        when: 'status === "claimed"',
        visual: "右侧灰字 `Claimed`",
        source: "STATUS_LABEL",
      },
      {
        state: "not_eligible",
        when: 'status === "not_eligible"',
        visual: "整行虚线灰（dashed + muted），CircleSlash 图标，副标题 `Covered by your friend's invite — this one goes to them.`，右侧 `Not eligible`",
        source: "GrantTaskRow notEligible",
      },
      {
        state: "frozen",
        when: 'frozen = view.phase === "ended"',
        visual: "全部按钮不渲染，只留状态词；claimable 也不出 Claim 按钮",
        source: "GrantTaskRow frozen",
      },
      {
        state: "列宽 · 桌面",
        when: "isMobile === false",
        visual: "reward 列 w-[92px] 右对齐，action 列 w-[132px] 靠右",
        source: "GrantTaskRow isMobile 分支",
      },
      {
        state: "列宽 · 移动",
        when: "isMobile === true",
        visual: "无固定列宽，两层堆叠（图标+文案在上，reward 左 / action 右在下），分隔发丝线",
        source: "TaskRowShell 移动分支",
      },
    ],
  },
  {
    key: "rewards-campaign-rules",
    label: "RW-9 · 活动规则折叠（CampaignRulesDisclosure）",
    note: "帧内三态：收起 / 展开（受控 defaultOpen，非 setTimeout）/ paragraphs 为空整块不渲染。文案来自 `campaign_entries.rules.details`，只读。",
    spec: [
      {
        state: "收起（默认）",
        when: "open === false",
        visual: "44px 单行条：左 `CAMPAIGN RULES`（10px 粗体 #6B7280 letter-spacing .14em）+ 右 ChevronDown",
        source: "CampaignRulesDisclosure open",
      },
      {
        state: "展开",
        when: "open === true（点条头切换）",
        visual: "条下 1px #1D2026 分隔，逐段渲染 12.5px/20 #9AA1AC 段落，Chevron 旋转 180°",
        source: "CampaignRulesDisclosure open",
      },
      {
        state: "无规则",
        when: "entry.details == null 或 paragraphs.length === 0",
        visual: "整块 return null，详情页该位置不留空隙",
        source: "LiteCampaignDetailPage rulesModule",
      },
      {
        state: "自定义标题",
        when: "rules.details.heading 有值",
        visual: "条头文字改为该 heading，缺省 `Campaign rules`",
        source: "useCampaigns CampaignRuleDetails",
      },
    ],
  },
  {
    key: "rewards-rewards-card",
    label: "RW-10 · Your rewards here（CampaignRewardsCard · 桌面）",
    note: "五态：both（券+USDC）/ special（Entry·Joined via Lao Wang）/ voucher-only / usdc-only / frozen。移动版式不同 → 见同编号 mobile 帧（key `rewards-rewards-card-mobile`）。游客态不在本 case，见 `rewards-signin-prompt`。",
    spec: [
      {
        state: "桌面三行",
        when: "isMobile === false",
        visual: "`Vouchers claimed`（#CFFF4A）/ `USDC credited`（#33D6FF）/ 分隔线上 `Still available`（白）三行",
        source: "CampaignRewardsCard isMobile 分支",
      },
      {
        state: "移动 3 格",
        when: "isMobile === true",
        visual: "grid-cols-3 统计格：`Vouchers` #CFFF4A · `USDC` #33D6FF · `Available` 白，无三行文本",
        source: "CampaignRewardsCard isMobile 分支",
      },
      {
        state: "frozen 隐藏 Still available",
        when: "frozen === true（桌面）",
        visual: "第三行整块不渲染（活动结束后不再有可得额度）",
        source: "CampaignRewardsCard frozen",
      },
      {
        state: "CTA · 仅券",
        when: "rewardVoucherUpTo > 0 && rewardUsdcUpTo === 0",
        visual: "单个白底按钮 `Open Vouchers →`（44px）",
        source: "CampaignRewardsCard CTA 分支",
      },
      {
        state: "CTA · 仅 USDC",
        when: "rewardUsdcUpTo > 0 && rewardVoucherUpTo === 0",
        visual: "单个白底按钮 `Open Wallet →`",
        source: "CampaignRewardsCard CTA 分支",
      },
      {
        state: "CTA · 两者皆有",
        when: "rewardVoucherUpTo > 0 && rewardUsdcUpTo > 0",
        visual: "两列：白底 `Open Vouchers →` + 描边 `Open Wallet →`",
        source: "CampaignRewardsCard CTA 分支",
      },
      {
        state: "CTA · 无奖励",
        when: "两者皆为 0",
        visual: "CTA 区整块不渲染",
        source: "CampaignRewardsCard CTA 分支",
      },
      {
        state: "Entry 条（special）",
        when: 'isSpecial = entry.kind === "special"',
        visual: "标签 `ENTRY` + 橙字 `Joined via {kolName}` + 头像（无头像取首字母，#2A1200 底 / #FF8A3D 字）",
        source: "CampaignRewardsCard isSpecial",
      },
      {
        state: "Host 条（public）",
        when: "isSpecial === false",
        visual: "标签 `HOST` + 白字 `Official OmenX campaign — open to everyone` + OmenX logo",
        source: "CampaignRewardsCard isSpecial",
      },
      {
        state: "游客",
        when: "signedOut === true",
        visual: "整卡换成 SignInPromptCard（cap `YOUR REWARDS HERE`），卡壳与内边距保持",
        source: "LiteCampaignDetailPage rewardsCard 分支 · SignInPromptCard",
      },
    ],
  },
  {
    key: "rewards-detail-loading",
    label: "RW-11a · 详情 loading（CampaignDetailSkeleton）",
    spec: [
      {
        state: "加载中",
        when: "useCampaignViews().isLoading === true",
        visual: "单块 h-[420px] rounded-[16px] #0F1114 pulse，整页 hero/任务/卡都不渲染",
        source: "LiteCampaignDetailPage body 三分支",
      },
    ],
  },
  {
    key: "rewards-detail-unavailable",
    label: "RW-11b · 详情空态（CampaignUnavailable）",
    spec: [
      {
        state: "活动不存在",
        when: "!isLoading && views.find(v => v.campaign.id === campaignId) == null",
        visual: "py-16 居中 13px #9AA1AC 文案 `This campaign is no longer available.`",
        source: "LiteCampaignDetailPage body 三分支",
      },
      {
        state: "H2E 例外",
        when: 'campaignId === "h2e"',
        visual: "不走本分支，整页交给 H2eCampaignDetailPage（H2E 是平台项目，不在 campaigns 表）",
        source: "LiteCampaignDetailPage 早退",
      },
    ],
  },
  {
    key: "rewards-claim-toast",
    label: "RW-12 · claim 成功反馈（ClaimSuccessToastBody）",
    note: "帧内静态还原 sonner body，不真弹 toast（真弹会破坏帧确定性）。",
    spec: [
      {
        state: "claim 成功",
        when: "claim-campaign-grant / claim-referral-voucher 返回无 error",
        visual: "toast.success 标题 `Voucher sent to Position Vouchers`，描述 `Open vouchers to reveal it.`，动作按钮 `Open`",
        source: "showClaimSuccessToast",
      },
      {
        state: "Open 动作",
        when: "点 `Open`",
        visual: "navigate(\"/vouchers\")",
        source: "两个调用点：LiteCampaignDetailPage.handleClaim · ReferralPanel.claim",
      },
      {
        state: "claim 失败",
        when: "error 或 data.error 有值",
        visual: "改走 toast.error，文案取 data.error，缺省 `Could not claim this reward`",
        source: "LiteCampaignDetailPage / ReferralPanel 错误分支",
      },
    ],
  },
  {
    key: "rewards-ineligible-redirect",
    label: "RW-13 · entry 绑定两路径（IneligibleEntryToastBody）",
    note: "只有「被拒」一路有可渲染 UI；正常 softBind 全程无界面（见 spec 末两行），故不建帧。",
    spec: [
      {
        state: "被拒",
        when: "`?entry=CODE` 绑定被拒（cap 满 / 已锁定到别的 entry / 账户不合格 / 链接过期等）",
        visual: "单条正式 sonner toast（桌面 top-center，移动全宽）+ 立即跳回 `/`；详情页不渲染",
        source: "IneligibleEntryToastBody · CampaignAttribution",
      },
      {
        state: "文案通用",
        when: "恒真",
        visual: "文案刻意不区分拒绝原因，新增拒绝理由不需要新字符串",
        source: "IneligibleEntryToastBody",
      },
      {
        state: "special 首访绑定",
        when: "登录用户带 `?entry=CODE` 首访且未参与过任何 entry",
        visual: "无可渲染 UI：写入 campaign_participations 后照常渲染详情页，Entry 条改显 `Joined via {KOL}`",
        source: "CampaignAttribution（软绑定）",
      },
      {
        state: "public 软绑",
        when: 'user && view && !view.participation && entry.kind === "public"',
        visual: "无可渲染 UI：进入详情页即静默软绑，成功后 refresh() 使 joined 计数与 Host 条生效",
        source: "LiteCampaignDetailPage useEffect · softBindPublicEntry",
      },
    ],
  },
];

/* ---------------- Ⓓ Referral（RW-14 … RW-17） ---------------- */

const REFERRAL_CASES: SectionCase[] = [
  {
    key: "rewards-referral-invite",
    label: "RW-14 · Invite a friend 卡（ReferralPanel · fixture）",
    note: "fixture 注入 code `OMX7K2` + 空邀请列表，禁 live hook 数据；fixture 模式下 copy / claim 按钮 inert。",
    spec: [
      {
        state: "链接就绪",
        when: "referralCode 有值",
        visual: "只读链接框 `omenx.io/r/OMX7K2`（44px，#0F1114 底 / #2B2F38 边）+ 右侧 `Copy link`（移动整宽）",
        source: "ReferralPanel link",
      },
      {
        state: "链接加载中",
        when: "isLoading === true（非 fixture）",
        visual: "链接框内显示 `…`，Copy 按钮 disabled",
        source: "ReferralPanel isLoading",
      },
      {
        state: "已复制",
        when: "copy() 成功后 1600ms 内",
        visual: "按钮换 Check 图标 + 文案 `Copied`，到点自动回 `Copy link`",
        source: "ReferralPanel copied（瞬时态，帧内不驻留）",
      },
      {
        state: "复制失败",
        when: "navigator.clipboard 抛错",
        visual: "toast.error `Could not copy the link`",
        source: "ReferralPanel copy catch",
      },
      {
        state: "三步说明",
        when: "恒真",
        visual: "`Step 1 Share your link` / `Step 2 Friend signs up & trades $100` / `Step 3 You get a $5 Trial Position Voucher`（第三行 #CFFF4A）",
        source: "ReferralPanel STEPS",
      },
    ],
  },
  {
    key: "rewards-referral-rows",
    label: "RW-15 · Your invites 行（TaskRowShell · fixture 三态）",
    note: "fixture 三行分别是 pending / qualified / rewarded；空态见 RW-14 帧（同组件 rows.length === 0 分支）。",
    spec: [
      {
        state: "in_progress",
        when: 'r.status === "pending"',
        visual: "UserPlus 图标 + 掩码邮箱 + `Signed up {MMM d}` + 右侧灰字 `In progress`，无奖励数字",
        source: "ReferralPanel inviteRow",
      },
      {
        state: "qualified + Claim",
        when: 'r.status === "qualified" && !claimed.includes(r.id)',
        visual: "UserCheck 图标 + `Qualified {MMM d}` + `$5 voucher`（#CFFF4A）+ 白底 `Claim voucher`",
        source: "ReferralPanel inviteRow · ClaimButton",
      },
      {
        state: "claiming",
        when: "claiming === r.id",
        visual: "按钮 disabled + Loader2 旋转",
        source: "ReferralPanel claiming",
      },
      {
        state: "rewarded / 已领",
        when: 'r.status === "rewarded" || claimed.includes(r.id)',
        visual: "整行 faded，右侧灰字 `Claimed`",
        source: "ReferralPanel isClaimed",
      },
      {
        state: "空态",
        when: "rows.length === 0 && !isLoading",
        visual: "EmptyState（variant module，无边框）标题 `No invites yet`，描述 `Share your link to get started.`",
        source: "ReferralPanel invitesSection",
      },
      {
        state: "加载中",
        when: "isLoading === true",
        visual: "单块 h-[76px] #0F1114 pulse",
        source: "ReferralPanel invitesSection",
      },
      {
        state: "计数行",
        when: "恒真",
        visual: "`Your invites` 右侧 `{qualified} of {total} qualified`（qualified 含 rewarded）",
        source: "ReferralPanel qualified",
      },
    ],
  },
  {
    key: "rewards-referral-panels",
    label: "RW-16 · Referral overview 双版式（ReferralPanel · fixture）",
    note: "同一 fixture 两帧：桌面出 320px rail（order-2 主体 / order-1 rail），移动换成三列统计条置于 invites 之上。端分叉由 ReferralPanel 自身 isMobile 分支解析，preview 不选组件。",
    spec: [
      {
        state: "桌面 rail",
        when: "isMobile === false",
        visual: "`lg:grid-cols-[1fr_320px]` 右栏：`Invited` / `Qualified` / 分隔线上 `Vouchers earned`（#CFFF4A）三行 + 整宽 `Open Position Vouchers →`",
        source: "ReferralPanel 桌面返回体",
      },
      {
        state: "移动统计条",
        when: "isMobile === true",
        visual: "三列格 `Invited` · `Qualified` · `Vouchers`（第三格 #CFFF4A），位于 invite 卡与 invites 列表之间",
        source: "ReferralPanel 移动返回体",
      },
      {
        state: "可领提示",
        when: 'claimable = rows.filter(r => r.status === "qualified" && !claimed).length > 0',
        visual: "`● {n} ready to claim`（12.5px 粗体 #CFFF4A），两端都在统计块内",
        source: "ReferralPanel claimable",
      },
      {
        state: "Vouchers earned 口径",
        when: 'rows.filter(r => r.status === "rewarded" || claimed).length × 5',
        visual: "$ 金额，随本次会话内 claim 立即自增",
        source: "ReferralPanel vouchersEarned · REFERRAL_VOUCHER = 5",
      },
      {
        state: "fine print（Referral 版）",
        when: "恒真",
        visual: "`The fine print` 卡：`Referral rewards are Trial Position Vouchers, issued after your friend completes $100 in trades and passes review. One reward per qualified friend, subject to anti-abuse checks.`",
        source: "ReferralPanel finePrintSection",
      },
    ],
  },
  {
    key: "rewards-signin-prompt",
    label: "RW-17 · 游客门（SignInPromptCard）",
    note: "不新增 key：Vouchers / Referral 两 tab 同门，详情页 rewards 卡也复用同件（只换 cap）。帧内两张分别是 `YOUR REWARDS HERE`（缺省 cap）与 `REFERRAL`。",
    spec: [
      {
        state: "Referral 游客",
        when: '!user && tab === "referral"',
        visual: "cap `REFERRAL`，描述 `Sign in to track progress and claim rewards.` + Log In / Sign Up",
        source: "LiteRewardsPage signedOut 分支",
      },
      {
        state: "Vouchers 游客",
        when: '!user && tab === "vouchers"',
        visual: "cap `VOUCHERS`，描述 `Sign in to view and redeem your vouchers.`",
        source: "LiteRewardsPage signedOut 分支",
      },
      {
        state: "详情页游客",
        when: "!user && 在 /rewards/campaign/:id",
        visual: "cap 缺省 `YOUR REWARDS HERE`，顶替 CampaignRewardsCard",
        source: "LiteCampaignDetailPage rewardsCard",
      },
      {
        state: "登录入口",
        when: "点 Log In 或 Sign Up",
        visual: "桌面开 AuthDialog，移动开 AuthSheet（同一 authOpen 状态）",
        source: "SignInPromptCard isMobile 分支",
      },
    ],
  },
];

/* ---------------- Ⓔ 合规（RW-18） ---------------- */

const COMPLIANCE_CASES: SectionCase[] = [
  {
    key: "rewards-fine-print",
    label: "RW-18 · 合规 fine print（RewardsFinePrint）",
    note: "合规规则：每个出现 USDC 金额的页面有且只有一条完整 fine print；金额旁禁止 inline `not guaranteed`。目前两处挂载：/rewards Campaigns tab（归档条下方）与活动详情页。",
    spec: [
      {
        state: "全句（逐字）",
        when: "恒真",
        visual:
          "`USDC amounts are estimates and not guaranteed. A Trial Position Voucher opens a trial position — the profit is yours, the voucher itself is not withdrawable.`（11.5px / leading-5 / #6B7280）",
        source: "RewardsFinePrint",
      },
      {
        state: "每页唯一",
        when: "页面渲染任一 USDC 金额",
        visual: "该页必须且只能有一条完整 fine print，位置在正文末",
        source: "2026-08-07 合规披露裁定",
      },
      {
        state: "禁 inline",
        when: "金额旁",
        visual: "任何金额旁不得追加 `not guaranteed` 之类的行内声明",
        source: "2026-08-07 合规披露裁定",
      },
      {
        state: "挂载点 · Campaigns tab",
        when: 'tab === "campaigns"',
        visual: "渲染在 EndedCampaignsArchive 之下、移动 PointsRetiredNotice 之上",
        source: "LiteRewardsPage campaigns 分支",
      },
      {
        state: "挂载点 · 详情页",
        when: "在 /rewards/campaign/:id",
        visual: "移动在页尾；桌面在左栏（任务面板 + 规则之下）",
        source: "LiteCampaignDetailPage finePrint",
      },
    ],
  },
];

const ALL_CASES: SectionCase[] = [
  ...SHELL_CASES,
  ...GRID_CASES,
  ...DETAIL_CASES,
  ...REFERRAL_CASES,
  ...COMPLIANCE_CASES,
];

/** RW-7 / RW-10 两端是不同版式 → mobile 帧走 `-mobile` key。 */
const mobileKey = (c: SectionCase): SectionCase => ({ ...c, key: `${c.key}-mobile` });


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
  "怎么读这一节：Ⓐ 区状态由 LiteRewardsPage 的壳字段驱动（tab / searchParams.tab / redeem / isMobile / signedOut）；Ⓑ 区状态由 useCampaignViews 派生的 CampaignView 驱动（phase / entry.kind / claimableCount / signedOut / branding.key_visual_url）；Ⓒ 区由详情页字段驱动（isLoading / view / entry.kind / frozen / grants[].status）；Ⓓ 区由 useReferral 的 referralCode 与 referrals[].status 驱动；Ⓔ 区是合规规则。每个 case 下方的表给出「状态 → 触发条件 → 视觉结果 → 数据来源」，条件都是可判定表达式，可直接照抄进实现。";

/** 并账列账表：旧两节（RewardsSection / RewardsMobileSection）的每条规范文字去了哪里。 */
const LEDGER: { from: string; to: string }[] = [
  { from: "RewardsSection 节描述（奖励双色 / 合规「金额旁禁 inline not guaranteed」）", to: "RW-7 奖励 pill 两行 + RW-18 「禁 inline」行" },
  { from: "1. CampaignCard — four phases + fallback", to: "RW-4 spec 十行（phase 四相 / special / signedOut / claimableCount / 无主视觉 / 画幅 / 移动 meta）" },
  { from: "2. GrantTaskRow — every state", to: "RW-8 spec 十三行（九分支 + CTA 推断表 + 两端列宽）" },
  { from: "3. KOL brand band（桌面实心胶囊 34px / 移动单行 22px 无解释句）", to: "RW-7b spec 两行；hero 内位置写进 RW-7「special hero」行" },
  { from: "4. Ended campaigns archive（96×54 / 72×40）", to: "RW-6 spec「行版式 · 桌面 / 移动」两行" },
  { from: "4b. Ended campaign detail — frozen settled view", to: "页内撤下（`rewards-ended-detail` 走运行时 fetch，违 fixture 确定性）；key 保留 registry。frozen 覆盖由 RW-7「frozen」/ RW-8「frozen」/ RW-10「frozen 隐藏 Still available」三行承接" },
  { from: "5. Points retirement notice（桌面网格上 / 移动卡片下）", to: "RW-3 spec「位置 · 桌面 / 移动」两行" },
  { from: "6. SignInPromptCard", to: "RW-17 spec 四行" },
  { from: "7. Referral — three panels（invite / invites / fine print + 桌面 rail vs 移动三列）", to: "RW-14 / RW-15 / RW-16 三个 case" },
  { from: "8. Compliance fine print（每页唯一，禁 inline）", to: "RW-18 spec「每页唯一」「禁 inline」「两处挂载点」四行" },
  { from: "8b. Campaign rules disclosure（44px 条 / 12.5px·#9AA1AC / 无 details 不渲染）", to: "RW-9 spec 四行" },
  { from: "9. Exclusive link — ineligible redirect", to: "RW-13 spec「被拒」「文案通用」两行 + 新增两条绑定路径行" },
  { from: "RewardsMobileSection「State playground」（`rewards-taskrow-playground`）", to: "页内退场（RW-8 全量板已穷尽同样状态）；key 保留 registry" },
  { from: "RewardsMobileSection「All states at once」（`rewards-taskrow-board`）", to: "并入 RW-8（同一全量板职责）；key 保留 registry" },
  { from: "Rules ①「移动无固定 reward/action 宽度，靠分隔行对齐」", to: "RW-8 spec「列宽 · 移动」" },
  { from: "Rules ②「桌面 reward w-[92px] 右对齐 / action w-[132px] 靠右」", to: "RW-8 spec「列宽 · 桌面」" },
  { from: "Rules ③「动作按钮移动 44px / 桌面 40px 最小触达」", to: "RW-8 spec「not_started + CTA」" },
  { from: "Rules ④「有动作时 CTA 优先，无动作才出状态词」", to: "RW-8 spec「claimable · USDC」「claimed」两行" },
  { from: "Rules ⑤「移动 case 必须跑在 375px iframe」", to: "口径类：属 style-guide 框架总则（SectionFrame 双帧），不入 case 表" },
  { from: "Rules ⑥「当前视口提示」", to: "运行时提示，无规范内容，弃" },
];

const Ledger = () => (
  <div className="space-y-2">
    <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/80">
      并账列账表 · 旧两节 → RW 编号（M3b 删旧节）
    </div>
    <div className="overflow-x-auto rounded-md border border-border/40">
      <table className="w-full min-w-[640px] border-collapse text-left text-[11px]">
        <thead>
          <tr className="bg-muted/20 text-[10px] uppercase tracking-wider text-muted-foreground/70">
            <th className="px-2 py-1.5 font-medium">原文位置</th>
            <th className="px-2 py-1.5 font-medium">去向</th>
          </tr>
        </thead>
        <tbody>
          {LEDGER.map((r) => (
            <tr key={r.from} className="border-t border-border/30 align-top">
              <td className="px-2 py-1.5 text-foreground/90">{r.from}</td>
              <td className="px-2 py-1.5 text-muted-foreground">{r.to}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export const RewardsStatesSection = () => (
  <SectionWrapper
    id="rewards-states"
    title="Rewards · 状态字典（RW-1…RW-18 · Ⓐ–Ⓔ 区）"
    platform="shared"
    description="分区序 = 生产模块序：Ⓐ页面壳 · ⒷCampaigns 网格 · Ⓒ活动详情 · ⒹReferral · Ⓔ合规。每个 case 双帧（desktop 1280 / mobile 375），同一编号两帧各挂各端生产真组件；两端版式不同的（RW-7 hero / RW-10 rewards 卡）走 `-mobile` 分 key，禁运行时 useIsMobile 选组件。fixture 一律确定性注入（相对日期、固定 id、禁运行时 fetch）。表里没有列出的组合视为不存在。"
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

      <SubSection
        title="Ⓒ Campaign 详情（RW-7 … RW-13）"
        description="路由 /rewards/campaign/:id。campaignId === 'h2e' 走 H2eCampaignDetailPage，不在本区。"
      >
        <Pair
          cases={byKey("rewards-campaign-hero")}
          mobileCases={byKey("rewards-campaign-hero").map(mobileKey)}
          desktopMin={760}
          mobileMin={860}
        />
        <div className="mt-6">
          <Pair cases={byKey("rewards-kol-band")} desktopMin={320} mobileMin={360} />
        </div>
        <div className="mt-6">
          <Pair cases={byKey("rewards-grant-rows")} desktopMin={720} mobileMin={1200} />
        </div>
        <div className="mt-6">
          <Pair cases={byKey("rewards-campaign-rules")} desktopMin={420} mobileMin={520} />
        </div>
        <div className="mt-6">
          <Pair
            cases={byKey("rewards-rewards-card")}
            mobileCases={byKey("rewards-rewards-card").map(mobileKey)}
            desktopMin={720}
            mobileMin={1500}
          />
        </div>
        <div className="mt-6">
          <Pair cases={byKey("rewards-detail-loading")} desktopMin={460} mobileMin={460} />
        </div>
        <div className="mt-6">
          <Pair cases={byKey("rewards-detail-unavailable")} desktopMin={160} mobileMin={160} />
        </div>
        <div className="mt-6">
          <Pair cases={byKey("rewards-claim-toast")} desktopMin={260} mobileMin={280} />
        </div>
        <div className="mt-6">
          <Pair cases={byKey("rewards-ineligible-redirect")} desktopMin={240} mobileMin={260} />
        </div>
      </SubSection>

      <SubSection
        title="Ⓓ Referral（RW-14 … RW-17）"
        description="三帧全部走 ReferralPanel 的 fixture prop（纯展示，交互 inert），不取 live hook 数据。"
      >
        <Pair cases={byKey("rewards-referral-invite")} desktopMin={520} mobileMin={620} />
        <div className="mt-6">
          <Pair cases={byKey("rewards-referral-rows")} desktopMin={760} mobileMin={1200} />
        </div>
        <div className="mt-6">
          <Pair cases={byKey("rewards-referral-panels")} desktopMin={760} mobileMin={1200} />
        </div>
        <div className="mt-6">
          <Pair cases={byKey("rewards-signin-prompt")} desktopMin={380} mobileMin={420} />
        </div>
      </SubSection>

      <SubSection title="Ⓔ 合规（RW-18）">
        <Pair cases={byKey("rewards-fine-print")} desktopMin={140} mobileMin={180} />
      </SubSection>

      <Ledger />
    </div>
  </SectionWrapper>
);

