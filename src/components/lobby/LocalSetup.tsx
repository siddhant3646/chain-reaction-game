'use client';

import { useState } from 'react';
import { GameConfig } from '@/lib/engine';
import { colors, fonts } from '@/lib/design';

interface LocalSetupProps {
  onStart: (config: GameConfig) => void;
}

export function LocalSetup({ onStart }: LocalSetupProps) {
  const [playerCount, setPlayerCount] = useState(2);
  const [names, setNames] = useState(['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5']);

  const getDefaultBoardSize = (count: number) => {
    if (count <= 3) return { cols: 6, rows: 9 };
    return { cols: 8, rows: 11 };
  };

  const handleStart = () => {
    const size = getDefaultBoardSize(playerCount);
    onStart({
      cols: size.cols,
      rows: size.rows,
      players: Array.from({ length: playerCount }, (_, i) => ({
        id: `p${i}`,
        name: names[i] || `Player ${i + 1}`,
        color: colors.player[i],
      })),
    });
  };

  return (
    <div className="flex flex-col items-center gap-5 sm:gap-6 px-2">
      <h2 className="text-lg sm:text-xl font-display tracking-wider text-text" style={{ fontFamily: fonts.display }}>
        Local Setup
      </h2>

      <div className="w-full space-y-4">
        <div>
          <label className="block text-xs sm:text-sm text-text-muted mb-2">Number of players</label>
          <div className="flex gap-2">
            {[2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => setPlayerCount(n)}
                className={`flex-1 py-2.5 sm:py-2 rounded text-xs sm:text-sm font-medium transition-all touch-manipulation ${
                  playerCount === n
                    ? 'bg-white/10 text-text border border-white/20'
                    : 'bg-white/5 text-text-muted border border-transparent hover:bg-white/10'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {Array.from({ length: playerCount }, (_, i) => (
            <div key={i} className="flex items-center gap-2 sm:gap-3">
              <div
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex-shrink-0"
                style={{ background: colors.player[i] }}
              />
              <input
                type="text"
                value={names[i]}
                onChange={(e) => {
                  const next = [...names];
                  next[i] = e.target.value;
                  setNames(next);
                }}
                placeholder={`Player ${i + 1}`}
                className="flex-1 bg-white/5 border border-white/10 rounded px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm text-text outline-none focus:border-white/30 transition-colors"
                maxLength={20}
              />
            </div>
          ))}
        </div>

        <p className="text-[10px] sm:text-xs text-text-muted text-center">
          Board: {getDefaultBoardSize(playerCount).cols} × {getDefaultBoardSize(playerCount).rows}
        </p>
      </div>

      <button
        onClick={handleStart}
        className="w-full py-3 sm:py-3.5 rounded-lg font-display tracking-wider text-xs sm:text-sm bg-white/10 hover:bg-white/20 active:bg-white/25 text-text border border-white/20 transition-all touch-manipulation"
      >
        Start Game
      </button>
    </div>
  );
}
