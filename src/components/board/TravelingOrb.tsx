'use client';

import { motion } from 'motion/react';

interface TravelingOrbProps {
  color: string;
  cellSize: number;
}

export function TravelingOrb({ color, cellSize }: TravelingOrbProps) {
  const size = cellSize * 0.2;
  return (
    <motion.div
      className="absolute rounded-full z-10 pointer-events-none"
      style={{
        width: size,
        height: size,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: `radial-gradient(circle at 35% 35%, white, ${color})`,
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: [0, 1.5, 0],
        opacity: [0, 1, 0],
      }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    />
  );
}
