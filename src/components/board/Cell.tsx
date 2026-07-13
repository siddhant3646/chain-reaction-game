'use client';

import { motion } from 'motion/react';
import { Cell as CellType } from '@/lib/engine';
import { getCriticalMass } from '@/lib/engine/board';
import { Orb } from './Orb';
import { colors } from '@/lib/design';
import { TravelingOrb } from './TravelingOrb';

interface CellProps {
  cell: CellType;
  index: number;
  cols: number;
  rows: number;
  playerIdx: number;
  isPlayable: boolean;
  isExploding: boolean;
  onPlace: (index: number) => void;
  cellSize: number;
  travelingOrbs: { fromIndex: number; toIndex: number; color: string; gradient: readonly [string, string] }[];
}

export function Cell({
  cell,
  index,
  cols,
  rows,
  playerIdx,
  isPlayable,
  isExploding,
  onPlace,
  cellSize,
  travelingOrbs,
}: CellProps) {
  const criticalMass = getCriticalMass(index, cols, rows);
  const isDanger = cell.count >= criticalMass - 1 && cell.count < criticalMass && cell.owner != null;
  const normalizedPlayerIdx = playerIdx >= 0 ? playerIdx % colors.player.length : -1;
  const playerColor = normalizedPlayerIdx >= 0 ? colors.player[normalizedPlayerIdx] : null;
  const playerGradient = normalizedPlayerIdx >= 0 ? colors.playerGradients[normalizedPlayerIdx] : null;

  const ownTravelers = travelingOrbs.filter(o => o.toIndex === index);
  const isOwned = cell.owner != null;

  return (
    <motion.button
      onClick={() => isPlayable && onPlace(index)}
      disabled={!isPlayable}
      className="relative outline-none select-none"
      style={{
        width: cellSize,
        height: cellSize,
        minWidth: 28,
        minHeight: 28,
        borderRadius: 4,
        background: isOwned
          ? `radial-gradient(circle at 50% 50%, ${playerColor}12, transparent 70%)`
          : 'transparent',
        boxShadow: isPlayable
          ? `inset 0 0 0 1px ${colors.gridLineActive}`
          : isOwned
          ? `inset 0 0 0 1px ${colors.gridLineActive}`
          : `inset 0 0 0 1px ${colors.gridLine}`,
        transition: 'box-shadow 0.2s ease, background 0.2s ease',
      }}
      whileHover={isPlayable ? { scale: 1.06 } : {}}
      whileTap={isPlayable ? { scale: 0.93 } : {}}
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
      {isOwned && playerColor && playerGradient && (
        <Orb
          count={cell.count}
          color={playerColor}
          gradient={playerGradient}
          cellSize={cellSize}
          isDanger={isDanger}
        />
      )}

      {ownTravelers.map((orb, i) => (
        <TravelingOrb
          key={`t${orb.fromIndex}-${i}`}
          color={orb.color}
          gradient={orb.gradient}
          cellSize={cellSize}
        />
      ))}

      {isDanger && (
        <motion.div
          className="absolute inset-0 rounded-sm pointer-events-none"
          style={{
            boxShadow: `inset 0 0 ${Math.max(cellSize * 0.2, 3)}px ${playerColor}`,
          }}
          animate={{ opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div
            className="absolute inset-[-2px] rounded-sm opacity-40"
            style={{
              border: `1px solid ${playerColor}`,
              boxShadow: `0 0 8px ${playerColor}60`,
            }}
            // pulsing ring animation handled by parent
          />
        </motion.div>
      )}

      {isExploding && (
        <motion.div
          className="absolute inset-0 rounded-sm pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${playerColor}50, transparent)`,
          }}
          initial={{ opacity: 0, scale: 0.3 }}
          animate={{ opacity: 1, scale: 2.5 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        />
      )}
    </motion.button>
  );
}
