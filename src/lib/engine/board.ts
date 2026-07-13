import { Cell, GameState, GameConfig } from './types';
import { v4 as uuid } from 'uuid';

export function createCell(): Cell {
  return { count: 0, owner: null };
}

export function getNeighborIndices(index: number, cols: number, rows: number): number[] {
  const row = Math.floor(index / cols);
  const col = index % cols;
  const neighbors: number[] = [];

  if (row > 0) neighbors.push(index - cols);
  if (row < rows - 1) neighbors.push(index + cols);
  if (col > 0) neighbors.push(index - 1);
  if (col < cols - 1) neighbors.push(index + 1);

  return neighbors;
}

export function getCriticalMass(index: number, cols: number, rows: number): number {
  return getNeighborIndices(index, cols, rows).length;
}

export function createBoard(cols: number, rows: number): Cell[] {
  return Array.from({ length: cols * rows }, () => createCell());
}

export function cloneCells(cells: Cell[]): Cell[] {
  return cells.map(c => ({ ...c }));
}

export function getDefaultBoardSize(playerCount: number): { cols: number; rows: number } {
  if (playerCount <= 3) return { cols: 6, rows: 9 };
  return { cols: 8, rows: 11 };
}

export function createInitialGameState(config: GameConfig): GameState {
  const { cols, rows, players } = config;
  return {
    cols,
    rows,
    cells: createBoard(cols, rows),
    players: players.map(p => ({ ...p, eliminated: false })),
    currentPlayerIndex: 0,
    roundNumber: 0,
    status: 'playing',
    winnerId: null,
  };
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
