import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MaintenanceNotice } from "@/config/maintenanceNotices";
import { useMaintenanceNotices } from "@/hooks/useMaintenanceNotices";

interface NoticeProps {
  notice: MaintenanceNotice;
}

const NoticeRow = ({ notice }: NoticeProps) => (
  <div
    role="alert"
    className={cn(
      "flex gap-3 rounded-lg border p-3",
      "border-trading-yellow/30 bg-trading-yellow/10 text-foreground",
    )}
  >
    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-trading-yellow" />
    <div className="min-w-0 flex-1 space-y-1">
      <p className="text-sm font-medium leading-snug">
        Network maintenance · <span className="font-mono">{notice.network}</span>
      </p>
      <p className="text-xs text-muted-foreground leading-snug">
        {notice.network} deposits &amp; withdrawals are temporarily suspended by our custody provider. Funds sent during this window may be delayed.
      </p>
      {notice.note && (
        <p className="text-xs text-muted-foreground leading-snug">{notice.note}</p>
      )}
    </div>
  </div>
);

interface BannerListProps {
  notices: MaintenanceNotice[];
  className?: string;
}

/** Pure presentational list — used by both the live banner and the style-guide demo. */
export const MaintenanceNoticeBannerView = ({ notices, className }: BannerListProps) => {
  if (notices.length === 0) return null;
  return (
    <div className={cn("space-y-2", className)}>
      {notices.map((notice) => (
        <NoticeRow key={notice.id} notice={notice} />
      ))}
    </div>
  );
};

/** Live banner — reads from MAINTENANCE_NOTICES. */
export const MaintenanceNoticeBanner = ({ className }: { className?: string }) => {
  const { active } = useMaintenanceNotices();
  return <MaintenanceNoticeBannerView notices={active} className={className} />;
};

/** Mock notices for style-guide demonstration only. */
export const MAINTENANCE_NOTICE_DEMO_SETS: Record<
  "single" | "multiple" | "withNote" | "empty",
  MaintenanceNotice[]
> = {
  single: [
    {
      id: "demo-base-eth",
      network: "BASE_ETH",
      startAt: "2026-06-25T17:00:00Z",
    },
  ],
  multiple: [
    {
      id: "demo-base-eth",
      network: "BASE_ETH",
      startAt: "2026-06-25T17:00:00Z",
    },
    {
      id: "demo-polygon",
      network: "POLYGON",
      startAt: "2026-06-25T17:00:00Z",
    },
  ],
  withNote: [
    {
      id: "demo-base-eth-note",
      network: "BASE_ETH",
      startAt: "2026-06-25T17:00:00Z",
      note: "Expected duration ~2 hours. Pending deposits will be credited after the service is restored.",
    },
  ],
  empty: [],
};
