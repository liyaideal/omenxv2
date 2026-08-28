import { LitePage } from "./shell";
import { TradeStatesSection } from "../TradeStatesSection";
import { SpotStatesSection } from "../SpotStatesSection";
import { AutoCloseTradeCases } from "./AutoCloseTradeCases";
import { ShareCases } from "./ShareCases";

type P = { isMobile: boolean };

/**
 * 交易页 = TR-1…TR-24（/trade 合约与多市场）+ SP-1…SP-16（/spot 现货轮）
 * + AC-T1…T5（auto-close 归档）。
 * M2c 已把旧三节（LiteSection part="trade" / LiteSpotSection / 结算态 DDP×7）
 * 逐条并账后删除挂载，并账全文见现货节「⑥ 并账清单」。
 */
export const LiteTradePage = (_props: P) => (
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

    <SpotStatesSection />

    <AutoCloseTradeCases />

    <ShareCases />
  </LitePage>
);
