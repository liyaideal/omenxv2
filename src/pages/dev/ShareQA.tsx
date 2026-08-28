// Temporary QA harness for SH-a acceptance (LitePnlPoster 6 states + ShareModal chrome).
import { useState } from "react";
import { LitePnlPoster } from "@/components/lite/share/LitePnlPoster";
import { ShareModal } from "@/components/ShareModal";
import { SharePosterDialog } from "@/components/deposit/SharePosterDialog";
import { SUPPORTED_TOKENS } from "@/types/deposit";

const cases = [
  { key: "live-win", state: "live" as const, pnl: 13.89, pnlPercent: 28.7, left: 48.41, right: 62.3 },
  { key: "live-lose", state: "live" as const, pnl: -18.2, pnlPercent: -45.5, left: 40.0, right: 21.8 },
  { key: "cashed-win", state: "cashed" as const, pnl: 13.89, pnlPercent: 28.7, left: 48.41, right: 62.3 },
  { key: "cashed-lose", state: "cashed" as const, pnl: -18.2, pnlPercent: -45.5, left: 40.0, right: 21.8 },
  { key: "settled-win", state: "settled" as const, pnl: 48.41, pnlPercent: 100.0, left: 48.41, right: 96.82 },
  { key: "settled-lose", state: "settled" as const, pnl: -40.0, pnlPercent: -100.0, left: 40.0, right: 0.0 },
];

export default function ShareQA() {
  const [modal, setModal] = useState(false);
  const [pro, setPro] = useState(false);
  return (
    <div style={{ background: "#0a0c14", padding: 24, display: "flex", flexWrap: "wrap", gap: 24 }}>
      <button data-qa="open-modal" onClick={() => setModal(true)} style={{ color: "#fff" }}>
        open modal
      </button>
      <button data-qa="open-pro" onClick={() => setPro(true)} style={{ color: "#fff" }}>
        open pro
      </button>
      {cases.map((c) => (
        <div key={c.key} data-qa={c.key}>
          <LitePnlPoster
            state={c.state}
            eventName="Will BTC close above $70,000 on Aug 28?"
            sideLine="Yes · 5× Boost"
            pnl={c.pnl}
            pnlPercent={c.pnlPercent}
            leftAmount={c.left}
            rightAmount={c.right}
            dateISO="2026-08-28T12:00:00Z"
            username="alex_carter"
            referralCode="ALEX01"
          />
        </div>
      ))}

      <ShareModal
        isOpen={modal}
        onClose={() => setModal(false)}
        title="Share Your Win 🏆"
        subtitle="Show off your trading success"
        shareText="I just won +28.7% on OMENX! 🚀"
        shareUrl="https://omenxv2.lovable.app"
        fileName="omenx-share"
      >
        <LitePnlPoster
          state="cashed"
          eventName="Will BTC close above $70,000 on Aug 28?"
          sideLine="Yes · 5× Boost"
          pnl={13.89}
          pnlPercent={28.7}
          leftAmount={48.41}
          rightAmount={62.3}
          dateISO="2026-08-28T12:00:00Z"
          username="alex_carter"
          referralCode="ALEX01"
        />
      </ShareModal>

      <SharePosterDialog
        open={pro}
        onOpenChange={setPro}
        address="0x1234567890abcdef1234567890abcdef12345678"
        token={SUPPORTED_TOKENS[0]}
      />
    </div>
  );
}
