// Temporary QA harness for SH-a acceptance (LitePnlPoster 6 states).
import { LitePnlPoster } from "@/components/lite/share/LitePnlPoster";

const cases = [
  { key: "live-win", state: "live" as const, pnl: 13.89, pnlPercent: 28.7, left: 48.41, right: 62.3 },
  { key: "live-lose", state: "live" as const, pnl: -18.2, pnlPercent: -45.5, left: 40.0, right: 21.8 },
  { key: "cashed-win", state: "cashed" as const, pnl: 13.89, pnlPercent: 28.7, left: 48.41, right: 62.3 },
  { key: "cashed-lose", state: "cashed" as const, pnl: -18.2, pnlPercent: -45.5, left: 40.0, right: 21.8 },
  { key: "settled-win", state: "settled" as const, pnl: 48.41, pnlPercent: 100.0, left: 48.41, right: 96.82 },
  { key: "settled-lose", state: "settled" as const, pnl: -40.0, pnlPercent: -100.0, left: 40.0, right: 0.0 },
];

export default function ShareQA() {
  return (
    <div style={{ background: "#0a0c14", padding: 24, display: "flex", flexWrap: "wrap", gap: 24 }}>
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
    </div>
  );
}
