import { Suspense, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Search, X, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  ViewportSwitcher, 
  ViewportBanner, 
  type ViewportSize,
} from "./components";
import { STYLE_GUIDE_GROUPS, ALL_SECTIONS, resolveSectionId } from "./nav";

const StyleGuideIndex = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const actualIsMobile = useIsMobile();
  const [viewport, setViewport] = useState<ViewportSize>("auto");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeId, setActiveId] = useState(
    () => resolveSectionId(location.hash) ?? ALL_SECTIONS[0].id,
  );

  // Deep links: /style-guide#lite keeps working, and selecting a section
  // writes the hash back so links stay shareable.
  useEffect(() => {
    const fromHash = resolveSectionId(location.hash);
    if (fromHash && fromHash !== activeId) setActiveId(fromHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.hash]);

  const selectSection = (id: string) => {
    setActiveId(id);
    navigate(`#${id}`, { replace: true });
    window.scrollTo({ top: 0 });
  };

  // Determine effective isMobile based on viewport selection
  const isMobile = viewport === "auto" 
    ? actualIsMobile 
    : viewport === "mobile" || viewport === "tablet";

  const q = searchQuery.trim().toLowerCase();
  const groups = useMemo(
    () =>
      STYLE_GUIDE_GROUPS.map((g) => ({
        ...g,
        sections: q
          ? g.sections.filter(
              (x) =>
                x.label.toLowerCase().includes(q) || g.label.toLowerCase().includes(q),
            )
          : g.sections,
      })).filter((g) => g.sections.length > 0),
    [q],
  );

  const active = ALL_SECTIONS.find((x) => x.id === activeId) ?? ALL_SECTIONS[0];

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
            {/* Campaign Style Guide entry */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/campaign-style-guide")}
              className="h-8 gap-1.5"
            >
              <Megaphone className="h-3.5 w-3.5" />
              {!isMobile && <span>Campaign Style Guide</span>}
            </Button>


            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${isMobile ? "w-[120px]" : "w-[180px]"} pl-9 h-8 text-sm bg-muted/50 border-border/50`}
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

            {/* Viewport Switcher */}
            <ViewportSwitcher value={viewport} onChange={setViewport} />
          </div>
        </div>

        <ViewportBanner viewport={viewport} onClose={() => setViewport("auto")} />
      </header>

      {/* Grouped shell: sidebar (desktop) / stacked picker (mobile) */}
      <div className={isMobile ? "" : "mx-auto flex max-w-[1600px] gap-8 px-8 py-6"}>
        <nav
          className={
            isMobile
              ? "sticky top-[57px] z-40 -mx-0 border-b border-border bg-background/95 px-4 py-3 backdrop-blur"
              : "sticky top-24 max-h-[calc(100vh-7rem)] w-[240px] shrink-0 space-y-5 overflow-y-auto overscroll-contain pr-1 scrollbar-none"
          }
        >
          {isMobile ? (
            <div className="flex gap-2 overflow-x-auto scrollbar-none">
              {groups.flatMap((g) =>
                g.sections.map((x) => (
                  <button
                    key={x.id}
                    onClick={() => selectSection(x.id)}
                    className={cn(
                      "shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium",
                      activeId === x.id
                        ? "border-transparent bg-foreground text-background"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    {x.label}
                  </button>
                )),
              )}
            </div>
          ) : (
            <>
              {groups.map((g) => (
                <div key={g.id}>
                  <div className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {g.label}
                  </div>
                  <div className="space-y-0.5">
                    {g.sections.map((x) => (
                      <button
                        key={x.id}
                        onClick={() => selectSection(x.id)}
                        className={cn(
                          "block w-full rounded-lg px-2 py-1.5 text-left text-sm transition-colors",
                          activeId === x.id
                            ? "bg-muted font-medium text-foreground"
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                        )}
                      >
                        {x.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div className="border-t border-border pt-3">
                <button
                  onClick={() => navigate("/campaign-style-guide")}
                  className="flex items-center gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Megaphone className="h-3.5 w-3.5" />
                  Campaign style guide
                </button>
              </div>
            </>
          )}
        </nav>

        <main className={isMobile ? "px-4 py-4" : "min-w-0 flex-1"}>
          <Suspense
            fallback={
              <div className="space-y-3">
                <div className="h-6 w-48 animate-pulse rounded bg-muted/50" />
                <div className="h-40 w-full animate-pulse rounded-xl bg-muted/30" />
              </div>
            }
            key={active.id}
          >
            {active.render(isMobile)}
          </Suspense>
        </main>
      </div>
    </div>
  );
};

export default StyleGuideIndex;
