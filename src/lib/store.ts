'use client';

import { create } from 'zustand';
import { GameState, GameConfig, Player, Cell, PlayerId, applyMove, createInitialGameState } from '@/lib/engine';
import { v4 as uuid } from 'uuid';
import { colors } from './design';

interface LocalGameStore {
  state: GameState | null;
  config: GameConfig | null;
  waves: any[];
  currentWave: number;
  animating: boolean;
  eliminatedToast: string | null;
  winner: string | null;
  preMoveCells: Cell[] | null;
  movingPlayerId: PlayerId | null;
  clickedIndex: number;

  initGame: (config: GameConfig) => void;
  placeOrb: (cellIndex: number) => void;
  advanceWave: () => void;
  skipAnimations: () => void;
  clearEliminatedToast: () => void;
  reset: () => void;
}

export const useLocalGameStore = create<LocalGameStore>((set, get) => ({
  state: null,
  config: null,
  waves: [],
  currentWave: 0,
  animating: false,
  eliminatedToast: null,
  winner: null,
  preMoveCells: null,
  movingPlayerId: null,
  clickedIndex: -1,

  initGame: (config: GameConfig) => {
    const state = createInitialGameState(config);
    set({ state, config, waves: [], currentWave: 0, animating: false, eliminatedToast: null, winner: null, preMoveCells: null, movingPlayerId: null, clickedIndex: -1 });
  },

  placeOrb: (cellIndex: number) => {
    const { state, animating } = get();
    if (!state || state.status !== 'playing' || animating) return;

    const currentPlayer = state.players[state.currentPlayerIndex];
    if (!currentPlayer || currentPlayer.eliminated) return;

    try {
      const preMoveCells = state.cells;
      const result = applyMove(state, cellIndex, currentPlayer.id);
      set({
        state: result.state,
        waves: result.waves,
        currentWave: 0,
        animating: result.waves.length > 0,
        eliminatedToast: result.eliminated.length > 0 ? result.eliminated[0] : null,
        winner: result.winner,
        preMoveCells: result.waves.length > 0 ? preMoveCells : null,
        movingPlayerId: result.waves.length > 0 ? currentPlayer.id : null,
        clickedIndex: result.waves.length > 0 ? cellIndex : -1,
      });
    } catch {
      // ignore invalid moves
    }
  },

  advanceWave: () => {
    const { waves, currentWave, state } = get();
    const nextWave = currentWave + 1;
    if (nextWave >= waves.length) {
      set({ animating: false, currentWave: 0, waves: [], preMoveCells: null, movingPlayerId: null, clickedIndex: -1 });
    } else {
      set({ currentWave: nextWave });
    }
  },

  skipAnimations: () => {
    set({ animating: false, currentWave: 0, waves: [], preMoveCells: null, movingPlayerId: null, clickedIndex: -1 });
  },

  clearEliminatedToast: () => set({ eliminatedToast: null }),
  reset: () => set({ state: null, config: null, waves: [], animating: false, eliminatedToast: null, winner: null, preMoveCells: null, movingPlayerId: null, clickedIndex: -1 }),
}));
