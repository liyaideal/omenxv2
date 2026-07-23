import { Gift, CheckCircle2, Star, ArrowRight, TrendingUp, Share2, Users, Link, Lock } from "lucide-react";
import { TaskIcon } from "@/components/rewards/TaskIcon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TaskWithProgress } from "@/hooks/useTasks";

interface TaskCardProps {
  task: TaskWithProgress;
  onClaim: (taskId: string) => void;
  isClaiming: boolean;
  onGoComplete?: (task: TaskWithProgress) => void;
  /** If true, the "Go" button is disabled with a prerequisite hint */
  prerequisiteBlocked?: boolean;
  prerequisiteHint?: string;
}

// Map trigger actions to button config
const getGoButtonConfig = (action: string): { label: string; icon: React.ReactNode } | null => {
  switch (action) {
    case 'first_trade':
      return { label: 'Go Trade', icon: <TrendingUp className="w-4 h-4 mr-2" /> };
    case 'share_x':
      return { label: 'Go Share', icon: <Share2 className="w-4 h-4 mr-2" /> };
    case 'referral_qualified':
      return { label: 'Go Invite', icon: <Users className="w-4 h-4 mr-2" /> };
    case 'join_discord':
      return { label: 'Join Discord', icon: <Users className="w-4 h-4 mr-2" /> };
    case 'connect_external':
      return { label: 'Go Connect', icon: <Link className="w-4 h-4 mr-2" /> };
    case 'activate_airdrop':
      return { label: 'Go Trade', icon: <TrendingUp className="w-4 h-4 mr-2" /> };
    default:
      return null;
  }
};

export function TaskCard({ task, onClaim, isClaiming, onGoComplete, prerequisiteBlocked, prerequisiteHint }: TaskCardProps) {
  const isPending = !task.isCompleted && !task.isClaimed;
  const isClaimable = task.isCompleted && !task.isClaimed;
  const isClaimed = task.isClaimed;

  // Check if this task has an actionable "Go Complete" state
  const triggerAction = task.trigger_condition?.action as string;
  const goButtonConfig = getGoButtonConfig(triggerAction);
  const canGoComplete = isPending && goButtonConfig !== null;

  const handleGoComplete = () => {
    if (onGoComplete) {
      onGoComplete(task);
    }
  };

  return (
    <Card
      className={`trading-card overflow-hidden transition-all duration-200 relative ${
        isClaimed ? 'opacity-60' : isClaimable ? 'border-primary/40 glow-primary' : ''
      }`}
    >
      {/* Decorative Icon Watermark */}
      <div className="absolute top-3 right-3 pointer-events-none">
        <TaskIcon 
          icon={task.icon} 
          size={48} 
          className={`${
            isClaimed 
              ? 'text-trading-green/10' 
              : isClaimable 
                ? 'text-primary/15' 
                : 'text-muted-foreground/10'
          }`}
        />
      </div>

      <div className="p-4 relative">
        {/* Header: Points Badge + Status */}
        <div className="flex items-center gap-2 mb-2">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs ${
            isClaimable 
              ? 'bg-primary/15 text-primary' 
              : 'bg-muted text-muted-foreground'
          }`}>
            <Star className="w-3 h-3" />
            <span className="font-bold font-mono">+{task.reward_points}</span>
          </div>
          {isClaimed && (
            <div className="flex items-center gap-1 text-trading-green text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="font-medium">Completed</span>
            </div>
          )}
        </div>

        {/* Title + Description */}
        <div className="mb-3 pr-12">
          <h4 className="font-semibold text-base mb-0.5">{task.name}</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">{task.description}</p>
        </div>

        {/* Action Area */}
        {!isClaimed && (
          isClaimable ? (
            <Button 
              className="btn-primary w-full"
              onClick={() => onClaim(task.id)}
              disabled={isClaiming}
            >
              <Gift className="w-4 h-4 mr-2" />
              Claim Reward
            </Button>
          ) : canGoComplete && goButtonConfig ? (
            prerequisiteBlocked ? (
              <div className="w-full text-center py-2 text-sm text-muted-foreground border border-dashed border-border rounded-lg flex items-center justify-center gap-2">
                <Lock className="w-3.5 h-3.5" />
                {prerequisiteHint || "Complete prerequisite task first"}
              </div>
            ) : (
              <Button 
                variant="outline"
                className="w-full border-primary/50 text-primary hover:bg-primary/10"
                onClick={handleGoComplete}
              >
                {goButtonConfig.icon}
                {goButtonConfig.label}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )
          ) : (
            <div className="w-full text-center py-2 text-sm text-muted-foreground border border-dashed border-border rounded-lg">
              Complete task to unlock
            </div>
          )
        )}
      </div>
    </Card>
  );
}
