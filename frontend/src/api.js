import axios from 'axios';

const API_BASE = '/api';

export const api = {
  createGame: (players, config = {}) =>
    axios.post(`${API_BASE}/games`, { players, config }).then(res => res.data),

  getGame: (gameId) =>
    axios.get(`${API_BASE}/games/${gameId}`).then(res => res.data),

  submitRound: (gameId, roundNum, playerStats, krakenPlayed = false) =>
    axios.post(`${API_BASE}/games/${gameId}/rounds/${roundNum}`, {
      player_stats: playerStats,
      kraken_played: krakenPlayed
    }).then(res => res.data),

  undoRound: (gameId, roundNum) =>
    axios.delete(`${API_BASE}/games/${gameId}/rounds/${roundNum}`).then(res => res.data),

  updateRound: (gameId, roundNum, playerStats, krakenPlayed = false) =>
    axios.put(`${API_BASE}/games/${gameId}/rounds/${roundNum}`, {
      player_stats: playerStats,
      kraken_played: krakenPlayed
    }).then(res => res.data),

  getHistory: () =>
    axios.get(`${API_BASE}/history`).then(res => res.data),

  deleteGame: (gameId) =>
    axios.delete(`${API_BASE}/games/${gameId}`).then(res => res.data),
};
