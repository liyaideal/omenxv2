import { LitePage } from "./shell";
import { SubSection, DualDevicePreview } from "../../components";

type P = { isMobile: boolean };

/**
 * /insights — SEO/GEO 数据页（2026-09-28 按 SEO_P2_Insights_Page_Spec + omenx-seo-geo 审稿 R1–R9 重建）。
 * 定位：给搜索引擎与 AI 引擎抓取的「预测市场数据页」，不是发现流。四类 URL：
 *   /insights                    首页：KPI + 5 张平铺榜单 + 涨跌榜 + 分类表 + 今日洞察前 5 + 周报入口
 *   /insights/daily/{YYYY-MM-DD} 日报：当天全部洞察文章（永久 URL）
 *   /insights/weekly/{YYYY-Www}  周报：周量 / 新市场 / 已结算 / Top 5 / 周涨跌
 *   /insights/category/{slug}    分类页：独立 intro 段 + 该类榜单
 * 每个 case 挂生产组件本体 + 冻结 fixture；整页结构在真路由验收（数据非确定）。
 */
export const LiteInsightsPage = (_: P) => (
  <LitePage
    id="lite-insights"
    title="Insights"
    route="/insights · /insights/daily/:date · /insights/weekly/:week · /insights/category/:slug"
    status="done"
    note="SEO/GEO 页：无 tab、无懒加载列表（所有内容首屏进 DOM）；一份内容一个 URL；H1/title 带「prediction market」搜索词；每篇洞察 = 问题 h3 + 带日期答句 + dl + JSON-LD（Dataset / ItemList）+ 可引用句；所有时间 <time datetime>；页尾「How computed」。数据只走聚合 RPC（insights_*），无个人数据。Lovable 是 SPA：真平台需 SSR/预渲染（见 delivery 文档边界）。"
  >
    <SubSection title="IN-1 · 开篇（eyebrow / H1 / lede / as-of）" description="Opening：eyebrow 10px 大写字距 0.1em；H1 display 32/40（375 态 28）；lede 14/22 muted 最多两句；右侧 as-of 用 <time datetime>，UTC。日报 / 周报 / 分类页共用，仅文案不同。" platform="shared">
      <DualDevicePreview previewKey="insights-opening" label="Opening · daily 形态" minHeight={200} />
    </SubSection>

    <SubSection title="IN-2 · KPI 条（KpiStrip）" description="五格：总量 / 未平仓 / 活跃市场 / 24h 量 / 24h 笔数；24h 两格带 vs prior 24h 箭头（trading-green / trading-red）。桌面五列一行，375 态两列网格（第五格独占左列）。数字 24px 等宽。" platform="shared">
      <DualDevicePreview previewKey="insights-kpi" label="KpiStrip" minHeight={200} />
    </SubSection>

    <SubSection title="IN-3 · 市场表（MarketTable）" description="榜单统一形态：# · 市场（名 + 分类 eyebrow）· 概率条 + 「n% probability · 领先项」· 价格 pill（PricePills）· 24h 量 · 笔数 · 7d 折线（仅 Trending / Volume）· 截止 · Trade →。每行是 <article data-market-id>，名字链接到市场。375 态横向滚动卡片（不折叠列）。" platform="shared">
      <DualDevicePreview previewKey="insights-market-table" label="IN-3a · 含 7d 折线" minHeight={420} />
      <DualDevicePreview previewKey="insights-market-table-nospark" label="IN-3b · 无折线（Newest / Closing soon）" minHeight={260} />
    </SubSection>

    <SubSection title="IN-4 · 涨跌榜（MoverList）" description="两张卡并排：▲ Biggest gainers / ▼ Biggest losers；行 = 名 · 领先项 · 分类 + 右侧 from% → to% 与 ±pts。阈值 ≥ 5 pts（MOVE_THRESHOLD），低于阈值视为噪音不入榜；加密 15 分钟轮次（CRYPTO_QUICK*）全站排除。" platform="shared">
      <DualDevicePreview previewKey="insights-movers" label="IN-4a · 有数据" minHeight={260} />
      <DualDevicePreview previewKey="insights-movers-empty" label="IN-4b · 空态（文案各自一句）" minHeight={160} />
    </SubSection>

    <SubSection title="IN-5 · 分类表（CategoryTable）" description="按 24h 量排序：分类 · 市场数 · 24h 量 · 份额条 · 「{Category} insights →」链到 /insights/category/{slug}。slug 取 TOP_CATEGORIES 的 sector 项 + sports。" platform="shared">
      <DualDevicePreview previewKey="insights-category-table" label="CategoryTable" minHeight={300} />
    </SubSection>

    <SubSection title="IN-6 · 洞察文章（InsightArticle）三型" description="type eyebrow（Market insight / Closing soon / New market）+ <time>；h3 = 市场问题本身（链到市场）；首句 = 带日期的答案（As of 28 Sept 2026, the market …）；<dl> 概率 / 24h 量 / 笔数 / 截止；右侧 View market → 与 Share（复制引用句）。数字只用概率 + ¢，不出现 $0.62。compact 形态省略 dl。" platform="shared">
      <DualDevicePreview previewKey="insights-articles" label="IN-6a · 完整（日报形态）" minHeight={560} />
      <DualDevicePreview previewKey="insights-articles-compact" label="IN-6b · compact（首页 B1）" minHeight={360} />
    </SubSection>

    <SubSection title="IN-7 · 页尾 GEO 块" description="How computed：一段说明口径（概率 = 领先项价格；量 = 24h 成交；快照每小时；UTC）+ 品牌句。Cite：虚线框 + 等宽引用句 + Source URL，给 AI 引擎与写手直接复制。" platform="shared">
      <DualDevicePreview previewKey="insights-footer-blocks" label="HowComputed + CiteBlock" minHeight={220} />
    </SubSection>

    <SubSection title="IN-8 · 空态 / 失败态" description="Empty：虚线框居中一句。加载中用 LoadingState skeleton 6 行；RPC 失败显示 load_failed，页面其余 SEO 结构（title / canonical / H1 / lede / How computed）仍在 DOM。" platform="shared">
      <DualDevicePreview previewKey="insights-empty" label="Empty · 两句" minHeight={180} />
    </SubSection>
  </LitePage>
);
