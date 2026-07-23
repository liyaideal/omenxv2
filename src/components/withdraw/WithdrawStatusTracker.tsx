import { CheckCircle2, Clock, Loader2, XCircle, ExternalLink, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TokenConfig } from '@/types/deposit';
import { WithdrawRecord, WithdrawStatus } from '@/types/withdraw';
import { MonoText, LabelText } from '@/components/typography';
import { cn } from '@/lib/utils';

interface WithdrawStatusTrackerProps {
  withdrawal: WithdrawRecord;
  token: TokenConfig;
  onDone: () => void;
}

interface StatusStep {
  status: WithdrawStatus;
  label: string;
  description: string;
}

const STATUS_STEPS: StatusStep[] = [
  { status: 'REQUESTED', label: 'Requested', description: 'Withdrawal request submitted' },
  { status: 'APPROVED', label: 'Approved', description: 'Risk check passed' },
  { status: 'SENT', label: 'Sending', description: 'Transaction sent to chain' },
  { status: 'CONFIRMED', label: 'Confirmed', description: 'Transaction confirmed' },
];

const getStatusIndex = (status: WithdrawStatus): number => {
  const index = STATUS_STEPS.findIndex(s => s.status === status);
  if (status === 'CONFIRMED') return STATUS_STEPS.length;
  if (status === 'REJECTED' || status === 'FAILED') return -1;
  return index;
};

const getStatusColor = (status: WithdrawStatus): string => {
  if (status === 'CONFIRMED') return 'text-trading-green';
  if (status === 'REJECTED' || status === 'FAILED') return 'text-trading-red';
  return 'text-primary';
};

const getStatusIcon = (status: WithdrawStatus) => {
  if (status === 'CONFIRMED') return <CheckCircle2 className="w-6 h-6 text-trading-green" />;
  if (status === 'REJECTED' || status === 'FAILED') return <XCircle className="w-6 h-6 text-trading-red" />;
  return <Loader2 className="w-6 h-6 text-primary animate-spin" />;
};

export const WithdrawStatusTracker = ({ withdrawal, token, onDone }: WithdrawStatusTrackerProps) => {
  const currentIndex = getStatusIndex(withdrawal.status);
  const isError = withdrawal.status === 'REJECTED' || withdrawal.status === 'FAILED';
  const isComplete = withdrawal.status === 'CONFIRMED';

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Status Header */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-muted/50 flex items-center justify-center">
          {getStatusIcon(withdrawal.status)}
        </div>
        <div>
          <h2 className={cn("text-xl font-bold", getStatusColor(withdrawal.status))}>
            {isComplete ? 'Withdrawal Complete' :
             isError ? (withdrawal.status === 'REJECTED' ? 'Withdrawal Rejected' : 'Withdrawal Failed') :
             'Processing Withdrawal'}
          </h2>
          {isError && (
            <p className="text-sm text-muted-foreground mt-2">
              {withdrawal.rejectReason || withdrawal.failReason || 'An error occurred'}
            </p>
          )}
        </div>
      </div>

      {/* Amount Summary */}
      <div className="p-4 bg-muted/20 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <LabelText size="sm" muted>Amount</LabelText>
          <MonoText className="font-semibold">
            {withdrawal.amount.toFixed(token.decimals > 8 ? 4 : 2)} {token.symbol}
          </MonoText>
        </div>
        <div className="flex items-center justify-between">
          <LabelText size="sm" muted>Network Fee</LabelText>
          <MonoText>-{withdrawal.fee} {token.symbol}</MonoText>
        </div>
        <div className="h-px bg-border/50" />
        <div className="flex items-center justify-between">
          <span className="font-medium">You'll Receive</span>
          <MonoText className="text-lg font-bold text-trading-green">
            {withdrawal.netAmount.toFixed(token.decimals > 8 ? 4 : 2)} {token.symbol}
          </MonoText>
        </div>
      </div>

      {/* Progress Steps */}
      {!isError && (
        <div className="space-y-1">
          {STATUS_STEPS.map((step, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isPending = index > currentIndex;

            return (
              <div key={step.status} className="flex items-start gap-3">
                {/* Step indicator */}
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center border-2",
                    isCompleted && "bg-trading-green border-trading-green",
                    isCurrent && "border-primary bg-primary/20",
                    isPending && "border-border bg-muted/30"
                  )}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-background" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    ) : (
                      <Clock className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  {index < STATUS_STEPS.length - 1 && (
                    <div className={cn(
                      "w-0.5 h-8",
                      isCompleted ? "bg-trading-green" : "bg-border"
                    )} />
                  )}
                </div>
                
                {/* Step content */}
                <div className="pt-1">
                  <div className={cn(
                    "font-medium",
                    isCompleted && "text-trading-green",
                    isCurrent && "text-primary",
                    isPending && "text-muted-foreground"
                  )}>
                    {step.label}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {step.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Error Details */}
      {isError && (
        <div className="p-4 bg-trading-red/10 border border-trading-red/30 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-trading-red flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-trading-red">
                {withdrawal.status === 'REJECTED' ? 'Request Rejected' : 'Transaction Failed'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {withdrawal.rejectReason || withdrawal.failReason || 
                 'Your funds have been unfrozen and returned to your available balance.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Hash */}
      {withdrawal.txHash && (
        <div className="p-4 bg-muted/20 rounded-xl">
          <LabelText size="sm" muted className="mb-2 block">Transaction Hash</LabelText>
          <a
            href={`https://bscscan.com/tx/${withdrawal.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-primary hover:underline"
          >
            <MonoText className="text-sm truncate">{withdrawal.txHash}</MonoText>
            <ExternalLink className="w-4 h-4 flex-shrink-0" />
          </a>
        </div>
      )}

      {/* Destination Address */}
      <div className="p-4 bg-muted/20 rounded-xl">
        <LabelText size="sm" muted className="mb-2 block">To Address</LabelText>
        <MonoText className="text-sm break-all">{withdrawal.toAddress}</MonoText>
      </div>

      {/* Done Button */}
      <Button
        onClick={onDone}
        className="w-full h-12 rounded-xl"
        variant={isError ? "outline" : "default"}
      >
        {isError ? 'Try Again' : 'Done'}
      </Button>
    </div>
  );
};
