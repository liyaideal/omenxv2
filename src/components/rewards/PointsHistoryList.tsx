import { formatDistanceToNow } from "date-fns";
import { ArrowUpRight, ArrowDownRight, Lock, Clock, AlertCircle, Gift } from "lucide-react";
import { Card } from "@/components/ui/card";
import { usePoints, PointsLedgerEntry } from "@/hooks/usePoints";
import { EmptyState, LoadingState } from "@/components/states";

const getTypeIcon = (type: PointsLedgerEntry['type']) => {
  switch (type) {
    case 'earn':
      return <ArrowUpRight className="w-4 h-4 text-trading-green" />;
    case 'spend':
      return <ArrowDownRight className="w-4 h-4 text-trading-red" />;
    case 'freeze':
    case 'unfreeze':
      return <Lock className="w-4 h-4 text-yellow-500" />;
    case 'expire':
      return <Clock className="w-4 h-4 text-muted-foreground" />;
    case 'revoke':
      return <AlertCircle className="w-4 h-4 text-trading-red" />;
    case 'adjust':
      return <Gift className="w-4 h-4 text-primary" />;
    default:
      return null;
  }
};

const getTypeLabel = (type: PointsLedgerEntry['type']) => {
  const labels: Record<string, string> = {
    earn: 'Earned',
    spend: 'Spent',
    freeze: 'Frozen',
    unfreeze: 'Unfrozen',
    expire: 'Expired',
    revoke: 'Revoked',
    adjust: 'Adjusted',
  };
  return labels[type] || type;
};

const getSourceLabel = (source: PointsLedgerEntry['source']) => {
  const labels: Record<string, string> = {
    task: 'Task',
    referral: 'Referral',
    redeem: 'Redemption',
    admin: 'Admin',
    system: 'System',
    social: 'Social',
  };
  return labels[source] || source;
};

export const PointsHistoryList = () => {
  const { pointsHistory, isLoadingHistory } = usePoints();

  if (isLoadingHistory) {
    return <LoadingState label="Loading history…" variant="skeleton" skeletonRows={3} />;
  }

  if (!pointsHistory || pointsHistory.length === 0) {
    return (
      <EmptyState
        variant="inline"
        icon={Clock}
        title="No points history yet"
        description="Complete tasks to start earning points."
      />
    );
  }

  return (
    <div className="space-y-2">
      {pointsHistory.map((entry) => (
        <Card key={entry.id} className="p-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              {getTypeIcon(entry.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{getTypeLabel(entry.type)}</span>
                <span className="text-xs text-muted-foreground px-1.5 py-0.5 bg-muted rounded">
                  {getSourceLabel(entry.source)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {(entry.description || 'Points transaction').replace(/trial balance/gi, 'trial bonus')}
              </p>
            </div>
            <div className="text-right">
              <p className={`font-bold font-mono text-sm ${
                entry.amount > 0 ? 'text-trading-green' : 'text-trading-red'
              }`}>
                {entry.amount > 0 ? '+' : ''}{entry.amount}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
