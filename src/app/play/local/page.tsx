'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Board } from '@/components/board/Board';
import { LocalSetup } from '@/components/lobby/LocalSetup';
import { GameOver } from '@/components/lobby/GameOver';
import { PlayerPill } from '@/components/ui/PlayerPill';
import { useLocalGameStore } from '@/lib/store';
import { GameConfig } from '@/lib/engine';
import { colors } from '@/lib/design';

export default function LocalPlayPage() {
  const {
    state, config, waves, currentWave, animating,
    eliminatedToast, winner,
    preMoveCells, movingPlayerId, clickedIndex,
    illegalMoveIndex, illegalMoveAttempt,
    initGame, placeOrb, advanceWave, skipAnimations, clearEliminatedToast, reset,
  } = useLocalGameStore();

  const [showSetup, setShowSetup] = useState(true);

  const handleStart = (c: GameConfig) => { initGame(c); setShowSetup(false); };
  const handleRematch = () => { if (config) initGame(config); };
  const handleNewGame = () => { reset(); setShowSetup(true); };

  useEffect(() => {
    if (!eliminatedToast) return;
    const timer = setTimeout(clearEliminatedToast, 2000);
    return () => clearTimeout(timer);
  }, [eliminatedToast, clearEliminatedToast]);

  if (showSetup) {
    return (
      <main className="flex-1 flex flex-col min-h-dvh" style={{ background: colors.background }}>
        <div className="flex-1 flex items-center justify-center p-5">
          <div className="w-full">
            <div className="text-center mb-6">
              <button
                onClick={() => { reset(); window.history.back(); }}
                className="inline-block py-2 text-sm transition-colors"
                style={{ color: colors.textMuted }}
              >
                ← Back
              </button>
            </div>
            <LocalSetup onStart={handleStart} />
          </div>
        </div>
      </main>
    );
  }

  if (!state || !config) return null;

  const currentPlayer = state.players[state.currentPlayerIndex];
  const winnerPlayer = winner ? state.players.find(p => p.id === winner) || null : null;

  return (
    <main className="flex flex-col min-h-dvh p-2 sm:p-3" style={{ background: colors.background }}>
      <AnimatePresence>
        {eliminatedToast && (
          <motion.div
            key={eliminatedToast}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-4 right-4 z-30 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{
              background: 'rgba(255,71,87,0.2)',
              color: '#FF4757',
              border: '1px solid rgba(255,71,87,0.15)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
          >
            {state.players.find(p => p.id === eliminatedToast)?.name} eliminated
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mb-1 px-1 py-1">
        <button
          onClick={() => { reset(); window.history.back(); }}
          className="text-xs font-medium transition-colors py-2"
          style={{ color: colors.textMuted }}
        >
          ← Exit
        </button>
        <h1
          className="text-sm font-semibold tracking-tight truncate mx-2"
          style={{ color: colors.text }}
        >
          Chain Reaction
        </h1>
        <div className="w-10" />
      </div>

      <div className="flex gap-1.5 flex-wrap justify-center px-1 mb-1.5">
        {state.players.map((p, i) => (
          <PlayerPill
            key={p.id}
            name={p.name}
            color={colors.player[i]}
            glow={colors.playerGlow[i]}
            isActive={!p.eliminated && state.currentPlayerIndex === i}
            isEliminated={p.eliminated}
          />
        ))}
      </div>

      <Board
        cells={state.cells}
        cols={state.cols}
        rows={state.rows}
        currentPlayerId={currentPlayer?.id || null}
        players={state.players}
        isPlayable={state.status === 'playing' && !currentPlayer?.eliminated}
        waves={waves}
        currentWave={currentWave}
        animating={animating}
        preMoveCells={preMoveCells}
        movingPlayerId={movingPlayerId}
        clickedIndex={clickedIndex}
        onPlace={placeOrb}
        onAdvanceWave={advanceWave}
        onSkipAnimations={skipAnimations}
        illegalMoveIndex={illegalMoveIndex}
        illegalMoveAttempt={illegalMoveAttempt}
      />

      {state.status === 'finished' && winnerPlayer && (
        <GameOver
          winner={winnerPlayer}
          players={state.players}
          onRematch={handleRematch}
          onNewGame={handleNewGame}
        />
      )}
    </main>
  );
}
