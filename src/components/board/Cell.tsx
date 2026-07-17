'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Cell as CellType } from '@/lib/engine';
import { getCriticalMass } from '@/lib/engine/board';
import { Orb } from './Orb';
import { colors } from '@/lib/design';

const slotPositions: Record<number, { x: number; y: number }[]> = {
  1: [{ x: 50, y: 50 }],
  2: [{ x: 35, y: 50 }, { x: 65, y: 50 }],
  3: [{ x: 50, y: 32 }, { x: 34, y: 62 }, { x: 66, y: 62 }],
  4: [{ x: 35, y: 35 }, { x: 65, y: 35 }, { x: 35, y: 65 }, { x: 65, y: 65 }],
};

interface CellProps {
  cell: CellType;
  index: number;
  cols: number;
  rows: number;
  playerIdx: number;
  isPlayable: boolean;
  isExploding: boolean;
  isIllegalShake: boolean;
  illegalShakeKey: number;
  onPlace: (index: number) => void;
  cellSize: number;
  activePlayerColor: string | null;
  activePlayerGradient: readonly [string, string] | null;
}

export function Cell({
  cell,
  index,
  cols,
  rows,
  playerIdx,
  isPlayable,
  isExploding,
  isIllegalShake,
  illegalShakeKey,
  onPlace,
  cellSize,
  activePlayerColor,
  activePlayerGradient,
}: CellProps) {
  const reducedMotion = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);
  const criticalMass = getCriticalMass(index, cols, rows);
  const isNearCritical = cell.count >= criticalMass - 1 && cell.count < criticalMass && cell.owner != null;
  const isOwned = cell.owner != null;
  const isOpponent = isOwned && !isPlayable;

  const normalizedPlayerIdx = playerIdx >= 0 ? playerIdx % colors.player.length : -1;
  const playerColor = normalizedPlayerIdx >= 0 ? colors.player[normalizedPlayerIdx] : null;
  const playerGradient = normalizedPlayerIdx >= 0 ? colors.playerGradients[normalizedPlayerIdx] : null;

  const radius = Math.max(cellSize * 0.12, 4);

  const ghostCount = cell.count + 1;
  const ghostClamped = Math.min(ghostCount, 4);
  const ghostSlot = cell.count;
  const ghostPos = ghostSlot < (slotPositions[ghostClamped]?.length || 0)
    ? slotPositions[ghostClamped][ghostSlot]
    : null;

  return (
    <motion.button
      onClick={() => isPlayable && onPlace(index)}
      disabled={!isPlayable}
      className="relative outline-none select-none overflow-hidden"
      style={{
        width: cellSize,
        height: cellSize,
        minWidth: 28,
        minHeight: 28,
        borderRadius: radius,
        background: isOwned
          ? `radial-gradient(circle at 50% 50%, ${playerColor}14, transparent 70%)`
          : 'transparent',
        boxShadow: isPlayable
          ? `inset 0 0 0 1px ${colors.gridLineActive}, inset 0 1px 2px rgba(0,0,0,0.2)`
          : `inset 0 0 0 1px ${colors.gridLine}, inset 0 1px 3px rgba(0,0,0,0.3)`,
        filter: isOpponent ? 'brightness(0.7) saturate(0.6)' : 'none',
        cursor: isPlayable ? 'pointer' : isOpponent ? 'not-allowed' : 'default',
        transition: 'box-shadow 0.2s ease, background 0.2s ease, filter 0.2s ease',
      }}
      whileHover={isPlayable && !isNearCritical && !reducedMotion ? { scale: 1.04 } : {}}
      whileTap={isPlayable && !reducedMotion ? { scale: 0.94 } : {}}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && isPlayable) {
          e.preventDefault();
          onPlace(index);
        }
      }}
      tabIndex={isPlayable ? 0 : -1}
      aria-label={
        isOwned
          ? `Cell ${index % cols + 1}, ${Math.floor(index / cols) + 1}, ${cell.count} orbs`
          : `Cell ${index % cols + 1}, ${Math.floor(index / cols) + 1}, empty`
      }
    >
      {isPlayable && !isOwned && activePlayerColor && ghostPos && !reducedMotion && (
        <motion.div
          className="absolute pointer-events-none"
          style={{
            width: cellSize * 0.23,
            height: cellSize * 0.23,
            left: `${ghostPos.x}%`,
            top: `${ghostPos.y}%`,
            x: '-50%',
            y: '-50%',
            zIndex: 0,
          }}
          animate={{ opacity: isHovered ? 0.35 : 0 }}
          transition={{ duration: 0.15 }}
        >
          <div
            className="w-full h-full rounded-full"
            style={{
              background: activePlayerGradient
                ? `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${activePlayerColor} 55%, white), ${activePlayerGradient[0]} 75%, ${activePlayerGradient[1]})`
                : activePlayerColor,
              boxShadow: `0 0 ${cellSize * 0.04}px ${activePlayerColor}40`,
            }}
          />
        </motion.div>
      )}

      {isOwned && playerColor && playerGradient && (
        <Orb
          count={cell.count}
          color={playerColor}
          gradient={playerGradient}
          cellSize={cellSize}
          isDanger={isNearCritical}
        />
      )}

      {isNearCritical && (
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none overflow-hidden"
          style={{
            boxShadow: `inset 0 0 ${Math.max(cellSize * 0.2, 3)}px ${playerColor}`,
            borderRadius: radius,
          }}
          animate={reducedMotion ? { opacity: 0.5 } : { opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div
            className="absolute inset-0 rounded-full"
            style={{
              border: `1px solid ${playerColor}`,
              borderRadius: radius,
            }}
          />
        </motion.div>
      )}

      {isExploding && (
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${playerColor}50, transparent)`,
            borderRadius: radius,
          }}
          initial={{ opacity: 0, scale: 0.3 }}
          animate={{ opacity: 1, scale: 2.5 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        />
      )}

      {isIllegalShake && (
        <motion.div
          key={illegalShakeKey}
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ borderRadius: radius, zIndex: 5 }}
          animate={{ x: [0, -4, 4, -4, 4, 0] }}
          transition={{ duration: 0.22, ease: 'easeInOut' }}
        >
          <div
            className="absolute inset-0 rounded-full"
            style={{
              border: `2px solid ${colors.player[0]}60`,
              borderRadius: radius,
              boxShadow: `inset 0 0 6px ${colors.player[0]}40`,
            }}
          />
        </motion.div>
      )}
    </motion.button>
  );
}
