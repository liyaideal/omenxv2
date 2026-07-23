// Share Poster Design System
// @see /style-guide → Common UI → Share Poster Design System

export { SharePosterLayout } from './SharePosterLayout';
export { SettlementPoster } from './SettlementPoster';

// Re-export styles for custom poster content
export { 
  posterThemes, 
  posterColors, 
  getThemeForResult,
  POSTER_BACKGROUND,
  POSTER_WIDTH,
  type PosterTheme,
} from '@/lib/posterStyles';
