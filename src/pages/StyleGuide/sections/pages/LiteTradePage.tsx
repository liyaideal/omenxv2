import { SubSection, DualDevicePreview } from "../../components";
import { LitePage } from "./shell";
import { LiteSection } from "../LiteSection";
import { LiteSpotSection } from "../LiteSpotSection";
import { TradeStatesSection } from "../TradeStatesSection";
import { AutoCloseTradeCases } from "./AutoCloseTradeCases";

type P = { isMobile: boolean };

/**
 * 交易页 = TR-1…TR-16（M2a，/trade 侧）+ AC-T1…T5（auto-close 归档）。
 * 旧节（LiteSection part="trade" / LiteSpotSection / 结算态节）暂留分隔线下，
 * 待 M2b 并账后删除。
 */
export const LiteTradePage = ({ isMobile }: P) => (
  <LitePage
    id="lite-trade"
    title="交易页（合约 + 现货 + 结算态）"
    route="/trade · /spot"
    status="done"
    note="单一交易页纪律：全站只有 /trade 与 /spot 两个交易页，任何品类都在这两个骨架内做模块增删。"
  >
    <div className="rounded-lg border border-[#CFFF4A]/30 bg-[#CFFF4A]/5 px-3 py-2 text-[12px] text-foreground">
      本页 = 产品页 <code className="font-mono">/trade</code>（合约与多市场）与{" "}
      <code className="font-mono">/spot</code>（现货轮）的状态字典 ·
      样式与布局看生产页，状态与判定看本页
    </div>

    <TradeStatesSection />

    <AutoCloseTradeCases />

    <div className="mt-16 border-t border-dashed border-border pt-6 text-[12px] font-mono uppercase tracking-wider text-muted-foreground">
      ── 以下为旧版节（M2b 并账后删除）──
    </div>

    <LiteSection isMobile={isMobile} part="trade" />
    <LiteSpotSection isMobile={isMobile} />

    <section className="scroll-mt-20">
      <div className="mb-4 border-b border-border pb-2">
        <h2 className="text-xl font-semibold text-foreground">结算态 — settled rows &amp; product line</h2>
      </div>
      <p className="mb-6 max-w-3xl text-sm text-muted-foreground">
        成交结算后的呈现（futures win / spot settled / spot closed，桌面与移动），以及产品线徽标图例与结算后的市场卡/搜索行。
      </p>
      <div className="space-y-10">
        <SubSection title="1. Settled rows — desktop" platform="desktop">
          <div className="space-y-4">
            <DualDevicePreview previewKey="settlement-row-futures-win-desktop" label="Futures — win" minHeight={140} />
            <DualDevicePreview previewKey="settlement-row-spot-settled-desktop" label="Spot — settled" minHeight={140} />
            <DualDevicePreview previewKey="settlement-row-spot-closed-desktop" label="Spot — closed early" minHeight={140} />
          </div>
        </SubSection>
        <SubSection title="2. Settled rows — mobile" platform="mobile">
          <div className="space-y-4">
            <DualDevicePreview previewKey="settlement-row-futures-win-mobile" label="Futures — win" minHeight={160} />
            <DualDevicePreview previewKey="settlement-row-spot-settled-mobile" label="Spot — settled" minHeight={160} />
            <DualDevicePreview previewKey="settlement-row-spot-closed-mobile" label="Spot — closed early" minHeight={160} />
          </div>
        </SubSection>
        <SubSection title="3. Product line badge legend" platform="shared">
          <DualDevicePreview previewKey="product-line-badge-legend" label="Futures / Spot" minHeight={120} />
        </SubSection>
        <SubSection title="4. Resolved market card + market search row (spot)" platform="shared">
          <div className="space-y-4">
            <DualDevicePreview previewKey="resolved-market-card-spot" label="Resolved market card" minHeight={200} />
            <DualDevicePreview previewKey="market-search-row-spot" label="Market search row" minHeight={140} />
          </div>
        </SubSection>
      </div>
    </section>
  </LitePage>
);
