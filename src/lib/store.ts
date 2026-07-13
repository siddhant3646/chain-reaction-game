'use client';

import { create } from 'zustand';
import { GameState, GameConfig, Player, applyMove, createInitialGameState } from '@/lib/engine';
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

  initGame: (config: GameConfig) => {
    const state = createInitialGameState(config);
    set({ state, config, waves: [], currentWave: 0, animating: false, eliminatedToast: null, winner: null });
  },

  placeOrb: (cellIndex: number) => {
    const { state, animating } = get();
    if (!state || state.status !== 'playing' || animating) return;

    const currentPlayer = state.players[state.currentPlayerIndex];
    if (!currentPlayer || currentPlayer.eliminated) return;

    try {
      const result = applyMove(state, cellIndex, currentPlayer.id);
      set({
        state: result.state,
        waves: result.waves,
        currentWave: 0,
        animating: result.waves.length > 0,
        eliminatedToast: result.eliminated.length > 0 ? result.eliminated[0] : null,
        winner: result.winner,
      });
    } catch {
      // ignore invalid moves
    }
  },

  advanceWave: () => {
    const { waves, currentWave, state } = get();
    const nextWave = currentWave + 1;
    if (nextWave >= waves.length) {
      set({ animating: false, currentWave: 0, waves: [] });
    } else {
      set({ currentWave: nextWave });
    }
  },

  skipAnimations: () => {
    const { waves, state } = get();
    if (!state || waves.length === 0) return;
    const lastWave = waves[waves.length - 1];
    const cells = [...state.cells];
    for (const update of lastWave.updates) {
      cells[update.index] = { count: update.count, owner: update.owner };
    }
    set({ animating: false, currentWave: 0, waves: [] });
  },

  clearEliminatedToast: () => set({ eliminatedToast: null }),
  reset: () => set({ state: null, config: null, waves: [], animating: false, eliminatedToast: null, winner: null }),
}));
