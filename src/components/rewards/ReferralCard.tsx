import { useState } from "react";
import { Copy, Share2, Users, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useReferral } from "@/hooks/useReferral";
import { useUserProfile } from "@/hooks/useUserProfile";
import { ReferralShareModal } from "./ReferralShareModal";
import { XShareConfirmDialog } from "./XShareConfirmDialog";

export const ReferralCard = () => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [showXShareDialog, setShowXShareDialog] = useState(false);
  const { 
    referralCode, 
    referralLink, 
    copyReferralLink, 
    stats,
    isLoading 
  } = useReferral();
  const { profile } = useUserProfile();

  if (isLoading) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="h-32 bg-muted rounded" />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Referral Code Card */}
      <Card className="trading-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Invite Friends</h3>
            <p className="text-sm text-muted-foreground">Earn 200 points per qualified referral</p>
          </div>
        </div>

        {/* Referral Code Display */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={referralCode}
              readOnly
              className="font-mono text-center text-lg tracking-wider"
            />
            <Button variant="outline" size="icon" onClick={copyReferralLink}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>

          {/* Action Buttons - 3 columns */}
          <div className="grid grid-cols-3 gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={copyReferralLink}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
            <Button 
              variant="outline"
              className="flex-1"
              onClick={() => setShowShareModal(true)}
            >
              <Image className="w-4 h-4 mr-2" />
              Poster
            </Button>
            <Button 
              className="flex-1 btn-primary"
              onClick={() => setShowXShareDialog(true)}
            >
              <Share2 className="w-4 h-4 mr-2" />
              X
            </Button>
          </div>
        </div>
      </Card>

      {/* Share Modal with Poster */}
      <ReferralShareModal
        open={showShareModal}
        onOpenChange={setShowShareModal}
        referralCode={referralCode}
        referralLink={referralLink}
        username={profile?.username || undefined}
        avatarUrl={profile?.avatar_url || undefined}
      />

      {/* X Share Authorization Dialog */}
      <XShareConfirmDialog
        open={showXShareDialog}
        onOpenChange={setShowXShareDialog}
        tweetContent={`🎯 What if you could trade predictions with leverage? Now you can. OmenX Beta is LIVE - claim test funds & earn points. Join now 👇\n${referralLink}`}
        referralLink={referralLink}
        onConfirm={() => {
          // TODO: Call edge function to authorize & post via X API
          console.log("X share confirmed from referral card");
          setShowXShareDialog(false);
        }}
      />

      {/* Stats Card */}
      <Card className="trading-card p-4">
        <h4 className="font-medium mb-3">Referral Stats</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary font-mono">{stats.totalReferrals}</p>
            <p className="text-xs text-muted-foreground">Total Invites</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-trading-green font-mono">{stats.qualified}</p>
            <p className="text-xs text-muted-foreground">Qualified</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold font-mono">{stats.totalPointsEarned}</p>
            <p className="text-xs text-muted-foreground">Points Earned</p>
          </div>
        </div>
      </Card>

      {/* How it works */}
      <Card className="trading-card p-4">
        <h4 className="font-medium mb-3">How It Works</h4>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">
              1
            </div>
            <p className="text-sm text-muted-foreground">
              Share your unique referral link with friends
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">
              2
            </div>
            <p className="text-sm text-muted-foreground">
              They sign up and complete their first trade
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">
              3
            </div>
            <p className="text-sm text-muted-foreground">
              You earn 200 points automatically!
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
