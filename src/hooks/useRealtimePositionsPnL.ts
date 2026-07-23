import { useEffect, useState, useCallback, useRef } from "react";
import { useRealtimePricesOptional } from "@/contexts/RealtimePricesContext";
import { supabase } from "@/integrations/supabase/client";

interface OptionMapping {
  optionId: string;
  eventId: string;
  label: string;
  eventName: string;
}

export const useRealtimePositionsPnL = () => {
  const pricesContext = useRealtimePricesOptional();
  const [optionMappings, setOptionMappings] = useState<Map<string, OptionMapping>>(new Map());
  const [labelMappings, setLabelMappings] = useState<Map<string, OptionMapping[]>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const hasFetched = useRef(false);

  // Fetch option mappings (for fallback matching when option_id is not set)
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchMappings = async () => {
      try {
        const { data, error } = await supabase
          .from("event_options")
          .select(`
            id,
            event_id,
            label,
            events!inner(name)
          `);

        if (error) {
          console.error("Error fetching option mappings:", error);
          setIsLoading(false);
          return;
        }

        if (data) {
          const mappings = new Map<string, OptionMapping>();
          const labelMap = new Map<string, OptionMapping[]>();
          
          data.forEach((option: any) => {
            const eventName = option.events?.name || "";
            const mapping: OptionMapping = {
              optionId: option.id,
              eventId: option.event_id,
              label: option.label,
              eventName: eventName,
            };
            
            // Primary key: exact match on event_name|option_label
            const key = `${eventName.toLowerCase()}|${option.label.toLowerCase()}`;
            mappings.set(key, mapping);
            
            // Secondary index: just label
            const labelKey = option.label.toLowerCase();
            if (!labelMap.has(labelKey)) {
              labelMap.set(labelKey, []);
            }
            labelMap.get(labelKey)!.push(mapping);
          });
          
          setOptionMappings(mappings);
          setLabelMappings(labelMap);
        }
      } catch (err) {
        console.error("Error in fetchMappings:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMappings();
  }, []);

  // Get the option ID for a position - with fuzzy matching support (fallback only)
  const getOptionIdFallback = useCallback((eventName: string, optionLabel: string): string | null => {
    const eventLower = eventName.toLowerCase();
    const labelLower = optionLabel.toLowerCase();
    
    // Try exact match first
    const exactKey = `${eventLower}|${labelLower}`;
    const exactMatch = optionMappings.get(exactKey);
    if (exactMatch) {
      return exactMatch.optionId;
    }
    
    // Try partial event name match
    for (const [key, mapping] of optionMappings.entries()) {
      const [storedEvent, storedLabel] = key.split('|');
      if (storedLabel === labelLower) {
        if (storedEvent.includes(eventLower) || eventLower.includes(storedEvent.substring(0, 20))) {
          return mapping.optionId;
        }
        const eventWords = eventLower.split(/\s+/).filter(w => w.length > 3);
        const storedWords = storedEvent.split(/\s+/);
        const matchCount = eventWords.filter(w => storedWords.some(sw => sw.includes(w))).length;
        if (matchCount >= 2) {
          return mapping.optionId;
        }
      }
    }
    
    // Last resort: just match by label
    const labelMatches = labelMappings.get(labelLower);
    if (labelMatches && labelMatches.length === 1) {
      return labelMatches[0].optionId;
    }
    
    if (labelMatches && labelMatches.length > 1) {
      for (const match of labelMatches) {
        const matchEventLower = match.eventName.toLowerCase();
        if (matchEventLower.includes(eventLower.substring(0, 15)) || 
            eventLower.includes(matchEventLower.substring(0, 15))) {
          return match.optionId;
        }
      }
      return labelMatches[0].optionId;
    }
    
    return null;
  }, [optionMappings, labelMappings]);

  // Get option ID - prefer direct option_id, fallback to matching
  const getOptionId = useCallback((
    eventName: string, 
    optionLabel: string, 
    directOptionId?: string | null
  ): string | null => {
    // If position has direct option_id, use it immediately
    if (directOptionId) {
      return directOptionId;
    }
    // Otherwise fall back to name matching
    return getOptionIdFallback(eventName, optionLabel);
  }, [getOptionIdFallback]);

  // Calculate realtime PnL for a position
  const calculateRealtimePnL = useCallback((
    position: {
      event: string;
      option: string;
      optionId?: string | null; // Direct option_id from position
      type: "long" | "short";
      entryPrice: string;
      size: string;
      margin: string;
    }
  ): {
    markPrice: number;
    pnl: number;
    pnlPercent: number;
    hasRealtimePrice: boolean;
  } => {
    // Parse values
    const entryPrice = parseFloat(position.entryPrice.replace(/[$,]/g, ""));
    const size = parseFloat(position.size.replace(/,/g, ""));
    const margin = parseFloat(position.margin.replace(/[$,]/g, ""));

    // Get option ID - prefer direct reference, fallback to matching
    const optionId = getOptionId(position.event, position.option, position.optionId);
    const realtimePrice = optionId && pricesContext ? pricesContext.getPrice(optionId) : undefined;

    if (realtimePrice !== undefined) {
      const priceDiff = realtimePrice - entryPrice;
      const pnl = position.type === "long" 
        ? priceDiff * size 
        : -priceDiff * size;
      const pnlPercent = margin > 0 ? (pnl / margin) * 100 : 0;

      return {
        markPrice: realtimePrice,
        pnl,
        pnlPercent,
        hasRealtimePrice: true,
      };
    }

    return {
      markPrice: entryPrice,
      pnl: 0,
      pnlPercent: 0,
      hasRealtimePrice: false,
    };
  }, [getOptionId, pricesContext]);

  const formatPnL = useCallback((pnl: number, pnlPercent: number) => {
    const pnlStr = `${pnl >= 0 ? "+" : ""}$${Math.abs(pnl).toFixed(2)}`;
    const pnlPercentStr = `${pnlPercent >= 0 ? "+" : ""}${pnlPercent.toFixed(1)}%`;
    return { pnlStr, pnlPercentStr };
  }, []);

  const formatMarkPrice = useCallback((price: number) => {
    return `$${price.toFixed(4)}`;
  }, []);

  // Lookup realtime mark price for a position using direct optionId + fallback matching.
  const getRealtimeMarkPrice = useCallback(
    (position: { event: string; option: string; optionId?: string | null }): number | undefined => {
      const optionId = getOptionId(position.event, position.option, position.optionId);
      return optionId && pricesContext ? pricesContext.getPrice(optionId) : undefined;
    },
    [getOptionId, pricesContext]
  );

  return {
    isLoading,
    getOptionId,
    getRealtimeMarkPrice,
    calculateRealtimePnL,
    formatPnL,
    formatMarkPrice,
    lastUpdate: pricesContext?.lastUpdate,
  };
};
