import { PhotoConfig, TextConfig, FontType, Frame } from './types';

export const DEFAULT_CANVAS_SIZE = 1080;

export const DEFAULT_FRAME: Frame = {
  x: 60,
  y: 60,
  w: 960,
  h: 420,
  isTransparent: false
};

export const DEFAULT_PHOTO_CONFIG: PhotoConfig = {
  zoom: 1,
  x: 0,
  y: 0
};

export const DEFAULT_TEXT_CONFIG: TextConfig = {
  content: "یہاں اپنی خبر کی سرخی لکھیں\nدوسری لائن یہاں آئے گی",
  fontSize: 80,
  textAlign: 'center',
  color: '#ffffff',
  lineHeight: 0.95, // Fixed stable line height
  fontFamily: FontType.NAJD,
  x: 0,
  y: 0,
  maxLines: 3,
  highlights: [],
  spacingAdjustments: [],
  showGapIndicators: true
};

// Placeholder for the embedded font.
export const URDU_NAJD_BASE64 = ""; 

export const SOCIAL_ICONS: Record<string, string> = {
  facebook: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z",
  instagram: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z",
  twitter: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  youtube: "M21.582,5.337C21.328,4.382,20.579,3.633,19.624,3.379C17.893,2.917,12,2.917,12,2.917s-5.893,0-7.624,0.462 C3.421,3.633,2.672,4.382,2.418,5.337C1.956,7.068,1.956,10.667,1.956,10.667s0,3.599,0.462,5.33c0.254,0.955,1.003,1.704,1.958,1.958 c1.731,0.463,7.624,0.463,7.624,0.463s5.893,0,7.624-0.463c0.955-0.254,1.704-1.003,1.958-1.958c0.462-1.731,0.462-5.33,0.462-5.33 S22.044,7.068,21.582,5.337z M9.957,14.545V6.789l6.761,3.878L9.957,14.545z",
  globe: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
};

export const SOCIAL_HANDLES = [
  { platform: 'Facebook', handle: 'TakbeerNewsUK', iconKey: 'facebook' },
  { platform: 'Instagram', handle: 'TakbeerNews', iconKey: 'instagram' },
  { platform: 'X', handle: 'TakbeerNews', iconKey: 'twitter' },
  { platform: 'YouTube', handle: 'TakbeerTV', iconKey: 'youtube' },
  { platform: 'Web', handle: 'www.takbeernews.com', iconKey: 'globe' },
];

export const FONT_OPTIONS = [
  { label: 'Urdu Najd V3', value: FontType.NAJD },
  { label: 'Jameel Noori Nastaleeq', value: FontType.JAMEEL },
  { label: 'Noto Nastaliq Urdu', value: FontType.NASTALIQ },
  { label: 'Noto Naskh (Arabic)', value: FontType.NASKH },
];