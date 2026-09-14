import { EventsDesktopHeader } from "@/components/EventsDesktopHeader";
import { SeoFooter } from "@/components/seo";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { AffiliatePageMobile } from "./AffiliatePageMobile";
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

/* ------------------------------------------------------------------ */
/* Marketing surface · scale L (DESIGN.md §19.4)                        */
/* Skeleton = §19.1 (bleed bands, hairlines, tracks, ghost numbers).    */
/* Scale = outward marketing: display h2 40px, body 15–16px, numbers    */
/* as protagonists. /developers keeps scale S.                          */
/* ------------------------------------------------------------------ */

const dotBg =
  "bg-[radial-gradient(circle_at_1px_1px,hsl(var(--muted-foreground)/0.15)_1px,transparent_0)] [background-size:22px_22px]";

const ext = { target: "_blank", rel: "noopener noreferrer" } as const;

const Eyebrow = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <span className={cn("block text-[11px] font-mono uppercase tracking-[0.24em] text-primary", className)}>{children}</span>
);

const SectionHeader = ({
  n,
  eyebrow,
  title,
  subtitle,
  right,
}: {
  n: string;
  eyebrow: string;
  title: string[];
  subtitle?: string;
  right?: React.ReactNode;
}) => (
  <div className="relative pb-8 mb-12 border-b border-border/30">
    <span
      aria-hidden
      className="absolute right-0 -top-6 font-mono font-bold text-[120px] leading-none text-muted-foreground/[0.07] select-none pointer-events-none"
    >
      {n}
    </span>
    <div className="relative max-w-3xl">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-4 font-display font-medium tracking-[-0.015em] text-4xl lg:text-[40px] leading-[1.1] text-foreground">
        {title.map((l) => (
          <span key={l} className="block">
            {l}
          </span>
        ))}
      </h2>
      {subtitle && <p className="mt-4 text-base text-muted-foreground leading-relaxed max-w-2xl">{subtitle}</p>}
      {right && <div className="mt-7">{right}</div>}
    </div>
  </div>
);

const Band = ({
  id,
  children,
  className,
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <section
    id={id}
    className={cn(
      "relative w-full border-t border-border/30 scroll-mt-16",
      "bg-background",
      className,
    )}
  >
    <div className="w-full max-w-7xl mx-auto md:border-x border-border/40 px-6 md:px-10 py-20 md:py-28">{children}</div>
  </section>
);

const ApplyButton = ({ label, className, variant = "default" }: { label: string; className?: string; variant?: "default" | "outline" }) => (
  <Button size="lg" variant={variant} asChild className={cn("gap-2 h-12 px-6 text-[15px]", className)}>
    <a href={APPLY_URL} {...ext}>
      {label} <ArrowUpRight className="w-4 h-4" />
    </a>
  </Button>
);

const TextLink = ({ href, children, external, className }: { href: string; children: React.ReactNode; external?: boolean; className?: string }) => (
  <a
    href={href}
    {...(external ? ext : {})}
    className={cn(
      "inline-flex items-center gap-1.5 text-[15px] text-foreground/90 hover:text-primary transition-colors underline-offset-4 hover:underline",
      className,
    )}
  >
    {children}
  </a>
);

/** Framed exhibit: header strip (number · title · intro · tag) + body + fine-print footer. */
const Exhibit = ({
  n,
  tag,
  title,
  intro,
  note,
  children,
}: {
  n: string;
  tag: string;
  title: string;
  intro: string;
  note: string;
  children: React.ReactNode;
}) => (
  <figure className="rounded-xl border border-border/60 bg-card overflow-hidden">
    <figcaption className="px-7 py-6 border-b border-border/40 flex items-start justify-between gap-8">
      <div className="max-w-2xl">
        <span className="font-mono text-[11px] text-primary tracking-[0.18em]">{n}</span>
        <h3 className="mt-2 font-display font-medium tracking-[-0.01em] text-2xl text-foreground">{title}</h3>
        <p className="text-[15px] text-muted-foreground mt-2 leading-relaxed">{intro}</p>
      </div>
      <span className="hidden md:inline-flex shrink-0 rounded-full border border-border/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {tag}
      </span>
    </figcaption>
    {children}
    <div className="px-7 py-4 border-t border-border/40 bg-muted/10">
      <p className="text-[13px] text-muted-foreground/80 leading-relaxed">{note}</p>
    </div>
  </figure>
);

/* ------------------------------------------------------------------ */

const AffiliatePage = () => {
  const isMobile = useIsMobile();
  if (isMobile) return <AffiliatePageMobile />;

  return (
    <div className="min-h-screen bg-background flex flex-col pb-safe">
      <EventsDesktopHeader />

      <main className="flex-1 w-full">
        {/* ============================== HERO ============================== */}
        <section className="relative overflow-hidden border-b border-border/40">
          <div className={cn("absolute inset-0 opacity-40", dotBg)} />
          <div className="absolute -top-32 -right-32 w-[640px] h-[640px] rounded-full bg-primary/[0.07] blur-[140px] pointer-events-none" />

          <div className="relative w-full max-w-7xl mx-auto md:border-x border-border/40 px-6 md:px-10 pt-20 lg:pt-28 pb-16">
            <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-12 lg:gap-16 items-center">
              <div className="animate-fade-in">
                <Eyebrow>{HERO.eyebrow}</Eyebrow>
                <h1 className="mt-6 font-display font-bold text-5xl lg:text-[60px] xl:text-[64px] leading-[0.98] tracking-[-0.025em] text-foreground">
                  {HERO.titleLines.map((l) => (
                    <span key={l} className="block">
                      {l}
                    </span>
                  ))}
                  <span className="block text-primary">{HERO.titleAccent}</span>
                </h1>
                <p className="mt-8 text-lg text-muted-foreground max-w-xl leading-relaxed">{HERO.intro}</p>
                <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
                  <ApplyButton label={HERO.primaryCta} />
                  <TextLink href="#earnings" className="text-base">
                    {HERO.secondaryCta} <ArrowDown className="w-4 h-4" />
                  </TextLink>
                </div>
                <p className="mt-6 text-sm text-muted-foreground">{HERO.note}</p>
              </div>

              <div className="relative flex justify-end animate-fade-in" style={{ animationDelay: "75ms" }}>
                <AffiliateHeroArt variant="desktop" caption={HERO.artCaption} className="w-full max-w-[480px]" />
              </div>
            </div>
          </div>

          {/* Data banner — platform snapshot */}
          <div className="relative border-t border-border/40">
            <div className="w-full max-w-7xl mx-auto md:border-x border-border/40 px-6 md:px-10 py-10 grid lg:grid-cols-[1fr_auto] gap-10 items-center">
              <div className="grid grid-cols-[auto_1fr] gap-10 items-center">
                <p className="text-base text-foreground/90 leading-snug pl-5 relative">
                  <span className="absolute left-0 top-0 bottom-0 w-px bg-trading-purple/50" />
                  {HERO.bottomLine.map((l) => (
                    <span key={l} className="block">
                      {l}
                    </span>
                  ))}
                </p>
                <div className="flex flex-wrap items-start gap-x-14 gap-y-6">
                  {METRICS.map((s) => (
                    <div key={s.label} className="flex flex-col">
                      <div className="font-mono text-[44px] font-bold text-foreground leading-none tabular-nums">{s.value}</div>
                      <div className="mt-2.5 flex gap-[3px] h-[3px]">
                        <span className="w-5 bg-primary/70" />
                        <span className="w-2.5 bg-primary/35" />
                        <span className="w-1.5 bg-primary/20" />
                      </div>
                      <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground mt-2.5">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-sm text-muted-foreground text-right leading-relaxed">
                {HERO.snapshotLabel}
                <br />
                <a href={INSIGHTS_URL} {...ext} className="inline-flex items-center gap-1 text-foreground/90 hover:text-primary transition-colors">
                  {HERO.snapshotLink} <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </p>
            </div>
          </div>

          {/* Jump rail — replaces the original page nav */}
          <div className="relative border-t border-border/40">
            <nav
              aria-label="On this page"
              className="w-full max-w-7xl mx-auto md:border-x border-border/40 px-6 md:px-10 h-16 flex items-center gap-3 overflow-x-auto"
            >
              {JUMP_LINKS.map((j) => (
                <a
                  key={j.href}
                  href={j.href}
                  className="group inline-flex items-center gap-2.5 h-9 px-4 rounded-full border border-border/70 bg-background/60 font-mono text-[11px] uppercase tracking-[0.16em] text-foreground/80 hover:text-foreground hover:border-primary/50 hover:bg-primary/10 transition-colors whitespace-nowrap"
                >
                  <span className="text-primary/70 group-hover:text-primary transition-colors">{j.n}</span>
                  {j.label}
                </a>
              ))}
            </nav>
          </div>
        </section>

        {/* ========================= 01 BENEFITS ========================= */}
        <Band id="benefits">
          <SectionHeader n="01" eyebrow={BENEFITS_HEAD.eyebrow} title={BENEFITS_HEAD.title} subtitle={BENEFITS_HEAD.sub} />
          <div className="border-y border-border/40">
            <div className="grid md:grid-cols-3 md:divide-x divide-y md:divide-y-0 divide-border/40">
              {BENEFITS.map((b, i) => (
                <article
                  key={b.n}
                  className={cn("px-7 py-10 flex flex-col gap-3 min-h-[220px]", i >= 3 && "md:border-t border-border/40")}
                >
                  <span className="font-mono text-sm text-accent">{b.n}</span>
                  <h3 className="mt-2 font-display font-medium tracking-[-0.01em] text-[22px] text-foreground leading-tight">{b.title}</h3>
                  <p className="text-[15px] text-muted-foreground leading-relaxed">{b.body}</p>
                </article>
              ))}
            </div>
          </div>
        </Band>

        {/* ========================= 02 EARNINGS ========================= */}
        <Band id="earnings">
          <SectionHeader n="02" eyebrow={EARNINGS_HEAD.eyebrow} title={EARNINGS_HEAD.title} subtitle={EARNINGS_HEAD.sub} />

          {/* Two exhibits, each framed as a product object (statement / benchmark) so they read apart. */}
          <div className="space-y-16">
            <Exhibit n="02.1" tag="Illustrative · monthly" title={HOW_YOU_EARN.title} intro={HOW_YOU_EARN.intro} note={HOW_YOU_EARN.note}>
              <EarningsLedger className="border-y-0" />
            </Exhibit>
            <Exhibit n="02.2" tag="Benchmark · same volume" title={FEE_BASE.title} intro={FEE_BASE.intro} note={FEE_BASE.note}>
              <FeeBaseComparison className="border-y-0" />
            </Exhibit>
          </div>

          <div className="mt-14 pt-8 border-t border-border/30 flex items-center justify-between gap-6">
            <p className="font-display text-xl text-foreground/90">{EARNINGS_END.line}</p>
            <TextLink href={APPLY_URL} external className="text-base">
              {EARNINGS_END.cta} <ArrowUpRight className="w-4 h-4" />
            </TextLink>
          </div>
        </Band>

        {/* ======================== 03 HOW IT WORKS ======================== */}
        <Band id="how-it-works">
          <SectionHeader
            n="03"
            eyebrow={STEPS_HEAD.eyebrow}
            title={STEPS_HEAD.title}
            right={<ApplyButton label={STEPS_HEAD.cta} variant="outline" />}
          />
          <div className="relative border-y border-border/40">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-border via-border to-primary" />
            <div className="grid md:grid-cols-3 md:divide-x divide-y md:divide-y-0 divide-border/40">
              {STEPS.map((s) => (
                <div key={s.n} className="px-7 py-10 flex flex-col">
                  <span aria-hidden className="font-mono font-bold text-5xl leading-none text-primary/80 tabular-nums">
                    {s.n}
                  </span>
                  <div className="mt-6 font-display font-medium tracking-[-0.01em] text-[22px] text-foreground leading-tight">{s.title}</div>
                  <p className="text-[15px] text-muted-foreground mt-3 leading-relaxed">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </Band>

        {/* =========================== 04 MARKETS =========================== */}
        <Band id="markets">
          <SectionHeader n="04" eyebrow={MARKETS_HEAD.eyebrow} title={MARKETS_HEAD.title} subtitle={MARKETS_HEAD.sub} />
          <div className="border-y border-border/40">
            <div className="grid md:grid-cols-3 md:divide-x divide-y md:divide-y-0 divide-border/40">
              {MARKETS.map((m) => (
                <article key={m.category} className="px-7 py-10 flex flex-col">
                  <Eyebrow>{m.category}</Eyebrow>
                  <h3 className="mt-4 font-display font-medium tracking-[-0.015em] text-[28px] text-foreground leading-[1.1]">
                    {m.title.map((l) => (
                      <span key={l} className="block">
                        {l}
                      </span>
                    ))}
                  </h3>
                  <p className="mt-4 text-[15px] text-muted-foreground leading-relaxed">{m.body}</p>
                  <div className="mt-auto pt-8 flex items-end gap-3">
                    {m.logos.map((l) => (
                      <div key={l.label} className="flex flex-col items-center gap-2.5">
                        <div className="h-[72px] min-w-[72px] px-3 rounded-2xl border border-border/60 bg-card flex items-center justify-center">
                          <img src={l.src} alt="" className="max-h-10 max-w-[64px] object-contain" loading="lazy" />
                        </div>
                        <span className="font-mono text-xs text-muted-foreground">{l.label}</span>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
            <div className="border-t border-border/40 px-7 py-6 flex flex-wrap items-center justify-between gap-4">
              <p className="text-[15px] text-muted-foreground">
                <span className="font-semibold text-foreground">{MARKETS_NOTE.strong}</span> {MARKETS_NOTE.body}
              </p>
              <span className="rounded-full border border-border/70 bg-background/60 px-3.5 py-1.5 font-mono text-xs text-foreground/80">
                {MARKETS_NOTE.chip}
              </span>
            </div>
          </div>
        </Band>

        {/* ========================= 05 PARTNERSHIPS ========================= */}
        <Band id="partners">
          {/* Team proof */}
          <div className="flex flex-col md:flex-row md:items-center gap-8 md:gap-16 pb-12 mb-14 border-b border-border/30">
            <p className="font-display text-xl text-foreground/90 leading-snug shrink-0">
              {TEAM_PROOF.line.map((l) => (
                <span key={l} className="block">
                  {l}
                </span>
              ))}
            </p>
            <div className="flex flex-wrap items-center gap-x-12 gap-y-5" aria-label={TEAM_PROOF.ariaLabel}>
              {TEAM_PROOF.logos.map((l) =>
                l.primary ? (
                  <span key={l.alt} className="inline-flex items-center gap-3 text-foreground font-semibold text-xl">
                    <img src={l.src} alt="" className="w-9 h-9 object-contain" loading="lazy" />
                    {l.wordmark}
                  </span>
                ) : (
                  <img key={l.alt} src={l.src} alt={l.alt} className="h-7 w-auto object-contain opacity-70 grayscale" loading="lazy" />
                ),
              )}
            </div>
          </div>

          <SectionHeader n="05" eyebrow={PARTNERS_HEAD.eyebrow} title={PARTNERS_HEAD.title} />
          <div className="grid md:grid-cols-2 gap-10">
            {PARTNERS.map((p) => (
              <figure key={p.title} className="flex flex-col">
                <div className="rounded-lg border border-border/50 overflow-hidden bg-card aspect-[16/9]">
                  <img src={p.src} alt={p.alt} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <figcaption className="mt-6">
                  <Eyebrow>{p.label}</Eyebrow>
                  <h3 className="mt-3 font-display font-medium tracking-[-0.01em] text-2xl text-foreground">{p.title}</h3>
                  <p className="mt-2 text-[15px] text-muted-foreground leading-relaxed">{p.body}</p>
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="mt-14 pt-8 border-t border-border/30 flex items-center gap-3 text-[15px] text-muted-foreground">
            <span>{BASE_LINE.pre}</span>
            <img src="/chain-logos/base.svg" alt="Base" className="h-6 w-6" loading="lazy" />
            <span>{BASE_LINE.post}</span>
          </div>
        </Band>

        {/* ============================ 06 FAQ ============================ */}
        <Band id="faq">
          <div className="grid lg:grid-cols-[0.4fr_0.6fr] gap-12 lg:gap-20">
            <div>
              <Eyebrow className="text-muted-foreground/70">{FAQ_HEAD.eyebrow}</Eyebrow>
              <h2 className="mt-4 font-display font-medium tracking-[-0.015em] text-[40px] text-foreground">{FAQ_HEAD.title}</h2>
              <p className="mt-4 text-base text-muted-foreground">
                {FAQ_HEAD.help}{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex items-center gap-1 text-foreground/90 hover:text-primary transition-colors">
                  {CONTACT_EMAIL} <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </p>
            </div>
            <AffiliateFaq size="lg" />
          </div>
        </Band>

        {/* ============================== CTA ============================== */}
        <section id="apply" className="relative w-full border-y border-border/40 bg-background scroll-mt-16 overflow-hidden">
          <div className={cn("absolute inset-0 opacity-30", dotBg)} />
          <div className="relative w-full max-w-7xl mx-auto md:border-x border-border/40 px-6 md:px-10 py-24 md:py-32">
            <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
              <div>
                <Eyebrow>{APPLY.eyebrow}</Eyebrow>
                <h3 className="mt-5 font-display font-medium tracking-[-0.02em] text-5xl lg:text-[56px] text-foreground leading-[1.02]">
                  <span className="block">{APPLY.title}</span>
                  <span className="block text-primary">{APPLY.titleAccent}</span>
                </h3>
              </div>
              <div className="lg:pl-12 lg:border-l border-border/30">
                <p className="text-lg text-muted-foreground max-w-md leading-relaxed">{APPLY.body}</p>
                <div className="mt-8">
                  <ApplyButton label={APPLY.cta} />
                </div>
                <p className="mt-8 text-sm text-muted-foreground">
                  {APPLY.contactLead}
                  <br />
                  <a href={`mailto:${CONTACT_EMAIL}`} className="text-foreground/90 hover:text-primary transition-colors text-base">
                    {CONTACT_EMAIL}
                  </a>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Program disclaimer (kept from the original footer) */}
        <div className="w-full border-t border-border/30">
          <div className="w-full max-w-7xl mx-auto md:border-x border-border/40 px-6 md:px-10 py-5">
            <p className="text-[13px] text-muted-foreground/80 leading-relaxed">{DISCLAIMER}</p>
          </div>
        </div>
      </main>

      <SeoFooter />
    </div>
  );
};

export default AffiliatePage;
