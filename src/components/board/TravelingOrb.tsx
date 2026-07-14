'use client';

import { motion } from 'motion/react';

interface TravelingOrbProps {
  color: string;
  gradient: readonly [string, string];
  cellSize: number;
  sourceX: number;
  sourceY: number;
  destX: number;
  destY: number;
  duration: number;
}

export function TravelingOrb({ color, gradient, cellSize, sourceX, sourceY, destX, destY, duration }: TravelingOrbProps) {
  const s = cellSize * 0.2;
  const [c1, c2] = gradient;

  return (
    <motion.div
      className="absolute rounded-full z-20 pointer-events-none"
      style={{
        width: s,
        height: s,
        background: `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${color} 55%, white), ${c1} 75%, ${c2})`,
        boxShadow: `0 0 ${s * 0.6}px ${color}80`,
      }}
      initial={{
        x: sourceX,
        y: sourceY,
        scale: 1,
        opacity: 1,
      }}
      animate={{
        x: destX,
        y: destY,
        scale: [1, 1.3, 1],
        opacity: [1, 1, 0],
      }}
      transition={{
        duration,
        ease: 'easeOut',
        times: [0, 0.4, 1],
      }}
    />
  );
}
