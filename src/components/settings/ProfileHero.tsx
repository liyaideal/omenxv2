import { User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Settings › Profile hero (CPO 2026-09-22, mock v5 §0 option A).
 *
 * Wallet `HeroEquityCard` literal: `rounded-[18px] p-[34px_36px]`,
 * micro-label → display "number" (here the username, 40px) → 13px meta,
 * pill CTAs bottom-right (`items-end`). Compact (mobile) = Wallet's compact
 * variant: p-5, 22px name, two h-11 pills in a 2-col grid underneath.
 * The hero-art slot (Wallet: hero-thread.webp, object-right) is left empty
 * until an asset is supplied — never fabricated in CSS.
 *
 * No username → display slot reads "Set a username" in muted 500 and the
 * primary pill reads "Set username" (rule 3). Avatar click and the
 * `Change avatar` pill both open the existing picker (rule 4).
 */
export const ProfileHero = ({
  username,
  avatarUrl,
  fallbackInitial,
  userId,
  joinDate,
  onEditUsername,
  onChangeAvatar,
  compact = false,
}: {
  username: string | null;
  avatarUrl: string | null;
  fallbackInitial?: string | null;
  userId: string;
  joinDate: string;
  onEditUsername: () => void;
  onChangeAvatar: () => void;
  compact?: boolean;
}) => {
  const initial = fallbackInitial?.charAt(0).toUpperCase();
  const avatar = (
    <button
      type="button"
      onClick={onChangeAvatar}
      aria-label="Change avatar"
      className="shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
    >
      <Avatar className={cn("border-2 border-primary/50", compact ? "w-14 h-14" : "w-[72px] h-[72px]")}>
        <AvatarImage src={avatarUrl ?? undefined} alt="" />
        <AvatarFallback className="bg-primary/20 text-primary text-xl">
          {initial || <User className="w-7 h-7" />}
        </AvatarFallback>
      </Avatar>
    </button>
  );

  const name = (
    <div
      className={cn(
        "font-display font-bold leading-[0.96] truncate",
        compact ? "text-[22px]" : "text-[40px]",
        !username && "text-muted-foreground font-medium",
      )}
    >
      {username || "Set a username"}
    </div>
  );

  const meta = (
    <div className={cn("text-[13px] text-muted-foreground", compact ? "mt-1.5" : "mt-2.5")}>
      <span className="font-mono">ID #{userId}</span>
      <span className="mx-2">·</span>
      Joined {joinDate}
    </div>
  );

  const primaryLabel = username ? "Edit username" : "Set username";

  if (compact) {
    return (
      <section className="relative overflow-hidden rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-3.5 min-w-0">
          {avatar}
          <div className="min-w-0">
            {name}
            {meta}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4">
          <Button variant="outline" className="h-11 rounded-full bg-secondary font-semibold" onClick={onEditUsername}>
            {primaryLabel}
          </Button>
          <Button
            variant="ghost"
            className="h-11 rounded-full bg-secondary border border-border/50 text-[#C9CED6] hover:text-foreground"
            onClick={onChangeAvatar}
          >
            Change avatar
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-[18px] border border-border bg-card p-[34px_36px]">
      <div className="relative flex gap-6 flex-col lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-center gap-[22px] min-w-0">
          {avatar}
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-2.5">
              Profile
            </div>
            {name}
            {meta}
          </div>
        </div>
        <div className="flex flex-wrap gap-2.5 lg:shrink-0">
          <Button
            variant="outline"
            className="h-auto py-3 px-[22px] rounded-full bg-secondary font-semibold text-sm"
            onClick={onEditUsername}
          >
            {primaryLabel}
          </Button>
          <Button
            variant="ghost"
            className="h-auto py-3 px-[22px] rounded-full bg-secondary font-semibold text-sm text-[#C9CED6] hover:text-foreground"
            onClick={onChangeAvatar}
          >
            Change avatar
          </Button>
        </div>
      </div>
    </section>
  );
};
