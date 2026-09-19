import { EventsDesktopHeader } from "@/components/EventsDesktopHeader";
import { SeoFooter } from "@/components/seo";
import { useIsMobile } from "@/hooks/use-mobile";
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
import { AffiliatePageMobile } from "./AffiliatePageMobile";
import { AffiliateArt } from "@/components/affiliate/AffiliateArt";
import { AffiliateHeroLoop } from "@/components/affiliate/AffiliateHeroLoop";
import { AffiliateDotNav } from "@/components/affiliate/AffiliateDotNav";
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
/* /affiliate · desktop — brand backflow of Figma Omenx_Affiliate       */
/* (file p3V2cA7MbmECbwKwhXtur4, frame 42:11744, 2026-09-18).           */
/* Copy is frozen in affiliateContent.ts; this file is the visual layer.*/
/* Container = Lite canonical `max-w-7xl px-4 lg:px-6` → 1232 content.  */
/* ------------------------------------------------------------------ */

const container = "mx-auto w-full max-w-7xl px-4 lg:px-6";
const ext = { target: "_blank", rel: "noopener noreferrer" } as const;

const BENEFIT_ICONS: LucideIcon[] = [CircleDollarSign, Users, Network, Megaphone, Zap, Handshake];

/** Split "Total trading volume" → ["Total", "trading volume"] (design stacks the label after the first word). */
const splitLabel = (label: string) => {
  const i = label.indexOf(" ");
  return i === -1 ? [label] : [label.slice(0, i), label.slice(i + 1)];
};

const Eyebrow = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <span className={cn("block font-sans text-[11px] font-semibold uppercase leading-[15px] tracking-[2px] text-primary", className)}>
    {children}
  </span>
);

const SectionHead = ({
  n,
  eyebrow,
  title,
  subtitle,
  children,
}: {
  n: string;
  eyebrow: string;
  title: string[];
  subtitle?: string;
  children?: React.ReactNode;
}) => (
  <div>
    <Eyebrow>
      {n} · {eyebrow}
    </Eyebrow>
    <h2 className="pt-5 font-display text-[56px] font-medium capitalize leading-[59.9px] text-foreground">
      {title.map((l) => (
        <span key={l} className="block">
          {l}
        </span>
      ))}
    </h2>
    {subtitle && <p className="max-w-[496px] pt-5 font-sans text-sm leading-6 text-muted-foreground">{subtitle}</p>}
    {children}
  </div>
);

/** Exhibit head: full-width illustration block with the 02.x label, title, intro and tag on top. */
const ExhibitHead = ({
  n,
  title,
  intro,
  tag,
  art,
}: {
  n: string;
  title: string;
  intro: string;
  tag: string;
  art: "earn-1-desktop" | "earn-2-desktop";
}) => (
  <div className="relative h-[186px] overflow-hidden">
    <AffiliateArt name={art} width={1224} height={186} className="absolute inset-0 h-full w-full" />
    <div className="relative flex h-full w-[938px] flex-col py-3">
      <Eyebrow>{n}</Eyebrow>
      <div className="mt-2.5 flex flex-1 flex-col justify-between">
        <div>
          <h3 className="font-display text-[30px] font-medium leading-9 text-foreground">{title}</h3>
          <p className="mt-1.5 max-w-[448px] font-sans text-xs leading-[1.4] text-muted-foreground">{intro}</p>
        </div>
        <span className="font-sans text-[10px] uppercase leading-[15px] tracking-[2px] text-white/50">{tag}</span>
      </div>
    </div>
  </div>
);

const Footnote = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-5 font-sans text-xs leading-5 text-[#646972]">{children}</p>
);

/* ------------------------------------------------------------------ */

const AffiliatePage = () => {
  const isMobile = useIsMobile();
  if (isMobile) return <AffiliatePageMobile />;
  return <AffiliatePageDesktop />;
};

const AffiliatePageDesktop = () => {
  // One CTA behaviour for all five Apply surfaces (guest gate / form / portal notice).
  const cta = useAffiliateCta();
  const accentLead = HERO.titleAccent.replace(/\s*OmenX\.?$/, "");

  return (
    <div className="flex min-h-screen flex-col bg-background pb-safe">
      <EventsDesktopHeader />
      <AffiliateDotNav />

      <main className="w-full flex-1">
        {/* ============================== HERO ============================== */}
        <section className="relative overflow-hidden">
          <div className={cn(container, "relative pb-10 pt-[60px]")}>
            <AffiliateHeroLoop variant="desktop" className="absolute left-[601px] top-[55px]" />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 top-[60px]"
              style={{
                backgroundImage:
                  "linear-gradient(180deg, rgba(7,9,17,0) 66%, rgb(7,9,17) 100%), linear-gradient(-90deg, rgba(9,9,15,0) 17%, rgb(9,9,15) 70%)",
              }}
            />
            <div className="relative w-[705px]">
              <Eyebrow>{HERO.eyebrow}</Eyebrow>
              <h1 className="mt-1 font-display text-[72px] font-bold capitalize leading-[84px] tracking-[-1px] text-foreground">
                {HERO.titleLines.map((l) => (
                  <span key={l} className="block">
                    {l}
                  </span>
                ))}
                <span className="block text-primary">
                  {accentLead.split(" ").map((w, i) => (
                    <span key={w} className={cn(i > 0 && "normal-case")}>
                      {i > 0 ? " " : ""}
                      {w}
                    </span>
                  ))}{" "}
                  <span
                    role="img"
                    aria-label="OmenX"
                    className="inline-block h-[0.57em] w-[calc(0.57em*433/65)] bg-current align-baseline"
                    style={{ WebkitMaskImage: `url("${omenxLogoSolid}")`, maskImage: `url("${omenxLogoSolid}")`, WebkitMaskSize: "contain", maskSize: "contain", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat" }}
                  />
                </span>
              </h1>
              <p className="mt-2 max-w-[656px] font-sans text-lg leading-7 text-foreground/60">{HERO.intro}</p>
              <div className="flex items-center gap-4 pt-9">
                <AffiliateApplyButton cta={cta} label={HERO.primaryCta} />
                <a href="#benefits" className="inline-flex h-12 items-center gap-2 px-3 font-sans text-sm font-medium leading-5 text-foreground transition-colors hover:text-primary">
                  {HERO.secondaryCta} <ArrowDown className="h-[15px] w-[15px]" />
                </a>
              </div>
              <p className="pt-6 font-sans text-sm leading-4 text-[#646972]">{HERO.note}</p>
            </div>
          </div>

          {/* Data band — platform snapshot */}
          <div className="border-b border-[#13151D] bg-[#05070E]">
            <div className={cn(container, "pb-14 pt-10")}>
              <div className="flex h-16 items-center justify-between gap-8">
                <p className="font-display text-[30px] font-semibold leading-[1.2] text-[#F5F2EB]">
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
                <div className="flex flex-col items-end gap-1 font-sans text-base leading-[1.2]">
                  <span className="text-muted-foreground">{HERO.snapshotLink}</span>
                  <a href={INSIGHTS_URL} {...ext} className="inline-flex items-center gap-1 text-[#E6E6E6] transition-colors hover:text-primary">
                    {HERO.snapshotLabel} <ArrowUpRight className="h-5 w-5" />
                  </a>
                </div>
              </div>
              <div className="mt-8 h-px w-full bg-[#13151D]" />
              <div className="mt-8 flex items-center justify-between">
                {METRICS.map((s) => (
                  <div key={s.label} className="flex items-end gap-2.5">
                    <span className="font-display text-[60px] font-bold leading-[44px] text-foreground tabular-nums">{s.value}</span>
                    <span className="font-sans text-base uppercase leading-4 text-muted-foreground">
                      {splitLabel(s.label).map((l) => (
                        <span key={l} className="block">
                          {l}
                        </span>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ========================= 01 BENEFITS ========================= */}
        <section id="benefits" className="scroll-mt-16">
          <div className={cn(container, "pb-[104px] pt-10")}>
            <SectionHead n="01" eyebrow={BENEFITS_HEAD.eyebrow} title={BENEFITS_HEAD.title} subtitle={BENEFITS_HEAD.sub} />
            <div className="mt-14 grid grid-cols-3 gap-5">
              {BENEFITS.map((b, i) => {
                const Icon = BENEFIT_ICONS[i];
                return (
                  <article
                    key={b.n}
                    className="rounded-[14px] border border-border/60 bg-[linear-gradient(160deg,rgba(11,15,25,0.78)_6%,rgba(5,7,14,0.92)_94%)] px-7 pb-9 pt-8"
                  >
                    <div className="flex items-start justify-between">
                      <span className="pt-3 font-display text-sm leading-5 text-primary">{b.n}</span>
                      <span className="flex h-11 w-11 items-center justify-center rounded-md border border-primary/20 bg-primary/5 text-primary">
                        <Icon className="h-5 w-5" strokeWidth={1.5} />
                      </span>
                    </div>
                    <h3 className="pt-5 font-display text-[22px] font-medium leading-[27.5px] tracking-[-0.22px] text-foreground">{b.title}</h3>
                    <p className="pt-3 font-sans text-sm leading-[24.4px] text-muted-foreground">{b.body}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* ========================= 02 EARNINGS ========================= */}
        <section id="earnings" className="scroll-mt-16">
          <div className={cn(container, "pb-[111px] pt-10")}>
            <SectionHead n="02" eyebrow={EARNINGS_HEAD.eyebrow} title={EARNINGS_HEAD.title} subtitle={EARNINGS_HEAD.sub} />

            <div className="mt-[30px]">
              <ExhibitHead n="02.1" title={HOW_YOU_EARN.title} intro={HOW_YOU_EARN.intro} tag="Illustrative · monthly" art="earn-1-desktop" />
              <EarningsLedger className="mt-5" />
              <Footnote>{HOW_YOU_EARN.note}</Footnote>
            </div>

            <div className="mt-7">
              <div className="h-px w-full bg-foreground/10" />
              <div className="mt-[30px]">
                <ExhibitHead n="02.2" title={FEE_BASE.title} intro={FEE_BASE.intro} tag="Illustrative · monthly" art="earn-2-desktop" />
              </div>
              <FeeBaseComparison className="mt-[19px]" />
              <Footnote>{FEE_BASE.note}</Footnote>
            </div>
          </div>

          {/* Apply band */}
          <div className="relative h-[260px] overflow-hidden">
            <AffiliateArt name="earn-band-desktop" width={1440} height={260} className="absolute inset-0 h-full w-full" />
            <div className={cn(container, "relative pt-[52px]")}>
              <p className="w-[390px] font-display text-[30px] font-medium capitalize leading-[1.2] tracking-[-1px] text-foreground">{EARNINGS_END.line}</p>
              <AffiliateApplyLink cta={cta} label={EARNINGS_END.cta} className="mt-3 text-[22px] leading-[21px]" />
            </div>
          </div>
        </section>

        {/* ======================== 03 HOW IT WORKS ======================== */}
        <section id="how-it-works" className="scroll-mt-16">
          <div className={cn(container, "pb-[108px] pt-10")}>
            <SectionHead n="03" eyebrow={STEPS_HEAD.eyebrow} title={STEPS_HEAD.title}>
              <div className="pt-7">
                <AffiliateApplyButton cta={cta} label={STEPS_HEAD.cta} className="h-11 px-5 text-base" />
              </div>
            </SectionHead>
            <div className="mt-14 grid grid-cols-3 gap-5">
              {STEPS.map((s) => (
                <div key={s.n} className="min-h-[240px] rounded-lg bg-card p-7">
                  <span className="font-display text-sm leading-5 text-primary">{s.n}</span>
                  <div className="mt-12 font-display text-xl font-medium leading-7 text-foreground">{s.title}</div>
                  <p className="mt-3 font-sans text-sm leading-6 text-muted-foreground">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =========================== 04 MARKETS =========================== */}
        <section id="markets" className="scroll-mt-16">
          <div className={cn(container, "pb-[91px] pt-10")}>
            <SectionHead n="04" eyebrow={MARKETS_HEAD.eyebrow} title={MARKETS_HEAD.title} subtitle={MARKETS_HEAD.sub} />
            <div className="mt-14">
              {MARKETS.map((m, i) => {
                const art = (["market-sports", "market-crypto", "market-finance"] as const)[i];
                const imageFirst = i % 2 === 0;
                const image = (
                  <div className="relative">
                    <AffiliateArt name={art} width={1232} height={752} className="absolute inset-0 h-full w-full" />
                  </div>
                );
                const text = (
                  <div className="flex flex-col justify-center p-12">
                    <Eyebrow>{m.category}</Eyebrow>
                    <h3 className="mt-5 font-display text-[30px] font-medium leading-[1.2] text-foreground">
                      {m.title.map((l) => (
                        <span key={l} className="block">
                          {l}
                        </span>
                      ))}
                    </h3>
                    <p className="mt-5 max-w-[448px] font-sans text-sm leading-6 text-muted-foreground">{m.body}</p>
                    <div className="mt-8 flex items-end gap-3">
                      {m.logos.map((l) => (
                        <div key={l.label} className="flex flex-col items-center">
                          <div className="flex h-[72px] min-w-[72px] items-center justify-center rounded-2xl border border-border/60 bg-card px-3">
                            <img src={l.src} alt="" className="max-h-10 max-w-16 object-contain" loading="lazy" />
                          </div>
                          <span className="mt-2.5 font-display text-xs leading-4 text-muted-foreground">{l.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
                return (
                  <article
                    key={m.category}
                    className={cn(
                      "grid grid-cols-2 overflow-hidden rounded-lg bg-[rgba(5,7,14,0.65)] shadow-[0_22px_70px_rgba(5,7,14,0.45)] ring-1 ring-foreground/5",
                      i === 1 ? "min-h-[347px]" : "min-h-[376px]",
                      i > 0 && "mt-8",
                    )}
                  >
                    {imageFirst ? image : text}
                    {imageFirst ? text : image}
                  </article>
                );
              })}
              <div className="mt-5 flex items-center justify-between gap-6 py-6">
                <p className="font-sans text-[15px] leading-6 text-muted-foreground">
                  <span className="font-semibold text-foreground">{MARKETS_NOTE.strong}</span> {MARKETS_NOTE.body}
                </p>
                <span className="shrink-0 rounded-full border border-accent/70 bg-accent/[0.04] px-3.5 py-1.5 font-display text-xs leading-[19.2px] text-accent/80">
                  {MARKETS_NOTE.chip}
                </span>
              </div>
            </div>
          </div>

          {/* Team proof band */}
          <div className="border-y border-foreground/10">
            <div className={cn(container, "flex items-center justify-between gap-12 py-5")}>
              <p className="py-8 font-display text-[30px] leading-[32.4px] text-foreground">
                {TEAM_PROOF.line.map((l) => (
                  <span key={l} className="block">
                    {l}
                  </span>
                ))}
              </p>
              <div className="flex items-center gap-12" aria-label={TEAM_PROOF.ariaLabel}>
                {TEAM_PROOF.logos.map((l, i) =>
                  l.primary ? (
                    <span key={l.alt} className="inline-flex items-center gap-1.5 font-sans text-[32.78px] font-semibold leading-[45.9px] text-[#B4B5B7]">
                      <img src={l.src} alt="" className="h-[41px] w-[41px] object-contain" loading="lazy" />
                      {l.wordmark}
                    </span>
                  ) : (
                    <img
                      key={l.alt}
                      src={l.src}
                      alt={l.alt}
                      className={cn("w-auto object-contain opacity-70", i === 1 ? "h-11" : "h-7")}
                      loading="lazy"
                    />
                  ),
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ========================= 05 PARTNERSHIPS ========================= */}
        <section id="partners" className="scroll-mt-16">
          <div className={cn(container, "pb-[112px] pt-[112px]")}>
            <SectionHead n="05" eyebrow={PARTNERS_HEAD.eyebrow} title={PARTNERS_HEAD.title} />
            <div className="mt-12 grid grid-cols-2 gap-5">
              {PARTNERS.map((p) => (
                <figure key={p.title} className="overflow-hidden rounded-lg border border-foreground/[0.06] bg-card">
                  <img src={p.src} alt={p.alt} className="h-[340px] w-full object-cover" loading="lazy" />
                  <figcaption className="p-[18px]">
                    <span className="block font-sans text-[10px] font-semibold uppercase leading-[15px] tracking-[2px] text-accent">{p.label}</span>
                    <h3 className="mt-[7px] max-w-[361px] pb-4 font-display text-[30px] leading-[1.2] text-foreground">{p.title}</h3>
                    <p className="border-t border-border pt-2.5 font-sans text-sm leading-6 text-muted-foreground">{p.body}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>

          {/* Built on Base */}
          <div className="border-y border-foreground/10">
            <div className={cn(container, "flex h-[120px] items-center gap-2.5 font-display text-[30px] leading-[22.5px] text-foreground")}>
              <span>{BASE_LINE.pre}</span>
              <img src="/chain-logos/base.svg" alt="Base" className="h-[41px] w-[41px]" loading="lazy" />
              <span>{BASE_LINE.post}</span>
            </div>
          </div>
        </section>

        {/* ============================ 06 FAQ ============================ */}
        <section id="faq" className="scroll-mt-16">
          <div className={cn(container, "grid grid-cols-[421px_1fr] gap-12 py-[112px]")}>
            <div>
              <Eyebrow>{FAQ_HEAD.eyebrow}</Eyebrow>
              <h2 className="mt-5 font-display text-[56px] font-medium leading-[59.9px] text-foreground">{FAQ_HEAD.title}</h2>
              <p className="mt-6 font-sans text-sm leading-5 text-muted-foreground">{FAQ_HEAD.help}</p>
              <a href={`mailto:${CONTACT_EMAIL}`} className="mt-0.5 inline-flex items-center gap-0.5 font-sans text-sm leading-5 text-[#E6E6E7] transition-colors hover:text-primary">
                {CONTACT_EMAIL} <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
            <AffiliateFaq size="lg" />
          </div>
        </section>

        {/* ============================== CTA ============================== */}
        <section id="apply" className="relative scroll-mt-16 overflow-hidden bg-[#05070E]">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-[364px] h-[968px] w-[1768px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: "radial-gradient(ellipse at center, rgba(29,206,248,0.16) 0%, rgba(29,206,248,0) 72%)" }}
          />
          <AffiliateArt name="cta-mosaic" width={1440} height={486} fit="contain" position="center bottom" className="absolute inset-x-0 bottom-0 h-[486px] w-full" />

          <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center px-12 pb-[112px] pt-10 text-center">
            <Eyebrow className="text-[10px]">{APPLY.eyebrow}</Eyebrow>
            <h2 className="mt-6 font-display text-[72px] font-semibold capitalize leading-[73.44px] text-foreground">
              <span className="block">{APPLY.title}</span>
              <span className="block text-primary">{APPLY.titleAccent}</span>
            </h2>
            <p className="mt-7 max-w-[576px] font-sans text-sm leading-6 text-muted-foreground">{APPLY.body}</p>
            <AffiliateApplyButton cta={cta} label={APPLY.cta} className="mt-9 px-7" />
            <p className="mt-8 font-sans text-xs leading-4 text-[#646972]">{APPLY.contactLead}</p>
            <a href={`mailto:${CONTACT_EMAIL}`} className="mt-2 font-sans text-sm leading-5 text-foreground transition-colors hover:text-primary">
              {CONTACT_EMAIL}
            </a>
            <p className="mt-8 max-w-[420px] font-sans text-[10px] leading-5 text-[#646972]">{DISCLAIMER}</p>
          </div>
        </section>
      </main>

      <SeoFooter />
      {cta.overlays}
    </div>
  );
};

export default AffiliatePage;
