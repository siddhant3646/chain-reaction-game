'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuid } from 'uuid';
import { motion } from 'motion/react';
import { ref, set } from 'firebase/database';
import { getFirebaseDb } from '@/lib/firebase/client';
import { generateRoomCode } from '@/lib/engine/board';
import { colors, fonts } from '@/lib/design';

export default function CreateRoomPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const createRoom = async () => {
    if (!name.trim()) { setError('Enter a name'); return; }
    const db = getFirebaseDb();
    if (!db) { setError('Firebase not configured'); return; }
    setCreating(true);
    setError('');

    const playerId = uuid();
    const roomCode = generateRoomCode();

    try {
      await set(ref(db, `rooms/${roomCode}`), {
        board_state: {
          cols: 6,
          rows: 9,
          cells: Array.from({ length: 54 }, () => ({ count: 0, owner: null })),
          players: [{ id: playerId, name: name.trim(), color: colors.player[0], eliminated: false }],
          currentPlayerIndex: 0,
          roundNumber: 0,
          status: 'lobby',
          winnerId: null,
          hostId: playerId,
        },
        created_at: Date.now(),
      });
    } catch {
      setError('Failed to create room');
      setCreating(false);
      return;
    }

    localStorage.setItem(`cr_player_${roomCode}`, JSON.stringify({ id: playerId, name: name.trim() }));
    router.push(`/room/${roomCode}`);
  };

  return (
    <main className="flex-1 flex flex-col min-h-dvh" style={{ background: colors.background }}>
      <div className="flex-1 flex items-center justify-center p-5">
        <motion.div
          className="w-full max-w-sm"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="text-center mb-6">
            <button
              onClick={() => router.push('/')}
              className="inline-block py-2 text-sm transition-colors"
              style={{ color: colors.textMuted }}
            >
              ← Back
            </button>
            <h2 className="text-lg font-semibold tracking-tight mt-3" style={{ color: colors.text }}>
              Create Room
            </h2>
          </div>

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
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                  Your name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => { setName(e.target.value); setError(''); }}
                  placeholder="Enter your name"
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    color: colors.text,
                  }}
                  maxLength={20}
                  onKeyDown={e => e.key === 'Enter' && createRoom()}
                />
              </div>

              {error && (
                <p className="text-xs" style={{ color: colors.player[0] }}>{error}</p>
              )}

              <motion.button
                onClick={createRoom}
                disabled={creating}
                className="w-full py-3 rounded-2xl text-sm font-medium transition-all disabled:opacity-40"
                whileTap={{ scale: 0.97 }}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  color: colors.text,
                  border: `1px solid ${colors.glassBorderHover}`,
                }}
              >
                {creating ? 'Creating…' : 'Create room'}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
