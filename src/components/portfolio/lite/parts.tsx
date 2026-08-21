// ============================================================
// Lite /portfolio furniture — tabs, KPI cards, voucher hairline, segment
// chips, Boost check gauge. Literal spec values (CPO工单 2026-08-19 §3–§4);
// these hexes are the spec, not token approximations.
// ============================================================
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobileDrawer } from "@/components/ui/mobile-drawer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { LiteSegment } from "@/hooks/useLitePortfolio";

export const VOLT = "#CFFF4A";
export const GREEN = "#3DD68C";
export const RED = "#FF5C5C";
export const AMBER = "#FFC24B";

export const money = (n: number) =>
  `${n < 0 ? "-" : ""}$${Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const signedMoney = (n: number) =>
  `${n >= 0 ? "+" : "-"}$${Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

/** Gauge buffer amounts: whole dollars carry no decimals ($310, $0). */
export const moneyAuto = (n: number) =>
  Number.isInteger(n) ? `${n < 0 ? "-" : ""}$${Math.abs(n).toLocaleString("en-US")}` : money(n);


/* ------------------------------ Tabs ------------------------------ */
/** Rewards opening-tab treatment (ACCOUNT family tabs = underline tabs). */
export const PortfolioTabs = ({
  value,
  onChange,
  sticky,
}: {
  value: "live" | "settled";
  onChange: (v: "live" | "settled") => void;
  sticky?: boolean;
}) => (
  <div
    className={`flex items-end gap-7 border-b border-[#1D2026] md:gap-9 ${
      sticky ? "sticky top-[var(--mobile-header-h)] z-30 -mx-4 bg-background px-4" : ""
    }`}
  >
    {[
      { id: "live" as const, label: "Live" },
      { id: "settled" as const, label: "Settled" },
    ].map((t) => {
      const active = value === t.id;
      return (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className="relative min-h-[48px] pb-2 font-display text-[19px] leading-[26px] tracking-[-0.01em] transition-colors md:min-h-[56px] md:pb-3 md:text-[24px] md:leading-[30px]"
          style={{ color: active ? "#F2F3F5" : "#6B7280", fontWeight: active ? 700 : 500 }}
        >
          {t.label}
          {active && <span className="absolute inset-x-0 -bottom-px h-[2.5px] rounded-full bg-[#F2F3F5]" />}
        </button>
      );
    })}
  </div>
);

/* ----------------------------- KPI cards ----------------------------- */
export const KpiCard = ({
  label,
  value,
  sub,
  subColor,
}: {
  label: string;
  value: string;
  sub?: string;
  subColor?: string;
}) => (
  <div className="rounded-[12px] bg-[#12151A] px-[14px] py-[12px]">
    <div
      className="text-[10px] font-semibold text-[#6B7280]"
      style={{ letterSpacing: "1.2px" }}
    >
      {label}
    </div>
    <div className="mt-1 font-mono text-[21px] font-bold text-[#F2F3F5]">{value}</div>
    {sub && (
      <div className="mt-0.5 font-mono text-[11px]" style={{ color: subColor ?? "#6B7280" }}>
        {sub}
      </div>
    )}
  </div>
);

export const KpiGrid = ({ children, cols }: { children: React.ReactNode; cols: 2 | 3 }) => (
  <div className={cols === 2 ? "grid grid-cols-2 gap-2" : "grid grid-cols-3 gap-3"}>{children}</div>
);

/* -------------------------- Voucher hairline -------------------------- */
export const VoucherHairline = ({ count }: { count: number }) => {
  const navigate = useNavigate();
  if (count <= 0) return null;
  return (
    <div
      className="flex items-center gap-2 px-4 py-2.5"
      style={{
        borderTop: "1px solid rgba(28,31,38,.8)",
        borderBottom: "1px solid rgba(28,31,38,.8)",
      }}
    >
      <span
        className="h-[7px] w-[7px] shrink-0"
        style={{ background: VOLT, borderRadius: "1.5px" }}
      />
      <span className="text-[13px] text-[#F2F3F5]">
        {count} {count === 1 ? "voucher" : "vouchers"} to claim
      </span>
      <button
        type="button"
        onClick={() => navigate("/rewards")}
        className="ml-auto text-[12.5px] font-semibold text-primary"
      >
        Claim in Rewards ›
      </button>
    </div>
  );
};

/* --------------------------- Segment chips --------------------------- */
export const SegmentChips = ({
  value,
  onChange,
  boostCount,
  standardCount,
}: {
  value: LiteSegment;
  onChange: (v: LiteSegment) => void;
  boostCount: number;
  standardCount: number;
}) => (
  <div className="flex items-center gap-2">
    {([
      { id: "boost" as const, label: `Boost · ${boostCount}` },
      { id: "standard" as const, label: `Standard · ${standardCount}` },
    ]).map((c) => {
      const active = value === c.id;
      return (
        <button
          key={c.id}
          type="button"
          onClick={() => onChange(c.id)}
          className="rounded-full px-3.5 py-[7px] text-[12.5px]"
          style={
            active
              ? { background: "#FFFFFF", color: "#0B0D10", fontWeight: 700 }
              : {
                  background: "#14171C",
                  border: "1px solid #262B33",
                  color: "#C7CCD4",
                  fontWeight: 600,
                }
          }
        >
          {c.label}
        </button>
      );
    })}
  </div>
);

/* ------------------------- Boost check gauge ------------------------- */
export interface BoostCheckData {
  riskRatio: number;
  equity: number;
  imTotal: number;
  untilAutoClose: number;
}

export const boostState = (riskRatio: number) => {
  if (riskRatio >= 95) return { word: "Auto-close soon", color: RED };
  if (riskRatio >= 80) return { word: "Getting tight", color: AMBER };
  return { word: "Healthy", color: GREEN };
};

const detailRows = (data: BoostCheckData) => [
  { k: "Equity", v: moneyAuto(data.equity) },
  { k: "Used by Boost calls", v: moneyAuto(data.imTotal) },
  { k: "Until auto-close starts", v: moneyAuto(data.untilAutoClose) },
];

const DETAILS_SENTENCE =
  "Boost calls share one pool of backing. If it runs out, positions start closing automatically.";

const DetailsDrawer = ({
  open,
  onOpenChange,
  data,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  data: BoostCheckData;
}) => (
  <MobileDrawer open={open} onOpenChange={onOpenChange} title="Boost check">
    <div className="space-y-3 pb-6">
      <p className="text-xs text-muted-foreground">{DETAILS_SENTENCE}</p>
      <div className="rounded-lg border border-border bg-muted/30 p-3">
        {detailRows(data).map((r) => (
          <div key={r.k} className="flex items-center justify-between py-1.5 text-xs">
            <span className="text-muted-foreground">{r.k}</span>
            <span className="font-mono font-semibold text-foreground">{r.v}</span>
          </div>
        ))}
      </div>
    </div>
  </MobileDrawer>
);

/** Desktop overlay parity (DESIGN §5): anchored Popover, never a bottom sheet. */
const DetailsPopover = ({ data }: { data: BoostCheckData }) => (
  <Popover>
    <PopoverTrigger asChild>
      <button type="button" className="text-[12px] text-[#6B7280]">
        Details ›
      </button>
    </PopoverTrigger>
    <PopoverContent
      align="end"
      className="w-[320px] rounded-[12px] border-[#1D2026] bg-[#12151A] p-4"
    >
      <div className="text-[13px] font-bold text-[#F2F3F5]">Boost check</div>
      <p className="mt-1.5 text-[12px] text-[#6B7280]">{DETAILS_SENTENCE}</p>
      <div className="mt-3 space-y-2">
        {detailRows(data).map((r) => (
          <div key={r.k} className="flex items-center justify-between">
            <span className="text-[12.5px] text-[#6B7280]">{r.k}</span>
            <span className="font-mono text-[12.5px] font-semibold text-[#F2F3F5]">{r.v}</span>
          </div>
        ))}
      </div>
    </PopoverContent>
  </Popover>
);

/** Mobile card form — section head of the Boost segment. */
export const BoostCheckCard = ({ data }: { data: BoostCheckData }) => {
  const [open, setOpen] = useState(false);
  const st = boostState(data.riskRatio);
  const fill = Math.min(Math.max(data.riskRatio, 0), 100);
  return (
    <>
      <div className="rounded-[12px] bg-[#12151A] px-[14px] py-[12px]">
        <div className="flex items-center justify-between">
          <span
            className="text-[10px] font-bold text-[#6B7280]"
            style={{ letterSpacing: "1.4px" }}
          >
            BOOST CHECK
          </span>
          <span className="text-[14px] font-bold" style={{ color: st.color }}>
            {st.word}
          </span>
        </div>
        <div className="my-2.5 h-[6px] w-full overflow-hidden rounded-full bg-[#1B1F26]">
          <div className="h-full rounded-full" style={{ width: `${fill}%`, background: st.color }} />
        </div>
        <div className="flex items-center justify-between text-[12px] text-[#6B7280]">
          <span>
            <span className="font-mono font-bold text-[#F2F3F5]">{moneyAuto(data.untilAutoClose)}</span>{" "}
            until auto-close starts
          </span>
          <button type="button" onClick={() => setOpen(true)} className="text-[12px] text-[#6B7280]">
            Details ›
          </button>
        </div>
      </div>
      <DetailsDrawer open={open} onOpenChange={setOpen} data={data} />
    </>
  );
};

/** Desktop bar form. */
export const BoostCheckBar = ({ data }: { data: BoostCheckData }) => {
  const st = boostState(data.riskRatio);
  const fill = Math.min(Math.max(data.riskRatio, 0), 100);
  return (
    <div className="flex items-center gap-3.5 rounded-[12px] bg-[#12151A] px-[16px] py-[11px]">
        <span className="text-[10px] font-bold text-[#6B7280]" style={{ letterSpacing: "1.4px" }}>
          BOOST CHECK
        </span>
        <span className="text-[14px] font-bold" style={{ color: st.color }}>
          {st.word}
        </span>
        <div className="h-[6px] w-[240px] overflow-hidden rounded-full bg-[#1B1F26]">
          <div className="h-full rounded-full" style={{ width: `${fill}%`, background: st.color }} />
        </div>
        <span className="ml-auto text-[12px] text-[#6B7280]">
          <span className="font-mono font-bold text-[#F2F3F5]">{moneyAuto(data.untilAutoClose)}</span>{" "}
          until auto-close starts · shared across Boost calls
        </span>
      <DetailsPopover data={data} />
    </div>
  );
};
