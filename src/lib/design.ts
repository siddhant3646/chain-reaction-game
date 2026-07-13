export const colors = {
  background: '#0a0a14',
  surface: '#12121e',
  surfaceLight: '#1c1c2e',
  gridLine: 'rgba(100, 140, 255, 0.08)',
  gridLineActive: 'rgba(100, 140, 255, 0.2)',
  text: '#e8e8f0',
  textMuted: '#8888a0',
  player: [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#F7DC6F',
    '#BB8FCE',
  ],
  playerGlow: [
    'rgba(255, 107, 107, 0.4)',
    'rgba(78, 205, 196, 0.4)',
    'rgba(69, 183, 209, 0.4)',
    'rgba(247, 220, 111, 0.4)',
    'rgba(187, 143, 206, 0.4)',
  ],
} as const;

export const fonts = {
  display: "'Orbitron', sans-serif",
  body: "'Inter', sans-serif",
} as const;

export const playerShapes = ['circle', 'diamond', 'triangle', 'hexagon', 'star'] as const;
