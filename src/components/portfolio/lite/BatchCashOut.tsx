// ============================================================
// Lite /portfolio batch cash-out — selection toolbar, sticky action bar and
// the confirm layer (desktop Dialog / mobile MobileDrawer, per overlay rules).
// Pure UI: selection state and the actual closing live in LitePortfolio.
// ============================================================
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MobileDrawer, MobileDrawerActions } from "@/components/ui/mobile-drawer";
import { Button } from "@/components/ui/button";
import type { LiteLiveRow } from "@/hooks/useLitePortfolio";
import { money, signedMoney, livePnlColor } from "./parts";

/* ------------------------- selection toolbar ------------------------- */
/** Sits between the KPI block and the list when select mode is on. */
export const SelectToolbar = ({
  count,
  total,
  onSelectAll,
  onClear,
  onCancel,
}: {
  count: number;
  total: number;
  onSelectAll: () => void;
  onClear: () => void;
  onCancel: () => void;
}) => (
  <div className="flex items-center gap-3 px-4 lg:px-0 pb-1 pt-2 text-[12.5px]">
    <button type="button" onClick={onSelectAll} className="font-semibold text-[#33D6FF]">
      Select all
    </button>
    <button type="button" onClick={onClear} className="text-[#6B7280]">
      Clear
    </button>
    <span className="font-mono text-[#6B7280]">{count} selected</span>
    <button type="button" onClick={onCancel} className="ml-auto text-[#C7CCD4]">
      Cancel
    </button>
  </div>
);

/* --------------------------- sticky action bar --------------------------- */
export const BatchActionBar = ({
  rows,
  onCashOut,
}: {
  rows: LiteLiveRow[];
  onCashOut: () => void;
}) => {
  if (rows.length === 0) return null;
  const worth = rows.reduce((s, r) => s + r.nowWorth, 0);
  const profit = rows.reduce((s, r) => s + r.profit, 0);
  return (
    <div className="sticky bottom-[76px] lg:bottom-4 z-30 px-4 lg:px-0 pb-2">
      <div className="flex items-center gap-3 rounded-[12px] border border-[#2A2F38] bg-[#12151A]/95 px-4 py-3 backdrop-blur">
        <div className="min-w-0 flex-1">
          <div className="text-[12.5px] font-semibold text-[#F2F3F5]">
            {rows.length} selected
          </div>
          <div className="font-mono text-[11.5px] text-[#6B7280]">
            Now worth {money(worth)} · Profit{" "}
            <span style={{ color: livePnlColor(profit) }}>{signedMoney(profit)}</span>
          </div>
        </div>
        <Button className="h-10 rounded-[10px] px-5" onClick={onCashOut}>
          Cash out {rows.length}
        </Button>
      </div>
    </div>
  );
};

/* ---------------------------- confirm layer ---------------------------- */
const ConfirmBody = ({ rows }: { rows: LiteLiveRow[] }) => {
  const total = rows.reduce((s, r) => s + r.nowWorth, 0);
  return (
    <>
      <div className="rounded-lg border bg-muted/30 p-3">
        <div className="flex flex-col divide-y divide-border/50">
          {rows.map((r) => (
            <div key={r.id} className="flex items-center gap-2 py-2 text-xs first:pt-0 last:pb-0">
              <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                {r.eventName}
              </span>
              <span className="shrink-0 font-mono text-[#6B7280]">{r.sideWord}</span>
              <span className="shrink-0 font-mono font-semibold text-foreground">
                {money(r.nowWorth)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-border/50 pt-2 text-xs">
          <span className="text-[#6B7280]">You get about</span>
          <span className="font-mono font-bold text-foreground">{money(total)}</span>
        </div>
      </div>
      <p className="mt-2 text-xs text-[#6B7280]">
        Prices move while we close — the final amount can differ slightly.
      </p>
    </>
  );
};

const Actions = ({
  onCancel,
  onConfirm,
  closingLabel,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  /** e.g. "Closing 2 / 5…"; null = idle */
  closingLabel: string | null;
}) => (
  <>
    <Button variant="outline" className="h-11 flex-1" onClick={onCancel} disabled={!!closingLabel}>
      Cancel
    </Button>
    <Button className="h-11 flex-1" onClick={onConfirm} disabled={!!closingLabel}>
      {closingLabel ?? "Cash out"}
    </Button>
  </>
);

export const BatchCashOutConfirm = ({
  open,
  onOpenChange,
  rows,
  isMobile,
  closingLabel,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rows: LiteLiveRow[];
  isMobile: boolean;
  closingLabel: string | null;
  onConfirm: () => void;
}) => {
  const cancel = () => onOpenChange(false);
  if (isMobile) {
    return (
      <MobileDrawer
        open={open}
        onOpenChange={onOpenChange}
        title={`Cash out ${rows.length} positions`}
      >
        <ConfirmBody rows={rows} />
        <MobileDrawerActions className="mt-4">
          <Actions onCancel={cancel} onConfirm={onConfirm} closingLabel={closingLabel} />
        </MobileDrawerActions>
      </MobileDrawer>
    );
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Cash out {rows.length} positions</DialogTitle>
        </DialogHeader>
        <ConfirmBody rows={rows} />
        <div className="mt-4 flex gap-2">
          <Actions onCancel={cancel} onConfirm={onConfirm} closingLabel={closingLabel} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
