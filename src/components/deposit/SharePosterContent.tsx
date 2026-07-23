import { forwardRef } from 'react';
import { SharePosterLayout } from '@/components/share/SharePosterLayout';
import { posterColors, posterThemes } from '@/lib/posterStyles';
import { TokenConfig } from '@/types/deposit';

interface SharePosterContentProps {
  address: string;
  token: TokenConfig;
  referralCode?: string;
}

// Format address with character-type based coloring for display
const formatAddressDisplay = (address: string) => {
  const hasPrefix = address.startsWith('0x');
  const cleanAddress = hasPrefix ? address.slice(2) : address;
  
  const chunks: { char: string; isDigit: boolean }[][] = [];
  let currentChunk: { char: string; isDigit: boolean }[] = [];
  
  for (let i = 0; i < cleanAddress.length; i++) {
    const char = cleanAddress[i];
    const isDigit = /[0-9]/.test(char);
    currentChunk.push({ char, isDigit });
    
    if (currentChunk.length === 4 || i === cleanAddress.length - 1) {
      chunks.push(currentChunk);
      currentChunk = [];
    }
  }
  
  return { hasPrefix, chunks };
};

/**
 * SharePosterContent - Deposit address share poster
 * 
 * Uses the standard SharePosterLayout with neutral theme for deposit addresses.
 * Shows token info, formatted address, and network warning.
 */
export const SharePosterContent = forwardRef<HTMLDivElement, SharePosterContentProps>(
  ({ address, token, referralCode = 'OMENX2025' }, ref) => {
    const { hasPrefix, chunks } = formatAddressDisplay(address);
    const theme = posterThemes.neutral;

    return (
      <SharePosterLayout
        ref={ref}
        theme="neutral"
        qrValue={address}
        referralCode={referralCode}
        ctaText="Scan QR to deposit"
        qrLabel="Deposit Address"
        style={{ padding: '24px' }}
      >
        {/* Token Hero - Centered vertical layout */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '24px',
          paddingTop: '8px',
        }}>
          {/* Token Name */}
          <div style={{
            fontSize: '32px',
            fontWeight: 700,
            color: posterColors.textPrimary,
            letterSpacing: '2px',
            marginBottom: '12px',
          }}>
            {token.symbol}
          </div>
          
          {/* Network Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            background: theme.bgColor,
            borderRadius: '20px',
            border: `1px solid ${theme.borderColor}`,
          }}>
            <span style={{ 
              width: '6px', 
              height: '6px', 
              borderRadius: '50%', 
              background: theme.primary,
            }} />
            <span style={{ 
              color: theme.primary, 
              fontSize: '12px', 
              fontWeight: 500,
              letterSpacing: '0.3px',
            }}>
              {token.network}
            </span>
          </div>
        </div>

        {/* Deposit Address - Clean without extra box */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <p style={{ 
            color: posterColors.textMuted, 
            fontSize: '10px', 
            marginBottom: '10px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}>
            Deposit Address
          </p>
          <div style={{
            padding: '14px 16px',
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: '12px',
            border: `1px solid ${posterColors.border}`,
            fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
            fontSize: '12px',
            lineHeight: '1.8',
          }}>
            <span style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '3px 6px' }}>
              {hasPrefix && (
                <span>
                  <span style={{ color: theme.primary }}>0</span>
                  <span style={{ color: posterColors.textPrimary }}>x</span>
                </span>
              )}
              {chunks.map((chunk, chunkIndex) => (
                <span key={chunkIndex}>
                  {chunk.map((item, charIndex) => (
                    <span 
                      key={charIndex}
                      style={{ color: item.isDigit ? theme.primary : posterColors.textPrimary }}
                    >
                      {item.char}
                    </span>
                  ))}
                </span>
              ))}
            </span>
          </div>
        </div>

        {/* Network Warning - Compact inline style */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '10px 16px',
          background: posterColors.warningBg,
          borderRadius: '8px',
          border: `1px solid ${posterColors.warningBorder}`,
        }}>
          <span style={{ fontSize: '14px' }}>⚠️</span>
          <span style={{
            color: posterColors.warning,
            fontSize: '11px',
            fontWeight: 500,
          }}>
            Only send <strong>{token.symbol}</strong> on <strong>{token.network}</strong>
          </span>
        </div>
      </SharePosterLayout>
    );
  }
);

SharePosterContent.displayName = 'SharePosterContent';
