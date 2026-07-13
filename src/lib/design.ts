export const colors = {
  background: '#0a0a0f',
  surface: 'rgba(30, 30, 50, 0.65)',
  surfaceLighter: 'rgba(40, 40, 65, 0.55)',
  surfaceLightest: 'rgba(50, 50, 75, 0.4)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  glassBorderHover: 'rgba(255, 255, 255, 0.15)',
  text: '#f5f5f7',
  textSecondary: 'rgba(245, 245, 247, 0.7)',
  textMuted: 'rgba(245, 245, 247, 0.4)',
  gridLine: 'rgba(255, 255, 255, 0.04)',
  gridLineActive: 'rgba(255, 255, 255, 0.1)',
  player: [
    '#FF4757',
    '#2ED573',
    '#1E90FF',
    '#FFA502',
    '#A55EEA',
  ],
  playerGlow: [
    'rgba(255, 71, 87, 0.35)',
    'rgba(46, 213, 115, 0.35)',
    'rgba(30, 144, 255, 0.35)',
    'rgba(255, 165, 2, 0.35)',
    'rgba(165, 94, 234, 0.35)',
  ],
  playerGradients: [
    ['#FF4757', '#FF6B81'],
    ['#2ED573', '#7BED9F'],
    ['#1E90FF', '#70A1FF'],
    ['#FFA502', '#FFC312'],
    ['#A55EEA', '#C56CF0'],
  ],
} as const;

export const fonts = {
  display: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  body: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
} as const;

export const shadows = {
  sm: '0 1px 3px rgba(0,0,0,0.3)',
  md: '0 4px 12px rgba(0,0,0,0.4)',
  lg: '0 8px 30px rgba(0,0,0,0.5)',
  glow: (color: string) => `0 0 20px ${color}, 0 0 60px ${color}40`,
} as const;
