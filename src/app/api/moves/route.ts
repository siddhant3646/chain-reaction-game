import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { GameState, Wave, PlayerId, applyMove, isValidMove } from '@/lib/engine';

function normalizeCells(cells: { count: number; owner?: string | null }[]) {
  return cells.map(c => ({ count: c.count ?? 0, owner: c.owner ?? null }));
}

export async function POST(request: NextRequest) {
  try {
    const { roomCode, playerId, cellIndex } = await request.json();

    if (!roomCode || !playerId || cellIndex === undefined) {
      console.error('[API] Missing required fields:', { roomCode, playerId, cellIndex });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = getAdminDb();
    if (!db) {
      console.error('[API] Database not configured');
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Use a Firebase transaction to atomically read-modify-write the game state.
    // This prevents the race condition where two concurrent requests read the same
    // stale state and one player's move gets silently overwritten.
    let outputWaves: Wave[] = [];
    let outputEliminated: PlayerId[] = [];
    let outputWinner: PlayerId | null = null;
    let abortReason: string | null = null;

    await db.ref(`rooms/${roomCode}/board_state`).transaction((current) => {
      if (current === null) {
        abortReason = 'Room not found';
        return; // abort
      }

      const raw = current as Record<string, unknown>;

      if (raw.status !== 'playing') {
        abortReason = 'Game is not in progress';
        return; // abort
      }

      const rawCurrentPlayerIndex = raw.currentPlayerIndex;
      const rawPlayers = raw.players;
      const rawCells = raw.cells;

      if (
        typeof rawCurrentPlayerIndex !== 'number' ||
        !Array.isArray(rawPlayers) ||
        !Array.isArray(rawCells)
      ) {
        abortReason = 'Invalid game state';
        return; // abort
      }

      const currentPlayer = rawPlayers[rawCurrentPlayerIndex] as { id: string; eliminated: boolean } | undefined;
      if (!currentPlayer) {
        abortReason = 'Invalid game state';
        return; // abort
      }

      if (currentPlayer.id !== playerId) {
        abortReason = 'Not your turn';
        return; // abort
      }

      if (currentPlayer.eliminated) {
        abortReason = 'Player is eliminated';
        return; // abort
      }

      if (cellIndex < 0 || cellIndex >= rawCells.length) {
        abortReason = 'Invalid cell index';
        return; // abort
      }

      const targetCell = rawCells[cellIndex] as { owner?: string | null; count: number } | undefined;
      if (!targetCell) {
        abortReason = 'Invalid cell index';
        return; // abort
      }

      const owner = targetCell.owner ?? null;
      if (owner != null && owner !== playerId) {
        abortReason = 'Cell is owned by opponent';
        return; // abort
      }

      // Reconstruct GameState from the raw transaction data
      const gameState: GameState = {
        ...raw as unknown as GameState,
        cells: normalizeCells(rawCells as any),
        players: rawPlayers as GameState['players'],
      };

      if (!isValidMove(gameState, cellIndex, playerId)) {
        abortReason = 'Invalid move';
        return; // abort
      }

      const result = applyMove(gameState, cellIndex, playerId);
      outputWaves = result.waves;
      outputEliminated = result.eliminated;
      outputWinner = result.winner;
      return result.state as unknown as Record<string, unknown>;
    });

    if (abortReason) {
      return NextResponse.json({ error: abortReason }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      waves: outputWaves,
      eliminated: outputEliminated,
      winner: outputWinner,
    });
  } catch (err) {
    console.error('Move error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
