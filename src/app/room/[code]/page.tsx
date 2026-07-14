'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { v4 as uuid } from 'uuid';
import { motion } from 'motion/react';
import { ref, set, get, onValue, off } from 'firebase/database';
import { getFirebaseDb } from '@/lib/firebase/client';
import { GameState, Wave, Cell, PlayerId, applyMove, isValidMove } from '@/lib/engine';
import { Board } from '@/components/board/Board';
import { GameOver } from '@/components/lobby/GameOver';
import { PlayerPill } from '@/components/ui/PlayerPill';
import { colors } from '@/lib/design';
import { getDefaultBoardSize } from '@/lib/engine/board';

function normalizeCells(cells: { count: number; owner?: string | null }[]) {
  return cells.map(c => ({ count: c.count ?? 0, owner: c.owner ?? null }));
}

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [joiningName, setJoiningName] = useState('');
  const [joining, setJoining] = useState(false);
  const [waves, setWaves] = useState<Wave[]>([]);
  const [currentWave, setCurrentWave] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [preMoveCells, setPreMoveCells] = useState<Cell[] | null>(null);
  const [movingPlayerId, setMovingPlayerId] = useState<PlayerId | null>(null);
  const [clickedIndex, setClickedIndex] = useState(-1);
  const [illegalMoveIndex, setIllegalMoveIndex] = useState(-1);
  const [illegalMoveAttempt, setIllegalMoveAttempt] = useState(0);

  useEffect(() => {
    const db = getFirebaseDb();
    if (!db) { setError('Firebase not configured'); setLoading(false); return; }

    const roomRef = ref(db, `rooms/${code}`);

    get(roomRef).then((snap) => {
      if (!snap.exists()) {
        setError('Room not found — double-check the code.');
        setLoading(false);
        return;
      }
      const state = snap.val().board_state as GameState;
      if (state.cells) state.cells = normalizeCells(state.cells) as any;
      setGameState(state);
      setLoading(false);
    });

    const listener = onValue(roomRef, (snap) => {
      if (!snap.exists()) return;
      const d = snap.val();
      if (!d?.board_state) return;
      const { _waves, _animating, ...state } = d.board_state;
      if (state.cells) state.cells = normalizeCells(state.cells) as any;
      setGameState(state as GameState);
    });

    const stored = localStorage.getItem(`cr_player_${code}`);
    if (stored) { try { setPlayerId(JSON.parse(stored).id); } catch {} }

    return () => { off(roomRef, 'value', listener); };
  }, [code]);

  const handleJoin = async () => {
    if (!joiningName.trim() || !gameState) return;
    const db = getFirebaseDb();
    if (!db) return;
    setJoining(true);

    const existingPlayer = gameState.players.find(p => p.name.toLowerCase() === joiningName.trim().toLowerCase());
    if (existingPlayer) {
      setError('A player with this name already exists');
      setJoining(false);
      return;
    }

    const stored = localStorage.getItem(`cr_player_${code}`);
    if (stored) {
      try {
        const { id: existingId } = JSON.parse(stored);
        const playerExists = gameState.players.some(p => p.id === existingId);
        if (playerExists) {
          setPlayerId(existingId);
          setJoining(false);
          return;
        }
      } catch { /* ignore parse error */ }
    }

    const id = uuid();
    const idx = gameState.players.length;
    if (idx >= 5) { setError('Room is full'); setJoining(false); return; }

    try {
      await set(ref(db, `rooms/${code}/board_state`), {
        ...gameState,
        players: [...gameState.players, { id, name: joiningName.trim(), color: colors.player[idx], eliminated: false }],
      });
    } catch { setError('Failed to join'); setJoining(false); return; }

    localStorage.setItem(`cr_player_${code}`, JSON.stringify({ id, name: joiningName.trim() }));
    setPlayerId(id);
    setJoining(false);
  };

  const handleStart = async () => {
    if (!gameState || playerId !== gameState.hostId) return;
    const db = getFirebaseDb();
    if (!db) return;

    try {
      const roomRef = ref(db, `rooms/${code}/board_state`);
      const snap = await get(roomRef);
      if (!snap.exists()) { setError('Room not found'); return; }
      const freshState = snap.val() as GameState;

      if (freshState.status !== 'lobby') { setError('Game already started'); return; }
      if (freshState.hostId !== playerId) { setError('Not the host'); return; }
      if (freshState.players.length < 2) { setError('Need at least 2 players'); return; }

      const size = getDefaultBoardSize(freshState.players.length);
      await set(roomRef, {
        ...freshState, cols: size.cols, rows: size.rows,
        cells: Array.from({ length: size.cols * size.rows }, () => ({ count: 0, owner: null })),
        status: 'playing', currentPlayerIndex: 0, roundNumber: 0,
      });
    } catch (err) {
      console.error('Failed to start game:', err);
      setError('Failed to start game');
    }
  };

  const handlePlace = async (cellIndex: number) => {
    if (!gameState || !playerId || submitting) return;
    const cp = gameState.players[gameState.currentPlayerIndex];
    if (cp.id !== playerId) return;
    if (!isValidMove(gameState, cellIndex, playerId)) {
      setIllegalMoveIndex(cellIndex);
      setIllegalMoveAttempt(n => n + 1);
      setTimeout(() => setIllegalMoveIndex(-1), 300);
      return;
    }

    setPreMoveCells(gameState.cells);
    setMovingPlayerId(playerId);
    setClickedIndex(cellIndex);

    const result = applyMove(gameState, cellIndex, playerId);
    setGameState(result.state);
    if (result.waves.length > 0) { setWaves(result.waves); setCurrentWave(0); setAnimating(true); }

    setSubmitting(true);
    try {
      const res = await fetch('/api/moves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode: code, playerId, cellIndex }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        console.error('Move failed:', errorData);
        setError(`Move failed: ${errorData.error || 'Unknown error'}`);
        setTimeout(() => setError(''), 3000);
        const db = getFirebaseDb();
        if (db) {
          const snap = await get(ref(db, `rooms/${code}`));
          if (snap.exists()) {
            const s = snap.val().board_state as GameState;
            if (s.cells) s.cells = normalizeCells(s.cells) as any;
            setGameState(s);
          }
        }
      }
    } catch (err) {
      console.error('Move request failed:', err);
      setError('Network error');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const advanceWave = useCallback(() => {
    const n = currentWave + 1;
    if (n >= waves.length) {
      setAnimating(false); setCurrentWave(0); setWaves([]);
      setPreMoveCells(null); setMovingPlayerId(null); setClickedIndex(-1);
    } else {
      setCurrentWave(n);
    }
  }, [currentWave, waves.length]);

  const skipAnimations = () => {
    setAnimating(false); setCurrentWave(0); setWaves([]);
    setPreMoveCells(null); setMovingPlayerId(null); setClickedIndex(-1);
  };

  const handleCopyLink = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) { await navigator.share({ title: 'Chain Reaction', url }); }
      else { await navigator.clipboard.writeText(url); setCopySuccess(true); setTimeout(() => setCopySuccess(false), 2000); }
    } catch { await navigator.clipboard.writeText(url); setCopySuccess(true); setTimeout(() => setCopySuccess(false), 2000); }
  };

  const handleRematch = async () => {
    if (!gameState) return;
    const db = getFirebaseDb();
    if (!db) return;
    const size = getDefaultBoardSize(gameState.players.length);
    await set(ref(db, `rooms/${code}/board_state`), {
      ...gameState, cols: size.cols, rows: size.rows,
      cells: Array.from({ length: size.cols * size.rows }, () => ({ count: 0, owner: null })),
      status: 'playing', currentPlayerIndex: 0, roundNumber: 0, winnerId: null,
      players: gameState.players.map(p => ({ ...p, eliminated: false })),
    });
  };

  if (loading) return (
    <main className="flex-1 flex items-center justify-center min-h-dvh" style={{ background: colors.background }}>
      <div className="text-sm" style={{ color: colors.textMuted }}>Loading room…</div>
    </main>
  );

  if (error) return (
    <main className="flex-1 flex items-center justify-center p-6 min-h-dvh" style={{ background: colors.background }}>
      <div className="text-center max-w-sm">
        <p className="text-sm mb-4" style={{ color: colors.player[0] }}>{error}</p>
        <button onClick={() => router.push('/')} className="text-sm py-2 transition-colors" style={{ color: colors.textMuted }}>Go home</button>
      </div>
    </main>
  );

  if (!gameState) return null;

  const isHost = playerId === gameState.hostId;
  const isInLobby = gameState.status === 'lobby';
  const hasJoined = !!playerId && gameState.players.some(p => p.id === playerId);
  const isFull = gameState.players.length >= 5;

  if (isInLobby) {
    return (
      <main className="flex-1 flex flex-col min-h-dvh" style={{ background: colors.background }}>
        <div className="flex-1 flex items-center justify-center p-5">
          <motion.div
            className="w-full max-w-sm"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="text-center mb-5">
              <button onClick={() => router.push('/')} className="inline-block py-2 text-sm transition-colors" style={{ color: colors.textMuted }}>← Back</button>
              <h2 className="text-xl font-semibold tracking-tight mt-2" style={{ color: colors.text }}>Room {code}</h2>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl" style={{
              background: colors.surface, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              border: `1px solid ${colors.glassBorder}`, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>Players ({gameState.players.length}/5)</span>
                <button onClick={handleCopyLink} className="text-xs font-medium py-1 transition-colors" style={{ color: colors.textMuted }}>
                  {copySuccess ? 'Copied!' : 'Copy link'}
                </button>
              </div>

              <div className="space-y-2 mb-5">
                {gameState.players.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{
                      background: `linear-gradient(135deg, ${colors.playerGradients[i][0]}, ${colors.playerGradients[i][1]})`,
                      boxShadow: `0 0 6px ${colors.playerGlow[i]}`,
                    }} />
                    <span className="text-sm truncate" style={{ color: colors.text }}>
                      {p.name}
                      {p.id === gameState.hostId && <span className="text-[10px] ml-1" style={{ color: colors.textMuted }}>(host)</span>}
                    </span>
                  </div>
                ))}
              </div>

              {!hasJoined ? (
                <div className="space-y-3">
                  <input type="text" value={joiningName} onChange={e => setJoiningName(e.target.value)} placeholder="Enter your name"
                    className="w-full rounded-2xl px-4 py-3 text-sm outline-none transition-all"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: colors.text }}
                    maxLength={20} onKeyDown={e => e.key === 'Enter' && handleJoin()} />
                  <motion.button onClick={handleJoin} disabled={joining || !joiningName.trim() || isFull}
                    className="w-full py-3 rounded-2xl text-sm font-medium transition-all disabled:opacity-40"
                    whileTap={{ scale: 0.97 }}
                    style={{ background: 'rgba(255,255,255,0.1)', color: colors.text, border: `1px solid ${colors.glassBorderHover}` }}>
                    {isFull ? 'Room full' : joining ? 'Joining…' : 'Join room'}
                  </motion.button>
                </div>
              ) : (
                <>
                  {!isHost && <p className="text-center text-xs" style={{ color: colors.textMuted }}>Waiting for host to start…</p>}
                  {isHost && (
                    <motion.button onClick={handleStart} disabled={gameState.players.length < 2}
                      className="w-full py-3 rounded-2xl text-sm font-medium transition-all disabled:opacity-40"
                      whileTap={{ scale: 0.97 }}
                      style={{ background: 'rgba(255,255,255,0.1)', color: colors.text, border: `1px solid ${colors.glassBorderHover}` }}>
                      {gameState.players.length < 2 ? `Waiting… (${gameState.players.length}/2 min)` : 'Start game'}
                    </motion.button>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>
      </main>
    );
  }

  const cp = gameState.players[gameState.currentPlayerIndex];
  const isMyTurn = playerId === cp?.id;
  const winnerPlayer = gameState.winnerId ? gameState.players.find(p => p.id === gameState.winnerId) || null : null;

  return (
    <main className="flex flex-col min-h-dvh p-2 sm:p-3" style={{ background: colors.background }}>
      <div className="flex items-center justify-between mb-1 px-1 py-1">
        <button onClick={() => router.push('/')} className="text-xs font-medium py-2 transition-colors" style={{ color: colors.textMuted }}>← Exit</button>
        <h1 className="text-sm font-semibold tracking-tight truncate mx-2" style={{ color: colors.text }}>Room {code}</h1>
        <button onClick={handleCopyLink} className="text-[10px] font-medium py-2 whitespace-nowrap transition-colors" style={{ color: colors.textMuted }}>
          {copySuccess ? 'Copied!' : 'Copy link'}
        </button>
      </div>

      <div className="flex gap-1.5 flex-wrap justify-center px-1 mb-1.5">
        {gameState.players.map((p, i) => (
          <PlayerPill key={p.id} name={p.name} color={colors.player[i]} glow={colors.playerGlow[i]}
            isActive={!p.eliminated && gameState.currentPlayerIndex === i}
            isEliminated={p.eliminated} isYou={p.id === playerId} />
        ))}
      </div>

      {!hasJoined && <p className="text-center text-[10px] mb-1" style={{ color: colors.textMuted }}>Spectating</p>}
      {hasJoined && !isMyTurn && gameState.status === 'playing' &&
        <p className="text-center text-[10px] mb-1" style={{ color: colors.textMuted }}>Waiting for {cp?.name}…</p>}

      <Board cells={gameState.cells} cols={gameState.cols} rows={gameState.rows}
        currentPlayerId={cp?.id || null} players={gameState.players}
        isPlayable={hasJoined && isMyTurn && gameState.status === 'playing' && !submitting}
        waves={waves} currentWave={currentWave} animating={animating}
        preMoveCells={preMoveCells} movingPlayerId={movingPlayerId} clickedIndex={clickedIndex}
        onPlace={handlePlace} onAdvanceWave={advanceWave} onSkipAnimations={skipAnimations}
        illegalMoveIndex={illegalMoveIndex} illegalMoveAttempt={illegalMoveAttempt} />

      {gameState.status === 'finished' && winnerPlayer && (
        <GameOver winner={winnerPlayer} players={gameState.players} onRematch={handleRematch} onNewGame={() => router.push('/')} />
      )}
    </main>
  );
}
