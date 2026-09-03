import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DesktopSubpageHeaderProps {
  /** Page name — Archivo 17px/600, sentence case. */
  title: string;
  /** Back affordance (定稿 B — 描边方钮). */
  onBack?: () => void;
  /** Right slot — at most one primary action. May be empty. */
  children?: ReactNode;
  className?: string;
}

/**
 * Desktop Subpage Header (DSH v1) — DESIGN.md §10.
 *
 * Desktop-only. Mount on deep pages whose parent is NOT in the desktop top nav
 * (e.g. /wallet/recovery and /wallet/recovery/:id). No subtitle slot —
 * explanatory copy belongs in the opening card.
 */
export const DesktopSubpageHeader = ({
  title,
  onBack,
  children,
  className,
}: DesktopSubpageHeaderProps) => (
  <div
    className={cn(
      "h-14 border-b border-[#1D2026] flex items-center gap-[10px]",
      className,
    )}
  >
    <button
      type="button"
      aria-label="Back"
      onClick={onBack}
      className="group h-9 w-9 shrink-0 inline-flex items-center justify-center rounded-[10px] border border-[#262A31] transition-colors hover:border-[#2E333B]"
    >
      <ArrowLeft className="w-[18px] h-[18px] text-[#A8AEB6] transition-colors group-hover:text-[#E8EAED]" />
    </button>
    <h1 className="font-sans text-[17px] font-semibold text-foreground truncate">
      {title}
    </h1>
    <div className="flex-1" />
    {children}
  </div>
);

export default DesktopSubpageHeader;
