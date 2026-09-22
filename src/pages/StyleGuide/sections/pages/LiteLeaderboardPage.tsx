/**
 * Leaderboard — /leaderboard 的状态字典（2026-09-22 Figma 回流建节）。
 * 20 个编号 / 24 帧，每个 case 都挂生产组件本体 + fixture 注入（Truth Rule §16.1.1），
 * 无手抄 markup。编号 LB-n；`b` = 同一状态的另一端设备。
 *
 * 已合并的编号（方案里单列、实现时并入邻近 case，避免只为一个属性开一帧）：
 * LB-2  头图双端  → 并入 LB-1（整页帧里双端各自加载自己那张）
 * LB-4  时间范围展开 → 并入 LB-3（帧内可真点开）
 * LB-10 CHANGE 三态 → 并入 LB-8 的 spec 行（同一帧内三态齐现）
 * LB-11 分页首页态 → 并入 LB-8（该帧本身即 page 1，`‹` disabled）
 * LB-21 分享卡出图中 → 并入 LB-19 的 spec 行（Save 在 blob 就绪前禁用）
 */
import { LitePage } from "./shell";
import { SubSection } from "../../components";
import { SectionFrame, type SectionCase } from "../../components/SectionFrame";

type P = { isMobile: boolean };

/* ---------------- Ⓐ 整页 ---------------- */

const PAGE_CASES: SectionCase[] = [
  {
    key: "leaderboard-page-guest",
    label: "LB-1 · 整页 · 未登录（真路由）",
    note: "真路由帧。桌面 = EventsDesktopHeader + 全宽舞台（头图 / 筛选行 / 领奖台）+ 表格 + ② Your Ranking + SeoFooter，① 定位器 fixed 右下；375 = MobileHeader B（返回 + Leaderboard + 分享图标）+ 压缩头图 + 筛选 + Overall Ranking + 三甲 + 列表 + ② 卡 + BottomNav，① 贴底导之上。头图为双端两张独立构图的 webp（LB-2 并入本帧）。",
    spec: [
      { state: "版面纵向坐标", when: "viewport ≥ 1280", visual: "头图 0–384 · 筛选行 430–478 · 领奖台占版 526–977 · 地面渐变带 815–1051 · 表格 1041 · ② 1734（以头图顶为 0，与 Figma 绝对坐标一致）", source: "Figma omenx_lite 616:1399 · 生产实测 2026-09-22" },
      { state: "领奖台溢出", when: "恒", visual: "台阶实渲 678（mobile 228.7），版面只占 451（mobile 160），其余向下溢出并被不透明的表格/列表卡盖住——不裁切", source: "Figma 700:29477 父框 h547 · Top3 声明 160/实渲 238" },
      { state: "容器", when: "desktop", visual: "hero 走 §5 已登记的「Leaderboard 营销 hero」豁免全宽；hero 以下收编 Layout Wide `max-w-7xl px-4 lg:px-6`（= 1232 内容宽）", source: "DESIGN §4 Desktop Page Layout · §5 Cards 例外第 4 条" },
      { state: "开场", when: "恒", visual: "字标烘在头图像素里，代码侧补 `sr-only` h1「Leaderboard」保 SEO / 无障碍", source: "DESIGN §Addendum 2026-07-30 Two page families（BROWSE）" },
    ],
  },
];

/* ---------------- Ⓑ 筛选行 ---------------- */

const FILTER_DESKTOP: SectionCase[] = [
  {
    key: "leaderboard-filters",
    label: "LB-3 · 筛选行 · desktop（LeaderboardFilters）",
    note: "帧内可真点：切 tab、展开 7 Days 下拉（LB-4 并入）。",
    spec: [
      { state: "选中 tab", when: "sortType", visual: "分段器 360×48 底 #131519 / padding 4 / r12；tab 112×40；选中底 #33D6FF 字 #1C1F26，未选 #9CA2AB；字体 Space Grotesk Bold 14/20", source: "Figma 700:29480–29486" },
      { state: "时间范围", when: "period", visual: "90×40 底 rgba(28,31,38,.4) 描边 rgba(28,31,38,.3) 字 #9CA2AB + chevron 14；四项 Daily / 7 Days / 30 Days / 180 Days", source: "Figma 700:29488 · Leaderboard.tsx PERIOD_TABS" },
      { state: "Share", when: "恒", visual: "96×40 底 rgba(51,214,255,.2) 描边 rgba(51,214,255,.3) 字 #33D6FF；点击 → 分享弹窗（未登录先拉 Auth）", source: "Figma 700:29492" },
      { state: "切指标 / 切时间范围", when: "onChange", visual: "分页回到第 1 页", source: "Leaderboard.tsx useEffect([sortType, period])" },
    ],
  },
];

const FILTER_MOBILE: SectionCase[] = [
  {
    key: "leaderboard-filters-mobile",
    label: "LB-3b · 筛选行 · mobile",
    spec: [
      { state: "分段器", when: "isMobile", visual: "满宽 358×48，tab 各 111.33×40（等分）", source: "Figma 711:33605" },
      { state: "Time range 行", when: "isMobile", visual: "单起一行：左 12/500 #9CA2AB「Time range」+ 右 84×38 下拉；桌面无此行、移动无 Share 按钮（入口在顶栏与 ② 卡）", source: "Figma 711:33612" },
    ],
  },
];

/* ---------------- Ⓒ 领奖台 ---------------- */

const PODIUM_DESKTOP: SectionCase[] = [
  {
    key: "leaderboard-podium-pnl",
    label: "LB-5 · 三甲 · PNL · desktop（LeaderboardPodium）",
    note: "台阶 / 奖杯 / 皇冠均为 Figma 逐路径取回的矢量件，非 CSS 近似重画。",
    spec: [
      { state: "名次三档", when: "place 1/2/3", visual: "金 #FFD365（辅 #DECFA5，奖杯墨 #5F5434）/ 银 #CDCDCD（辅 #848484，墨 #585858）/ 铜 #B38A48（辅 #6C5227，墨 #6C5227）", source: "Figma 711:33368 / 33328 / 33280 逐节点实测" },
      { state: "台阶错位", when: "恒", visual: "1st 最高；2nd 下沉 48，3rd 下沉 64；三列各 344 宽、间隙 37", source: "Figma 711:33279" },
      { state: "冠军", when: "place === 1", visual: "头像上沿外 30.19 皇冠（描边 #FFD365 + 外发光），其余两档无", source: "Figma 711:33403" },
      { state: "数值", when: "sortType", visual: "Space Grotesk Bold 24/32，色随奖牌档；副标 Archivo 11/16 #9CA2AB「PNL (USD)」", source: "leaderboardKit metricCaption" },
    ],
  },
];

const PODIUM_MOBILE: SectionCase[] = [
  {
    key: "leaderboard-podium-pnl-mobile",
    label: "LB-5b · 三甲 · PNL · mobile",
    spec: [
      { state: "缩比", when: "isMobile", visual: "独立尺寸表（非响应式缩放）：头像 37.86、徽章 16×12.76、用户名 Archivo SemiBold 10、数值 Space Grotesk Bold 12、副标 8；台阶 115×129.35", source: "Figma 711:33621" },
    ],
  },
];

const PODIUM_METRICS: SectionCase[] = [
  {
    key: "leaderboard-podium-roi",
    label: "LB-6 · 三甲 · ROI",
    spec: [{ state: "sortType = roi", when: "点 ROI tab", visual: "数值改两位小数百分比，副标改「ROI」；名次按 ROI 重排", source: "leaderboardKit formatMetric / metricCaption" }],
  },
  {
    key: "leaderboard-podium-volume",
    label: "LB-7 · 三甲 · Volume",
    spec: [{ state: "sortType = volume", when: "点 Volume tab", visual: "数值改整数美元，副标改「Volume (USD)」", source: "leaderboardKit" }],
  },
];

/* ---------------- Ⓓ 表格 / 列表 / 分页 ---------------- */

const TABLE_DESKTOP: SectionCase[] = [
  {
    key: "leaderboard-table",
    label: "LB-8 · 表格 · 常规（含 CHANGE 三态 · 分页首页）",
    note: "同一帧内三种 CHANGE 齐现（涨 / 平 / 跌）；本帧即 page 1，`‹` 为 disabled 态（LB-10 / LB-11 并入）。",
    spec: [
      { state: "列栅格", when: "恒", visual: "RANK 56 / TRADER flex / TRADES 160 / PNL (USD) 200 / CHANGE 160，后三列右对齐；左右内边距 48；表头 51 高、行 56 高、行下描边 1px #23262D", source: "Figma 700:29638" },
      { state: "金额位", when: "恒", visual: "Space Grotesk Bold 14/20 `text-trading-green`（#CFFF4A）——走 MONEY 轴 token，不用稿上的 #D5FF4D", source: "DESIGN §2 Market Axis LOCKED · §Addendum 2026-09-09 色轴优先级" },
      { state: "CHANGE 涨", when: "rankChange > 0", visual: "`↑N ranks` text-trading-green", source: "leaderboardKit rankChangeClass" },
      { state: "CHANGE 平", when: "rankChange === 0", visual: "`—` #9CA2AB", source: "leaderboardKit" },
      { state: "CHANGE 跌", when: "rankChange < 0", visual: "`↓N ranks` text-trading-red（#FF5C5C）", source: "leaderboardKit" },
      { state: "分页首页", when: "page === 1", visual: "`‹` opacity .35 不可点；当前页底 #33D6FF 字 #090A0B；按钮 32×32 r8 gap4", source: "Figma 700:29950" },
    ],
  },
  {
    key: "leaderboard-table-me",
    label: "LB-9 · 表格 · 当前用户行",
    spec: [{ state: "是我", when: "user.username === currentUsername", visual: "**仅**头像描边从 rgba(28,31,38,.4) 换成 rgba(51,214,255,.4)；不做整行底色、不加 YOU 徽章", source: "Figma 700:29657 · CPO 2026-09-22" }],
  },
  {
    key: "leaderboard-table-last",
    label: "LB-12 · 表格 · 末页（不足 10 行）",
    spec: [
      { state: "末页", when: "page === pageCount", visual: "`›` disabled；区间文案 `24–30 of 30`（en dash）", source: "Figma 700:29951" },
      { state: "不补空行", when: "rows.length < 10", visual: "7 行照实渲染，不填占位行，卡高随内容", source: "Leaderboard.tsx restOfList.slice" },
    ],
  },
];

const TABLE_MOBILE: SectionCase[] = [
  {
    key: "leaderboard-list-mobile",
    label: "LB-8b · 列表 · mobile",
    spec: [{ state: "两列", when: "isMobile", visual: "表头 40 高（RANK / TRADER · PNL (USD)）；行 64 高、左右 12、头像 28；右侧两行＝金额 14/700 + 变化 11/400；分页条 64 高、按钮 40×40", source: "Figma 711:33760" }],
  },
  {
    key: "leaderboard-list-mobile-me",
    label: "LB-9b · 列表 · 当前用户行 · mobile",
    spec: [{ state: "是我", when: "同 LB-9", visual: "头像描边 0.778px 转 cyan", source: "Figma 711:33767" }],
  },
];

/* ---------------- Ⓔ ② Your Ranking ---------------- */

const YR_DESKTOP: SectionCase[] = [
  {
    key: "leaderboard-your-ranking",
    label: "LB-13 · ② Your Ranking · 已排名 · desktop",
    note: "恒显件：表格正下方 24px，永远在版面里，不是浮动条（旧 MyRankBar 已删）。",
    spec: [
      { state: "已排名", when: "登录且有名次", visual: "1232×88；底 `linear-gradient(90deg, rgba(1,255,153,.04), rgba(51,214,255,.04))` 叠 .trading-card；左 40 头像（cyan 1.25 描边 + 47.5 光晕）+ 用户名 18/700 + 副行 `My ranking · #13 · 52 trades`；中三格各 196（PNL lime / ROI cyan / Volume 白，均 18/700）；右 216×40 `.btn-primary`「Share Your Link」", source: "Figma 700:29963" },
      { state: "三指标名次", when: "恒", visual: "PNL / ROI / Volume 各按自身指标全量重排后取名次，互不相等属正常", source: "Leaderboard.tsx myRanks" },
    ],
  },
  {
    key: "leaderboard-your-ranking-unranked",
    label: "LB-14 · ② · 已登录未排名",
    spec: [
      { state: "unranked", when: "登录但无名次", visual: "副行 `My ranking · Unranked · 0 trades`；三格标签的名次位用 em dash；数值为真实零值 `$0.00 / 0.00% / $0.00`", source: "Figma 组件注记：Unranked state uses an em dash for rank; never imply a real ranking" },
    ],
  },
  {
    key: "leaderboard-your-ranking-guest",
    label: "LB-15 · ② · 未登录 · desktop",
    spec: [
      { state: "guest", when: "!user", visual: "用户名位改行动号召「Sign in to see your rank」，副行「Ranked by PNL, ROI and volume across all traders.」；三格数值一律 em dash（不显示 $0.00——游客没有真实零值）；按钮「Sign in」", source: "CPO 2026-09-22 文案裁定 · YourRankingBar SIGNED_OUT" },
    ],
  },
];

const YR_MOBILE: SectionCase[] = [
  {
    key: "leaderboard-your-ranking-mobile",
    label: "LB-13b · ② · 已排名 · mobile",
    spec: [{ state: "卡形态", when: "isMobile", visual: "358 卡 p16；标题行「Your Ranking」16/700 + 右 44×44 分享图标钮（底 #1C1F26）；身份行 40 头像；48 高名次条（底 #1C1F26）`PNL rank` / `#13`；底部三格 16/700", source: "Figma 711:33995" }],
  },
  {
    key: "leaderboard-your-ranking-mobile-guest",
    label: "LB-15b · ② · 未登录 · mobile",
    spec: [{ state: "guest", when: "!user", visual: "同 LB-15 文案；名次条值与三格数值均 em dash", source: "YourRankingBar SIGNED_OUT" }],
  },
];

/* ---------------- Ⓕ ① 浮动定位器 ---------------- */

const LOCATOR_DESKTOP: SectionCase[] = [
  {
    key: "leaderboard-locator",
    label: "LB-16 · ① 浮动定位器 · 已排名 · desktop（RankLocator）",
    note: "设计稿里没有这一件，2026-09-22 CPO 拍板新增（「自己在哪个位置很重要」）。字典帧用纯展示 prop `previewStatic` 静态成帧（不传时渲染零变化）。",
    spec: [
      { state: "出现", when: "视口在 Hero → 表格之间，且 ② 未进入视口", visual: "桌面 fixed right 24 / bottom 24，344×56；底 .trading-card + cyan hairline `0 0 0 1px rgba(51,214,255,.18)` + `0 16px 40px rgba(0,0,0,.55)`", source: "Leaderboard.tsx RankLocator · IntersectionObserver(#your-ranking)" },
      { state: "淡出", when: "② 任意部分进入视口", visual: "150ms opacity → 0 + translateY 4px，pointer-events none；反向滚回淡入", source: "RankLocator useHiddenWhenAnchorVisible" },
      { state: "内容", when: "已排名", visual: "32 头像（cyan 描边 + 光晕）+ `#13` 胶囊（底 rgba(51,214,255,.12) 字 #33D6FF）+ 用户名 13/500 + 金额 13/700 lime + 36×36 Jump 方钮（描边 #262A31 / r10，同 DSH 返回钮语法）", source: "DESIGN §10 DSH v1 返回钮定稿 B" },
      { state: "点击", when: "已排名", visual: "翻到我所在的那一页 → 滚到我那行 → 高亮 1.5s", source: "Leaderboard.tsx jumpToMe / highlightRow" },
      { state: "不承载分享", when: "恒", visual: "本件只回答「我第几、我多少」；分享入口全归 ② 与移动顶栏", source: "CPO 2026-09-22 职责划分" },
    ],
  },
  {
    key: "leaderboard-locator-unranked",
    label: "LB-17 · ① · 已登录未排名",
    spec: [{ state: "unranked", when: "登录无名次", visual: "去掉 cyan 光晕与描边；胶囊改 `—`（底 rgba(255,255,255,.06) 字 #9CA2AB）；副行 `Unranked · 0 trades`；点击滚到 ②（我那行不存在）", source: "RankLocator ranked 分支" }],
  },
  {
    key: "leaderboard-locator-guest",
    label: "LB-18 · ① · 未登录",
    spec: [{ state: "guest", when: "!user", visual: "整条变 CTA：左「See where you rank」13/500 + 右 36 高 `.btn-primary`「Sign in」；点击拉 AuthDialog（桌面）/ AuthSheet（移动）", source: "RankLocator !isLoggedIn 分支" }],
  },
];

const LOCATOR_MOBILE: SectionCase[] = [
  {
    key: "leaderboard-locator-mobile",
    label: "LB-16b · ① · 已排名 · mobile",
    spec: [{ state: "贴底导", when: "isMobile", visual: "left/right 16，`bottom: calc(var(--bottom-nav-h, 76px) + 12px)`，永不盖底导", source: "DESIGN §10 Mobile Bottom Nav（--bottom-nav-h: 76px）" }],
  },
];

/* ---------------- Ⓖ 分享弹窗 / 分享卡 ---------------- */

const SHARE_DESKTOP: SectionCase[] = [
  {
    key: "leaderboard-share-modal",
    label: "LB-19 · 分享弹窗 · desktop（ShareRankModal）",
    note: "2026-09-22 CPO 批：删掉旧的 Card Style 四主题与 Show Stats 三开关，按稿的海报来。三个入口（② 的按钮 / 移动顶栏分享图标 / 筛选行 Share）拉的都是本件。",
    spec: [
      { state: "外壳", when: "isShareModalOpen", visual: "384 宽、底 #14161A、描边 #1C1F26、r16、padding 20；标题 18/700 + 副标「Show your leaderboard performance with one tap.」14/400 #9CA2AB；右上 28×28 关闭", source: "Figma 673:22677" },
      { state: "四渠道", when: "恒", visual: "2×2 各 167×46 底 #1C1F26 r12：Save / Copy Link / X / Telegram", source: "Figma 673:22684" },
      { state: "主 CTA", when: "恒", visual: "342×44「More Options」走 `.btn-primary`（#CFFF4A→#33D6FF 渐变黑字）——稿画的纯 cyan 实心按 DESIGN §5「主 CTA 不手搓」改走全站主按钮类（CPO 批）", source: "DESIGN §5 Buttons" },
      { state: "出图中", when: "!imageBlob", visual: "Save 禁用 opacity .5，其余按钮可用；出图走 html-to-image pixelRatio 2 且 `skipFonts: true`（LB-21 并入）", source: "ShareRankModal useEffect" },
      { state: "未登录", when: "!user", visual: "入口先拉 Auth，不开本弹窗", source: "Leaderboard.tsx openShare" },
    ],
  },
];

const SHARE_MOBILE: SectionCase[] = [
  {
    key: "leaderboard-share-drawer",
    label: "LB-19b · 分享 · mobile（MobileDrawer）",
    spec: [{ state: "抽屉", when: "isMobile", visual: "移动端走 MobileDrawer 而非居中弹窗——生产原先那个居中浮层是存量违规，本轮一并收编", source: "DESIGN §5 Overlays [LOCKED] Mobile-zero-Dialog" }],
  },
];

const SHARE_CARD: SectionCase[] = [
  {
    key: "leaderboard-share-card",
    label: "LB-20 · 分享卡本体（RankShareCard）",
    note: "本件受 §Addendum 2026-09-07「Lite 分享海报」LOCKED 约束，逐条落。",
    spec: [
      { state: "卡体", when: "恒", visual: "342×345、r16、描边 rgba(28,31,38,.5)、底 `linear-gradient(154.8deg, #0B111E, #05080F)`；两颗 rgba(51,214,255,.3) blur64 辉光", source: "Figma 673:22717" },
      { state: "艺术底", when: "恒", visual: "leaderboard-rank-art.webp（684×690 @2x）铺满；**压暗层已烘进像素，代码侧不得用 CSS 渐变复刻**", source: "§Addendum 2026-09-07 第 4 条" },
      { state: "字体", when: "恒", visual: "正文 system-ui / -apple-system，数字 'Courier New'。**禁网络字体**——导出 skipFonts:true，Archivo / Space Grotesk 会 fallback 导致预览与出图不一致", source: "§Addendum 2026-09-07 第 3 条" },
      { state: "盈利色", when: "恒", visual: "PnL 用 volt #CFFF4A（= --trading-green），不是稿上的 #D5FF4D", source: "§Addendum 2026-09-07 第 2 条" },
      { state: "字标", when: "恒", visual: "OMENX 一律等比、固定 height 18px；稿给的 118×12.5 是压扁值，与该附录第 6 条③ 记录的是同一缺陷，不按稿落", source: "§Addendum 2026-09-07 第 6 条③" },
      { state: "名次徽章", when: "恒", visual: "`#N` 胶囊走品牌渐变 `linear-gradient(150.75deg, #CFFF4A, #33D6FF)` 黑字全圆", source: "Figma 673:22750" },
    ],
  },
];

export const LiteLeaderboardPage = (_: P) => (
  <LitePage
    id="lite-leaderboard"
    title="Leaderboard"
    route="/leaderboard"
    status="done"
    note="2026-09-22 按 Figma omenx_lite 设计稿（桌面 616:1399 / 移动 673:24088）整页回流：紫色霓虹标题、星点粒子、旧浮动 MyRankBar、页面内嵌 Share Your Rank 整块全部删除；改为 3D 头图 + 分段器 + 三甲领奖台 + 五列表格（移动两列列表）+ 分页 + 恒显 ② Your Ranking，并新增稿中没有的 ① 浮动定位器（CPO 拍板）。金额位统一走 MONEY 轴 token #CFFF4A——设计稿的 #D5FF4D 不是 token。"
  >
    <SubSection title="Ⓐ 整页" description="真路由帧。头图为已登记的营销 hero 豁免（全宽），hero 以下收编 Layout Wide 容器。">
      <SectionFrame cases={PAGE_CASES} device="desktop" minHeight={900} />
      <SectionFrame cases={PAGE_CASES} device="mobile" minHeight={900} />
    </SubSection>

    <SubSection title="Ⓑ 筛选行" description="指标分段器 + 时间范围；桌面另带 Share 按钮，移动把时间范围单起一行。">
      <SectionFrame cases={FILTER_DESKTOP} device="desktop" minHeight={160} />
      <SectionFrame cases={FILTER_MOBILE} device="mobile" minHeight={200} />
    </SubSection>

    <SubSection title="Ⓒ 三甲领奖台" description="台阶 / 奖杯 / 皇冠为 Figma 逐路径矢量件；双端两套尺寸表，非响应式缩放。">
      <SectionFrame cases={PODIUM_DESKTOP} device="desktop" minHeight={700} />
      <SectionFrame cases={PODIUM_MOBILE} device="mobile" minHeight={300} />
      <SectionFrame cases={PODIUM_METRICS} device="desktop" minHeight={700} />
    </SubSection>

    <SubSection title="Ⓓ 榜单表格 / 列表 / 分页" description="桌面五列真表格与移动两列列表是两套实现，不是一个组件塞两个宽度。">
      <SectionFrame cases={TABLE_DESKTOP} device="desktop" minHeight={700} />
      <SectionFrame cases={TABLE_MOBILE} device="mobile" minHeight={760} />
    </SubSection>

    <SubSection title="Ⓔ ② Your Ranking" description="恒显三态：已排名 / 已登录未排名 / 未登录。">
      <SectionFrame cases={YR_DESKTOP} device="desktop" minHeight={160} />
      <SectionFrame cases={YR_MOBILE} device="mobile" minHeight={320} />
    </SubSection>

    <SubSection title="Ⓕ ① 浮动定位器" description="稿中没有、CPO 新增。只回答「我第几、我多少」，不承载分享；② 进入视口即淡出。">
      <SectionFrame cases={LOCATOR_DESKTOP} device="desktop" minHeight={140} />
      <SectionFrame cases={LOCATOR_MOBILE} device="mobile" minHeight={140} />
    </SubSection>

    <SubSection title="Ⓖ 分享弹窗与分享卡" description="唯一晒单面。桌面居中浮层 / 移动 MobileDrawer；卡体受分享海报 LOCKED 规范约束。">
      <SectionFrame cases={SHARE_DESKTOP} device="desktop" minHeight={720} />
      <SectionFrame cases={SHARE_MOBILE} device="mobile" minHeight={800} />
      <SectionFrame cases={SHARE_CARD} device="desktop" minHeight={420} />
    </SubSection>
  </LitePage>
);
