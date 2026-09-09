// Surface switch (D6'-1 · FIX3 / FIX4) — trade-page-only Lite / Pro control.
// Every frame mounts the REAL src/components/surface/SurfaceSwitch.tsx.
import { useState } from "react";
import { SurfaceSwitch } from "@/components/surface/SurfaceSwitch";
import { LiteMarketBoard, type BoardOption } from "@/components/lite/multi/LiteMarketBoard";
import { LiteBoardGroupHeader } from "@/components/lite/multi/LiteBoardGroupHeader";

const Row = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-12 items-stretch gap-1.5 px-4 py-3">{children}</div>
);

const Note = ({ children }: { children: React.ReactNode }) => (
  <div className="px-4 pb-3 text-[11px] text-muted-foreground">{children}</div>
);

/** SS-1…SS-5 — header segments (both actives), guest, and the dock button both ways. */
export const SurfaceSwitchPreview = () => (
  <div className="py-2">
    <Row>
      <SurfaceSwitch size="header" previewSignedIn previewActive="lite" />
    </Row>
    <Note>SS-1 · Lite active — signed in, surface === "lite".</Note>
    <Row>
      <SurfaceSwitch size="header" previewSignedIn previewActive="pro" />
    </Row>
    <Note>SS-2 · Pro active — signed in, surface === "pro".</Note>
    <Row>
      <SurfaceSwitch size="header" />
    </Row>
    <Note>SS-3 · Guest — !user, renders null (nothing above this line).</Note>
    <Row>
      <SurfaceSwitch size="dock" previewSignedIn previewActive="lite" />
    </Row>
    <Note>SS-4 · Dock button on a Lite trade page — label shows the destination, Pro.</Note>
    <Row>
      <SurfaceSwitch size="dock" previewSignedIn previewActive="pro" />
    </Row>
    <Note>SS-5 · Dock button on a Pro trade page — label shows the destination, Lite.</Note>
    <Note>SS-6 · Multi-market page has no sticky bar — the same button floats bottom-left.</Note>
    <SurfaceSwitchFloatPreview />
  </div>
);

const SS6_ROWS: BoardOption[] = [
  { id: "ss6-a", label: "Ulsan", yesPrice: 0.19 },
  { id: "ss6-b", label: "Draw", yesPrice: 0.23 },
  { id: "ss6-c", label: "Jeonbuk", yesPrice: 0.58 },
  { id: "ss6-d", label: "Suwon", yesPrice: 0.41 },
];

/** SS-6 — 多市场页没有贴底栏，同一颗方钮改为左下角浮钮（列表底部留 64px）。 */
export const SurfaceSwitchFloatPreview = () => {
  const [sel, setSel] = useState<string | null>(null);
  const [side, setSide] = useState<"yes" | "no">("yes");
  return (
    <div className="space-y-2 p-4 pb-16">
      <LiteBoardGroupHeader title="Winner" note="Regulation time" />
      <LiteMarketBoard
        options={SS6_ROWS}
        volumeText="Vol $550.1K"
        selectedId={sel}
        selectedSide={side}
        onSelect={(id, s) => {
          setSel(id);
          setSide(s);
        }}
        onDeselect={() => setSel(null)}
      />
      <SurfaceSwitch size="float" previewSignedIn previewActive="lite" />
    </div>
  );
};
