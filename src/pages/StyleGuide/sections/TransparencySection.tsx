import { SectionWrapper } from "../components/SectionWrapper";

interface Props {
  isMobile: boolean;
}

/**
 * Design spec for all On-Chain Transparency Audit pages.
 *
 * RULE 1 — Field Label Casing
 *   • On-chain contract fields → exact camelCase as in the ABI:
 *     uid, positionSide, markPrice, size, eventId, outcomeId,
 *     makerUid, takerUid, price, fundingRate, winningOutcomeId,
 *     oracleProof, batchId, oldRoot, newRoot
 *   • Blockchain metadata → camelCase matching Ethereum conventions:
 *     txHash, blockNumber, contract, timestamp
 *   • Platform-generated analysis → camelCase to stay consistent:
 *     oracleSource, feedContract, queriedAt, priceDeviation
 *
 * RULE 2 — Typography per element
 *   • Section headers: text-sm font-semibold, Title Case
 *     e.g. "On-Chain Liquidation Snapshot"
 *   • Hero numbers: text-3xl–text-4xl font-bold font-mono
 *   • Hero labels (above big numbers): text-[10px] UPPERCASE tracking-widest
 *   • Data row labels: text-xs text-muted-foreground, camelCase
 *   • Data row values: text-xs font-mono text-foreground/80
 *   • Sub-caption (raw values): text-[10px] font-mono text-muted-foreground/60
 *   • Event badge (top-right): text-[10px] font-mono text-muted-foreground/60
 *     bg-muted/30 px-1.5 py-0.5 rounded
 *
 * RULE 3 — Data row layout
 *   flex items-center justify-between py-1.5 px-2 rounded bg-muted/20
 *   Gap between rows: gap-1.5 or space-y-1.5
 *
 * RULE 4 — Address / hash truncation
 *   Show first 10 + last 6 chars: `0x3b4e780d...c6b3bf`
 *   Always font-mono, truncate max-w-[200px] on mobile
 *
 * RULE 5 — Color semantics
 *   • Verified / match / positive: text-emerald-400
 *   • Liquidation / loss / negative: text-trading-red
 *   • Warning / deviation: text-amber-400
 *   • Neutral accent per scenario:
 *     Merkle = emerald, Trade = blue, Liquidation = amber,
 *     Funding = purple, Settlement = cyan
 */

export const TransparencySection = ({ isMobile }: Props) => {
  const fieldRows = [
    { label: "uid", value: "0x3b4e780d...c6b3bf", rule: "Contract field → camelCase" },
    { label: "positionSide", value: "0 (Yes)", rule: "Contract field → camelCase" },
    { label: "markPrice", value: "$0.5500", rule: "Contract field → camelCase" },
    { label: "txHash", value: "0xd4b90415...ae8c32", rule: "Blockchain meta → camelCase" },
    { label: "blockNumber", value: "#18,316,336", rule: "Blockchain meta → camelCase" },
    { label: "contract", value: "0x833589fC...7C32e8", rule: "Blockchain meta → camelCase" },
    { label: "timestamp", value: "2026-04-11 14:15:17 UTC", rule: "Blockchain meta → camelCase" },
    { label: "oracleSource", value: "Chainlink / Pyth", rule: "Analysis field → camelCase" },
    { label: "priceDeviation", value: "0.45%", rule: "Analysis field → camelCase" },
  ];

  return (
    <SectionWrapper id="transparency" title="Transparency Audit" description="Design conventions for all 5 on-chain verification scenarios.">
      <div className="space-y-8">

        {/* Rule 1: Casing */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Rule 1 — All Labels Use camelCase</h3>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
            Every label in data-row lists — whether it's a contract ABI field, blockchain metadata, or platform analysis — 
            uses <code className="bg-muted/50 px-1 rounded">camelCase</code>. This ensures visual consistency and 
            removes the mixed Title Case / camelCase problem.
          </p>
          <div className="trading-card p-4 space-y-1.5 max-w-lg">
            {fieldRows.map((row) => (
              <div key={row.label} className="flex items-center justify-between py-1.5 px-2 rounded bg-muted/20 text-xs">
                <span className="text-muted-foreground font-mono">{row.label}</span>
                <span className="font-mono text-foreground/80">{row.value}</span>
              </div>
            ))}
          </div>
          <div className="space-y-1 text-[10px] text-muted-foreground">
            {fieldRows.map((row) => (
              <p key={row.label}><code className="font-mono text-foreground/70">{row.label}</code> — {row.rule}</p>
            ))}
          </div>
        </div>

        {/* Rule 2: Typography */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Rule 2 — Typography Hierarchy</h3>
          <div className="trading-card p-5 space-y-4 max-w-lg">
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Section header (text-sm font-semibold)</p>
              <h4 className="text-sm font-semibold">On-Chain Liquidation Snapshot</h4>
            </div>
            <div className="space-y-1 text-center">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Hero label — UPPERCASE tracking-widest</p>
              <p className="text-4xl font-bold font-mono text-trading-red">$0.5500</p>
              <p className="text-[10px] font-mono text-muted-foreground/60">Raw: 550000</p>
            </div>
            <div className="flex items-center justify-between py-1.5 px-2 rounded bg-muted/20 text-xs">
              <span className="text-muted-foreground font-mono">fieldLabel</span>
              <span className="font-mono text-foreground/80">value</span>
            </div>
          </div>
        </div>

        {/* Rule 3: Color semantics */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Rule 3 — Scenario Accent Colors</h3>
          <div className="grid grid-cols-5 gap-2 max-w-lg">
            {[
              { scenario: "Merkle", color: "bg-emerald-400", label: "emerald" },
              { scenario: "Trade", color: "bg-blue-400", label: "blue" },
              { scenario: "Liquidation", color: "bg-amber-400", label: "amber" },
              { scenario: "Funding", color: "bg-purple-400", label: "purple" },
              { scenario: "Settlement", color: "bg-cyan-400", label: "cyan" },
            ].map((s) => (
              <div key={s.scenario} className="text-center space-y-1.5">
                <div className={`w-8 h-8 rounded-lg ${s.color} mx-auto`} />
                <p className="text-[10px] font-medium">{s.scenario}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}-400</p>
              </div>
            ))}
          </div>
        </div>

        {/* Rule 4: Truncation */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Rule 4 — Address Truncation</h3>
          <p className="text-xs text-muted-foreground max-w-xl">
            Hash / address values: show first 10 + "..." + last 6 characters. Always <code className="bg-muted/50 px-1 rounded">font-mono</code>.
          </p>
          <div className="trading-card p-3 max-w-lg">
            <code className="text-xs font-mono text-foreground/80">0x3b4e780d12...c6b3bf</code>
          </div>
        </div>

      </div>
    </SectionWrapper>
  );
};
