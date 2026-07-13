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
  isPlayable: boolean;
  isCurrentPlayer: boolean;
  isExploding: boolean;
  onPlace: (index: number) => void;
  cellSize: number;
  travelingOrbs: { fromIndex: number; toIndex: number; color: string }[];
}

export function Cell({
  cell,
  index,
  cols,
  rows,
  isPlayable,
  isCurrentPlayer,
  isExploding,
  onPlace,
  cellSize,
  travelingOrbs,
}: CellProps) {
  const criticalMass = getCriticalMass(index, cols, rows);
  const isDanger = cell.count >= criticalMass - 1 && cell.count < criticalMass && cell.owner !== null;
  const playerColor = cell.owner
    ? colors.player[parseInt(cell.owner.replace('p', '')) % colors.player.length]
    : null;

  const ownTravelers = travelingOrbs.filter(o => o.toIndex === index);

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
        background: cell.owner
          ? `radial-gradient(circle at 50% 50%, ${playerColor}10, transparent)`
          : 'transparent',
        boxShadow: isPlayable
          ? `inset 0 0 0 1px ${colors.gridLineActive}`
          : `inset 0 0 0 1px ${colors.gridLine}`,
        transition: 'background 0.15s, box-shadow 0.15s',
        WebkitTapHighlightColor: 'transparent',
      }}
      whileHover={isPlayable ? { scale: 1.08 } : {}}
      whileTap={isPlayable ? { scale: 0.92 } : {}}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (isPlayable) onPlace(index);
        }
      }}
      tabIndex={isPlayable ? 0 : -1}
      aria-label={
        cell.owner
          ? `Cell ${index % cols + 1}, ${Math.floor(index / cols) + 1}, ${cell.count} orbs`
          : `Cell ${index % cols + 1}, ${Math.floor(index / cols) + 1}, empty`
      }
    >
      {cell.owner && (
        <Orb
          count={cell.count}
          color={playerColor!}
          cellSize={cellSize}
          isDanger={isDanger}
        />
      )}

      {ownTravelers.map((orb, i) => (
        <TravelingOrb
          key={`travel-${orb.fromIndex}-${i}`}
          color={orb.color}
          cellSize={cellSize}
        />
      ))}

      {isDanger && (
        <motion.div
          className="absolute inset-0 rounded-sm pointer-events-none"
          style={{
            boxShadow: `inset 0 0 ${Math.max(cellSize * 0.25, 4)}px ${playerColor}`,
          }}
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {isExploding && (
        <motion.div
          className="absolute inset-0 rounded-sm pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${playerColor}60, transparent)`,
          }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 2.5 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        />
      )}
    </motion.button>
  );
}
