export type PlayerId = string;

export interface Cell {
  count: number;
  owner: PlayerId | null;
}

export interface Player {
  id: PlayerId;
  name: string;
  color: string;
  eliminated: boolean;
}

export interface Wave {
  explosions: number[];
  updates: { index: number; count: number; owner: PlayerId | null }[];
}

export interface MoveResult {
  state: GameState;
  waves: Wave[];
  eliminated: PlayerId[];
  winner: PlayerId | null;
}

export interface GameState {
  cols: number;
  rows: number;
  cells: Cell[];
  players: Player[];
  currentPlayerIndex: number;
  roundNumber: number;
  status: 'lobby' | 'playing' | 'finished';
  winnerId: PlayerId | null;
  hostId?: PlayerId;
}

export interface GameConfig {
  cols: number;
  rows: number;
  players: { id: PlayerId; name: string; color: string }[];
}
