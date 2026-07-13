'use client';

import { useState } from 'react';
import { Board } from '@/components/board/Board';
import { LocalSetup } from '@/components/lobby/LocalSetup';
import { GameOver } from '@/components/lobby/GameOver';
import { useLocalGameStore } from '@/lib/store';
import { GameConfig } from '@/lib/engine';
import { colors, fonts } from '@/lib/design';
import Link from 'next/link';

export default function LocalPlayPage() {
  const {
    state, config, waves, currentWave, animating,
    eliminatedToast, winner,
    initGame, placeOrb, advanceWave, skipAnimations, clearEliminatedToast, reset,
  } = useLocalGameStore();

  const [showSetup, setShowSetup] = useState(true);

  const handleStart = (gameConfig: GameConfig) => {
    initGame(gameConfig);
    setShowSetup(false);
  };

  const handleRematch = () => {
    if (config) initGame(config);
  };

  const handleNewGame = () => {
    reset();
    setShowSetup(true);
  };

  if (showSetup) {
    return (
      <main className="flex-1 flex items-center justify-center p-4 min-h-dvh">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <Link href="/" className="text-sm text-text-muted hover:text-text transition-colors inline-block py-2">
              ← Back
            </Link>
          </div>
          <LocalSetup onStart={handleStart} />
        </div>
      </main>
    );
  }

  if (!state || !config) return null;

  const currentPlayer = state.players[state.currentPlayerIndex];
  const winnerPlayer = winner
    ? state.players.find(p => p.id === winner) || null
    : null;

  return (
    <main className="flex-1 flex flex-col items-center min-h-dvh p-2 sm:p-4">
      {eliminatedToast && (
        <div className="fixed top-4 right-4 z-30 bg-red-900/70 text-red-200 px-3 py-1.5 rounded text-xs sm:text-sm backdrop-blur-sm shadow-lg">
          {state.players.find(p => p.id === eliminatedToast)?.name} eliminated!
        </div>
      )}

      <div className="w-full flex items-center justify-between mb-1 sm:mb-2 px-1 py-1">
        <Link href="/" className="text-xs sm:text-sm text-text-muted hover:text-text transition-colors py-2">
          ← Exit
        </Link>
        <h1 className="text-sm sm:text-base font-display tracking-wider text-text truncate mx-2" style={{ fontFamily: fonts.display }}>
          Chain Reaction
        </h1>
        <div className="w-10" />
      </div>

      <div className="flex gap-1.5 sm:gap-2 flex-wrap justify-center px-1 mb-1 sm:mb-2 max-w-full">
        {state.players.map((p, i) => (
          <div
            key={p.id}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs transition-all whitespace-nowrap ${
              !p.eliminated && state.currentPlayerIndex === i
                ? 'bg-white/15 text-text shadow-lg'
                : p.eliminated
                ? 'text-text-muted/40 line-through'
                : 'text-text-muted'
            }`}
            style={{
              boxShadow: !p.eliminated && state.currentPlayerIndex === i
                ? `0 0 10px ${colors.playerGlow[i]}`
                : 'none',
            }}
          >
            <span
              className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full flex-shrink-0"
              style={{ background: colors.player[i], opacity: p.eliminated ? 0.3 : 1 }}
            />
            <span className="truncate max-w-[60px] sm:max-w-none">{p.name}</span>
            {!p.eliminated && state.currentPlayerIndex === i && (
              <span className="text-[8px] sm:text-[10px] opacity-70 ml-0.5">●</span>
            )}
          </div>
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
        onPlace={placeOrb}
        onAdvanceWave={advanceWave}
        onSkipAnimations={skipAnimations}
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
