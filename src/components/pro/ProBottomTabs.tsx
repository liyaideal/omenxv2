// ============================================================
// Pro terminal bottom strip (SP-1 · B1) — Positions | Orders tabs plus the
// canonical LiteAuthGate (panel variant). Shared by /trade and /spot so the
// underline treatment, counts and gate copy stay in one place.
// ============================================================
import { ReactNode } from "react";
import { LiteAuthGate } from "@/components/auth/LiteAuthGate";

export interface ProBottomTab {
  key: string;
  label: string;
  count: number;
}

interface ProBottomTabsProps {
  tabs: ProBottomTab[];
  active: string;
  onChange: (key: string) => void;
  authTitle: string;
  authDescription: string;
  /** Scroll container classes — futures locks 460px, spot 360px. */
  bodyClassName?: string;
  /** style-guide only — skip the sign-in gate so a skeleton frame stays legible. */
  previewNoAuthGate?: boolean;
  /** style-guide only — force the signed-out panel gate so a reviewer can see it. */
  previewForceSignedOut?: boolean;
  /** Body of the active tab (the caller switches on `active`). */
  children: ReactNode;
}

export const ProBottomTabs = ({
  tabs,
  active,
  onChange,
  authTitle,
  authDescription,
  bodyClassName = "max-h-[460px] overflow-y-auto overscroll-contain",
  previewNoAuthGate,
  previewForceSignedOut,
  children,
}: ProBottomTabsProps) => (
  <div className="border-t border-border/30 flex-shrink-0">
    <div className="flex items-center gap-1 px-4 border-b border-border/30 relative z-20">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`px-4 py-2 text-sm font-medium transition-all whitespace-nowrap ${
            active === t.key
              ? "text-trading-purple border-b-2 border-trading-purple"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t.label}
          <span className="ml-1 text-muted-foreground">({t.count})</span>
        </button>
      ))}
    </div>

    {previewNoAuthGate ? (
      <div className={bodyClassName}>{children}</div>
    ) : (
      <LiteAuthGate variant="panel" title={authTitle} description={authDescription} forceSignedOut={previewForceSignedOut}>
        <div className={bodyClassName}>{children}</div>
      </LiteAuthGate>
    )}
  </div>
);
