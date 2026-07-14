'use client';

import { motion } from 'motion/react';

interface OrbProps {
  count: number;
  color: string;
  gradient: readonly [string, string];
  cellSize: number;
  isDanger: boolean;
}

const slotPositions: Record<number, { x: number; y: number }[]> = {
  1: [{ x: 50, y: 50 }],
  2: [{ x: 35, y: 50 }, { x: 65, y: 50 }],
  3: [{ x: 50, y: 32 }, { x: 34, y: 62 }, { x: 66, y: 62 }],
  4: [{ x: 35, y: 35 }, { x: 65, y: 35 }, { x: 35, y: 65 }, { x: 65, y: 65 }],
};

const orbDiameters: Record<number, number> = {
  1: 46,
  2: 32,
  3: 30,
  4: 28,
};

export function Orb({ count, color, gradient, cellSize, isDanger }: OrbProps) {
  const clampedCount = Math.min(count, 4);
  const positions = slotPositions[clampedCount] || slotPositions[4];
  const diameterPct = orbDiameters[clampedCount] || 28;
  const r = (cellSize * diameterPct) / 200;
  const d = r * 2;
  const [c1, c2] = gradient;

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
      {positions.slice(0, clampedCount).map((p, slot) => (
        <motion.div
          key={`orb-${slot}`}
          className="absolute"
          style={{
            width: d,
            height: d,
          }}
          initial={false}
          animate={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            x: '-50%',
            y: '-50%',
            scale: 1,
            opacity: 1,
          }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 22,
            mass: 0.4,
            duration: 0.18,
          }}
        >
          <motion.div
            className="w-full h-full rounded-full relative"
            style={{
              background: `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${color} 55%, white), ${c1} 75%, ${c2})`,
              boxShadow: isDanger
                ? `0 0 ${r * 0.8}px ${color}, 0 0 ${r * 2.5}px ${color}60`
                : `0 0 ${r * 0.6}px ${color}50, inset 0 -1px 1px rgba(0,0,0,0.2)`,
            }}
            animate={isDanger ? {} : {
              scale: [1, 1.03, 1],
            }}
            transition={isDanger ? {} : {
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <div
              className="absolute rounded-full"
              style={{
                width: '40%',
                height: '25%',
                top: '12%',
                left: '18%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 100%)',
              }}
            />
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}
