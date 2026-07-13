'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { v4 as uuid } from 'uuid';
import { ref, set, get, onValue, off } from 'firebase/database';
import { getFirebaseDb } from '@/lib/firebase/client';
import { GameState, PlayerId, Wave } from '@/lib/engine';
import { Board } from '@/components/board/Board';
import { GameOver } from '@/components/lobby/GameOver';
import { colors, fonts } from '@/lib/design';
import { getDefaultBoardSize } from '@/lib/engine/board';

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

  useEffect(() => {
    const db = getFirebaseDb();
    if (!db) {
      setError('Firebase not configured');
      setLoading(false);
      return;
    }

    const roomRef = ref(db, `rooms/${code}`);

    get(roomRef).then((snapshot) => {
      if (!snapshot.exists()) {
        setError('Room not found — double-check the code.');
        setLoading(false);
        return;
      }
      const data = snapshot.val();
      setGameState(data.board_state as GameState);
      setLoading(false);
    });

    const listener = onValue(roomRef, (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.val();
      if (!data?.board_state) return;
      const { _waves, _animating, ...state } = data.board_state;
      setGameState(state as GameState);
      if (_waves && _waves.length > 0) {
        setWaves(_waves);
        setCurrentWave(0);
        setAnimating(true);
      }
    });

    const stored = localStorage.getItem(`cr_player_${code}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPlayerId(parsed.id);
      } catch {}
    }

    return () => {
      off(roomRef, 'value', listener);
    };
  }, [code]);

  const handleJoin = async () => {
    if (!joiningName.trim() || !gameState) return;
    const db = getFirebaseDb();
    if (!db) return;
    setJoining(true);

    const id = uuid();
    const playerIndex = gameState.players.length;
    if (playerIndex >= 5) {
      setError('Room is full');
      setJoining(false);
      return;
    }

    const updatedState: GameState = {
      ...gameState,
      players: [
        ...gameState.players,
        {
          id,
          name: joiningName.trim(),
          color: colors.player[playerIndex],
          eliminated: false,
        },
      ],
    };

    try {
      await set(ref(db, `rooms/${code}/board_state`), updatedState);
    } catch {
      setError('Failed to join room');
      setJoining(false);
      return;
    }

    localStorage.setItem(`cr_player_${code}`, JSON.stringify({ id, name: joiningName.trim() }));
    setPlayerId(id);
    setJoining(false);
  };

  const handleStart = async () => {
    if (!gameState || playerId !== gameState.hostId) return;
    const db = getFirebaseDb();
    if (!db) return;

    const size = getDefaultBoardSize(gameState.players.length);
    await set(ref(db, `rooms/${code}/board_state`), {
      ...gameState,
      cols: size.cols,
      rows: size.rows,
      cells: Array.from({ length: size.cols * size.rows }, () => ({ count: 0, owner: null })),
      status: 'playing',
      currentPlayerIndex: 0,
      roundNumber: 0,
    });
  };

  const handlePlace = async (cellIndex: number) => {
    if (!gameState || !playerId || animating) return;
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.id !== playerId) return;

    const response = await fetch('/api/moves', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomCode: code, playerId, cellIndex }),
    });

    if (!response.ok) {
      const data = await response.json();
      console.error('Move failed:', data.error);
      return;
    }

    const data = await response.json();
    if (data.waves?.length > 0) {
      setWaves(data.waves);
      setCurrentWave(0);
      setAnimating(true);
    }
  };

  const advanceWave = useCallback(() => {
    const next = currentWave + 1;
    if (next >= waves.length) {
      setAnimating(false);
      setCurrentWave(0);
      setWaves([]);
    } else {
      setCurrentWave(next);
    }
  }, [currentWave, waves.length]);

  const skipAnimations = () => {
    setAnimating(false);
    setCurrentWave(0);
    setWaves([]);
  };

  const handleCopyLink = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Chain Reaction', url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }
    } catch {
      await navigator.clipboard.writeText(url);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleRematch = async () => {
    if (!gameState) return;
    const db = getFirebaseDb();
    if (!db) return;

    const size = getDefaultBoardSize(gameState.players.length);
    await set(ref(db, `rooms/${code}/board_state`), {
      ...gameState,
      cols: size.cols,
      rows: size.rows,
      cells: Array.from({ length: size.cols * size.rows }, () => ({ count: 0, owner: null })),
      status: 'playing',
      currentPlayerIndex: 0,
      roundNumber: 0,
      winnerId: null,
      players: gameState.players.map(p => ({ ...p, eliminated: false })),
    });
  };

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center min-h-dvh">
        <div className="text-text-muted text-sm">Loading room...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 flex items-center justify-center p-6 min-h-dvh">
        <div className="text-center max-w-sm">
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <button onClick={() => router.push('/')} className="text-text-muted hover:text-text transition-colors text-sm py-2">
            Go home
          </button>
        </div>
      </main>
    );
  }

  if (!gameState) return null;

  const isHost = playerId === gameState.hostId;
  const isPlaying = gameState.status === 'playing';
  const isInLobby = gameState.status === 'lobby';
  const hasJoined = !!playerId && gameState.players.some(p => p.id === playerId);
  const isFull = gameState.players.length >= 5;

  if (isInLobby) {
    return (
      <main className="flex-1 flex items-center justify-center p-4 min-h-dvh">
        <div className="w-full max-w-sm space-y-5 sm:space-y-6">
          <div className="text-center">
            <button onClick={() => router.push('/')} className="text-sm text-text-muted hover:text-text transition-colors inline-block py-2">
              ← Back
            </button>
            <h2 className="text-lg sm:text-xl font-display tracking-wider text-text mt-3" style={{ fontFamily: fonts.display }}>
              Room {code}
            </h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Players ({gameState.players.length}/5)</span>
              <button
                onClick={handleCopyLink}
                className="text-xs text-text-muted hover:text-text transition-colors py-1"
              >
                {copySuccess ? 'Copied!' : 'Copy link'}
              </button>
            </div>

            {gameState.players.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/5">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: colors.player[i] }} />
                <span className="text-sm text-text truncate">
                  {p.name}{' '}
                  {p.id === gameState.hostId && <span className="text-[10px] text-text-muted">(host)</span>}
                </span>
              </div>
            ))}
          </div>

          {!hasJoined && (
            <div className="space-y-3">
              <input
                type="text"
                value={joiningName}
                onChange={e => setJoiningName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-3 text-sm text-text outline-none focus:border-white/30 transition-colors"
                maxLength={20}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
              />
              <button
                onClick={handleJoin}
                disabled={joining || !joiningName.trim() || isFull}
                className="w-full py-3.5 rounded-lg font-display tracking-wider text-sm bg-white/10 hover:bg-white/20 active:bg-white/25 text-text border border-white/20 transition-all disabled:opacity-50 touch-manipulation"
              >
                {isFull ? 'Room full' : joining ? 'Joining...' : 'Join room'}
              </button>
            </div>
          )}

          {hasJoined && !isHost && (
            <p className="text-center text-xs text-text-muted">Waiting for host to start...</p>
          )}

          {isHost && (
            <button
              onClick={handleStart}
              disabled={gameState.players.length < 2}
              className="w-full py-3.5 rounded-lg font-display tracking-wider text-sm bg-white/10 hover:bg-white/20 active:bg-white/25 text-text border border-white/20 transition-all disabled:opacity-50 touch-manipulation"
            >
              {gameState.players.length < 2
                ? `Waiting for players... (${gameState.players.length}/2 min)`
                : 'Start game'}
            </button>
          )}
        </div>
      </main>
    );
  }

  if (isPlaying) {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const isMyTurn = playerId === currentPlayer?.id;
    const winnerPlayer = gameState.winnerId
      ? gameState.players.find(p => p.id === gameState.winnerId) || null
      : null;

    return (
      <main className="flex-1 flex flex-col items-center min-h-dvh p-2 sm:p-4">
        <div className="w-full flex items-center justify-between mb-1 px-1 py-1">
          <button onClick={() => router.push('/')} className="text-xs sm:text-sm text-text-muted hover:text-text transition-colors py-2">
            ← Exit
          </button>
          <h1 className="text-sm sm:text-base font-display tracking-wider text-text truncate mx-2" style={{ fontFamily: fonts.display }}>
            Room {code}
          </h1>
          <button
            onClick={handleCopyLink}
            className="text-[10px] sm:text-xs text-text-muted hover:text-text transition-colors py-2 whitespace-nowrap"
          >
            {copySuccess ? 'Copied!' : 'Copy link'}
          </button>
        </div>

        <div className="flex gap-1.5 sm:gap-2 flex-wrap justify-center px-1 mb-1 max-w-full">
          {gameState.players.map((p, i) => (
            <div
              key={p.id}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs transition-all whitespace-nowrap ${
                !p.eliminated && gameState.currentPlayerIndex === i
                  ? 'bg-white/15 text-text shadow-lg'
                  : p.eliminated
                  ? 'text-text-muted/40 line-through'
                  : 'text-text-muted'
              }`}
              style={{
                boxShadow: !p.eliminated && gameState.currentPlayerIndex === i
                  ? `0 0 10px ${colors.playerGlow[i]}`
                  : 'none',
              }}
            >
              <span
                className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full flex-shrink-0"
                style={{ background: colors.player[i], opacity: p.eliminated ? 0.3 : 1 }}
              />
              <span className="truncate max-w-[60px] sm:max-w-[80px]">{p.name}</span>
              {!p.eliminated && gameState.currentPlayerIndex === i && (
                <span className="text-[8px] sm:text-[10px] opacity-70 ml-0.5">●</span>
              )}
              {p.id === playerId && (
                <span className="text-[8px] sm:text-[10px] opacity-50 ml-0.5 hidden sm:inline">(you)</span>
              )}
            </div>
          ))}
        </div>

        {!hasJoined && (
          <p className="text-text-muted text-[10px] sm:text-xs mb-1">Spectating</p>
        )}
        {hasJoined && !isMyTurn && gameState.status === 'playing' && (
          <p className="text-text-muted text-[10px] sm:text-xs mb-1">
            Waiting for {currentPlayer?.name}&apos;s move...
          </p>
        )}

        <Board
          cells={gameState.cells}
          cols={gameState.cols}
          rows={gameState.rows}
          currentPlayerId={currentPlayer?.id || null}
          players={gameState.players}
          isPlayable={hasJoined && isMyTurn && gameState.status === 'playing'}
          waves={waves}
          currentWave={currentWave}
          animating={animating}
          onPlace={handlePlace}
          onAdvanceWave={advanceWave}
          onSkipAnimations={skipAnimations}
        />

        {gameState.status === 'finished' && winnerPlayer && (
          <GameOver
            winner={winnerPlayer}
            players={gameState.players}
            onRematch={handleRematch}
            onNewGame={() => router.push('/')}
          />
        )}
      </main>
    );
  }

  return null;
}
