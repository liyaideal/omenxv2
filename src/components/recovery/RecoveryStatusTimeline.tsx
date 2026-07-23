import { CheckCircle2, Loader2, XCircle, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RecoveryStatus } from '@/hooks/useRecoveryRequests';

interface Step {
  key: RecoveryStatus;
  label: string;
}

const STEPS: Step[] = [
  { key: 'submitted', label: 'Submitted' },
  { key: 'completed', label: 'Completed' },
];

interface RecoveryStatusTimelineProps {
  status: RecoveryStatus;
}

export const RecoveryStatusTimeline = ({ status }: RecoveryStatusTimelineProps) => {
  if (status === 'rejected') {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
        <XCircle className="w-5 h-5 text-destructive shrink-0" />
        <div className="text-sm">
          <div className="font-medium text-destructive">Request rejected</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            See note below for details.
          </div>
        </div>
      </div>
    );
  }

  const currentIdx = status === 'completed' ? 1 : 0;

  return (
    <div className="flex items-center gap-3">
      {STEPS.map((step, idx) => {
        const isDone = idx < currentIdx || status === 'completed';
        const isCurrent = idx === currentIdx && status !== 'completed';
        return (
          <div key={step.key} className="flex items-center gap-3 flex-1">
            <div className="flex items-center gap-2.5 flex-1">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border shrink-0',
                  isDone && 'bg-trading-green/20 border-trading-green/40 text-trading-green',
                  isCurrent && 'bg-primary/20 border-primary/50 text-primary',
                  !isDone && !isCurrent && 'bg-muted border-border text-muted-foreground'
                )}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  idx + 1
                )}
              </div>
              <div
                className={cn(
                  'text-sm font-medium',
                  isDone && 'text-trading-green',
                  isCurrent && 'text-primary',
                  !isDone && !isCurrent && 'text-muted-foreground'
                )}
              >
                {step.label}
              </div>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  'h-px flex-1',
                  isDone ? 'bg-trading-green/40' : 'bg-border'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

// Status badge for list rows
export const RecoveryStatusBadge = ({ status }: { status: RecoveryStatus }) => {
  const cfg: Record<RecoveryStatus, { label: string; cls: string; Icon: typeof Send }> = {
    submitted: {
      label: 'Processing',
      cls: 'bg-primary/10 text-primary border-primary/30',
      Icon: Loader2,
    },
    completed: {
      label: 'Completed',
      cls: 'bg-trading-green/10 text-trading-green border-trading-green/30',
      Icon: CheckCircle2,
    },
    rejected: {
      label: 'Rejected',
      cls: 'bg-destructive/10 text-destructive border-destructive/30',
      Icon: XCircle,
    },
  };
  const { label, cls, Icon } = cfg[status];
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-medium', cls)}>
      <Icon className={cn('w-3 h-3', status === 'submitted' && 'animate-spin')} />
      {label}
    </span>
  );
};
