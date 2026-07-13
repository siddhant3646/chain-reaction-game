'use client';

import { motion } from 'motion/react';

interface OrbProps {
  count: number;
  color: string;
  gradient: readonly [string, string];
  cellSize: number;
  isDanger: boolean;
}

const positions: Record<number, { x: number; y: number }[]> = {
  1: [{ x: 50, y: 50 }],
  2: [{ x: 30, y: 50 }, { x: 70, y: 50 }],
  3: [{ x: 50, y: 28 }, { x: 27, y: 72 }, { x: 73, y: 72 }],
  4: [{ x: 27, y: 27 }, { x: 73, y: 27 }, { x: 27, y: 73 }, { x: 73, y: 73 }],
  5: [{ x: 50, y: 50 }, { x: 18, y: 22 }, { x: 82, y: 22 }, { x: 18, y: 78 }, { x: 82, y: 78 }],
};

export function Orb({ count, color, gradient, cellSize, isDanger }: OrbProps) {
  const maxOrbs = Math.min(count, 5);
  const pos = positions[maxOrbs] || positions[5];
  const r = Math.max(cellSize * 0.13, 4);
  const d = r * 2;
  const [c1, c2] = gradient;

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
      {pos.slice(0, count).map((p, i) => (
        <motion.div
          key={`${count}-${i}`}
          className="absolute"
          style={{
            width: d,
            height: d,
            left: `${p.x}%`,
            top: `${p.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: 1,
            opacity: 1,
          }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 22,
            mass: 0.4,
          }}
        >
          <div
            className="w-full h-full rounded-full relative"
            style={{
              background: `radial-gradient(circle at 32% 30%, rgba(255,255,255,0.35), ${c1} 40%, ${c2})`,
              boxShadow: isDanger
                ? `0 0 ${r * 0.8}px ${color}, 0 0 ${r * 2.5}px ${color}60`
                : `0 0 ${r * 0.5}px ${color}50, inset 0 -1px 1px rgba(0,0,0,0.2)`,
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}
