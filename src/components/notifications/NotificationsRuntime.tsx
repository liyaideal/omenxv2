/**
 * NotificationsRuntime — mounted once under the router (App.tsx):
 * realtime refresh of the notification queries + the two demo-only client
 * producers (Boost check tier, new sign-in). Renders nothing.
 */
import { useNotificationProducers, useNotificationsRealtime } from "@/hooks/useNotifications";

export const NotificationsRuntime = () => {
  useNotificationsRealtime();
  useNotificationProducers();
  return null;
};
