// ============================================================
// Every open voucher call on one event, for a Lite trade page.
// Self-contained: reads positions, prices the call at the live mark,
// renders the card(s) and owns the cash-out flow. The host page only
// has to (a) drop this next to its own position card and (b) keep
// voucher legs out of its regular position logic (`isVoucherLeg`).
//
// `line` is the page's product line: Boost pages pass "futures", Standard
// pages pass "spot". A voucher redeemed on a Standard event is a spot
// order at face value, so its card never carries a multiplier.
// ============================================================
import { useMemo, useState } from "react";
import { usePositions, type UnifiedPosition } from "@/hooks/usePositions";
import { useRealtimePositionsPnL } from "@/hooks/useRealtimePositionsPnL";
import { getI18nLanguage } from "@/i18n";
import { legTitle, resolveLegSide } from "@/lib/liteSideName";
import { voucherCredit } from "@/lib/voucherMath";
import { LiteVoucherCard } from "./LiteVoucherCard";
import { LiteVoucherCashOutFlow } from "./LiteVoucherCashOut";

/** True for a position opened by redeeming a voucher. */
export const isVoucherLeg = (p: Pick<UnifiedPosition, "isAirdrop" | "airdropSource">) =>
  !!p.isAirdrop && p.airdropSource === "voucher";

/** "Nov 21, 13:36" in the reader's language. */
export const formatVoucherClosesBy = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(getI18nLanguage(), {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

interface Props {
  event: { name: string; side_labels?: unknown };
  /** Sibling line markets shown on the same page (sports fixtures). */
  siblingEvents?: { name: string; side_labels?: unknown }[];
  line: "futures" | "spot";
  /** Quick rounds reuse one event name every round — match the round by its
   *  option-id prefix (`{eventId}-`) instead of by name. */
  optionIdPrefix?: string;
  isMobile: boolean;
  className?: string;
}

export const LiteVoucherLegs = ({
  event,
  siblingEvents,
  line,
  optionIdPrefix,
  isMobile,
  className,
}: Props) => {
  const { positions, refetch } = usePositions();
  const { getRealtimeMarkPrice } = useRealtimePositionsPnL();
  // The flow outlives the leg: once closed the position leaves `positions`,
  // but the after-close layer must stay up — so the request is held here.
  const [flow, setFlow] = useState<{
    id: string;
    airdropId: string;
    leg: string;
    isYes: boolean;
    credit: number;
    cap: number;
  } | null>(null);

  const eventsByName = useMemo(() => {
    const m = new Map<string, { name: string; side_labels?: unknown }>();
    m.set(event.name, event);
    (siblingEvents ?? []).forEach((s) => m.set(s.name, s));
    return m;
  }, [event, siblingEvents]);

  const legs = positions
    .filter(
      (p) =>
        isVoucherLeg(p) &&
        p.productLine === line &&
        eventsByName.has(p.event) &&
        (!optionIdPrefix || (typeof p.optionId === "string" && p.optionId.startsWith(optionIdPrefix))),
    )
    .map((p) => {
      const info = resolveLegSide({ option: p.option, type: p.type }, eventsByName.get(p.event));
      const mark =
        getRealtimeMarkPrice({ event: p.event, option: p.option, optionId: p.optionId }) ??
        p.markPriceNum;
      const faceValue = p.voucherFaceValue ?? p.marginNum;
      const math = voucherCredit({
        entryPrice: p.entryPriceNum,
        markPrice: mark,
        side: p.type,
        faceValue,
        leverage: p.leverageNum,
        redeemableCap: p.voucherRedeemableCap,
        redeemableCapPct: p.voucherRedeemableCapPct,
      });
      return { p, leg: legTitle(info), isYes: info.side === "yes", faceValue, math };
    });

  if (legs.length === 0 && !flow) return null;
  // While the leg is still open the panel tracks the live mark.
  const liveLeg = flow ? legs.find((l) => l.p.id === flow.id) : undefined;

  return (
    <div className={className ?? "space-y-3"}>
      {legs.map(({ p, leg, isYes, faceValue, math }) => (
        <LiteVoucherCard
          key={p.id}
          anchorKey={p.optionId ?? ""}
          sideLabel={leg}
          isYes={isYes}
          boost={line === "spot" ? 1 : p.leverageNum}
          faceValue={faceValue}
          credit={math.credit}
          rawPnl={math.rawPnl}
          cap={math.cap}
          closesBy={formatVoucherClosesBy(p.voucherExpiresAt)}
          compact={isMobile}
          onCashOut={() =>
            p.airdropId &&
            setFlow({
              id: p.id,
              airdropId: p.airdropId,
              leg,
              isYes,
              credit: math.credit,
              cap: math.cap,
            })
          }
        />
      ))}
      {flow && (
        <LiteVoucherCashOutFlow
          isMobile={isMobile}
          airdropId={flow.airdropId}
          leg={flow.leg}
          isYes={flow.isYes}
          credit={liveLeg ? liveLeg.math.credit : flow.credit}
          cap={liveLeg ? liveLeg.math.cap : flow.cap}
          onClosed={() => refetch?.()}
          onExit={() => setFlow(null)}
        />
      )}
    </div>
  );
};
