import { useState, useCallback, useMemo, useEffect } from "react";
import { useActiveEvents, EventWithOptions, DatabaseEventOption } from "@/hooks/useActiveEvents";
import { useRealtimePricesOptional } from "@/contexts/RealtimePricesContext";

// Legacy types for compatibility
export interface EventOption {
  id: string;
  label: string;
  price: string;
}

export interface EventStats {
  high24h?: string;
  low24h?: string;
  volume24h?: string;
  marketCap?: string;
}

export interface ExternalPlatformLink {
  platform: string;
  url: string;
  icon: string;
}

export interface TradingEvent {
  id: string;
  name: string;
  icon: string;
  ends: string;
  endTime: Date;
  period: string;
  volume: string;
  description: string;
  rules: string[];
  sourceUrl: string;
  sourceName: string;
  resolutionSource: string;
  externalLinks?: ExternalPlatformLink[];
  // Optional fields for specific event types
  tweetCount?: number;
  currentPrice?: string;
  priceChange24h?: string;
  priceLabel?: string;
  stats?: EventStats;
  /**
   * 单 market binary 事件的两端展示别名（如体育："上海申花" / "山东鲁能"）。
   * 缺省时 UI fallback 到 "Yes" / "No"；底层 option.label 仍是 "Yes"/"No"。
   */
  sideLabels?: { yes: string; no: string };
}

// Local storage keys
const STORAGE_KEYS = {
  FAVORITES: "trading_favorites",
  LAST_EVENT: "trading_last_event",
  LAST_OPTION: "trading_last_option",
} as const;

// Helper functions for localStorage
const getStoredFavorites = (): Set<string> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return new Set(parsed);
      }
    }
  } catch (e) {
    console.warn("Failed to parse stored favorites:", e);
  }
  return new Set();
};

const setStoredFavorites = (favorites: Set<string>): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify([...favorites]));
  } catch (e) {
    console.warn("Failed to store favorites:", e);
  }
};

const getStoredLastEvent = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEYS.LAST_EVENT);
  } catch (e) {
    return null;
  }
};

const setStoredLastEvent = (eventId: string): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_EVENT, eventId);
  } catch (e) {
    console.warn("Failed to store last event:", e);
  }
};

const getStoredLastOption = (eventId: string): string | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.LAST_OPTION);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed[eventId] || null;
    }
  } catch (e) {
    return null;
  }
  return null;
};

const setStoredLastOption = (eventId: string, optionId: string): void => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.LAST_OPTION);
    const parsed = stored ? JSON.parse(stored) : {};
    parsed[eventId] = optionId;
    localStorage.setItem(STORAGE_KEYS.LAST_OPTION, JSON.stringify(parsed));
  } catch (e) {
    console.warn("Failed to store last option:", e);
  }
};

// Convert database event to TradingEvent format
const dbEventToTradingEvent = (event: EventWithOptions): TradingEvent => {
  const endDate = event.end_date ? new Date(event.end_date) : new Date();
  const startDate = event.start_date ? new Date(event.start_date) : new Date();
  
  // Calculate period string
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  const period = event.start_date && event.end_date 
    ? `${formatDate(startDate)} - ${formatDate(endDate)}`
    : formatDate(endDate);

  // Parse rules from string to array
  let rulesArray: string[] = [];
  if (event.rules) {
    try {
      rulesArray = event.rules.split('\n').filter(r => r.trim());
    } catch {
      rulesArray = [event.rules];
    }
  }

  // Add specific stats for certain event types
  let tweetCount: number | undefined;
  let currentPrice: string | undefined;
  let priceChange24h: string | undefined;
  // Use database price_label if available, otherwise fall back to code-based detection
  let priceLabel: string | undefined = event.price_label || undefined;

  // Tweet-based events
  if (event.id === 'elon-twitter-activity' || event.name.toLowerCase().includes('tweet')) {
    tweetCount = 1847; // Mock current tweet count
  }

  // Crypto price-based events - ETH
  if (event.id.includes('eth-') || event.id.includes('ethereum') || event.name.toLowerCase().includes('eth')) {
    currentPrice = '$3,456.78';
    priceChange24h = '+2.34%';
    if (!priceLabel) priceLabel = 'ETH/USD';
  }

  // Crypto price-based events - BTC
  if (event.id.includes('btc-') || event.id.includes('bitcoin') || event.name.toLowerCase().includes('bitcoin')) {
    currentPrice = '$104,567.89';
    priceChange24h = '+1.56%';
    if (!priceLabel) priceLabel = 'BTC/USD';
  }

  // Stock market events - S&P 500
  if (event.id.includes('sp500') || event.name.toLowerCase().includes('s&p')) {
    currentPrice = '6,234.56';
    priceChange24h = '+0.45%';
    if (!priceLabel) priceLabel = 'S&P 500';
  }

    // Parse external links
    let externalLinks: ExternalPlatformLink[] | undefined;
    if (event.external_links && Array.isArray(event.external_links)) {
      externalLinks = (event.external_links as any[]).map(link => ({
        platform: link.platform,
        url: link.url,
        icon: link.icon,
      }));
    }

    // Parse side labels (single-market binary aliases, e.g. sports team names)
    let sideLabels: { yes: string; no: string } | undefined;
    if (event.side_labels && typeof event.side_labels === 'object' && !Array.isArray(event.side_labels)) {
      const sl = event.side_labels as Record<string, unknown>;
      if (typeof sl.yes === 'string' && typeof sl.no === 'string') {
        sideLabels = { yes: sl.yes, no: sl.no };
      }
    }

    return {
      id: event.id,
      name: event.name,
      icon: event.icon || "📊",
      ends: endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      endTime: endDate,
      period,
      volume: event.volume || "$0",
      description: event.description || "",
      rules: rulesArray,
      sourceUrl: event.source_url || "",
      sourceName: event.source_name || "Official Source",
      resolutionSource: event.settlement_description || "Official settlement source",
      externalLinks,
      tweetCount,
      currentPrice,
      priceChange24h,
      priceLabel,
      sideLabels,
    };
  };

// Convert database option to EventOption format
const dbOptionToEventOption = (option: DatabaseEventOption, livePrice?: number): EventOption => {
  const price = livePrice ?? option.price;
  return {
    id: option.id,
    label: option.label,
    price: price.toFixed(4),
  };
};

interface UseEventsReturn {
  // Loading state
  isLoading: boolean;
  
  // Event list
  events: TradingEvent[];
  
  // Selected event state
  selectedEvent: TradingEvent | null;
  setSelectedEvent: (event: TradingEvent) => void;
  selectEventById: (eventId: string) => void;
  
  // Selected option state
  selectedOption: string;
  setSelectedOption: (optionId: string) => void;
  
  // Options for current event
  options: EventOption[];
  selectedOptionData: EventOption;
  
  // Favorites
  favorites: Set<string>;
  toggleFavorite: (eventId: string, e?: React.MouseEvent) => void;
  isFavorite: (eventId: string) => boolean;
  showFavoritesOnly: boolean;
  setShowFavoritesOnly: (show: boolean) => void;
  toggleShowFavoritesOnly: () => void;
  
  // Search/filter
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredEvents: TradingEvent[];
  
  // Helpers
  getEventById: (eventId: string) => TradingEvent | undefined;
  getOptionsForEvent: (eventId: string) => EventOption[];
}

export const useEvents = (initialEventId?: string): UseEventsReturn => {
  // Fetch events from database
  const { events: dbEvents, isLoading } = useActiveEvents();
  const pricesContext = useRealtimePricesOptional();
  
  // State
  const [selectedEventId, setSelectedEventId] = useState<string | null>(() => {
    if (initialEventId) return initialEventId;
    return getStoredLastEvent();
  });
  const [selectedOption, setSelectedOptionState] = useState<string>("");
  const [favorites, setFavorites] = useState<Set<string>>(getStoredFavorites);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);

  // Convert database events to TradingEvent format
  const tradingEvents = useMemo(() => {
    return dbEvents.map(dbEventToTradingEvent);
  }, [dbEvents]);

  // Build options map with live prices
  const optionsMap = useMemo(() => {
    const map: Record<string, EventOption[]> = {};
    dbEvents.forEach(event => {
      map[event.id] = event.options.map(opt => {
        const livePrice = pricesContext?.getPrice(opt.id);
        return dbOptionToEventOption(opt, livePrice);
      });
    });
    return map;
  }, [dbEvents, pricesContext]);

  // Get selected event
  const selectedEvent = useMemo(() => {
    if (!selectedEventId || tradingEvents.length === 0) {
      return tradingEvents[0] || null;
    }
    const found = tradingEvents.find(e => e.id === selectedEventId);
    // If an explicit ID was requested (e.g. from URL) but not found, return null
    // so the UI can show an "expired event" fallback
    if (!found && initialEventId) {
      return null;
    }
    return found || tradingEvents[0] || null;
  }, [selectedEventId, tradingEvents, initialEventId]);

  // Get options for selected event
  const options = useMemo(() => {
    if (!selectedEvent) return [];
    return optionsMap[selectedEvent.id] || [];
  }, [selectedEvent, optionsMap]);

  // Initialize selected option when event changes or options load
  useEffect(() => {
    if (selectedEvent && options.length > 0) {
      const storedOption = getStoredLastOption(selectedEvent.id);
      const validOption = options.find(o => o.id === storedOption);
      if (validOption) {
        setSelectedOptionState(storedOption!);
      } else {
        setSelectedOptionState(options[0].id);
      }
    }
  }, [selectedEvent?.id, options.length]);

  // Get selected option data
  const selectedOptionData = useMemo(() => {
    return options.find(opt => opt.id === selectedOption) || options[0] || { id: "", label: "", price: "0" };
  }, [options, selectedOption]);

  // Toggle show favorites only
  const toggleShowFavoritesOnly = useCallback(() => {
    setShowFavoritesOnly(prev => !prev);
  }, []);

  // Persist favorites to localStorage
  useEffect(() => {
    setStoredFavorites(favorites);
  }, [favorites]);

  // Persist selected event to localStorage
  useEffect(() => {
    if (selectedEvent) {
      setStoredLastEvent(selectedEvent.id);
    }
  }, [selectedEvent?.id]);

  // Persist selected option to localStorage
  useEffect(() => {
    if (selectedEvent && selectedOption) {
      setStoredLastOption(selectedEvent.id, selectedOption);
    }
  }, [selectedEvent?.id, selectedOption]);

  // Filter events by search query and favorites
  const filteredEvents = useMemo(() => {
    let result = tradingEvents;
    
    // Filter by favorites first if enabled
    if (showFavoritesOnly) {
      result = result.filter(event => favorites.has(event.id));
    }
    
    // Then filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(event => 
        event.name.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [tradingEvents, searchQuery, showFavoritesOnly, favorites]);

  // Select event by ID
  const selectEventById = useCallback((eventId: string) => {
    setSelectedEventId(eventId);
  }, []);

  // Toggle favorite
  const toggleFavorite = useCallback((eventId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(eventId)) {
        newFavorites.delete(eventId);
      } else {
        newFavorites.add(eventId);
      }
      return newFavorites;
    });
  }, []);

  // Check if event is favorite
  const isFavorite = useCallback((eventId: string) => {
    return favorites.has(eventId);
  }, [favorites]);

  // Get event by ID
  const getEventById = useCallback((eventId: string) => {
    return tradingEvents.find(e => e.id === eventId);
  }, [tradingEvents]);

  // Get options for any event
  const getOptionsForEvent = useCallback((eventId: string) => {
    return optionsMap[eventId] || [];
  }, [optionsMap]);

  // Handle selected event change
  const handleSetSelectedEvent = useCallback((event: TradingEvent) => {
    setSelectedEventId(event.id);
  }, []);

  // Handle selected option change
  const handleSetSelectedOption = useCallback((optionId: string) => {
    setSelectedOptionState(optionId);
  }, []);

  return {
    isLoading,
    events: tradingEvents,
    selectedEvent,
    setSelectedEvent: handleSetSelectedEvent,
    selectEventById,
    selectedOption,
    setSelectedOption: handleSetSelectedOption,
    options,
    selectedOptionData,
    favorites,
    toggleFavorite,
    isFavorite,
    showFavoritesOnly,
    setShowFavoritesOnly,
    toggleShowFavoritesOnly,
    searchQuery,
    setSearchQuery,
    filteredEvents,
    getEventById,
    getOptionsForEvent,
  };
};

export default useEvents;
