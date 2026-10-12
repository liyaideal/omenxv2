/**
 * /insights/sports · /insights/sports/:sport — one match per row (mock ③): now → upcoming → settled → cite.
 * Lovable has no settled sports history, so the "past" block reads from whatever resolved fixtures exist in the window.
 */
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSeoHead } from "@/lib/seo/head";
import { SITE_URL } from "@/lib/site";
import { InsightsShell } from "@/components/insightsSeo/InsightsShell";
import { LoadingState } from "@/components/states";
import { useInsightsSeo } from "@/hooks/useInsightsSeo";
import { cn } from "@/lib/utils";
import { HERO_ART } from "@/lib/insights/art";
import { DataFooter, FavTag, Hit, LiveCard, LivePill, List, Name, Responsive, RightWrong, Row, SeriesOpening, SeriesSection, StickyCta, Table, Td, Th } from "@/components/insightsSeo/seriesParts";
import { fmtInt, fmtUsd, marketPath } from "@/lib/insights";
import { c } from "@/lib/insights/series";
import { buildFixtures, kickoffLong, liveLabel, settleWord, sportLabel, sportPath, type Fixture } from "@/lib/insights/sports";

const DAY = 864e5;

const InsightsSportsPage = () => {
  const { sport } = useParams();
  const [now] = useState(() => new Date());
  const [win] = useState(() => ({ from: new Date(now.getTime() - 30 * DAY), to: now }));
  const seo = useInsightsSeo(win, { includeResolved: true, resolvedSubtypes: ["SPORTS_RESULT", "SPORTS_MATCH"] });
  const all = buildFixtures(seo.events, now.getTime());
  const settledAll = buildFixtures(seo.resolvedEvents, now.getTime()).filter((f) => f.settled);
  const sports = [...new Set([...all, ...settledAll].map((f) => f.sport))];
  const list = sport ? all.filter((f) => f.sport === sport) : all;
  const settled = (sport ? settledAll.filter((f) => f.sport === sport) : settledAll).slice(0, 12);
  const live = list.filter((f) => f.live);
  const upcoming = list.filter((f) => !f.live && f.kickoff && new Date(f.kickoff).getTime() - now.getTime() < 7 * DAY).slice(0, 12);
  const hero = live[0] ?? upcoming[0] ?? null;
  const label = sport ? sportLabel(sport) : "Sports";
  const leagues = [...new Set(list.map((f) => f.league).filter(Boolean))];
  const favWon = settled.filter((f) => f.favouriteWon != null);
  const favWinPct = favWon.length ? Math.round((100 * favWon.filter((f) => f.favouriteWon).length) / favWon.length) : null;
  const upset = settled.filter((f) => f.favouriteWon === false && f.favourite).sort((a, b) => (b.favourite!.price) - (a.favourite!.price))[0];
  const path = sport ? sportPath(sport) : "/insights/sports";
  const title = sport ? `${label} Prediction Market Odds — Who the Crowd Backs | OmenX` : "Sports Prediction Market Odds — Who the Crowd Backs | OmenX";
  useSeoHead({ title, description: `${label} match winner, handicap and totals lines priced by OmenX traders, settled on the ${sport ? settleWord(sport) : "official result"}. Live matches, the next seven days, and whether the favourite won.`, path, hreflang: true,
    jsonLd: [{ "@context": "https://schema.org", "@type": "ItemList", name: title, itemListElement: [...live, ...upcoming].slice(0, 20).map((f, i) => ({ "@type": "ListItem", position: i + 1, item: { "@type": "SportsEvent", name: f.name, startDate: f.kickoff ?? undefined, url: `${SITE_URL}${marketPath(f.main)}` } })) }] }, [list.length, sport ?? ""]);

  return (
    <InsightsShell mobileTitle={label}>
      <SeriesOpening art={HERO_ART.sports}
        eyebrow={`OmenX Insights · Sports${sport ? ` · ${label}` : ""}`} title={`${label} Prediction Market Odds — Who the Crowd Backs`}
        lede={<>Match winner, handicap and totals lines{leagues.length ? <> across {leagues.slice(0, 6).join(", ")}</> : null} — priced by OmenX traders, settled on the {sport ? settleWord(sport) : "official result"}.</>} asOf={seo.stats?.as_of} />
      {seo.isLoading && <LoadingState variant="skeleton" skeletonRows={6} />}
      {!seo.isLoading && (
        <>
          {/* Sport filter chips — Figma 1001:15945 (pill 11px mono tracking .08em, border #1D2026, px-12 py-6, gap 8). Shown on every sports page (draft #8, CPO 2026-10-12); active chip = primary. Counts = live + upcoming matches. */}
          {sports.length > 1 && (
            <div className="mb-6 flex flex-wrap gap-2 md:mb-8">
              {[["", "All", all.length] as const, ...sports.map((s) => [s, sportLabel(s), all.filter((f) => f.sport === s).length] as const)].map(([key, name, n]) => {
                const active = (sport ?? "") === key;
                return <Link key={key || "all"} to={key ? sportPath(key) : "/insights/sports"} aria-current={active ? "page" : undefined} className={cn("rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.08em] transition-colors", active ? "border-primary/50 text-primary" : "border-[#1D2026] text-muted-foreground hover:text-primary")}>{name} · {n}</Link>;
              })}
            </div>
          )}
          {/* Sports overview — Figma 1001:15954 (pc): Live card 600 | right column 616 = three tiles (205 × 153, 40px numbers, unit on its own line) over a full-width "Biggest upset" card (131). Mobile 1004:1502: stacked. */}
          <div className="mb-8 grid gap-4 md:mb-10 md:grid-cols-[600px_minmax(0,1fr)]">
            <div>
              {hero && hero.favourite && hero.main.options.length >= 2 ? (() => {
                const opts = hero.main.options.map((o) => ({ ...o, price: Number(o.price) })).filter((o) => !/^draw$/i.test(o.label)).sort((a, b) => b.price - a.price);
                const round = { event_id: hero.main.id, mins: 0, start: hero.kickoff ?? "", end: hero.end ?? "", freeze: null, up_price: opts[0].price, down_price: opts[1]?.price ?? 1 - opts[0].price, volume: hero.volume };
                return <LiveCard eyebrow={hero.live ? `Now · ${hero.league}` : `Next · ${hero.league}`} when={hero.live ? liveLabel(hero) : kickoffLong(hero.kickoff)} upLabel={opts[0].label} downLabel={opts[1]?.label ?? "Other"} round={round}
                  sub={<>To win: more money is on <b className="font-semibold text-yes">{opts[0].label}</b> — {c(opts[0].price)} vs {c(opts[1]?.price ?? 0)}.{hero.line && <> {hero.line.kind === "goals" ? "Total goals" : hero.line.kind === "maps" ? "Maps" : hero.line.kind === "rounds" ? "Rounds" : "Total points"}: <b className="font-semibold text-foreground">{hero.line.label} {c(hero.line.price)}</b>.</>}</>}
                  foot={<>{fmtUsd(hero.volume)} traded · settles on the {settleWord(hero.sport)}</>} cta={{ label: "Trade this match", to: marketPath(hero.main) }} />;
              })() : <div className="trading-card flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">No {label.toLowerCase()} matches open right now.</div>}
            </div>
            <div className="grid gap-4">
              <dl className="grid grid-cols-3 overflow-hidden rounded-xl border border-[#1D2026] bg-card">
                {[
                  { l: "Matches this week", v: fmtInt(list.filter((f) => f.live || (f.kickoff && new Date(f.kickoff).getTime() - now.getTime() < 7 * DAY)).length), d: `${leagues.length} leagues · ${live.length} live now` },
                  { l: "Favourite won in", v: favWinPct == null ? "—" : <span className={favWinPct >= 55 ? "text-trading-green" : favWinPct <= 45 ? "text-trading-red" : undefined}>{favWinPct}%</span>, unit: favWinPct == null ? undefined : "of matches", d: favWon.length ? `last 30 days · ${favWon.length} settled` : "no settled matches yet" },
                  { l: "Went over the line", v: settled.filter((f) => f.overWon != null).length ? `${Math.round((100 * settled.filter((f) => f.overWon).length) / settled.filter((f) => f.overWon != null).length)}%` : "—", unit: settled.filter((f) => f.overWon != null).length ? "of matches" : undefined, d: "totals line · last 30 days" },
                ].map((t, i) => (
                  <div key={t.l} className={cn("min-w-0 px-3 py-4 md:px-[18px] md:py-5", i > 0 && "border-l border-[#1D2026]")}>
                    <dt className="font-mono text-[10px] font-medium uppercase leading-[14px] tracking-[0.1em] text-muted-foreground md:text-[11px]">{t.l}</dt>
                    <dd className="mt-1.5 truncate font-display text-[26px] font-bold leading-[1.3] tracking-[-0.015em] tabular-nums md:text-[40px]">{t.v}</dd>
                    {t.unit && <dd className="font-mono text-[11px] font-medium leading-[14px] text-muted-foreground">{t.unit}</dd>}
                    <dd className="mt-1.5 truncate font-mono text-[10px] leading-[14px] text-muted-foreground/70 md:text-[11px]">{t.d}</dd>
                  </div>
                ))}
              </dl>
              <div className="rounded-xl border border-[#1D2026] bg-card px-5 py-5 md:px-6">
                <div className="font-mono text-[10px] font-medium uppercase leading-[14px] tracking-[0.1em] text-muted-foreground md:text-[11px]">Biggest upset</div>
                <div className="mt-1.5 truncate font-display text-[24px] font-bold leading-[1.2] tracking-[-0.015em] md:text-[32px]">{upset ? <>{upset.name}{upset.score ? ` · ${upset.score}` : ""}</> : "—"}</div>
                <div className="mt-1.5 font-mono text-[11px] leading-[14px] text-muted-foreground/70">{upset ? <>{upset.favourite!.label} was priced <b className="font-medium text-muted-foreground">{c(upset.favourite!.price)}</b> to win</> : "no upset in the last 30 days"}</div>
              </div>
            </div>
          </div>

          <SeriesSection n="01" title="Upcoming — who the crowd backs" meta={`Next 7 days · ${upcoming.length} matches`}>
            {upcoming.length === 0 ? <Empty>No matches scheduled in the next seven days.</Empty> : (
              <Responsive
                desktop={<Table head={<><Th>Match</Th><Th w={160}>League</Th><Th w={170}>Kick-off (UTC)</Th><Th w={240}>Crowd favourite · price</Th><Th w={170}>Line</Th><Th w={120} r>Traded</Th></>}>{upcoming.map((f) => <Tr key={f.id} f={f} />)}</Table>}
                mobile={<List>{upcoming.map((f) => <MRow key={f.id} f={f} />)}</List>} />
            )}
          </SeriesSection>

          <SeriesSection n="02" title="Settled — was the crowd right?" meta={`Last 30 days · ${settled.length} matches`}>
            {settled.length === 0 ? <Empty>No settled matches in the last 30 days yet — results appear here as matches finish.</Empty> : (
              <Responsive
                desktop={<Table head={<><Th>Match</Th><Th w={160}>League</Th><Th w={120}>Result</Th><Th w={240}>Crowd favourite · price</Th><Th w={190}>Favourite was…</Th><Th w={120} r>Traded</Th></>}>
                  {settled.map((f) => <tr key={f.id} onClick={() => (window.location.href = marketPath(f.main))}><Td><Link to={marketPath(f.main)} className="text-[13px] font-semibold">{f.name}</Link></Td><Td dim>{f.league}</Td><Td mono>{f.score ?? "—"}</Td><Td>{f.favourite ? <FavTag label={f.favourite.label} price={f.favourite.price} /> : "—"}</Td><Td>{f.favouriteWon == null ? "—" : <RightWrong ok={f.favouriteWon} note={f.draw ? "draw" : !f.favouriteWon && f.favourite && f.favourite.price >= 0.7 ? "upset" : undefined} />}</Td><Td r mono dim>{fmtUsd(f.volume)}</Td></tr>)}
                </Table>}
                mobile={<List>{settled.map((f) => <Row key={f.id} to={marketPath(f.main)} l1={<><Name sub={f.league}>{f.name}</Name><span className="font-mono text-[12px]">{f.score ?? ""}</span></>} l2={<>{f.favourite ? <FavTag label={f.favourite.label} price={f.favourite.price} /> : <span />}<span className="text-[12px]">{f.favouriteWon == null ? "—" : <RightWrong ok={f.favouriteWon} note={f.draw ? "draw" : undefined} />}</span></>} />)}</List>} />
            )}
          </SeriesSection>

          <DataFooter settle={`Settles on the ${sport ? settleWord(sport) : "official result"}`} legend={<>The <b className="font-medium text-foreground">crowd favourite</b> is the team priced above 50¢ to win at kick-off — the side more money is on. <b className="font-medium text-foreground">Favourite won</b> is how often that team actually won; a draw counts as the favourite losing. Matches settle on the {sport ? settleWord(sport) : "official result"}. All times are UTC.</>} sentence={favWinPct == null ? `According to OmenX prediction market data, ${list.length} ${label.toLowerCase()} matches are open for trading as of ${now.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}.` : `According to OmenX prediction market data, the crowd favourite won ${favWinPct}% of ${label.toLowerCase()} matches settled in the 30 days to ${now.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}.`} url={`${SITE_URL}${path}`} />
          {hero && <StickyCta to={marketPath(hero.main)} label={`Trade ${hero.name}`} sub={hero.live ? "live" : undefined} />}
        </>
      )}
    </InsightsShell>
  );
};

const Empty = ({ children }: { children: React.ReactNode }) => <div className="rounded-xl border border-dashed border-[#262A31] px-4 py-6 text-center text-[13px] text-muted-foreground">{children}</div>;
const Tr = ({ f }: { f: Fixture }) => (
  <tr onClick={() => (window.location.href = marketPath(f.main))}>
    <Td><Link to={marketPath(f.main)} className="text-[13px] font-semibold">{f.name}</Link></Td><Td dim>{f.league}</Td><Td mono>{f.live ? <LivePill label={liveLabel(f)} /> : kickoffLong(f.kickoff)}</Td>
    <Td>{f.favourite ? <FavTag label={f.favourite.label} price={f.favourite.price} /> : "—"}</Td><Td mono dim>{f.line ? `${f.line.label} · ${c(f.line.price)}` : "—"}</Td><Td r mono>{fmtUsd(f.volume)}</Td>
  </tr>
);
const MRow = ({ f }: { f: Fixture }) => (
  <Row to={marketPath(f.main)} l1={<><Name sub={f.league}>{f.name}</Name>{f.live ? <LivePill label={liveLabel(f)} /> : <span className="font-mono text-[12px] text-muted-foreground">{liveLabel(f)}</span>}</>}
    l2={<>{f.favourite ? <FavTag label={f.favourite.label} price={f.favourite.price} /> : <span />}{f.line && <span className="font-mono text-[12px] text-muted-foreground">{f.line.label} · {c(f.line.price)}</span>}</>} />
);

export default InsightsSportsPage;
