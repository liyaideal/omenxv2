import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { PROFILE_QUERY_KEY } from "@/hooks/useUserProfile";

interface DemoAccountsBlockProps {
  onSuccess?: () => void;
}

/**
 * Two persistent demo accounts (matched / welcome) for QA preview of
 * different first-login airdrop modal states. NOT used in production
 * auth dialog — surfaced only via /style-guide UserIdentity section.
 *
 * See mem://features/demo-accounts-fixed-identities and
 * mem://workflow/no-demo-entries-in-product.
 */
export const DemoAccountsBlock = ({ onSuccess }: DemoAccountsBlockProps) => {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const handleDemoAccountLogin = async (scenario: "matched" | "welcome") => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("ensure-demo-user", {
        body: { scenario },
      });
      if (fnError || data?.error) throw new Error(fnError?.message || data?.error);

      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
      toast.success(
        scenario === "matched"
          ? "Signed in as Matched demo user"
          : "Signed in as Welcome gift demo user",
      );
      onSuccess?.();
    } catch (e: any) {
      console.error("Demo login error:", e);
      toast.error(e.message || "Demo login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border border-dashed border-border/60 rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">Demo accounts</p>
        <span className="text-[10px] text-muted-foreground/70">For demo only</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={isLoading}
          onClick={() => handleDemoAccountLogin("matched")}
          className="h-9 text-xs"
        >
          Matched user (A)
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={isLoading}
          onClick={() => handleDemoAccountLogin("welcome")}
          className="h-9 text-xs"
        >
          Welcome gift user (B)
        </Button>
      </div>
    </div>
  );
};
