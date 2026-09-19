import { useEffect, useRef, useState } from "react";
import { MobileHeader } from "@/components/MobileHeader";
import { SeoFooter } from "@/components/seo";
import { omenxLogoSolid } from "@/components/Logo";
import { cn } from "@/lib/utils";
import {
  ArrowDown,
  ArrowUpRight,
  CircleDollarSign,
  Handshake,
  Megaphone,
  Network,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { AffiliateArt } from "@/components/affiliate/AffiliateArt";
import { AffiliateHeroLoop } from "@/components/affiliate/AffiliateHeroLoop";
import { EarningsLedger } from "@/components/affiliate/EarningsLedger";
import { FeeBaseComparison } from "@/components/affiliate/FeeBaseComparison";
import { AffiliateFaq } from "@/components/affiliate/AffiliateFaq";
import { useAffiliateCta } from "@/components/affiliate/useAffiliateCta";
import { AffiliateApplyButton, AffiliateApplyLink } from "@/components/affiliate/AffiliateApplyCta";
import {
  APPLY,
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
/* /affiliate · mobile — brand backflow of Figma Omenx_Affiliate        */
/* (file p3V2cA7MbmECbwKwhXtur4, frame 46:12621, 390 wide, 24px gutter).*/
/* Header stays MobileHeader variant B (DESIGN §10); the pill jump rail  */
/* and the sticky Apply CTA are production behaviour the draft did not   */
/* redraw and are kept as-is (CPO 2026-09-18).                           */
/* ------------------------------------------------------------------ */

const ext = { target: "_blank", rel: "noopener noreferrer" } as const;
const BENEFIT_ICONS: LucideIcon[] = [CircleDollarSign, Users, Network, Megaphone, Zap, Handshake];
const cardBg = "bg-[linear-gradient(169deg,rgba(11,15,25,0.78)_14%,rgba(5,7,14,0.92)_86%)]";

const splitLabel = (label: string) => {
  const i = label.indexOf(" ");
  return i === -1 ? [label] : [label.slice(0, i), label.slice(i + 1)];
};

const Eyebrow = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <span className={cn("block font-sans text-xs font-semibold uppercase leading-[15px] tracking-[2px] text-primary", className)}>{children}</span>
);

const SectionHead = ({ n, eyebrow, title, subtitle }: { n: string; eyebrow: string; title: string[]; subtitle?: string }) => (
  <div>
    <Eyebrow>
      {n} · {eyebrow}
    </Eyebrow>
    <h2 className="pt-4 font-display text-[28px] font-bold leading-[1.2] tracking-[-0.5px] text-foreground">
      {title.map((l) => (
        <span key={l} className="block">
          {l}
        </span>
      ))}
    </h2>
    {subtitle && <p className="pt-4 font-sans text-sm leading-[22px] text-muted-foreground">{subtitle}</p>}
  </div>
);

const Section = ({ id, children, className }: { id?: string; children: React.ReactNode; className?: string }) => (
  <section id={id} className={cn("w-full border-b border-[#131720] px-6 pb-[42px] pt-3 scroll-mt-14", className)}>
    {children}
  </section>
);

/** Exhibit head box: illustration with the 02.x label, title, intro and tag on top. */
const ExhibitHead = ({ n, title, intro, tag, art }: { n: string; title: string; intro: string; tag: string; art: "earn-1-mobile" | "earn-2-mobile" }) => (
  <div className="relative h-[204px] overflow-hidden rounded-lg">
    <AffiliateArt name={art} width={342} height={204} className="absolute inset-0 h-full w-full" />
    <div className="relative flex h-full flex-col px-4 pt-6">
      <Eyebrow>{n}</Eyebrow>
      <h3 className="mt-3.5 max-w-[280px] font-display text-xl font-medium leading-7 text-foreground">{title}</h3>
      <p className="mt-2 max-w-[324px] font-sans text-xs leading-[1.2] text-muted-foreground">{intro}</p>
      <span className="mt-auto pb-5 font-sans text-[10px] font-semibold uppercase leading-[15px] tracking-[2px] text-white/50">{tag}</span>
    </div>
  </div>
);

const Footnote = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-3.5 font-sans text-xs leading-[15px] text-[#555D69]">{children}</p>
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

  const accentLead = HERO.titleAccent.replace(/\s*OmenX\.?$/, "");
  // One CTA behaviour for all five Apply surfaces (guest gate / form / portal notice).
  const cta = useAffiliateCta();

  return (
    <div className="flex min-h-screen flex-col bg-background pb-24">
      <MobileHeader title="Affiliate Program" showLogo={false} showBack />

      <main className="w-full flex-1">
        {/* ============================== HERO ============================== */}
        <section ref={heroRef} className="relative overflow-hidden px-6 pb-[22px] pt-[42px]">
          <div
            aria-hidden
            className="pointer-events-none absolute left-[281px] top-[392px] h-[281px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: "radial-gradient(ellipse at center, rgba(51,214,255,0.08) 0%, rgba(51,214,255,0) 70%)" }}
          />
          <div className="relative">
            <span className="block font-display text-xs uppercase leading-[16.5px] tracking-[2.42px] text-primary">{HERO.eyebrow}</span>
            <h1 className="mt-[17px] font-display text-[40px] font-bold leading-10 tracking-[-1px] text-foreground">
              {HERO.titleLines.map((l) => (
                <span key={l} className="block">
                  {l}
                </span>
              ))}
              <span className="block text-primary">
                {accentLead} <span
                    role="img"
                    aria-label="OmenX"
                    className="inline-block h-[0.53em] w-[calc(0.53em*433/65)] bg-current align-baseline"
                    style={{ WebkitMaskImage: `url("${omenxLogoSolid}")`, maskImage: `url("${omenxLogoSolid}")`, WebkitMaskSize: "contain", maskSize: "contain", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat" }}
                  />
              </span>
            </h1>
            <p className="mt-6 font-sans text-base leading-[1.4] text-muted-foreground">{HERO.intro}</p>
            <AffiliateHeroLoop variant="mobile" className="mt-2" />

            <div className="flex flex-col gap-3 pt-8">
              <AffiliateApplyButton cta={cta} label={HERO.primaryCta} arrow="up-right" className="h-12 w-full rounded-[10px] px-8 text-[15px] font-medium leading-[22.5px] shadow-[0_10px_9px_rgba(29,206,248,0.24)] text-[#090A0B]" />
              <a href="#benefits" className="inline-flex h-11 items-center justify-center gap-1.5 font-sans text-[15px] leading-[22.5px] text-foreground/90">
                {HERO.secondaryCta} <ArrowDown className="h-4 w-4" />
              </a>
            </div>
            <p className="pt-2 text-center font-sans text-sm leading-[19.5px] text-muted-foreground">{HERO.note}</p>
          </div>
        </section>

        {/* Data band */}
        <section className="border-y border-[#11141D] bg-[#05070E] px-6 py-[42px]">
          <p className="font-display text-xl font-semibold leading-[1.2] text-foreground">
            <span className="block">{HERO.bottomLine[0]}</span>
            <span className="block">
              {HERO.bottomLine[1].split("new opportunity").map((part, i) => (
                <span key={i}>
                  {i > 0 && <span className="text-primary">new opportunity</span>}
                  {part}
                </span>
              ))}
            </span>
          </p>
          <div className="flex flex-col gap-1 pt-7 font-sans text-xs leading-[1.2]">
            <span className="text-muted-foreground">{HERO.snapshotLink}</span>
            <a href={INSIGHTS_URL} {...ext} className="inline-flex items-center gap-1 text-[#E6E6E6]">
              {HERO.snapshotLabel} <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
          <div className="mt-[25px]">
            {METRICS.map((s) => (
              <div key={s.label} className="flex items-end gap-3.5 border-t border-[#171A22] py-[19px]">
                <span className="font-display text-[46px] font-bold leading-[46px] text-foreground tabular-nums">{s.value}</span>
                <span className="pb-1 font-sans text-xs uppercase leading-[14px] text-muted-foreground">
                  {splitLabel(s.label).map((l) => (
                    <span key={l} className="block">
                      {l}
                    </span>
                  ))}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Jump rail — production behaviour kept (not redrawn in the draft) */}
        <nav
          aria-label="On this page"
          className="flex h-14 items-center gap-2.5 overflow-x-auto border-b border-[#131720] px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {JUMP_LINKS.map((j) => (
            <a
              key={j.href}
              href={j.href}
              className="inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-full border border-border/70 bg-background/60 px-3.5 font-mono text-[11px] uppercase tracking-[0.14em] text-foreground/80 active:bg-primary/10"
            >
              <span className="text-primary/70">{j.n}</span>
              {j.label}
            </a>
          ))}
        </nav>

        {/* ========================= 01 BENEFITS ========================= */}
        <Section id="benefits">
          <SectionHead n="01" eyebrow={BENEFITS_HEAD.eyebrow} title={BENEFITS_HEAD.title} subtitle={BENEFITS_HEAD.sub} />
          <div className="mt-[62px] grid grid-cols-1 gap-3">
            {BENEFITS.map((b, i) => {
              const Icon = BENEFIT_ICONS[i];
              return (
                <article key={b.n} className={cn("rounded-xl border border-border/60 px-[18px] pb-6 pt-5", cardBg)}>
                  <div className="flex items-start justify-between">
                    <span className="pt-3 font-display text-sm leading-5 text-primary">{b.n}</span>
                    <span className="flex h-[38px] w-[38px] items-center justify-center rounded-[5px] border border-primary/20 bg-primary/5 text-primary">
                      <Icon className="h-[17px] w-[17px]" strokeWidth={1.5} />
                    </span>
                  </div>
                  <h3 className="pt-4 font-display text-lg font-medium leading-6 tracking-[-0.22px] text-foreground">{b.title}</h3>
                  <p className="pt-2.5 font-sans text-sm leading-[22px] text-muted-foreground">{b.body}</p>
                </article>
              );
            })}
          </div>
        </Section>

        {/* ========================= 02 EARNINGS ========================= */}
        <Section id="earnings">
          <SectionHead n="02" eyebrow={EARNINGS_HEAD.eyebrow} title={EARNINGS_HEAD.title} subtitle={EARNINGS_HEAD.sub} />
          <div className="mt-5">
            <ExhibitHead n="02.1" title={HOW_YOU_EARN.title} intro={HOW_YOU_EARN.intro} tag="Illustrative · monthly" art="earn-1-mobile" />
            <EarningsLedger stacked className="mt-4" />
            <Footnote>{HOW_YOU_EARN.note}</Footnote>
          </div>
          <div className="mt-5">
            <ExhibitHead n="02.2" title={FEE_BASE.title} intro={FEE_BASE.intro} tag="Illustrative · monthly" art="earn-2-mobile" />
            <FeeBaseComparison stacked className="mt-3" />
            <Footnote>{FEE_BASE.note}</Footnote>
          </div>

          {/* Apply band */}
          <div className="relative mt-[38px] h-[193px] overflow-hidden rounded-xl">
            <AffiliateArt name="earn-band-mobile" width={342} height={193} className="absolute inset-0 h-full w-full" />
            <div className="relative px-4 pt-12">
              <p className="font-display text-xl font-medium leading-[1.2] text-foreground">{EARNINGS_END.line}</p>
              <AffiliateApplyLink cta={cta} label={EARNINGS_END.cta} arrow="up-right" className="mt-[18px] text-[15px] leading-[21px]" />
            </div>
          </div>
        </Section>

        {/* ======================== 03 HOW IT WORKS ======================== */}
        <Section id="how-it-works">
          <SectionHead n="03" eyebrow={STEPS_HEAD.eyebrow} title={STEPS_HEAD.title} />
          <div className="pt-6">
            <AffiliateApplyButton cta={cta} label={STEPS_HEAD.cta} className="px-[22px] shadow-[0_10px_9px_rgba(29,206,248,0.24)]" />
          </div>
          <ol className="mt-9 grid grid-cols-1 gap-3">
            {STEPS.map((s) => (
              <li key={s.n} className="rounded-lg border border-[#191D24] bg-card p-6">
                <span className="font-sans text-sm leading-[17.5px] text-primary">{s.n}</span>
                <div className="mt-5 font-display text-[21px] font-bold leading-tight text-foreground">{s.title}</div>
                <p className="mt-2.5 font-sans text-sm leading-[22px] text-muted-foreground">{s.body}</p>
              </li>
            ))}
          </ol>
        </Section>

        {/* =========================== 04 MARKETS =========================== */}
        <Section id="markets" className="border-b-0">
          <SectionHead n="04" eyebrow={MARKETS_HEAD.eyebrow} title={MARKETS_HEAD.title} subtitle={MARKETS_HEAD.sub} />
          <div className="mt-4 flex flex-col gap-4">
            {MARKETS.map((m, i) => {
              const art = (["market-sports", "market-crypto", "market-finance"] as const)[i];
              return (
                <article key={m.category} className={cn("overflow-hidden rounded-xl border border-border/60", cardBg)}>
                  <AffiliateArt name={art} width={1232} height={752} className={cn("w-full", ["h-[217px]", "h-[184px]", "h-[199px]"][i])} />
                  <div className="px-4 pb-6 pt-5">
                    <span className="block pt-3 font-sans text-sm font-semibold uppercase leading-[22px] tracking-[2px] text-muted-foreground">{m.category}</span>
                    <h3 className="mt-3 max-w-[324px] font-display text-[22px] font-medium leading-[26px] text-foreground">{m.title.join(" ")}</h3>
                    <p className="mt-3 max-w-[324px] font-sans text-sm leading-[22px] text-muted-foreground">{m.body}</p>
                    <div className="mt-[22px] flex items-end gap-2">
                      {m.logos.map((l) => (
                        <div key={l.label} className="flex flex-col items-center">
                          <div className="flex h-[60px] w-[60px] items-center justify-center rounded-[13px] border border-border/60 bg-card p-2.5">
                            <img src={l.src} alt="" className="max-h-8 max-w-[52px] object-contain" loading="lazy" />
                          </div>
                          <span className="mt-2.5 font-display text-[11px] leading-4 text-muted-foreground">{l.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          <div className="flex flex-col gap-2.5 pt-7">
            <p className="font-sans text-[13px] leading-[1.2]">
              <span className="font-semibold text-foreground">{MARKETS_NOTE.strong}</span>{" "}
              <span className="text-muted-foreground">{MARKETS_NOTE.body}</span>
            </p>
            <span className="self-start rounded-full border border-accent/70 bg-accent/[0.04] px-3.5 py-1.5 font-display text-xs leading-[19.2px] text-accent/80">
              {MARKETS_NOTE.chip}
            </span>
          </div>

          {/* Team proof */}
          <div className="pt-8">
            <p className="font-display text-lg font-medium leading-[26px] text-foreground">{TEAM_PROOF.line.join(" ")}</p>
            <div className="mt-6 flex items-center justify-between" aria-label={TEAM_PROOF.ariaLabel}>
              {TEAM_PROOF.logos.map((l, i) =>
                l.primary ? (
                  <span key={l.alt} className="inline-flex items-center gap-1 font-sans text-[15.8px] font-semibold leading-[21.5px] text-[#B4B5B7]">
                    <img src={l.src} alt="" className="h-[21.5px] w-[21.5px] object-contain" loading="lazy" />
                    {l.wordmark}
                  </span>
                ) : (
                  <img key={l.alt} src={l.src} alt={l.alt} className={cn("w-auto object-contain opacity-70", i === 1 ? "h-[21.5px]" : "h-[14.4px]")} loading="lazy" />
                ),
              )}
            </div>
          </div>
        </Section>

        {/* ========================= 05 PARTNERSHIPS ========================= */}
        <Section id="partners" className="border-b-0">
          <SectionHead n="05" eyebrow={PARTNERS_HEAD.eyebrow} title={PARTNERS_HEAD.title} />
          <div className="mt-6 grid grid-cols-1 gap-3">
            {PARTNERS.map((p) => (
              <figure key={p.title} className={cn("overflow-hidden rounded-xl border border-border/60", cardBg)}>
                <img src={p.src} alt={p.alt} className="h-[200px] w-full object-cover" loading="lazy" />
                <figcaption className="px-4 pb-[22px] pt-[18px]">
                  <span className="block pt-3.5 font-sans text-sm font-semibold uppercase leading-6 tracking-[2px] text-muted-foreground">{p.label}</span>
                  <h3 className="mt-3 font-display text-xl font-medium leading-[26px] text-foreground">{p.title}</h3>
                  <p className="mt-3.5 font-sans text-sm leading-6 text-muted-foreground">{p.body}</p>
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="pt-[26px] font-display text-lg leading-6 text-foreground">
            <span className="inline-flex items-center gap-2.5">
              {BASE_LINE.pre}
              <img src="/chain-logos/base.svg" alt="Base" className="h-7 w-7" loading="lazy" />
            </span>
            <span className="mt-2.5 block">{BASE_LINE.post}</span>
          </div>
        </Section>

        {/* ============================ 06 FAQ ============================ */}
        <Section id="faq" className="border-b-0 pt-[42px]">
          <Eyebrow className="text-[11px]">{FAQ_HEAD.eyebrow}</Eyebrow>
          <h2 className="mt-3 font-display text-[28px] font-bold leading-[34px] text-foreground">{FAQ_HEAD.title}</h2>
          <p className="mt-6 font-sans text-sm leading-5 text-muted-foreground">{FAQ_HEAD.help}</p>
          <a href={`mailto:${CONTACT_EMAIL}`} className="mt-1.5 inline-flex items-center gap-1.5 font-sans text-sm leading-[21px] text-foreground">
            {CONTACT_EMAIL} <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
          <AffiliateFaq size="md" className="mt-8" />
        </Section>

        {/* ============================== CTA ============================== */}
        <section id="apply" className="relative w-full scroll-mt-14 overflow-hidden bg-[#070911] px-6 pt-[21px]">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-[333px] h-[276px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: "radial-gradient(ellipse at center, rgba(51,214,255,0.11) 0%, rgba(51,214,255,0) 72%)" }}
          />
          <AffiliateArt name="cta-mosaic" width={1440} height={486} fit="contain" position="center top" className="absolute inset-x-0 top-[127px] h-[131px] w-full" />
          <div className="relative flex flex-col items-center text-center">
            <Eyebrow>{APPLY.eyebrow}</Eyebrow>
            <h2 className="mt-[22px] font-display text-[42px] font-bold leading-[48px] text-foreground">
              <span className="block">{APPLY.title}</span>
              <span className="block text-primary">{APPLY.titleAccent}</span>
            </h2>
            <p className="mt-5 pb-3.5 font-sans text-sm leading-[22px] text-muted-foreground">{APPLY.body}</p>
            <AffiliateApplyButton cta={cta} label={APPLY.cta} className="mt-6 px-[22px] shadow-[0_10px_9px_rgba(29,206,248,0.24)]" />
            <p className="mt-7 font-sans text-xs leading-5 text-muted-foreground">
              {APPLY.contactLead}
              <br />
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-foreground">
                {CONTACT_EMAIL}
              </a>
            </p>
            <p className="mt-3.5 pb-[34px] font-sans text-sm leading-[22px] text-muted-foreground">{DISCLAIMER}</p>
          </div>
        </section>
      </main>

      <SeoFooter />

      {/* Sticky primary CTA (mobile pattern: context on page, action pinned) */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 px-6 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur transition-transform duration-200",
          stickyVisible ? "translate-y-0" : "translate-y-full",
        )}
        aria-hidden={!stickyVisible}
      >
        <AffiliateApplyButton cta={cta} label={APPLY.cta} className="w-full" />
      </div>
      {cta.overlays}
    </div>
  );
};
