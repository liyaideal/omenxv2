import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  MobileDrawer,
  MobileDrawerSection,
  MobileDrawerActions,
} from "@/components/ui/mobile-drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import type { ApiKey } from "@/hooks/useApiKeys";

export const RevokeDialog = ({
  target,
  onClose,
  onConfirm,
  pending,
}: {
  target: ApiKey | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
  pending: boolean;
}) => {
  const isMobile = useIsMobile();
  const open = !!target;

  const bodyText = target ? (
    <>
      Revoking <span className="font-medium text-foreground">{target.label}</span> immediately
      disables all requests using this key. This action cannot be undone.
    </>
  ) : null;

  if (isMobile) {
    return (
      <MobileDrawer
        open={open}
        onOpenChange={(o) => !o && onClose()}
        title="Revoke API key"
      >
        <MobileDrawerSection>
          <div className="rounded-lg border border-trading-red/30 bg-trading-red/[0.06] p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-trading-red mt-0.5 shrink-0" />
            <div className="text-xs text-muted-foreground leading-relaxed">{bodyText}</div>
          </div>
          {target && (
            <div className="rounded-lg border border-border/40 bg-muted/30 p-3 space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                Key
              </div>
              <div className="text-sm font-medium">{target.label}</div>
              <code className="block font-mono text-[11px] text-muted-foreground truncate">
                {target.key_prefix}
              </code>
            </div>
          )}
        </MobileDrawerSection>
        <MobileDrawerActions>
          <Button
            className="w-full h-11 bg-trading-red text-white hover:bg-trading-red/90"
            disabled={pending}
            onClick={() => target && onConfirm(target.id)}
          >
            {pending ? "Revoking…" : "Revoke key"}
          </Button>
          <Button variant="outline" className="w-full h-11" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
        </MobileDrawerActions>
      </MobileDrawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Revoke API key</DialogTitle>
          <DialogDescription>{bodyText}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button
            className="bg-trading-red text-white hover:bg-trading-red/90"
            disabled={pending}
            onClick={() => target && onConfirm(target.id)}
          >
            {pending ? "Revoking…" : "Revoke key"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
