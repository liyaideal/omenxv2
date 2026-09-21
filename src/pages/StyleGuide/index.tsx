import { Suspense, useEffect, useMemo, useRef, useState } from "react";
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
import { collectToc, type TocEntry } from "./toc";
import { searchStyleGuide, locateHit, type SearchHit } from "./search";

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

  const groups = STYLE_GUIDE_GROUPS;

  // 全站搜索（nav 2026-09-21）：编号 / 小节标题 / case 名 → 「编号 · 名 → 节点 › 小节」，点了落到小节。
  const hits = useMemo(() => searchStyleGuide(searchQuery), [searchQuery]);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!searchOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!searchRef.current?.contains(e.target as Node)) setSearchOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [searchOpen]);
  const pendingHit = useRef<SearchHit | null>(null);
  const [locateTick, setLocateTick] = useState(0);
  const pickHit = (hit: SearchHit) => {
    setSearchOpen(false);
    setSearchQuery("");
    pendingHit.current = hit.kind === "node" ? null : hit;
    setLocateTick((n) => n + 1);
    if (hit.node !== activeId) selectSection(hit.node);
    else if (hit.kind === "node") window.scrollTo({ top: 0 });
  };

  const active = ALL_SECTIONS.find((x) => x.id === activeId) ?? ALL_SECTIONS[0];

  // 本页目录（nav 2026-09-21）：从渲染出的 SectionWrapper 自动读，不手维护。
  const mainRef = useRef<HTMLElement>(null);
  const [toc, setToc] = useState<TocEntry[]>([]);
  useEffect(() => {
    setToc([]);
    const root = mainRef.current;
    if (!root) return;
    let raf = 0;
    const refresh = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setToc(collectToc(root)));
    };
    const mo = new MutationObserver(refresh);
    mo.observe(root, { childList: true, subtree: true, characterData: true });
    refresh();
    return () => {
      mo.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [activeId]);
  const jumpTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  // 搜索落点：节点渲染（含 lazy 段）完成后再定位，最多等 4 s。
  // 落到后上方 iframe 还会陆续自报高度把落点顶走，所以再每 250 ms 重钉一次（稳定 1 s 或满 5 s 为止），
  // 钉的循环放在 ref 里，不跟随本 effect 的重跑被清掉。
  const pinRef = useRef(0);
  useEffect(() => {
    const hit = pendingHit.current;
    const root = mainRef.current;
    if (!hit || !root) return;
    let tries = 0;
    const timer = window.setInterval(() => {
      const el = locateHit(root, hit);
      tries += 1;
      if (!el && tries < 20) return;
      window.clearInterval(timer);
      pendingHit.current = null;
      if (!el) return;
      const ring = ["ring-2", "ring-yes", "ring-offset-4", "ring-offset-background", "rounded-md"];
      const block = hit.key ? "center" : "start";
      el.classList.add(...ring);
      el.scrollIntoView({ behavior: "auto", block });
      let last = Math.round(el.getBoundingClientRect().top);
      let stable = 0;
      let ticks = 0;
      window.clearInterval(pinRef.current);
      pinRef.current = window.setInterval(() => {
        const top = Math.round(el.getBoundingClientRect().top);
        ticks += 1;
        if (top === last) stable += 1;
        else {
          stable = 0;
          el.scrollIntoView({ behavior: "auto", block });
        }
        last = Math.round(el.getBoundingClientRect().top);
        if (stable >= 4 || ticks >= 20) {
          window.clearInterval(pinRef.current);
          window.setTimeout(() => el.classList.remove(...ring), 1500);
        }
      }, 250);
    }, 200);
    return () => window.clearInterval(timer);
  }, [toc, activeId, locateTick]);

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


            {/* Search — 全站索引（编号 / 小节 / case） */}
            <div className="relative" ref={searchRef}>
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={isMobile ? "TR-27…" : "搜编号 / 小节 / case，如 SL-D2"}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setSearchOpen(false);
                  if (e.key === "Enter" && hits[0]) pickHit(hits[0]);
                }}
                className={`${isMobile ? "w-[120px]" : "w-[240px]"} pl-9 h-8 text-sm bg-muted/50 border-border/50`}
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
              {searchOpen && searchQuery.trim() && (
                <div
                  className={cn(
                    "z-50 max-h-[60vh] overflow-y-auto rounded-xl border border-border bg-popover p-1 shadow-xl",
                    isMobile
                      ? "fixed inset-x-4 top-[64px]"
                      : "absolute right-0 top-full mt-1.5 w-[460px]",
                  )}
                >
                  {hits.length === 0 ? (
                    <div className="px-3 py-3 text-xs text-muted-foreground">没找到 · 试编号（SL-D2）/ 小节名 / case 名</div>
                  ) : (
                    hits.map((h) => (
                      <button
                        key={`${h.kind}|${h.node}|${h.section}|${h.key}`}
                        onClick={() => pickHit(h)}
                        className="flex w-full flex-col gap-0.5 rounded-lg px-3 py-2 text-left hover:bg-muted/60"
                      >
                        <div className="flex items-baseline gap-2 text-[13px]">
                          {h.code && <span className="shrink-0 font-mono text-[11px] text-yes">{h.code}</span>}
                          {!h.code && h.kind !== "node" && (
                            <span className="shrink-0 font-mono text-[10px] uppercase text-muted-foreground/70">小节</span>
                          )}
                          {h.kind === "node" && (
                            <span className="shrink-0 font-mono text-[10px] uppercase text-muted-foreground/70">节点</span>
                          )}
                          <span className="truncate text-foreground">{h.name}</span>
                        </div>
                        {h.kind !== "node" && (
                          <div className="truncate text-[11px] text-muted-foreground">
                            → {h.nodeLabel}
                            {h.sectionShort && <> › {h.sectionShort}</>}
                          </div>
                        )}
                      </button>
                    ))
                  )}
                </div>
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
                      <div key={x.id}>
                      <button
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
                        {activeId === x.id && toc.length > 1 && (
                          <div className="mb-1 space-y-px pl-3">
                            {toc.map((t) => (
                              <button
                                key={t.id}
                                onClick={() => jumpTo(t.id)}
                                className="flex w-full items-baseline justify-between gap-2 rounded-md px-2 py-1 text-left text-[11.5px] text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                              >
                                <span className="truncate">{t.short}</span>
                                {t.codes && <span className="shrink-0 font-mono text-[10px] text-muted-foreground/70">{t.codes}</span>}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
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

        <main ref={mainRef} className={isMobile ? "px-4 py-4" : "min-w-0 flex-1"}>
          {toc.length > 1 && (
            <div className="mb-6 rounded-xl border border-border bg-card/60 px-4 py-3">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                本页目录 · 按页面从上到下
              </div>
              <ol className={cn("grid gap-x-8 gap-y-1", isMobile ? "grid-cols-1" : "grid-cols-2")}>
                {toc.map((t) => (
                  <li key={t.id}>
                    <button
                      onClick={() => jumpTo(t.id)}
                      className="flex w-full items-baseline justify-between gap-3 rounded-md px-1.5 py-1 text-left text-[13px] text-foreground/90 hover:bg-muted/50"
                    >
                      <span className="truncate">{t.title}</span>
                      {t.codes && <span className="shrink-0 font-mono text-[10.5px] text-yes">{t.codes}</span>}
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          )}
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
