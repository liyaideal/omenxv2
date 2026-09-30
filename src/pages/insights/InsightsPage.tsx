/**
 * /insights — the whole platform's "now" on one screen (CPO 批 2026-09-28, insights-ia-mock v3 ① + mobile mock ①).
 * Sections: platform strip · 01 crypto next-to-settle · 02 stocks today · 03 sports live & next 24h ·
 * 04 events biggest moves · 05 is the crowd right? · platform line · how computed · cite.
 * Every row is a door to a sub-page. No tabs, no lazy lists (omenx-seo-geo R1/R2).
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { useSeoHead } from "@/lib/seo/head";
import { SITE_URL } from "@/lib/site";
import { InsightsShell } from "@/components/insightsSeo/InsightsShell";
import { LoadingState } from "@/components/states";
import { useInsightsSeo } from "@/hooks/useInsightsSeo";
import { useAccuracy, useSeriesList } from "@/hooks/useInsightsSeries";
import { DataFooter, Chip, FavTag, Hit, LivePill, List, Name, Responsive, Row, SeriesOpening, SeriesSection, SettlesIn, Strip, Table, Td, Th, UpDownPair } from "@/components/insightsSeo/seriesParts";
import { INSIGHTS_PATH, deltaPct, fmtDate, fmtInt, fmtPct, fmtUsd, gainers, isoDate, losers, marketPath, categoryLabelForKey, categorySlugFor, isQuickRound } from "@/lib/insights";
import { c, hhmm, isStock, minsShort, roundSpan, seriesPath, sessionDay, type SeriesAsset } from "@/lib/insights/series";
import { buildFixtures, liveLabel, sportPath, type Fixture } from "@/lib/insights/sports";
import { cn } from "@/lib/utils";

const HOUR = 36e5;

const InsightsPage = () => {
  const [now] = useState(() => new Date());
  const [win] = useState(() => ({ from: new Date(now.getTime() - 24 * HOUR), to: now }));
  const [accWin] = useState(() => ({ from: new Date(now.getTime() - 30 * 24 * HOUR), to: now }));
  const seo = useInsightsSeo(win);
  const { data: assets } = useSeriesList();
  const { data: acc } = useAccuracy(accWin.from, accWin.to);
  const asOf = seo.stats?.as_of ?? now.toISOString();
  const isLoading = seo.isLoading || !assets;

  const crypto = (assets ?? []).filter((a) => a.family === "crypto");
  const stocks = (assets ?? []).filter((a) => isStock(a.family)).sort((a, b) => b.vol_24h - a.vol_24h);
  const fixtures = buildFixtures(seo.events).filter((f) => f.live || (f.kickoff && new Date(f.kickoff).getTime() - now.getTime() < 24 * HOUR)).slice(0, 8);
  const eventRows = seo.rows.filter((r) => !isQuickRound(r.event) && r.event.event_subtype !== "SPORTS_MATCH" && !/UPDOWN/.test(r.event.event_subtype ?? "") && new Date(r.event.end_date).getTime() - now.getTime() < 365 * 864e5);
  const moves = [...gainers(eventRows), ...losers(eventRows)].sort((a, b) => Math.abs(b.move!.delta) - Math.abs(a.move!.delta)).slice(0, 8);
  const eventsFallback = moves.length >= 3 ? moves : [...eventRows].sort((a, b) => b.activity.volume - a.activity.volume).slice(0, 8);
  const best = acc?.by_asset[0]; const worst = acc?.by_asset[acc.by_asset.length - 1];

  useSeoHead({
    title: "Prediction Market Data — What OmenX Traders Are Betting Right Now",
    description: "Live odds from a leveraged prediction market on Base: 5-minute to daily Up-or-Down rounds on crypto and stocks, sports lines and world events, plus how often the crowd is right.",
    path: INSIGHTS_PATH, hreflang: true,
    jsonLd: assets ? [{ "@context": "https://schema.org", "@type": "Dataset", name: "OmenX prediction market data — live odds", url: `${SITE_URL}${INSIGHTS_PATH}`, dateModified: asOf, creator: { "@type": "Organization", name: "OmenX", url: SITE_URL },
      hasPart: assets.map((a) => ({ "@type": "Dataset", name: `${a.asset} Up or Down`, url: `${SITE_URL}${seriesPath(a)}` })) }] : [],
  }, [asOf, assets?.length ?? 0]);

  return (
    <InsightsShell>
      <SeriesOpening eyebrow="OmenX Insights · Live prediction market data" title="Prediction Market Data — What OmenX Traders Are Betting Right Now"
        lede={<>Live odds from a <b>leveraged prediction market</b> on Base: 5-minute to daily <b>Up-or-Down</b> rounds on crypto and stocks, sports lines and world events. Every market has a Down side, and every round settles on a public reference index.</>}
        asOf={seo.stats ? asOf : undefined} />
      {isLoading && <LoadingState variant="skeleton" skeletonRows={6} />}
      {!isLoading && (
        <>
          {seo.stats && (
            <Strip cells={[
              { l: "Traded 24h", v: fmtUsd(seo.stats.volume_24h), d: <span className={deltaPct(seo.stats.volume_24h, seo.stats.volume_prev_24h) >= 0 ? "text-trading-green" : "text-trading-red"}>{deltaPct(seo.stats.volume_24h, seo.stats.volume_prev_24h) >= 0 ? "▲" : "▼"} {fmtPct(deltaPct(seo.stats.volume_24h, seo.stats.volume_prev_24h))}</span> },
              { l: "Settled 24h", v: fmtInt(acc?.rounds_24h ?? 0), d: "rounds" },
              { l: "Live markets", v: fmtInt(seo.stats.active_markets), d: `${assets?.length ?? 0} assets · ${fixtures.length} matches` },
              { l: "Majority right · today", v: <Hit v={acc?.hit_today ?? null} />, d: `30d avg ${acc?.hit ?? "—"}%` },
            ]} />
          )}

          <SeriesSection n="01" title="Crypto · next round to settle" more={{ label: "All crypto rounds", to: "/insights/crypto" }}
            intro="Each asset runs 5-minute, 15-minute, 1-hour, 4-hour and daily rounds at the same time. This shows the round settling next; the asset page shows all five.">
            <Responsive
              desktop={
                <Table head={<><Th>Asset</Th><Th w={160}>Round (UTC)</Th><Th w={280}>Up · Down price</Th><Th w={100} r>Settles in</Th><Th w={130} r>Rounds today</Th><Th w={160} r>Majority right · today</Th><Th w={120} r>Traded 24h</Th></>}>
                  {crypto.map((a) => <AssetTr key={a.slug} a={a} />)}
                </Table>}
              mobile={<List>{crypto.map((a) => <AssetRow key={a.slug} a={a} />)}</List>} />
          </SeriesSection>

          <SeriesSection n="02" title="Stocks · today's session" more={{ label: `All ${stocks.length} stocks`, to: "/insights/stocks" }}>
            <Responsive
              desktop={
                <Table head={<><Th>Stock</Th><Th w={150}>Session</Th><Th w={280}>Up · Down price</Th><Th w={140} r>Settles</Th><Th w={170} r>Majority right · 30d</Th><Th w={120} r>Traded 24h</Th></>}>
                  {stocks.slice(0, 8).map((a) => <AssetTr key={a.slug} a={a} />)}
                </Table>}
              mobile={<List>{stocks.slice(0, 6).map((a) => <AssetRow key={a.slug} a={a} />)}</List>} />
          </SeriesSection>

          <SeriesSection n="03" title="Sports · live & next 24 hours" more={{ label: "All sports", to: "/insights/sports" }}>
            {fixtures.length === 0 ? <Empty>No matches live or starting in the next 24 hours.</Empty> : (
              <Responsive
                desktop={
                  <Table head={<><Th>Match</Th><Th w={150}>League</Th><Th w={170}>Status (UTC)</Th><Th w={240}>Crowd favourite · price</Th><Th w={170}>Goals / maps line</Th><Th w={120} r>Traded</Th></>}>
                    {fixtures.map((f) => <FixtureTr key={f.id} f={f} />)}
                  </Table>}
                mobile={<List>{fixtures.slice(0, 5).map((f) => <FixtureRow key={f.id} f={f} />)}</List>} />
            )}
          </SeriesSection>

          <SeriesSection n="04" title={moves.length >= 3 ? "Events · biggest moves 24h" : "Events · most traded 24h"} more={{ label: "By category", to: "/insights/category/politics" }}>
            {eventsFallback.length === 0 ? <Empty>No event markets open right now.</Empty> : (
              <Responsive
                desktop={
                  <Table head={<><Th>Market</Th><Th w={320}>Probability</Th><Th w={110} r>Vol 24h</Th><Th w={130} r>Closes</Th></>}>
                    {eventsFallback.map((r) => (
                      <tr key={r.event.id} onClick={() => (window.location.href = marketPath(r.event))}>
                        <Td><article data-market-id={r.event.id} className="flex items-center gap-2"><h3 className="truncate text-[13px] font-semibold"><Link to={marketPath(r.event)}>{r.event.name}</Link></h3><Link to={`/insights/category/${categorySlugFor(r.event.category)}`} className="flex-none rounded border border-[#262A31] px-1.5 py-[3px] font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/70">{categoryLabelForKey(r.event.category)}</Link></article></Td>
                        <Td><span className="inline-flex items-center gap-2.5"><span className="w-20 truncate font-mono text-[12px]">{r.lead.label}</span><b className="font-mono text-[15px] tabular-nums">{r.probability}%</b>{r.move && <span className={cn("w-[74px] font-mono text-[11px]", r.move.delta > 0 ? "text-trading-green" : r.move.delta < 0 ? "text-trading-red" : "text-muted-foreground")}>{r.move.delta > 0 ? "+" : ""}{Math.round(r.move.delta)}% today</span>}<span className="relative h-1 w-20 overflow-hidden rounded-sm bg-[#262A31]"><i className="absolute inset-y-0 left-0 bg-primary" style={{ width: `${r.probability}%` }} /></span></span></Td>
                        <Td r mono>{fmtUsd(r.activity.volume)}</Td>
                        <Td r mono dim><time dateTime={r.event.end_date}>{fmtDate(r.event.end_date)}</time></Td>
                      </tr>
                    ))}
                  </Table>}
                mobile={<List>{eventsFallback.slice(0, 5).map((r) => (
                  <Row key={r.event.id} to={marketPath(r.event)} l1={<Name>{r.event.name}</Name>} l2={<><span className="font-mono text-[12px]">{r.lead.label} <b className="text-[15px] font-semibold">{r.probability}%</b></span>{r.move && <span className={cn("font-mono text-[12px]", r.move.delta > 0 ? "text-trading-green" : r.move.delta < 0 ? "text-trading-red" : "text-muted-foreground")}>{r.move.delta > 0 ? "+" : ""}{Math.round(r.move.delta)}% today</span>}</>} />
                ))}</List>} />
            )}
          </SeriesSection>

          {acc && (
            <SeriesSection n="05" title="Is the crowd right?" more={{ label: "Full accuracy report", to: "/insights/accuracy" }}>
              <Strip cells={[
                { l: "Majority right · 30d", v: <Hit v={acc.hit} />, d: `${fmtInt(acc.rounds)} rounds` },
                { l: "Most reliable", v: best ? <Link to={seriesPath(best)}>{best.ticker ?? best.asset} <Hit v={best.hit} /></Link> : "—", d: best ? `${best.family === "crypto" ? "crypto" : best.family.toUpperCase()} · ${best.family === "crypto" ? "rounds" : "daily"}` : undefined },
                { l: "Least reliable", v: worst ? <Link to={seriesPath(worst)}>{worst.ticker ?? worst.asset} <Hit v={worst.hit} /></Link> : "—", d: worst ? `${worst.family === "crypto" ? "crypto" : worst.family.toUpperCase()} · ${worst.family === "crypto" ? "rounds" : "daily"}` : undefined },
                { l: "Best round length", v: bestLen(acc.by_len), d: "crypto" },
              ]} />
            </SeriesSection>
          )}

          <DataFooter legend={<>In every round, the side priced above 50¢ is the <b className="font-medium text-foreground">majority</b> — the side more money is on. <b className="font-medium text-foreground">Majority right</b> is how often that side actually won. Prices are the last trade; "traded" is USDC volume. Numbers refresh every 15 minutes; all times are UTC.</>} sentence={`According to OmenX prediction market data, traders settled ${fmtInt(acc?.rounds_24h ?? 0)} Up-or-Down rounds in the 24 hours to ${fmtDate(asOf)} ${hhmm(asOf)} UTC, with the majority right ${acc?.hit_today ?? "—"}% of the time.`} url={`${SITE_URL}${INSIGHTS_PATH}`} />
          <p className="mt-6 font-mono text-[11px] text-muted-foreground/70">Daily digest: <Link to={`/insights/daily/${isoDate(now)}`} className="text-primary">{fmtDate(now)} →</Link></p>
        </>
      )}
    </InsightsShell>
  );
};

const bestLen = (by: { mins: number; rounds: number; hit: number }[]) => {
  const b = [...by].filter((x) => x.rounds >= 20).sort((a, b) => b.hit - a.hit)[0];
  return b ? <>{minsShort(b.mins)} · <Hit v={b.hit} /></> : "—";
};

const Empty = ({ children }: { children: React.ReactNode }) => <div className="rounded-xl border border-dashed border-[#262A31] px-4 py-6 text-center text-[13px] text-muted-foreground">{children}</div>;

const AssetTr = ({ a }: { a: SeriesAsset }) => {
  const stock = isStock(a.family); const l = a.live;
  return (
    <tr onClick={() => (window.location.href = seriesPath(a))}>
      <Td><span className="inline-flex items-center gap-2"><Link to={seriesPath(a)} className="text-[13px] font-semibold">{a.asset}</Link>{stock ? <small className="text-[11px] text-muted-foreground/70">{a.ticker}</small> : l && <Chip>{minsShort(l.mins)} round</Chip>}</span></Td>
      <Td mono dim>{l ? (stock ? sessionDay(l.end) : roundSpan(l)) : "—"}</Td>
      <Td>{l ? <UpDownPair up={l.up_price} down={l.down_price} /> : <span className="text-muted-foreground">no live {stock ? "session" : "round"}</span>}</Td>
      <Td r mono>{l ? (stock ? (new Date(l.end).getTime() < Date.now() ? <span className="text-muted-foreground">settling</span> : `${hhmm(l.end)} UTC`) : <SettlesIn end={l.end} />) : "—"}</Td>
      {!stock && <Td r mono>{fmtInt(a.rounds_today)}</Td>}
      <Td r><Hit v={stock ? a.hit_30d : a.hit_today} /></Td>
      <Td r mono>{fmtUsd(a.vol_24h)}</Td>
    </tr>
  );
};
const AssetRow = ({ a }: { a: SeriesAsset }) => {
  const stock = isStock(a.family); const l = a.live;
  return (
    <Row to={seriesPath(a)}
      l1={<><Name sub={stock ? a.ticker ?? undefined : undefined} chip={!stock && l ? minsShort(l.mins) : undefined}>{a.asset}</Name><span className="font-mono text-[12px] text-muted-foreground">{l ? (stock ? `settles ${hhmm(l.end)} UTC` : <>settles in <SettlesIn end={l.end} className="text-foreground" /></>) : "closed"}</span></>}
      l2={l ? <><UpDownPair up={l.up_price} down={l.down_price} size="sm" /><span className="font-mono text-[12px]"><Hit v={stock ? a.hit_30d : a.hit_today} /> <span className="text-muted-foreground">right{stock ? " · 30d" : " today"}</span></span></> : undefined} />
  );
};

const FixtureTr = ({ f }: { f: Fixture }) => (
  <tr onClick={() => (window.location.href = marketPath(f.main))}>
    <Td><span className="inline-flex items-center gap-2"><Link to={marketPath(f.main)} className="text-[13px] font-semibold">{f.name}</Link></span></Td>
    <Td dim>{f.league}</Td>
    <Td mono>{f.live ? <LivePill label={liveLabel(f)} /> : liveLabel(f)}</Td>
    <Td>{f.favourite ? <FavTag label={f.favourite.label} price={f.favourite.price} /> : "—"}</Td>
    <Td mono dim>{f.line ? `${f.line.label} · ${c(f.line.price)}` : "—"}</Td>
    <Td r mono>{fmtUsd(f.volume)}</Td>
  </tr>
);
const FixtureRow = ({ f }: { f: Fixture }) => (
  <Row to={marketPath(f.main)} l1={<><Name sub={f.league}>{f.name}</Name>{f.live ? <LivePill label={liveLabel(f)} /> : <span className="font-mono text-[12px] text-muted-foreground">{liveLabel(f)}</span>}</>}
    l2={<>{f.favourite ? <FavTag label={f.favourite.label} price={f.favourite.price} /> : <span />}{f.line && <span className="font-mono text-[12px] text-muted-foreground">{f.line.label} · {c(f.line.price)}</span>}</>} />
);

export default InsightsPage;
