import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

const NOTICE_KEY = "omenx_points_retired_notice_dismissed";

/**
 * Points retirement notice — pure presentational card, props-driven.
 * Extracted verbatim out of LiteRewardsPage (same JSX); the page keeps
 * mounting the stateful wrapper below, which renders this card in place.
 */
export const PointsRetiredNoticeCard = ({
  onOpenVouchers,
  onDismiss,
}: {
  onOpenVouchers: () => void;
  onDismiss: () => void;
}) => (
  <div className="flex items-start gap-3 rounded-[12px] border border-[#23262D] bg-[#0F1114] px-4 py-3">
    <p className="flex-1 text-[12.5px] leading-5 text-[#C9CED6]">
      Points have retired. Rewards now come as Trial Position Vouchers.{" "}
      <button type="button" onClick={onOpenVouchers} className="text-[#33D6FF]">
        Open vouchers →
      </button>
    </p>
    <button
      type="button"
      aria-label="Dismiss"
      onClick={onDismiss}
      className="-m-2 grid h-11 w-11 place-items-center text-[#6B7280]"
    >
      <X className="h-4 w-4" />
    </button>
  </div>
);

export const PointsRetiredNotice = () => {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(NOTICE_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  if (dismissed) return null;

  return (
    <PointsRetiredNoticeCard
      onOpenVouchers={() => navigate("/vouchers")}
      onDismiss={() => {
        try {
          localStorage.setItem(NOTICE_KEY, "1");
        } catch {
          /* ignore */
        }
        setDismissed(true);
      }}
    />
  );
};
