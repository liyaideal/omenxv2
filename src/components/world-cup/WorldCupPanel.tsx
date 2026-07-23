import { useEffect, useState } from "react";
import { X, ArrowRight, Trophy, MapPin } from "lucide-react";
import {
  SPORTS_LINK,
  isWorldCupActive,
  isPanelDismissed,
  dismissPanel,
} from "@/lib/worldCup";
import {
  featuredMatches as defaultMatches,
  type FeaturedMatch,
  type LiveMatch,
  type UpcomingMatch,
} from "./WorldCupPanel.data";
import trophyAsset from "@/assets/trophy-silhouette.png.asset.json";

interface WorldCupPanelProps {
  /** Override active check (for playground/demo only) */
  forceShow?: boolean;
  /** Override match data (for playground/demo only) */
  matches?: FeaturedMatch[];
  /** Disable dismiss persistence (for playground/demo only) */
  ephemeral?: boolean;
  /** Position override; defaults to mobile-safe bottom-right */
  className?: string;
}

/** Section divider: hairline — accent label — hairline */
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="relative px-4 pt-3 pb-2 flex items-center justify-center gap-2">
    <span className="h-px flex-1 bg-[#243528]" />
    <span
      className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#C9A227]"
      style={{ fontFamily: "'Bebas Neue', sans-serif" }}
    >
      {children}
    </span>
    <span className="h-px flex-1 bg-[#243528]" />
  </div>
);

export const WorldCupPanel = ({
  forceShow = false,
  matches = defaultMatches,
  ephemeral = false,
  className,
}: WorldCupPanelProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (forceShow) {
      setVisible(true);
      return;
    }
    if (!isWorldCupActive()) return;
    if (isPanelDismissed()) return;
    setVisible(true);
  }, [forceShow]);

  if (!visible) return null;

  const handleDismiss = () => {
    setVisible(false);
    if (!ephemeral) dismissPanel();
  };

  const handleOpen = () => {
    window.open(SPORTS_LINK, "_blank", "noopener,noreferrer");
  };

  const live = matches.find((m): m is LiveMatch => m.kind === "live");
  const upcoming = matches.filter(
    (m): m is UpcomingMatch => m.kind === "upcoming"
  );

  return (
    <div
      className={
        className ??
        "fixed z-40 right-4 bottom-24 md:right-6 md:bottom-6 animate-fade-in"
      }
      style={{ maxWidth: "calc(100vw - 2rem)" }}
    >
      <style>{`
        @keyframes wcl-shimmer {
          0%   { transform: translateX(-150%); }
          40%  { transform: translateX(250%); }
          100% { transform: translateX(250%); }
        }
        .wcl-shimmer-overlay {
          position: absolute;
          top: -50%;
          left: 0;
          width: 60%;
          height: 200%;
          background: linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.55) 50%, transparent 70%);
          mix-blend-mode: overlay;
          pointer-events: none;
          animation: wcl-shimmer 3.5s ease-in-out infinite;
          will-change: transform;
        }
        @keyframes wcl-trophy-glow {
          0%, 100% { opacity: 0.22; }
          50%      { opacity: 0.30; }
        }
        .wcl-trophy { animation: wcl-trophy-glow 5s ease-in-out infinite; }
      `}</style>

      <div className="relative w-[340px] max-w-full rounded-2xl shadow-[0_0_40px_rgba(250,204,21,0.2)]">
        <div className="relative bg-[#0B1410] rounded-2xl overflow-hidden border-[1.5px] border-[#2A3B2E]">
          {/* Tri-color host stripe */}
          <div aria-hidden className="flex h-[5px] relative z-10">
            <div className="flex-1" style={{ background: "#C8102E" }} />
            <div className="flex-1" style={{ background: "#007A33" }} />
            <div className="flex-1" style={{ background: "#0033A0" }} />
          </div>

          {/* Stadium beam backdrop */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              background:
                "radial-gradient(120% 60% at 50% -20%, rgba(250,204,21,0.35), transparent 60%), radial-gradient(80% 60% at 50% 120%, rgba(34,197,94,0.25), transparent 60%)",
            }}
          />

          {/* Trophy glow halo (behind trophy, top-right) */}
          <div
            aria-hidden
            className="pointer-events-none absolute"
            style={{
              right: "-15%",
              top: "-15%",
              width: "55%",
              height: "55%",
              background:
                "radial-gradient(circle at center, rgba(250,204,21,0.35), transparent 60%)",
              filter: "blur(20px)",
            }}
          />

          {/* Trophy silhouette */}
          <img
            src={trophyAsset.url}
            alt=""
            aria-hidden
            width={420}
            height={420}
            loading="lazy"
            className="wcl-trophy pointer-events-none absolute select-none"
            style={{
              right: "-8%",
              top: "-6%",
              width: "42%",
              maxWidth: "180px",
              transform: "rotate(8deg)",
              mixBlendMode: "screen",
              opacity: 0.55,
              filter: "drop-shadow(0 0 18px rgba(250,204,21,0.35))",
            }}
            draggable={false}
          />

          {/* Header */}
          <div className="relative flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#1A2B1F] border border-[#C9A227] flex items-center justify-center shrink-0">
                <Trophy className="w-[18px] h-[18px] text-[#E8C547] drop-shadow-[0_0_6px_rgba(232,197,71,0.6)]" />
              </div>
              <div className="flex flex-col leading-tight">
                <h2
                  className="text-lg tracking-[0.12em] bg-gradient-to-b from-yellow-200 to-yellow-500 bg-clip-text text-transparent"
                  style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                >
                  WORLD CUP 2026
                </h2>
                <span className="text-[10px] tracking-[0.2em] text-[#7FA088] uppercase">
                  United · Mexico · Canada
                </span>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-[#5F7A66] hover:text-white transition-colors"
              aria-label="Dismiss World Cup panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Live hero */}
          {live && (
            <>
              <SectionLabel>Live Now</SectionLabel>
              <button
                onClick={handleOpen}
                className="relative w-full px-4 pb-4 text-left hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2 py-0.5 bg-[#C8102E] text-white text-[10px] font-bold rounded animate-pulse shadow-[0_0_10px_rgba(200,16,46,0.5)] tracking-[0.15em] uppercase">
                    LIVE
                  </span>
                  <span className="font-mono text-[#C9A227] text-xs font-bold uppercase tracking-wider">
                    {live.minute} MINUTES
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col items-center flex-1 min-w-0">
                    <div className="relative w-11 h-7 rounded-[3px] border border-white/20 mb-1.5 overflow-hidden">
                      <div
                        className="w-full h-full"
                        style={{ background: live.homeFlag.primary }}
                      />
                      <span className="wcl-shimmer-overlay" style={{ animationDelay: "0s" }} />
                    </div>
                    <span
                      className="text-sm text-white uppercase tracking-wide text-center truncate w-full"
                      style={{ fontFamily: "'Anton', sans-serif" }}
                    >
                      {live.home}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className="text-4xl text-white"
                      style={{ fontFamily: "'Anton', sans-serif" }}
                    >
                      {live.scoreHome}
                    </span>
                    <span className="text-[#C9A227] font-black">:</span>
                    <span
                      className="text-4xl text-white"
                      style={{ fontFamily: "'Anton', sans-serif" }}
                    >
                      {live.scoreAway}
                    </span>
                  </div>

                  <div className="flex flex-col items-center flex-1 min-w-0">
                    <div className="relative w-11 h-7 rounded-[3px] border border-white/20 mb-1.5 overflow-hidden">
                      <div
                        className="w-full h-full"
                        style={{ background: live.awayFlag.primary }}
                      />
                      <span className="wcl-shimmer-overlay" style={{ animationDelay: "1.4s" }} />
                    </div>
                    <span
                      className="text-sm text-white uppercase tracking-wide text-center truncate w-full"
                      style={{ fontFamily: "'Anton', sans-serif" }}
                    >
                      {live.away}
                    </span>
                  </div>
                </div>
              </button>
            </>
          )}

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <>
              <SectionLabel>Coming Up Next</SectionLabel>
              <div className="relative px-2 pb-1">
                {upcoming.map((m, i) => (
                  <button
                    key={`${m.homeShort}-${m.awayShort}-${i}`}
                    onClick={handleOpen}
                    className="w-full px-2 py-2 rounded-lg hover:bg-white/[0.03] transition-colors flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex -space-x-1 shrink-0">
                        <div className="relative w-7 h-4 rounded-[2px] border border-white/15 overflow-hidden">
                          <div className="w-full h-full" style={{ background: m.homeFlag.primary }} />
                        </div>
                        <div className="relative w-7 h-4 rounded-[2px] border border-white/15 overflow-hidden">
                          <div className="w-full h-full" style={{ background: m.awayFlag.primary }} />
                        </div>
                      </div>
                      <div
                        className="text-sm text-white uppercase tracking-wide truncate"
                        style={{ fontFamily: "'Anton', sans-serif" }}
                      >
                        {m.homeShort}{" "}
                        <span className="text-[#5F7A66] mx-1 text-xs">v</span>{" "}
                        {m.awayShort}
                      </div>
                    </div>
                    <span className="font-mono text-[10px] text-[#7FA088] bg-[#13231A] border border-[#2C4434] px-1.5 py-0.5 rounded">
                      {m.time}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* CTA */}
          <div className="relative px-4 pt-3 pb-3">
            <button
              onClick={handleOpen}
              className="w-full rounded-xl py-3 flex items-center justify-center gap-2 transition-transform active:scale-[0.98] shadow-[0_10px_24px_-10px_rgba(232,197,71,0.6)]"
              style={{ background: "#E8C547" }}
            >
              <span
                className="text-lg tracking-[0.2em] text-[#3A2E08]"
                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
              >
                OPEN OMENX SPORTS
              </span>
              <ArrowRight className="w-4 h-4 text-[#3A2E08]" />
            </button>
          </div>

          {/* Live status footer */}
          <div className="relative flex items-center justify-center gap-2 px-4 pb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1D9E75] animate-pulse" />
            <span className="text-[10px] tracking-[0.18em] text-[#7FA088] uppercase">
              Tournament in progress
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorldCupPanel;
