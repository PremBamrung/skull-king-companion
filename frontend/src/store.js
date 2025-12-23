import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useGameStore = create(
  persist(
    (set) => ({
      game: null,
      language: 'en',
      setGame: (game) => set({ game }),
      clearGame: () => set({ game: null }),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'skull-king-storage',
    }
  )
);
