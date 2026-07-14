'use client';

import { motion } from 'motion/react';
import { colors } from '@/lib/design';

interface PlayerPillProps {
  name: string;
  color: string;
  glow: string;
  isActive: boolean;
  isEliminated: boolean;
  isYou?: boolean;
}

export function PlayerPill({ name, color, glow, isActive, isEliminated, isYou }: PlayerPillProps) {
  return (
    <motion.div
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-all"
      layout
      style={{
        background: isActive ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)',
        color: isEliminated ? colors.textMuted : isActive ? colors.text : colors.textSecondary,
        border: `1px solid ${isActive ? colors.glassBorderHover : 'transparent'}`,
        boxShadow: isActive ? `0 0 14px ${glow}` : 'none',
        opacity: isEliminated ? 0.3 : 1,
        textDecoration: isEliminated ? 'line-through' : 'none',
      }}
    >
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{
          background: `linear-gradient(135deg, ${color}, ${color}dd)`,
          boxShadow: isActive ? `0 0 6px ${glow}` : 'none',
        }}
      />
      <span className="truncate max-w-[56px] sm:max-w-[72px]">{name}</span>
      {isActive && <span className="text-[8px] opacity-60 ml-0.5">●</span>}
      {isYou && !isActive && <span className="text-[8px] opacity-40 ml-0.5 hidden sm:inline">(you)</span>}
    </motion.div>
  );
}
