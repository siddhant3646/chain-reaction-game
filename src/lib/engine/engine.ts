import {
  GameState,
  Cell,
  PlayerId,
  Wave,
  MoveResult,
} from './types';
import { getNeighborIndices, getCriticalMass, cloneCells } from './board';

const MAX_WAVES = 1000;

function countPlayerOrbs(cells: Cell[], playerId: PlayerId): number {
  return cells.filter(c => c.owner === playerId).reduce((sum, c) => sum + c.count, 0);
}

function getActivePlayers(state: GameState): number[] {
  return state.players
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => !p.eliminated)
    .map(({ i }) => i);
}

export function isValidMove(state: GameState, cellIndex: number, playerId: PlayerId): boolean {
  if (state.status !== 'playing') return false;
  const player = state.players[state.currentPlayerIndex];
  if (player.id !== playerId || player.eliminated) return false;
  if (cellIndex < 0 || cellIndex >= state.cells.length) return false;
  const cell = state.cells[cellIndex];
  if (cell.owner !== null && cell.owner !== playerId) return false;
  return true;
}

export function applyMove(state: GameState, cellIndex: number, playerId: PlayerId): MoveResult {
  if (!isValidMove(state, cellIndex, playerId)) {
    throw new Error('Invalid move');
  }

  const newCells = cloneCells(state.cells);
  newCells[cellIndex].count += 1;
  newCells[cellIndex].owner = playerId;

  const { finalCells, waves } = resolveExplosions(newCells, state.cols, state.rows, playerId);

  const newState: GameState = {
    ...state,
    cells: finalCells,
    currentPlayerIndex: state.currentPlayerIndex,
    roundNumber: state.roundNumber,
    status: 'playing',
    winnerId: null,
  };

  const eliminatedPlayers: PlayerId[] = [];

  if (newState.roundNumber > 0) {
    for (const p of newState.players) {
      if (!p.eliminated && countPlayerOrbs(newState.cells, p.id) === 0) {
        p.eliminated = true;
        eliminatedPlayers.push(p.id);
      }
    }
  }

  const activePlayers = getActivePlayers(newState);
  if (newState.roundNumber > 0 && activePlayers.length === 1) {
    newState.status = 'finished';
    newState.winnerId = newState.players[activePlayers[0]].id;
    return { state: newState, waves, eliminated: eliminatedPlayers, winner: newState.winnerId };
  }

  advanceTurn(newState);

  return { state: newState, waves, eliminated: eliminatedPlayers, winner: null };
}

function advanceTurn(state: GameState): void {
  const activePlayers = getActivePlayers(state);
  if (activePlayers.length === 0) return;

  const currentIndex = activePlayers.indexOf(state.currentPlayerIndex);
  const nextIndex = (currentIndex + 1) % activePlayers.length;
  state.currentPlayerIndex = activePlayers[nextIndex];

  if (state.currentPlayerIndex === 0) {
    state.roundNumber += 1;
  }
}

export function resolveExplosions(
  cells: Cell[],
  cols: number,
  rows: number,
  currentPlayerId: PlayerId,
): { finalCells: Cell[]; waves: Wave[] } {
  const working = cloneCells(cells);
  const waves: Wave[] = [];
  let safety = 0;

  while (safety < MAX_WAVES) {
    safety += 1;

    const exploding: number[] = [];
    for (let i = 0; i < working.length; i++) {
      if (working[i].count >= getCriticalMass(i, cols, rows) && working[i].owner !== null) {
        exploding.push(i);
      }
    }

    if (exploding.length === 0) break;

    const updates: Wave['updates'] = [];
    const newCounts = new Map<number, number>();
    const newOwners = new Map<number, PlayerId | null>();

    for (const idx of exploding) {
      const cell = working[idx];
      const criticalMass = getCriticalMass(idx, cols, rows);
      const remainder = cell.count - criticalMass;
      newCounts.set(idx, cell.count - criticalMass);
      newOwners.set(idx, remainder > 0 ? cell.owner : null);
    }

    for (const idx of exploding) {
      const owner = working[idx].owner!;
      const neighbors = getNeighborIndices(idx, cols, rows);
      for (const nIdx of neighbors) {
        newCounts.set(nIdx, (newCounts.get(nIdx) ?? working[nIdx].count) + 1);
        newOwners.set(nIdx, owner);
      }
    }

    for (const [idx, count] of newCounts) {
      const owner = newOwners.get(idx) ?? working[idx].owner;
      working[idx].count = count;
      working[idx].owner = owner;
      updates.push({ index: idx, count, owner });
    }

    waves.push({ explosions: exploding, updates });
  }

  return { finalCells: working, waves };
}

export function checkWinner(state: GameState): PlayerId | null {
  if (state.roundNumber === 0) return null;
  const active = state.players.filter(p => !p.eliminated);
  const hasOrbs = active.filter(p => countPlayerOrbs(state.cells, p.id) > 0);
  if (hasOrbs.length === 1) return hasOrbs[0].id;
  return null;
}
