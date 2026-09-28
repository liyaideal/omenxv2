/**
 * /insights/{crypto|stocks}/{slug} — one Up-or-Down asset: now → past → recent → cite (CPO 批 2026-09-28, insights-ia-mock v3).
 * 19 URLs from one template (3 crypto · 10 US · 6 HK); a new asset in the DB becomes a page automatically.
 */
import { Link, useParams } from "react-router-dom";
import { useSeoHead } from "@/lib/seo/head";
import { InsightsShell } from "@/components/insightsSeo/InsightsShell";
import { LoadingState } from "@/components/states";
import { useSeriesDetail, useSeriesList } from "@/hooks/useInsightsSeries";
import {
  Cite, Crumb, FourTiles, Hit, HowComputed, LiveCard, LivePill, List, MajorityTag, Name, PlatformLine, Responsive, RightWrong, Row, SeriesOpening, SeriesSection, SettlesIn, StickyCta, Table, Td, Th,
} from "@/components/insightsSeo/seriesParts";
import { fmtUsd, fmtInt, fmtDate } from "@/lib/insights";
import {
  assetTitle, c, citeSeries, familyFromPath, hhmm, isStock, majorityPrice, majorityRight, majorityUp, minsLabel, minsNoun, minsShort, roundNoun, roundNounPlural, roundSpan, roundTradePath, sessionDay, seriesPath, seriesUrl, type SeriesDetail, type SeriesRound,
} from "@/lib/insights/series";

const InsightsAssetPage = ({ family }: { family: "crypto" | "stocks" }) => {
  const { slug = "" } = useParams();
  const fams = familyFromPath(family);
  const { data, isLoading, error } = useSeriesDetail(slug);
  const { data: all } = useSeriesList();
  const ok = data && fams.includes(data.family);

  const title = ok ? (isStock(data.family) ? `${assetTitle(data)} Up or Down Today — Prediction Market Odds` : `${data.asset} Up or Down — Prediction Market Odds & Crowd Accuracy`) : "Up or Down — Prediction Market Odds | OmenX";
  const desc = ok ? (isStock(data.family)
    ? `Will ${data.asset} close higher today? Live OmenX prediction market odds, how often the majority has been right, and the last ten sessions.`
    : `Live OmenX prediction market odds on whether ${data.asset} closes higher or lower in 5-minute to daily rounds, with the crowd's track record.`) : "";
  useSeoHead({ title, description: desc, path: ok ? seriesPath(data) : `/insights/${family}/${slug}`, hreflang: true, jsonLd: ok ? [jsonLd(data)] : [] }, [ok ? data.as_of : ""]);

  const stock = ok ? isStock(data.family) : false;
  const next = ok && data.live.length ? [...data.live].sort((a, b) => +new Date(a.end) - +new Date(b.end))[0] : null;
  const fam = ok ? (data.family === "crypto" ? "Crypto" : data.family === "us" ? "US stocks" : "HK stocks") : "";

  return (
    <InsightsShell mobileTitle={ok ? `${data.asset} · Up or Down` : "Insights"}>
      {isLoading && <LoadingState variant="skeleton" skeletonRows={6} />}
      {!isLoading && (error || !ok) && <div className="rounded-xl border border-dashed border-[#262A31] px-4 py-8 text-center text-sm text-muted-foreground">No Up-or-Down market found for “{slug}”. <Link to="/insights" className="text-primary">Back to Insights →</Link></div>}
      {ok && (
        <>
          <SeriesOpening
            crumb={<Crumb items={[{ label: "Insights", to: "/insights" }, { label: fam, to: `/insights/${family}` }]} />}
            eyebrow={`OmenX Insights · ${fam} · Up or down`}
            title={stock ? `${assetTitle(data)} Up or Down Today — Prediction Market Odds` : `${data.asset} Up or Down — Prediction Market Odds & Crowd Accuracy`}
            lede={stock
              ? <>Each trading day OmenX traders bet whether {data.asset} closes above its previous close. This page shows today's odds, how often the majority has been right, and the last ten sessions.</>
              : <>Every 5 minutes, 15 minutes, hour, 4 hours and day OmenX traders bet whether {data.asset} closes higher or lower. This page shows what the majority is betting right now and how often it has been right.</>}
            asOf={data.as_of}
          />

          <div className="mb-8 grid gap-3 md:mb-10 md:grid-cols-12 md:gap-4">
            <div className="md:col-span-5">
              {next ? (
                <LiveCard
                  eyebrow={stock ? "Today's session" : `Now · next to settle · ${minsLabel(next.mins)} round`}
                  when={stock ? `Settles at close · ${hhmm(next.end)} UTC` : `${roundSpan(next)} UTC`}
                  round={next}
                  sub={<>Right now more money is on <b className={majorityUp(next) ? "font-semibold text-yes" : "font-semibold text-no"}>{majorityUp(next) ? "Up" : "Down"}</b> — {c(next.up_price)} vs {c(next.down_price)}{next.volume > 0 && <>, {fmtUsd(next.volume)} traded so far</>}.</>}
                  foot={stock ? <>Betting closes <b>{next.freeze ? `${hhmm(next.freeze)} UTC` : "at close"}</b></> : <>Settles in <b><SettlesIn end={next.end} /></b> · at {hhmm(next.end)} UTC</>}
                  cta={{ label: stock ? "Trade today's session" : "Trade this round", to: roundTradePath(next.event_id) }}
                />
              ) : (
                <div className="trading-card flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">No {roundNoun(data.family)} open right now. Next {roundNoun(data.family)} opens on the next trading day.</div>
              )}
            </div>
            <div className="md:col-span-7">
              <FourTiles tiles={[
                stock
                  ? { l: "Sessions tracked", v: fmtInt(data.rounds_30d), d: "last 30 days" }
                  : { l: "Rounds today", v: fmtInt(data.today.rounds), d: "all round lengths · 5m to 1d" },
                { l: "Majority bet Up in", v: data.today.up_pct == null ? (data.by_len[0]?.up_pct ?? "—") + (data.by_len[0] ? "%" : "") : `${data.today.up_pct}%`, unit: `of ${roundNounPlural(data.family)}`,
                  d: data.today.up_pct == null ? "last 30 days" : data.today.up_pct >= 50 ? <><b className="text-trading-green">a bullish day</b> — more rounds leaned Up</> : <><b className="text-trading-red">a bearish day</b> — more rounds leaned Down</> },
                { l: "Majority was right in", v: data.today.hit == null ? <Hit v={data.hit_30d} /> : <Hit v={data.today.hit} />, unit: `of ${roundNounPlural(data.family)}`, d: data.today.hit == null ? "last 30 days" : <>30-day average <b>{data.hit_30d ?? "—"}%</b></> },
                { l: stock ? "Longest winning run" : "Longest winning run today", v: fmtInt(data.longest_run_today.len), unit: roundNounPlural(data.family),
                  d: data.longest_run_today.len > 0 ? <>majority right {data.longest_run_today.len}× in a row{data.longest_run_today.start && !stock ? ` · from ${hhmm(data.longest_run_today.start)} UTC` : ""}</> : "no settled rounds yet today" },
              ]} />
            </div>
          </div>

          <SeriesSection n="01" title={stock ? `${data.asset} sessions — now, and how often the majority is right` : `All ${data.asset} round lengths — now, and how often the majority is right`} meta={`Last 30 days · ${fmtInt(data.rounds_30d)} ${roundNounPlural(data.family)}`}
            intro={<><b>Majority</b> = the side priced above 50¢ when betting closed (both sides always have backers). {byLenSentence(data)}</>}>
            <Responsive
              desktop={
                <Table head={<><Th>Round length</Th><Th w={150}>Now</Th><Th w={100} r>Rounds</Th><Th w={210}>Majority bet Up</Th><Th w={150} r>Majority was right</Th><Th w={160} r>{data.asset} actually rose</Th><Th w={120} r>Avg traded</Th></>}>
                  {data.by_len.map((b) => { const lv = data.live.find((l) => l.mins === b.mins); return (
                    <tr key={b.mins} onClick={() => lv && (window.location.href = roundTradePath(lv.event_id))}>
                      <Td className="font-semibold">{minsNoun(b.mins)}</Td>
                      <Td>{lv ? <MajorityTag up={lv.up_price} down={lv.down_price} /> : <span className="text-muted-foreground">—</span>}</Td>
                      <Td r mono>{fmtInt(b.rounds)}</Td>
                      <Td><span className="inline-flex items-center gap-2.5"><span className="relative h-1 w-20 overflow-hidden rounded-sm bg-[#262A31]"><i className="absolute inset-y-0 left-0 bg-yes" style={{ width: `${b.up_pct}%` }} /></span><span className="font-mono tabular-nums">{b.up_pct}%</span></span></Td>
                      <Td r><Hit v={b.hit} /></Td>
                      <Td r mono dim>{b.rose_pct}%</Td>
                      <Td r mono dim>{b.avg_volume > 0 ? fmtUsd(b.avg_volume) : "—"}</Td>
                    </tr>
                  ); })}
                </Table>
              }
              mobile={
                <List>
                  {data.by_len.map((b) => { const lv = data.live.find((l) => l.mins === b.mins); return (
                    <Row key={b.mins} to={lv ? roundTradePath(lv.event_id) : undefined}
                      l1={<><Name>{minsNoun(b.mins)}</Name>{lv ? <MajorityTag up={lv.up_price} down={lv.down_price} prefix="Now · " /> : <span className="font-mono text-[11px] text-muted-foreground">no live round</span>}</>}
                      l2={<><span className="font-mono text-[12px] text-muted-foreground">{fmtInt(b.rounds)} rounds · bet Up {b.up_pct}%</span><span className="font-mono text-[12px]">right <b><Hit v={b.hit} /></b></span></>} />
                  ); })}
                </List>
              }
            />
          </SeriesSection>

          <SeriesSection n="02" title={stock ? `Last 10 ${data.asset} sessions` : `Last 10 ${data.asset} ${minsLabel(data.primary_mins)} rounds`} meta={stock ? "Trading days · settles on official close" : `${fmtDate(data.as_of)} · UTC`}>
            <Responsive
              desktop={
                <Table head={<><Th>{stock ? "Session" : "Round (UTC)"}</Th><Th w={200}>Majority bet · price</Th><Th w={150}>{data.asset} actually</Th><Th w={190}>Majority was…</Th><Th w={120} r>Traded</Th></>}>
                  {data.recent.map((r) => <RecentTr key={r.event_id} r={r} stock={stock} />)}
                </Table>
              }
              mobile={
                <List>
                  {data.recent.map((r) => (
                    <Row key={r.event_id} to={!r.is_resolved ? roundTradePath(r.event_id) : undefined}
                      l1={<><span className="font-mono text-[12px]">{stock ? sessionDay(r.end) : roundSpan(r)}</span><MajorityTag up={r.up_price} down={r.down_price} />{r.is_resolved ? <><span className="font-mono text-[12px] text-muted-foreground">{r.up_won ? "rose" : "fell"}</span><span className="text-[12px]"><RightWrong ok={majorityRight(r)} /></span></> : <LivePill />}</>} />
                  ))}
                </List>
              }
            />
          </SeriesSection>

          {all && (
            <SeriesSection n="03" title="More Up-or-Down markets">
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
                {all.filter((a) => a.slug !== data.slug).slice(0, 3).map((a) => (
                  <Link key={a.slug} to={seriesPath(a)} className="trading-card flex items-center justify-between px-3 py-2.5 md:px-4 md:py-3.5">
                    <span className="min-w-0"><span className="block truncate text-[12px] font-semibold md:text-[13px]">{a.asset}</span><small className="block font-mono text-[9px] uppercase tracking-[0.06em] text-muted-foreground/70">{a.ticker ? `${a.ticker} · today` : a.live ? `${minsShort(a.live.mins)} round` : "crypto"}</small></span>
                    {a.live ? <b className={"font-mono text-[13px] " + (majorityUp(a.live) ? "text-yes" : "text-no")}>{majorityUp(a.live) ? "Up" : "Down"} {c(majorityPrice(a.live))}</b> : <b className="font-mono text-[12px] text-muted-foreground">closed</b>}
                  </Link>
                ))}
                <Link to="/insights" className="trading-card flex items-center justify-between px-3 py-2.5 text-[12px] font-semibold md:px-4 md:py-3.5 md:text-[13px]">All {all.length} assets<b className="font-mono">→</b></Link>
              </div>
            </SeriesSection>
          )}

          <PlatformLine />
          <HowComputed>"Majority" is the side priced above 50¢ when betting closed. "Majority was right" is the share of settled {roundNounPlural(data.family)} where that side won. {stock ? "Sessions settle on the official closing price." : "Rounds settle on the reference index."} Figures refresh every 15 minutes; all times UTC.</HowComputed>
          <Cite sentence={citeSeries(data)} url={seriesUrl(data)} />
          {next && <StickyCta to={roundTradePath(next.event_id)} label={stock ? "Trade today's session" : "Trade this round"} sub={`${majorityUp(next) ? "Up" : "Down"} ${c(majorityPrice(next))}`} />}
        </>
      )}
    </InsightsShell>
  );
};

const RecentTr = ({ r, stock }: { r: SeriesRound; stock: boolean }) => (
  <tr onClick={() => !r.is_resolved && (window.location.href = roundTradePath(r.event_id))}>
    <Td mono>{stock ? sessionDay(r.end) : roundSpan(r)}</Td>
    <Td><MajorityTag up={r.up_price} down={r.down_price} /></Td>
    <Td mono dim>{r.is_resolved ? (r.up_won ? "rose" : "fell") : "still trading"}</Td>
    <Td>{r.is_resolved ? <RightWrong ok={majorityRight(r)} /> : <span className="inline-flex items-center gap-3"><LivePill /><Link to={roundTradePath(r.event_id)} className="text-[12px] font-semibold text-primary">Trade →</Link></span>}</Td>
    <Td r mono dim={r.is_resolved}>{r.volume > 0 ? fmtUsd(r.volume) : "—"}</Td>
  </tr>
);

const byLenSentence = (d: SeriesDetail) => {
  const ranked = [...d.by_len].filter((b) => b.rounds >= 20).sort((a, b) => b.hit - a.hit);
  if (!ranked.length) return `Fewer than 20 settled ${roundNounPlural(d.family)} in the last 30 days — too few to judge.`;
  const best = ranked[0]; const worst = ranked[ranked.length - 1];
  const few = d.by_len.filter((b) => b.rounds < 20).map((b) => minsNoun(b.mins));
  const parts = [`The majority is right most often on ${minsLabel(best.mins)} ${roundNounPlural(d.family)} (${best.hit}%)`];
  if (worst !== best) parts.push(`and least on ${minsLabel(worst.mins)} (${worst.hit}%${worst.hit >= 48 && worst.hit <= 52 ? " — a coin flip" : ""})`);
  let s = parts.join(" ") + ".";
  if (few.length) s += ` ${few.join(" / ")} ${roundNounPlural(d.family)}: too few settled this month to read anything into.`;
  return s;
};

const jsonLd = (d: SeriesDetail) => ({
  "@context": "https://schema.org", "@type": "Dataset",
  name: `${d.asset} Up or Down — OmenX prediction market odds`,
  description: `Live majority side and 30-day crowd accuracy for ${d.asset} Up-or-Down ${roundNounPlural(d.family)} on OmenX.`,
  url: seriesUrl(d), dateModified: d.as_of,
  creator: { "@type": "Organization", name: "OmenX", url: seriesUrl(d).replace(/\/insights.*$/, "") },
  variableMeasured: [
    { "@type": "PropertyValue", name: "Majority bet Up (today)", value: d.today.up_pct, unitText: "percent" },
    { "@type": "PropertyValue", name: "Majority was right (today)", value: d.today.hit, unitText: "percent" },
    { "@type": "PropertyValue", name: "Majority was right (30 days)", value: d.hit_30d, unitText: "percent" },
    { "@type": "PropertyValue", name: `${roundNounPlural(d.family)} settled (30 days)`, value: d.rounds_30d },
  ],
});

export default InsightsAssetPage;
