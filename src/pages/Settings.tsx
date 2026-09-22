import { useState, useMemo } from "react";
import { Mail } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { EventsDesktopHeader } from "@/components/EventsDesktopHeader";
import { BottomNav } from "@/components/BottomNav";
import { MobileHeader } from "@/components/MobileHeader";
import { SeoFooter } from "@/components/seo/SeoFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useUserProfile, AVATAR_SEEDS, AVATAR_BACKGROUNDS, generateAvatarUrl } from "@/hooks/useUserProfile";
import { toast } from "sonner";
import { ErrorState, LoadingState } from "@/components/states";
import { LiteAuthGate } from "@/components/auth/LiteAuthGate";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { MobileDrawer, MobileDrawerSection, MobileDrawerActions, MobileDrawerStatus } from "@/components/ui/mobile-drawer";

import { ProfileHero } from "@/components/settings/ProfileHero";
import { LinkedEmailAccountCard } from "@/components/settings/LinkedEmailAccountCard";
import { ProviderSignInCard, type SignInProvider } from "@/components/settings/ProviderSignInCard";
import { AccountSecurityCard } from "@/components/settings/AccountSecurityCard";
import { WithdrawalVerificationCard } from "@/components/settings/WithdrawalVerificationCard";
import { NotificationsCard } from "@/components/settings/NotificationsCard";
import { PreferencesCard } from "@/components/settings/PreferencesCard";
import { SessionsCard } from "@/components/settings/SessionsCard";
import { AccountCard } from "@/components/settings/AccountCard";
import { MoreCard } from "@/components/settings/MoreCard";

/**
 * /settings — Lite ACCOUNT family (CPO 2026-09-22, mock v5; DESIGN.md
 * §Addendum 2026-09-22). Wallet is the reference implementation:
 *   desktop  = `max-w-7xl px-4 lg:px-6 py-10` · full-width ProfileHero →
 *              two-card band (Sign-in + Account security) → 12-grid 8 / 4
 *              (Withdrawal verification / Notifications / Account ·
 *              More / Preferences / Sessions) → SeoFooter. No page title:
 *              the hero is the data opening.
 *   mobile   = MobileHeader preset B (inner, "Settings", back) · single
 *              column `px-4 py-6 space-y-4`, same modules.
 * Guests get the LiteAuthGate (rule 1); a profile fetch error gets the
 * canonical ErrorState with retry (rule 2). Avatar picker, username dialog
 * and the notification-email dialog are the existing flows, unchanged.
 */

export const SETTINGS_GATE_COPY = {
  title: "Sign in to view your settings",
  description: "Manage your profile, security and notifications by signing in to your account.",
  errorTitle: "Couldn't load your settings",
  errorDescription: "Check your connection and try again.",
  errorRetry: "Try again",
} as const;

const Settings = () => {
  const isMobile = useIsMobile();
  const { profile, user, isLoading: profileLoading, error: profileError, updateUsername, updateAvatar, updateEmail, refetchProfile } =
    useUserProfile();

  // Dialog states
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [usernameDialogOpen, setUsernameDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);

  // Form states
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Email verification states
  const [emailStep, setEmailStep] = useState<"input" | "verify">("input");
  const [verificationCode, setVerificationCode] = useState("");

  const handleSelectAvatar = async () => {
    if (!selectedAvatar) return;
    setIsUpdating(true);

    const result = await updateAvatar(selectedAvatar);
    if (result.success) {
      toast.success("Avatar updated successfully");
      setAvatarDialogOpen(false);
      setSelectedAvatar(null);
    } else {
      toast.error(result.error || "Failed to update avatar");
    }
    setIsUpdating(false);
  };

  const handleUpdateUsername = async () => {
    if (!newUsername.trim()) {
      toast.error("Username cannot be empty");
      return;
    }
    setIsUpdating(true);

    const result = await updateUsername(newUsername.trim());
    if (result.success) {
      toast.success("Username updated successfully");
      setUsernameDialogOpen(false);
      setNewUsername("");
    } else {
      toast.error(result.error || "Failed to update username");
    }
    setIsUpdating(false);
  };

  const handleSendVerificationCode = () => {
    if (!newEmail.trim()) {
      toast.error("Email cannot be empty");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }
    setEmailStep("verify");
    toast.success("Verification code sent to " + newEmail);
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      toast.error("Please enter a 6-digit code");
      return;
    }
    setIsUpdating(true);

    await new Promise((resolve) => setTimeout(resolve, 500));

    const result = await updateEmail(newEmail.trim());
    if (result.success) {
      toast.success("Email verified successfully");
      setEmailDialogOpen(false);
      setNewEmail("");
      setVerificationCode("");
      setEmailStep("input");
    } else {
      toast.error(result.error || "Failed to update email");
    }
    setIsUpdating(false);
  };

  const handleEmailDialogClose = (open: boolean) => {
    setEmailDialogOpen(open);
    if (!open) {
      setEmailStep("input");
      setVerificationCode("");
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString)
      .toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
      .replace(/\//g, "-");
  };

  // Generate avatar grid
  const avatarOptions = useMemo(
    () =>
      AVATAR_SEEDS.flatMap((seed) =>
        AVATAR_BACKGROUNDS.map((bg, bgIndex) => ({
          seed,
          bgIndex,
          url: generateAvatarUrl(seed, bgIndex),
          key: `${seed}-${bgIndex}`,
        })),
      ).slice(0, 80),
    [],
  );

  // Profile data
  const username = profile?.username || null;
  const email = profile?.email || user?.email || null;
  const avatarUrl = profile?.avatar_url || null;
  const userId = user?.id?.slice(0, 6) || "123456";
  const joinDate = formatDate(profile?.created_at || user?.created_at);

  // Auth provider — read from profile's auth_method column.
  const authMethod = profile?.auth_method || "google";
  const isEmailUser = authMethod === "email";
  const provider: SignInProvider = authMethod === "wallet" || authMethod === "telegram" ? authMethod : "google";

  const openEditUsername = () => {
    setNewUsername(username || "");
    setUsernameDialogOpen(true);
  };
  const openEditEmail = () => {
    setNewEmail(email || "");
    setEmailDialogOpen(true);
  };

  // Avatar grid JSX
  const renderAvatarGrid = (maxHeight: string) => (
    <div className={`overflow-y-auto ${maxHeight}`}>
      <div className="grid grid-cols-5 gap-3 pr-2">
        {avatarOptions.map((avatar) => (
          <button
            key={avatar.key}
            type="button"
            onClick={() => setSelectedAvatar(avatar.url)}
            className={`relative rounded-xl p-1 transition-all ${
              selectedAvatar === avatar.url ? "ring-2 ring-primary bg-primary/20 scale-105" : "hover:bg-muted"
            }`}
          >
            <img src={avatar.url} alt={`Avatar ${avatar.seed}`} className="w-full aspect-square rounded-lg" />
          </button>
        ))}
      </div>
    </div>
  );

  const hero = (
    <ProfileHero
      username={username}
      avatarUrl={avatarUrl}
      fallbackInitial={username || email}
      userId={userId}
      joinDate={joinDate}
      onEditUsername={openEditUsername}
      onChangeAvatar={() => setAvatarDialogOpen(true)}
      compact={isMobile}
    />
  );

  const signInCard = isEmailUser ? (
    <LinkedEmailAccountCard />
  ) : (
    <ProviderSignInCard
      provider={provider}
      providerValue={provider === "google" ? email : null}
      notificationEmail={email}
      onEditEmail={openEditEmail}
    />
  );

  const body = profileLoading ? (
    <LoadingState label="Loading profile…" />
  ) : profileError ? (
    <ErrorState
      title={SETTINGS_GATE_COPY.errorTitle}
      description={SETTINGS_GATE_COPY.errorDescription}
      retryLabel={SETTINGS_GATE_COPY.errorRetry}
      onRetry={() => refetchProfile()}
      className="my-6"
    />
  ) : isMobile ? (
    <div className="space-y-4">
      {hero}
      {signInCard}
      <AccountSecurityCard />
      <WithdrawalVerificationCard />
      <MoreCard />
      <NotificationsCard onAddEmail={openEditEmail} />
      <PreferencesCard />
      <SessionsCard />
      <AccountCard />
    </div>
  ) : (
    <>
      {/* Band 1 · data opening — the hero IS the opening; no page h1. */}
      {hero}

      {/* Band 2 · identity pair */}
      <section className="grid grid-cols-2 gap-6">
        {signInCard}
        <AccountSecurityCard />
      </section>

      {/* Band 3 · 12-grid 8 / 4 */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8 space-y-6">
          <WithdrawalVerificationCard />
          <NotificationsCard onAddEmail={openEditEmail} />
          <AccountCard />
        </div>
        <div className="col-span-4 space-y-6">
          <MoreCard />
          <PreferencesCard />
          <SessionsCard />
        </div>
      </div>
    </>
  );

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <MobileHeader title="Settings" showLogo={false} showBack />

        <LiteAuthGate title={SETTINGS_GATE_COPY.title} description={SETTINGS_GATE_COPY.description}>
          <div className="px-4 py-6">{body}</div>
        </LiteAuthGate>

        <BottomNav />

        {/* Avatar Picker Drawer */}
        <MobileDrawer open={avatarDialogOpen} onOpenChange={setAvatarDialogOpen} title="Choose Avatar">
          {renderAvatarGrid("max-h-[50vh]")}
          <MobileDrawerActions>
            <Button onClick={handleSelectAvatar} disabled={!selectedAvatar || isUpdating} className="w-full btn-primary h-12">
              {isUpdating ? "Saving..." : "Save Avatar"}
            </Button>
          </MobileDrawerActions>
        </MobileDrawer>

        {/* Username Drawer */}
        <MobileDrawer open={usernameDialogOpen} onOpenChange={setUsernameDialogOpen} title="Set Username">
          <MobileDrawerSection>
            <div>
              <Input
                placeholder="Enter your username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="h-12"
                maxLength={20}
              />
              <p className="text-xs text-muted-foreground mt-2">
                3-20 characters, letters, numbers, and underscores only. Used for display and @mentions.
              </p>
            </div>
            <Button
              onClick={handleUpdateUsername}
              disabled={isUpdating || !newUsername.trim()}
              className="w-full btn-primary h-12"
            >
              {isUpdating ? "Saving..." : "Confirm"}
            </Button>
          </MobileDrawerSection>
        </MobileDrawer>

        {/* Email Drawer */}
        <MobileDrawer
          open={emailDialogOpen}
          onOpenChange={handleEmailDialogClose}
          title={emailStep === "input" ? (email ? "Edit Email Address" : "Add Email Address") : "Verify Email"}
        >
          {emailStep === "input" ? (
            <MobileDrawerSection>
              <Input
                type="email"
                placeholder="Enter your email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="h-12"
              />
              <Button onClick={handleSendVerificationCode} disabled={!newEmail.trim()} className="w-full btn-primary h-12">
                Send Verification Code
              </Button>
            </MobileDrawerSection>
          ) : (
            <MobileDrawerSection>
              <MobileDrawerStatus
                icon={<Mail className="w-8 h-8 text-primary" />}
                title=""
                description={`Enter the 6-digit code sent to ${newEmail}`}
              />
              <div className="flex justify-center -mt-4">
                <InputOTP maxLength={6} value={verificationCode} onChange={setVerificationCode}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button
                onClick={handleVerifyCode}
                disabled={isUpdating || verificationCode.length !== 6}
                className="w-full btn-primary h-12"
              >
                {isUpdating ? "Verifying..." : "Verify"}
              </Button>
              <button
                onClick={() => setEmailStep("input")}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Change email address
              </button>
            </MobileDrawerSection>
          )}
        </MobileDrawer>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="min-h-screen bg-background">
      <EventsDesktopHeader />

      <LiteAuthGate title={SETTINGS_GATE_COPY.title} description={SETTINGS_GATE_COPY.description}>
        <main className="mx-auto w-full max-w-7xl px-4 py-10 lg:px-6 space-y-6">{body}</main>
      </LiteAuthGate>

      <SeoFooter />

      {/* Avatar Picker Dialog */}
      <Dialog open={avatarDialogOpen} onOpenChange={setAvatarDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Choose Avatar</DialogTitle>
            <DialogDescription>Select an avatar from our collection</DialogDescription>
          </DialogHeader>
          {renderAvatarGrid("max-h-[380px]")}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAvatarDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSelectAvatar} disabled={!selectedAvatar || isUpdating} className="btn-primary">
              {isUpdating ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Username Dialog */}
      <Dialog open={usernameDialogOpen} onOpenChange={setUsernameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Username</DialogTitle>
            <DialogDescription>Choose a username for display and @mentions</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Enter your username"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="h-12"
              maxLength={20}
            />
            <p className="text-xs text-muted-foreground mt-2">3-20 characters, letters, numbers, and underscores only</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUsernameDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUsername} disabled={isUpdating} className="btn-primary">
              {isUpdating ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Dialog (notification email — provider accounts) */}
      <Dialog open={emailDialogOpen} onOpenChange={handleEmailDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {emailStep === "input" ? (email ? "Edit Email Address" : "Add Email Address") : "Verify Email"}
            </DialogTitle>
            <DialogDescription>
              {emailStep === "input"
                ? email
                  ? "Update your email for notifications"
                  : "Add an email for security notifications and account recovery"
                : "Enter the verification code to confirm your email"}
            </DialogDescription>
          </DialogHeader>

          {emailStep === "input" ? (
            <div className="py-4">
              <Input
                type="email"
                placeholder="Enter your email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="h-12"
              />
            </div>
          ) : (
            <div className="py-4 space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Enter the 6-digit code sent to
                  <br />
                  <span className="font-medium text-foreground">{newEmail}</span>
                </p>
              </div>
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={verificationCode} onChange={setVerificationCode}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>
          )}

          <DialogFooter>
            {emailStep === "input" ? (
              <>
                <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSendVerificationCode} disabled={!newEmail.trim()} className="btn-primary">
                  Send Code
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setEmailStep("input")}>
                  Back
                </Button>
                <Button onClick={handleVerifyCode} disabled={isUpdating || verificationCode.length !== 6} className="btn-primary">
                  {isUpdating ? "Verifying..." : "Verify"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
