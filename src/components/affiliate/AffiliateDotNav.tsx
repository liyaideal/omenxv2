import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { JUMP_LINKS } from "./affiliateContent";

/**
 * Desktop-only fixed dot rail for /affiliate (Figma Omenx_Affiliate 42:12468).
 * One row per JUMP_LINKS entry (01–06, FAQ included per CPO 2026-09-18);
 * the row whose section is in view shows its number + a larger cyan dot.
 * Hidden below 1400px because the rail sits at left:40px inside the page gutter,
 * which only exists once the 1280 container has ≥ 60px of margin.
 */
export const AffiliateDotNav = ({ className }: { className?: string }) => {
  const [active, setActive] = useState(JUMP_LINKS[0].href);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const targets = JUMP_LINKS.map((j) => document.getElementById(j.href.slice(1))).filter((el): el is HTMLElement => !!el);
    if (!targets.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (hit) setActive(`#${hit.target.id}`);
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: 0 },
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);

  return (
    <nav
      aria-label="On this page"
      className={cn("fixed left-10 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-end gap-[4.8px] min-[1400px]:flex", className)}
    >
      {JUMP_LINKS.map((j) => {
        const on = active === j.href;
        return (
          <a
            key={j.href}
            href={j.href}
            title={`${j.n} ${j.label}`}
            aria-current={on ? "location" : undefined}
            className="flex h-[28.8px] items-center justify-end gap-[8.8px]"
          >
            <span className={cn("font-display text-[10px] leading-[15px] text-primary", on ? "opacity-100" : "opacity-0")}>{j.n}</span>
            <span
              className={cn(
                "rounded-full transition-all duration-200",
                on ? "h-[7.7px] w-[7.7px] bg-primary" : "h-[4.8px] w-[4.8px] bg-[#646972]",
              )}
            />
          </a>
        );
      })}
    </nav>
  );
};
