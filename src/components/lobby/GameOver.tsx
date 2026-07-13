'use client';

import { useState, useEffect } from 'react';
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
    Array.from({ length: 24 }, (_, i) => ({
      id: i,
      x: 5 + Math.random() * 90,
      delay: Math.random() * 1.5,
      duration: 2 + Math.random() * 2,
      s: 2 + (i % 4) * 2,
      r: Math.random() > 0.5 ? '50%' : '1px',
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
            top: -8,
            width: p.s,
            height: p.s * 1.6,
            background: color,
            borderRadius: p.r as any,
          }}
          animate={{
            y: [0, typeof window !== 'undefined' ? window.innerHeight + 20 : 800],
            rotate: [0, 540 + p.id * 30],
            opacity: [1, 0.6, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: [0.16, 1, 0.3, 1],
          }}
        />
      ))}
    </div>
  );
}

export function GameOver({ winner, players, onRematch, onNewGame }: GameOverProps) {
  const winnerPlayer = winner ? players.find(p => p.id === winner.id) || winner : null;
  const wIdx = winnerPlayer ? players.indexOf(winnerPlayer) % colors.player.length : -1;
  const wColor = wIdx >= 0 ? colors.player[wIdx] : colors.text;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-5" style={{ background: 'rgba(0,0,0,0.6)' }}>
      {winnerPlayer && <Confetti color={wColor} />}

      <motion.div
        className="w-full max-w-sm rounded-3xl overflow-hidden"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 250, damping: 22, mass: 0.8 }}
        style={{
          background: colors.surface,
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          border: `1px solid ${colors.glassBorder}`,
          boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
        }}
      >
        <div className="p-7 sm:p-8 text-center">
          <motion.div
            className="w-12 h-12 rounded-full mx-auto mb-4"
            style={{
              background: winnerPlayer
                ? `linear-gradient(135deg, ${colors.playerGradients[wIdx][0]}, ${colors.playerGradients[wIdx][1]})`
                : 'rgba(255,255,255,0.1)',
              boxShadow: winnerPlayer ? `0 0 20px ${colors.playerGlow[wIdx]}` : 'none',
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
          />

          <h2 className="text-xl font-semibold tracking-tight mb-1" style={{ color: wColor }}>
            {winnerPlayer ? `${winnerPlayer.name} Wins` : 'Draw'}
          </h2>
          <p className="text-sm mb-7" style={{ color: colors.textMuted }}>
            {winnerPlayer
              ? 'The chain reaction is complete.'
              : 'No orbs remain.'}
          </p>

          <div className="flex flex-col gap-2.5">
            <motion.button
              onClick={onRematch}
              className="w-full py-3 rounded-2xl text-sm font-medium transition-all"
              whileTap={{ scale: 0.97 }}
              style={{
                background: 'rgba(255,255,255,0.1)',
                color: colors.text,
                border: `1px solid ${colors.glassBorderHover}`,
              }}
            >
              Rematch
            </motion.button>
            <motion.button
              onClick={onNewGame}
              className="w-full py-3 rounded-2xl text-sm font-medium transition-all"
              whileTap={{ scale: 0.97 }}
              style={{ color: colors.textSecondary }}
            >
              New Game
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
