'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion } from 'motion/react';
import { Cell as CellType, Wave, Player, PlayerId } from '@/lib/engine';
import { getNeighborIndices, getCriticalMass } from '@/lib/engine/board';
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
  preMoveCells: CellType[] | null;
  movingPlayerId: PlayerId | null;
  clickedIndex: number;
  onPlace: (cellIndex: number) => void;
  onAdvanceWave: () => void;
  onSkipAnimations: () => void;
}

function useReducedMotion() {
  const r = useRef(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    r.current = mq.matches;
    const h = (e: MediaQueryListEvent) => { r.current = e.matches; };
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);
  return r;
}

function computeDisplayCells(
  baseCells: CellType[],
  clickedIdx: number,
  playerId: PlayerId,
  waves: Wave[],
  upToWave: number,
): CellType[] {
  const cells = baseCells.map(c => ({ ...c }));
  cells[clickedIdx].count += 1;
  cells[clickedIdx].owner = playerId;
  for (let w = 0; w <= upToWave && w < waves.length; w++) {
    for (const update of waves[w].updates) {
      cells[update.index] = { count: update.count, owner: update.owner };
    }
  }
  return cells;
}

export function Board({
  cells, cols, rows, currentPlayerId, players, isPlayable,
  waves, currentWave, animating, preMoveCells, movingPlayerId, clickedIndex,
  onPlace, onAdvanceWave, onSkipAnimations,
}: BoardProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(36);
  const [travelingOrbs, setTravelingOrbs] = useState<
    { fromIndex: number; toIndex: number; color: string; gradient: readonly [string, string] }[]
  >([]);
  const reducedMotion = useReducedMotion();

  // Refs for data needed by the animation effect — prevents timer resets
  // when Firebase listener updates gameState mid-animation
  const advanceRef = useRef(onAdvanceWave);
  advanceRef.current = onAdvanceWave;

  // Compute display cells: intermediate state during animation, final state otherwise
  const displayCells = useMemo(() => {
    if (animating && preMoveCells && movingPlayerId && clickedIndex >= 0 && waves.length > 0) {
      return computeDisplayCells(preMoveCells, clickedIndex, movingPlayerId, waves, currentWave);
    }
    return cells;
  }, [animating, preMoveCells, movingPlayerId, clickedIndex, waves, currentWave, cells]);

  const explodingCells = animating && waves[currentWave]
    ? new Set(waves[currentWave].explosions)
    : new Set<number>();

  useEffect(() => {
    if (!animating || !waves[currentWave]) return;
    const wave = waves[currentWave];
    const orbs: typeof travelingOrbs = [];

    // Use movingPlayerId for traveling orb colors — the post-explosion
    // cell.owner is null for fully exploded cells, so we can't use cells[expIdx].owner
    const movingIdx = movingPlayerId
      ? players.findIndex(p => p.id === movingPlayerId)
      : -1;
    const ci = movingIdx >= 0 ? movingIdx % colors.player.length : 0;
    const orbColor = colors.player[ci];
    const orbGradient = colors.playerGradients[ci];

    for (const expIdx of wave.explosions) {
      const neighbors = getNeighborIndices(expIdx, cols, rows);
      for (const nIdx of neighbors) {
        orbs.push({
          fromIndex: expIdx,
          toIndex: nIdx,
          color: orbColor,
          gradient: orbGradient,
        });
      }
    }
    setTravelingOrbs(orbs);

    const timer = setTimeout(() => {
      setTravelingOrbs([]);
      advanceRef.current();
    }, reducedMotion.current ? 50 : 320);

    return () => clearTimeout(timer);
    // Only depend on wave-changing values — NOT cells/players (use refs for those)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animating, currentWave, waves, cols, rows, movingPlayerId, reducedMotion]);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const gap = animating ? 70 : 40;
      const maxW = rect.width - 4;
      const maxH = window.innerHeight - rect.top - gap;
      const byW = Math.floor(maxW / cols);
      const byH = Math.floor(maxH / rows);
      setCellSize(Math.max(24, Math.min(byW, byH, 72)));
    };

    const ro = new ResizeObserver(update);
    ro.observe(el);
    update();
    window.addEventListener('resize', update);
    return () => { ro.disconnect(); window.removeEventListener('resize', update); };
  }, [cols, rows, animating]);

  const handlePlace = useCallback((i: number) => onPlace(i), [onPlace]);

  const gw = cols * cellSize;
  const gh = rows * cellSize;

  return (
    <div ref={wrapperRef} className="flex flex-col items-center w-full max-w-full px-0.5">
      {animating && (
        <motion.button
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={onSkipAnimations}
          className="mb-2 text-[11px] font-medium px-4 py-1.5 rounded-full transition-all active:scale-95"
          style={{
            background: 'rgba(255,255,255,0.06)',
            color: 'rgba(245,245,247,0.5)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
        >
          Skip — {waves.length - currentWave} left
        </motion.button>
      )}

      <motion.div
        layout
        className="relative"
        role="grid"
        aria-label="Game board"
        style={{
          width: gw,
          height: gh,
          borderRadius: 6,
          background: `
            linear-gradient(to right, ${colors.gridLine} 1px, transparent 1px),
            linear-gradient(to bottom, ${colors.gridLine} 1px, transparent 1px)
          `,
          backgroundSize: `${cellSize}px ${cellSize}px`,
          transition: 'width 0.2s ease, height 0.2s ease',
        }}
      >
        {displayCells.map((cell, index) => {
          const playerIdx = cell.owner ? players.findIndex(p => p.id === cell.owner) : -1;
          return (
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
                playerIdx={playerIdx}
                isPlayable={isPlayable && !explodingCells.has(index)}
                isExploding={explodingCells.has(index)}
                onPlace={handlePlace}
                cellSize={cellSize}
                travelingOrbs={travelingOrbs.filter(o => o.toIndex === index)}
              />
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}