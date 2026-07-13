'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { GameConfig } from '@/lib/engine';
import { colors, fonts, radius } from '@/lib/design';

interface LocalSetupProps {
  onStart: (config: GameConfig) => void;
}

export function LocalSetup({ onStart }: LocalSetupProps) {
  const [playerCount, setPlayerCount] = useState(2);
  const [names, setNames] = useState(['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5']);

  const boardSize = playerCount <= 3 ? { cols: 6, rows: 9 } : { cols: 8, rows: 11 };

  const handleStart = () => {
    onStart({
      cols: boardSize.cols,
      rows: boardSize.rows,
      players: Array.from({ length: playerCount }, (_, i) => ({
        id: `p${i}`,
        name: names[i] || `Player ${i + 1}`,
        color: colors.player[i],
      })),
    });
  };

  return (
    <motion.div
      className="w-full max-w-sm mx-auto px-1"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        className="p-6 sm:p-8 rounded-3xl"
        style={{
          background: colors.surface,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${colors.glassBorder}`,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        <h2
          className="text-lg font-semibold tracking-tight text-center mb-6"
          style={{ color: colors.text }}
        >
          Local Setup
        </h2>

        <div className="space-y-5">
          <div>
            <label className="block text-xs font-medium mb-2.5" style={{ color: colors.textSecondary }}>
              Players
            </label>
            <div className="flex gap-2">
              {[2, 3, 4, 5].map(n => {
                const active = playerCount === n;
                return (
                  <motion.button
                    key={n}
                    onClick={() => setPlayerCount(n)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                    whileTap={{ scale: 0.95 }}
                    style={{
                      background: active
                        ? 'rgba(255,255,255,0.1)'
                        : 'rgba(255,255,255,0.03)',
                      color: active ? colors.text : colors.textMuted,
                      border: `1px solid ${active ? colors.glassBorderHover : 'transparent'}`,
                      boxShadow: active ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
                    }}
                  >
                    {n}
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2.5">
            {Array.from({ length: playerCount }, (_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${colors.playerGradients[i][0]}, ${colors.playerGradients[i][1]})`,
                    boxShadow: `0 0 6px ${colors.playerGlow[i]}`,
                  }}
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
                  className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    color: colors.text,
                  }}
                  maxLength={20}
                />
              </div>
            ))}
          </div>

          <p className="text-[11px] text-center" style={{ color: colors.textMuted }}>
            Board: {boardSize.cols} × {boardSize.rows}
          </p>
        </div>

        <motion.button
          onClick={handleStart}
          className="w-full mt-6 py-3 rounded-2xl text-sm font-medium transition-all"
          whileTap={{ scale: 0.97 }}
          style={{
            background: 'rgba(255,255,255,0.1)',
            color: colors.text,
            border: `1px solid ${colors.glassBorderHover}`,
            boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
          }}
        >
          Start Game
        </motion.button>
      </div>
    </motion.div>
  );
}
