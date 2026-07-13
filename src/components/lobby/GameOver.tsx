'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Player } from '@/lib/engine';
import { colors, fonts } from '@/lib/design';

interface GameOverProps {
  winner: Player | null;
  players: Player[];
  onRematch: () => void;
  onNewGame: () => void;
}

function Confetti({ color }: { color: string }) {
  const [pieces] = useState(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2.5 + Math.random() * 2,
      size: 3 + Math.random() * 5,
    }))
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {pieces.map(p => (
        <motion.div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: -10,
            width: p.size,
            height: p.size,
            background: color,
            borderRadius: p.id % 3 === 0 ? '50%' : '2px',
          }}
          animate={{
            y: [0, typeof window !== 'undefined' ? window.innerHeight + 20 : 800],
            rotate: [0, 720],
            opacity: [1, 0.8, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
}

export function GameOver({ winner, players, onRematch, onNewGame }: GameOverProps) {
  const winnerData = winner ? players.find(p => p.id === winner.id) || winner : null;
  const winnerColor = winnerData
    ? colors.player[players.indexOf(winnerData) % colors.player.length]
    : colors.text;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      {winnerData && <Confetti color={winnerColor} />}
      <motion.div
        className="bg-surface border border-white/10 rounded-xl p-6 sm:p-8 w-full max-w-sm mx-auto text-center shadow-2xl"
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <h2
          className="text-2xl sm:text-3xl font-display tracking-wider mb-2"
          style={{ fontFamily: fonts.display, color: winnerColor }}
        >
          {winnerData ? `${winnerData.name} Wins!` : 'Draw!'}
        </h2>
        <p className="text-text-muted text-xs sm:text-sm mb-6 sm:mb-8">
          {winnerData
            ? 'Critical mass achieved. The chain reaction is complete.'
            : 'No orbs remain. The reaction fizzles.'}
        </p>
        <div className="flex flex-col gap-2 sm:gap-3">
          <button
            onClick={onRematch}
            className="py-3 px-6 rounded-lg font-display tracking-wider text-sm bg-white/10 hover:bg-white/20 active:bg-white/25 text-text border border-white/20 transition-all touch-manipulation"
          >
            Rematch
          </button>
          <button
            onClick={onNewGame}
            className="py-3 px-6 rounded-lg text-sm text-text-muted hover:text-text active:text-text transition-colors touch-manipulation"
          >
            New Game
          </button>
        </div>
      </motion.div>
    </div>
  );
}
