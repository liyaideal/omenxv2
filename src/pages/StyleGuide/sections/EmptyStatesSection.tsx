// ============================================================
// Empty states + the lynx mascot. Production components only.
// ============================================================
import { EmptyState } from "@/components/states";
import { LynxFigure, LynxMark } from "@/components/brand";
import { SectionWrapper, SubSection } from "../components/SectionWrapper";
import { cn } from "@/lib/utils";

interface Props {
  isMobile: boolean;
}

const Chip = ({ children }: { children: string }) => (
  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
    {children}
  </span>
);

const WHERE_ROWS: Array<[string, string, string, string, string]> = [
  [
    "EmptyState (page)",
    "Fills remaining viewport · lynx 150 / title 19",
    "Same, full width",
    "Main list area empty",
    "1",
  ],
  [
    "EmptyState (section)",
    "Medium block · lynx 100 / title 15",
    "Same, full width",
    "A section within a page is empty",
    "2",
  ],
  [
    "EmptyState (module)",
    "In-card row · lynx mark 40",
    "Same, inside the card",
    "Zero-length list",
    "2",
  ],
  ["LynxMark", "Module empties, compact slots", "Same", "Rendered by EmptyState", "3"],
  ["LynxFigure", "Page (150) + section (100) empties", "Same", "Rendered by EmptyState", "2"],
];

export const EmptyStatesSection = ({ isMobile }: Props) => (
  <SectionWrapper
    id="empty-states"
    title="Empty states"
    description="One primitive site-wide. Line 1 states the fact, line 2 tells the user how it fills up. No 'Oops', no exclamation marks, no apologies, no illustration other than the lynx. Any action is a pill — blue underlined links inside empty states are abolished."
  >
    <div className="space-y-8">
      {/* Where things live */}
      <SubSection title="Where things live">
        <div className="overflow-x-auto rounded-lg border border-border/50">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/20 text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Component</th>
                <th className="px-3 py-2">Desktop</th>
                <th className="px-3 py-2">Mobile</th>
                <th className="px-3 py-2">Opened by</th>
                <th className="px-3 py-2">Demo states</th>
              </tr>
            </thead>
            <tbody>
              {WHERE_ROWS.map((r) => (
                <tr key={r[0]} className="border-t border-border/40">
                  {r.map((cell, i) => (
                    <td key={i} className="px-3 py-2 text-muted-foreground">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SubSection>

      <SubSection
        title="variant=&quot;page&quot;"
        description="Fills the remaining viewport (flex-1 + min-h-[420px]), vertically centered. LynxFigure 150 · title 19px · description 13.5px · pill 14px. Use when the main list/content area is entirely empty."
      >
        <Chip>Desktop &amp; Mobile · same component</Chip>
        <div className="flex h-[560px] flex-col">
          <EmptyState
            variant="page"
            title="Nothing has settled yet"
            description="Markets land here when they wrap up."
            actionLabel="See live markets"
            onAction={() => {}}
          />
        </div>
      </SubSection>

      <SubSection
        title="variant=&quot;section&quot;"
        description="Height follows content. LynxFigure 100 · title 15px · description 12px · pill 13px. Use for a section within an otherwise populated page."
      >
        <Chip>Desktop &amp; Mobile · same component</Chip>
        <div className={cn("grid gap-4", isMobile ? "grid-cols-1" : "grid-cols-2")}>
          <EmptyState
            variant="section"
            title="Nothing starred yet"
            description="Tap the ★ on any market and it'll show up here."
          />
          <EmptyState
            variant="section"
            title="No results yet"
            description="Markets land here when they wrap up."
            actionLabel="See live markets"
            onAction={() => {}}
          />
        </div>
      </SubSection>

      <SubSection
        title="variant=&quot;module&quot;"
        description="Horizontal compact row for in-card empties. LynxMark 40 · strokeWidth 3.4. Dashed border only when it is the sole content of a bordered slot."
      >
        <Chip>Desktop &amp; Mobile · same component</Chip>
        <div className={cn("grid gap-4", isMobile ? "grid-cols-1" : "grid-cols-2")}>
          <EmptyState
            variant="module"
            title="No activity yet"
            description="Trades on this market show up here as people buy in."
          />
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-2 text-sm font-medium">Inside a bordered card</div>
            <EmptyState
              variant="module"
              bordered={false}
              title="No saved addresses"
              description="Save addresses for quick deposits and withdrawals."
              className="px-0 py-2"
            />
          </div>
        </div>
      </SubSection>

      <SubSection
        title="Brand / Lynx mascot"
        description="Mono line art, componentised — never an image asset."
      >
        <Chip>Desktop &amp; Mobile · same component</Chip>
        <div className="flex flex-wrap items-end gap-8 rounded-lg border border-border/50 p-6">
          <div className="text-center">
            <LynxMark size={96} />
            <div className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground">mark 96</div>
          </div>
          <div className="text-center">
            <LynxMark size={64} />
            <div className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground">mark 64</div>
          </div>
          <div className="text-center">
            <LynxMark size={40} strokeWidth={3.4} />
            <div className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground">mark 40 · sw 3.4</div>
          </div>
          <div className="text-center">
            <LynxFigure size={150} />
            <div className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground">figure 150</div>
          </div>
          <div className="text-center">
            <LynxFigure size={95} />
            <div className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground">figure 95</div>
          </div>
        </div>
        <ol className="list-decimal space-y-1 pl-5 text-xs text-muted-foreground">
          <li>Mono stroke follows the --muted-foreground token; componentised, never an image.</li>
          <li>Expression is locked — only this grumpy face, no variants.</li>
          <li>Minimum LynxMark render size is 40px (raise strokeWidth to ~3.4 at that size).</li>
          <li>Never stretch, rotate, add shadow/gradient or recolor; the mascot never participates in the MARKET/MONEY color axes.</li>
        </ol>
      </SubSection>
    </div>
  </SectionWrapper>
);

export default EmptyStatesSection;
