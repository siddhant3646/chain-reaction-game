'use client';

import { motion } from 'motion/react';

interface TravelingOrbProps {
  color: string;
  gradient: readonly [string, string];
  cellSize: number;
}

export function TravelingOrb({ color, gradient, cellSize }: TravelingOrbProps) {
  const s = cellSize * 0.22;
  const [c1, c2] = gradient;

  return (
    <motion.div
      className="absolute rounded-full z-10 pointer-events-none"
      style={{
        width: s,
        height: s,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: `radial-gradient(circle at 32% 30%, rgba(255,255,255,0.4), ${c1} 40%, ${c2})`,
        boxShadow: `0 0 ${s * 0.5}px ${color}70`,
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: [0, 1.6, 0],
        opacity: [0, 1, 0],
      }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    />
  );
}
