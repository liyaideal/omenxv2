/**
 * /insights/accuracy (rolling 30 days) · /insights/accuracy/{YYYY-MM} (frozen month) — the GEO magnet (mock ④).
 * "How accurate is the prediction market crowd?" — by asset, by round length, previous reports. No "now" block.
 */
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSeoHead } from "@/lib/seo/head";
import { SITE_URL } from "@/lib/site";
import { InsightsShell } from "@/components/insightsSeo/InsightsShell";
import { LoadingState } from "@/components/states";
import { useAccuracy } from "@/hooks/useInsightsSeries";
import { DataFooter, Hit, List, Name, Responsive, Row, SeriesOpening, SeriesSection, Strip, Table, Td, Th } from "@/components/insightsSeo/seriesParts";
import { fmtInt } from "@/lib/insights";
import { citeAccuracy, minsLabel, minsNoun, minsShort, monthId, monthRange, seriesPath } from "@/lib/insights/series";

const DAY = 864e5;

const InsightsAccuracyPage = () => {
  const { month } = useParams();
  const [now] = useState(() => new Date());
  const range = month ? monthRange(month) : null;
  const frozen = !!range && range.to.getTime() <= now.getTime();
  const [win] = useState(() => range ? { from: range.from, to: range.to.getTime() < now.getTime() ? range.to : now } : { from: new Date(now.getTime() - 30 * DAY), to: now });
  const { data: a, isLoading } = useAccuracy(win.from, win.to, !frozen);
  const label = range ? range.label : "last 30 days";
  const path = month ? `/insights/accuracy/${month}` : "/insights/accuracy";
  const title = `How Accurate Is the Prediction Market Crowd? — OmenX, ${range ? range.label : "Last 30 Days"}`;
  useSeoHead({ title, description: a ? `Across ${fmtInt(a.rounds)} settled Up-or-Down rounds (${label}), the side the OmenX majority backed was right ${a.hit ?? 0}% of the time. Accuracy by asset and by round length.` : "", path, hreflang: true,
    jsonLd: a ? [{ "@context": "https://schema.org", "@type": "Dataset", name: title, url: `${SITE_URL}${path}`, dateModified: a.as_of, temporalCoverage: `${a.from}/${a.to}`, creator: { "@type": "Organization", name: "OmenX", url: SITE_URL },
      variableMeasured: [{ "@type": "PropertyValue", name: "Majority was right", value: a.hit, unitText: "percent" }, { "@type": "PropertyValue", name: "Rounds settled", value: a.rounds }] }] : [] }, [a?.as_of ?? ""]);

  const best = a ? a.by_asset.slice(0, 5) : []; const worst = a ? [...a.by_asset].reverse().slice(0, 5) : [];
  const bestLen = a ? [...a.by_len].filter((b) => b.rounds >= 20).sort((x, y) => y.hit - x.hit)[0] : null;
  const prev = [1, 2, 3].map((i) => monthId(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))));

  return (
    <InsightsShell mobileTitle="Accuracy report">
      <SeriesOpening eyebrow={`OmenX Insights · Accuracy report · ${range ? range.label : "Rolling 30 days"}`}
        title={`How Accurate Is the Prediction Market Crowd? — OmenX, ${range ? range.label : "Last 30 Days"}`}
        lede={a ? <>Across <b>{fmtInt(a.rounds)} settled Up-or-Down rounds</b> ({label}), the side the majority backed was right <b>{a.hit ?? 0}%</b> of the time.{bestLen && <> The crowd does best on {minsLabel(bestLen.mins)} rounds ({bestLen.hit}%).</>}{frozen && <> This report is frozen and will not change.</>}</> : "Loading…"} asOf={a?.as_of} />
      {isLoading && <LoadingState variant="skeleton" skeletonRows={6} />}
      {a && (
        <>
          <Strip cells={[
            { l: "Rounds settled", v: fmtInt(a.rounds), d: label },
            { l: "Majority right", v: <Hit v={a.hit} />, d: "all rounds" },
            { l: "Best round length", v: bestLen ? <>{minsShort(bestLen.mins)} · <Hit v={bestLen.hit} /></> : "—", d: "crypto" },
            { l: "Assets tracked", v: fmtInt(a.by_asset.length), d: "≥ 5 rounds each" },
          ]} />

          <SeriesSection n="01" title="By asset" meta={`${label} · majority right`}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="trading-card"><div className="px-4 pb-1.5 pt-3.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Most reliable crowd</div>{best.map((x) => <RankRow key={x.slug} x={x} />)}</div>
              <div className="trading-card"><div className="px-4 pb-1.5 pt-3.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Least reliable crowd</div>{worst.map((x) => <RankRow key={x.slug} x={x} />)}</div>
            </div>
          </SeriesSection>

          <SeriesSection n="02" title="By round length" meta="Crypto · BTC + ETH + SOL" intro={<>The shorter the round, the closer the crowd is to a coin flip.{a.by_len.some((b) => b.rounds < 20) && <> Lengths with fewer than 20 settlements are shown but not ranked.</>}</>}>
            <Responsive
              desktop={<Table head={<><Th>Round length</Th><Th w={120} r>Rounds</Th><Th w={170} r>Majority was right</Th><Th w={170} r>Price actually rose</Th><Th w={300}>Read as</Th></>}>
                {a.by_len.map((b) => <tr key={b.mins}><Td className="font-semibold">{minsNoun(b.mins)}</Td><Td r mono>{fmtInt(b.rounds)}</Td><Td r><Hit v={b.rounds >= 20 ? b.hit : null} />{b.rounds < 20 && <span className="ml-1 font-mono text-[11px] text-muted-foreground">({b.hit}%)</span>}</Td><Td r mono dim>{b.rose_pct}%</Td><Td dim className="text-[12px]">{readAs(b)}</Td></tr>)}
              </Table>}
              mobile={<List>{a.by_len.map((b) => <Row key={b.mins} l1={<><Name sub={`${fmtInt(b.rounds)} rounds`}>{minsNoun(b.mins)}</Name><Hit v={b.rounds >= 20 ? b.hit : null} big /></>} l2={<span className="font-mono text-[12px] text-muted-foreground">{readAs(b)}</span>} />)}</List>} />
          </SeriesSection>

          <SeriesSection n="03" title="Previous reports">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
              {prev.map((m) => <Link key={m} to={`/insights/accuracy/${m}`} className="trading-card flex items-center justify-between px-3 py-2.5 text-[12px] font-semibold md:px-4 md:py-3.5 md:text-[13px]">{monthRange(m)?.label}<b className="font-mono">→</b></Link>)}
              {month && <Link to="/insights/accuracy" className="trading-card flex items-center justify-between px-3 py-2.5 text-[12px] font-semibold md:px-4 md:py-3.5 md:text-[13px]">Rolling 30 days<b className="font-mono">→</b></Link>}
            </div>
          </SeriesSection>

          <DataFooter legend={<>In every round, the side priced above 50¢ is the <b className="font-medium text-foreground">majority</b> — the side more money is on. <b className="font-medium text-foreground">Majority right</b> is how often that side actually won. Only settled rounds count, and an asset needs at least 5 of them to be ranked. A monthly report is frozen at month end and never edited.</>} sentence={`${citeAccuracy(a, range ? range.label : "rolling 30-day")}${bestLen ? ` rising to ${bestLen.hit}% on ${minsLabel(bestLen.mins)} rounds.` : ""}`} url={`${SITE_URL}${path}`} />
        </>
      )}
    </InsightsShell>
  );
};

const readAs = (b: { rounds: number; hit: number; rose_pct: number }) => b.rounds < 20 ? "too few rounds to judge" : b.hit >= 48 && b.hit <= 52 ? "coin flip" : b.hit > 52 ? "slight edge" : "crowd leaned the wrong way";
const RankRow = ({ x }: { x: { slug: string; family: "crypto" | "us" | "hk"; asset: string; ticker: string | null; rounds: number; hit: number } }) => (
  <Link to={seriesPath(x)} className="flex h-11 items-center justify-between gap-3 border-t border-[#1D2026] px-4 hover:bg-white/[0.02]">
    <span className="min-w-0 truncate text-[13px] font-semibold">{x.asset}<small className="ml-1.5 font-mono text-[11px] font-normal text-muted-foreground/70">{x.ticker ? `${x.ticker} · daily` : `${fmtInt(x.rounds)} rounds`}</small></span>
    <Hit v={x.hit} big />
  </Link>
);

export default InsightsAccuracyPage;
