import lynxEmptyRecovery from "@/assets/wallet/lynx-empty-recovery.png";

/**
 * Production recovery-list empty state (/wallet/recovery).
 * Shared with the Style Guide W-31 preview so the two can never drift.
 * Lynx illustration only — no default icon (R-W3-FIX2).
 */
export const RecoveryEmptyState = () => (
  <div className="rounded-xl border border-border/60 bg-card/40 p-10 text-center space-y-2">
    <img
      src={lynxEmptyRecovery}
      alt=""
      aria-hidden
      draggable={false}
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).style.display = "none";
      }}
      className="mx-auto w-24 h-24 object-contain pointer-events-none select-none"
    />
    <div className="text-sm font-medium">No recovery requests yet</div>
    <div className="text-xs text-muted-foreground">
      Submit a request if a deposit was sent to the wrong network.
    </div>
  </div>
);

export default RecoveryEmptyState;
