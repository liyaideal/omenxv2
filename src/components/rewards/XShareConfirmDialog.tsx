import { useState } from "react";
import { Shield, ExternalLink } from "lucide-react";
import { XIcon } from "@/components/icons/XIcon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { MobileDrawer } from "@/components/ui/mobile-drawer";

interface XShareConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tweetContent: string;
  referralLink: string;
  onConfirm: () => void;
  isPosting?: boolean;
}

function TweetPreview({ content }: { content: string }) {
  return (
    <Card className="bg-muted/50 border-border/50 p-4 rounded-xl">
      <div className="flex items-start gap-3">
        {/* X avatar placeholder */}
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
          <XIcon size={16} className="text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-sm font-semibold">Your X Account</span>
            <span className="text-xs text-muted-foreground">@you</span>
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {content}
          </p>
        </div>
      </div>
    </Card>
  );
}

function DialogBody({
  tweetContent,
  onConfirm,
  onCancel,
  isPosting,
}: {
  tweetContent: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPosting?: boolean;
}) {
  return (
    <div className="space-y-5">
      {/* Auth notice */}
      <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
        <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="text-sm text-muted-foreground">
          <p>
            We'll request one-time authorization to post this tweet on your behalf. 
            We will <span className="text-foreground font-medium">only</span> post this exact content — nothing else.
          </p>
        </div>
      </div>

      {/* Tweet preview */}
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-medium">
          Tweet Preview
        </p>
        <TweetPreview content={tweetContent} />
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <Button
          className="w-full btn-primary gap-2"
          onClick={onConfirm}
          disabled={isPosting}
        >
          <XIcon size={16} />
          {isPosting ? "Authorizing..." : "Authorize & Post"}
          {!isPosting && <ExternalLink className="w-3.5 h-3.5" />}
        </Button>
        <Button
          variant="ghost"
          className="w-full text-muted-foreground"
          onClick={onCancel}
          disabled={isPosting}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

export function XShareConfirmDialog({
  open,
  onOpenChange,
  tweetContent,
  onConfirm,
  isPosting,
}: XShareConfirmDialogProps) {
  const isMobile = useIsMobile();

  const title = "Share on X";
  const description = "Authorize us to post a tweet from your account";

  const body = (
    <DialogBody
      tweetContent={tweetContent}
      onConfirm={onConfirm}
      onCancel={() => onOpenChange(false)}
      isPosting={isPosting}
    />
  );

  if (isMobile) {
    return (
      <MobileDrawer
        open={open}
        onOpenChange={onOpenChange}
        title={title}
        description={description}
      >
        {body}
      </MobileDrawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XIcon size={20} />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}
