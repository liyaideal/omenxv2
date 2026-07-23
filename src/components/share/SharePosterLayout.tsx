import { forwardRef, ReactNode, CSSProperties } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import omenxLogo from '@/assets/omenx-logo.svg';
import { 
  POSTER_BACKGROUND, 
  POSTER_WIDTH, 
  posterThemes, 
  posterColors,
  PosterTheme 
} from '@/lib/posterStyles';

interface SharePosterLayoutProps {
  /** Theme variant - auto-selected based on business result */
  theme?: PosterTheme;
  /** Optional date to display in header */
  date?: string;
  /** Main content area - the poster's primary visual */
  children: ReactNode;
  /** Optional warning/info message */
  warning?: ReactNode;
  /** QR code value (URL or address) */
  qrValue: string;
  /** Referral code to display */
  referralCode?: string;
  /** Call-to-action text next to referral */
  ctaText?: string;
  /** Small text below QR code */
  qrLabel?: string;
  /** Optional stamp element for top-right corner */
  stamp?: ReactNode;
  /** Additional container styles */
  style?: CSSProperties;
}

/**
 * SharePosterLayout - Universal layout component for all share posters
 * 
 * Structure: Logo Header → Content Zone → Warning (optional) → Footer (QR + Referral)
 * 
 * Uses inline styles for consistent image export via html-to-image.
 * All child components should also use inline styles, not Tailwind classes.
 * 
 * @see /style-guide → Common UI → Share Poster Design System
 */
export const SharePosterLayout = forwardRef<HTMLDivElement, SharePosterLayoutProps>(
  ({ 
    theme = 'neutral',
    date,
    children,
    warning,
    qrValue,
    referralCode = 'OMENX2025',
    ctaText = 'Join & trade with us!',
    qrLabel = 'omenx.com',
    stamp,
    style,
  }, ref) => {
    const themeStyle = posterThemes[theme];

    return (
      <div
        ref={ref}
        style={{
          width: `${POSTER_WIDTH}px`,
          maxWidth: '100%',
          background: POSTER_BACKGROUND,
          padding: '24px',
          borderRadius: '16px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
          overflow: 'visible',
          boxSizing: 'border-box',
          ...style,
        }}
      >
        {/* Background glow effects */}
        <div style={{
          position: 'absolute',
          top: '-80px',
          right: '-80px',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: themeStyle.glowColor,
          filter: 'blur(60px)',
          opacity: 0.6,
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-60px',
          left: '-60px',
          width: '160px',
          height: '160px',
          borderRadius: '50%',
          background: themeStyle.glowColor,
          filter: 'blur(60px)',
          opacity: 0.4,
          pointerEvents: 'none',
        }} />

        {/* Stamp - Top Right Corner */}
        {stamp && (
          <div style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            zIndex: 10,
          }}>
            {stamp}
          </div>
        )}

        {/* Header: Logo + Date */}
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
        }}>
          <img 
            src={omenxLogo} 
            alt="OMENX" 
            style={{ height: '20px', width: 'auto' }}
          />
          {date && (
            <span style={{
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: posterColors.textMuted,
              padding: '4px 8px',
              background: posterColors.cardBg,
              borderRadius: '4px',
              border: `1px solid ${posterColors.border}`,
            }}>
              {date}
            </span>
          )}
        </div>

        {/* Content Zone */}
        <div style={{ position: 'relative', marginBottom: warning ? '16px' : '20px' }}>
          {children}
        </div>

        {/* Warning/Info Zone (optional) */}
        {warning && (
          <div style={{
            padding: '12px',
            background: posterColors.warningBg,
            border: `1px solid ${posterColors.warningBorder}`,
            borderRadius: '12px',
            marginBottom: '20px',
          }}>
            {warning}
          </div>
        )}

        {/* Footer: QR Code + Referral */}
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          padding: '12px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '12px',
          border: `1px solid ${posterColors.border}`,
        }}>
          {/* Left: CTA + Referral */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '12px',
              fontWeight: 500,
              color: themeStyle.primary,
              marginBottom: '6px',
            }}>
              {ctaText}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ 
                fontSize: '10px', 
                color: posterColors.textMuted 
              }}>
                Referral:
              </span>
              <span style={{ 
                fontFamily: 'monospace',
                fontSize: '13px',
                fontWeight: 700,
                color: posterColors.textPrimary,
                letterSpacing: '1.5px',
              }}>
                {referralCode}
              </span>
            </div>
          </div>

          {/* Right: QR Code */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            flexShrink: 0,
          }}>
            <div style={{
              padding: '6px',
              background: '#ffffff',
              borderRadius: '8px',
            }}>
              <QRCodeSVG 
                value={qrValue}
                size={48}
                level="M"
                includeMargin={false}
              />
            </div>
            <span style={{ 
              fontSize: '8px', 
              color: posterColors.textMuted 
            }}>
              {qrLabel}
            </span>
          </div>
        </div>
      </div>
    );
  }
);

SharePosterLayout.displayName = 'SharePosterLayout';
