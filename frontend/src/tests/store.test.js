import { beforeEach, describe, expect, it } from 'vitest';
import { act } from '@testing-library/react';
import { useGameStore } from '../store';

beforeEach(() => {
  localStorage.clear();
  useGameStore.setState({ game: null, language: 'en' });
});

const fakeGame = { id: 'abc-123', status: 'ACTIVE', players: [], rounds: [] };

describe('useGameStore', () => {
  it('has correct initial state', () => {
    const state = useGameStore.getState();
    expect(state.game).toBeNull();
    expect(state.language).toBe('en');
  });

  it('setGame stores the game object', () => {
    act(() => useGameStore.getState().setGame(fakeGame));
    expect(useGameStore.getState().game).toEqual(fakeGame);
  });

  it('clearGame sets game to null', () => {
    act(() => useGameStore.getState().setGame(fakeGame));
    act(() => useGameStore.getState().clearGame());
    expect(useGameStore.getState().game).toBeNull();
  });

  it('setLanguage updates the language', () => {
    act(() => useGameStore.getState().setLanguage('fr'));
    expect(useGameStore.getState().language).toBe('fr');
  });

  it('persists game to localStorage', () => {
    act(() => useGameStore.getState().setGame(fakeGame));
    const stored = JSON.parse(localStorage.getItem('skull-king-storage'));
    expect(stored.state.game.id).toBe('abc-123');
  });
});
