import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const SectionShell = ({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) => (
  <section id={id} className={cn("w-full max-w-full overflow-hidden border-t border-border/40 px-5 py-10 md:px-8 md:py-20", className)}>
    <div className="mx-auto w-full max-w-7xl min-w-0">{children}</div>
  </section>
);

export const SectionTitle = ({ eyebrow, title, desc }: { eyebrow?: string; title: string; desc?: string }) => (
  <div className="mb-5 max-w-3xl md:mb-10">
    {eyebrow && <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-mainnet-gold md:mb-3">{eyebrow}</p>}
    <h2 className="max-w-2xl text-2xl font-semibold leading-tight tracking-[-0.02em] text-foreground md:text-4xl">{title}</h2>
    {desc && <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground md:mt-4 md:text-base">{desc}</p>}
  </div>
);
