// Desktop Subpage Header (DSH v1) — DESIGN.md §10.
// Desktop-only component; both frames mount the REAL DesktopSubpageHeader.
import { Plus } from "lucide-react";
import { DesktopSubpageHeader } from "@/components/layout/DesktopSubpageHeader";
import { Button } from "@/components/ui/button";

const Body = ({ children }: { children: React.ReactNode }) => (
  <div className="px-6 pt-[22px] text-[11px] text-muted-foreground">{children}</div>
);

/** Right slot filled — /wallet/recovery ships this exact shape. */
const DshWithActionFrame = () => (
  <div className="bg-background pt-6">
    <div className="max-w-3xl mx-auto px-6">
      <DesktopSubpageHeader title="Recovery" onBack={() => {}}>
        <Button size="sm" className="h-9 rounded-lg">
          <Plus className="w-3.5 h-3.5 mr-1" />
          New request
        </Button>
      </DesktopSubpageHeader>
    </div>
    <Body>Right slot ≤ 1 primary action. 22px gap to the first content block.</Body>
  </div>
);

/** Right slot empty — /wallet/recovery/:id. */
const DshEmptySlotFrame = () => (
  <div className="bg-background pt-6">
    <div className="max-w-5xl mx-auto px-6">
      <DesktopSubpageHeader title="Request detail" onBack={() => {}} />
    </div>
    <Body>No subtitle slot — explanatory copy belongs in the opening card.</Body>
  </div>
);

/** Both frames — desktop-only component, so no mobile frame is provided. */
export const DshHeaderPreview = () => (
  <div className="bg-background pb-6">
    <DshWithActionFrame />
    <div className="mt-6 border-t border-border/60" />
    <DshEmptySlotFrame />
  </div>
);
