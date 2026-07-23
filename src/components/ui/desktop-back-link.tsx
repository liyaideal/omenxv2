import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DesktopBackLinkProps {
  /** Visible label after the arrow, e.g. "Wallet" or "Back". */
  label?: string;
  /** Click handler. Use `onClick` for in-app navigation. */
  onClick?: () => void;
  className?: string;
}

/**
 * Standard `← Label` back link used on desktop sub-flows
 * (Transparency audits, Recovery, etc.).
 *
 * Visual contract:
 *   - text-sm muted, hover -> foreground
 *   - 4px gap, ArrowLeft 16px
 *   - inline-flex, no padding, no background
 */
export const DesktopBackLink = ({
  label = 'Back',
  onClick,
  className,
}: DesktopBackLinkProps) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors',
      className,
    )}
  >
    <ArrowLeft className="w-4 h-4" />
    {label}
  </button>
);
