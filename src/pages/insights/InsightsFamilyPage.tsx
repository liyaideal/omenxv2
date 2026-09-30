/**
 * /insights/crypto · /insights/stocks — hub for one Up-or-Down family: every asset, its live round, and the crowd's 30-day record.
 */
import { useSeoHead } from "@/lib/seo/head";
import { SITE_URL } from "@/lib/site";
import { InsightsShell } from "@/components/insightsSeo/InsightsShell";
import { LoadingState } from "@/components/states";
import { useSeriesList } from "@/hooks/useInsightsSeries";
import { DataFooter, Chip, Hit, List, Name, Responsive, Row, SeriesOpening, SeriesSection, SettlesIn, Table, Td, Th, UpDownPair } from "@/components/insightsSeo/seriesParts";
import { fmtInt, fmtUsd } from "@/lib/insights";
import { familyFromPath, hhmm, isStock, minsNoun, minsShort, roundSpan, roundTradePath, seriesPath, sessionDay, type LiveRound, type SeriesAsset } from "@/lib/insights/series";
import { Link } from "react-router-dom";

const InsightsFamilyPage = ({ family }: { family: "crypto" | "stocks" }) => {
  const { data, isLoading } = useSeriesList();
  const fams = familyFromPath(family);
  const list = (data ?? []).filter((a) => fams.includes(a.family));
  const crypto = family === "crypto";
  const title = crypto ? "Crypto Up or Down — Live Prediction Market Odds on Bitcoin, Ethereum & Solana" : "Stock Up or Down Today — Prediction Market Odds on US & HK Stocks";
  const asOf = new Date().toISOString();
  useSeoHead({ title, description: crypto ? "Every 5 minutes to daily, OmenX traders bet whether BTC, ETH and SOL close higher or lower. Live odds and how often the majority is right." : "Will Apple, Tesla, Tencent close higher today? Live OmenX prediction market odds for 16 US and Hong Kong stocks, with the crowd's 30-day record.", path: `/insights/${family}`, hreflang: true, jsonLd: data ? [{ "@context": "https://schema.org", "@type": "ItemList", name: title, itemListElement: list.map((a, i) => ({ "@type": "ListItem", position: i + 1, name: `${a.asset} Up or Down`, url: `${SITE_URL}${seriesPath(a)}` })) }] : [] }, [data?.length ?? 0]);
  return (
    <InsightsShell mobileTitle={crypto ? "Crypto · Up or Down" : "Stocks · Up or Down"}>
      <SeriesOpening eyebrow={`OmenX Insights · ${crypto ? "Crypto" : "US & HK stocks"} · Up or down`}
        title={crypto ? "Crypto Up or Down — Live Prediction Market Odds" : "Stock Up or Down Today — Prediction Market Odds"}
        lede={crypto ? <>Bitcoin, Ethereum and Solana each run 5-minute, 15-minute, 1-hour, 4-hour and daily rounds. One row per asset: the round settling next and how often the majority has been right.</> : <>Each trading day OmenX traders bet whether a stock closes above its previous close. One row per stock: today's session and the majority's 30-day record.</>}
        asOf={asOf} />
      {isLoading && <LoadingState variant="skeleton" skeletonRows={6} />}
      {!isLoading && (
        <>
          <SeriesSection n="01" title={crypto ? "Every open round — all five lengths" : "Today's session"} meta={crypto ? `${list.length} assets · ${list.reduce((n, a) => n + a.live_all.length, 0)} rounds` : `${list.length} assets`}
            intro={crypto ? <>Each asset runs 5-minute, 15-minute, 1-hour, 4-hour and daily rounds at the same time. Grouped by asset; the group line carries the asset's <b>majority right · today</b> and 24-hour volume.</> : undefined}>
            {crypto ? (
              <Responsive
                desktop={
                  <Table head={<><Th>Round length</Th><Th w={230}>Round (UTC)</Th><Th w={280}>Up · Down price</Th><Th w={110} r>Settles in</Th><Th w={130} r>Traded this round</Th></>}>
                    {list.map((a) => (
                      <GroupRows key={a.slug} a={a} />
                    ))}
                  </Table>}
                mobile={<div className="space-y-3">{list.map((a) => (
                  <List key={a.slug}>
                    <GroupHead a={a} />
                    {a.live_all.map((l) => <MRow key={l.event_id} a={a} l={l} />)}
                  </List>
                ))}</div>} />
            ) : (
              <Responsive
                desktop={<Table head={<><Th>Stock</Th><Th w={170}>Session</Th><Th w={280}>Up · Down price</Th><Th w={110} r>Settles</Th><Th w={170} r>Majority right · 30d</Th><Th w={120} r>Traded 24h</Th></>}>
                  {list.map((a) => <Tr key={a.slug} a={a} />)}
                </Table>}
                mobile={<List>{list.map((a) => <MRow key={a.slug} a={a} />)}</List>} />
            )}
          </SeriesSection>
          <DataFooter settle={crypto ? "Settles on the reference index" : "Settles on the official close"} legend={<>In every {crypto ? "round" : "session"}, the side priced above 50¢ is the <b className="font-medium text-foreground">majority</b> — the side more money is on. <b className="font-medium text-foreground">Majority right</b> is how often that side actually won. {crypto ? "Rounds settle on the reference-index price." : "Sessions settle on the official closing price."} All times are UTC.</>} sentence={`According to OmenX prediction market data, the majority was right in ${Math.round(list.reduce((s, a) => s + (a.hit_30d ?? 0), 0) / Math.max(1, list.length))}% of ${crypto ? "crypto" : "stock"} Up-or-Down ${crypto ? "rounds" : "sessions"} over the last 30 days (${fmtInt(list.reduce((s, a) => s + a.rounds_30d, 0))} settled).`} url={`${SITE_URL}/insights/${family}`} />
        </>
      )}
    </InsightsShell>
  );
};

/* crypto hub: one group per asset — header row (asset-level figures) + one row per open round */
const GroupRows = ({ a }: { a: SeriesAsset }) => (
  <>
    <tr className="!cursor-pointer" onClick={() => (window.location.href = seriesPath(a))}>
      <td colSpan={5} className="!h-11 bg-white/[0.02]">
        <div className="flex items-center justify-between gap-4">
          <Link to={seriesPath(a)} className="text-[14px] font-semibold hover:text-primary">{a.asset} <span className="ml-1 font-normal text-muted-foreground">→</span></Link>
          <span className="flex items-center gap-6 font-mono text-[12px] text-muted-foreground">
            <span>Majority right · today <Hit v={a.hit_today} /></span>
            <span>Rounds today <span className="text-foreground">{fmtInt(a.rounds_today)}</span></span>
            <span>Traded 24h <span className="text-foreground">{fmtUsd(a.vol_24h)}</span></span>
          </span>
        </div>
      </td>
    </tr>
    {a.live_all.map((l) => (
      <tr key={l.event_id} onClick={() => (window.location.href = roundTradePath(l.event_id))}>
        <Td><span className="inline-flex items-center gap-2 pl-1"><Chip>{minsShort(l.mins)} round</Chip><span className="text-[12px] text-muted-foreground">{minsNoun(l.mins)}</span></span></Td>
        <Td mono dim>{roundSpan(l)}</Td>
        <Td><UpDownPair up={l.up_price} down={l.down_price} /></Td>
        <Td r mono><SettlesIn end={l.end} /></Td>
        <Td r mono dim>{l.volume > 0 ? fmtUsd(l.volume) : "—"}</Td>
      </tr>
    ))}
  </>
);
const GroupHead = ({ a }: { a: SeriesAsset }) => (
  <Link to={seriesPath(a)} className="flex items-center justify-between py-2.5">
    <span className="text-[14px] font-semibold">{a.asset} <span className="font-normal text-muted-foreground">→</span></span>
    <span className="font-mono text-[11px] text-muted-foreground"><Hit v={a.hit_today} /> right today · {fmtUsd(a.vol_24h)}</span>
  </Link>
);

const Tr = ({ a }: { a: SeriesAsset }) => { const stock = isStock(a.family); const l = a.live; return (
  <tr onClick={() => (window.location.href = seriesPath(a))}>
    <Td><span className="inline-flex items-center gap-2"><Link to={seriesPath(a)} className="text-[13px] font-semibold">{a.asset}</Link>{stock ? <small className="text-[11px] text-muted-foreground/70">{a.ticker}</small> : l && <Chip>{minsShort(l.mins)} round</Chip>}</span></Td>
    <Td mono dim>{l ? (stock ? sessionDay(l.end) : roundSpan(l)) : "—"}</Td>
    <Td>{l ? <UpDownPair up={l.up_price} down={l.down_price} /> : <span className="text-muted-foreground">no live {stock ? "session" : "round"}</span>}</Td>
    <Td r mono>{l ? (stock ? (new Date(l.end).getTime() < Date.now() ? <span className="text-muted-foreground">settling</span> : `${hhmm(l.end)} UTC`) : <SettlesIn end={l.end} />) : "—"}</Td>
    <Td r><Hit v={stock ? a.hit_30d : a.hit_today} /></Td>
    <Td r mono>{fmtUsd(a.vol_24h)}</Td>
  </tr>
); };
const MRow = ({ a, l: lv }: { a: SeriesAsset; l?: LiveRound }) => { const stock = isStock(a.family); const l = lv ?? a.live;
  if (lv) return (
    <Row to={roundTradePath(lv.event_id)}
      l1={<><span className="inline-flex items-center gap-2"><Chip>{minsShort(lv.mins)}</Chip><span className="font-mono text-[12px] text-muted-foreground">{roundSpan(lv)}</span></span><span className="font-mono text-[12px] text-muted-foreground">settles in <SettlesIn end={lv.end} className="text-foreground" /></span></>}
      l2={<><UpDownPair up={lv.up_price} down={lv.down_price} size="sm" /><span className="font-mono text-[12px] text-muted-foreground">{lv.volume > 0 ? fmtUsd(lv.volume) : "—"}</span></>} />
  );
  return (
  <Row to={seriesPath(a)} l1={<><Name sub={stock ? a.ticker ?? undefined : undefined} chip={!stock && l ? minsShort(l.mins) : undefined}>{a.asset}</Name><span className="font-mono text-[12px] text-muted-foreground">{l ? (stock ? `settles ${hhmm(l.end)} UTC` : <>settles in <SettlesIn end={l.end} className="text-foreground" /></>) : "closed"}</span></>}
    l2={l ? <><UpDownPair up={l.up_price} down={l.down_price} size="sm" /><span className="font-mono text-[12px]"><Hit v={stock ? a.hit_30d : a.hit_today} /> <span className="text-muted-foreground">right{stock ? " · 30d" : " today"}</span></span></> : undefined} />
); };

export default InsightsFamilyPage;
