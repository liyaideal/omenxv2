// Surface switch (D6'-1) — trade-page-only Simple / Pro control.
// Both frames mount the REAL src/components/surface/SurfaceSwitch.tsx.
import { SurfaceSwitch } from "@/components/surface/SurfaceSwitch";
import { SurfaceProvider } from "@/contexts/SurfaceContext";

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
      <SurfaceProvider>
        <SurfaceSwitch size="header" />
      </SurfaceProvider>
    </Row>
    <Note>size="header" — desktop trade chrome. Tap a pill to see both states.</Note>
    <Row>
      <SurfaceProvider>
        <SurfaceSwitch size="compact" />
      </SurfaceProvider>
    </Row>
    <Note>size="compact" — mobile trade header right slot.</Note>
    <Row>
      <SurfaceSwitch size="header" />
    </Row>
    <Note>Guest — renders null (no pills above this line).</Note>
  </div>
);
