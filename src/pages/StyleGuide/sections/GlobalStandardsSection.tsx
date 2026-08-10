// ============================================================
// 全站规范 — 文字规范层。权威定义在 docs/design-contracts/master-components.html §12。
// ============================================================
import { SectionWrapper, SubSection } from "../components/SectionWrapper";

const Row = ({ k, v }: { k: string; v: string }) => (
  <tr className="border-t border-border">
    <td className="w-[220px] px-4 py-2 text-foreground">{k}</td>
    <td className="px-4 py-2 text-muted-foreground">{v}</td>
  </tr>
);

export const GlobalStandardsSection = (_: { isMobile: boolean }) => (
  <SectionWrapper
    id="global-standards"
    title="全站规范"
    platform="shared"
    description="开场体系 v2 · 两级 tab / chips · chip 法则 · 44px 触控。权威条文见 bible §12（docs/design-contracts/master-components.html）。"
  >
    <div className="space-y-10">
      <SubSection
        title="1. 开场体系 v2 — 三选一"
        description="实体名才配标题；栏目页一律无 h1。PageTitle / PageHeader 已退役（见 Archive 区）。"
      >
        <div className="overflow-hidden rounded-xl border border-border text-sm">
          <table className="w-full">
            <tbody>
              <Row k="A · 实体开场" v="页面讲的是一个具名对象，实体名即标题：交易页事件题干、campaign 名。" />
              <Row k="B · 数据开场" v="页面用自己的 hero/数据模块开场，不带标题：Wallet equity 卡、Portfolio tabs + stats、Vouchers earnings、Settings profile、API tier 答案。" />
              <Row k="C · 控件开场" v="页面用控件开场：Events / Resolved（状态 tab + 筛选 chips）、Rewards（Campaigns / Referral tab）、Transparency。" />
              <Row k="豁免" v="Leaderboard 霓虹 hero；SeoPageLayout 下的 SEO 页。" />
            </tbody>
          </table>
        </div>
      </SubSection>

      <SubSection title="2. Tab vs chips — “能不能有 All”判据">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border p-4">
            <div className="mb-2 text-sm font-medium text-foreground">Tab（不能有 All）</div>
            <p className="mb-4 text-xs text-muted-foreground">
              同一页面的互斥状态，2–4 个，不横滚，下划线式。
            </p>
            <div className="mb-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              开场级分区 tab · 控件开场页顶部
            </div>
            <div className="flex items-end gap-9 border-b border-[#1D2026]">
              <div className="relative pb-3">
                <span className="font-display text-[24px] font-bold leading-[30px] tracking-[-0.01em] text-[#F2F3F5]">
                  Campaigns
                </span>
                <span className="absolute -bottom-[1.25px] left-0 h-[2.5px] w-full rounded-full bg-[#F2F3F5]" />
              </div>
              <div className="pb-3">
                <span className="font-display text-[24px] font-medium leading-[30px] tracking-[-0.01em] text-[#6B7280]">
                  Referral
                </span>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              桌面 24px/30px、移动 19px/26px；min-height 56/48px；gap 36/28px；items-end 压在 1px #1D2026 分隔线上。
              栏目页无 h1 后，开场 tab 承担页面字号锚点。
            </p>
            <div className="mt-5 mb-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              局部 tab · 面板内嵌套（备用规格）
            </div>
            <div className="flex items-end gap-6 border-b border-[#1D2026]">
              <div className="relative pb-2">
                <span className="text-[13.5px] font-semibold text-[#F2F3F5]">Open</span>
                <span className="absolute -bottom-[1px] left-0 h-[2px] w-full bg-white" />
              </div>
              <span className="pb-2 text-[13.5px] text-[#9AA1AC]">History</span>
            </div>
          </div>

          <div className="rounded-xl border border-border p-4">
            <div className="mb-2 text-sm font-medium text-foreground">Chips（能有 All）</div>
            <p className="mb-4 text-xs text-muted-foreground">
              过滤一个列表（品类、板块）：胶囊，可横滚，首项 All。
            </p>
            <div className="flex gap-2 overflow-x-auto">
              {["All", "Crypto", "Macro", "Sports", "Finance"].map((c, i) => (
                <span
                  key={c}
                  className={
                    i === 0
                      ? "shrink-0 rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background"
                      : "shrink-0 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground"
                  }
                >
                  {c}
                </span>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              同一行不得混形。一页两者都要时：tab 在上，chips 在下。
            </p>
          </div>
        </div>
      </SubSection>

      <SubSection
        title="3. Chip 法则"
        description="chip 是无底色的中性标签（label-chip：muted 文字，无填充）。唯一豁免是 SideButton 这类选择控件——它是方向控件，可带方向色底（Pulse Blue #33D6FF / Volt #CFFF4A）。不得为了强调给普通 chip 上底色。"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md px-2 py-0.5 text-[11px] text-muted-foreground">Desktop · right rail</span>
          <span className="rounded-md px-2 py-0.5 text-[11px] text-muted-foreground">Mobile · bottom drawer</span>
          <span className="rounded-md px-2 py-0.5 text-[11px] text-muted-foreground">Desktop &amp; Mobile · same component</span>
        </div>
      </SubSection>

      <SubSection
        title="4. 44px 触控"
        description="移动端所有可点元素的命中区 ≥44×44px。视觉尺寸可以更小（例如 26px 的 RoundTape chip、p-0.5 的转账按钮），用透明内边距 / 负 margin 把命中区撑到 44px，不得放大视觉。"
      >
        <div className="flex items-center gap-6 rounded-xl border border-border p-4">
          <div className="relative flex h-11 w-11 items-center justify-center">
            <span className="h-[26px] w-[26px] rounded-[7px] border border-[#33D6FF] bg-[rgba(51,214,255,.13)]" />
            <span className="pointer-events-none absolute inset-0 rounded-lg border border-dashed border-border" />
          </div>
          <p className="text-xs text-muted-foreground">
            实线 = 26px 视觉，虚线 = 44px 命中区。
          </p>
        </div>
      </SubSection>
    </div>
  </SectionWrapper>
);
