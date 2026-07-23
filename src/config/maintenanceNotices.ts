export interface MaintenanceNotice {
  /** Stable id, e.g. 'base-eth-2026-06-26' */
  id: string;
  /** Display network label, e.g. 'BASE_ETH' */
  network: string;
  /** ISO start time. Example: '2026-06-25T17:00:00Z' (UTC+8 01:00) */
  startAt: string;
  /** Optional ISO end time. If omitted, the notice stays active until manually removed. */
  endAt?: string;
  /** Optional extra note shown beneath the main message. */
  note?: string;
}

/**
 * Active maintenance notices coming from our custody provider (Cobo).
 *
 * Ops workflow:
 *   - When Cobo posts a suspension notice, append one entry here.
 *   - When service is restored, delete the entry. No separate "resumed"
 *     banner is shown — on-chain transactions during the window will be
 *     credited automatically after resumption.
 *
 * TODO: swap to a remote source (Supabase table) once we need non-deploy edits.
 */
export const MAINTENANCE_NOTICES: MaintenanceNotice[] = [];
