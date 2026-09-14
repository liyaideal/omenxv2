import { useEffect, useRef, useState } from "react";
import { MobileHeader } from "@/components/MobileHeader";
import { SeoFooter } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { AffiliateHeroArt } from "@/components/affiliate/AffiliateHeroArt";
import { EarningsLedger } from "@/components/affiliate/EarningsLedger";
import { FeeBaseComparison } from "@/components/affiliate/FeeBaseComparison";
import { AffiliateFaq } from "@/components/affiliate/AffiliateFaq";
import {
  APPLY,
  APPLY_URL,
  BASE_LINE,
  BENEFITS,
  BENEFITS_HEAD,
  CONTACT_EMAIL,
  DISCLAIMER,
  EARNINGS_END,
  EARNINGS_HEAD,
  FAQ_HEAD,
  FEE_BASE,
  HERO,
  HOW_YOU_EARN,
  INSIGHTS_URL,
  JUMP_LINKS,
  MARKETS,
  MARKETS_HEAD,
  MARKETS_NOTE,
  METRICS,
  PARTNERS,
  PARTNERS_HEAD,
  STEPS,
  STEPS_HEAD,
  TEAM_PROOF,
} from "@/components/affiliate/affiliateContent";

const ext = { target: "_blank", rel: "noopener noreferrer" } as const;

const Eyebrow = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <span className={cn("block text-[11px] font-mono uppercase tracking-[0.22em] text-primary", className)}>{children}</span>
);

const SectionHeader = ({ n, eyebrow, title, subtitle }: { n: string; eyebrow: string; title: string[]; subtitle?: string }) => (
  <div className="relative pb-6 border-b border-border/30 mb-8">
    <span
      aria-hidden
      className="absolute right-0 -top-3 font-mono font-bold text-[72px] leading-none text-muted-foreground/[0.07] select-none pointer-events-none"
    >
      {n}
    </span>
    <div className="relative">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-3 font-display font-medium tracking-[-0.015em] text-[28px] leading-[1.12] text-foreground">
        {title.map((l) => (
          <span key={l} className="block">
            {l}
          </span>
        ))}
      </h2>
      {subtitle && <p className="text-[15px] text-muted-foreground mt-3 leading-relaxed">{subtitle}</p>}
    </div>
  </div>
);

const Band = ({ id, children }: { id?: string; children: React.ReactNode }) => (
  <section
    id={id}
    className={cn("w-full border-t border-border/30 px-5 py-14 scroll-mt-14 bg-background")}
  >
    {children}
  </section>
);

const ApplyButton = ({ label, className, variant = "default" }: { label: string; className?: string; variant?: "default" | "outline" }) => (
  <Button size="lg" variant={variant} asChild className={cn("gap-2 w-full h-12 text-[15px]", className)}>
    <a href={APPLY_URL} {...ext}>
      {label} <ArrowUpRight className="w-4 h-4" />
    </a>
  </Button>
);

/** Framed exhibit (full-bleed on mobile): header strip + body + fine-print footer. */
const Exhibit = ({
  n,
  title,
  intro,
  note,
  children,
}: {
  n: string;
  title: string;
  intro: string;
  note: string;
  children: React.ReactNode;
}) => (
  <figure className="border-y border-border/60 bg-card">
    <figcaption className="px-5 py-5 border-b border-border/40">
      <span className="font-mono text-[11px] text-primary tracking-[0.18em]">{n}</span>
      <h3 className="mt-2 font-display font-medium tracking-[-0.01em] text-2xl text-foreground">{title}</h3>
      <p className="text-[15px] text-muted-foreground mt-2 leading-relaxed">{intro}</p>
    </figcaption>
    {children}
    <div className="px-5 py-4 border-t border-border/40 bg-muted/10">
      <p className="text-[13px] text-muted-foreground/80 leading-relaxed">{note}</p>
    </div>
  </figure>
);

export const AffiliatePageMobile = () => {
  // Sticky CTA appears only after the hero (which carries its own CTA) scrolls out.
  const heroRef = useRef<HTMLElement | null>(null);
  const [stickyVisible, setStickyVisible] = useState(false);
  useEffect(() => {
    const el = heroRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setStickyVisible(!e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MobileHeader title="Affiliate Program" showLogo={false} showBack />

      <main className="flex-1 w-full pb-24">
        {/* ============================== HERO ============================== */}
        <section ref={heroRef} className="relative border-b border-border/40 px-5 pt-10 pb-10 overflow-hidden">
          <div className="absolute -top-16 -right-16 w-[300px] h-[300px] rounded-full bg-primary/[0.07] blur-[70px] pointer-events-none" />
          <div className="relative">
            <Eyebrow>{HERO.eyebrow}</Eyebrow>
            <h1 className="mt-5 font-display font-bold text-[40px] leading-[1.0] tracking-[-0.025em] text-foreground">
              {HERO.titleLines.map((l) => (
                <span key={l} className="block">
                  {l}
                </span>
              ))}
              <span className="block text-primary">{HERO.titleAccent}</span>
            </h1>
            <p className="mt-6 text-base text-muted-foreground leading-relaxed">{HERO.intro}</p>

            <div className="mt-8 flex flex-col gap-3">
              <ApplyButton label={HERO.primaryCta} />
              <a
                href="#earnings"
                className="inline-flex items-center justify-center gap-1.5 text-[15px] text-foreground/90 hover:text-primary transition-colors h-11"
              >
                {HERO.secondaryCta} <ArrowDown className="w-4 h-4" />
              </a>
            </div>
            <p className="mt-2 text-[13px] text-muted-foreground text-center">{HERO.note}</p>

            <AffiliateHeroArt variant="mobile" caption={HERO.artCaption} className="mt-10" />
          </div>
        </section>

        {/* Data banner */}
        <section className="border-b border-border/40 px-5 py-8">
          <p className="relative pl-4 text-[15px] text-foreground/90 leading-snug">
            <span className="absolute left-0 top-0 bottom-0 w-px bg-trading-purple/50" />
            {HERO.bottomLine.map((l) => (
              <span key={l} className="block">
                {l}
              </span>
            ))}
          </p>
          <div className="mt-7 grid grid-cols-3 gap-x-4">
            {METRICS.map((s) => (
              <div key={s.label} className="flex flex-col">
                <div className="font-mono text-[30px] font-bold text-foreground leading-none tabular-nums">{s.value}</div>
                <div className="mt-2 flex gap-[3px] h-[3px]">
                  <span className="w-5 bg-primary/70" />
                  <span className="w-2.5 bg-primary/35" />
                  <span className="w-1.5 bg-primary/20" />
                </div>
                <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground mt-2 leading-tight">{s.label}</div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-[13px] text-muted-foreground">
            {HERO.snapshotLabel}{" "}
            <a href={INSIGHTS_URL} {...ext} className="inline-flex items-center gap-1 text-foreground/90">
              {HERO.snapshotLink} <ArrowUpRight className="w-3 h-3" />
            </a>
          </p>
        </section>

        {/* Jump rail */}
        <nav
          aria-label="On this page"
          className="border-b border-border/40 h-14 flex items-center gap-2.5 px-5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {JUMP_LINKS.map((j) => (
            <a
              key={j.href}
              href={j.href}
              className="inline-flex items-center gap-2 h-9 px-3.5 rounded-full border border-border/70 bg-background/60 font-mono text-[11px] uppercase tracking-[0.14em] text-foreground/80 whitespace-nowrap active:bg-primary/10"
            >
              <span className="text-primary/70">{j.n}</span>
              {j.label}
            </a>
          ))}
        </nav>

        {/* ========================= 01 BENEFITS ========================= */}
        <Band id="benefits">
          <SectionHeader n="01" eyebrow={BENEFITS_HEAD.eyebrow} title={BENEFITS_HEAD.title} subtitle={BENEFITS_HEAD.sub} />
          <div className="border-y border-border/40 divide-y divide-border/40">
            {BENEFITS.map((b) => (
              <article key={b.n} className="py-6 flex gap-5">
                <span className="font-mono text-sm text-accent pt-1 w-7 shrink-0">{b.n}</span>
                <div>
                  <h3 className="font-display font-medium tracking-[-0.01em] text-xl text-foreground leading-tight">{b.title}</h3>
                  <p className="text-[15px] text-muted-foreground leading-relaxed mt-2">{b.body}</p>
                </div>
              </article>
            ))}
          </div>
        </Band>

        {/* ========================= 02 EARNINGS ========================= */}
        <Band id="earnings">
          <SectionHeader n="02" eyebrow={EARNINGS_HEAD.eyebrow} title={EARNINGS_HEAD.title} subtitle={EARNINGS_HEAD.sub} />
          <div className="space-y-10 -mx-5">
            <Exhibit n="02.1" title={HOW_YOU_EARN.title} intro={HOW_YOU_EARN.intro} note={HOW_YOU_EARN.note}>
              <EarningsLedger stacked className="border-y-0" />
            </Exhibit>
            <Exhibit n="02.2" title={FEE_BASE.title} intro={FEE_BASE.intro} note={FEE_BASE.note}>
              <FeeBaseComparison stacked className="border-y-0" />
            </Exhibit>
          </div>
          <div className="mt-12 pt-6 border-t border-border/30 flex items-center justify-between gap-4">
            <p className="font-display text-lg text-foreground/90">{EARNINGS_END.line}</p>
            <a href={APPLY_URL} {...ext} className="inline-flex items-center gap-1 text-[15px] text-foreground/90 shrink-0">
              {EARNINGS_END.cta} <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </Band>

        {/* ======================== 03 HOW IT WORKS ======================== */}
        <Band id="how-it-works">
          <SectionHeader n="03" eyebrow={STEPS_HEAD.eyebrow} title={STEPS_HEAD.title} />
          <ol className="border-y border-border/40 divide-y divide-border/40">
            {STEPS.map((s) => (
              <li key={s.n} className="py-7 flex gap-5">
                <span aria-hidden className="font-mono font-bold text-4xl leading-none text-primary/80 tabular-nums shrink-0 w-12">
                  {s.n}
                </span>
                <div>
                  <div className="font-display font-medium tracking-[-0.01em] text-xl text-foreground leading-tight">{s.title}</div>
                  <p className="text-[15px] text-muted-foreground mt-2 leading-relaxed">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <ApplyButton label={STEPS_HEAD.cta} variant="outline" className="mt-8" />
        </Band>

        {/* =========================== 04 MARKETS =========================== */}
        <Band id="markets">
          <SectionHeader n="04" eyebrow={MARKETS_HEAD.eyebrow} title={MARKETS_HEAD.title} subtitle={MARKETS_HEAD.sub} />
          <div className="border-y border-border/40 divide-y divide-border/40 -mx-5">
            {MARKETS.map((m) => (
              <article key={m.category} className="px-5 py-8">
                <Eyebrow>{m.category}</Eyebrow>
                <h3 className="mt-3 font-display font-medium tracking-[-0.015em] text-[26px] text-foreground leading-[1.1]">
                  {m.title.map((l) => (
                    <span key={l} className="block">
                      {l}
                    </span>
                  ))}
                </h3>
                <p className="mt-3 text-[15px] text-muted-foreground leading-relaxed">{m.body}</p>
                <div className="mt-6 flex items-end gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {m.logos.map((l) => (
                    <div key={l.label} className="flex flex-col items-center gap-2 shrink-0">
                      <div className="h-16 min-w-[64px] px-3 rounded-2xl border border-border/60 bg-card flex items-center justify-center">
                        <img src={l.src} alt="" className="max-h-9 max-w-[56px] object-contain" loading="lazy" />
                      </div>
                      <span className="font-mono text-xs text-muted-foreground">{l.label}</span>
                    </div>
                  ))}
                </div>
              </article>
            ))}
            <div className="px-5 py-6 flex flex-col gap-3">
              <p className="text-[15px] text-muted-foreground">
                <span className="font-semibold text-foreground">{MARKETS_NOTE.strong}</span> {MARKETS_NOTE.body}
              </p>
              <span className="self-start rounded-full border border-border/70 bg-background/60 px-3.5 py-1.5 font-mono text-xs text-foreground/80">
                {MARKETS_NOTE.chip}
              </span>
            </div>
          </div>
        </Band>

        {/* ========================= 05 PARTNERSHIPS ========================= */}
        <Band id="partners">
          <div className="pb-10 mb-10 border-b border-border/30">
            <p className="font-display text-xl text-foreground/90 leading-snug">
              {TEAM_PROOF.line.map((l) => (
                <span key={l} className="block">
                  {l}
                </span>
              ))}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-4" aria-label={TEAM_PROOF.ariaLabel}>
              {TEAM_PROOF.logos.map((l) =>
                l.primary ? (
                  <span key={l.alt} className="inline-flex items-center gap-2.5 text-foreground font-semibold text-lg">
                    <img src={l.src} alt="" className="w-8 h-8 object-contain" loading="lazy" />
                    {l.wordmark}
                  </span>
                ) : (
                  <img key={l.alt} src={l.src} alt={l.alt} className="h-6 w-auto object-contain opacity-70 grayscale" loading="lazy" />
                ),
              )}
            </div>
          </div>

          <SectionHeader n="05" eyebrow={PARTNERS_HEAD.eyebrow} title={PARTNERS_HEAD.title} />
          <div className="space-y-10">
            {PARTNERS.map((p) => (
              <figure key={p.title}>
                <div className="rounded-lg border border-border/50 overflow-hidden bg-card aspect-[16/9]">
                  <img src={p.src} alt={p.alt} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <figcaption className="mt-4">
                  <Eyebrow>{p.label}</Eyebrow>
                  <h3 className="mt-2 font-display font-medium tracking-[-0.01em] text-xl text-foreground">{p.title}</h3>
                  <p className="mt-2 text-[15px] text-muted-foreground leading-relaxed">{p.body}</p>
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="mt-10 pt-6 border-t border-border/30 flex items-center gap-2.5 text-[15px] text-muted-foreground">
            <span>{BASE_LINE.pre}</span>
            <img src="/chain-logos/base.svg" alt="Base" className="h-5 w-5" loading="lazy" />
            <span>{BASE_LINE.post}</span>
          </div>
        </Band>

        {/* ============================ 06 FAQ ============================ */}
        <Band id="faq">
          <Eyebrow className="text-muted-foreground/70">{FAQ_HEAD.eyebrow}</Eyebrow>
          <h2 className="mt-3 font-display font-medium tracking-[-0.015em] text-[32px] text-foreground">{FAQ_HEAD.title}</h2>
          <p className="mt-3 text-[15px] text-muted-foreground">
            {FAQ_HEAD.help}{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex items-center gap-1 text-foreground/90">
              {CONTACT_EMAIL} <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </p>
          <AffiliateFaq size="md" className="mt-8" />
        </Band>

        {/* ============================== CTA ============================== */}
        <section id="apply" className="w-full border-t border-border/40 bg-background px-5 py-16 scroll-mt-14">
          <Eyebrow>{APPLY.eyebrow}</Eyebrow>
          <h3 className="mt-4 font-display font-medium tracking-[-0.02em] text-[36px] text-foreground leading-[1.02]">
            <span className="block">{APPLY.title}</span>
            <span className="block text-primary">{APPLY.titleAccent}</span>
          </h3>
          <p className="mt-5 text-base text-muted-foreground leading-relaxed">{APPLY.body}</p>
          <div className="mt-8">
            <ApplyButton label={APPLY.cta} />
          </div>
          <p className="mt-8 text-[13px] text-muted-foreground">
            {APPLY.contactLead}
            <br />
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-foreground/90 text-[15px]">
              {CONTACT_EMAIL}
            </a>
          </p>
        </section>

        <div className="w-full border-t border-border/30 px-5 py-5">
          <p className="text-[13px] text-muted-foreground/80 leading-relaxed">{DISCLAIMER}</p>
        </div>
      </main>

      <SeoFooter />

      {/* Sticky primary CTA (mobile pattern: context on page, action pinned) */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] transition-transform duration-200",
          stickyVisible ? "translate-y-0" : "translate-y-full",
        )}
        aria-hidden={!stickyVisible}
      >
        <ApplyButton label={APPLY.cta} />
      </div>
    </div>
  );
};
