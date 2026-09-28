/**
 * /insights/crypto · /insights/stocks — hub for one Up-or-Down family: every asset, its live round, and the crowd's 30-day record.
 */
import { useSeoHead } from "@/lib/seo/head";
import { SITE_URL } from "@/lib/site";
import { InsightsShell } from "@/components/insightsSeo/InsightsShell";
import { LoadingState } from "@/components/states";
import { useSeriesList } from "@/hooks/useInsightsSeries";
import { Chip, Cite, Crumb, Hit, HowComputed, List, Name, PlatformLine, Responsive, Row, SeriesOpening, SeriesSection, SettlesIn, Table, Td, Th, UpDownPair } from "@/components/insightsSeo/seriesParts";
import { fmtInt, fmtUsd } from "@/lib/insights";
import { familyFromPath, hhmm, isStock, minsShort, roundSpan, seriesPath, sessionDay, type SeriesAsset } from "@/lib/insights/series";
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
      <SeriesOpening crumb={<Crumb items={[{ label: "Insights", to: "/insights" }, { label: crypto ? "Crypto" : "Stocks" }]} />} eyebrow={`OmenX Insights · ${crypto ? "Crypto" : "US & HK stocks"} · Up or down`}
        title={crypto ? "Crypto Up or Down — Live Prediction Market Odds" : "Stock Up or Down Today — Prediction Market Odds"}
        lede={crypto ? <>Bitcoin, Ethereum and Solana each run 5-minute, 15-minute, 1-hour, 4-hour and daily rounds. One row per asset: the round settling next and how often the majority has been right.</> : <>Each trading day OmenX traders bet whether a stock closes above its previous close. One row per stock: today's session and the majority's 30-day record.</>}
        asOf={asOf} />
      {isLoading && <LoadingState variant="skeleton" skeletonRows={6} />}
      {!isLoading && (
        <>
          <SeriesSection n="01" title={crypto ? "Next round to settle" : "Today's session"} meta={`${list.length} assets`}>
            <Responsive
              desktop={<Table head={<><Th>Asset</Th><Th w={170}>{crypto ? "Round (UTC)" : "Session"}</Th><Th w={280}>Up · Down price</Th><Th w={110} r>{crypto ? "Settles in" : "Settles"}</Th>{crypto && <Th w={130} r>Rounds today</Th>}<Th w={170} r>Majority right · {crypto ? "today" : "30d"}</Th><Th w={120} r>Traded 24h</Th></>}>
                {list.map((a) => <Tr key={a.slug} a={a} />)}
              </Table>}
              mobile={<List>{list.map((a) => <MRow key={a.slug} a={a} />)}</List>} />
          </SeriesSection>
          <PlatformLine settle={crypto ? "settles on the reference index" : "settles on the official close"} />
          <HowComputed>"Majority" is the side priced above 50¢ when betting closed; "majority right" is the share of settled {crypto ? "rounds" : "sessions"} where that side won. All times UTC.</HowComputed>
          <Cite sentence={`According to OmenX prediction market data, the majority was right in ${Math.round(list.reduce((s, a) => s + (a.hit_30d ?? 0), 0) / Math.max(1, list.length))}% of ${crypto ? "crypto" : "stock"} Up-or-Down ${crypto ? "rounds" : "sessions"} over the last 30 days (${fmtInt(list.reduce((s, a) => s + a.rounds_30d, 0))} settled).`} url={`${SITE_URL}/insights/${family}`} />
        </>
      )}
    </InsightsShell>
  );
};

const Tr = ({ a }: { a: SeriesAsset }) => { const stock = isStock(a.family); const l = a.live; return (
  <tr onClick={() => (window.location.href = seriesPath(a))}>
    <Td><span className="inline-flex items-center gap-2"><Link to={seriesPath(a)} className="text-[13px] font-semibold">{a.asset}</Link>{stock ? <small className="text-[11px] text-muted-foreground/70">{a.ticker}</small> : l && <Chip>{minsShort(l.mins)} round</Chip>}</span></Td>
    <Td mono dim>{l ? (stock ? sessionDay(l.end) : roundSpan(l)) : "—"}</Td>
    <Td>{l ? <UpDownPair up={l.up_price} down={l.down_price} /> : <span className="text-muted-foreground">no live {stock ? "session" : "round"}</span>}</Td>
    <Td r mono>{l ? (stock ? (new Date(l.end).getTime() < Date.now() ? <span className="text-muted-foreground">settling</span> : `${hhmm(l.end)} UTC`) : <SettlesIn end={l.end} />) : "—"}</Td>
    {!stock && <Td r mono>{fmtInt(a.rounds_today)}</Td>}
    <Td r><Hit v={stock ? a.hit_30d : a.hit_today} /></Td>
    <Td r mono>{fmtUsd(a.vol_24h)}</Td>
  </tr>
); };
const MRow = ({ a }: { a: SeriesAsset }) => { const stock = isStock(a.family); const l = a.live; return (
  <Row to={seriesPath(a)} l1={<><Name sub={stock ? a.ticker ?? undefined : undefined} chip={!stock && l ? minsShort(l.mins) : undefined}>{a.asset}</Name><span className="font-mono text-[12px] text-muted-foreground">{l ? (stock ? `settles ${hhmm(l.end)} UTC` : <>settles in <SettlesIn end={l.end} className="text-foreground" /></>) : "closed"}</span></>}
    l2={l ? <><UpDownPair up={l.up_price} down={l.down_price} size="sm" /><span className="font-mono text-[12px]"><Hit v={stock ? a.hit_30d : a.hit_today} /> <span className="text-muted-foreground">right{stock ? " · 30d" : " today"}</span></span></> : undefined} />
); };

export default InsightsFamilyPage;
