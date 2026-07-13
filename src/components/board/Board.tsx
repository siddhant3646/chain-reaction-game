'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import { Cell as CellType, Wave, Player, PlayerId } from '@/lib/engine';
import { getNeighborIndices } from '@/lib/engine/board';
import { Cell } from './Cell';
import { colors } from '@/lib/design';

interface BoardProps {
  cells: CellType[];
  cols: number;
  rows: number;
  currentPlayerId: PlayerId | null;
  players: Player[];
  isPlayable: boolean;
  waves: Wave[];
  currentWave: number;
  animating: boolean;
  onPlace: (cellIndex: number) => void;
  onAdvanceWave: () => void;
  onSkipAnimations: () => void;
}

function useReducedMotion() {
  const ref = useRef(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    ref.current = mq.matches;
    const handler = (e: MediaQueryListEvent) => { ref.current = e.matches; };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return ref;
}

export function Board({
  cells,
  cols,
  rows,
  currentPlayerId,
  players,
  isPlayable,
  waves,
  currentWave,
  animating,
  onPlace,
  onAdvanceWave,
  onSkipAnimations,
}: BoardProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(40);
  const [travelingOrbs, setTravelingOrbs] = useState<{ fromIndex: number; toIndex: number; color: string }[]>([]);
  const prefersReducedMotion = useReducedMotion();

  const explodingCells = animating && waves[currentWave]
    ? new Set(waves[currentWave].explosions)
    : new Set<number>();

  useEffect(() => {
    if (!animating || !waves[currentWave]) return;
    const wave = waves[currentWave];
    const orbs: { fromIndex: number; toIndex: number; color: string }[] = [];

    for (const expIdx of wave.explosions) {
      const cell = cells[expIdx];
      const owner = cell.owner;
      if (!owner) continue;
      const color = colors.player[players.findIndex(p => p.id === owner) % colors.player.length];
      const neighbors = getNeighborIndices(expIdx, cols, rows);
      for (const nIdx of neighbors) {
        orbs.push({ fromIndex: expIdx, toIndex: nIdx, color });
      }
    }
    setTravelingOrbs(orbs);

    const delay = prefersReducedMotion.current ? 50 : 350;
    const timer = setTimeout(() => {
      setTravelingOrbs([]);
      onAdvanceWave();
    }, delay);

    return () => clearTimeout(timer);
  }, [animating, currentWave, waves, cells, cols, rows, players, onAdvanceWave, prefersReducedMotion]);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      const padX = 8;
      const padY = 8;

      const gap = waves.length > 0 && animating ? 80 : 48;
      const maxW = rect.width - padX * 2;
      const maxH = window.innerHeight - rect.top - gap;

      const sizeFromW = Math.floor(maxW / cols);
      const sizeFromH = Math.floor(maxH / rows);

      const clamped = Math.max(28, Math.min(sizeFromW, sizeFromH, 72));
      setCellSize(clamped);
    };

    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    updateSize();

    window.addEventListener('resize', updateSize);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, [cols, rows, animating, waves.length]);

  const handlePlace = useCallback((index: number) => {
    if (!animating) onPlace(index);
  }, [animating, onPlace]);

  const gridWidth = cols * cellSize;
  const gridHeight = rows * cellSize;

  return (
    <div ref={wrapperRef} className="flex flex-col items-center w-full max-w-full px-1">
      {animating && (
        <button
          onClick={onSkipAnimations}
          className="mb-2 text-xs px-4 py-1.5 rounded bg-surface-light text-text-muted hover:text-text active:text-text transition-colors touch-manipulation"
        >
          Skip ({waves.length - currentWave} left)
        </button>
      )}

      <div
        className="relative"
        role="grid"
        aria-label="Game board"
        style={{
          width: gridWidth,
          height: gridHeight,
          maxWidth: '100%',
          background: `
            linear-gradient(to right, ${colors.gridLine} 1px, transparent 1px),
            linear-gradient(to bottom, ${colors.gridLine} 1px, transparent 1px)
          `,
          backgroundSize: `${cellSize}px ${cellSize}px`,
        }}
      >
        {cells.map((cell, index) => (
          <div
            key={index}
            className="absolute"
            style={{
              left: (index % cols) * cellSize,
              top: Math.floor(index / cols) * cellSize,
            }}
          >
            <Cell
              cell={cell}
              index={index}
              cols={cols}
              rows={rows}
              isPlayable={isPlayable && !explodingCells.has(index)}
              isCurrentPlayer={cell.owner === currentPlayerId}
              isExploding={explodingCells.has(index)}
              onPlace={handlePlace}
              cellSize={cellSize}
              travelingOrbs={travelingOrbs.filter(o => o.toIndex === index)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
