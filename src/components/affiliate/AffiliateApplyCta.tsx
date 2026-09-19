import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AffiliateCta } from "./useAffiliateCta";

const ext = { target: "_blank", rel: "noopener noreferrer" } as const;

/**
 * The Apply CTA as a primary button. Behaviour comes from `useAffiliateCta()`:
 * member state renders a real <a> to the form, other states a <button>.
 * Visual: Figma primary — solid cyan, glow, ArrowRight (mobile hero uses ArrowUpRight).
 */
export const AffiliateApplyButton = ({
  cta,
  label,
  className,
  arrow = "right",
}: {
  cta: AffiliateCta;
  label: string;
  className?: string;
  arrow?: "right" | "up-right";
}) => {
  const Icon = arrow === "right" ? ArrowRight : ArrowUpRight;
  const base = cn(
    "h-12 gap-2 rounded-md bg-primary px-6 font-sans text-sm font-semibold leading-5 text-[#04070F] shadow-[0_10px_18px_rgba(29,206,248,0.24)] hover:bg-primary/90",
    className,
  );
  const inner = (
    <>
      {cta.label(label)} <Icon className="h-4 w-4" />
    </>
  );
  return cta.href ? (
    <Button asChild className={base} data-cta-state={cta.state}>
      <a href={cta.href} {...ext}>
        {inner}
      </a>
    </Button>
  ) : (
    <Button type="button" className={base} onClick={cta.onApply} aria-busy={cta.resolving || undefined} data-cta-state={cta.state}>
      {inner}
    </Button>
  );
};

/** The Apply CTA as a cyan text link (earnings "Build a partnership" band). */
export const AffiliateApplyLink = ({
  cta,
  label,
  className,
  arrow = "right",
}: {
  cta: AffiliateCta;
  label: string;
  className?: string;
  arrow?: "right" | "up-right";
}) => {
  const Icon = arrow === "right" ? ArrowRight : ArrowUpRight;
  const base = cn("inline-flex items-center gap-2 font-sans text-primary transition-opacity hover:opacity-80", className);
  const inner = (
    <>
      {cta.label(label)} <Icon className="h-4 w-4" />
    </>
  );
  return cta.href ? (
    <a href={cta.href} {...ext} className={base} data-cta-state={cta.state}>
      {inner}
    </a>
  ) : (
    <button type="button" onClick={cta.onApply} aria-busy={cta.resolving || undefined} className={base} data-cta-state={cta.state}>
      {inner}
    </button>
  );
};
