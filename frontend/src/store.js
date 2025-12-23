import { create } from 'zustand';

export const useGameStore = create((set) => ({
  game: null,
  setGame: (game) => set({ game }),
  clearGame: () => set({ game: null }),
}));
