/**
 * Share Poster Design System - Centralized Styling
 * 
 * All share posters MUST use these inline styles to ensure consistent
 * image export across all environments. DO NOT use Tailwind classes
 * for colors in poster content components.
 * 
 * @see /style-guide → Common UI → Share Poster Design System
 */

export type PosterTheme = 'win' | 'loss' | 'neutral' | 'special';

// Core background gradient for all posters
export const POSTER_BACKGROUND = 'linear-gradient(to bottom, #1a1a2e, #16162a)';

// Fixed poster width for consistent export quality
export const POSTER_WIDTH = 400;

// Design tokens for poster themes
export const posterThemes: Record<PosterTheme, {
  primary: string;
  primaryMuted: string;
  glowColor: string;
  borderColor: string;
  bgColor: string;
  gradient: string;
}> = {
  win: {
    primary: '#22c55e',           // trading-green
    primaryMuted: 'rgba(34, 197, 94, 0.7)',
    glowColor: 'rgba(34, 197, 94, 0.3)',
    borderColor: 'rgba(34, 197, 94, 0.4)',
    bgColor: 'rgba(34, 197, 94, 0.15)',
    gradient: 'linear-gradient(135deg, #22c55e, #10b981)',
  },
  loss: {
    primary: '#ef4444',           // trading-red
    primaryMuted: 'rgba(239, 68, 68, 0.7)',
    glowColor: 'rgba(239, 68, 68, 0.3)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    gradient: 'linear-gradient(135deg, #ef4444, #f97316)',
  },
  neutral: {
    primary: '#a78bfa',           // primary purple
    primaryMuted: 'rgba(167, 139, 250, 0.7)',
    glowColor: 'rgba(167, 139, 250, 0.3)',
    borderColor: 'rgba(167, 139, 250, 0.4)',
    bgColor: 'rgba(167, 139, 250, 0.15)',
    gradient: 'linear-gradient(135deg, #a78bfa, #8b5cf6)',
  },
  special: {
    primary: '#fbbf24',           // gold/yellow
    primaryMuted: 'rgba(251, 191, 36, 0.7)',
    glowColor: 'rgba(251, 191, 36, 0.3)',
    borderColor: 'rgba(251, 191, 36, 0.4)',
    bgColor: 'rgba(251, 191, 36, 0.15)',
    gradient: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
  },
};

// Common text colors
export const posterColors = {
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.6)',
  textMuted: 'rgba(255, 255, 255, 0.3)',
  cardBg: 'rgba(255, 255, 255, 0.05)',
  cardBgHover: 'rgba(255, 255, 255, 0.08)',
  border: 'rgba(255, 255, 255, 0.1)',
  warning: '#fbbf24',
  warningBg: 'rgba(251, 191, 36, 0.1)',
  warningBorder: 'rgba(251, 191, 36, 0.3)',
};

// Helper to get theme based on business result
export function getThemeForResult(result: 'win' | 'lose' | 'neutral' | 'special'): PosterTheme {
  switch (result) {
    case 'win': return 'win';
    case 'lose': return 'loss';
    case 'special': return 'special';
    default: return 'neutral';
  }
}
