import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Check, Copy, Loader2, UserCheck, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useReferral, type Referral } from "@/hooks/useReferral";
import { useIsMobile } from "@/hooks/use-mobile";
import { EmptyState } from "@/components/states";
import { ClaimButton, TaskRowShell } from "./TaskRowShell";
import { showClaimSuccessToast } from "./ClaimSuccessToastBody";

const PANEL = "rounded-[16px] border border-[#1D2026] bg-[#131519] p-4 md:p-[18px]";
const CAP = "text-[10px] font-bold uppercase tracking-[0.14em] text-[#6B7280]";

const QUALIFY_TARGET = 100;
const REFERRAL_VOUCHER = 5;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

const meta = (r: Referral) => (r.metadata ?? {}) as Record<string, unknown>;
const maskedEmail = (r: Referral) => (meta(r).masked_email as string) ?? "f***d@omenx.io";
const volumeOf = (r: Referral) => Number(meta(r).volume ?? 0);

const STEPS = [
  { step: "Step 1", text: "Share your link" },
  { step: "Step 2", text: "Friend signs up & trades $100" },
  { step: "Step 3", text: `You get a $${REFERRAL_VOUCHER} Trial Position Voucher`, volt: true },
];

/** Pure-display fixture for style-guide/preview use. Omit in production — behavior and visuals are unchanged. */
export interface ReferralPanelFixture {
  referralCode: string;
  referrals: Referral[];
}

export const ReferralPanel = ({ fixture }: { fixture?: ReferralPanelFixture }) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { referralCode, referrals, isLoading } = useReferral();
  const [copied, setCopied] = useState(false);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [claimed, setClaimed] = useState<string[]>([]);

  const link = (fixture ? fixture.referralCode : referralCode)
    ? `omenx.io/r/${fixture ? fixture.referralCode : referralCode}`
    : "";

  const rows = fixture ? fixture.referrals : referrals ?? [];
  const qualified = rows.filter((r) => r.status === "qualified" || r.status === "rewarded");
  const vouchersEarned = rows.filter(
    (r) => r.status === "rewarded" || claimed.includes(r.id),
  ).length * REFERRAL_VOUCHER;
  const claimable = rows.filter((r) => r.status === "qualified" && !claimed.includes(r.id)).length;

  const copy = async () => {
    if (fixture) return; // display-only fixture: interactions are inert
    try {
      await navigator.clipboard.writeText(`https://${link}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Could not copy the link");
    }
  };

  const claim = async (referralId: string) => {
    if (fixture) return; // display-only fixture: interactions are inert
    setClaiming(referralId);
    const { data, error } = await supabase.functions.invoke("claim-referral-voucher", {
      body: { referralId },
    });
    setClaiming(null);
    if (error || (data as { error?: string })?.error) {
      toast.error((data as { error?: string })?.error ?? "Could not claim this reward");
      return;
    }
    setClaimed((prev) => [...prev, referralId]);
    showClaimSuccessToast(() => navigate("/vouchers"));
  };

  const inviteRow = (r: Referral) => {
    const isClaimed = r.status === "rewarded" || claimed.includes(r.id);
    const isQualified = r.status === "qualified" || r.status === "rewarded";
    const volume = volumeOf(r);

    return (
      <TaskRowShell
        key={r.id}
        icon={isQualified ? UserCheck : UserPlus}
        title={maskedEmail(r)}
        faded={isClaimed}
        subtitle={
          isQualified
            ? `Qualified ${fmtDate(r.qualified_at ?? r.created_at)}`
            : `Signed up ${fmtDate(r.created_at)} · $${volume} / $${QUALIFY_TARGET} traded`
        }
        progress={isQualified ? undefined : { value: volume, target: QUALIFY_TARGET }}
        reward={
          isQualified ? (
              <div className="font-display text-[13.5px] font-bold text-[#CFFF4A]">
                ${REFERRAL_VOUCHER} voucher
              </div>
          ) : null
        }
        action={
          <>
            {isClaimed ? (
              <span className="whitespace-nowrap text-[12.5px] font-semibold text-[#9AA1AC]">Claimed</span>
            ) : isQualified ? (
              <ClaimButton onClick={() => claim(r.id)} disabled={claiming === r.id}>
                {claiming === r.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Claim voucher
              </ClaimButton>
            ) : (
              <span className="whitespace-nowrap text-[12.5px] font-semibold text-[#9AA1AC]">In progress</span>
            )}
          </>
        }
      />
    );
  };

  const inviteSection = (
    <section className={PANEL}>
      <div className={CAP}>Invite a friend</div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <div
          className="flex min-h-[44px] flex-1 items-center overflow-hidden rounded-[12px] px-3 font-display text-[14px] text-[#F2F3F5]"
          style={{ background: "#0F1114", border: "1px solid #2B2F38" }}
        >
          <span className="truncate">{isLoading ? "…" : link}</span>
        </div>
        <ClaimButton fullWidth={isMobile} onClick={copy} disabled={!link}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy link"}
        </ClaimButton>
      </div>

      <div className="mt-4 space-y-2.5">
        {STEPS.map((s) => (
          <div key={s.step} className="flex items-baseline gap-3">
            <span className="w-[52px] shrink-0 text-[10px] font-bold uppercase tracking-[0.12em] text-[#6B7280]">
              {s.step}
            </span>
            <span className="text-[12.5px]" style={{ color: s.volt ? "#CFFF4A" : "#C9CED6" }}>
              {s.text}
            </span>
          </div>
        ))}
      </div>
    </section>
  );

  const invitesSection = (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <span className={CAP}>Your invites</span>
        <span className="text-[11.5px] text-[#6B7280]">
          {qualified.length} of {rows.length} qualified
        </span>
      </div>

      {isLoading ? (
        <div className="h-[76px] animate-pulse rounded-[14px] bg-[#0F1114]" />
      ) : rows.length === 0 ? (
        <EmptyState
          variant="module"
          bordered={false}
          title="No invites yet"
          description="Share your link to get started."
        />
      ) : (
        rows.map(inviteRow)
      )}
    </section>
  );

  const finePrintSection = (
    <section className={PANEL}>
      <div className={CAP}>The fine print</div>
      <p className="mt-2 text-[11.5px] leading-5 text-[#6B7280]">
        Referral rewards are Trial Position Vouchers, issued after your friend completes $100 in trades and passes
        review. One reward per qualified friend, subject to anti-abuse checks.
      </p>
    </section>
  );

  if (isMobile) {
    return (
      <div className="space-y-4">
        {inviteSection}

        {/* Compact three-column overview strip */}
        <section className="rounded-[16px] border border-[#1D2026] bg-[#131519] p-4">
          <div className={CAP}>Your referrals</div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              { label: "Invited", value: `${rows.length}`, color: "#FFFFFF" },
              { label: "Qualified", value: `${qualified.length}`, color: "#FFFFFF" },
              { label: "Vouchers", value: `$${vouchersEarned}`, color: "#CFFF4A" },
            ].map((s) => (
              <div key={s.label} className="rounded-[12px] bg-[#0F1114] px-3 py-2.5">
                <div className="text-[10px] uppercase tracking-[0.1em] text-[#6B7280]">{s.label}</div>
                <div
                  className="mt-1 font-display text-[16px] font-bold tabular-nums"
                  style={{ color: s.color }}
                >
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          {claimable > 0 && (
            <div className="mt-3 text-[12.5px] font-bold text-[#CFFF4A]">● {claimable} ready to claim</div>
          )}

          <div className="mt-3">
            <ClaimButton fullWidth onClick={() => navigate("/vouchers")}>
              Open Position Vouchers →
            </ClaimButton>
          </div>
        </section>

        {invitesSection}
        {finePrintSection}
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="order-2 space-y-4 lg:order-1">
        {inviteSection}
        {invitesSection}
        {finePrintSection}
      </div>

      {/* Rail */}
      <aside
        className="order-1 flex h-fit flex-col gap-[14px] rounded-[16px] border border-[#1D2026] bg-[#131519] lg:order-2"
        style={{ padding: 18 }}
      >
        <div className={CAP}>Your referrals</div>

        <div className="flex items-baseline justify-between">
          <span className="text-[12.5px] text-[#9AA1AC]">Invited</span>
          <span className="font-display text-[15px] font-bold tabular-nums text-white">{rows.length}</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-[12.5px] text-[#9AA1AC]">Qualified</span>
          <span className="font-display text-[15px] font-bold tabular-nums text-white">{qualified.length}</span>
        </div>
        <div
          className="flex items-baseline justify-between"
          style={{ borderTop: "1px solid #1D2026", paddingTop: 11 }}
        >
          <span className="text-[12.5px] text-[#9AA1AC]">Vouchers earned</span>
          <span className="font-display text-[15px] font-bold tabular-nums text-[#CFFF4A]">${vouchersEarned}</span>
        </div>

        {claimable > 0 && (
          <div className="text-[12.5px] font-bold text-[#CFFF4A]">● {claimable} ready to claim</div>
        )}

        <ClaimButton fullWidth onClick={() => navigate("/vouchers")}>
          Open Position Vouchers →
        </ClaimButton>
      </aside>
    </div>
  );
};
