import { forwardRef } from 'react';
import { SharePosterLayout } from '@/components/share/SharePosterLayout';
import { posterColors, posterThemes } from '@/lib/posterStyles';

interface ReferralSharePosterProps {
  referralCode: string;
  /** Inviter's username */
  inviterName?: string;
  /** Inviter's avatar URL */
  avatarUrl?: string;
}

/**
 * ReferralSharePoster - KOL-friendly invitation card
 * 
 * Design: Borderless floating avatar with glow effect,
 * decorative sparkles, and integrated invite badge.
 * 
 * Layout: Avatar+Badge+Name → Benefits Grid → Steps → Footer
 */
export const ReferralSharePoster = forwardRef<HTMLDivElement, ReferralSharePosterProps>(
  ({ referralCode, inviterName, avatarUrl }, ref) => {
    const theme = posterThemes.special; // Gold theme for rewards
    const referralLink = `https://omenx.lovable.app?ref=${referralCode}`;
    const displayName = inviterName || 'OMENX User';
    const initials = displayName.charAt(0).toUpperCase();

    // Stamp element for top-right corner
    const stamp = (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        padding: '5px 10px',
        background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(251, 191, 36, 0.1))',
        border: '1px solid rgba(251, 191, 36, 0.3)',
        borderRadius: '20px',
        boxShadow: '0 2px 8px rgba(251, 191, 36, 0.15)',
      }}>
        <span style={{ fontSize: '11px' }}>🎁</span>
        <span style={{
          color: '#fbbf24',
          fontSize: '9px',
          fontWeight: 600,
          letterSpacing: '0.3px',
        }}>
          Exclusive Invite
        </span>
      </div>
    );

    return (
      <SharePosterLayout
        ref={ref}
        theme="special"
        qrValue={referralLink}
        referralCode={referralCode}
        ctaText="Predict. Trade. Profit."
        qrLabel="omenx.lovable.app"
        stamp={stamp}
      >
        {/* User Profile - Floating Borderless Design */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: '20px',
          position: 'relative',
        }}>
          {/* Decorative sparkles */}
          <div style={{
            position: 'absolute',
            top: '-8px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '120px',
            height: '100px',
            pointerEvents: 'none',
          }}>
            <span style={{ 
              position: 'absolute', 
              top: '0', 
              left: '10px', 
              fontSize: '10px',
              opacity: 0.6,
            }}>✦</span>
            <span style={{ 
              position: 'absolute', 
              top: '15px', 
              right: '5px', 
              fontSize: '14px',
              color: theme.primary,
              opacity: 0.8,
            }}>✦</span>
            <span style={{ 
              position: 'absolute', 
              top: '50px', 
              left: '-5px', 
              fontSize: '8px',
              opacity: 0.5,
            }}>✦</span>
            <span style={{ 
              position: 'absolute', 
              top: '60px', 
              right: '0', 
              fontSize: '12px',
              color: theme.primary,
              opacity: 0.7,
            }}>✧</span>
          </div>

          {/* Avatar with glow ring */}
          <div style={{
            position: 'relative',
            marginBottom: '14px',
          }}>
            {/* Outer glow ring */}
            <div style={{
              position: 'absolute',
              inset: '-6px',
              borderRadius: '50%',
              background: `conic-gradient(from 0deg, ${theme.primary}40, ${theme.glowColor}, ${theme.primary}40)`,
              animation: 'spin 8s linear infinite',
              opacity: 0.6,
            }} />
            {/* Inner ring */}
            <div style={{
              position: 'absolute',
              inset: '-3px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1a1a2e, #16162a)',
            }} />
            {/* Avatar */}
            <div style={{
              position: 'relative',
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: theme.bgColor,
              border: `2px solid ${theme.borderColor}`,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt={displayName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ 
                  fontSize: '28px', 
                  fontWeight: 700, 
                  color: theme.primary,
                }}>
                  {initials}
                </span>
              )}
            </div>
          </div>

          {/* Username */}
          <div style={{
            fontSize: '18px',
            fontWeight: 700,
            color: posterColors.textPrimary,
            marginBottom: '6px',
          }}>
            {displayName}
          </div>
          
          {/* Invite text */}
          <div style={{
            fontSize: '12px',
            color: posterColors.textSecondary,
          }}>
            invites you to join OMENX
          </div>
        </div>

        {/* Benefits Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          marginBottom: '16px',
        }}>
          {/* Benefit 1: First Trade Bonus */}
          <div style={{
            padding: '14px 10px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            border: `1px solid ${posterColors.border}`,
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: '22px',
              fontWeight: 700,
              color: theme.primary,
              fontFamily: 'ui-monospace, monospace',
              marginBottom: '4px',
            }}>
              +100 <span style={{ fontSize: '12px', fontWeight: 500 }}>pts</span>
            </div>
            <div style={{
              fontSize: '9px',
              color: posterColors.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              First Trade
            </div>
          </div>

          {/* Benefit 2: Each Referral Bonus */}
          <div style={{
            padding: '14px 10px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            border: `1px solid ${posterColors.border}`,
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: '22px',
              fontWeight: 700,
              color: '#22c55e',
              fontFamily: 'ui-monospace, monospace',
              marginBottom: '4px',
            }}>
              +200 <span style={{ fontSize: '12px', fontWeight: 500 }}>pts</span>
            </div>
            <div style={{
              fontSize: '9px',
              color: posterColors.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              Each Referral
            </div>
          </div>
        </div>

        {/* How it works - Compact horizontal */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '6px',
          padding: '10px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '8px',
          border: `1px solid ${posterColors.border}`,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            <span style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: theme.bgColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '8px',
              fontWeight: 700,
              color: theme.primary,
            }}>1</span>
            <span style={{ fontSize: '10px', color: posterColors.textSecondary }}>
              Scan
            </span>
          </div>
          <span style={{ color: posterColors.textMuted, fontSize: '10px' }}>→</span>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            <span style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: theme.bgColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '8px',
              fontWeight: 700,
              color: theme.primary,
            }}>2</span>
            <span style={{ fontSize: '10px', color: posterColors.textSecondary }}>
              Sign Up
            </span>
          </div>
          <span style={{ color: posterColors.textMuted, fontSize: '10px' }}>→</span>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            <span style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: theme.bgColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '8px',
              fontWeight: 700,
              color: theme.primary,
            }}>3</span>
            <span style={{ fontSize: '10px', color: posterColors.textSecondary }}>
              Earn!
            </span>
          </div>
        </div>
      </SharePosterLayout>
    );
  }
);

ReferralSharePoster.displayName = 'ReferralSharePoster';
