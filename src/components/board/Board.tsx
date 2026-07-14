'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Cell as CellType, Wave, Player, PlayerId } from '@/lib/engine';
import { getNeighborIndices } from '@/lib/engine/board';
import { Cell } from './Cell';
import { TravelingOrb } from './TravelingOrb';
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
  illegalMoveIndex: number;
  illegalMoveAttempt: number;
}

type WavePhase = 'idle' | 'anticipate' | 'travel' | 'settle';

const ANTICIPATION_MS = 130;
const TRAVEL_MS = 200;
const IMPACT_SETTLE_MS = 150;

function computeDisplayCells(
  baseCells: CellType[],
  clickedIdx: number,
  playerId: PlayerId,
  waves: Wave[],
  upToWave: number,
  includeCurrentWave: boolean,
): CellType[] {
  const cells = baseCells.map(c => ({ ...c }));
  cells[clickedIdx].count += 1;
  cells[clickedIdx].owner = playerId;
  const limit = includeCurrentWave ? upToWave : upToWave - 1;
  for (let w = 0; w <= limit && w < waves.length; w++) {
    for (const update of waves[w].updates) {
      cells[update.index] = { count: update.count, owner: update.owner };
    }
  }
  return cells;
}

function computeStagger(waveIndex: number): number {
  return Math.max(120 * Math.pow(0.85, Math.max(0, waveIndex - 1)), 40);
}

interface TravelingOrbOnBoard {
  id: string;
  color: string;
  gradient: readonly [string, string];
  cellSize: number;
  sourceX: number;
  sourceY: number;
  destX: number;
  destY: number;
  duration: number;
}

export function Board({
  cells, cols, rows, currentPlayerId, players, isPlayable,
  waves, currentWave, animating, preMoveCells, movingPlayerId, clickedIndex,
  onPlace, onAdvanceWave, onSkipAnimations,
  illegalMoveIndex, illegalMoveAttempt,
}: BoardProps) {
  const reducedMotion = useReducedMotion();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(36);
  const [wavePhase, setWavePhase] = useState<WavePhase>('idle');

  const advanceRef = useRef(onAdvanceWave);
  useEffect(() => { advanceRef.current = onAdvanceWave; }, [onAdvanceWave]);

  const displayCells = useMemo(() => {
    if (animating && preMoveCells && movingPlayerId && clickedIndex >= 0 && waves.length > 0) {
      const includeCurrent = wavePhase === 'travel' || wavePhase === 'settle';
      return computeDisplayCells(preMoveCells, clickedIndex, movingPlayerId, waves, currentWave, includeCurrent);
    }
    return cells;
  }, [animating, preMoveCells, movingPlayerId, clickedIndex, waves, currentWave, cells, wavePhase]);

  const explodingCells = useMemo(() => {
    if (!animating || !waves[currentWave]) return new Set<number>();
    if (wavePhase === 'anticipate' || wavePhase === 'travel') {
      return new Set(waves[currentWave].explosions);
    }
    return new Set<number>();
  }, [animating, waves, currentWave, wavePhase]);

  const boardTravelingOrbs = useMemo<TravelingOrbOnBoard[]>(() => {
    if (wavePhase !== 'travel' || !animating || !waves[currentWave]) return [];
    const wave = waves[currentWave];
    const movingIdx = movingPlayerId
      ? players.findIndex(p => p.id === movingPlayerId)
      : -1;
    const ci = movingIdx >= 0 ? movingIdx % colors.player.length : 0;
    const orbColor = colors.player[ci];
    const orbGradient = colors.playerGradients[ci];

    const orbs: TravelingOrbOnBoard[] = [];
    for (const expIdx of wave.explosions) {
      const neighbors = getNeighborIndices(expIdx, cols, rows);
      const srcX = (expIdx % cols) * cellSize + cellSize / 2;
      const srcY = Math.floor(expIdx / cols) * cellSize + cellSize / 2;
      for (const nIdx of neighbors) {
        const dstX = (nIdx % cols) * cellSize + cellSize / 2;
        const dstY = Math.floor(nIdx / cols) * cellSize + cellSize / 2;
        orbs.push({
          id: `${expIdx}-${nIdx}-${currentWave}`,
          color: orbColor,
          gradient: orbGradient,
          cellSize,
          sourceX: srcX,
          sourceY: srcY,
          destX: dstX,
          destY: dstY,
          duration: TRAVEL_MS / 1000,
        });
      }
    }
    return orbs;
  }, [wavePhase, animating, currentWave, waves, movingPlayerId, players, cols, rows, cellSize]);

  const currentPlayerColor = useMemo(() => {
    if (!currentPlayerId) return null;
    const idx = players.findIndex(p => p.id === currentPlayerId);
    return idx >= 0 ? colors.player[idx % colors.player.length] : null;
  }, [currentPlayerId, players]);

  const currentPlayerGradient = useMemo(() => {
    if (!currentPlayerId) return null;
    const idx = players.findIndex(p => p.id === currentPlayerId);
    return idx >= 0 ? colors.playerGradients[idx % colors.player.length] : null;
  }, [currentPlayerId, players]);

  useEffect(() => {
    if (!animating || !waves[currentWave]) return;
    if (reducedMotion) {
      advanceRef.current();
      return;
    }
    if (wavePhase === 'idle') {
      const tA = setTimeout(() => setWavePhase('anticipate'), 0);
      const tT = setTimeout(() => setWavePhase('travel'), ANTICIPATION_MS);
      const tS = setTimeout(() => setWavePhase('settle'), ANTICIPATION_MS + TRAVEL_MS + IMPACT_SETTLE_MS);
      const stagger = computeStagger(currentWave);
      const tDone = setTimeout(() => {
        setWavePhase('idle');
        advanceRef.current();
      }, ANTICIPATION_MS + TRAVEL_MS + IMPACT_SETTLE_MS + stagger);
      return () => { clearTimeout(tA); clearTimeout(tT); clearTimeout(tS); clearTimeout(tDone); };
    }
  }, [animating, currentWave, waves, reducedMotion, wavePhase]);

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

    const ro = new ResizeObserver(() => requestAnimationFrame(update));
    ro.observe(el);
    requestAnimationFrame(update);
    window.addEventListener('resize', update);
    return () => { ro.disconnect(); window.removeEventListener('resize', update); };
  }, [cols, rows, animating]);

  const handlePlace = useCallback((i: number) => onPlace(i), [onPlace]);

  const gw = cols * cellSize;
  const gh = rows * cellSize;
  const isSettlePhase = wavePhase === 'settle';

  return (
    <div ref={wrapperRef} className="flex flex-col items-center w-full max-w-full px-0.5">
      {animating && !reducedMotion && (
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
        {boardTravelingOrbs.map(orb => (
          <TravelingOrb
            key={orb.id}
            color={orb.color}
            gradient={orb.gradient}
            cellSize={orb.cellSize}
            sourceX={orb.sourceX}
            sourceY={orb.sourceY}
            destX={orb.destX}
            destY={orb.destY}
            duration={orb.duration}
          />
        ))}

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
                isPlayable={isPlayable && !explodingCells.has(index) && !isSettlePhase}
                isExploding={explodingCells.has(index)}
                isIllegalShake={illegalMoveIndex === index && illegalMoveAttempt > 0}
                illegalShakeKey={illegalMoveAttempt}
                onPlace={handlePlace}
                cellSize={cellSize}
                activePlayerColor={currentPlayerColor}
                activePlayerGradient={currentPlayerGradient}
              />
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
