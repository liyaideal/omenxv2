import { useState, useMemo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { OptionChips } from "@/components/OptionChips";
import { ArrowLeft, Copy, Check, TrendingUp, TrendingDown, AlertCircle, Bell, Settings, Zap, Play, RotateCcw, Info, HelpCircle, Maximize2, X, Monitor, Smartphone, Tablet, Search, Download, ShieldCheck, AlertTriangle, Ban, Type, Clock, Loader2, ExternalLink } from "lucide-react";
import omenxLogo from "@/assets/omenx-logo.svg";
import { MobileHeader } from "@/components/MobileHeader";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { CATEGORY_STYLES, getCategoryFromName } from "@/lib/categoryUtils";
import { PriceText, PercentText, AmountText, LabelText, MonoText, AddressText } from "@/components/typography";

type DevicePreview = "auto" | "mobile" | "tablet" | "desktop";

const StyleGuide = () => {
  const actualIsMobile = useIsMobile();
  const navigate = useNavigate();
  const [devicePreview, setDevicePreview] = useState<DevicePreview>("auto");
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState("opt1");
  const [searchQuery, setSearchQuery] = useState("");

  // Define all searchable sections with their IDs and keywords
  const sections = [
    { id: "brand-logo", title: "Brand Logo", keywords: ["logo", "brand", "omenx", "identity", "mark"] },
    { id: "account-risk-playground", title: "Account Risk Playground", keywords: ["risk", "playground", "margin", "equity", "liquidation", "simulator", "interactive"] },
    { id: "typography", title: "Typography", keywords: ["font", "text", "heading", "type", "scale", "inter", "mono"] },
    { id: "typography-components", title: "Typography Components", keywords: ["typography", "component", "pricetext", "percenttext", "labeltext", "amounttext", "addresstext", "monotext", "semantic"] },
    { id: "playground", title: "Component Playground", keywords: ["playground", "interactive", "test", "try"] },
    { id: "button-playground", title: "Button Playground", keywords: ["button", "click", "action", "variant", "size"] },
    { id: "badge-playground", title: "Badge Playground", keywords: ["badge", "tag", "label", "status"] },
    { id: "input-playground", title: "Input Playground", keywords: ["input", "text", "field", "form", "type"] },
    { id: "progress-playground", title: "Progress Bar Playground", keywords: ["progress", "bar", "loading", "percentage"] },
    { id: "card-playground", title: "Card Playground", keywords: ["card", "container", "panel", "box"] },
    { id: "switch-playground", title: "Switch Playground", keywords: ["switch", "toggle", "on", "off", "boolean"] },
    { id: "slider-playground", title: "Slider Playground", keywords: ["slider", "range", "value", "min", "max"] },
    { id: "tabs-playground", title: "Tabs Playground", keywords: ["tabs", "navigation", "panel", "switch"] },
    { id: "tooltip-playground", title: "Tooltip Playground", keywords: ["tooltip", "hover", "hint", "help"] },
    { id: "popover-playground", title: "Popover Playground", keywords: ["popover", "popup", "overlay", "dropdown"] },
    { id: "dialog-playground", title: "Dialog / Modal Playground", keywords: ["dialog", "modal", "popup", "overlay", "confirm"] },
    { id: "mobile-header-playground", title: "Mobile Header Playground", keywords: ["header", "mobile", "navigation", "back", "logo", "title", "favorite", "share"] },
    { id: "colors", title: "Colors", keywords: ["color", "palette", "theme", "hsl", "variable"] },
    { id: "trading-colors", title: "Trading Colors Usage", keywords: ["trading", "green", "red", "purple", "profit", "loss"] },
    { id: "category-labels", title: "Category Labels", keywords: ["category", "label", "social", "crypto", "finance", "market", "badge", "tag"] },
    { id: "buttons", title: "Buttons", keywords: ["button", "click", "action", "primary", "secondary"] },
    { id: "badges", title: "Badges", keywords: ["badge", "tag", "status", "label"] },
    { id: "cards", title: "Cards", keywords: ["card", "container", "panel", "trading-card"] },
    { id: "form-elements", title: "Form Elements", keywords: ["form", "input", "switch", "control"] },
    { id: "option-chips", title: "Option Chips", keywords: ["chip", "option", "select", "choice"] },
    { id: "tabs", title: "Tabs", keywords: ["tabs", "navigation", "panel"] },
    { id: "animations", title: "Animations", keywords: ["animation", "fade", "slide", "pulse", "flash", "motion"] },
    { id: "spacing", title: "Spacing & Border Radius", keywords: ["spacing", "padding", "margin", "radius", "border", "rounded"] },
    { id: "icons", title: "Icons", keywords: ["icon", "lucide", "svg", "symbol"] },
    { id: "css-classes", title: "Custom CSS Classes", keywords: ["css", "class", "custom", "price", "chip", "tab", "scrollbar"] },
    { id: "mobile-patterns", title: "Mobile UI Patterns", keywords: ["mobile", "pattern", "button", "placement", "drawer", "spacing", "safe", "area"] },
    { id: "toast-notifications", title: "Toast & Notifications", keywords: ["toast", "notification", "alert", "message", "sonner", "success", "error", "warning"] },
    { id: "mobile-header", title: "Mobile Header", keywords: ["header", "mobile", "navigation", "back", "logo", "title", "favorite", "share", "countdown"] },
    { id: "account-risk-indicator", title: "Account Risk Indicator", keywords: ["risk", "margin", "account", "equity", "liquidation", "warning", "im", "mm", "cross margin", "trading"] },
    { id: "transaction-status", title: "Transaction Status Badges", keywords: ["transaction", "status", "badge", "pending", "processing", "completed", "failed", "deposit", "withdraw"] },
    { id: "stepper-timeline", title: "Stepper / Progress Timeline", keywords: ["stepper", "timeline", "progress", "steps", "wizard", "withdraw", "deposit", "confirmation"] },
    { id: "explorer-links", title: "Blockchain Explorer Links", keywords: ["explorer", "blockchain", "txhash", "address", "link", "external", "etherscan", "bscscan"] },
  ];

  // Filter sections based on search query
  const filterSection = (sectionId: string): boolean => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const section = sections.find(s => s.id === sectionId);
    if (!section) return true;
    return (
      section.title.toLowerCase().includes(query) ||
      section.keywords.some(k => k.includes(query))
    );
  };

  // Check if any playground component matches
  const playgroundMatches = (): boolean => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const playgroundSections = sections.filter(s => s.id.includes("playground"));
    return playgroundSections.some(s => 
      s.title.toLowerCase().includes(query) || 
      s.keywords.some(k => k.includes(query))
    );
  };

  // Override isMobile based on device preview selection
  const isMobile = devicePreview === "auto" 
    ? actualIsMobile 
    : devicePreview === "mobile" || devicePreview === "tablet";

  // Playground states
  const [buttonVariant, setButtonVariant] = useState<"default" | "secondary" | "destructive" | "outline" | "ghost" | "link">("default");
  const [buttonSize, setButtonSize] = useState<"default" | "sm" | "lg" | "icon">("default");
  const [buttonText, setButtonText] = useState("Click Me");
  const [buttonDisabled, setButtonDisabled] = useState(false);

  const [badgeVariant, setBadgeVariant] = useState<"default" | "secondary" | "destructive" | "outline">("default");
  const [badgeText, setBadgeText] = useState("Badge");
  const [badgeCustomColor, setBadgeCustomColor] = useState<string>("none");

  const [inputPlaceholder, setInputPlaceholder] = useState("Enter text...");
  const [inputDisabled, setInputDisabled] = useState(false);
  const [inputType, setInputType] = useState<"text" | "password" | "number">("text");

  const [progressValue, setProgressValue] = useState(65);
  const [progressColor, setProgressColor] = useState<"green" | "red" | "purple">("green");

  const [cardStyle, setCardStyle] = useState<"default" | "trading">("trading");
  const [cardTitle, setCardTitle] = useState("Card Title");
  const [cardDescription, setCardDescription] = useState("Card description goes here");

  // Switch Playground
  const [switchChecked, setSwitchChecked] = useState(false);
  const [switchDisabled, setSwitchDisabled] = useState(false);
  const [switchLabel, setSwitchLabel] = useState("Enable feature");

  // Slider Playground
  const [sliderValue, setSliderValue] = useState([50]);
  const [sliderMin, setSliderMin] = useState(0);
  const [sliderMax, setSliderMax] = useState(100);
  const [sliderStep, setSliderStep] = useState(1);
  const [sliderDisabled, setSliderDisabled] = useState(false);

  // Tabs Playground
  const [tabsCount, setTabsCount] = useState(3);
  const [tabsStyle, setTabsStyle] = useState<"default" | "full-width">("default");
  const [tabLabels, setTabLabels] = useState(["Tab 1", "Tab 2", "Tab 3", "Tab 4"]);

  // Tooltip Playground
  const [tooltipText, setTooltipText] = useState("This is a helpful tooltip");
  const [tooltipSide, setTooltipSide] = useState<"top" | "right" | "bottom" | "left">("top");
  const [tooltipDelayDuration, setTooltipDelayDuration] = useState(200);

  // Popover Playground
  const [popoverTitle, setPopoverTitle] = useState("Popover Title");
  const [popoverContent, setPopoverContent] = useState("This is the popover content. It can contain any elements.");
  const [popoverSide, setPopoverSide] = useState<"top" | "right" | "bottom" | "left">("bottom");
  const [popoverAlign, setPopoverAlign] = useState<"start" | "center" | "end">("center");

  // Dialog Playground
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("Dialog Title");
  const [dialogDescription, setDialogDescription] = useState("This is a dialog description that explains what this dialog is for.");
  const [dialogSize, setDialogSize] = useState<"sm" | "md" | "lg" | "xl" | "full">("md");
  const [dialogShowFooter, setDialogShowFooter] = useState(true);
  const [dialogAnimation, setDialogAnimation] = useState<"fade" | "scale" | "slide">("scale");

  // Mobile Header Playground
  const [headerTitle, setHeaderTitle] = useState("Bitcoin price on January 31, 2026?");
  const [headerShowLogo, setHeaderShowLogo] = useState(false);
  const [headerShowBack, setHeaderShowBack] = useState(true);
  const [headerShowActions, setHeaderShowActions] = useState(true);
  const [headerIsFavorite, setHeaderIsFavorite] = useState(false);
  const [headerShowCountdown, setHeaderShowCountdown] = useState(true);
  const [headerShowTweets, setHeaderShowTweets] = useState(false);
  const [headerShowPrice, setHeaderShowPrice] = useState(true);
  const [headerTweetCount, setHeaderTweetCount] = useState(156);
  const [headerCurrentPrice, setHeaderCurrentPrice] = useState("$94,532.18");
  const [headerPriceChange, setHeaderPriceChange] = useState("+2.34%");

  // Account Risk Indicator Playground
  const [riskTotalAssets, setRiskTotalAssets] = useState(100);
  const [riskUnrealizedPnL, setRiskUnrealizedPnL] = useState(0);
  const [riskIMTotal, setRiskIMTotal] = useState(50);
  const [riskShowValues, setRiskShowValues] = useState(true);

  // Typography Components Playground
  const [typoPriceValue, setTypoPriceValue] = useState(1234.56);
  const [typoPricePrefix, setTypoPricePrefix] = useState("$");
  const [typoPriceDecimals, setTypoPriceDecimals] = useState(2);
  const [typoPriceShowSign, setTypoPriceShowSign] = useState(false);
  const [typoPriceColorByValue, setTypoPriceColorByValue] = useState(false);
  
  const [typoPercentValue, setTypoPercentValue] = useState(12.34);
  const [typoPercentDecimals, setTypoPercentDecimals] = useState(2);
  const [typoPercentShowSign, setTypoPercentShowSign] = useState(true);
  const [typoPercentColorByValue, setTypoPercentColorByValue] = useState(true);
  
  const [typoAmountValue, setTypoAmountValue] = useState(500);
  const [typoAmountDecimals, setTypoAmountDecimals] = useState(0);
  const [typoAmountSuffix, setTypoAmountSuffix] = useState(" contracts");
  
  const [typoLabelText, setTypoLabelText] = useState("Option Label");
  const [typoLabelSize, setTypoLabelSize] = useState<"xs" | "sm" | "base" | "lg">("base");
  const [typoLabelWeight, setTypoLabelWeight] = useState<"normal" | "medium" | "semibold" | "bold">("medium");
  const [typoLabelMuted, setTypoLabelMuted] = useState(false);
  
  const [typoAddress, setTypoAddress] = useState("0x1234567890abcdef1234567890abcdef12345678");
  const [typoAddressTruncate, setTypoAddressTruncate] = useState(true);
  const [typoAddressTruncateLength, setTypoAddressTruncateLength] = useState(6);

  // Calculate risk metrics for playground
  const playgroundRiskMetrics = useMemo(() => {
    const equity = riskTotalAssets + riskUnrealizedPnL;
    const mmTotal = riskIMTotal * 0.5;
    const riskRatio = equity > 0 ? (riskIMTotal / equity) * 100 : 0;
    
    let riskLevel: "SAFE" | "WARNING" | "RESTRICTION" | "LIQUIDATION" = "SAFE";
    if (riskRatio >= 100) {
      riskLevel = "LIQUIDATION";
    } else if (riskRatio >= 95) {
      riskLevel = "RESTRICTION";
    } else if (riskRatio >= 80) {
      riskLevel = "WARNING";
    }
    
    return {
      equity,
      mmTotal,
      riskRatio: Math.min(riskRatio, 150),
      riskLevel,
      availableMargin: Math.max(equity - riskIMTotal, 0),
    };
  }, [riskTotalAssets, riskUnrealizedPnL, riskIMTotal]);

  const getDialogSizeClass = () => {
    switch (dialogSize) {
      case "sm": return "max-w-sm";
      case "md": return "max-w-md";
      case "lg": return "max-w-lg";
      case "xl": return "max-w-xl";
      case "full": return "max-w-[90vw] h-[80vh]";
      default: return "max-w-md";
    }
  };

  const getDialogAnimationClass = () => {
    switch (dialogAnimation) {
      case "fade": return "data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out";
      case "scale": return "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95";
      case "slide": return "data-[state=open]:animate-slide-up data-[state=closed]:animate-fade-out";
      default: return "";
    }
  };

  const resetPlayground = () => {
    setButtonVariant("default");
    setButtonSize("default");
    setButtonText("Click Me");
    setButtonDisabled(false);
    setBadgeVariant("default");
    setBadgeText("Badge");
    setBadgeCustomColor("none");
    setInputPlaceholder("Enter text...");
    setInputDisabled(false);
    setInputType("text");
    setProgressValue(65);
    setProgressColor("green");
    setCardStyle("trading");
    setCardTitle("Card Title");
    setCardDescription("Card description goes here");
    setSwitchChecked(false);
    setSwitchDisabled(false);
    setSwitchLabel("Enable feature");
    setSliderValue([50]);
    setSliderMin(0);
    setSliderMax(100);
    setSliderStep(1);
    setSliderDisabled(false);
    setTabsCount(3);
    setTabsStyle("default");
    setTabLabels(["Tab 1", "Tab 2", "Tab 3", "Tab 4"]);
    setTooltipText("This is a helpful tooltip");
    setTooltipSide("top");
    setTooltipDelayDuration(200);
    setPopoverTitle("Popover Title");
    setPopoverContent("This is the popover content. It can contain any elements.");
    setPopoverSide("bottom");
    setPopoverAlign("center");
    setDialogTitle("Dialog Title");
    setDialogDescription("This is a dialog description that explains what this dialog is for.");
    setDialogSize("md");
    setDialogShowFooter(true);
    setDialogAnimation("scale");
    // Mobile Header
    setHeaderTitle("Bitcoin price on January 31, 2026?");
    setHeaderShowLogo(false);
    setHeaderShowBack(true);
    setHeaderShowActions(true);
    setHeaderIsFavorite(false);
    setHeaderShowCountdown(true);
    setHeaderShowTweets(false);
    setHeaderShowPrice(true);
    setHeaderTweetCount(156);
    setHeaderCurrentPrice("$94,532.18");
    setHeaderPriceChange("+2.34%");
    // Risk Indicator
    setRiskTotalAssets(100);
    setRiskUnrealizedPnL(0);
    setRiskIMTotal(50);
    setRiskShowValues(true);
    toast.success("Playground reset!");
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedColor(label);
    toast.success(`Copied: ${text}`);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  // State for tracking copied code snippets
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    toast.success("Code copied to clipboard!");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Reusable CodePreview component
  const CodePreview = ({ code, id }: { code: string; id: string }) => (
    <div className="mt-4 p-3 bg-background rounded-lg border border-border overflow-x-auto relative group">
      <code className="text-xs text-muted-foreground font-mono whitespace-nowrap pr-10">
        {code}
      </code>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => copyCode(code, id)}
      >
        {copiedCode === id ? (
          <Check className="h-3.5 w-3.5 text-trading-green" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </Button>
    </div>
  );

  const colorSections = [
    {
      title: "Core Surface Colors",
      description: "Background and container colors for the application",
      colors: [
        { name: "Background", variable: "--background", class: "bg-background", value: "222 47% 6%", usage: "Main app background" },
        { name: "Background Elevated", variable: "--background-elevated", class: "bg-background-elevated", value: "222 40% 8%", usage: "Elevated surfaces" },
        { name: "Card", variable: "--card", class: "bg-card", value: "222 35% 10%", usage: "Card backgrounds" },
        { name: "Card Hover", variable: "--card-hover", class: "bg-card-hover", value: "222 35% 12%", usage: "Card hover state" },
        { name: "Muted", variable: "--muted", class: "bg-muted", value: "222 25% 14%", usage: "Muted backgrounds" },
        { name: "Secondary", variable: "--secondary", class: "bg-secondary", value: "222 30% 16%", usage: "Secondary buttons/inputs" },
      ]
    },
    {
      title: "Brand Colors (Purple Primary)",
      description: "Purple is the primary brand color for navigation, CTAs, and interactive elements",
      colors: [
        { name: "Primary", variable: "--primary", class: "bg-primary", value: "260 60% 55%", usage: "Navigation, CTAs, focus states" },
        { name: "Primary Hover", variable: "--primary-hover", class: "bg-primary-hover", value: "260 60% 50%", usage: "Primary hover state" },
        { name: "Primary Muted", variable: "--primary-muted", class: "bg-primary-muted", value: "260 40% 25%", usage: "Primary backgrounds" },
        { name: "Accent", variable: "--accent", class: "bg-accent", value: "260 50% 45%", usage: "Highlights, accents" },
      ]
    },
    {
      title: "Trading Semantic Colors",
      description: "Green = Success/Profit, Red = Loss/Error, Yellow = Alert, Purple = Brand emphasis",
      colors: [
        { name: "Trading Green", variable: "--trading-green", class: "bg-trading-green", value: "142 71% 45%", usage: "Profit, buy, success" },
        { name: "Trading Green Muted", variable: "--trading-green-muted", class: "bg-trading-green-muted", value: "142 50% 20%", usage: "Green backgrounds" },
        { name: "Trading Green BG", variable: "--trading-green-bg", class: "bg-trading-green-bg", value: "142 50% 12%", usage: "Subtle green bg" },
        { name: "Trading Red", variable: "--trading-red", class: "bg-trading-red", value: "0 72% 51%", usage: "Loss, sell, error" },
        { name: "Trading Red Muted", variable: "--trading-red-muted", class: "bg-trading-red-muted", value: "0 50% 20%", usage: "Red backgrounds" },
        { name: "Trading Red BG", variable: "--trading-red-bg", class: "bg-trading-red-bg", value: "0 50% 12%", usage: "Subtle red bg" },
        { name: "Trading Purple", variable: "--trading-purple", class: "bg-trading-purple", value: "260 60% 55%", usage: "Brand emphasis" },
        { name: "Trading Purple Muted", variable: "--trading-purple-muted", class: "bg-trading-purple-muted", value: "260 40% 30%", usage: "Purple backgrounds" },
        { name: "Trading Yellow", variable: "--trading-yellow", class: "bg-trading-yellow", value: "45 93% 58%", usage: "Alerts, warnings" },
        { name: "Trading Yellow Muted", variable: "--trading-yellow-muted", class: "bg-trading-yellow-muted", value: "45 70% 30%", usage: "Yellow backgrounds" },
      ]
    },
    {
      title: "Border & Text Colors",
      description: "Borders, inputs, and text hierarchy",
      colors: [
        { name: "Border", variable: "--border", class: "bg-border", value: "222 25% 18%", usage: "Default borders" },
        { name: "Border Subtle", variable: "--border-subtle", class: "bg-border-subtle", value: "222 20% 14%", usage: "Subtle borders" },
        { name: "Input", variable: "--input", class: "bg-input", value: "222 30% 12%", usage: "Input backgrounds" },
        { name: "Foreground", variable: "--foreground", class: "bg-foreground", value: "210 40% 98%", usage: "Primary text" },
        { name: "Muted Foreground", variable: "--muted-foreground", class: "text-muted-foreground bg-muted", value: "215 20% 55%", usage: "Secondary text" },
      ]
    },
  ];

  const mockOptions = [
    { id: "opt1", label: "Yes", price: "0.65" },
    { id: "opt2", label: "No", price: "0.35" },
    { id: "opt3", label: ">$100k", price: "0.42" },
  ];

  return (
    <div className={`min-h-screen bg-background ${isMobile ? "pb-20" : ""}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border ${isMobile ? "px-4 py-3" : "px-8 py-4"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className={`font-semibold ${isMobile ? "text-lg" : "text-2xl"}`}>Style Guide</h1>
              <p className="text-sm text-muted-foreground">Design System Documentation</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search components..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${isMobile ? "w-[140px]" : "w-[200px]"} pl-9 h-8 text-sm bg-muted/50 border-border/50`}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Device Preview Toggle */}
            <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={devicePreview === "auto" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-8 px-2 gap-1.5"
                    onClick={() => setDevicePreview("auto")}
                  >
                    <span className="text-xs">Auto</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Use actual device size</TooltipContent>
              </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={devicePreview === "mobile" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setDevicePreview("mobile")}
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Mobile Preview</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={devicePreview === "tablet" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setDevicePreview("tablet")}
                >
                  <Tablet className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Tablet Preview</TooltipContent>
            </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={devicePreview === "desktop" ? "secondary" : "ghost"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setDevicePreview("desktop")}
                  >
                    <Monitor className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Desktop Preview</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Device indicator banner */}
        {devicePreview !== "auto" && (
          <div className="mt-2 flex items-center justify-center gap-2 py-1.5 px-3 bg-trading-purple/10 border border-trading-purple/20 rounded-lg">
            {devicePreview === "mobile" && <Smartphone className="h-3.5 w-3.5 text-trading-purple" />}
            {devicePreview === "tablet" && <Tablet className="h-3.5 w-3.5 text-trading-purple" />}
            {devicePreview === "desktop" && <Monitor className="h-3.5 w-3.5 text-trading-purple" />}
            <span className="text-xs text-trading-purple font-medium">
              Previewing {devicePreview} layout
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-5 w-5 p-0 ml-1 hover:bg-trading-purple/20"
              onClick={() => setDevicePreview("auto")}
            >
              <X className="h-3 w-3 text-trading-purple" />
            </Button>
          </div>
        )}
      </header>

      <main className={`${isMobile ? "px-4 py-6" : "px-8 py-8 max-w-7xl mx-auto"} space-y-12`}>
        {/* Search results info */}
        {searchQuery && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
            <Search className="h-4 w-4" />
            <span>Showing results for "<span className="text-foreground font-medium">{searchQuery}</span>"</span>
            <Button variant="ghost" size="sm" className="h-6 ml-auto" onClick={() => setSearchQuery("")}>
              Clear
            </Button>
          </div>
        )}

        {/* Brand Logo Section */}
        {filterSection("brand-logo") && (
        <section id="brand-logo">
          <h2 className="text-xl font-semibold mb-6 text-foreground border-b border-border pb-2">Brand Logo</h2>
          <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
            {/* Primary Logo - Dark Background */}
            <Card className="trading-card">
              <CardHeader>
                <CardTitle className="text-lg">Primary Logo (Dark BG)</CardTitle>
                <CardDescription>Use on dark backgrounds - default usage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-background rounded-xl p-8 flex items-center justify-center border border-border/30">
                  <img src={omenxLogo} alt="OMENX Logo" className="h-12" />
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono flex-1 truncate">
                    import omenxLogo from "@/assets/omenx-logo.svg"
                  </code>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7"
                    onClick={() => copyCode('import omenxLogo from "@/assets/omenx-logo.svg"', 'logo-import')}
                  >
                    {copiedCode === 'logo-import' ? <Check className="h-3.5 w-3.5 text-trading-green" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Logo Sizes */}
            <Card className="trading-card">
              <CardHeader>
                <CardTitle className="text-lg">Logo Sizes</CardTitle>
                <CardDescription>Recommended size variants</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Header (h-8)</span>
                    <img src={omenxLogo} alt="OMENX" className="h-8" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Standard (h-10)</span>
                    <img src={omenxLogo} alt="OMENX" className="h-10" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Large (h-12)</span>
                    <img src={omenxLogo} alt="OMENX" className="h-12" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Hero (h-16)</span>
                    <img src={omenxLogo} alt="OMENX" className="h-16" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Logo on Light Background */}
            <Card className="trading-card">
              <CardHeader>
                <CardTitle className="text-lg">Light Background Usage</CardTitle>
                <CardDescription>When used on light backgrounds, add a dark container or invert</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-white rounded-xl p-8 flex items-center justify-center">
                  <img src={omenxLogo} alt="OMENX Logo" className="h-12 invert" />
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Add <code className="bg-muted px-1 rounded">className="invert"</code> for light backgrounds
                </p>
              </CardContent>
            </Card>

            {/* Logo Guidelines */}
            <Card className="trading-card">
              <CardHeader>
                <CardTitle className="text-lg">Usage Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-trading-green mt-0.5 flex-shrink-0" />
                  <span>Always use the official SVG file for best quality</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-trading-green mt-0.5 flex-shrink-0" />
                  <span>Maintain aspect ratio when scaling</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-trading-green mt-0.5 flex-shrink-0" />
                  <span>Use white logo on dark backgrounds (primary usage)</span>
                </div>
                <div className="flex items-start gap-2">
                  <X className="h-4 w-4 text-trading-red mt-0.5 flex-shrink-0" />
                  <span>Don't stretch or distort the logo</span>
                </div>
                <div className="flex items-start gap-2">
                  <X className="h-4 w-4 text-trading-red mt-0.5 flex-shrink-0" />
                  <span>Don't change logo colors (except invert for light BG)</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
        )}

        {/* Typography Section */}
        {filterSection("typography") && (
        <section id="typography">
          <h2 className="text-xl font-semibold mb-6 text-foreground border-b border-border pb-2">Typography</h2>
          
          <div className="space-y-6">
            {/* Font Families Overview */}
            <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
              <Card className="trading-card">
                <CardHeader>
                  <CardTitle className="text-lg">Font Families</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Sans (Inter) - Primary</p>
                    <p className="text-2xl font-sans">The quick brown fox jumps</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Mono (JetBrains Mono) - Numbers/Prices</p>
                    <p className="text-2xl font-mono">$1,234.56 (+12.34%)</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="trading-card">
                <CardHeader>
                  <CardTitle className="text-lg">Type Scale</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">text-xs (12px)</p>
                  <p className="text-sm text-muted-foreground">text-sm (14px)</p>
                  <p className="text-base">text-base (16px)</p>
                  <p className="text-lg">text-lg (18px)</p>
                  <p className="text-xl font-semibold">text-xl (20px)</p>
                  <p className="text-2xl font-semibold">text-2xl (24px)</p>
                  <p className="text-3xl font-bold">text-3xl (30px)</p>
                </CardContent>
              </Card>
            </div>

            {/* Font Usage Guidelines - Key Section */}
            <Card className="trading-card border-primary/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  Font Usage Guidelines
                </CardTitle>
                <CardDescription>When to use font-mono vs font-sans (Inter)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
                  {/* font-mono Usage */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-border">
                      <span className="w-3 h-3 rounded-full bg-trading-green" />
                      <h4 className="font-semibold text-trading-green">✓ Use font-mono</h4>
                    </div>
                    <p className="text-xs text-muted-foreground">For numeric values that change or need precise alignment</p>
                    <div className="space-y-3 bg-muted/30 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Prices</span>
                        <span className="font-mono text-sm">$94,532.18</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Percentages</span>
                        <span className="font-mono text-sm text-trading-green">+12.34%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">P&L Values</span>
                        <span className="font-mono text-sm text-trading-red">-$245.67</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Quantities</span>
                        <span className="font-mono text-sm">1,250</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Leverage</span>
                        <span className="font-mono text-sm">10x</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Wallet Address</span>
                        <span className="font-mono text-sm">0x1a2b...3c4d</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Order Book</span>
                        <span className="font-mono text-sm">0.5234</span>
                      </div>
                    </div>
                    <CodePreview 
                      code={`<span className="font-mono">$1,234.56</span>`}
                      id="font-mono-code"
                    />
                  </div>

                  {/* font-sans Usage */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-border">
                      <span className="w-3 h-3 rounded-full bg-primary" />
                      <h4 className="font-semibold text-primary">✓ Use font-sans (default)</h4>
                    </div>
                    <p className="text-xs text-muted-foreground">For all text content, labels, and UI elements</p>
                    <div className="space-y-3 bg-muted/30 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Event Names</span>
                        <span className="text-sm font-medium">Will Bitcoin reach $100K?</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Option Labels</span>
                        <span className="text-sm font-medium">OpenAI (GPT)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Button Text</span>
                        <span className="text-sm font-medium">Trade Now</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Category Labels</span>
                        <Badge variant="outline" className="text-xs">Crypto</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Status Text</span>
                        <span className="text-sm">Yes Position</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Section Headers</span>
                        <span className="text-sm font-semibold">My Positions</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Descriptions</span>
                        <span className="text-sm text-muted-foreground">Ends in 2 days</span>
                      </div>
                    </div>
                    <CodePreview 
                      code={`<span className="font-medium">{option.label}</span>`}
                      id="font-sans-code"
                    />
                  </div>
                </div>

                {/* Common Mistakes */}
                <div className="mt-6 pt-6 border-t border-border">
                  <h4 className="text-sm font-semibold text-trading-red flex items-center gap-2 mb-4">
                    <Ban className="h-4 w-4" />
                    Common Mistakes to Avoid
                  </h4>
                  <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
                    <div className="bg-trading-red/10 border border-trading-red/30 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <X className="h-4 w-4 text-trading-red" />
                        <span className="text-xs font-medium text-trading-red">Wrong</span>
                      </div>
                      <code className="text-xs text-muted-foreground block">
                        {"<span className=\"font-mono\">{position.option}</span>"}
                      </code>
                      <p className="text-xs text-muted-foreground">Option labels are text, not numbers</p>
                    </div>
                    <div className="bg-trading-green/10 border border-trading-green/30 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-trading-green" />
                        <span className="text-xs font-medium text-trading-green">Correct</span>
                      </div>
                      <code className="text-xs text-muted-foreground block">
                        {"<span className=\"font-medium\">{position.option}</span>"}
                      </code>
                      <p className="text-xs text-muted-foreground">Use default sans-serif for text labels</p>
                    </div>
                    <div className="bg-trading-red/10 border border-trading-red/30 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <X className="h-4 w-4 text-trading-red" />
                        <span className="text-xs font-medium text-trading-red">Wrong</span>
                      </div>
                      <code className="text-xs text-muted-foreground block">
                        {"<h3 className=\"font-mono\">Event Title</h3>"}
                      </code>
                      <p className="text-xs text-muted-foreground">Headlines should never use monospace</p>
                    </div>
                    <div className="bg-trading-green/10 border border-trading-green/30 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-trading-green" />
                        <span className="text-xs font-medium text-trading-green">Correct</span>
                      </div>
                      <code className="text-xs text-muted-foreground block">
                        {"<h3 className=\"font-semibold\">Event Title</h3>"}
                      </code>
                      <p className="text-xs text-muted-foreground">Use font-weight for emphasis, not font-family</p>
                    </div>
                  </div>
                </div>

                {/* Quick Reference */}
                <div className="mt-6 pt-6 border-t border-border">
                  <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-trading-yellow" />
                    Quick Reference
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 text-muted-foreground font-medium">Content Type</th>
                          <th className="text-left py-2 text-muted-foreground font-medium">Font</th>
                          <th className="text-left py-2 text-muted-foreground font-medium">Class</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        <tr>
                          <td className="py-2">Prices & Currency</td>
                          <td className="py-2 font-mono">JetBrains Mono</td>
                          <td className="py-2"><code className="text-primary">font-mono</code></td>
                        </tr>
                        <tr>
                          <td className="py-2">Percentages & ROI</td>
                          <td className="py-2 font-mono">JetBrains Mono</td>
                          <td className="py-2"><code className="text-primary">font-mono</code></td>
                        </tr>
                        <tr>
                          <td className="py-2">Quantities & Counts</td>
                          <td className="py-2 font-mono">JetBrains Mono</td>
                          <td className="py-2"><code className="text-primary">font-mono</code></td>
                        </tr>
                        <tr>
                          <td className="py-2">Leverage (e.g., 10x)</td>
                          <td className="py-2 font-mono">JetBrains Mono</td>
                          <td className="py-2"><code className="text-primary">font-mono</code></td>
                        </tr>
                        <tr>
                          <td className="py-2">Wallet Addresses</td>
                          <td className="py-2 font-mono">JetBrains Mono</td>
                          <td className="py-2"><code className="text-primary">font-mono</code></td>
                        </tr>
                        <tr>
                          <td className="py-2">Titles & Headlines</td>
                          <td className="py-2">Inter</td>
                          <td className="py-2"><code className="text-muted-foreground">(default)</code></td>
                        </tr>
                        <tr>
                          <td className="py-2">Body Text</td>
                          <td className="py-2">Inter</td>
                          <td className="py-2"><code className="text-muted-foreground">(default)</code></td>
                        </tr>
                        <tr>
                          <td className="py-2">Labels & Options</td>
                          <td className="py-2">Inter</td>
                          <td className="py-2"><code className="text-muted-foreground">(default)</code></td>
                        </tr>
                        <tr>
                          <td className="py-2">Buttons & CTAs</td>
                          <td className="py-2">Inter</td>
                          <td className="py-2"><code className="text-muted-foreground">(default)</code></td>
                        </tr>
                        <tr>
                          <td className="py-2">Categories & Tags</td>
                          <td className="py-2">Inter</td>
                          <td className="py-2"><code className="text-muted-foreground">(default)</code></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
        )}

        {/* Typography Components Playground Section */}
        {filterSection("typography-components") && (
        <section id="typography-components">
          <div className="flex items-center justify-between mb-6 border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <Type className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Typography Components</h2>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground mb-6">
            Semantic typography components that automatically apply correct font styles. 
            Import from <code className="text-primary">@/components/typography</code>.
          </p>

          <div className="space-y-8">
            {/* PriceText Playground */}
            <Card className="trading-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-trading-green" />
                  PriceText
                </CardTitle>
                <CardDescription>Display prices and currency values with automatic font-mono styling</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
                  {/* Preview */}
                  <div className="bg-muted/30 rounded-xl p-6 flex flex-col items-center justify-center min-h-[120px] gap-4">
                    <span className="text-xs text-muted-foreground">Live Preview</span>
                    <div className="text-2xl">
                      <PriceText 
                        value={typoPriceValue} 
                        prefix={typoPricePrefix}
                        decimals={typoPriceDecimals}
                        showSign={typoPriceShowSign}
                        colorByValue={typoPriceColorByValue}
                      />
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Value</Label>
                      <Input 
                        type="number" 
                        value={typoPriceValue} 
                        onChange={(e) => setTypoPriceValue(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Prefix</Label>
                        <Input 
                          value={typoPricePrefix} 
                          onChange={(e) => setTypoPricePrefix(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Decimals</Label>
                        <Input 
                          type="number" 
                          min={0} 
                          max={8}
                          value={typoPriceDecimals} 
                          onChange={(e) => setTypoPriceDecimals(parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">Show Sign (+/-)</Label>
                      <Switch checked={typoPriceShowSign} onCheckedChange={setTypoPriceShowSign} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">Color by Value</Label>
                      <Switch checked={typoPriceColorByValue} onCheckedChange={setTypoPriceColorByValue} />
                    </div>
                  </div>
                </div>
                <CodePreview 
                  code={`<PriceText value={${typoPriceValue}} prefix="${typoPricePrefix}" decimals={${typoPriceDecimals}}${typoPriceShowSign ? " showSign" : ""}${typoPriceColorByValue ? " colorByValue" : ""} />`}
                  id="pricetext-code"
                />
              </CardContent>
            </Card>

            {/* PercentText Playground */}
            <Card className="trading-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-trading-purple" />
                  PercentText
                </CardTitle>
                <CardDescription>Display percentages with automatic formatting and coloring</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
                  {/* Preview */}
                  <div className="bg-muted/30 rounded-xl p-6 flex flex-col items-center justify-center min-h-[120px] gap-4">
                    <span className="text-xs text-muted-foreground">Live Preview</span>
                    <div className="text-2xl">
                      <PercentText 
                        value={typoPercentValue} 
                        decimals={typoPercentDecimals}
                        showSign={typoPercentShowSign}
                        colorByValue={typoPercentColorByValue}
                      />
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Value</Label>
                      <Input 
                        type="number" 
                        value={typoPercentValue} 
                        onChange={(e) => setTypoPercentValue(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Decimals</Label>
                      <Input 
                        type="number" 
                        min={0} 
                        max={8}
                        value={typoPercentDecimals} 
                        onChange={(e) => setTypoPercentDecimals(parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">Show Sign (+/-)</Label>
                      <Switch checked={typoPercentShowSign} onCheckedChange={setTypoPercentShowSign} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">Color by Value</Label>
                      <Switch checked={typoPercentColorByValue} onCheckedChange={setTypoPercentColorByValue} />
                    </div>
                  </div>
                </div>
                <CodePreview 
                  code={`<PercentText value={${typoPercentValue}} decimals={${typoPercentDecimals}}${typoPercentShowSign ? " showSign" : ""}${typoPercentColorByValue ? " colorByValue" : ""} />`}
                  id="percenttext-code"
                />
              </CardContent>
            </Card>

            {/* AmountText Playground */}
            <Card className="trading-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-trading-yellow" />
                  AmountText
                </CardTitle>
                <CardDescription>Display quantities and counts with optional suffix</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
                  {/* Preview */}
                  <div className="bg-muted/30 rounded-xl p-6 flex flex-col items-center justify-center min-h-[120px] gap-4">
                    <span className="text-xs text-muted-foreground">Live Preview</span>
                    <div className="text-2xl">
                      <AmountText 
                        value={typoAmountValue} 
                        decimals={typoAmountDecimals}
                        suffix={typoAmountSuffix}
                      />
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Value</Label>
                      <Input 
                        type="number" 
                        value={typoAmountValue} 
                        onChange={(e) => setTypoAmountValue(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Decimals</Label>
                        <Input 
                          type="number" 
                          min={0} 
                          max={8}
                          value={typoAmountDecimals} 
                          onChange={(e) => setTypoAmountDecimals(parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Suffix</Label>
                        <Input 
                          value={typoAmountSuffix} 
                          onChange={(e) => setTypoAmountSuffix(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <CodePreview 
                  code={`<AmountText value={${typoAmountValue}} decimals={${typoAmountDecimals}} suffix="${typoAmountSuffix}" />`}
                  id="amounttext-code"
                />
              </CardContent>
            </Card>

            {/* LabelText Playground */}
            <Card className="trading-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  LabelText
                </CardTitle>
                <CardDescription>Display text labels with configurable size and weight (always font-sans)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
                  {/* Preview */}
                  <div className="bg-muted/30 rounded-xl p-6 flex flex-col items-center justify-center min-h-[120px] gap-4">
                    <span className="text-xs text-muted-foreground">Live Preview</span>
                    <div className="text-2xl">
                      <LabelText 
                        size={typoLabelSize}
                        weight={typoLabelWeight}
                        muted={typoLabelMuted}
                      >
                        {typoLabelText}
                      </LabelText>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Text</Label>
                      <Input 
                        value={typoLabelText} 
                        onChange={(e) => setTypoLabelText(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Size</Label>
                        <Select value={typoLabelSize} onValueChange={(v) => setTypoLabelSize(v as typeof typoLabelSize)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="xs">xs (12px)</SelectItem>
                            <SelectItem value="sm">sm (14px)</SelectItem>
                            <SelectItem value="base">base (16px)</SelectItem>
                            <SelectItem value="lg">lg (18px)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Weight</Label>
                        <Select value={typoLabelWeight} onValueChange={(v) => setTypoLabelWeight(v as typeof typoLabelWeight)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="normal">normal</SelectItem>
                            <SelectItem value="medium">medium</SelectItem>
                            <SelectItem value="semibold">semibold</SelectItem>
                            <SelectItem value="bold">bold</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">Muted</Label>
                      <Switch checked={typoLabelMuted} onCheckedChange={setTypoLabelMuted} />
                    </div>
                  </div>
                </div>
                <CodePreview 
                  code={`<LabelText size="${typoLabelSize}" weight="${typoLabelWeight}"${typoLabelMuted ? " muted" : ""}>${typoLabelText}</LabelText>`}
                  id="labeltext-code"
                />
              </CardContent>
            </Card>

            {/* AddressText Playground */}
            <Card className="trading-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indicator" />
                  AddressText
                </CardTitle>
                <CardDescription>Display wallet addresses with optional truncation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
                  {/* Preview */}
                  <div className="bg-muted/30 rounded-xl p-6 flex flex-col items-center justify-center min-h-[120px] gap-4">
                    <span className="text-xs text-muted-foreground">Live Preview</span>
                    <div className="text-lg break-all text-center">
                      <AddressText 
                        address={typoAddress}
                        truncate={typoAddressTruncate}
                        truncateLength={typoAddressTruncateLength}
                      />
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Address</Label>
                      <Input 
                        value={typoAddress} 
                        onChange={(e) => setTypoAddress(e.target.value)}
                        className="font-mono text-xs"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">Truncate</Label>
                      <Switch checked={typoAddressTruncate} onCheckedChange={setTypoAddressTruncate} />
                    </div>
                    {typoAddressTruncate && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Truncate Length (chars each side)</Label>
                        <Input 
                          type="number"
                          min={4}
                          max={20}
                          value={typoAddressTruncateLength} 
                          onChange={(e) => setTypoAddressTruncateLength(parseInt(e.target.value) || 6)}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <CodePreview 
                  code={`<AddressText address="${typoAddress.slice(0, 20)}..."${typoAddressTruncate ? ` truncate truncateLength={${typoAddressTruncateLength}}` : ""} />`}
                  id="addresstext-code"
                />
              </CardContent>
            </Card>

            {/* Quick Import Reference */}
            <Card className="trading-card border-primary/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-4 w-4 text-trading-yellow" />
                  Quick Import Reference
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/30 rounded-lg p-4">
                  <code className="text-sm text-muted-foreground font-mono block">
                    {`import { PriceText, PercentText, AmountText, LabelText, AddressText, MonoText } from "@/components/typography";`}
                  </code>
                </div>
                <div className="mt-4 grid gap-2">
                  <div className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="text-trading-green">•</span>
                    <span><code className="text-primary">PriceText</code> - 价格/货币值（自动 font-mono + 可选颜色）</span>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="text-trading-green">•</span>
                    <span><code className="text-primary">PercentText</code> - 百分比值（自动 % 后缀 + 可选颜色）</span>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="text-trading-green">•</span>
                    <span><code className="text-primary">AmountText</code> - 数量/份额（自动 font-mono）</span>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="text-trading-green">•</span>
                    <span><code className="text-primary">LabelText</code> - 文本标签（自动 font-sans + 尺寸/权重配置）</span>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="text-trading-green">•</span>
                    <span><code className="text-primary">AddressText</code> - 钱包地址/哈希（自动 font-mono + 截断）</span>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="text-trading-green">•</span>
                    <span><code className="text-primary">MonoText</code> - 通用等宽文本（仅用于数值）</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
        )}


        {playgroundMatches() && (
        <section id="playground">
          <div className="flex items-center justify-between mb-6 border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <Play className="h-5 w-5 text-trading-purple" />
              <h2 className="text-xl font-semibold text-foreground">Component Playground</h2>
            </div>
            <Button variant="outline" size="sm" onClick={resetPlayground} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>

          <div className="space-y-8">
            {/* Button Playground */}
            <Card className="trading-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-trading-green" />
                  Button Playground
                </CardTitle>
                <CardDescription>Customize button appearance and behavior</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
                  {/* Preview */}
                  <div className="bg-muted/30 rounded-xl p-6 flex items-center justify-center min-h-[120px]">
                    <Button 
                      variant={buttonVariant} 
                      size={buttonSize} 
                      disabled={buttonDisabled}
                      onClick={() => toast.success("Button clicked!")}
                    >
                      {buttonSize === "icon" ? <Settings className="h-4 w-4" /> : buttonText}
                    </Button>
                  </div>

                  {/* Controls */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Variant</Label>
                      <Select value={buttonVariant} onValueChange={(v) => setButtonVariant(v as typeof buttonVariant)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default</SelectItem>
                          <SelectItem value="secondary">Secondary</SelectItem>
                          <SelectItem value="destructive">Destructive</SelectItem>
                          <SelectItem value="outline">Outline</SelectItem>
                          <SelectItem value="ghost">Ghost</SelectItem>
                          <SelectItem value="link">Link</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Size</Label>
                      <Select value={buttonSize} onValueChange={(v) => setButtonSize(v as typeof buttonSize)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sm">Small</SelectItem>
                          <SelectItem value="default">Default</SelectItem>
                          <SelectItem value="lg">Large</SelectItem>
                          <SelectItem value="icon">Icon</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Text</Label>
                      <Input 
                        value={buttonText} 
                        onChange={(e) => setButtonText(e.target.value)}
                        placeholder="Button text"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Disabled</Label>
                      <Switch checked={buttonDisabled} onCheckedChange={setButtonDisabled} />
                    </div>
                  </div>
                </div>

                <CodePreview 
                  code={`<Button variant="${buttonVariant}" size="${buttonSize}"${buttonDisabled ? " disabled" : ""}>${buttonSize === "icon" ? "<Icon />" : buttonText}</Button>`}
                  id="button-code"
                />
              </CardContent>
            </Card>

            {/* Badge Playground */}
            <Card className="trading-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-trading-purple" />
                  Badge Playground
                </CardTitle>
                <CardDescription>Customize badge variants and colors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
                  {/* Preview */}
                  <div className="bg-muted/30 rounded-xl p-6 flex items-center justify-center min-h-[120px]">
                    <Badge 
                      variant={badgeCustomColor === "none" ? badgeVariant : "outline"}
                      className={
                        badgeCustomColor === "green" ? "bg-trading-green/20 text-trading-green border-trading-green/30" :
                        badgeCustomColor === "red" ? "bg-trading-red/20 text-trading-red border-trading-red/30" :
                        badgeCustomColor === "yellow" ? "bg-trading-yellow/20 text-trading-yellow border-trading-yellow/30" :
                        badgeCustomColor === "purple" ? "bg-trading-purple/20 text-trading-purple border-trading-purple/30" :
                        ""
                      }
                    >
                      {badgeText}
                    </Badge>
                  </div>

                  {/* Controls */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Variant</Label>
                      <Select value={badgeVariant} onValueChange={(v) => { setBadgeVariant(v as typeof badgeVariant); setBadgeCustomColor("none"); }}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default</SelectItem>
                          <SelectItem value="secondary">Secondary</SelectItem>
                          <SelectItem value="destructive">Destructive</SelectItem>
                          <SelectItem value="outline">Outline</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Trading Color</Label>
                      <Select value={badgeCustomColor} onValueChange={setBadgeCustomColor}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None (Use Variant)</SelectItem>
                          <SelectItem value="green">Trading Green</SelectItem>
                          <SelectItem value="red">Trading Red</SelectItem>
                          <SelectItem value="yellow">Trading Yellow</SelectItem>
                          <SelectItem value="purple">Trading Purple</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Text</Label>
                      <Input 
                        value={badgeText} 
                        onChange={(e) => setBadgeText(e.target.value)}
                        placeholder="Badge text"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Input Playground */}
            <Card className="trading-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-trading-yellow" />
                  Input Playground
                </CardTitle>
                <CardDescription>Test input field configurations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
                  {/* Preview */}
                  <div className="bg-muted/30 rounded-xl p-6 flex items-center justify-center min-h-[120px]">
                    <Input 
                      type={inputType}
                      placeholder={inputPlaceholder}
                      disabled={inputDisabled}
                      className="max-w-[240px]"
                    />
                  </div>

                  {/* Controls */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Type</Label>
                      <Select value={inputType} onValueChange={(v) => setInputType(v as typeof inputType)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="password">Password</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Placeholder</Label>
                      <Input 
                        value={inputPlaceholder} 
                        onChange={(e) => setInputPlaceholder(e.target.value)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Disabled</Label>
                      <Switch checked={inputDisabled} onCheckedChange={setInputDisabled} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Progress Bar Playground */}
            <Card className="trading-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-trading-red" />
                  Progress Bar Playground
                </CardTitle>
                <CardDescription>Adjust progress value and color</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
                  {/* Preview */}
                  <div className="bg-muted/30 rounded-xl p-6 flex flex-col justify-center min-h-[120px] gap-2">
                    <div className={`h-3 rounded-full overflow-hidden ${
                      progressColor === "green" ? "bg-trading-green-muted" :
                      progressColor === "red" ? "bg-trading-red-muted" :
                      "bg-trading-purple-muted"
                    }`}>
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          progressColor === "green" ? "bg-trading-green" :
                          progressColor === "red" ? "bg-trading-red" :
                          "bg-trading-purple"
                        }`}
                        style={{ width: `${progressValue}%` }}
                      />
                    </div>
                    <p className={`text-center font-mono text-lg ${
                      progressColor === "green" ? "text-trading-green" :
                      progressColor === "red" ? "text-trading-red" :
                      "text-trading-purple"
                    }`}>
                      {progressValue}%
                    </p>
                  </div>

                  {/* Controls */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Value: {progressValue}%</Label>
                      <Slider 
                        value={[progressValue]} 
                        onValueChange={(v) => setProgressValue(v[0])}
                        min={0}
                        max={100}
                        step={1}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Color</Label>
                      <Select value={progressColor} onValueChange={(v) => setProgressColor(v as typeof progressColor)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="green">Green (Profit)</SelectItem>
                          <SelectItem value="red">Red (Loss)</SelectItem>
                          <SelectItem value="purple">Purple (Neutral)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card Playground */}
            <Card className="trading-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indicator" />
                  Card Playground
                </CardTitle>
                <CardDescription>Customize card style and content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
                  {/* Preview */}
                  <div className="bg-muted/30 rounded-xl p-6 flex items-center justify-center min-h-[180px]">
                    <Card className={cardStyle === "trading" ? "trading-card w-full max-w-[280px]" : "w-full max-w-[280px]"}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{cardTitle}</CardTitle>
                        <CardDescription className="text-xs">{cardDescription}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">Sample card content area.</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Controls */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Style</Label>
                      <Select value={cardStyle} onValueChange={(v) => setCardStyle(v as typeof cardStyle)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default</SelectItem>
                          <SelectItem value="trading">Trading (Gradient)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Title</Label>
                      <Input 
                        value={cardTitle} 
                        onChange={(e) => setCardTitle(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Description</Label>
                      <Input 
                        value={cardDescription} 
                        onChange={(e) => setCardDescription(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <CodePreview 
                  code={`<Card${cardStyle === "trading" ? ' className="trading-card"' : ""}><CardHeader>...</CardHeader></Card>`}
                  id="card-code"
                />
              </CardContent>
            </Card>

            {/* Switch Playground */}
            <Card className="trading-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-trading-green" />
                  Switch Playground
                </CardTitle>
                <CardDescription>Toggle switch with label and states</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
                  {/* Preview */}
                  <div className="bg-muted/30 rounded-xl p-6 flex items-center justify-center min-h-[120px]">
                    <div className="flex items-center gap-3">
                      <Switch 
                        checked={switchChecked} 
                        onCheckedChange={setSwitchChecked}
                        disabled={switchDisabled}
                      />
                      <Label className={switchDisabled ? "text-muted-foreground" : ""}>
                        {switchLabel}
                      </Label>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Label Text</Label>
                      <Input 
                        value={switchLabel} 
                        onChange={(e) => setSwitchLabel(e.target.value)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Checked</Label>
                      <Switch checked={switchChecked} onCheckedChange={setSwitchChecked} />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Disabled</Label>
                      <Switch checked={switchDisabled} onCheckedChange={setSwitchDisabled} />
                    </div>
                  </div>
                </div>

                <CodePreview 
                  code={`<Switch${switchChecked ? " checked" : ""}${switchDisabled ? " disabled" : ""} />`}
                  id="switch-code"
                />
              </CardContent>
            </Card>

            {/* Slider Playground */}
            <Card className="trading-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-trading-purple" />
                  Slider Playground
                </CardTitle>
                <CardDescription>Adjust slider range and behavior</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
                  {/* Preview */}
                  <div className="bg-muted/30 rounded-xl p-6 flex flex-col justify-center min-h-[120px] gap-4">
                    <Slider 
                      value={sliderValue}
                      onValueChange={setSliderValue}
                      min={sliderMin}
                      max={sliderMax}
                      step={sliderStep}
                      disabled={sliderDisabled}
                    />
                    <p className="text-center font-mono text-lg text-trading-purple">
                      {sliderValue[0]}
                    </p>
                  </div>

                  {/* Controls */}
                  <div className="space-y-4">
                    <div className={`grid gap-4 ${isMobile ? "grid-cols-2" : "grid-cols-3"}`}>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Min</Label>
                        <Input 
                          type="number"
                          value={sliderMin} 
                          onChange={(e) => setSliderMin(Number(e.target.value))}
                          className="font-mono"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Max</Label>
                        <Input 
                          type="number"
                          value={sliderMax} 
                          onChange={(e) => setSliderMax(Number(e.target.value))}
                          className="font-mono"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Step</Label>
                        <Input 
                          type="number"
                          value={sliderStep} 
                          onChange={(e) => setSliderStep(Number(e.target.value))}
                          className="font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Disabled</Label>
                      <Switch checked={sliderDisabled} onCheckedChange={setSliderDisabled} />
                    </div>
                  </div>
                </div>

                <CodePreview 
                  code={`<Slider value={[${sliderValue[0]}]} min={${sliderMin}} max={${sliderMax}} step={${sliderStep}}${sliderDisabled ? " disabled" : ""} />`}
                  id="slider-code"
                />
              </CardContent>
            </Card>

            {/* Tabs Playground */}
            <Card className="trading-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-trading-yellow" />
                  Tabs Playground
                </CardTitle>
                <CardDescription>Configure tab count and styling</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
                  {/* Preview */}
                  <div className="bg-muted/30 rounded-xl p-4 min-h-[180px]">
                    <Tabs defaultValue="tab-0" className="w-full">
                      <TabsList className={tabsStyle === "full-width" ? "w-full bg-muted/30" : "bg-muted/30"}>
                        {Array.from({ length: tabsCount }).map((_, i) => (
                          <TabsTrigger 
                            key={i} 
                            value={`tab-${i}`}
                            className={tabsStyle === "full-width" ? "flex-1" : ""}
                          >
                            {tabLabels[i] || `Tab ${i + 1}`}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      {Array.from({ length: tabsCount }).map((_, i) => (
                        <TabsContent key={i} value={`tab-${i}`} className="p-4">
                          <p className="text-sm text-muted-foreground">
                            Content for {tabLabels[i] || `Tab ${i + 1}`}
                          </p>
                        </TabsContent>
                      ))}
                    </Tabs>
                  </div>

                  {/* Controls */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Number of Tabs: {tabsCount}</Label>
                      <Slider 
                        value={[tabsCount]}
                        onValueChange={(v) => setTabsCount(v[0])}
                        min={2}
                        max={4}
                        step={1}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Style</Label>
                      <Select value={tabsStyle} onValueChange={(v) => setTabsStyle(v as typeof tabsStyle)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default</SelectItem>
                          <SelectItem value="full-width">Full Width</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Tab Labels</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {Array.from({ length: tabsCount }).map((_, i) => (
                          <Input
                            key={i}
                            value={tabLabels[i]}
                            onChange={(e) => {
                              const newLabels = [...tabLabels];
                              newLabels[i] = e.target.value;
                              setTabLabels(newLabels);
                            }}
                            placeholder={`Tab ${i + 1}`}
                            className="text-sm"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <CodePreview 
                  code={`<Tabs><TabsList${tabsStyle === "full-width" ? ' className="w-full"' : ""}>${Array.from({ length: tabsCount }).map((_, i) => `<TabsTrigger>${tabLabels[i]}</TabsTrigger>`).join("")}</TabsList></Tabs>`}
                  id="tabs-code"
                />
              </CardContent>
            </Card>

            {/* Tooltip Playground */}
            <Card className="trading-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                  Tooltip Playground
                </CardTitle>
                <CardDescription>Customize tooltip position and delay</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
                  {/* Preview */}
                  <div className="bg-muted/30 rounded-xl p-6 flex items-center justify-center min-h-[150px]">
                    <Tooltip delayDuration={tooltipDelayDuration}>
                      <TooltipTrigger asChild>
                        <Button variant="outline" className="gap-2">
                          <HelpCircle className="h-4 w-4" />
                          Hover me
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side={tooltipSide}>
                        <p>{tooltipText}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  {/* Controls */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Tooltip Text</Label>
                      <Input 
                        value={tooltipText} 
                        onChange={(e) => setTooltipText(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Position</Label>
                      <Select value={tooltipSide} onValueChange={(v) => setTooltipSide(v as typeof tooltipSide)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="top">Top</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                          <SelectItem value="bottom">Bottom</SelectItem>
                          <SelectItem value="left">Left</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Delay: {tooltipDelayDuration}ms</Label>
                      <Slider 
                        value={[tooltipDelayDuration]}
                        onValueChange={(v) => setTooltipDelayDuration(v[0])}
                        min={0}
                        max={1000}
                        step={50}
                      />
                    </div>
                  </div>
                </div>

                <CodePreview 
                  code={`<Tooltip delayDuration={${tooltipDelayDuration}}><TooltipTrigger>...</TooltipTrigger><TooltipContent side="${tooltipSide}">${tooltipText}</TooltipContent></Tooltip>`}
                  id="tooltip-code"
                />
              </CardContent>
            </Card>

            {/* Popover Playground */}
            <Card className="trading-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indicator" />
                  Popover Playground
                </CardTitle>
                <CardDescription>Configure popover position, alignment and content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
                  {/* Preview */}
                  <div className="bg-muted/30 rounded-xl p-6 flex items-center justify-center min-h-[180px]">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="gap-2">
                          <Info className="h-4 w-4" />
                          Click me
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent side={popoverSide} align={popoverAlign} className="w-72">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">{popoverTitle}</h4>
                          <p className="text-sm text-muted-foreground">{popoverContent}</p>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Controls */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Title</Label>
                      <Input 
                        value={popoverTitle} 
                        onChange={(e) => setPopoverTitle(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Content</Label>
                      <Input 
                        value={popoverContent} 
                        onChange={(e) => setPopoverContent(e.target.value)}
                      />
                    </div>

                    <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Side</Label>
                        <Select value={popoverSide} onValueChange={(v) => setPopoverSide(v as typeof popoverSide)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="top">Top</SelectItem>
                            <SelectItem value="right">Right</SelectItem>
                            <SelectItem value="bottom">Bottom</SelectItem>
                            <SelectItem value="left">Left</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Align</Label>
                        <Select value={popoverAlign} onValueChange={(v) => setPopoverAlign(v as typeof popoverAlign)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="start">Start</SelectItem>
                            <SelectItem value="center">Center</SelectItem>
                            <SelectItem value="end">End</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                <CodePreview 
                  code={`<Popover><PopoverTrigger>...</PopoverTrigger><PopoverContent side="${popoverSide}" align="${popoverAlign}">...</PopoverContent></Popover>`}
                  id="popover-code"
                />
              </CardContent>
            </Card>

            {/* Dialog Playground */}
            <Card className="trading-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-trading-green" />
                  Dialog / Modal Playground
                </CardTitle>
                <CardDescription>Configure dialog size, animation and content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
                  {/* Preview */}
                  <div className="bg-muted/30 rounded-xl p-6 flex items-center justify-center min-h-[180px]">
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="gap-2">
                          <Maximize2 className="h-4 w-4" />
                          Open Dialog
                        </Button>
                      </DialogTrigger>
                      <DialogContent className={`${getDialogSizeClass()} ${getDialogAnimationClass()}`}>
                        <DialogHeader>
                          <DialogTitle>{dialogTitle}</DialogTitle>
                          <DialogDescription>{dialogDescription}</DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                          <p className="text-sm text-muted-foreground">
                            This is the main content area of the dialog. You can put any content here including forms, images, or other components.
                          </p>
                          {dialogSize === "full" && (
                            <div className="mt-4 p-4 bg-muted/30 rounded-lg h-[200px] flex items-center justify-center">
                              <p className="text-muted-foreground">Extended content area for full-size dialog</p>
                            </div>
                          )}
                        </div>
                        {dialogShowFooter && (
                          <DialogFooter className="gap-2">
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                            <Button onClick={() => { setDialogOpen(false); toast.success("Action confirmed!"); }}>Confirm</Button>
                          </DialogFooter>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Controls */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Title</Label>
                      <Input 
                        value={dialogTitle} 
                        onChange={(e) => setDialogTitle(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Description</Label>
                      <Input 
                        value={dialogDescription} 
                        onChange={(e) => setDialogDescription(e.target.value)}
                      />
                    </div>

                    <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Size</Label>
                        <Select value={dialogSize} onValueChange={(v) => setDialogSize(v as typeof dialogSize)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sm">Small</SelectItem>
                            <SelectItem value="md">Medium</SelectItem>
                            <SelectItem value="lg">Large</SelectItem>
                            <SelectItem value="xl">Extra Large</SelectItem>
                            <SelectItem value="full">Full Screen</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Animation</Label>
                        <Select value={dialogAnimation} onValueChange={(v) => setDialogAnimation(v as typeof dialogAnimation)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fade">Fade</SelectItem>
                            <SelectItem value="scale">Scale (Default)</SelectItem>
                            <SelectItem value="slide">Slide Up</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Show Footer</Label>
                      <Switch checked={dialogShowFooter} onCheckedChange={setDialogShowFooter} />
                    </div>
                  </div>
                </div>

                <CodePreview 
                  code={`<Dialog><DialogTrigger>...</DialogTrigger><DialogContent className="${getDialogSizeClass()}">...</DialogContent></Dialog>`}
                  id="dialog-code"
                />
              </CardContent>
            </Card>
          </div>
        </section>
        )}

        {/* Mobile Header Playground */}
        {filterSection("mobile-header-playground") && (
        <section id="mobile-header-playground" className="scroll-mt-20">
          <h2 className="text-xl font-semibold mb-6 text-foreground border-b border-border pb-2">Mobile Header Playground</h2>
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-trading-purple" />
                Mobile Header Playground
              </CardTitle>
              <CardDescription>实时预览 MobileHeader 组件的各种配置</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Live Preview */}
              <div className="bg-muted/30 rounded-xl overflow-hidden border border-border">
                <div className="relative">
                  <MobileHeader 
                    title={headerTitle || undefined}
                    showLogo={headerShowLogo}
                    showBack={headerShowBack}
                    showActions={headerShowActions}
                    isFavorite={headerIsFavorite}
                    onFavoriteToggle={() => setHeaderIsFavorite(!headerIsFavorite)}
                    endTime={headerShowCountdown ? new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) : undefined}
                    tweetCount={headerShowTweets ? headerTweetCount : undefined}
                    currentPrice={headerShowPrice ? headerCurrentPrice : undefined}
                    priceChange24h={headerShowPrice ? headerPriceChange : undefined}
                    onTitleClick={() => toast.info("Title clicked - would open event selector")}
                  />
                </div>
              </div>

              {/* Controls */}
              <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
                {/* Left Column - Text Controls */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Title</Label>
                    <Input 
                      value={headerTitle} 
                      onChange={(e) => setHeaderTitle(e.target.value)}
                      placeholder="Enter title..."
                    />
                  </div>

                  <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Current Price</Label>
                      <Input 
                        value={headerCurrentPrice} 
                        onChange={(e) => setHeaderCurrentPrice(e.target.value)}
                        placeholder="$94,532.18"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Price Change</Label>
                      <Input 
                        value={headerPriceChange} 
                        onChange={(e) => setHeaderPriceChange(e.target.value)}
                        placeholder="+2.34%"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Tweet Count</Label>
                    <Input 
                      type="number"
                      value={headerTweetCount} 
                      onChange={(e) => setHeaderTweetCount(parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>

                {/* Right Column - Toggle Controls */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-border/30">
                    <div>
                      <Label className="text-sm">Show Logo</Label>
                      <p className="text-xs text-muted-foreground">Trade pages should hide logo</p>
                    </div>
                    <Switch checked={headerShowLogo} onCheckedChange={setHeaderShowLogo} />
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-border/30">
                    <div>
                      <Label className="text-sm">Show Back Button</Label>
                      <p className="text-xs text-muted-foreground">Navigation indicator</p>
                    </div>
                    <Switch checked={headerShowBack} onCheckedChange={setHeaderShowBack} />
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-border/30">
                    <div>
                      <Label className="text-sm">Show Actions</Label>
                      <p className="text-xs text-muted-foreground">Favorite & Share buttons</p>
                    </div>
                    <Switch checked={headerShowActions} onCheckedChange={setHeaderShowActions} />
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-border/30">
                    <div>
                      <Label className="text-sm">Show Countdown</Label>
                      <p className="text-xs text-muted-foreground">Ends in timer</p>
                    </div>
                    <Switch checked={headerShowCountdown} onCheckedChange={setHeaderShowCountdown} />
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-border/30">
                    <div>
                      <Label className="text-sm">Show Tweet Count</Label>
                      <p className="text-xs text-muted-foreground">Social metrics</p>
                    </div>
                    <Switch checked={headerShowTweets} onCheckedChange={setHeaderShowTweets} />
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div>
                      <Label className="text-sm">Show Price</Label>
                      <p className="text-xs text-muted-foreground">Price-based events</p>
                    </div>
                    <Switch checked={headerShowPrice} onCheckedChange={setHeaderShowPrice} />
                  </div>
                </div>
              </div>

              {/* Preset Configurations */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Quick Presets</Label>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setHeaderTitle("Bitcoin price on January 31, 2026?");
                      setHeaderShowLogo(false);
                      setHeaderShowBack(true);
                      setHeaderShowActions(true);
                      setHeaderShowCountdown(true);
                      setHeaderShowTweets(false);
                      setHeaderShowPrice(true);
                    }}
                  >
                    Trade Page (Price)
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setHeaderTitle("Elon Musk # tweets January 10 - January 17, 2026");
                      setHeaderShowLogo(false);
                      setHeaderShowBack(true);
                      setHeaderShowActions(true);
                      setHeaderShowCountdown(true);
                      setHeaderShowTweets(true);
                      setHeaderShowPrice(false);
                    }}
                  >
                    Trade Page (Tweets)
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setHeaderTitle("");
                      setHeaderShowLogo(true);
                      setHeaderShowBack(false);
                      setHeaderShowActions(false);
                      setHeaderShowCountdown(false);
                      setHeaderShowTweets(false);
                      setHeaderShowPrice(false);
                    }}
                  >
                    Events List
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setHeaderTitle("Event Details");
                      setHeaderShowLogo(false);
                      setHeaderShowBack(true);
                      setHeaderShowActions(false);
                      setHeaderShowCountdown(false);
                      setHeaderShowTweets(false);
                      setHeaderShowPrice(false);
                    }}
                  >
                    Detail Page
                  </Button>
                </div>
              </div>

              <CodePreview 
                code={`<MobileHeader${headerTitle ? ` title="${headerTitle.substring(0, 30)}${headerTitle.length > 30 ? '...' : ''}"` : ''}${headerShowLogo ? '' : ' showLogo={false}'}${headerShowBack ? ' showBack' : ''}${headerShowActions ? ' showActions' : ''}${headerShowCountdown ? ' endTime={...}' : ''}${headerShowTweets ? ` tweetCount={${headerTweetCount}}` : ''}${headerShowPrice ? ` currentPrice="${headerCurrentPrice}"` : ''} />`}
                id="mobile-header-code"
              />
            </CardContent>
          </Card>
        </section>
        )}

        {/* Account Risk Indicator Playground */}
        {filterSection("account-risk-playground") && (
        <section id="account-risk-playground" className="scroll-mt-20">
          <h2 className="text-xl font-semibold mb-6 text-foreground border-b border-border pb-2">Account Risk Playground</h2>
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-trading-purple" />
                Risk Level Simulator
              </CardTitle>
              <CardDescription>Simulate different account states to see how risk levels change</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6">
              {/* Live Preview - Compact on mobile */}
              <div className="bg-muted/30 rounded-xl p-3 md:p-4 border border-border">
                {/* Risk Level Display - Stack on mobile */}
                <div className={`flex ${isMobile ? "flex-col gap-2" : "items-center justify-between"} mb-3 md:mb-4`}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">Unified Trading Account</span>
                    <button
                      onClick={() => setRiskShowValues(!riskShowValues)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {riskShowValues ? <Info className="w-4 h-4" /> : <HelpCircle className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${isMobile ? "self-start" : ""} ${
                    playgroundRiskMetrics.riskLevel === "SAFE" ? "bg-trading-green/20 text-trading-green" :
                    playgroundRiskMetrics.riskLevel === "WARNING" ? "bg-trading-yellow/20 text-trading-yellow" :
                    playgroundRiskMetrics.riskLevel === "RESTRICTION" ? "bg-orange-500/20 text-orange-500" :
                    "bg-trading-red/20 text-trading-red"
                  }`}>
                    {playgroundRiskMetrics.riskLevel === "SAFE" && <ShieldCheck className="w-3.5 h-3.5" />}
                    {playgroundRiskMetrics.riskLevel === "WARNING" && <AlertTriangle className="w-3.5 h-3.5" />}
                    {playgroundRiskMetrics.riskLevel === "RESTRICTION" && <Ban className="w-3.5 h-3.5" />}
                    {playgroundRiskMetrics.riskLevel === "LIQUIDATION" && <Zap className="w-3.5 h-3.5" />}
                    <span className="text-xs font-medium">{playgroundRiskMetrics.riskLevel}</span>
                  </div>
                </div>

                {/* Metrics Display */}
                <div className="grid grid-cols-2 gap-3 md:gap-4 mb-3 md:mb-4">
                  <div>
                    <span className="text-[11px] md:text-xs text-muted-foreground">Account Equity</span>
                    <p className={`${isMobile ? "text-base" : "text-lg"} font-mono font-semibold text-foreground`}>
                      {riskShowValues ? `$${playgroundRiskMetrics.equity.toFixed(2)}` : "****"}
                    </p>
                    {riskUnrealizedPnL !== 0 && riskShowValues && (
                      <span className={`text-[10px] md:text-xs font-mono ${riskUnrealizedPnL >= 0 ? 'text-trading-green' : 'text-trading-red'}`}>
                        {riskUnrealizedPnL >= 0 ? '+' : ''}{riskUnrealizedPnL.toFixed(2)} PnL
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-[11px] md:text-xs text-muted-foreground">Risk Ratio (IM/Equity)</span>
                    <p className={`${isMobile ? "text-base" : "text-lg"} font-mono font-semibold ${
                      playgroundRiskMetrics.riskLevel === "SAFE" ? "text-trading-green" :
                      playgroundRiskMetrics.riskLevel === "WARNING" ? "text-trading-yellow" :
                      playgroundRiskMetrics.riskLevel === "RESTRICTION" ? "text-orange-500" :
                      "text-trading-red"
                    }`}>
                      {riskShowValues ? `${playgroundRiskMetrics.riskRatio.toFixed(2)}%` : "****"}
                    </p>
                  </div>
                </div>

                {/* Risk Progress Bar */}
                <div className="space-y-1.5 md:space-y-2">
                  <div className="relative">
                    <div className={`${isMobile ? "h-2" : "h-3"} bg-muted rounded-full overflow-hidden`}>
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          playgroundRiskMetrics.riskLevel === "SAFE" ? "bg-trading-green" :
                          playgroundRiskMetrics.riskLevel === "WARNING" ? "bg-trading-yellow" :
                          playgroundRiskMetrics.riskLevel === "RESTRICTION" ? "bg-orange-500" :
                          "bg-trading-red"
                        }`}
                        style={{ width: `${Math.min(playgroundRiskMetrics.riskRatio, 100)}%` }}
                      />
                    </div>
                    {/* Threshold markers */}
                    <div className={`absolute top-0 left-[80%] w-px ${isMobile ? "h-2" : "h-3"} bg-trading-yellow/50`} />
                    <div className={`absolute top-0 left-[95%] w-px ${isMobile ? "h-2" : "h-3"} bg-orange-500/50`} />
                  </div>
                  
                  <div className={`flex justify-between ${isMobile ? "text-[8px]" : "text-[10px]"}`}>
                    <span className="text-trading-green">SAFE</span>
                    <span className="text-trading-yellow">{isMobile ? "80%" : "WARNING (80%)"}</span>
                    <span className="text-orange-500">{isMobile ? "95%" : "RESTRICT (95%)"}</span>
                    <span className="text-trading-red">{isMobile ? "100%" : "LIQ (100%)"}</span>
                  </div>
                </div>

                {/* IM & MM Display */}
                <div className="grid grid-cols-3 gap-2 md:gap-3 pt-2 md:pt-3 mt-2 md:mt-3 border-t border-border/30">
                  <div>
                    <span className="text-[10px] md:text-xs text-muted-foreground">{isMobile ? "IM" : "Initial Margin"}</span>
                    <p className={`${isMobile ? "text-xs" : "text-sm"} font-mono text-foreground`}>${riskIMTotal.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-[10px] md:text-xs text-muted-foreground">{isMobile ? "MM" : "Maint. Margin"}</span>
                    <p className={`${isMobile ? "text-xs" : "text-sm"} font-mono text-foreground`}>${playgroundRiskMetrics.mmTotal.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-[10px] md:text-xs text-muted-foreground">{isMobile ? "Avail." : "Available"}</span>
                    <p className={`${isMobile ? "text-xs" : "text-sm"} font-mono text-foreground`}>${playgroundRiskMetrics.availableMargin.toFixed(2)}</p>
                  </div>
                </div>

                {/* Risk Status Message - Compact on mobile */}
                {playgroundRiskMetrics.riskLevel !== "SAFE" && (
                  <div className={`flex items-center gap-2 ${isMobile ? "p-2 text-xs" : "p-3 text-sm"} rounded-lg mt-2 md:mt-3 ${
                    playgroundRiskMetrics.riskLevel === "LIQUIDATION" 
                      ? "bg-trading-red/10 text-trading-red border border-trading-red/30"
                      : playgroundRiskMetrics.riskLevel === "RESTRICTION"
                      ? "bg-orange-500/10 text-orange-500 border border-orange-500/30"
                      : "bg-trading-yellow/10 text-trading-yellow border border-trading-yellow/30"
                  }`}>
                    <span className={isMobile ? "text-sm" : "text-lg"}>
                      {playgroundRiskMetrics.riskLevel === "LIQUIDATION" ? "💥" :
                       playgroundRiskMetrics.riskLevel === "RESTRICTION" ? "🚨" : "⚠️"}
                    </span>
                    <span className={isMobile ? "leading-tight" : ""}>
                      {playgroundRiskMetrics.riskLevel === "LIQUIDATION" ? "Liquidation triggered!" :
                       playgroundRiskMetrics.riskLevel === "RESTRICTION" ? (isMobile ? "Close-only mode" : "Close-only mode, no new positions") :
                       (isMobile ? "Opening restricted" : "Opening restricted, consider reducing")}
                    </span>
                  </div>
                )}
              </div>

              {/* Controls - Stacked on mobile */}
              <div className="space-y-4">
                {/* Sliders */}
                <div className="space-y-3 md:space-y-4">
                  <div>
                    <Label className="text-xs md:text-sm mb-2 block">Total Assets: ${riskTotalAssets}</Label>
                    <Slider
                      value={[riskTotalAssets]}
                      onValueChange={(v) => setRiskTotalAssets(v[0])}
                      min={10}
                      max={200}
                      step={1}
                    />
                  </div>
                  <div>
                    <Label className="text-xs md:text-sm mb-2 block">Unrealized PnL: {riskUnrealizedPnL >= 0 ? '+' : ''}{riskUnrealizedPnL}</Label>
                    <Slider
                      value={[riskUnrealizedPnL]}
                      onValueChange={(v) => setRiskUnrealizedPnL(v[0])}
                      min={-80}
                      max={50}
                      step={1}
                    />
                  </div>
                  <div>
                    <Label className="text-xs md:text-sm mb-2 block">Initial Margin (IM): ${riskIMTotal}</Label>
                    <Slider
                      value={[riskIMTotal]}
                      onValueChange={(v) => setRiskIMTotal(v[0])}
                      min={10}
                      max={100}
                      step={1}
                    />
                  </div>
                </div>

                {/* Quick Scenarios */}
                <div className="space-y-2 md:space-y-3">
                  <Label className="text-xs md:text-sm block">Quick Scenarios</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size={isMobile ? "sm" : "default"}
                      className={`${isMobile ? "text-xs px-2 py-1.5 h-auto" : "justify-start"} text-trading-green border-trading-green/30 hover:bg-trading-green/10`}
                      onClick={() => { setRiskTotalAssets(100); setRiskUnrealizedPnL(0); setRiskIMTotal(50); }}
                    >
                      <ShieldCheck className={`${isMobile ? "w-3 h-3 mr-1" : "w-4 h-4 mr-2"}`} />
                      {isMobile ? "SAFE" : "SAFE (50%)"}
                    </Button>
                    <Button
                      variant="outline"
                      size={isMobile ? "sm" : "default"}
                      className={`${isMobile ? "text-xs px-2 py-1.5 h-auto" : "justify-start"} text-trading-yellow border-trading-yellow/30 hover:bg-trading-yellow/10`}
                      onClick={() => { setRiskTotalAssets(100); setRiskUnrealizedPnL(-40); setRiskIMTotal(50); }}
                    >
                      <AlertTriangle className={`${isMobile ? "w-3 h-3 mr-1" : "w-4 h-4 mr-2"}`} />
                      {isMobile ? "WARNING" : "WARNING (83%)"}
                    </Button>
                    <Button
                      variant="outline"
                      size={isMobile ? "sm" : "default"}
                      className={`${isMobile ? "text-xs px-2 py-1.5 h-auto" : "justify-start"} text-orange-500 border-orange-500/30 hover:bg-orange-500/10`}
                      onClick={() => { setRiskTotalAssets(100); setRiskUnrealizedPnL(-48); setRiskIMTotal(50); }}
                    >
                      <Ban className={`${isMobile ? "w-3 h-3 mr-1" : "w-4 h-4 mr-2"}`} />
                      {isMobile ? "RESTRICT" : "RESTRICT (96%)"}
                    </Button>
                    <Button
                      variant="outline"
                      size={isMobile ? "sm" : "default"}
                      className={`${isMobile ? "text-xs px-2 py-1.5 h-auto" : "justify-start"} text-trading-red border-trading-red/30 hover:bg-trading-red/10`}
                      onClick={() => { setRiskTotalAssets(100); setRiskUnrealizedPnL(-52); setRiskIMTotal(50); }}
                    >
                      <Zap className={`${isMobile ? "w-3 h-3 mr-1" : "w-4 h-4 mr-2"}`} />
                      {isMobile ? "LIQUIDATION" : "LIQUIDATION (104%)"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Code Preview - Hide on mobile for cleaner UX */}
              {!isMobile && (
                <CodePreview
                  code={`<AccountRiskIndicator variant="compact" />

// Risk calculation logic:
const equity = totalAssets + unrealizedPnL; // ${riskTotalAssets} + ${riskUnrealizedPnL} = ${playgroundRiskMetrics.equity}
const riskRatio = (IM / equity) * 100;      // (${riskIMTotal} / ${playgroundRiskMetrics.equity}) * 100 = ${playgroundRiskMetrics.riskRatio.toFixed(2)}%
// Risk Level: ${playgroundRiskMetrics.riskLevel}`}
                  id="account-risk-code"
                />
              )}
            </CardContent>
          </Card>
        </section>
        )}

        {/* Colors Section */}
        {filterSection("colors") && (
        <section id="colors">
          <h2 className="text-xl font-semibold mb-6 text-foreground border-b border-border pb-2">Colors</h2>
          <div className="space-y-10">
            {colorSections.map((section) => (
              <div key={section.title}>
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-foreground mb-1">{section.title}</h3>
                  {section.description && (
                    <p className="text-sm text-muted-foreground">{section.description}</p>
                  )}
                </div>
                <div className={`grid gap-3 ${isMobile ? "grid-cols-2" : "grid-cols-4 lg:grid-cols-6"}`}>
                  {section.colors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => copyToClipboard(color.variable, color.name)}
                      className="group relative text-left"
                    >
                      <div
                        className={`h-14 rounded-lg ${color.class} border border-border/50 mb-2 flex items-center justify-center transition-all group-hover:scale-105 group-hover:border-primary/50`}
                      >
                        {copiedColor === color.name ? (
                          <Check className="h-5 w-5 text-foreground" />
                        ) : (
                          <Copy className="h-4 w-4 text-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                      <p className="text-xs font-medium truncate">{color.name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono truncate">{color.variable}</p>
                      {(color as any).usage && (
                        <p className="text-[10px] text-primary/70 truncate mt-0.5">{(color as any).usage}</p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
        )}

        {/* Trading Colors Demo */}
        {filterSection("trading-colors") && (
        <section id="trading-colors">
          <h2 className="text-xl font-semibold mb-6 text-foreground border-b border-border pb-2">Trading Colors Usage</h2>
          <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-3"}`}>
            <Card className="trading-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-5 w-5 text-trading-green" />
                <span className="font-medium">Profit / Yes</span>
              </div>
              <p className="price-green text-2xl mb-2">+$1,234.56</p>
              <p className="text-trading-green text-sm">+12.34%</p>
              <div className="mt-3 h-2 bg-trading-green-muted rounded-full overflow-hidden">
                <div className="h-full w-3/4 bg-trading-green rounded-full" />
              </div>
            </Card>

            <Card className="trading-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="h-5 w-5 text-trading-red" />
                <span className="font-medium">Loss / No</span>
              </div>
              <p className="price-red text-2xl mb-2">-$567.89</p>
              <p className="text-trading-red text-sm">-5.67%</p>
              <div className="mt-3 h-2 bg-trading-red-muted rounded-full overflow-hidden">
                <div className="h-full w-1/2 bg-trading-red rounded-full" />
              </div>
            </Card>

            <Card className="trading-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-5 w-5 text-trading-purple" />
                <span className="font-medium">Interactive / Selected</span>
              </div>
              <p className="text-trading-purple text-2xl font-mono mb-2">0.65</p>
              <p className="text-trading-purple text-sm">Selected Option</p>
              <div className="mt-3 h-2 bg-trading-purple-muted rounded-full overflow-hidden">
                <div className="h-full w-2/3 bg-trading-purple rounded-full" />
              </div>
            </Card>
          </div>
        </section>
        )}

        {/* Category Labels Section */}
        {filterSection("category-labels") && (
        <section id="category-labels">
          <h2 className="text-xl font-semibold mb-6 text-foreground border-b border-border pb-2">Category Labels</h2>
          <div className="space-y-6">
            <div className="trading-card p-6">
              <h3 className="text-base font-semibold text-foreground mb-2">Unified Category System</h3>
              <p className="text-sm text-muted-foreground mb-6">
                All event category labels use consistent colors defined in <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">src/lib/categoryUtils.ts</code>. 
                Categories are determined by the event icon or name.
              </p>

              {/* Category Examples */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground">Available Categories</h4>
                <div className={`grid gap-3 ${isMobile ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-4"}`}>
                  {/* Social */}
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-2">
                    <Badge className={`${CATEGORY_STYLES.Social.class} border-0`}>Social</Badge>
                    <p className="text-[10px] text-muted-foreground">Twitter, influencers</p>
                    <code className="text-[9px] bg-muted px-1 py-0.5 rounded font-mono block">
                      bg-primary/20 text-primary
                    </code>
                  </div>

                  {/* Crypto */}
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-2">
                    <Badge className={`${CATEGORY_STYLES.Crypto.class} border-0`}>Crypto</Badge>
                    <p className="text-[10px] text-muted-foreground">Bitcoin, Ethereum</p>
                    <code className="text-[9px] bg-muted px-1 py-0.5 rounded font-mono block">
                      bg-trading-yellow/20 text-trading-yellow
                    </code>
                  </div>

                  {/* Finance */}
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-2">
                    <Badge className={`${CATEGORY_STYLES.Finance.class} border-0`}>Finance</Badge>
                    <p className="text-[10px] text-muted-foreground">Fed rates, stocks</p>
                    <code className="text-[9px] bg-muted px-1 py-0.5 rounded font-mono block">
                      bg-trading-green/20 text-trading-green
                    </code>
                  </div>

                  {/* Politics */}
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-2">
                    <Badge className={`${CATEGORY_STYLES.Politics.class} border-0`}>Politics</Badge>
                    <p className="text-[10px] text-muted-foreground">Elections, government</p>
                    <code className="text-[9px] bg-muted px-1 py-0.5 rounded font-mono block">
                      bg-trading-red/20 text-trading-red
                    </code>
                  </div>

                  {/* Tech */}
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-2">
                    <Badge className={`${CATEGORY_STYLES.Tech.class} border-0`}>Tech</Badge>
                    <p className="text-[10px] text-muted-foreground">SpaceX, AI, Apple</p>
                    <code className="text-[9px] bg-muted px-1 py-0.5 rounded font-mono block">
                      bg-cyan-500/20 text-cyan-400
                    </code>
                  </div>

                  {/* Entertainment */}
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-2">
                    <Badge className={`${CATEGORY_STYLES.Entertainment.class} border-0`}>Entertainment</Badge>
                    <p className="text-[10px] text-muted-foreground">Oscar, Grammy, movies</p>
                    <code className="text-[9px] bg-muted px-1 py-0.5 rounded font-mono block">
                      bg-orange-500/20 text-orange-400
                    </code>
                  </div>

                  {/* Sports */}
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-2">
                    <Badge className={`${CATEGORY_STYLES.Sports.class} border-0`}>Sports</Badge>
                    <p className="text-[10px] text-muted-foreground">NBA, NFL, Olympics</p>
                    <code className="text-[9px] bg-muted px-1 py-0.5 rounded font-mono block">
                      bg-blue-500/20 text-blue-400
                    </code>
                  </div>

                  {/* General */}
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-2">
                    <Badge className={`${CATEGORY_STYLES.General.class} border-0`}>General</Badge>
                    <p className="text-[10px] text-muted-foreground">Fallback category</p>
                    <code className="text-[9px] bg-muted px-1 py-0.5 rounded font-mono block">
                      bg-muted text-foreground
                    </code>
                  </div>
                </div>
              </div>

              {/* Adding New Categories Guide */}
              <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                <h4 className="text-sm font-medium text-primary mb-2">📌 添加新分类的规则</h4>
                <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>每个分类必须有<strong className="text-foreground">独特颜色</strong>，不能与现有分类重复</li>
                  <li>在 <code className="bg-muted px-1 rounded">CATEGORY_STYLES</code> 添加样式定义</li>
                  <li>在 <code className="bg-muted px-1 rounded">getCategoryFromName</code> 添加关键词匹配</li>
                  <li>更新 StyleGuide 文档</li>
                </ol>
              </div>

              {/* Usage Examples */}
              <div className="mt-8 space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground">Usage Examples</h4>
                <div className={`grid gap-2 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
                  <div className="p-2.5 bg-background rounded-lg border border-border flex items-center gap-2">
                    <Badge className={`${CATEGORY_STYLES.Social.class} border-0`}>Social</Badge>
                    <span className="text-xs text-muted-foreground truncate">Elon Musk # tweets</span>
                  </div>
                  <div className="p-2.5 bg-background rounded-lg border border-border flex items-center gap-2">
                    <Badge className={`${CATEGORY_STYLES.Crypto.class} border-0`}>Crypto</Badge>
                    <span className="text-xs text-muted-foreground truncate">Bitcoin price on Jan 31</span>
                  </div>
                  <div className="p-2.5 bg-background rounded-lg border border-border flex items-center gap-2">
                    <Badge className={`${CATEGORY_STYLES.Tech.class} border-0`}>Tech</Badge>
                    <span className="text-xs text-muted-foreground truncate">SpaceX Starship reach orbit</span>
                  </div>
                  <div className="p-2.5 bg-background rounded-lg border border-border flex items-center gap-2">
                    <Badge className={`${CATEGORY_STYLES.Entertainment.class} border-0`}>Entertainment</Badge>
                    <span className="text-xs text-muted-foreground truncate">Oscar Best Picture 2024</span>
                  </div>
                  <div className="p-2.5 bg-background rounded-lg border border-border flex items-center gap-2">
                    <Badge className={`${CATEGORY_STYLES.Politics.class} border-0`}>Politics</Badge>
                    <span className="text-xs text-muted-foreground truncate">Government shutdown end</span>
                  </div>
                  <div className="p-2.5 bg-background rounded-lg border border-border flex items-center gap-2">
                    <Badge className={`${CATEGORY_STYLES.Sports.class} border-0`}>Sports</Badge>
                    <span className="text-xs text-muted-foreground truncate">Super Bowl LVIII winner</span>
                  </div>
                </div>
              </div>

              {/* Code Example */}
              <div className="mt-8 space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">Code Usage</h4>
                <div className="p-4 bg-background rounded-lg border border-border overflow-x-auto">
                  <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap">
{`import { getCategoryFromName, CATEGORY_STYLES, CategoryType } from "@/lib/categoryUtils";

// Get category info from event name
const categoryInfo = getCategoryFromName(event.name);

// Use CATEGORY_STYLES with .class for Tailwind classes
<Badge className={\`\${CATEGORY_STYLES[categoryInfo.label as CategoryType]?.class} border-0\`}>
  {categoryInfo.label}
</Badge>

// Available: Social, Crypto, Finance, Politics, Tech, Entertainment, Sports, General`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </section>
        )}

        {/* Buttons Section */}
        {filterSection("buttons") && (
        <section id="buttons">
          <h2 className="text-xl font-semibold mb-6 text-foreground border-b border-border pb-2">Buttons</h2>
          <div className="space-y-8">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-4">Standard Variants</h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="default">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-4">Sizes</h3>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon"><Settings className="h-4 w-4" /></Button>
              </div>
            </div>

            {/* NEW: Trading Buttons with full documentation */}
            <div className="trading-card p-6 space-y-6">
              <div>
                <h3 className="text-base font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-trading-yellow" />
                  Trading Buttons (Standardized)
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Use these CSS classes for ALL trading-related buttons across the app. 
                  <span className="text-trading-yellow font-medium"> All trading buttons use WHITE text (primary-foreground).</span>
                </p>
              </div>

              {/* Buy Yes Button */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <button className="btn-trading-green">
                    <TrendingUp className="h-4 w-4 inline mr-2" />
                    Buy Yes
                  </button>
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono text-trading-green">
                    .btn-trading-green
                  </code>
                </div>
                <p className="text-xs text-muted-foreground pl-1">
                  For: Yes side (buy long), profit indicators, success confirmations
                </p>
                <CodePreview 
                  code={`<button className="btn-trading-green">Buy Yes</button>`}
                  id="btn-green-code"
                />
              </div>

              {/* Buy No Button */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <button className="btn-trading-red">
                    <TrendingDown className="h-4 w-4 inline mr-2" />
                    Buy No
                  </button>
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono text-trading-red">
                    .btn-trading-red
                  </code>
                </div>
                <p className="text-xs text-muted-foreground pl-1">
                  For: No side (sell short), loss indicators, destructive actions
                </p>
                <CodePreview 
                  code={`<button className="btn-trading-red">Buy No</button>`}
                  id="btn-red-code"
                />
              </div>

              {/* Primary Brand Button */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <button className="btn-primary">
                    Place Order
                  </button>
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono text-primary">
                    .btn-primary
                  </code>
                </div>
                <p className="text-xs text-muted-foreground pl-1">
                  For: Primary CTAs, Navigation, Brand emphasis (Purple)
                </p>
                <CodePreview 
                  code={`<button className="btn-primary">Place Order</button>`}
                  id="btn-primary-code"
                />
              </div>

              {/* Inactive Toggle State */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <button className="btn-trading-inactive">
                    Inactive Option
                  </button>
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono text-muted-foreground">
                    .btn-trading-inactive
                  </code>
                </div>
                <p className="text-xs text-muted-foreground pl-1">
                  For: Unselected toggle options in Yes/No switches
                </p>
              </div>

              {/* Usage Example: Toggle Group */}
              <div className="space-y-3 pt-4 border-t border-border/50">
                <h4 className="text-sm font-medium text-foreground">Usage Example: Yes/No Toggle</h4>
                <div className="flex rounded-xl overflow-hidden border border-border/50 bg-background/50 p-0.5 w-fit">
                  <button className="btn-trading-green px-5 py-2 text-sm rounded-lg">Yes</button>
                  <button className="btn-trading-inactive px-5 py-2 text-sm rounded-lg">No</button>
                </div>
                <CodePreview 
                  code={`<div className="flex rounded-xl border border-border/50 p-0.5">
  <button className={side === "long" ? "btn-trading-green" : "btn-trading-inactive"}>Yes</button>
  <button className={side === "short" ? "btn-trading-red" : "btn-trading-inactive"}>No</button>
</div>`}
                  id="toggle-example-code"
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-4">States</h3>
              <div className="flex flex-wrap gap-3">
                <Button disabled>Disabled</Button>
                <Button className="animate-pulse-soft">Loading...</Button>
              </div>
            </div>
          </div>
        </section>
        )}

        {/* Badges Section */}
        {filterSection("badges") && (
        <section id="badges">
          <h2 className="text-xl font-semibold mb-6 text-foreground border-b border-border pb-2">Badges</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-4">Standard Variants</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="default">Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="destructive">Destructive</Badge>
                <Badge variant="outline">Outline</Badge>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-4">Trading Status Badges</h3>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-trading-green/20 text-trading-green border-trading-green/30">Filled</Badge>
                <Badge className="bg-trading-yellow/20 text-trading-yellow border-trading-yellow/30">Pending</Badge>
                <Badge className="bg-trading-purple/20 text-trading-purple border-trading-purple/30">Partial</Badge>
                <Badge className="bg-trading-red/20 text-trading-red border-trading-red/30">Cancelled</Badge>
                <Badge className="bg-muted text-muted-foreground">Expired</Badge>
              </div>
            </div>
          </div>
        </section>
        )}

        {/* Cards Section */}
        {filterSection("cards") && (
        <section id="cards">
          <h2 className="text-xl font-semibold mb-6 text-foreground border-b border-border pb-2">Cards</h2>
          <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
            <Card>
              <CardHeader>
                <CardTitle>Standard Card</CardTitle>
                <CardDescription>Default shadcn/ui card style</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Card content goes here with default styling.</p>
              </CardContent>
            </Card>

            <Card className="trading-card">
              <CardHeader>
                <CardTitle>Trading Card</CardTitle>
                <CardDescription>Custom gradient background</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Uses .trading-card class for gradient effect.</p>
              </CardContent>
            </Card>
          </div>
        </section>
        )}

        {/* Form Elements */}
        {filterSection("form-elements") && (
        <section id="form-elements">
          <h2 className="text-xl font-semibold mb-6 text-foreground border-b border-border pb-2">Form Elements</h2>
          <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
            <Card className="trading-card">
              <CardHeader>
                <CardTitle className="text-lg">Inputs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Default Input</label>
                  <Input placeholder="Enter amount..." />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">With Value</label>
                  <Input defaultValue="1,000.00" className="font-mono" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Disabled</label>
                  <Input disabled placeholder="Disabled input" />
                </div>
              </CardContent>
            </Card>

            <Card className="trading-card">
              <CardHeader>
                <CardTitle className="text-lg">Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Switch Off</span>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Switch On</span>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
        )}

        {/* Option Chips */}
        {filterSection("option-chips") && (
        <section id="option-chips">
          <h2 className="text-xl font-semibold mb-6 text-foreground border-b border-border pb-2">Option Chips</h2>
          <Card className="trading-card p-4">
            <p className="text-sm text-muted-foreground mb-4">Interactive chips for option selection</p>
            <OptionChips
              options={mockOptions}
              selectedId={selectedOption}
              onSelect={setSelectedOption}
            />
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Selected: <span className="text-trading-purple font-mono">{selectedOption}</span>
              </p>
            </div>
          </Card>
        </section>
        )}

        {/* Tabs */}
        {filterSection("tabs") && (
        <section id="tabs">
          <h2 className="text-xl font-semibold mb-6 text-foreground border-b border-border pb-2">Tabs</h2>
          <Card className="trading-card">
            <Tabs defaultValue="positions" className="w-full">
              <TabsList className="w-full bg-muted/30">
                <TabsTrigger value="positions" className="flex-1">Positions</TabsTrigger>
                <TabsTrigger value="orders" className="flex-1">Orders</TabsTrigger>
                <TabsTrigger value="history" className="flex-1">History</TabsTrigger>
              </TabsList>
              <TabsContent value="positions" className="p-4">
                <p className="text-sm text-muted-foreground">Positions content area</p>
              </TabsContent>
              <TabsContent value="orders" className="p-4">
                <p className="text-sm text-muted-foreground">Orders content area</p>
              </TabsContent>
              <TabsContent value="history" className="p-4">
                <p className="text-sm text-muted-foreground">History content area</p>
              </TabsContent>
            </Tabs>
          </Card>
        </section>
        )}

        {/* Animations */}
        {filterSection("animations") && (
        <section id="animations">
          <h2 className="text-xl font-semibold mb-6 text-foreground border-b border-border pb-2">Animations</h2>
          <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-3"}`}>
            <Card className="trading-card p-4">
              <h3 className="text-sm font-medium mb-3">fade-in</h3>
              <div className="animate-fade-in bg-muted p-4 rounded-lg text-center">
                <p className="text-sm">Fades in with slight Y movement</p>
              </div>
              <p className="text-xs text-muted-foreground mt-2 font-mono">animate-fade-in</p>
            </Card>

            <Card className="trading-card p-4">
              <h3 className="text-sm font-medium mb-3">slide-up</h3>
              <div className="animate-slide-up bg-muted p-4 rounded-lg text-center">
                <p className="text-sm">Slides up into view</p>
              </div>
              <p className="text-xs text-muted-foreground mt-2 font-mono">animate-slide-up</p>
            </Card>

            <Card className="trading-card p-4">
              <h3 className="text-sm font-medium mb-3">pulse-soft</h3>
              <div className="animate-pulse-soft bg-trading-green p-4 rounded-lg text-center">
                <p className="text-sm text-primary-foreground">Soft pulsing effect</p>
              </div>
              <p className="text-xs text-muted-foreground mt-2 font-mono">animate-pulse-soft</p>
            </Card>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Flash Animations (Order Book)</h3>
            <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-3"}`}>
              <div className="flash-update-green p-3 rounded-lg border border-border">
                <p className="text-sm font-mono">flash-update-green</p>
              </div>
              <div className="flash-update-red p-3 rounded-lg border border-border">
                <p className="text-sm font-mono">flash-update-red</p>
              </div>
              <div className="flash-new-trade p-3 rounded-lg border border-border">
                <p className="text-sm font-mono">flash-new-trade</p>
              </div>
            </div>
          </div>
        </section>
        )}

        {/* Spacing & Radius */}
        {filterSection("spacing") && (
        <section id="spacing">
          <h2 className="text-xl font-semibold mb-6 text-foreground border-b border-border pb-2">Spacing & Border Radius</h2>
          <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
            <Card className="trading-card">
              <CardHeader>
                <CardTitle className="text-lg">Border Radius</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-trading-purple rounded-sm" />
                  <span className="text-sm font-mono">rounded-sm (8px)</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-trading-purple rounded-md" />
                  <span className="text-sm font-mono">rounded-md (10px)</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-trading-purple rounded-lg" />
                  <span className="text-sm font-mono">rounded-lg (12px)</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-trading-purple rounded-xl" />
                  <span className="text-sm font-mono">rounded-xl (16px)</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-trading-purple rounded-full" />
                  <span className="text-sm font-mono">rounded-full</span>
                </div>
              </CardContent>
            </Card>

            <Card className="trading-card">
              <CardHeader>
                <CardTitle className="text-lg">Common Spacing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground mb-4">Based on 4px grid system</p>
                {[1, 2, 3, 4, 6, 8].map((size) => (
                  <div key={size} className="flex items-center gap-4">
                    <div className={`bg-trading-purple h-4`} style={{ width: `${size * 4}px` }} />
                    <span className="text-sm font-mono">p-{size} ({size * 4}px)</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>
        )}

        {/* Icons */}
        {filterSection("icons") && (
        <section id="icons">
          <h2 className="text-xl font-semibold mb-6 text-foreground border-b border-border pb-2">Icons</h2>
          <Card className="trading-card p-4">
            <p className="text-sm text-muted-foreground mb-4">Using Lucide React icons</p>
            <div className="flex flex-wrap gap-4">
              {[
                { icon: TrendingUp, name: "TrendingUp", color: "text-trading-green" },
                { icon: TrendingDown, name: "TrendingDown", color: "text-trading-red" },
                { icon: AlertCircle, name: "AlertCircle", color: "text-trading-yellow" },
                { icon: Bell, name: "Bell", color: "text-trading-purple" },
                { icon: Settings, name: "Settings", color: "text-muted-foreground" },
                { icon: Zap, name: "Zap", color: "text-indicator" },
              ].map(({ icon: Icon, name, color }) => (
                <div key={name} className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/30">
                  <Icon className={`h-6 w-6 ${color}`} />
                  <span className="text-xs text-muted-foreground">{name}</span>
                </div>
              ))}
            </div>
          </Card>
        </section>
        )}

        {/* CSS Custom Classes */}
        {filterSection("css-classes") && (
        <section id="css-classes">
          <h2 className="text-xl font-semibold mb-6 text-foreground border-b border-border pb-2">Custom CSS Classes</h2>
          <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
            <Card className="trading-card p-4">
              <h3 className="text-sm font-medium mb-3">Price Classes</h3>
              <div className="space-y-2">
                <p className="price-green">price-green: $1,234.56</p>
                <p className="price-red">price-red: -$567.89</p>
              </div>
              <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                <code className="text-xs text-muted-foreground">
                  .price-green, .price-red
                </code>
              </div>
            </Card>

            <Card className="trading-card p-4">
              <h3 className="text-sm font-medium mb-3">Option Chip Classes</h3>
              <div className="space-y-2">
                <div className="option-chip option-chip-active inline-block">Active Chip</div>
                <div className="option-chip option-chip-inactive inline-block ml-2">Inactive Chip</div>
              </div>
              <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                <code className="text-xs text-muted-foreground">
                  .option-chip, .option-chip-active, .option-chip-inactive
                </code>
              </div>
            </Card>

            <Card className="trading-card p-4">
              <h3 className="text-sm font-medium mb-3">Tab Active Class</h3>
              <div className="flex gap-4 border-b border-border pb-2">
                <span className="tab-active pb-2">Active Tab</span>
                <span className="text-muted-foreground">Inactive Tab</span>
              </div>
              <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                <code className="text-xs text-muted-foreground">.tab-active</code>
              </div>
            </Card>

            <Card className="trading-card p-4">
              <h3 className="text-sm font-medium mb-3">Scrollbar Hide</h3>
              <div className="overflow-x-auto scrollbar-hide flex gap-2 pb-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="flex-shrink-0 w-20 h-12 bg-muted rounded-lg flex items-center justify-center text-sm">
                    Item {i}
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                <code className="text-xs text-muted-foreground">.scrollbar-hide</code>
              </div>
            </Card>
          </div>
        </section>
        )}

        {/* Mobile UI Patterns Section */}
        {filterSection("mobile-patterns") && (
        <section id="mobile-patterns">
          <h2 className="text-xl font-semibold mb-6 text-foreground border-b border-border pb-2">Mobile UI Patterns</h2>
          <p className="text-muted-foreground mb-6">
            Consistent patterns for mobile interfaces to ensure unified user experience.
          </p>
          
          <div className="grid gap-6">
            {/* Button Placement Rules */}
            <Card className="trading-card p-4 md:p-6">
              <h3 className="text-sm font-medium mb-4">Button Placement Rules</h3>
              <div className="space-y-4">
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-sm font-medium mb-2">1. Card Actions</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Primary action buttons in cards should be right-aligned.
                  </p>
                  <div className="border border-border rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">Card Title</p>
                        <p className="text-sm text-muted-foreground">Description text</p>
                      </div>
                      <Button size="sm" className="btn-primary">Edit</Button>
                    </div>
                  </div>
                </div>
                
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-sm font-medium mb-2">2. Drawer Actions</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Primary actions full-width, secondary actions can be side-by-side.
                  </p>
                  <div className="border border-border rounded-lg p-3 space-y-2">
                    <Button className="w-full btn-primary">Confirm</Button>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1">Cancel</Button>
                      <Button variant="destructive" className="flex-1">Delete</Button>
                    </div>
                  </div>
                </div>
                
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-sm font-medium mb-2">3. Item with Actions</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    When content is complex, put action button below content, right-aligned.
                  </p>
                  <div className="border border-border rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">🦊</div>
                      <div className="flex-1">
                        <p className="font-mono text-sm">0x1234...5678</p>
                        <p className="text-xs text-muted-foreground">Ethereum Mainnet</p>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <Button variant="outline" size="sm">Disconnect</Button>
                    </div>
                  </div>
                </div>
              </div>
              <CodePreview 
                code="// Card: justify-between | Drawer: w-full | Item: mt-3 flex justify-end" 
                id="mobile-button-placement" 
              />
            </Card>

            {/* MobileDrawer Usage */}
            <Card className="trading-card p-4 md:p-6">
              <h3 className="text-sm font-medium mb-4">MobileDrawer Component</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Use MobileDrawer for all bottom sheets on mobile. It includes drag handle, safe area padding, and consistent styling.
              </p>
              <div className="space-y-3">
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-sm font-medium mb-2">Basic Usage</p>
                  <code className="text-xs text-muted-foreground block">
                    {`<MobileDrawer open={open} onOpenChange={setOpen} title="Title">`}
                  </code>
                </div>
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-sm font-medium mb-2">With List Items</p>
                  <code className="text-xs text-muted-foreground block whitespace-pre-wrap">
{`<MobileDrawerList>
  <MobileDrawerListItem icon={User} label="Profile" onClick={...} />
  <MobileDrawerListItem icon={Settings} label="Settings" onClick={...} />
</MobileDrawerList>`}
                  </code>
                </div>
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-sm font-medium mb-2">With Actions</p>
                  <code className="text-xs text-muted-foreground block whitespace-pre-wrap">
{`<MobileDrawerActions>
  <Button className="w-full">Confirm</Button>
</MobileDrawerActions>`}
                  </code>
                </div>
              </div>
            </Card>

            {/* Spacing Guidelines */}
            <Card className="trading-card p-4 md:p-6">
              <h3 className="text-sm font-medium mb-4">Mobile Spacing</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm">Page padding</span>
                  <code className="text-xs bg-muted px-2 py-1 rounded">px-4</code>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm">Card padding</span>
                  <code className="text-xs bg-muted px-2 py-1 rounded">p-4</code>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm">Section gap</span>
                  <code className="text-xs bg-muted px-2 py-1 rounded">space-y-4</code>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm">Bottom nav safe area</span>
                  <code className="text-xs bg-muted px-2 py-1 rounded">pb-safe (5rem)</code>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm">Drawer safe area</span>
                  <code className="text-xs bg-muted px-2 py-1 rounded">pb-safe (auto)</code>
                </div>
              </div>
            </Card>
          </div>
        </section>
        )}

        {/* Toast & Notifications Section */}
        {filterSection("toast-notifications") && (
        <section id="toast-notifications">
          <h2 className="text-xl font-semibold mb-6 text-foreground border-b border-border pb-2">Toast & Notifications</h2>
          <p className="text-muted-foreground mb-6">
            使用 Sonner 库实现 Toast 通知。位置固定在屏幕顶部中央。
          </p>
          
          <div className="grid gap-6">
            {/* Toast Types */}
            <Card className="trading-card p-4 md:p-6">
              <h3 className="text-sm font-medium mb-4">Toast Types</h3>
              <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-3"
                    onClick={() => toast.success("Operation completed successfully")}
                  >
                    <span className="w-3 h-3 rounded-full bg-trading-green" />
                    Success Toast
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-3"
                    onClick={() => toast.error("Something went wrong")}
                  >
                    <span className="w-3 h-3 rounded-full bg-trading-red" />
                    Error Toast
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-3"
                    onClick={() => toast.warning("Please review your input")}
                  >
                    <span className="w-3 h-3 rounded-full bg-trading-yellow" />
                    Warning Toast
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-3"
                    onClick={() => toast.info("Here's some information")}
                  >
                    <span className="w-3 h-3 rounded-full bg-primary" />
                    Info Toast
                  </Button>
                </div>
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-sm font-medium mb-3">Usage</p>
                  <code className="text-xs text-muted-foreground block whitespace-pre-wrap">
{`import { toast } from "sonner";

// Success - 操作成功
toast.success("Saved successfully");

// Error - 操作失败
toast.error("Failed to save");

// Warning - 警告提示
toast.warning("Check your input");

// Info - 一般信息
toast.info("New update available");`}
                  </code>
                </div>
              </div>
            </Card>

            {/* Toast with Actions */}
            <Card className="trading-card p-4 md:p-6">
              <h3 className="text-sm font-medium mb-4">Toast with Actions</h3>
              <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => toast("Item deleted", {
                      action: {
                        label: "Undo",
                        onClick: () => toast.success("Restored!")
                      }
                    })}
                  >
                    Toast with Undo Action
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => toast.promise(
                      new Promise((resolve) => setTimeout(resolve, 2000)),
                      {
                        loading: "Loading...",
                        success: "Data loaded!",
                        error: "Failed to load"
                      }
                    )}
                  >
                    Promise Toast (Loading State)
                  </Button>
                </div>
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-sm font-medium mb-3">With Action</p>
                  <code className="text-xs text-muted-foreground block whitespace-pre-wrap">
{`// With action button
toast("Item deleted", {
  action: {
    label: "Undo",
    onClick: () => restore()
  }
});

// Promise pattern
toast.promise(asyncFn(), {
  loading: "Loading...",
  success: "Done!",
  error: "Failed"
});`}
                  </code>
                </div>
              </div>
            </Card>

            {/* When to Use */}
            <Card className="trading-card p-4 md:p-6">
              <h3 className="text-sm font-medium mb-4">Usage Guidelines</h3>
              <div className="space-y-4">
                <div className="bg-trading-green/10 border border-trading-green/30 rounded-xl p-4">
                  <p className="text-sm font-medium text-trading-green mb-2">✓ 使用 Toast 的场景</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>操作成功反馈（保存、删除、更新）</li>
                    <li>非阻塞性错误提示</li>
                    <li>短暂的状态通知</li>
                    <li>可撤销操作的确认</li>
                  </ul>
                </div>
                <div className="bg-trading-red/10 border border-trading-red/30 rounded-xl p-4">
                  <p className="text-sm font-medium text-trading-red mb-2">✗ 不使用 Toast 的场景</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>需要用户确认的重要操作（用 Dialog）</li>
                    <li>表单验证错误（用 inline error）</li>
                    <li>需要持久显示的信息（用 Alert）</li>
                    <li>复杂的多步骤反馈</li>
                  </ul>
                </div>
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-sm font-medium mb-2">Message 规范</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 简短明确，不超过一行</li>
                    <li>• 使用动词开头描述结果</li>
                    <li>• Success: "Saved", "Updated", "Deleted"</li>
                    <li>• Error: "Failed to save", "Unable to connect"</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </section>
        )}

        {/* Mobile Header Section */}
        {filterSection("mobile-header") && (
        <section id="mobile-header" className="scroll-mt-20">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-1 bg-trading-purple rounded-full" />
            <h2 className={`font-semibold ${isMobile ? "text-lg" : "text-xl"}`}>Mobile Header 设计规范</h2>
          </div>
          <div className="grid gap-4">
            {/* Overview */}
            <Card className="p-6">
              <h3 className="text-base font-medium mb-4">概述</h3>
              <p className="text-sm text-muted-foreground mb-4">
                MobileHeader 是统一的移动端头部组件，用于<strong>功能型页面</strong>。它提供一致的导航体验，包括返回按钮、Logo、标题、和操作按钮。
              </p>
              <div className="bg-muted/30 rounded-xl p-4">
                <code className="text-xs font-mono text-muted-foreground">
                  import {"{ MobileHeader }"} from "@/components/MobileHeader";
                </code>
              </div>
            </Card>

            {/* Page Type Classification */}
            <Card className="p-6 border-trading-yellow/30 bg-trading-yellow/5">
              <h3 className="text-base font-medium mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-trading-yellow" />
                页面类型分类 (重要)
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-trading-green/10 border border-trading-green/30 rounded-xl p-4">
                  <p className="text-sm font-medium text-trading-green mb-2">✓ 使用 MobileHeader 的页面</p>
                  <p className="text-xs text-muted-foreground mb-2">功能型页面 - 标准化导航体验</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Events 列表页 (/events)</li>
                    <li>Resolved 列表页 (/resolved)</li>
                    <li>Trade 页面 (/trade, /trade/order)</li>
                    <li>Portfolio 页面 (/portfolio)</li>
                    <li>Settings 页面 (/settings)</li>
                    <li>Wallet 页面 (/wallet)</li>
                    <li>Event Detail 页面</li>
                  </ul>
                </div>
                <div className="bg-trading-red/10 border border-trading-red/30 rounded-xl p-4">
                  <p className="text-sm font-medium text-trading-red mb-2">✗ 不使用 MobileHeader 的页面</p>
                  <p className="text-xs text-muted-foreground mb-2">运营/营销型页面 - 自定义视觉设计</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Leaderboard 页面 (/leaderboard)</li>
                    <li>Landing/营销页面</li>
                    <li>活动推广页面</li>
                    <li>任何需要自定义Hero设计的页面</li>
                  </ul>
                  <p className="text-xs text-trading-yellow mt-3 p-2 bg-trading-yellow/10 rounded">
                    ⚠️ 这些页面有独特的视觉设计，应自己实现header
                  </p>
                </div>
              </div>
            </Card>

            {/* Logo Rules */}
            <Card className="p-6">
              <h3 className="text-base font-medium mb-4">Logo 显示规则</h3>
              <p className="text-sm text-muted-foreground mb-4">
                <strong>原则：仅底部导航主入口页显示Logo</strong>，二级页面不显示Logo以保持标题居中。
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-trading-green/10 border border-trading-green/30 rounded-xl p-4">
                  <p className="text-sm font-medium text-trading-green mb-2">✓ 显示 Logo (主入口页)</p>
                  <p className="text-xs text-muted-foreground mb-2">底部导航直接进入，无返回按钮</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Home 首页 (/) - rightContent: 图标按钮</li>
                    <li>Events 列表页 (/events) - rightContent: 状态下拉</li>
                    <li>Resolved 列表页 (/resolved) - rightContent: 状态下拉</li>
                    <li>Portfolio 页面 (/portfolio) - rightContent: Tab下拉</li>
                  </ul>
                </div>
                <div className="bg-trading-red/10 border border-trading-red/30 rounded-xl p-4">
                  <p className="text-sm font-medium text-trading-red mb-2">✗ 不显示 Logo (二级页面)</p>
                  <p className="text-xs text-muted-foreground mb-2">有返回按钮，标题居中</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Trade 页面 (/trade, /trade/order)</li>
                    <li>Order Preview 页面 (/order-preview)</li>
                    <li>Wallet 页面 (/wallet)</li>
                    <li>Settings 页面 (/settings)</li>
                    <li>Event Detail 页面</li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Right Content Rules */}
            <Card className="p-6">
              <h3 className="text-base font-medium mb-4">rightContent 规则 (主入口页专用)</h3>
              <p className="text-sm text-muted-foreground mb-4">
                主入口页使用 <code className="bg-muted px-1 py-0.5 rounded text-xs">rightContent</code> 放置右侧功能元素，不同页面有不同用途：
              </p>
              <div className="space-y-3">
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-sm font-medium mb-2">图标按钮组</p>
                  <p className="text-xs text-muted-foreground mb-2">适用：Home 首页</p>
                  <code className="text-xs font-mono text-muted-foreground block">
                    rightContent={"{<div className=\"flex items-center gap-1\">"}
                    <br />{"  <Button variant=\"ghost\" size=\"icon\">...</Button>"}
                    <br />{"</div>}"}
                  </code>
                </div>
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-sm font-medium mb-2">状态/Tab 下拉选择器</p>
                  <p className="text-xs text-muted-foreground mb-2">适用：Events, Resolved, Portfolio</p>
                  <code className="text-xs font-mono text-muted-foreground block">
                    rightContent={"{<MobileStatusDropdown ... />}"}
                    <br />或
                    <br />rightContent={"{<PortfolioTabDropdown ... />}"}
                  </code>
                </div>
              </div>
            </Card>

            {/* Back Button Rules */}
            <Card className="p-6">
              <h3 className="text-base font-medium mb-4">返回按钮规则</h3>
              <div className="space-y-3">
                <div className="bg-trading-red/10 border border-trading-red/30 rounded-xl p-4">
                  <p className="text-sm font-medium text-trading-red mb-2">⚠️ BottomNav 入口页永远不显示返回键</p>
                  <p className="text-xs text-muted-foreground mb-2">无论通过何种方式导航到这些页面，都不应显示返回按钮</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Home 首页 (/)</li>
                    <li>Events 列表页 (/events)</li>
                    <li>Leaderboard 排行榜 (/leaderboard)</li>
                    <li>Trade 交易页 (/trade)</li>
                    <li>Portfolio 我的页 (/portfolio)</li>
                  </ul>
                  <p className="text-xs text-primary mt-2 font-mono">
                    代码实现: MobileHeader 自动检测 BOTTOM_NAV_ROUTES
                  </p>
                </div>
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-sm font-medium mb-2">二级页面 - 自动检测 (默认行为)</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• navigationType === "PUSH" → 显示返回按钮</li>
                    <li>• navigationType === "POP" / "REPLACE" → 隐藏返回按钮</li>
                  </ul>
                </div>
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-sm font-medium mb-2">强制覆盖 (特殊场景)</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• showBack={"{true}"} → 强制显示</li>
                    <li>• showBack={"{false}"} → 强制隐藏</li>
                    <li>• backTo="/path" → 自定义返回路径</li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Title Rules */}
            <Card className="p-6">
              <h3 className="text-base font-medium mb-4">标题布局规则</h3>
              <div className="space-y-3">
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-sm font-medium mb-2">基本规则</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 标题居中显示</li>
                    <li>• 最多显示 2 行 (line-clamp-2)</li>
                    <li>• 超长标题末尾显示省略号</li>
                  </ul>
                </div>
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-sm font-medium mb-2">可点击标题</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 传入 onTitleClick 时显示下拉箭头</li>
                    <li>• 用于 Trade 页面的 Event 选择器</li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Stats Row */}
            <Card className="p-6">
              <h3 className="text-base font-medium mb-4">统计信息行 (Trade 页面专用)</h3>
              <p className="text-sm text-muted-foreground mb-4">
                当存在统计数据时，会在标题下方显示独立的统计信息行：
              </p>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="bg-trading-red/10 border border-trading-red/30 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 bg-trading-red rounded-full" />
                    <span className="text-sm font-medium">Ends in</span>
                  </div>
                  <p className="text-xs text-muted-foreground">倒计时 (endTime prop)</p>
                </div>
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 bg-orange-500 rounded-full" />
                    <span className="text-sm font-medium">Tweets</span>
                  </div>
                  <p className="text-xs text-muted-foreground">推文计数 (tweetCount prop)</p>
                </div>
                <div className="bg-trading-green/10 border border-trading-green/30 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 bg-trading-green rounded-full" />
                    <span className="text-sm font-medium">Price</span>
                  </div>
                  <p className="text-xs text-muted-foreground">实时价格 (currentPrice prop)</p>
                </div>
              </div>
              <div className="mt-4 bg-primary/10 border border-primary/30 rounded-xl p-4">
                <p className="text-sm font-medium text-primary mb-2">📌 核心规则：头部只显示一个最重要的值</p>
                <p className="text-xs text-muted-foreground mb-2">
                  每种实时数据在头部统计栏只展示一个核心值，其他详细数据放在 Popup 中：
                </p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li><strong>Price 价格</strong>：只显示当前价格，24h 变化百分比放在 Popup</li>
                  <li><strong>Tweets 推文</strong>：只显示当前计数，统计周期等放在 Popup</li>
                  <li><strong>比分/其他</strong>：只显示最关键数值，详情放在 Popup</li>
                </ul>
                <p className="text-xs text-primary/80 mt-2 italic">
                  目的：保持头部简洁，避免信息过载，用户点击可查看详情
                </p>
              </div>
            </Card>

            {/* Action Buttons */}
            <Card className="p-6">
              <h3 className="text-base font-medium mb-4">右侧操作按钮</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-sm font-medium mb-2">showActions={"{true}"}</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 显示收藏按钮 (Star)</li>
                    <li>• 显示分享按钮 (Share2)</li>
                    <li>• 需配合 isFavorite, onFavoriteToggle</li>
                  </ul>
                </div>
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-sm font-medium mb-2">rightContent</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 自定义右侧内容</li>
                    <li>• 会覆盖 showActions</li>
                    <li>• 用于状态下拉菜单等</li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Desktop Navigation Rules */}
            <Card className="p-6 border-2 border-primary/30 bg-primary/5">
              <h3 className="text-base font-medium mb-4 flex items-center gap-2">
                <Monitor className="w-4 h-4 text-primary" />
                桌面端导航规范
              </h3>
              <div className="space-y-4">
                <div className="bg-trading-red/10 border border-trading-red/30 rounded-xl p-4">
                  <p className="text-sm font-medium text-trading-red mb-2">🚫 禁止：桌面端不显示返回按钮</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 桌面端用户使用<strong>浏览器自带的返回功能</strong></li>
                    <li>• 不要在详情页左上角添加 "← Back to..." 按钮</li>
                    <li>• 这是 Web 应用的标准用户体验</li>
                  </ul>
                </div>
                <div className="bg-trading-green/10 border border-trading-green/30 rounded-xl p-4">
                  <p className="text-sm font-medium text-trading-green mb-2">✅ 正确做法</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 仅移动端显示返回按钮（使用 MobileHeader）</li>
                    <li>• 桌面端保持页面顶部简洁</li>
                    <li>• 功能按钮（如分享）右对齐显示</li>
                  </ul>
                </div>
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-sm font-medium mb-2">代码示例</p>
                  <pre className="text-xs font-mono text-muted-foreground overflow-x-auto">
{`// ❌ 错误 - 桌面端不应该有返回按钮
{!isMobile && (
  <Button onClick={handleBack}>
    <ArrowLeft /> Back to Portfolio
  </Button>
)}

// ✅ 正确 - 仅移动端显示返回
{isMobile ? (
  <MobileHeader showBack backTo="/portfolio" title="Details" />
) : (
  <DesktopHeader />
)}

// ✅ 正确 - 桌面端只保留操作按钮
{!isMobile && (
  <div className="flex justify-end">
    <Button onClick={() => setShowShareModal(true)}>
      <Share2 /> Share
    </Button>
  </div>
)}`}
                  </pre>
                </div>
              </div>
            </Card>

            {/* Usage Examples */}
            <Card className="p-6">
              <h3 className="text-base font-medium mb-4">使用示例</h3>
              <div className="space-y-4">
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-sm font-medium mb-2">基础用法 (Events 页面)</p>
                  <pre className="text-xs font-mono text-muted-foreground overflow-x-auto">
{`<MobileHeader 
  showLogo 
  rightContent={<MobileStatusDropdown />} 
/>`}
                  </pre>
                </div>
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-sm font-medium mb-2">Trade 页面</p>
                  <pre className="text-xs font-mono text-muted-foreground overflow-x-auto">
{`<MobileHeader 
  title={selectedEvent.name}
  endTime={selectedEvent.endTime}
  showActions
  showBack={true}
  backTo={backTo}
  showLogo={false}
  tweetCount={selectedEvent.tweetCount}
  currentPrice={selectedEvent.currentPrice}
  priceChange24h={selectedEvent.priceChange24h}
  onTitleClick={() => setEventSheetOpen(true)}
  isFavorite={favorites.has(selectedEvent.id)}
  onFavoriteToggle={() => toggleFavorite(selectedEvent.id)}
/>`}
                  </pre>
                </div>
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-sm font-medium mb-2">详情页面 (基础)</p>
                  <pre className="text-xs font-mono text-muted-foreground overflow-x-auto">
{`<MobileHeader 
  title="Settlement Detail"
  showBack
  backTo="/portfolio/settlements"
  showLogo={false}
/>`}
                  </pre>
                </div>
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-sm font-medium mb-2">详情页面 (带右侧操作按钮)</p>
                  <p className="text-xs text-muted-foreground mb-2">注意：rightContent 按钮使用 h-9 w-9 尺寸，图标用 text-muted-foreground</p>
                  <pre className="text-xs font-mono text-muted-foreground overflow-x-auto">
{`<MobileHeader 
  title="Settlement Detail"
  showBack
  backTo="/portfolio/settlements"
  showLogo={false}
  rightContent={
    <button
      onClick={() => setShowShareModal(true)}
      className="h-9 w-9 flex items-center justify-center transition-all duration-200 active:scale-95"
    >
      <Share2 className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
    </button>
  }
/>`}
                  </pre>
                </div>
              </div>
            </Card>

            {/* Props Reference */}
            <Card className="p-6">
              <h3 className="text-base font-medium mb-4">Props 参考</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2 font-medium">Prop</th>
                      <th className="text-left py-2 px-2 font-medium">Type</th>
                      <th className="text-left py-2 px-2 font-medium">Default</th>
                      <th className="text-left py-2 px-2 font-medium">说明</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b border-border/50">
                      <td className="py-2 px-2 font-mono text-xs">title</td>
                      <td className="py-2 px-2">string</td>
                      <td className="py-2 px-2">-</td>
                      <td className="py-2 px-2">标题文本</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 px-2 font-mono text-xs">showLogo</td>
                      <td className="py-2 px-2">boolean</td>
                      <td className="py-2 px-2">true</td>
                      <td className="py-2 px-2">是否显示 Logo</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 px-2 font-mono text-xs">showBack</td>
                      <td className="py-2 px-2">boolean</td>
                      <td className="py-2 px-2">auto</td>
                      <td className="py-2 px-2">强制显示/隐藏返回按钮</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 px-2 font-mono text-xs">backTo</td>
                      <td className="py-2 px-2">string</td>
                      <td className="py-2 px-2">-</td>
                      <td className="py-2 px-2">自定义返回路径</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 px-2 font-mono text-xs">showActions</td>
                      <td className="py-2 px-2">boolean</td>
                      <td className="py-2 px-2">false</td>
                      <td className="py-2 px-2">显示收藏/分享按钮</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 px-2 font-mono text-xs">rightContent</td>
                      <td className="py-2 px-2">ReactNode</td>
                      <td className="py-2 px-2">-</td>
                      <td className="py-2 px-2">自定义右侧内容</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 px-2 font-mono text-xs">endTime</td>
                      <td className="py-2 px-2">Date</td>
                      <td className="py-2 px-2">-</td>
                      <td className="py-2 px-2">倒计时结束时间</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 px-2 font-mono text-xs">tweetCount</td>
                      <td className="py-2 px-2">number</td>
                      <td className="py-2 px-2">-</td>
                      <td className="py-2 px-2">推文计数</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 px-2 font-mono text-xs">currentPrice</td>
                      <td className="py-2 px-2">string</td>
                      <td className="py-2 px-2">-</td>
                      <td className="py-2 px-2">当前价格</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 px-2 font-mono text-xs">onTitleClick</td>
                      <td className="py-2 px-2">function</td>
                      <td className="py-2 px-2">-</td>
                      <td className="py-2 px-2">标题点击回调</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 px-2 font-mono text-xs">isFavorite</td>
                      <td className="py-2 px-2">boolean</td>
                      <td className="py-2 px-2">false</td>
                      <td className="py-2 px-2">是否已收藏</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-2 font-mono text-xs">onFavoriteToggle</td>
                      <td className="py-2 px-2">function</td>
                      <td className="py-2 px-2">-</td>
                      <td className="py-2 px-2">收藏切换回调</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </section>
        )}

        {/* Account Risk Indicator Section */}
        {filterSection("account-risk-indicator") && (
        <section id="account-risk-indicator" className="space-y-6">
          <div className="border-b border-border pb-4">
            <h2 className="text-xl font-semibold">Account Risk Indicator</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Cross Margin account-level risk monitoring component with 4-tier risk model
            </p>
          </div>
          
          <div className="grid gap-6">
            {/* Risk Model Overview */}
            <Card className="p-6">
              <h3 className="text-base font-medium mb-4">Risk Model Overview</h3>
              <div className="space-y-4">
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-sm font-medium mb-3">Core Metrics</p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p><strong className="text-foreground">Equity</strong> = Total Assets + Unrealized PnL (your real wealth)</p>
                    <p><strong className="text-foreground">Initial Margin (IM)</strong> = Entry threshold - determines if you can open positions</p>
                    <p><strong className="text-foreground">Maintenance Margin (MM)</strong> = Survival line - determines if you'll be liquidated (50% of IM)</p>
                    <p><strong className="text-foreground">Risk Ratio</strong> = IM / Equity × 100% (the key risk indicator)</p>
                  </div>
                </div>
                
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-sm font-medium mb-3">Key Principle</p>
                  <p className="text-sm text-muted-foreground italic">
                    "In Cross Margin mode, IM and MM are account-level risk constraints that define the capital boundaries for entry and survival. Position-level leverage and margin are for display only and do not participate in liquidation or risk control decisions."
                  </p>
                </div>
              </div>
            </Card>

            {/* 4-Tier Risk Levels */}
            <Card className="p-6">
              <h3 className="text-base font-medium mb-4">4-Tier Risk Levels</h3>
              <div className="space-y-3">
                {/* SAFE */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-trading-green/10 border border-trading-green/30">
                  <div className="flex items-center gap-2 min-w-[140px]">
                    <ShieldCheck className="w-4 h-4 text-trading-green" />
                    <span className="text-sm font-medium text-trading-green">SAFE</span>
                    <span className="text-xs text-trading-green/70">&lt;80%</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>Normal trading available ✅</p>
                    <p className="text-xs mt-1">All operations permitted - open, close, modify positions</p>
                  </div>
                </div>

                {/* WARNING */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-trading-yellow/10 border border-trading-yellow/30">
                  <div className="flex items-center gap-2 min-w-[140px]">
                    <AlertTriangle className="w-4 h-4 text-trading-yellow" />
                    <span className="text-sm font-medium text-trading-yellow">WARNING</span>
                    <span className="text-xs text-trading-yellow/70">80-95%</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>Opening restricted, consider reducing ⚠️</p>
                    <p className="text-xs mt-1">User should reduce position size or add funds</p>
                  </div>
                </div>

                {/* RESTRICTION */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
                  <div className="flex items-center gap-2 min-w-[140px]">
                    <Ban className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-medium text-orange-500">RESTRICTION</span>
                    <span className="text-xs text-orange-500/70">95-100%</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>Close-only mode, no new positions 🚨</p>
                    <p className="text-xs mt-1">Only closing positions is allowed - urgent action required</p>
                  </div>
                </div>

                {/* LIQUIDATION */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-trading-red/10 border border-trading-red/30">
                  <div className="flex items-center gap-2 min-w-[140px]">
                    <Zap className="w-4 h-4 text-trading-red" />
                    <span className="text-sm font-medium text-trading-red">LIQUIDATION</span>
                    <span className="text-xs text-trading-red/70">≥100%</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>Liquidation triggered! 💥</p>
                    <p className="text-xs mt-1">System force-closes positions when Equity ≤ IM</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Example Scenario */}
            <Card className="p-6">
              <h3 className="text-base font-medium mb-4">Example Scenario</h3>
              <div className="bg-muted/30 rounded-xl p-4">
                <p className="text-sm font-medium mb-3">Account Setup</p>
                <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-muted-foreground">Total Assets</p>
                    <p className="font-mono">100 USDT</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Exposure</p>
                    <p className="font-mono">500 USDT (5x)</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">IM / MM</p>
                    <p className="font-mono">50 / 25 USDT</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-trading-green"></span>
                    <span className="text-muted-foreground">Equity = 100 → Risk Ratio = 50% → SAFE</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-trading-yellow"></span>
                    <span className="text-muted-foreground">Equity = 60 (loss -40) → Risk Ratio = 83.3% → WARNING</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                    <span className="text-muted-foreground">Equity = 52 → Risk Ratio = 96.2% → RESTRICTION</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-trading-red"></span>
                    <span className="text-muted-foreground">Equity = 48 → Risk Ratio = 104.2% → LIQUIDATION</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Component Usage */}
            <Card className="p-6">
              <h3 className="text-base font-medium mb-4">Component Usage</h3>
              <div className="space-y-4">
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-sm font-medium mb-2">Basic Usage</p>
                  <pre className="text-xs font-mono text-muted-foreground overflow-x-auto">
{`import { AccountRiskIndicator } from "@/components/AccountRiskIndicator";

// Compact variant (for sidebars)
<AccountRiskIndicator variant="compact" />

// Full variant (for dedicated panels)
<AccountRiskIndicator variant="full" />`}
                  </pre>
                </div>

                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-sm font-medium mb-2">Integration in Desktop Trading</p>
                  <pre className="text-xs font-mono text-muted-foreground overflow-x-auto">
{`{/* Account Risk Indicator - separate panel below Trade */}
{user && (
  <div className="bg-background rounded-lg border border-border/50">
    <AccountRiskIndicator variant="compact" />
  </div>
)}`}
                  </pre>
                </div>
              </div>
            </Card>

            {/* Design Tokens */}
            <Card className="p-6">
              <h3 className="text-base font-medium mb-4">Risk Level Design Tokens</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2 font-medium">Level</th>
                      <th className="text-left py-2 px-2 font-medium">Text Color</th>
                      <th className="text-left py-2 px-2 font-medium">Background</th>
                      <th className="text-left py-2 px-2 font-medium">Icon</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b border-border/50">
                      <td className="py-2 px-2 text-trading-green font-medium">SAFE</td>
                      <td className="py-2 px-2 font-mono text-xs">text-trading-green</td>
                      <td className="py-2 px-2 font-mono text-xs">bg-trading-green</td>
                      <td className="py-2 px-2">ShieldCheck</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 px-2 text-trading-yellow font-medium">WARNING</td>
                      <td className="py-2 px-2 font-mono text-xs">text-trading-yellow</td>
                      <td className="py-2 px-2 font-mono text-xs">bg-trading-yellow</td>
                      <td className="py-2 px-2">AlertTriangle</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 px-2 text-orange-500 font-medium">RESTRICTION</td>
                      <td className="py-2 px-2 font-mono text-xs">text-orange-500</td>
                      <td className="py-2 px-2 font-mono text-xs">bg-orange-500</td>
                      <td className="py-2 px-2">Ban</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-2 text-trading-red font-medium">LIQUIDATION</td>
                      <td className="py-2 px-2 font-mono text-xs">text-trading-red</td>
                      <td className="py-2 px-2 font-mono text-xs">bg-trading-red</td>
                      <td className="py-2 px-2">Zap</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Props Reference */}
            <Card className="p-6">
              <h3 className="text-base font-medium mb-4">Props Reference</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2 font-medium">Prop</th>
                      <th className="text-left py-2 px-2 font-medium">Type</th>
                      <th className="text-left py-2 px-2 font-medium">Default</th>
                      <th className="text-left py-2 px-2 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr>
                      <td className="py-2 px-2 font-mono text-xs">variant</td>
                      <td className="py-2 px-2">"compact" | "full"</td>
                      <td className="py-2 px-2">"compact"</td>
                      <td className="py-2 px-2">Display mode - compact for sidebars, full for dedicated panels</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </section>
        )}

        {/* Transaction Status Badges Section */}
        {filterSection("transaction-status") && (
        <section id="transaction-status" className="space-y-6">
          <div className="border-b border-border pb-4">
            <h2 className="text-xl font-semibold">Transaction Status Badges</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Consistent status indicators for deposits, withdrawals, and transactions
            </p>
          </div>
          
          <div className="grid gap-6">
            {/* Status Overview */}
            <Card className="p-6">
              <h3 className="text-base font-medium mb-4">Transaction Status Types</h3>
              <div className="space-y-3">
                {/* Pending */}
                <div className="flex items-center gap-4 p-3 rounded-lg bg-trading-yellow/10 border border-trading-yellow/30">
                  <Badge variant="outline" className="flex items-center gap-1 bg-trading-yellow/20 text-trading-yellow border-trading-yellow/30">
                    <Clock className="w-3 h-3" />
                    Pending
                  </Badge>
                  <span className="text-sm text-muted-foreground">Transaction detected, awaiting confirmations</span>
                </div>

                {/* Processing */}
                <div className="flex items-center gap-4 p-3 rounded-lg bg-primary/10 border border-primary/30">
                  <Badge variant="outline" className="flex items-center gap-1 bg-primary/20 text-primary border-primary/30">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Processing
                  </Badge>
                  <span className="text-sm text-muted-foreground">Transaction being processed by system</span>
                </div>

                {/* Completed */}
                <div className="flex items-center gap-4 p-3 rounded-lg bg-trading-green/10 border border-trading-green/30">
                  <Badge variant="outline" className="flex items-center gap-1 bg-trading-green/20 text-trading-green border-trading-green/30">
                    <Check className="w-3 h-3" />
                    Completed
                  </Badge>
                  <span className="text-sm text-muted-foreground">Transaction successfully completed</span>
                </div>

                {/* Failed */}
                <div className="flex items-center gap-4 p-3 rounded-lg bg-trading-red/10 border border-trading-red/30">
                  <Badge variant="outline" className="flex items-center gap-1 bg-trading-red/20 text-trading-red border-trading-red/30">
                    <X className="w-3 h-3" />
                    Failed
                  </Badge>
                  <span className="text-sm text-muted-foreground">Transaction failed or rejected</span>
                </div>
              </div>
            </Card>

            {/* Deposit-Specific Statuses */}
            <Card className="p-6">
              <h3 className="text-base font-medium mb-4">Deposit Status Lifecycle</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 border border-border">
                  <Badge variant="outline" className="flex items-center gap-1 bg-muted text-muted-foreground border-border">
                    <Clock className="w-3 h-3" />
                    Waiting
                  </Badge>
                  <span className="text-sm text-muted-foreground">PENDING_TX - Waiting for transaction on chain</span>
                </div>
                
                <div className="flex items-center gap-4 p-3 rounded-lg bg-primary/10 border border-primary/30">
                  <Badge variant="outline" className="flex items-center gap-1 bg-primary/20 text-primary border-primary/30">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    3/15
                  </Badge>
                  <span className="text-sm text-muted-foreground">CONFIRMING - Block confirmations in progress</span>
                </div>

                <div className="flex items-center gap-4 p-3 rounded-lg bg-trading-yellow/10 border border-trading-yellow/30">
                  <Badge variant="outline" className="flex items-center gap-1 bg-trading-yellow/20 text-trading-yellow border-trading-yellow/30">
                    <AlertTriangle className="w-3 h-3" />
                    Claim Required
                  </Badge>
                  <span className="text-sm text-muted-foreground">PENDING_CLAIM - Small deposit needs manual claim</span>
                </div>

                <div className="flex items-center gap-4 p-3 rounded-lg bg-trading-green/10 border border-trading-green/30">
                  <Badge variant="outline" className="flex items-center gap-1 bg-trading-green/20 text-trading-green border-trading-green/30">
                    <Check className="w-3 h-3" />
                    Credited
                  </Badge>
                  <span className="text-sm text-muted-foreground">CREDITED - Funds added to account balance</span>
                </div>
              </div>
            </Card>

            {/* Design Tokens Table */}
            <Card className="p-6">
              <h3 className="text-base font-medium mb-4">Status Design Tokens</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2 font-medium">Status</th>
                      <th className="text-left py-2 px-2 font-medium">Text Color</th>
                      <th className="text-left py-2 px-2 font-medium">Background</th>
                      <th className="text-left py-2 px-2 font-medium">Border</th>
                      <th className="text-left py-2 px-2 font-medium">Icon</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b border-border/50">
                      <td className="py-2 px-2 text-trading-yellow font-medium">Pending</td>
                      <td className="py-2 px-2 font-mono text-xs">text-trading-yellow</td>
                      <td className="py-2 px-2 font-mono text-xs">bg-trading-yellow/20</td>
                      <td className="py-2 px-2 font-mono text-xs">border-trading-yellow/30</td>
                      <td className="py-2 px-2">Clock</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 px-2 text-primary font-medium">Processing</td>
                      <td className="py-2 px-2 font-mono text-xs">text-primary</td>
                      <td className="py-2 px-2 font-mono text-xs">bg-primary/20</td>
                      <td className="py-2 px-2 font-mono text-xs">border-primary/30</td>
                      <td className="py-2 px-2">Loader2 (animate-spin)</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 px-2 text-trading-green font-medium">Completed</td>
                      <td className="py-2 px-2 font-mono text-xs">text-trading-green</td>
                      <td className="py-2 px-2 font-mono text-xs">bg-trading-green/20</td>
                      <td className="py-2 px-2 font-mono text-xs">border-trading-green/30</td>
                      <td className="py-2 px-2">Check / CheckCircle2</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-2 text-trading-red font-medium">Failed</td>
                      <td className="py-2 px-2 font-mono text-xs">text-trading-red</td>
                      <td className="py-2 px-2 font-mono text-xs">bg-trading-red/20</td>
                      <td className="py-2 px-2 font-mono text-xs">border-trading-red/30</td>
                      <td className="py-2 px-2">X / XCircle</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Code Example */}
            <Card className="p-6">
              <h3 className="text-base font-medium mb-4">Implementation Example</h3>
              <div className="bg-muted/30 rounded-xl p-4">
                <pre className="text-xs font-mono text-muted-foreground overflow-x-auto">
{`const STATUS_CONFIG = {
  pending: { 
    icon: Clock, 
    color: 'text-trading-yellow', 
    label: 'Pending' 
  },
  processing: { 
    icon: Loader2, 
    color: 'text-primary', 
    label: 'Processing' 
  },
  completed: { 
    icon: CheckCircle2, 
    color: 'text-trading-green', 
    label: 'Completed' 
  },
  failed: { 
    icon: XCircle, 
    color: 'text-trading-red', 
    label: 'Failed' 
  },
};

// Usage
<Badge 
  variant="outline" 
  className={\`flex items-center gap-1 
    bg-\${statusColor}/20 
    text-\${statusColor} 
    border-\${statusColor}/30\`}
>
  <StatusIcon className={cn(
    "w-3 h-3",
    status === 'processing' && "animate-spin"
  )} />
  {statusLabel}
</Badge>`}
                </pre>
              </div>
            </Card>
          </div>
        </section>
        )}

        {/* Stepper / Progress Timeline Section */}
        {filterSection("stepper-timeline") && (
        <section id="stepper-timeline" className="space-y-6">
          <div className="border-b border-border pb-4">
            <h2 className="text-xl font-semibold">Stepper / Progress Timeline</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Multi-step progress indicators for withdrawal, deposit, and other workflows
            </p>
          </div>
          
          <div className="grid gap-6">
            {/* Vertical Stepper Example */}
            <Card className="p-6">
              <h3 className="text-base font-medium mb-4">Vertical Stepper (Withdrawal Flow)</h3>
              <div className="max-w-md mx-auto py-4">
                <div className="space-y-1">
                  {/* Step 1 - Completed */}
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 bg-trading-green border-trading-green">
                        <Check className="w-4 h-4 text-background" />
                      </div>
                      <div className="w-0.5 h-8 bg-trading-green" />
                    </div>
                    <div className="pt-1">
                      <div className="font-medium text-trading-green">Requested</div>
                      <div className="text-sm text-muted-foreground">Withdrawal request submitted</div>
                    </div>
                  </div>

                  {/* Step 2 - Completed */}
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 bg-trading-green border-trading-green">
                        <Check className="w-4 h-4 text-background" />
                      </div>
                      <div className="w-0.5 h-8 bg-trading-green" />
                    </div>
                    <div className="pt-1">
                      <div className="font-medium text-trading-green">Approved</div>
                      <div className="text-sm text-muted-foreground">Risk check passed</div>
                    </div>
                  </div>

                  {/* Step 3 - Current */}
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-primary bg-primary/20">
                        <Loader2 className="w-4 h-4 text-primary animate-spin" />
                      </div>
                      <div className="w-0.5 h-8 bg-border" />
                    </div>
                    <div className="pt-1">
                      <div className="font-medium text-primary">Sending</div>
                      <div className="text-sm text-muted-foreground">Transaction sent to chain</div>
                    </div>
                  </div>

                  {/* Step 4 - Pending */}
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-border bg-muted/30">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="pt-1">
                      <div className="font-medium text-muted-foreground">Confirmed</div>
                      <div className="text-sm text-muted-foreground">Transaction confirmed</div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Step States */}
            <Card className="p-6">
              <h3 className="text-base font-medium mb-4">Step States</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Completed */}
                <div className="p-4 bg-trading-green/10 border border-trading-green/30 rounded-xl text-center">
                  <div className="w-10 h-10 mx-auto rounded-full flex items-center justify-center border-2 bg-trading-green border-trading-green mb-3">
                    <Check className="w-5 h-5 text-background" />
                  </div>
                  <p className="font-medium text-trading-green">Completed</p>
                  <p className="text-xs text-muted-foreground mt-1">bg-trading-green + Check icon</p>
                </div>

                {/* Current */}
                <div className="p-4 bg-primary/10 border border-primary/30 rounded-xl text-center">
                  <div className="w-10 h-10 mx-auto rounded-full flex items-center justify-center border-2 border-primary bg-primary/20 mb-3">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  </div>
                  <p className="font-medium text-primary">In Progress</p>
                  <p className="text-xs text-muted-foreground mt-1">border-primary + Loader2</p>
                </div>

                {/* Pending */}
                <div className="p-4 bg-muted/30 border border-border rounded-xl text-center">
                  <div className="w-10 h-10 mx-auto rounded-full flex items-center justify-center border-2 border-border bg-muted/30 mb-3">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-muted-foreground">Pending</p>
                  <p className="text-xs text-muted-foreground mt-1">border-border + Clock icon</p>
                </div>
              </div>
            </Card>

            {/* Block Confirmations Progress */}
            <Card className="p-6">
              <h3 className="text-base font-medium mb-4">Block Confirmation Progress</h3>
              <div className="max-w-md mx-auto space-y-4">
                <div className="p-4 bg-trading-yellow/5 border border-trading-yellow/30 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Confirmations</span>
                    <span className="text-sm font-mono text-trading-yellow">8/15</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-trading-yellow rounded-full transition-all duration-300" style={{ width: '53%' }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">~3 min 30 sec remaining</p>
                </div>

                <div className="p-4 bg-trading-green/5 border border-trading-green/30 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Confirmations</span>
                    <span className="text-sm font-mono text-trading-green">15/15</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-trading-green rounded-full" style={{ width: '100%' }} />
                  </div>
                  <p className="text-xs text-trading-green mt-2 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Confirmed
                  </p>
                </div>
              </div>
            </Card>

            {/* Code Example */}
            <Card className="p-6">
              <h3 className="text-base font-medium mb-4">Stepper Implementation</h3>
              <div className="bg-muted/30 rounded-xl p-4">
                <pre className="text-xs font-mono text-muted-foreground overflow-x-auto">
{`const STATUS_STEPS = [
  { status: 'REQUESTED', label: 'Requested', description: 'Request submitted' },
  { status: 'APPROVED', label: 'Approved', description: 'Risk check passed' },
  { status: 'SENT', label: 'Sending', description: 'Transaction sent' },
  { status: 'CONFIRMED', label: 'Confirmed', description: 'Transaction confirmed' },
];

{STATUS_STEPS.map((step, index) => {
  const isCompleted = index < currentIndex;
  const isCurrent = index === currentIndex;
  const isPending = index > currentIndex;

  return (
    <div key={step.status} className="flex items-start gap-3">
      <div className="flex flex-col items-center">
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center border-2",
          isCompleted && "bg-trading-green border-trading-green",
          isCurrent && "border-primary bg-primary/20",
          isPending && "border-border bg-muted/30"
        )}>
          {isCompleted ? (
            <Check className="w-4 h-4 text-background" />
          ) : isCurrent ? (
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
          ) : (
            <Clock className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
        {index < STATUS_STEPS.length - 1 && (
          <div className={cn(
            "w-0.5 h-8",
            isCompleted ? "bg-trading-green" : "bg-border"
          )} />
        )}
      </div>
      <div className="pt-1">
        <div className={cn(
          "font-medium",
          isCompleted && "text-trading-green",
          isCurrent && "text-primary",
          isPending && "text-muted-foreground"
        )}>
          {step.label}
        </div>
        <div className="text-sm text-muted-foreground">
          {step.description}
        </div>
      </div>
    </div>
  );
})}`}
                </pre>
              </div>
            </Card>
          </div>
        </section>
        )}

        {/* Blockchain Explorer Links Section */}
        {filterSection("explorer-links") && (
        <section id="explorer-links" className="space-y-6">
          <div className="border-b border-border pb-4">
            <h2 className="text-xl font-semibold">Blockchain Explorer Links</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Patterns for displaying and linking to blockchain addresses and transaction hashes
            </p>
          </div>
          
          <div className="grid gap-6">
            {/* TxHash Display */}
            <Card className="p-6">
              <h3 className="text-base font-medium mb-4">Transaction Hash Display</h3>
              <div className="space-y-4">
                {/* Inline Style */}
                <div className="p-4 bg-muted/30 rounded-xl">
                  <p className="text-sm text-muted-foreground mb-2">Inline with metadata</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Jan 30, 2026</span>
                    <span>•</span>
                    <a 
                      href="https://bscscan.com/tx/0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline font-mono"
                    >
                      0x123456...abcdef
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Card Style */}
                <div className="p-4 bg-muted/30 rounded-xl">
                  <p className="text-sm text-muted-foreground mb-2">Card with full hash</p>
                  <div className="p-3 bg-muted/20 rounded-lg">
                    <LabelText size="xs" muted className="mb-1 block">Transaction Hash</LabelText>
                    <a
                      href="https://bscscan.com/tx/0x1234567890abcdef"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <MonoText className="text-sm truncate">0x1234567890abcdef1234567890abcdef1234567890abcdef</MonoText>
                      <ExternalLink className="w-4 h-4 flex-shrink-0" />
                    </a>
                  </div>
                </div>
              </div>
            </Card>

            {/* Address Display */}
            <Card className="p-6">
              <h3 className="text-base font-medium mb-4">Wallet Address Display</h3>
              <div className="space-y-4">
                {/* Truncated */}
                <div className="p-4 bg-muted/30 rounded-xl">
                  <p className="text-sm text-muted-foreground mb-2">Truncated (default)</p>
                  <div className="flex items-center gap-2">
                    <AddressText address="0x1234567890abcdef1234567890abcdef12345678" truncate />
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Full with copy */}
                <div className="p-4 bg-muted/30 rounded-xl">
                  <p className="text-sm text-muted-foreground mb-2">Full address (break-all)</p>
                  <MonoText className="text-sm break-all">0x1234567890abcdef1234567890abcdef12345678</MonoText>
                </div>
              </div>
            </Card>

            {/* Explorer URLs */}
            <Card className="p-6">
              <h3 className="text-base font-medium mb-4">Supported Explorer URLs</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2 font-medium">Network</th>
                      <th className="text-left py-2 px-2 font-medium">Explorer Base URL</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground font-mono text-xs">
                    <tr className="border-b border-border/50">
                      <td className="py-2 px-2 font-sans">Ethereum</td>
                      <td className="py-2 px-2">https://etherscan.io/tx/</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 px-2 font-sans">BNB Smart Chain</td>
                      <td className="py-2 px-2">https://bscscan.com/tx/</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 px-2 font-sans">Polygon</td>
                      <td className="py-2 px-2">https://polygonscan.com/tx/</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 px-2 font-sans">Arbitrum One</td>
                      <td className="py-2 px-2">https://arbiscan.io/tx/</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 px-2 font-sans">Solana</td>
                      <td className="py-2 px-2">https://solscan.io/tx/</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-2 font-sans">Tron (TRC20)</td>
                      <td className="py-2 px-2">https://tronscan.org/#/transaction/</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Code Example */}
            <Card className="p-6">
              <h3 className="text-base font-medium mb-4">Implementation</h3>
              <div className="bg-muted/30 rounded-xl p-4">
                <pre className="text-xs font-mono text-muted-foreground overflow-x-auto">
{`// Explorer URL mapping
const EXPLORER_URLS: Record<string, string> = {
  'Ethereum': 'https://etherscan.io/tx/',
  'BNB Smart Chain (BEP20)': 'https://bscscan.com/tx/',
  'Polygon': 'https://polygonscan.com/tx/',
  'Arbitrum One': 'https://arbiscan.io/tx/',
  'Solana': 'https://solscan.io/tx/',
  'Tron (TRC20)': 'https://tronscan.org/#/transaction/',
};

// Get explorer URL
const getExplorerUrl = (network: string, txHash: string): string | null => {
  const baseUrl = EXPLORER_URLS[network];
  return baseUrl ? \`\${baseUrl}\${txHash}\` : null;
};

// Truncate hash for display
const truncateTxHash = (hash: string): string => {
  if (hash.length <= 15) return hash;
  return \`\${hash.slice(0, 6)}...\${hash.slice(-6)}\`;
};

// Usage in component
{txHash && explorerUrl && (
  <a 
    href={explorerUrl}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-1 text-primary hover:underline font-mono"
  >
    {truncateTxHash(txHash)}
    <ExternalLink className="w-3 h-3" />
  </a>
)}`}
                </pre>
              </div>
            </Card>
          </div>
        </section>
        )}
      </main>
    </div>
  );
};

export default StyleGuide;
