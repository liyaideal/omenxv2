import { forwardRef } from 'react';
import { format } from 'date-fns';
import { SharePosterLayout } from './SharePosterLayout';
import { posterThemes, posterColors, getThemeForResult } from '@/lib/posterStyles';

interface SettlementPosterProps {
  // Event info
  event: string;
  option: string;
  side: 'long' | 'short';
  leverage: number;
  /** 4B: spot posters swap the leverage chip for a SPOT label. */
  productLine?: 'futures' | 'spot';
  // Result
  result: 'win' | 'lose';
  pnl: number;
  pnlPercent: number;
  // Prices
  entryPrice: number;
  exitPrice: number;
  // Date
  settledAt: string;
  // User
  username?: string;
  avatarUrl?: string;
  referralCode?: string;
  /** Single-market binary 别名（如体育队名）。其它事件请留空。 */
  sideLabels?: { yes: string; no: string };
}

/**
 * SettlementPoster - Share card for settlement results
 * 
 * Displays: User avatar, PnL result, event details, entry/exit prices
 * Theme: Auto-selected based on win/loss result
 */
export const SettlementPoster = forwardRef<HTMLDivElement, SettlementPosterProps>(
  ({
    event,
    option,
    side,
    leverage,
    productLine = 'futures',
    result,
    pnl,
    pnlPercent,
    entryPrice,
    exitPrice,
    settledAt,
    username = 'Trader',
    avatarUrl,
    referralCode = 'OMENX2025',
    sideLabels,
  }, ref) => {
    const theme = getThemeForResult(result);
    const themeStyle = posterThemes[theme];
    const isWin = result === 'win';
    const isLong = side === 'long';
    const isBinaryOption = option.trim().toLowerCase() === 'yes' || option.trim().toLowerCase() === 'no';
    const binaryAlias = sideLabels ? (isLong ? sideLabels.yes : sideLabels.no) : null;
    const directionText = isLong ? 'Yes' : 'No';
    const settledDate = format(new Date(settledAt), 'MMM d, yyyy');

    // Side colors
    const sideColor = isLong ? '#22c55e' : '#ef4444';
    const sideBg = isLong ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)';
    const sideBorder = isLong ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)';

    return (
      <SharePosterLayout
        ref={ref}
        theme={theme}
        date={settledDate}
        qrValue="https://omenx.com"
        referralCode={referralCode}
        ctaText={isWin ? 'Join & trade like a pro!' : 'Join & do better than me 😅'}
      >
        {/* User Info + Result */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          marginBottom: '16px',
        }}>
          {/* Avatar */}
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute',
              inset: '-4px',
              borderRadius: '50%',
              background: themeStyle.glowColor,
              filter: 'blur(8px)',
            }} />
            <div style={{
              position: 'relative',
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              border: `2px solid ${themeStyle.borderColor}`,
              background: posterColors.cardBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}>
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt={username}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ 
                  fontWeight: 700, 
                  fontSize: '18px',
                  color: posterColors.textPrimary 
                }}>
                  {username.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            {/* Result icon */}
            <div style={{
              position: 'absolute',
              bottom: '-2px',
              right: '-2px',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: themeStyle.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{ fontSize: '10px' }}>{isWin ? '🏆' : '📉'}</span>
            </div>
          </div>

          {/* Username + Badge */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontWeight: 700,
              fontSize: '15px',
              color: posterColors.textPrimary,
              marginBottom: '4px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {username}
            </div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 10px',
              borderRadius: '9999px',
              background: themeStyle.gradient,
              fontSize: '11px',
              fontWeight: 600,
              color: '#0a0c14',
            }}>
              {isWin ? '⚡ Winner!' : '💀 RIP'}
            </div>
          </div>
        </div>

        {/* Big PnL Display */}
        <div style={{
          padding: '20px',
          borderRadius: '16px',
          background: themeStyle.bgColor,
          border: `1px solid ${themeStyle.borderColor}`,
          textAlign: 'center',
          marginBottom: '16px',
        }}>
          <div style={{
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            color: themeStyle.primaryMuted,
            marginBottom: '4px',
          }}>
            {isWin ? 'Profit' : 'Lost'}
          </div>
          <div style={{
            fontFamily: 'monospace',
            fontWeight: 900,
            fontSize: '36px',
            color: themeStyle.primary,
            marginBottom: '4px',
          }}>
            {pnl >= 0 ? '+' : ''}${Math.abs(pnl).toFixed(2)}
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            color: themeStyle.primary,
          }}>
            <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '16px' }}>
              {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(1)}%
            </span>
            <span style={{ fontSize: '11px', opacity: 0.7 }}>ROI</span>
          </div>
          {/* Fun message */}
          <div style={{
            marginTop: '10px',
            fontSize: '10px',
            color: posterColors.textMuted,
            fontStyle: 'italic',
          }}>
            {isWin 
              ? pnlPercent >= 100 ? '🔥 Absolute legend!' : pnlPercent >= 50 ? '💰 Nice gains!' : '✨ Well played!'
              : pnlPercent <= -50 ? "😭 That's rough buddy..." : '📉 We go again!'}
          </div>
        </div>

        {/* Event Info */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{
            fontWeight: 600,
            fontSize: '13px',
            color: posterColors.textPrimary,
            lineHeight: 1.4,
            marginBottom: '8px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {event}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {isBinaryOption ? (
              <span style={{ fontSize: '12px', fontWeight: 600, color: sideColor }}>
                {binaryAlias ?? directionText} {productLine === 'spot' ? 'SPOT' : `${leverage}x`}
              </span>
            ) : (
              <>
                <span style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  background: sideBg,
                  border: `1px solid ${sideBorder}`,
                  color: sideColor,
                  fontSize: '10px',
                  fontWeight: 600,
                }}>
                  {directionText} {productLine === 'spot' ? 'SPOT' : `${leverage}x`}
                </span>
                <span style={{ fontSize: '11px', color: posterColors.textSecondary }}>
                  {option}
                </span>
              </>
            )}
          </div>
        </div>


        {/* Entry/Exit Prices */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
        }}>
          <div style={{
            padding: '10px',
            borderRadius: '8px',
            background: posterColors.cardBg,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '9px', color: posterColors.textMuted, marginBottom: '2px' }}>
              Entry Price
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 600, color: posterColors.textPrimary }}>
              ${entryPrice.toFixed(4)}
            </div>
          </div>
          <div style={{
            padding: '10px',
            borderRadius: '8px',
            background: posterColors.cardBg,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '9px', color: posterColors.textMuted, marginBottom: '2px' }}>
              Exit Price
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 600, color: themeStyle.primary }}>
              ${exitPrice.toFixed(4)}
            </div>
          </div>
        </div>
      </SharePosterLayout>
    );
  }
);

SettlementPoster.displayName = 'SettlementPoster';
