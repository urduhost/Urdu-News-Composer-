export interface Frame {
  x: number;
  y: number;
  w: number;
  h: number;
  isTransparent?: boolean;
}

export interface PhotoConfig {
  zoom: number;
  x: number;
  y: number;
}

export enum FontType {
  NAJD = 'Urdu Najd V3',
  JAMEEL = 'Jameel Noori Nastaleeq',
  NASTALIQ = 'Noto Nastaliq Urdu',
  NASKH = 'Noto Sans Arabic',
}

export interface HighlightRange {
  start: number;
  end: number;
  color: string;
}

export interface SpacingAdjustment {
  start: number; // Character index where the gap adjustment starts
  end: number;   // Character index where it ends
  value: number; // em value for margin-inline
}

export interface TextConfig {
  content: string;
  fontSize: number;
  textAlign: 'left' | 'center' | 'right';
  color: string;
  lineHeight: number; // multiplier
  fontFamily: string;
  customFontUrl?: string;
  customFontName?: string;
  x: number;
  y: number;
  maxLines: number;
  highlights: HighlightRange[];
  spacingAdjustments: SpacingAdjustment[];
  showGapIndicators: boolean;
}

export interface CanvasConfig {
  width: number;
  height: number;
}