/**
 * Voucher preview cases mounted inside <DeviceFrame> iframes so `md:` breakpoints
 * resolve against the 375px mobile viewport.
 *
 * REAL production components only (with mock props):
 *  - VoucherBannerView   → src/components/vouchers/VoucherBanner.tsx (mounted on /portfolio)
 *  - CloseVoucherContent → src/components/positions/CloseVoucherContent.tsx
 *                          (mounted by CloseVoucherDialog on /trade desktop and
 *                           CloseVoucherDrawer inside PositionCard on mobile)
 */

import { useState } from "react";
import { VoucherBannerView } from "@/components/vouchers/VoucherBanner";
import { CloseVoucherContent } from "@/components/positions/CloseVoucherContent";

const PresetRail = ({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (v: any) => void;
}) => (
  <div className="flex flex-wrap gap-1.5">
    {options.map((o) => (
      <button
        key={o.id}
        type="button"
        onClick={() => onChange(o.id)}
        className={`h-7 px-2.5 rounded-full text-[11px] border transition ${
          value === o.id
            ? "bg-primary/15 border-primary/40 text-primary"
            : "bg-muted/30 border-border text-muted-foreground hover:text-foreground"
        }`}
      >
        {o.label}
      </button>
    ))}
  </div>
);

const Frame = ({ children, label }: { children: React.ReactNode; label?: string }) => (
  <div className="space-y-2">
    {label && <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>}
    <div className="rounded-xl border border-border/60 bg-background/40 p-4">{children}</div>
  </div>
);

/* ---------------- Banner (real component) ---------------- */

type BannerState = "hidden" | "grantedOnly" | "grantedAndClaimed" | "claimedOnly";

export const BannerPreview = () => {
  const [state, setState] = useState<BannerState>("grantedOnly");

  const grantedCount = state === "grantedOnly" ? 2 : state === "grantedAndClaimed" ? 1 : 0;
  const claimedCount = state === "claimedOnly" ? 3 : state === "grantedAndClaimed" ? 2 : 0;

  return (
    <div className="space-y-3">
      <PresetRail
        value={state}
        onChange={setState}
        options={[
          { id: "hidden", label: "Hidden (0 vouchers)" },
          { id: "grantedOnly", label: "Granted only" },
          { id: "grantedAndClaimed", label: "Granted + claimed" },
          { id: "claimedOnly", label: "Claimed only" },
        ]}
      />
      <Frame>
        {state === "hidden" && (
          <div className="text-xs text-muted-foreground italic">
            Banner returns null when the user has zero granted and zero claimed vouchers.
          </div>
        )}
        <VoucherBannerView grantedCount={grantedCount} claimedCount={claimedCount} />
      </Frame>
    </div>
  );
};

/* ---------------- CloseVoucherContent (real component) ---------------- */

type CloseState =
  | "longProfit"
  | "longProfitCapped"
  | "longLoss"
  | "shortProfit"
  | "shortLoss"
  | "submitting";

const CLOSE_PRESETS: Record<
  CloseState,
  { side: "long" | "short"; entry: number; mark: number; face: number; label: string }
> = {
  longProfit:       { side: "long",  entry: 0.42, mark: 0.62, face: 25, label: "Magomed Ankalaev" },
  longProfitCapped: { side: "long",  entry: 0.20, mark: 0.95, face: 25, label: "Magomed Ankalaev" },
  longLoss:         { side: "long",  entry: 0.42, mark: 0.18, face: 25, label: "Magomed Ankalaev" },
  shortProfit:      { side: "short", entry: 0.70, mark: 0.20, face: 25, label: "Magomed Ankalaev" },
  shortLoss:        { side: "short", entry: 0.30, mark: 0.85, face: 25, label: "Magomed Ankalaev" },
  submitting:       { side: "long",  entry: 0.42, mark: 0.62, face: 25, label: "Magomed Ankalaev" },
};

export const ClosePreview = () => {
  const [state, setState] = useState<CloseState>("longProfit");
  const p = CLOSE_PRESETS[state];
  return (
    <div className="space-y-3">
      <PresetRail
        value={state}
        onChange={setState}
        options={[
          { id: "longProfit", label: "Long · profit" },
          { id: "longProfitCapped", label: "Long · capped" },
          { id: "longLoss", label: "Long · loss" },
          { id: "shortProfit", label: "Short · profit" },
          { id: "shortLoss", label: "Short · loss" },
          { id: "submitting", label: "Submitting" },
        ]}
      />
      <Frame>
        <div className="max-w-md">
          <CloseVoucherContent
            optionLabel={p.label}
            side={p.side}
            entryPrice={p.entry}
            markPrice={p.mark}
            faceValue={p.face}
            redeemableCap={p.face}
            isClosing={state === "submitting"}
            onConfirm={() => {}}
            onCancel={() => {}}
          />
        </div>
      </Frame>
    </div>
  );
};
