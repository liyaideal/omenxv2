import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { MobileDrawer } from "@/components/ui/mobile-drawer";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useIsMobile } from "@/hooks/use-mobile";
import { GoogleIcon } from "@/components/icons/GoogleIcon";
import { UserCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { PROFILE_QUERY_KEY } from "@/hooks/useUserProfile";

export interface FixedAccount {
  scenario: "matched" | "welcome";
  displayName: string;
  email: string;
  avatarUrl: string;
}

export const FIXED_ACCOUNTS: FixedAccount[] = [
  {
    scenario: "matched",
    displayName: "Alex Carter",
    email: "alex.carter@gmail.com",
    avatarUrl:
      "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=felix&backgroundColor=b6e3f4",
  },
  {
    scenario: "welcome",
    displayName: "Mia Reyes",
    email: "mia.reyes@gmail.com",
    avatarUrl:
      "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=mia&backgroundColor=ffd5dc",
  },
];

interface GoogleAccountChooserProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a fixed account has been signed in successfully. Parent should close & bypass onboarding. */
  onFixedAccountSignedIn: (account: FixedAccount) => void;
  /** Called when user picks "Use another account". Parent runs the anonymous/new-account flow. */
  onUseAnotherAccount: () => void;
  /** Preview mode: do not actually sign in; used for /style-guide playground. */
  previewOnly?: boolean;
}

const HeaderBlock = () => (
  <div className="flex flex-col items-center gap-3 pt-2 pb-4">
    <GoogleIcon className="w-8 h-8" />
    <div className="text-center space-y-1">
      <h2 className="text-xl font-normal text-foreground tracking-tight">
        Choose an account
      </h2>
      <p className="text-sm text-muted-foreground">
        to continue to <span className="font-medium text-foreground">OMENX</span>
      </p>
    </div>
  </div>
);

const AccountRow = ({
  avatarUrl,
  displayName,
  email,
  onClick,
  loading,
  disabled,
}: {
  avatarUrl?: string;
  displayName: string;
  email?: string;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted/50 active:bg-muted transition-colors text-left disabled:opacity-60 disabled:cursor-not-allowed"
  >
    <div className="w-9 h-9 rounded-full overflow-hidden border border-border/60 flex items-center justify-center bg-muted/40 flex-shrink-0">
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="w-full h-full" />
      ) : (
        <UserCircle2 className="w-6 h-6 text-muted-foreground" />
      )}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
      {email && (
        <p className="text-xs text-muted-foreground truncate">{email}</p>
      )}
    </div>
    {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
  </button>
);

export const GoogleAccountChooserBody = ({
  onFixedAccountSignedIn,
  onUseAnotherAccount,
  previewOnly,
  onClose,
}: {
  onFixedAccountSignedIn: (account: FixedAccount) => void;
  onUseAnotherAccount: () => void;
  previewOnly?: boolean;
  onClose?: () => void;
}) => {
  const queryClient = useQueryClient();
  const [loadingScenario, setLoadingScenario] = useState<FixedAccount["scenario"] | null>(null);

  const handleFixedAccount = async (account: FixedAccount) => {
    if (previewOnly) {
      toast.message(`Preview: would sign in as ${account.displayName}`);
      return;
    }
    setLoadingScenario(account.scenario);
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "ensure-demo-user",
        { body: { scenario: account.scenario } },
      );
      if (fnError || (data as any)?.error) {
        throw new Error(fnError?.message || (data as any)?.error);
      }
      const { error } = await supabase.auth.signInWithPassword({
        email: (data as any).email,
        password: (data as any).password,
      });
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
      toast.success(`Welcome back, ${account.displayName}`);
      onFixedAccountSignedIn(account);
    } catch (e: any) {
      console.error("Google account sign-in error:", e);
      toast.error(e?.message || "Sign-in failed");
    } finally {
      setLoadingScenario(null);
    }
  };

  return (
    <div className="space-y-0">
      <HeaderBlock />

      <div className="border-t border-border/60" />

      <div className="py-2">
        {FIXED_ACCOUNTS.map((acc) => (
          <AccountRow
            key={acc.scenario}
            avatarUrl={acc.avatarUrl}
            displayName={acc.displayName}
            email={acc.email}
            onClick={() => handleFixedAccount(acc)}
            loading={loadingScenario === acc.scenario}
            disabled={loadingScenario !== null}
          />
        ))}

        <div className="my-1 border-t border-border/40 mx-4" />

        <AccountRow
          displayName="Use another account"
          onClick={() => {
            if (previewOnly) {
              toast.message("Preview: would open new-account flow");
              return;
            }
            onClose?.();
            onUseAnotherAccount();
          }}
          disabled={loadingScenario !== null}
        />
      </div>

      <div className="border-t border-border/60 pt-3 pb-1 px-4">
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          To continue, Google will share your name, email address, language
          preference and profile picture with OMENX.
        </p>
      </div>
    </div>
  );
};

export const GoogleAccountChooser = ({
  open,
  onOpenChange,
  onFixedAccountSignedIn,
  onUseAnotherAccount,
  previewOnly,
}: GoogleAccountChooserProps) => {
  const isMobile = useIsMobile();

  const body = (
    <GoogleAccountChooserBody
      onFixedAccountSignedIn={(acc) => {
        onOpenChange(false);
        onFixedAccountSignedIn(acc);
      }}
      onUseAnotherAccount={onUseAnotherAccount}
      previewOnly={previewOnly}
      onClose={() => onOpenChange(false)}
    />
  );

  if (isMobile) {
    return (
      <MobileDrawer open={open} onOpenChange={onOpenChange} hideCloseButton>
        {body}
      </MobileDrawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] p-0 gap-0 bg-background border-border/60 overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>Choose an account</DialogTitle>
        </VisuallyHidden>
        <div className="px-2 pt-4 pb-2">{body}</div>
      </DialogContent>
    </Dialog>
  );
};
