import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { GameState, applyMove, isValidMove } from '@/lib/engine';

export async function POST(request: NextRequest) {
  try {
    const { roomCode, playerId, cellIndex } = await request.json();

    if (!roomCode || !playerId || cellIndex === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const snapshot = await db.ref(`rooms/${roomCode}`).once('value');
    if (!snapshot.exists()) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const gameState = snapshot.val().board_state as GameState;

    if (gameState.status !== 'playing') {
      return NextResponse.json({ error: 'Game is not in progress' }, { status: 400 });
    }

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.id !== playerId) {
      return NextResponse.json({ error: 'Not your turn' }, { status: 403 });
    }

    if (!isValidMove(gameState, cellIndex, playerId)) {
      return NextResponse.json({ error: 'Invalid move' }, { status: 400 });
    }

    const result = applyMove(gameState, cellIndex, playerId);

    const stateWithWaves = {
      ...result.state,
      _waves: result.waves,
      _animating: result.waves.length > 0,
    };

    await db.ref(`rooms/${roomCode}/board_state`).set(stateWithWaves);

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
