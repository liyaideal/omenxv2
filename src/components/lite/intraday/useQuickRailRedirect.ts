// ============================================================
// Quick rounds moved to the contract rail (CPO 2026-10-09). Their home is
// /trade; an old /spot?event=crypto-… link (share poster, bookmark, position
// card from before the switch) bounces to /trade once the round's
// product_lines say 'contract'. Rounds still on the spot rail stay put.
// Used by the /spot route for BOTH surfaces.
// ============================================================
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { parseQuickId } from "./intradayData";

export const useQuickRailRedirect = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const eventId = params.get("event") || "";
  const quick = !!parseQuickId(eventId);
  const [checked, setChecked] = useState(!quick);

  useEffect(() => {
    if (!quick) return;
    let alive = true;
    (async () => {
      const { data } = await supabase.from("events").select("product_lines").eq("id", eventId).maybeSingle();
      if (!alive) return;
      const lines = (data?.product_lines as string[] | null) || [];
      if (lines.includes("contract") || lines.includes("futures")) {
        navigate(`/trade?event=${encodeURIComponent(eventId)}`, { replace: true, state: location.state });
      } else {
        setChecked(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [quick, eventId, navigate, location.state]);

  /** false while a quick-round id is still being checked (render nothing). */
  return checked;
};
