'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuid } from 'uuid';
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
    if (!name.trim()) {
      setError('Enter a name');
      return;
    }
    const db = getFirebaseDb();
    if (!db) {
      setError('Firebase not configured — check your env vars');
      return;
    }
    setCreating(true);
    setError('');

    const playerId = uuid();
    const roomCode = generateRoomCode();

    const newPlayer = {
      id: playerId,
      name: name.trim(),
      color: colors.player[0],
      eliminated: false,
    };

    try {
      await set(ref(db, `rooms/${roomCode}`), {
        board_state: {
          cols: 6,
          rows: 9,
          cells: Array.from({ length: 54 }, () => ({ count: 0, owner: null })),
          players: [newPlayer],
          currentPlayerIndex: 0,
          roundNumber: 0,
          status: 'lobby',
          winnerId: null,
          hostId: playerId,
        },
        created_at: Date.now(),
      });
    } catch {
      setError('Failed to create room. Try again.');
      setCreating(false);
      return;
    }

    localStorage.setItem(`cr_player_${roomCode}`, JSON.stringify({ id: playerId, name: name.trim() }));
    router.push(`/room/${roomCode}`);
  };

  return (
    <main className="flex-1 flex items-center justify-center p-4 min-h-dvh">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <button onClick={() => router.push('/')} className="text-sm text-text-muted hover:text-text transition-colors inline-block py-2">
            ← Back
          </button>
          <h2 className="text-lg sm:text-xl font-display tracking-wider text-text mt-3 sm:mt-4" style={{ fontFamily: fonts.display }}>
            Create Room
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs sm:text-sm text-text-muted mb-1.5">Your name</label>
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
              placeholder="Enter your name"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-3 sm:py-2.5 text-sm text-text outline-none focus:border-white/30 transition-colors"
              maxLength={20}
              onKeyDown={e => e.key === 'Enter' && createRoom()}
            />
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <button
            onClick={createRoom}
            disabled={creating}
            className="w-full py-3.5 sm:py-3 rounded-lg font-display tracking-wider text-sm bg-white/10 hover:bg-white/20 active:bg-white/25 text-text border border-white/20 transition-all disabled:opacity-50 touch-manipulation"
          >
            {creating ? 'Creating...' : 'Create room'}
          </button>
        </div>
      </div>
    </main>
  );
}
