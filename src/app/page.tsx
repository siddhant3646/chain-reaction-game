'use client';

import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { colors, fonts } from '@/lib/design';

function BackgroundAnimation() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      {Array.from({ length: 20 }, (_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 2 + (i % 3) * 2,
            height: 2 + (i % 3) * 2,
            left: `${10 + (i * 17) % 80}%`,
            top: `${20 + (i * 23) % 60}%`,
            background: colors.player[i % colors.player.length],
            opacity: 0.15,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.1, 0.3, 0.1],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 3 + (i % 4),
            repeat: Infinity,
            delay: i * 0.4,
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
    <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 relative min-h-dvh">
      <BackgroundAnimation />

      <div className="flex-1 flex flex-col items-center justify-center w-full">
        <motion.div
          className="text-center mb-8 sm:mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-display tracking-[0.15em] mb-2 sm:mb-3"
            style={{ fontFamily: fonts.display }}
          >
            CHAIN
            <br />
            REACTION
          </h1>
          <p className="text-text-muted text-xs sm:text-sm max-w-xs mx-auto px-4">
            Place orbs. Build critical mass. Control the cascade.
          </p>
        </motion.div>

        <motion.div
          className="flex flex-col gap-3 sm:gap-4 w-full max-w-xs px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <button
            onClick={() => router.push('/room/create')}
            className="w-full py-3.5 sm:py-4 px-6 rounded-lg font-display tracking-wider text-sm bg-white/10 hover:bg-white/20 active:bg-white/25 text-text border border-white/20 transition-all touch-manipulation"
          >
            Create Online Room
          </button>
          <button
            onClick={() => router.push('/play/local')}
            className="w-full py-3.5 sm:py-4 px-6 rounded-lg font-display tracking-wider text-sm bg-white/5 hover:bg-white/15 active:bg-white/20 text-text border border-white/10 transition-all touch-manipulation"
          >
            Play Locally
          </button>
        </motion.div>
      </div>

      <motion.p
        className="pb-4 sm:pb-6 text-xs text-text-muted"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        2–5 players · online or pass-and-play
      </motion.p>
    </main>
  );
}
