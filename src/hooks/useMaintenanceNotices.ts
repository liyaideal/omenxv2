import { useEffect, useState } from "react";
import { MAINTENANCE_NOTICES, type MaintenanceNotice } from "@/config/maintenanceNotices";

const isActive = (notice: MaintenanceNotice, now: number) => {
  const start = Date.parse(notice.startAt);
  if (Number.isFinite(start) && now < start) return false;
  if (notice.endAt) {
    const end = Date.parse(notice.endAt);
    if (Number.isFinite(end) && now >= end) return false;
  }
  return true;
};

/**
 * Returns currently-active custody maintenance notices.
 *
 * TODO: swap the constant source for a remote feed (Supabase table /
 * edge function) once ops needs to publish notices without a deploy.
 */
export const useMaintenanceNotices = () => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(tick);
  }, []);

  const active = MAINTENANCE_NOTICES.filter((notice) => isActive(notice, now));
  return { active };
};
