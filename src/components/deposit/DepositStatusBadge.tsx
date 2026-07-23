import { Badge } from '@/components/ui/badge';
import { Loader2, Check, AlertTriangle, Clock, XCircle } from 'lucide-react';
import { DepositStatus } from '@/types/deposit';

interface DepositStatusBadgeProps {
  status: DepositStatus;
  confirmations?: number;
  requiredConfirmations?: number;
}

export const DepositStatusBadge = ({ 
  status, 
  confirmations = 0, 
  requiredConfirmations = 15 
}: DepositStatusBadgeProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'PENDING_TX':
        return {
          label: 'Waiting',
          icon: <Clock className="w-3 h-3" />,
          className: 'bg-muted text-muted-foreground border-border',
        };
      case 'CONFIRMING':
        return {
          label: `${confirmations}/${requiredConfirmations}`,
          icon: <Loader2 className="w-3 h-3 animate-spin" />,
          className: 'bg-primary/20 text-primary border-primary/30',
        };
      case 'PENDING_CLAIM':
        return {
          label: 'Claim Required',
          icon: <AlertTriangle className="w-3 h-3" />,
          className: 'bg-trading-yellow/20 text-trading-yellow border-trading-yellow/30',
        };
      case 'CONFIRMED':
        return {
          label: 'Confirmed',
          icon: <Check className="w-3 h-3" />,
          className: 'bg-trading-green/20 text-trading-green border-trading-green/30',
        };
      case 'CREDITED':
        return {
          label: 'Credited',
          icon: <Check className="w-3 h-3" />,
          className: 'bg-trading-green/20 text-trading-green border-trading-green/30',
        };
      case 'REORG_DETECTED':
        return {
          label: 'Reorg Detected',
          icon: <XCircle className="w-3 h-3" />,
          className: 'bg-trading-red/20 text-trading-red border-trading-red/30',
        };
      default:
        return {
          label: 'Unknown',
          icon: null,
          className: 'bg-muted text-muted-foreground border-border',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Badge 
      variant="outline" 
      className={`flex items-center gap-1 ${config.className}`}
    >
      {config.icon}
      {config.label}
    </Badge>
  );
};
