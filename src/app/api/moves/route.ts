import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { GameState, applyMove, isValidMove } from '@/lib/engine';

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

    const snapshot = await db.ref(`rooms/${roomCode}`).once('value');
    if (!snapshot.exists()) {
      console.error('[API] Room not found:', roomCode);
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const gameState = snapshot.val().board_state as GameState;

    // Normalize cells - Firebase RTDB strips null values, so owner may be undefined
    gameState.cells = gameState.cells.map(c => ({
      count: c.count ?? 0,
      owner: c.owner ?? null,
    }));

    // Detailed logging for debugging
    console.log('[API] Move request:', {
      roomCode,
      playerId,
      cellIndex,
      gameStatus: gameState.status,
      currentPlayerIndex: gameState.currentPlayerIndex,
      currentPlayerId: gameState.players[gameState.currentPlayerIndex]?.id,
      totalPlayers: gameState.players.length,
      cellsCount: gameState.cells.length,
      targetCell: gameState.cells[cellIndex],
    });

    if (gameState.status !== 'playing') {
      console.error('[API] Game not in progress:', gameState.status);
      return NextResponse.json({ error: 'Game is not in progress' }, { status: 400 });
    }

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (!currentPlayer) {
      console.error('[API] Current player not found at index:', gameState.currentPlayerIndex);
      return NextResponse.json({ error: 'Invalid game state' }, { status: 500 });
    }

    if (currentPlayer.id !== playerId) {
      console.error('[API] Not your turn:', {
        expectedPlayerId: currentPlayer.id,
        receivedPlayerId: playerId,
      });
      return NextResponse.json({ error: 'Not your turn' }, { status: 403 });
    }

    if (currentPlayer.eliminated) {
      console.error('[API] Player is eliminated:', playerId);
      return NextResponse.json({ error: 'Player is eliminated' }, { status: 403 });
    }

    if (cellIndex < 0 || cellIndex >= gameState.cells.length) {
      console.error('[API] Cell index out of bounds:', {
        cellIndex,
        totalCells: gameState.cells.length,
      });
      return NextResponse.json({ error: 'Invalid cell index' }, { status: 400 });
    }

    const targetCell = gameState.cells[cellIndex];
    if (targetCell.owner != null && targetCell.owner !== playerId) {
      console.error('[API] Cell owned by opponent:', {
        cellIndex,
        cellOwner: targetCell.owner,
        playerId,
      });
      return NextResponse.json({ error: 'Cell is owned by opponent' }, { status: 400 });
    }

    if (!isValidMove(gameState, cellIndex, playerId)) {
      console.error('[API] isValidMove returned false:', {
        cellIndex,
        playerId,
        cellOwner: targetCell.owner,
        cellCount: targetCell.count,
      });
      return NextResponse.json({ error: 'Invalid move' }, { status: 400 });
    }

    const result = applyMove(gameState, cellIndex, playerId);

    await db.ref(`rooms/${roomCode}/board_state`).set(result.state);

    return NextResponse.json({
      success: true,
      waves: result.waves,
      eliminated: result.eliminated,
      winner: result.winner,
    });
  } catch (err) {
    console.error('Move error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
