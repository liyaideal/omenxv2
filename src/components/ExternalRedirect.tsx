import { useEffect } from "react";

/**
 * Route that lives only to forward an old in-app path to an external URL
 * (CPO 2026-09-28: /about, /faq, /methodology → help center). Uses
 * `location.replace` so the dead page never enters history.
 */
export const ExternalRedirect = ({ to }: { to: string }) => {
  useEffect(() => {
    window.location.replace(to);
  }, [to]);
  return null;
};
