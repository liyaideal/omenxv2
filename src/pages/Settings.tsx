import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, User, Copy, Check, AlertTriangle, Plus, Camera, Mail, Star, Shield, LogOut, Key } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { EventsDesktopHeader } from "@/components/EventsDesktopHeader";
import { PageHeader } from "@/components/PageHeader";
import { BottomNav } from "@/components/BottomNav";
import { MobileHeader } from "@/components/MobileHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile, AVATAR_SEEDS, AVATAR_BACKGROUNDS, generateAvatarUrl } from "@/hooks/useUserProfile";
import { toast } from "sonner";
import { LoadingState } from "@/components/states";
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
  MobileDrawerList,
  MobileDrawerListItem,
  MobileDrawerStatus,
} from "@/components/ui/mobile-drawer";
import { ScrollArea } from "@/components/ui/scroll-area";

import { GoogleIcon } from "@/components/icons/GoogleIcon";
import { TelegramIcon } from "@/components/icons/TelegramIcon";
import { Wallet } from "lucide-react";
import { ConnectedAccountsCard } from "@/components/settings/ConnectedAccountsCard";
import { AccountSecurityCard } from "@/components/settings/AccountSecurityCard";
import { WithdrawalVerificationCard } from "@/components/settings/WithdrawalVerificationCard";

const AUTH_METHOD_INFO: Record<string, { label: string; icon: React.ReactNode; color: string; description: string }> = {
  google: { label: "Google", icon: <GoogleIcon className="w-5 h-5" />, color: "text-blue-400", description: "Google Account" },
  telegram: { label: "Telegram", icon: <TelegramIcon className="w-5 h-5" />, color: "text-sky-400", description: "Telegram Account" },
  wallet: { label: "Wallet", icon: <Wallet className="w-5 h-5 text-purple-400" />, color: "text-purple-400", description: "Web3 Wallet" },
};

const Settings = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { profile, user, isLoading: profileLoading, updateUsername, updateAvatar, updateEmail, refetchProfile } = useUserProfile();
  
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
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).replace(/\//g, "-");
  };

  // Generate avatar grid
  const avatarOptions = useMemo(() => 
    AVATAR_SEEDS.flatMap((seed, seedIndex) => 
      AVATAR_BACKGROUNDS.map((bg, bgIndex) => ({
        seed,
        bgIndex,
        url: generateAvatarUrl(seed, bgIndex),
        key: `${seed}-${bgIndex}`
      }))
    ).slice(0, 80),
  []);

  // Profile data
  const username = profile?.username || null;
  const email = profile?.email || user?.email || null;
  const avatarUrl = profile?.avatar_url || null;
  const userId = user?.id?.slice(0, 6) || "123456";
  const joinDate = formatDate(profile?.created_at || user?.created_at);

  // Auth provider info - read from profile's auth_method column
  const authMethod = (profile as any)?.auth_method || "google";
  const providerInfo = AUTH_METHOD_INFO[authMethod] || AUTH_METHOD_INFO.google;
  const providerEmail = email;

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <LoadingState label="Loading profile…" />
      </div>
    );
  }

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
              selectedAvatar === avatar.url
                ? "ring-2 ring-primary bg-primary/20 scale-105"
                : "hover:bg-muted"
            }`}
          >
            <img
              src={avatar.url}
              alt={`Avatar ${avatar.seed}`}
              className="w-full aspect-square rounded-lg"
            />
          </button>
        ))}
      </div>
    </div>
  );

  // Profile Card
  const ProfileCard = () => (
    <div className="trading-card p-4 md:p-6">
      <div className="flex items-start gap-4">
        <div className="relative">
          <Avatar className="w-16 h-16 md:w-20 md:h-20 border-2 border-primary/50">
            <AvatarImage src={avatarUrl} alt="User" />
            <AvatarFallback className="bg-primary/20 text-primary text-xl">
              {(username || email)?.charAt(0).toUpperCase() || <User className="w-8 h-8" />}
            </AvatarFallback>
          </Avatar>
          <button
            onClick={() => setAvatarDialogOpen(true)}
            className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
          >
            <Camera className="w-3.5 h-3.5 text-primary-foreground" />
          </button>
        </div>
        
        <div className="flex-1 min-w-0">
          <span className="text-lg font-semibold">
            {username ? username : "Username Not Set"}
          </span>
          
          {isMobile ? (
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">User ID</span>
                <span className="font-mono">#{userId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Join Date</span>
                <span>{joinDate}</span>
              </div>
            </div>
          ) : (
            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
              <p>User ID: #{userId}</p>
              <p>Joined {joinDate}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Username Card
  const UsernameCard = () => (
    <div className="trading-card p-4 md:p-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold mb-1">Username</h3>
          <p className="text-sm text-muted-foreground">
            {username || "Not Set"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Used for display and @mentions
          </p>
        </div>
        <Button
          onClick={() => {
            setNewUsername(username || "");
            setUsernameDialogOpen(true);
          }}
          className="btn-primary h-9 px-4"
        >
          {username ? "Edit" : "Set Now"}
        </Button>
      </div>
    </div>
  );

  // Email Card
  const EmailCard = () => (
    <div className="trading-card p-4 md:p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold mb-1">Email Address</h3>
          <p className="text-sm text-muted-foreground">
            {email || "Not Set"}
          </p>
        </div>
        <Button
          onClick={() => {
            setNewEmail(email || "");
            setEmailDialogOpen(true);
          }}
          className="btn-primary h-9 px-4"
        >
          {email ? "Edit" : "Add Email"}
        </Button>
      </div>
      
      {!email && (
        <div className="bg-trading-yellow/10 border border-trading-yellow/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-trading-yellow shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="font-medium text-trading-yellow">Recommended to Add Email</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Receive important security notifications</li>
                <li>Account recovery and verification</li>
                <li>Get updates and activity information</li>
              </ul>
              <Button
                onClick={() => setEmailDialogOpen(true)}
                className="mt-2 h-8 px-4 bg-trading-yellow/80 hover:bg-trading-yellow text-background font-medium"
              >
                Add Now
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Linked Account Card - shows which auth provider/email was used to sign in
  const LinkedAccountCard = () => (
    <div className="trading-card p-4 md:p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold mb-1">Linked Account</h3>
          <p className="text-xs text-muted-foreground">
            The account you used to sign in
          </p>
        </div>
      </div>
      
      <div className="bg-muted/30 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
            {providerInfo.icon}
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-medium text-sm">{providerInfo.label}</span>
            {providerEmail && (
              <p className="text-sm font-mono text-muted-foreground truncate mt-0.5">
                {providerEmail}
              </p>
            )}
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-3">
        You signed in via <span className={`font-medium ${providerInfo.color}`}>{providerInfo.label}</span>.
        This cannot be changed. To use a different account, sign out and sign in again.
      </p>
    </div>
  );

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <MobileHeader title="Settings" showLogo={false} showBack={true} />

        <div className="px-4 py-6 space-y-4">
          <ProfileCard />
          <UsernameCard />
          <EmailCard />
          <LinkedAccountCard />
          <ConnectedAccountsCard />
          <AccountSecurityCard />
          <WithdrawalVerificationCard />
          
          {/* Transparency Audit entry */}
          <button
            onClick={() => navigate("/settings/transparency")}
            className="trading-card p-4 w-full text-left flex items-center gap-3 hover:border-primary/30 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-trading-green/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-trading-green" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">Transparency Audit</h3>
              <p className="text-xs text-muted-foreground">Verify assets, trades & liquidations on-chain</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* API Management entry */}
          <button
            onClick={() => navigate("/settings/api")}
            className="trading-card p-4 w-full text-left flex items-center gap-3 hover:border-primary/30 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Key className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">API Management</h3>
              <p className="text-xs text-muted-foreground">Create and manage API keys for programmatic trading</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <BottomNav />
        
        {/* Avatar Picker Drawer */}
        <MobileDrawer
          open={avatarDialogOpen}
          onOpenChange={setAvatarDialogOpen}
          title="Choose Avatar"
        >
          {renderAvatarGrid("max-h-[50vh]")}
          <MobileDrawerActions>
            <Button
              onClick={handleSelectAvatar}
              disabled={!selectedAvatar || isUpdating}
              className="w-full btn-primary h-12"
            >
              {isUpdating ? "Saving..." : "Save Avatar"}
            </Button>
          </MobileDrawerActions>
        </MobileDrawer>

        {/* Username Drawer */}
        <MobileDrawer
          open={usernameDialogOpen}
          onOpenChange={setUsernameDialogOpen}
          title="Set Username"
        >
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
                3-20 characters, letters, numbers, and underscores only
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
          title={emailStep === "input" 
            ? (email ? "Edit Email Address" : "Add Email Address")
            : "Verify Email"
          }
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
              <Button
                onClick={handleSendVerificationCode}
                disabled={!newEmail.trim()}
                className="w-full btn-primary h-12"
              >
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
                <InputOTP
                  maxLength={6}
                  value={verificationCode}
                  onChange={setVerificationCode}
                >
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
      
      <main className="mx-auto w-full max-w-3xl px-8 py-10 space-y-6">
        <PageHeader title="Account Settings" subtitle="Manage your basic account information" />

        <div className="space-y-6">
          <ProfileCard />
          <UsernameCard />
          <EmailCard />
          <LinkedAccountCard />
          <ConnectedAccountsCard />
          <AccountSecurityCard />
          <WithdrawalVerificationCard />
          
          {/* Transparency Audit entry */}
          <button
            onClick={() => navigate("/settings/transparency")}
            className="trading-card p-6 w-full text-left flex items-center gap-4 hover:border-primary/30 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-trading-green/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-trading-green" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Transparency Audit</h3>
              <p className="text-sm text-muted-foreground">Verify your assets, trades, and liquidations against on-chain data</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* API Management entry */}
          <button
            onClick={() => navigate("/settings/api")}
            className="trading-card p-6 w-full text-left flex items-center gap-4 hover:border-primary/30 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Key className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">API Management</h3>
              <p className="text-sm text-muted-foreground">Create and manage API keys for programmatic trading</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </main>

      {/* Avatar Picker Dialog */}
      <Dialog open={avatarDialogOpen} onOpenChange={setAvatarDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Choose Avatar</DialogTitle>
            <DialogDescription>
              Select an avatar from our collection
            </DialogDescription>
          </DialogHeader>
          {renderAvatarGrid("max-h-[380px]")}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAvatarDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSelectAvatar} 
              disabled={!selectedAvatar || isUpdating} 
              className="btn-primary"
            >
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
            <DialogDescription>
              Choose a username for display and @mentions
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Enter your username"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="h-12"
              maxLength={20}
            />
            <p className="text-xs text-muted-foreground mt-2">
              3-20 characters, letters, numbers, and underscores only
            </p>
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

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={handleEmailDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {emailStep === "input" 
                ? (email ? "Edit Email Address" : "Add Email Address")
                : "Verify Email"
              }
            </DialogTitle>
            <DialogDescription>
              {emailStep === "input"
                ? (email ? "Update your email for notifications" : "Add an email for security notifications and account recovery")
                : "Enter the verification code to confirm your email"
              }
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
                  Enter the 6-digit code sent to<br />
                  <span className="font-medium text-foreground">{newEmail}</span>
                </p>
              </div>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={verificationCode}
                  onChange={setVerificationCode}
                >
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
                <Button 
                  onClick={handleSendVerificationCode} 
                  disabled={!newEmail.trim()} 
                  className="btn-primary"
                >
                  Send Code
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setEmailStep("input")}>
                  Back
                </Button>
                <Button 
                  onClick={handleVerifyCode} 
                  disabled={isUpdating || verificationCode.length !== 6} 
                  className="btn-primary"
                >
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
