// Everything the end-of-game dashboard needs, derived from data the backend
// already stores. Pure functions: no React, no API, no formatting. Give it a
// `game` (as returned by GET /games/:id) and it hands back plain data.
//
// Kept as a standalone module on purpose. If cross-game player stats ever land,
// aggregating these is a reduce over many games rather than a rewrite.
//
// HONESTY RULES baked in here (§3 of the plan): 10 rounds × 3–6 players is a tiny
// sample, so this module returns COUNTS and raw means. It deliberately does not
// return percentages, does not round, and does not rank anyone by a derived rate.
// Formatting is the components' job; `daring` is the one value meant to be shown
// as a percent, and even that renders as a single integer.

/**
 * How much of a round's maximum upside a player signed up for.
 *
 * A bid of 0 in round 10 is one of the boldest plays in the game — 100 points
 * riding on winning nothing at all. Scoring ambition as `bid / cardCount` would
 * call that maximum cowardice, which is backwards.
 */
export const pointsAtStake = (bid, cardCount) => (bid === 0 ? 10 * cardCount : 20 * bid);

/** A round counts only once it has been scored — games can be sitting mid-edit. */
const isScored = (round) => Array.isArray(round?.player_stats) && round.player_stats.length > 0;

export function scoredRounds(game) {
  return [...(game?.rounds ?? [])]
    .filter(isScored)
    .sort((a, b) => a.round_number - b.round_number);
}

const mean = (values) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0);

/**
 * deriveGameStats(game)
 *
 * @returns {{
 *   players: Array<object>,     // per-player stats, seat order
 *   byPlayerId: Map,            // same objects, keyed by id
 *   progression: Array<object>, // cumulative totals per scored round
 *   roundsPlayed: number,
 *   winner: object|null,
 *   winners: Array<object>,     // every player tied at the top
 *   margin: number,             // winner − runner-up (0 when tied at the top)
 *   leadChanges: number,
 *   leadChangeRounds: Array<object>,
 *   biggestSwing: object|null,
 *   warnings: Array<object>,    // invariant breaks, for a visible banner
 * }}
 */
export function deriveGameStats(game) {
  const rounds = scoredRounds(game);
  const players = [...(game?.players ?? [])].sort((a, b) => a.seat_index - b.seat_index);

  const statsFor = (playerId) =>
    rounds
      .map((r) => ({ round: r, stat: r.player_stats.find((s) => s.player_id === playerId) }))
      .filter((x) => x.stat);

  const totalTricksWon = rounds.reduce(
    (acc, r) => acc + r.player_stats.reduce((a, s) => a + (s.tricks_won || 0), 0),
    0
  );

  // --- Cumulative progression -------------------------------------------------
  // Σ round_score is the source of truth, NOT total_score_snapshot. Leaderboard
  // sums round_score while ResolutionPhase and Lobby read the snapshot, and those
  // two can silently disagree after an undo. The invariant below detects it.
  const running = new Map(players.map((p) => [p.id, 0]));
  const progression = rounds.map((r) => {
    r.player_stats.forEach((s) => {
      if (!running.has(s.player_id)) return;
      running.set(s.player_id, running.get(s.player_id) + (s.round_score || 0));
    });
    const totals = {};
    players.forEach((p) => { totals[p.id] = running.get(p.id); });

    // The leader for this round, or null when the top is tied — a tie has no
    // leader, so tie-flicker never gets counted as two lead changes.
    const ranked = players
      .map((p) => ({ playerId: p.id, total: totals[p.id] }))
      .sort((a, b) => b.total - a.total);
    const leader = ranked.length > 1 && ranked[0].total === ranked[1].total ? null : ranked[0] ?? null;

    return {
      roundNumber: r.round_number,
      cardCount: r.card_count,
      totals,
      leaderId: leader ? leader.playerId : null,
    };
  });

  // --- Per-player -------------------------------------------------------------
  const perPlayer = players.map((p) => {
    const entries = statsFor(p.id);
    const made = entries.filter(({ stat }) => stat.bid === stat.tricks_won);
    const missed = entries.filter(({ stat }) => stat.bid !== stat.tricks_won);

    const scores = entries.map(({ stat }) => stat.round_score || 0);
    const argOf = (pick) => {
      if (!entries.length) return null;
      const chosen = entries.reduce((best, cur) =>
        pick(cur.stat.round_score || 0, best.stat.round_score || 0) ? cur : best
      );
      return { roundNumber: chosen.round.round_number, score: chosen.stat.round_score || 0 };
    };

    return {
      id: p.id,
      name: p.name,
      seatIndex: p.seat_index,

      roundsPlayed: entries.length,
      total: scores.reduce((a, b) => a + b, 0),

      bidsMade: made.length,
      bidsMissed: missed.length,
      // Signed: positive means they bid more tricks than they took (overbid).
      // A mean in tricks, not a rate — the chart shows it to one decimal.
      bidBias: mean(entries.map(({ stat }) => stat.bid - stat.tricks_won)),
      // Share of each round's maximum possible upside (20 × cards) they signed up
      // for, averaged over the game. A fraction; render as one integer percent.
      daring: mean(
        entries
          .filter(({ round }) => round.card_count > 0)
          .map(({ round, stat }) => pointsAtStake(stat.bid, round.card_count) / (20 * round.card_count))
      ),

      zeroBidsAttempted: entries.filter(({ stat }) => stat.bid === 0).length,
      zeroBidsMade: entries.filter(({ stat }) => stat.bid === 0 && stat.tricks_won === 0).length,

      // The sleeper stat: bonus points the player entered but never received,
      // because they missed the bid that round. Stored, never shown until now.
      bonusBanked: made.reduce((a, { stat }) => a + (stat.bonus_points || 0), 0),
      bonusForfeited: missed.reduce((a, { stat }) => a + (stat.bonus_points || 0), 0),

      bestRound: argOf((a, b) => a > b),
      worstRound: argOf((a, b) => a < b),

      // Score composition. bidPoints + bonusBanked + penalties === total.
      bidPoints: made.reduce((a, { stat }) => a + ((stat.round_score || 0) - (stat.bonus_points || 0)), 0),
      penalties: missed.reduce((a, { stat }) => a + (stat.round_score || 0), 0),

      tricksWon: entries.reduce((a, { stat }) => a + (stat.tricks_won || 0), 0),
      trickShare: totalTricksWon
        ? entries.reduce((a, { stat }) => a + (stat.tricks_won || 0), 0) / totalTricksWon
        : 0,

      leadRounds: progression.filter((step) => step.leaderId === p.id).length,
    };
  });

  const byPlayerId = new Map(perPlayer.map((p) => [p.id, p]));

  // --- Game level -------------------------------------------------------------
  const ranked = [...perPlayer].sort((a, b) => b.total - a.total);
  const topTotal = ranked.length ? ranked[0].total : 0;
  const winners = ranked.filter((p) => p.total === topTotal);
  const winner = ranked[0] ?? null;
  const margin = ranked.length > 1 ? ranked[0].total - ranked[1].total : 0;

  const leadChangeRounds = [];
  progression.forEach((step, i) => {
    if (i === 0) return;
    const prev = progression[i - 1].leaderId;
    // Only a real handover counts: both rounds must have an unambiguous leader.
    if (step.leaderId && prev && step.leaderId !== prev) {
      leadChangeRounds.push({
        roundNumber: step.roundNumber,
        playerId: step.leaderId,
        playerName: byPlayerId.get(step.leaderId)?.name ?? null,
        fromPlayerId: prev,
        fromPlayerName: byPlayerId.get(prev)?.name ?? null,
      });
    }
  });

  // The single loudest round in the game, by MAGNITUDE — a −100 is a bigger swing
  // than a +60, and the annotation carries the sign so the label reads honestly.
  let biggestSwing = null;
  rounds.forEach((r) => {
    r.player_stats.forEach((s) => {
      const score = s.round_score || 0;
      if (!biggestSwing || Math.abs(score) > Math.abs(biggestSwing.score)) {
        biggestSwing = {
          roundNumber: r.round_number,
          playerId: s.player_id,
          playerName: byPlayerId.get(s.player_id)?.name ?? null,
          score,
        };
      }
    });
  });

  // --- Invariants -------------------------------------------------------------
  const warnings = [];

  // 1. Composition reconciles. If this breaks, the composition chart is lying.
  const compositionOffenders = perPlayer
    .filter((p) => p.bidPoints + p.bonusBanked + p.penalties !== p.total)
    .map((p) => ({
      playerId: p.id,
      name: p.name,
      parts: p.bidPoints + p.bonusBanked + p.penalties,
      total: p.total,
    }));
  if (compositionOffenders.length) {
    warnings.push({ code: 'COMPOSITION_MISMATCH', players: compositionOffenders });
  }

  // 2. Σ round_score === the last round's total_score_snapshot. A break here means
  // the stored running totals went stale (undo_round leaves them behind), so the
  // two places the app reads totals from disagree. We render from Σ round_score
  // and say so out loud rather than quietly showing different numbers per screen.
  const lastRound = rounds[rounds.length - 1];
  const snapshotOffenders = [];
  if (lastRound) {
    perPlayer.forEach((p) => {
      const stat = lastRound.player_stats.find((s) => s.player_id === p.id);
      if (!stat) return;
      if ((stat.total_score_snapshot ?? 0) !== p.total) {
        snapshotOffenders.push({
          playerId: p.id,
          name: p.name,
          sum: p.total,
          snapshot: stat.total_score_snapshot ?? 0,
        });
      }
    });
  }
  if (snapshotOffenders.length) {
    warnings.push({ code: 'STALE_SNAPSHOT', players: snapshotOffenders });
  }

  return {
    players: perPlayer,
    byPlayerId,
    progression,
    roundsPlayed: rounds.length,
    winner,
    winners,
    margin,
    leadChanges: leadChangeRounds.length,
    leadChangeRounds,
    biggestSwing,
    warnings,
  };
}

/**
 * Pick the award winners for a metric: everyone tied at the extreme.
 *
 * Returns null when the award should be SUPPRESSED — when the winning value is
 * zero (an award nobody earned is noise) or when every player is tied (there is
 * no story in "all four of you did the same thing"). Suppression is what keeps
 * the tile row compact.
 *
 * @param {Array} players    per-player stats
 * @param {Function} value   player → number
 * @param {object} [options]
 * @param {'max'|'min'} [options.direction]
 * @param {boolean} [options.allowZero]  keep the award when the best value is 0
 */
export function awardWinners(players, value, { direction = 'max', allowZero = false } = {}) {
  if (!players || players.length === 0) return null;

  const values = players.map(value);
  if (values.some((v) => typeof v !== 'number' || Number.isNaN(v))) return null;

  const best = direction === 'max' ? Math.max(...values) : Math.min(...values);
  if (!allowZero && best === 0) return null;

  const winners = players.filter((p, i) => values[i] === best);
  if (winners.length === players.length && players.length > 1) return null;

  return { winners, value: best };
}
