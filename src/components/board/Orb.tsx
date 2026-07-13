'use client';

import { motion, AnimatePresence } from 'motion/react';

interface OrbProps {
  count: number;
  color: string;
  cellSize: number;
  isDanger: boolean;
}

const positions: Record<number, { x: number; y: number }[]> = {
  1: [{ x: 50, y: 50 }],
  2: [{ x: 30, y: 50 }, { x: 70, y: 50 }],
  3: [{ x: 50, y: 30 }, { x: 30, y: 70 }, { x: 70, y: 70 }],
  4: [{ x: 30, y: 30 }, { x: 70, y: 30 }, { x: 30, y: 70 }, { x: 70, y: 70 }],
  5: [{ x: 50, y: 50 }, { x: 20, y: 25 }, { x: 80, y: 25 }, { x: 20, y: 75 }, { x: 80, y: 75 }],
};

export function Orb({ count, color, cellSize, isDanger }: OrbProps) {
  const maxOrbs = Math.min(count, 5);
  const pos = positions[maxOrbs] || positions[5];
  const orbRadius = Math.max(cellSize * 0.12, 4);
  const diameter = orbRadius * 2;

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={false}
        >
          {pos.slice(0, count).map((p, i) => (
            <motion.div
              key={`${count}-${i}`}
              className="absolute rounded-full"
              style={{
                width: diameter,
                height: diameter,
                left: `${p.x}%`,
                top: `${p.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: 1,
                opacity: 1,
                boxShadow: isDanger
                  ? [
                      `0 0 ${orbRadius * 0.5}px ${color}`,
                      `0 0 ${orbRadius * 1.5}px ${color}`,
                      `0 0 ${orbRadius * 3}px ${color}`,
                    ]
                  : `0 0 ${orbRadius * 0.3}px ${color}80`,
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{
                type: 'spring',
                stiffness: 500,
                damping: 25,
                mass: 0.5,
              }}
            >
              <div
                className="w-full h-full rounded-full"
                style={{ background: `radial-gradient(circle at 35% 35%, white, ${color} 60%, ${color}dd)` }}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
