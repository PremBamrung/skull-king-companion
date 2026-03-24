import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { api } from '../api';

vi.mock('axios');

const mockData = { id: 'game-1' };
const mockResponse = { data: mockData };

beforeEach(() => {
  vi.clearAllMocks();
  axios.get = vi.fn().mockResolvedValue(mockResponse);
  axios.post = vi.fn().mockResolvedValue(mockResponse);
  axios.put = vi.fn().mockResolvedValue(mockResponse);
  axios.delete = vi.fn().mockResolvedValue(mockResponse);
});

describe('api.createGame', () => {
  it('posts to /api/games with players and config', async () => {
    const players = [{ name: 'Alice' }];
    await api.createGame(players, { rule: true });
    expect(axios.post).toHaveBeenCalledWith('/api/games', { players, config: { rule: true } });
  });

  it('uses empty config by default', async () => {
    await api.createGame([{ name: 'Alice' }]);
    expect(axios.post).toHaveBeenCalledWith('/api/games', { players: [{ name: 'Alice' }], config: {} });
  });
});

describe('api.getGame', () => {
  it('gets the correct game URL', async () => {
    await api.getGame('game-42');
    expect(axios.get).toHaveBeenCalledWith('/api/games/game-42');
  });
});

describe('api.submitRound', () => {
  const stats = [{ player_id: 'p1', bid: 1, tricks: 1, bonus: 0 }];

  it('posts to the correct round URL', async () => {
    await api.submitRound('game-1', 3, stats, false);
    expect(axios.post).toHaveBeenCalledWith('/api/games/game-1/rounds/3', {
      player_stats: stats,
      kraken_played: false,
    });
  });

  it('passes kraken_played=true when specified', async () => {
    await api.submitRound('game-1', 3, stats, true);
    const payload = axios.post.mock.calls[0][1];
    expect(payload.kraken_played).toBe(true);
  });

  it('defaults kraken_played to false', async () => {
    await api.submitRound('game-1', 3, stats);
    const payload = axios.post.mock.calls[0][1];
    expect(payload.kraken_played).toBe(false);
  });
});

describe('api.updateRound', () => {
  const stats = [{ player_id: 'p1', bid: 0, tricks: 0, bonus: 0 }];

  it('puts to the correct round URL', async () => {
    await api.updateRound('game-1', 2, stats);
    expect(axios.put).toHaveBeenCalledWith('/api/games/game-1/rounds/2', {
      player_stats: stats,
      kraken_played: false,
    });
  });
});

describe('api.undoRound', () => {
  it('deletes the correct round URL', async () => {
    await api.undoRound('game-1', 2);
    expect(axios.delete).toHaveBeenCalledWith('/api/games/game-1/rounds/2');
  });
});

describe('api.getHistory', () => {
  it('gets /api/history', async () => {
    await api.getHistory();
    expect(axios.get).toHaveBeenCalledWith('/api/history');
  });
});

describe('api.deleteGame', () => {
  it('deletes the correct game URL', async () => {
    await api.deleteGame('game-99');
    expect(axios.delete).toHaveBeenCalledWith('/api/games/game-99');
  });
});
