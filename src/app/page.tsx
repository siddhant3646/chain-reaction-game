'use client';

import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { colors, fonts } from '@/lib/design';

function ParticleField() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          background: `radial-gradient(ellipse at 50% -20%, #1E90FF, transparent 60%)`,
        }}
      />
      {Array.from({ length: 30 }, (_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 1.5 + (i % 3) * 1.5,
            height: 1.5 + (i % 3) * 1.5,
            left: `${5 + (i * 13) % 90}%`,
            top: `${10 + (i * 19) % 80}%`,
            background: colors.player[i % colors.player.length],
          }}
          animate={{
            y: [0, -30 - (i % 20), 0],
            opacity: [0.08, 0.25, 0.08],
          }}
          transition={{
            duration: 4 + (i % 5),
            repeat: Infinity,
            delay: i * 0.3,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

export default function Home() {
  const router = useRouter();

  return (
    <main className="flex-1 flex flex-col min-h-dvh" style={{ background: colors.background }}>
      <ParticleField />

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <motion.div
          className="text-center mb-10 sm:mb-14"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1
            className="text-[2.25rem] leading-[1.1] sm:text-5xl md:text-6xl font-semibold tracking-tight mb-3 text-[#f5f5f7]"
            style={{ fontFamily: fonts.display }}
          >
            Chain
            <br />
            Reaction
          </h1>
          <p className="text-sm text-[rgba(245,245,247,0.5)] max-w-xs mx-auto leading-relaxed">
            Place orbs. Build critical mass.
            <br />
            Control the cascade.
          </p>
        </motion.div>

        <motion.div
          className="flex flex-col gap-3 w-full max-w-[320px]"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          <button
            onClick={() => router.push('/room/create')}
            className="group relative w-full py-3.5 px-6 rounded-2xl text-sm font-medium text-[#f5f5f7] overflow-hidden transition-all duration-300 active:scale-[0.97]"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 100%)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.08) 100%)' }}
            />
            <span className="relative z-10">Create Online Room</span>
          </button>

          <button
            onClick={() => router.push('/play/local')}
            className="group relative w-full py-3.5 px-6 rounded-2xl text-sm font-medium text-[rgba(245,245,247,0.6)] overflow-hidden transition-all duration-300 active:scale-[0.97]"
            style={{
              background: 'rgba(255,255,255,0.04)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            />
            <span className="relative z-10">Play Locally</span>
          </button>
        </motion.div>
      </div>

      <motion.p
        className="pb-6 text-center text-xs text-[rgba(245,245,247,0.25)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        2–5 players · online or pass-and-play
      </motion.p>
    </main>
  );
}
