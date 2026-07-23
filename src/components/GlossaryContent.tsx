import { SeoPageLayout } from "@/components/seo";
import { useState } from "react";
import { Search, BookOpen, Lightbulb, MessageSquareQuote } from "lucide-react";
import { glossaryTerms, GlossaryTerm } from "@/data/glossaryTerms";

interface TermCardProps {
  term: GlossaryTerm;
  lang: "en" | "cn";
}

const TermCard = ({ term, lang }: TermCardProps) => {
  const [expanded, setExpanded] = useState(false);

  const title = lang === "en" ? term.termEn : term.termCn;
  const subtitle = lang === "en" ? term.termCn : term.termEn;
  const definition = lang === "en" ? term.definitionEn : term.definitionCn;
  const explanation = lang === "en" ? term.explanationEn : term.explanationCn;
  const example = lang === "en" ? term.exampleEn : term.exampleCn;

  return (
    <div
      id={term.id}
      className="rounded-xl border border-border/40 bg-card/50 overflow-hidden transition-colors hover:border-border/60"
    >
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left px-4 py-3.5 md:px-5 md:py-4 flex items-start justify-between gap-3"
      >
        <div className="min-w-0">
          <h3 className="text-sm md:text-base font-semibold text-foreground leading-snug">
            {title}
          </h3>
          
        </div>
        <svg
          className={`shrink-0 mt-1 w-4 h-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Collapsed: definition preview */}
      {!expanded && (
        <div className="px-4 pb-3.5 md:px-5 md:pb-4 -mt-1">
          <p className="text-xs md:text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {definition}
          </p>
        </div>
      )}

      {/* Expanded: full content */}
      {expanded && (
        <div className="px-4 pb-4 md:px-5 md:pb-5 space-y-3 -mt-1">
          {/* Definition */}
          <div className="flex gap-2.5">
            <BookOpen className="shrink-0 w-3.5 h-3.5 mt-0.5 text-primary/70" />
            <div>
              <span className="text-[10px] uppercase tracking-wider text-primary/70 font-medium">
                {lang === "en" ? "Definition" : "定义"}
              </span>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed mt-0.5">
                {definition}
              </p>
            </div>
          </div>

          {/* Explanation */}
          <div className="flex gap-2.5">
            <Lightbulb className="shrink-0 w-3.5 h-3.5 mt-0.5 text-amber-400/70" />
            <div>
              <span className="text-[10px] uppercase tracking-wider text-amber-400/70 font-medium">
                {lang === "en" ? "Explanation" : "解释"}
              </span>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed mt-0.5">
                {explanation}
              </p>
            </div>
          </div>

          {/* Example */}
          <div className="flex gap-2.5">
            <MessageSquareQuote className="shrink-0 w-3.5 h-3.5 mt-0.5 text-emerald-400/70" />
            <div>
              <span className="text-[10px] uppercase tracking-wider text-emerald-400/70 font-medium">
                {lang === "en" ? "Example" : "示例"}
              </span>
              <p className="text-xs md:text-sm text-muted-foreground/90 leading-relaxed mt-0.5 italic">
                {example}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface GlossaryContentProps {
  lang: "en" | "cn";
}

const GlossaryContent = ({ lang }: GlossaryContentProps) => {
  const [search, setSearch] = useState("");

  const filtered = glossaryTerms.filter((t) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      t.termEn.toLowerCase().includes(q) ||
      t.termCn.includes(q) ||
      (lang === "en" ? t.definitionEn : t.definitionCn).toLowerCase().includes(q)
    );
  });

  const title = lang === "en" ? "Glossary" : "术语词典";
  const description = lang === "en"
    ? "Comprehensive dictionary of prediction market and trading terminology used on OmenX."
    : "OmenX 预测市场与交易术语词典。";

  return (
    <SeoPageLayout title={title} description={description}>
      {/* Search */}
      <div className="mb-6 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={lang === "en" ? "Search terms..." : "搜索术语..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-muted/50 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
      </div>

      {/* Term count */}
      <p className="text-xs text-muted-foreground/60 mb-4">
        {filtered.length} {lang === "en" ? "terms" : "个术语"}
      </p>

      {/* Term cards */}
      <div className="space-y-3">
        {filtered.map((term) => (
          <TermCard key={term.id} term={term} lang={lang} />
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground/60 text-center py-12">
            {lang === "en" ? "No matching terms found." : "未找到匹配的术语。"}
          </p>
        )}
      </div>
    </SeoPageLayout>
  );
};

export default GlossaryContent;
