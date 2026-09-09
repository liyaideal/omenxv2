// Surface switch (D6'-1) — trade-page-only Simple / Pro control.
// Both frames mount the REAL src/components/surface/SurfaceSwitch.tsx.
import { SurfaceSwitch } from "@/components/surface/SurfaceSwitch";

const Row = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-3 px-4 py-3">{children}</div>
);

const Note = ({ children }: { children: React.ReactNode }) => (
  <div className="px-4 pb-3 text-[11px] text-muted-foreground">{children}</div>
);

/** Signed in · Simple active (default) and Pro active — both real controls. */
export const SurfaceSwitchPreview = () => (
  <div className="py-2">
    <Row>
      <SurfaceSwitch size="header" previewSignedIn previewActive="lite" />
    </Row>
    <Note>SS-1 · Simple active — signed in, surface === "lite".</Note>
    <Row>
      <SurfaceSwitch size="header" previewSignedIn previewActive="pro" />
    </Row>
    <Note>SS-2 · Pro active — signed in, surface === "pro".</Note>
    <Row>
      <SurfaceSwitch size="compact" />
    </Row>
    <Note>SS-3 · Guest — !user, renders null (nothing above this line).</Note>
  </div>
);
