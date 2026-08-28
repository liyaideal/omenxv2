// ============================================================
// 晒单分享字典 previews — SH-1 … SH-8（SH-b §4）。
// 铁律：只挂生产组件，数据一律 fixture 确定性注入（禁运行时 fetch）。
// 海报出图口径固定 400px，双帧同卡。
// ============================================================
import { ShareModal } from "@/components/ShareModal";
import { LitePnlPoster, type LitePnlPosterState } from "@/components/lite/share/LitePnlPoster";
import { LitePositionCard } from "@/components/lite/contract/LitePositionCard";

/* ------------------------------ fixtures ------------------------------ */

const FROZEN_DATE = "2026-08-28T12:00:00.000Z";

const WIN = {
  eventName: "Will NVIDIA close above $4T market cap this quarter?",
  sideLine: "Yes · 5× Boost",
  pnl: 62.4,
  pnlPercent: 128.9,
  leftAmount: 48.41,
  rightAmount: 110.81,
};

const LOSE = {
  eventName: "Will NVIDIA close above $4T market cap this quarter?",
  sideLine: "No · 3× Boost",
  pnl: -31.2,
  pnlPercent: -64.4,
  leftAmount: 48.41,
  rightAmount: 17.21,
};

const Poster = (state: LitePnlPosterState, f: typeof WIN, over?: Partial<typeof WIN>) => (
  <div className="flex justify-center bg-background p-4">
    <LitePnlPoster
      state={state}
      {...f}
      {...over}
      dateISO={FROZEN_DATE}
      username="alex_carter"
      referralCode="ALEX01"
    />
  </div>
);

/* ------------------------------ SH-1..6 ------------------------------- */

export const Sh1Preview = () => Poster("live", WIN);
export const Sh2Preview = () => Poster("live", LOSE);
export const Sh3Preview = () => Poster("cashed", WIN);
export const Sh4Preview = () => Poster("cashed", LOSE);
export const Sh5Preview = () => Poster("settled", WIN);
export const Sh6Preview = () =>
  Poster("settled", LOSE, { pnl: -48.41, pnlPercent: -100, rightAmount: 0 });

/* -------------------------------- SH-7 -------------------------------- */

export const Sh7Preview = () => (
  <div className="min-h-[860px] bg-background">
    <ShareModal
      isOpen
      onClose={() => {}}
      title="Share Your Win 🏆"
      subtitle="Show off your trading success"
      shareText="I just won +128.9% on OMENX! 🚀"
      shareUrl="https://omenxv2.lovable.app/trade?event=nvda-4t"
      fileName="omenx-share"
      isDataReady={false}
    >
      <LitePnlPoster
        state="cashed"
        {...WIN}
        dateISO={FROZEN_DATE}
        username="alex_carter"
        referralCode="ALEX01"
      />
    </ShareModal>
  </div>
);

/* -------------------------------- SH-8 -------------------------------- */

const POS = {
  sideLabel: "Yes",
  isYes: true,
  boost: 5,
  putIn: 48.41,
  nowWorth: 110.81,
  profit: 62.4,
  autoCloseText: "≈ 62¢",
};

export const Sh8Preview = () => (
  <div className="space-y-4 bg-background p-4">
    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
      带 onShare（入口态）
    </div>
    <LitePositionCard {...POS} onCashOut={() => {}} onShare={() => {}} />
    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
      不传 onShare（生产默认 · 零变化）
    </div>
    <LitePositionCard {...POS} onCashOut={() => {}} />
  </div>
);
