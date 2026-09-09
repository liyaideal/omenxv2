// Surface switch (D6'-1 · FIX3) — trade-page-only Lite / Pro control.
// Every frame mounts the REAL src/components/surface/SurfaceSwitch.tsx.
import { SurfaceSwitch } from "@/components/surface/SurfaceSwitch";

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
  </div>
);
