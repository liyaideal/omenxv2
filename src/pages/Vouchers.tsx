import { useEffect, useState } from "react";
import { Ticket, Sparkles } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileHeader } from "@/components/MobileHeader";
import { EventsDesktopHeader } from "@/components/EventsDesktopHeader";
import { PageHeader } from "@/components/PageHeader";
import { BottomNav } from "@/components/BottomNav";
import { AuthGateOverlay } from "@/components/AuthGateOverlay";
import { usePositionVouchers } from "@/hooks/usePositionVouchers";
import { useEventSideLabelsLookup } from "@/hooks/useEventSideLabelsLookup";
import { getBinaryOutcome } from "@/lib/eventUtils";
import { VoucherCard } from "@/components/vouchers/VoucherCard";
import { RedeemVoucherContent } from "@/components/vouchers/RedeemVoucherContent";
import { VoucherEarningsCard } from "@/components/vouchers/VoucherEarningsCard";
import { EmptyState, LoadingState, ErrorState } from "@/components/states";

const Vouchers = () => {
  const isMobile = useIsMobile();
  const { vouchers, grantedVouchers, claimedVouchers, isLoading, isError, refetch, claim } = usePositionVouchers();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const handleClaim = async (voucherId: string) => {
    setClaimingId(voucherId);
    await claim(voucherId);
    setClaimingId(null);
  };

  const issuedVouchers = claimedVouchers;

  // Default-select the first available voucher; keep selection valid as the list changes
  useEffect(() => {
    if (issuedVouchers.length === 0) {
      if (selectedId !== null) setSelectedId(null);
      return;
    }
    if (!selectedId || !issuedVouchers.some((v) => v.id === selectedId)) {
      setSelectedId(issuedVouchers[0].id);
    }
  }, [issuedVouchers, selectedId]);

  const selected = issuedVouchers.find((v) => v.id === selectedId) ?? null;

  const redeemed = vouchers.filter(
    (v) =>
      v.status === "redeemed" ||
      v.status === "settled" ||
      // Fallback: voucher row may still say 'redeemed' if its status flip lagged,
      // but the underlying airdrop position has already been settled.
      v.redeemedAirdropStatus === "settled",
  );
  const expired = vouchers.filter(
    (v) => v.status === "expired" || (v.status === "issued" && new Date(v.expiresAt).getTime() <= Date.now()),
  );

  const redeemPanel = selected ? (() => {
    const cap = selected.faceValue * selected.redeemableCapPct;
    return (
      <div className="trading-card">
        {/* Header band */}
        <div className="relative border-b border-border bg-gradient-to-br from-primary/10 via-card/40 to-card/40 p-4 md:p-5 rounded-t-xl">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 md:gap-4">
            {/* Left: label + face value + code chip */}
            <div className="flex flex-col gap-2 min-w-0">
              <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                Redeeming voucher
              </div>
              <div className="flex items-baseline gap-2 md:gap-3 flex-wrap">
                <span className="font-mono text-3xl md:text-4xl font-semibold text-foreground leading-none">
                  ${selected.faceValue.toFixed(2)}
                </span>
                <span className="inline-flex items-center rounded-md border border-border bg-muted/40 px-2 py-0.5 font-mono text-[11px] tracking-widest text-muted-foreground">
                  {selected.code}
                </span>
              </div>
            </div>

            {/* Right: meta stats */}
            <div className="grid grid-cols-2 gap-2 md:flex md:items-stretch">
              <div className="rounded-lg border border-border bg-background/40 px-3 py-2 md:min-w-[92px]">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Max profit</div>
                <div className="font-mono text-sm text-trading-green mt-0.5">${cap.toFixed(2)}</div>
              </div>
              <div className="rounded-lg border border-border bg-background/40 px-3 py-2 md:min-w-[92px]">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Hold window</div>
                <div className="font-mono text-sm text-foreground mt-0.5">{selected.maxHoldingHours}h</div>
              </div>
            </div>
          </div>

          <div className="mt-3 text-[11px] text-muted-foreground">
            Pick a market below to open your free position.
          </div>
        </div>

        <div className="p-4 md:p-5">
          <RedeemVoucherContent voucher={selected} variant="inline" />
        </div>
      </div>
    );
  })() : null;

  return (
    <div
      className={`min-h-screen ${isMobile ? "pb-24" : ""}`}
      style={{
        background: isMobile
          ? "hsl(222 47% 6%)"
          : "radial-gradient(ellipse 80% 50% at 50% -20%, hsl(260 50% 15% / 0.3) 0%, hsl(222 47% 6%) 70%)",
      }}
    >
      {isMobile ? <MobileHeader title="Vouchers" showLogo={false} showBack={true} /> : <EventsDesktopHeader />}

      <AuthGateOverlay
        title="Sign in to view your vouchers"
        description="Position vouchers let you open a free position on any tradeable event."
      >
        <main className={`${isMobile ? "px-4 py-6" : "mx-auto w-full max-w-7xl px-8 py-10"} space-y-6`}>
          {!isMobile && (
            <PageHeader
              title="Position Vouchers"
              subtitle="Redeem a voucher to instantly open a free position on any eligible event. Profits are capped per voucher; losses don't touch your balance."
            />
          )}

          <VoucherEarningsCard />

          {isLoading && <LoadingState label="Loading vouchers…" variant="skeleton" skeletonRows={3} />}

          {!isLoading && isError && (
            <ErrorState
              title="Couldn't load vouchers"
              description="Something went wrong fetching your vouchers."
              onRetry={() => refetch()}
            />
          )}

          {!isLoading && !isError && vouchers.length === 0 && (
            <EmptyState
              variant="card"
              icon={Ticket}
              title="No vouchers yet"
              description="When you receive a position voucher, it'll show up here ready to redeem."
            />
          )}

          {!isLoading && vouchers.length > 0 && (
            isMobile ? (
              // ===== Mobile: single column =====
              <div className="space-y-6">
                {grantedVouchers.length > 0 && (
                  <section className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <h2 className="text-sm font-medium text-foreground">
                        To claim ({grantedVouchers.length})
                      </h2>
                    </div>
                    <div className="-mr-4 pl-3 flex gap-3 overflow-x-auto snap-x snap-mandatory pb-3 pt-2">
                      {grantedVouchers.map((v) => (
                        <div key={v.id} className="snap-start shrink-0 w-[280px]">
                          <VoucherCard
                            voucher={v}
                            compact
                            claiming={claimingId === v.id}
                            onClaim={(vc) => handleClaim(vc.id)}
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground">After you claim, you have 7 days to redeem.</p>
                  </section>
                )}

                {issuedVouchers.length > 0 && (
                  <section className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <h2 className="text-sm font-medium text-foreground">
                        Available ({issuedVouchers.length})
                      </h2>
                    </div>
                    <div className="-mr-4 pl-3 flex gap-3 overflow-x-auto snap-x snap-mandatory pb-3 pt-2">
                      {issuedVouchers.map((v) => (
                        <div key={v.id} className="snap-start shrink-0 w-[280px]">
                          <VoucherCard
                            voucher={v}
                            compact
                            selected={v.id === selectedId}
                            onRedeem={(vc) => setSelectedId(vc.id)}
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {redeemPanel}

                {redeemed.length > 0 && <RedeemedSection items={redeemed} />}
                {expired.length > 0 && <ExpiredSection items={expired} />}
              </div>
            ) : (
              // ===== Desktop: two-column =====
              <div className="grid grid-cols-12 gap-6 items-start">
                <aside className="col-span-4 space-y-6">
                  {grantedVouchers.length > 0 && (
                    <section className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <h2 className="text-sm font-medium text-foreground">
                          To claim ({grantedVouchers.length})
                        </h2>
                      </div>
                      <div className="space-y-2">
                        {grantedVouchers.map((v) => (
                          <VoucherCard
                            key={v.id}
                            voucher={v}
                            compact
                            claiming={claimingId === v.id}
                            onClaim={(vc) => handleClaim(vc.id)}
                          />
                        ))}
                      </div>
                      <p className="text-[11px] text-muted-foreground">After you claim, you have 7 days to redeem.</p>
                    </section>
                  )}

                  {issuedVouchers.length > 0 && (
                    <section className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <h2 className="text-sm font-medium text-foreground">
                          Available ({issuedVouchers.length})
                        </h2>
                      </div>
                      <div className="space-y-2">
                        {issuedVouchers.map((v) => (
                          <VoucherCard
                            key={v.id}
                            voucher={v}
                            compact
                            selected={v.id === selectedId}
                            onRedeem={(vc) => setSelectedId(vc.id)}
                          />
                        ))}
                      </div>
                    </section>
                  )}

                  {redeemed.length > 0 && <RedeemedSection items={redeemed} />}
                  {expired.length > 0 && <ExpiredSection items={expired} />}
                </aside>

                <section className="col-span-8">
                  {redeemPanel ?? (
                    <div className="trading-card p-10 text-center">
                      <div className="text-sm text-muted-foreground">
                        No active vouchers to redeem.
                      </div>
                    </div>
                  )}
                </section>
              </div>
            )
          )}
        </main>
      </AuthGateOverlay>

      {isMobile && <BottomNav />}
    </div>
  );
};

const RedeemedSection = ({ items }: { items: ReturnType<typeof usePositionVouchers>["vouchers"] }) => {
  const sideLabelsLookup = useEventSideLabelsLookup();

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground">Redeemed ({items.length})</h2>
      <div className="space-y-2">
        {items.map((v) => {
        const isClosed = v.status === "settled" || v.redeemedAirdropStatus === "settled";
        const pnl = v.redeemedSettledPnl;
        const pnlColor =
          pnl == null ? "text-muted-foreground" : pnl >= 0 ? "text-trading-green" : "text-trading-red";
        const rawOutcome = v.redeemedOutcomeLabel ?? null;
        const binaryOutcome = getBinaryOutcome(rawOutcome);
        const { labels: redeemedSideLabels } = sideLabelsLookup(v.redeemedEventName ?? "");
        const sideLabel = binaryOutcome && redeemedSideLabels
          ? redeemedSideLabels[binaryOutcome]
          : rawOutcome || (v.redeemedSide ? v.redeemedSide.toUpperCase() : null);
        const sideLabelColor =
          binaryOutcome === "yes" ? "text-trading-green" : binaryOutcome === "no" ? "text-trading-red" : "text-muted-foreground";
        return (
          <div
            key={v.id}
            className={`rounded-lg border border-border bg-muted/20 p-3 ${isClosed ? "opacity-80" : ""}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs text-muted-foreground">{v.code}</span>
                  <span className="font-mono text-sm">${v.faceValue.toFixed(2)}</span>
                </div>
                {sideLabel && !binaryOutcome && (
                  <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center rounded border border-border bg-background/40 px-1.5 py-0.5 text-[10px] tracking-wider uppercase text-muted-foreground">
                      {sideLabel}
                    </span>
                    {v.redeemedSide && (
                      <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] tracking-wider uppercase ${
                        v.redeemedSide === "long"
                          ? "border-trading-green/40 bg-trading-green/10 text-trading-green"
                          : "border-trading-red/40 bg-trading-red/10 text-trading-red"
                      }`}>
                        {v.redeemedSide === "long" ? "YES" : "NO"}
                      </span>
                    )}
                  </div>
                )}
                {v.redeemedEventName && (
                  <div className="text-xs text-foreground/80 mt-1 truncate">{v.redeemedEventName}</div>
                )}
                {sideLabel && binaryOutcome && (
                  <div className="mt-1.5 min-w-0">
                    <span className={`inline-flex max-w-full items-center rounded border border-border bg-background/40 px-1.5 py-0.5 text-[10px] normal-case truncate ${sideLabelColor}`}>
                      {sideLabel}
                    </span>
                  </div>
                )}

                <div className="text-[11px] text-muted-foreground mt-1">
                  Redeemed {v.redeemedAt ? new Date(v.redeemedAt).toLocaleDateString() : ""}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className={`text-[11px] ${isClosed ? "text-muted-foreground" : "text-primary"}`}>
                  {isClosed ? "Position closed" : "Position open"}
                </span>
                {isClosed && pnl != null && (
                  <span className={`font-mono text-sm ${pnlColor}`}>
                    {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
        })}
      </div>
    </section>
  );
};


const ExpiredSection = ({ items }: { items: ReturnType<typeof usePositionVouchers>["vouchers"] }) => (
  <section className="space-y-3">
    <h2 className="text-sm font-medium text-muted-foreground">Expired ({items.length})</h2>
    <div className="space-y-2">
      {items.map((v) => {
        const reason =
          v.claimedAt && !v.redeemedAt
            ? "Claimed, not redeemed"
            : !v.claimedAt
              ? "Unclaimed"
              : null;
        return (
          <div
            key={v.id}
            className="rounded-lg border border-border bg-muted/10 p-3 flex items-center justify-between gap-3 opacity-70"
          >
            <div>
              <span className="font-mono text-xs text-muted-foreground">{v.code}</span>
              <span className="font-mono text-sm ml-2">${v.faceValue.toFixed(2)}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[11px] text-muted-foreground">Expired</span>
              {reason && (
                <span className="text-[10px] text-muted-foreground/70">{reason}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  </section>
);


export default Vouchers;
