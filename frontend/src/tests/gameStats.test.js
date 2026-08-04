import { describe, it, expect } from 'vitest';
import { deriveGameStats, awardWinners, pointsAtStake, scoredRounds } from '../lib/gameStats';
import { SERIES, SERIES_ALL_PAIRS, colorForSeat, playersInSeatOrder, CHROME } from '../lib/vizTheme';

// --- Fixtures ----------------------------------------------------------------
// Hand-built and hand-verified. Skull King scoring, for reference:
//   bid > 0 made    → 20 × bid              bid > 0 missed → −10 × |bid − tricks|
//   bid 0 made      → 10 × cardCount        bid 0 missed   → −10 × cardCount
//   bonus_points are added only when the bid is made (the backend excludes them
//   otherwise, but still stores what was entered — that's `bonusForfeited`).

const player = (name, seatIndex) => ({ id: `p-${name}`, name, seat_index: seatIndex, is_ghost: false });

const stat = (name, bid, tricksWon, bonus, roundScore, snapshot) => ({
  player_id: `p-${name}`,
  bid,
  tricks_won: tricksWon,
  bonus_points: bonus,
  round_score: roundScore,
  total_score_snapshot: snapshot,
});

/**
 * Three players, three rounds. Verified by hand:
 *
 *          R1 (1 card)        R2 (2 cards)       R3 (3 cards)      total
 *  Alice   1/1  +20   ( 20)   2/1  −10   ( 10)   1/1 +30 +50 ( 60)   60
 *  Bob     0/0  +10   ( 10)   1/1 +20 +40 ( 50)  3/0  −30   ( 20)    20
 *  Cara    1/0  b10 −10 (−10) 0/0  +20   ( 10)   2/2  +40   ( 50)    50
 */
const baseGame = () => ({
  id: 'g-1',
  status: 'COMPLETED',
  players: [player('Alice', 0), player('Bob', 1), player('Cara', 2)],
  rounds: [
    {
      id: 'r-1',
      round_number: 1,
      card_count: 1,
      player_stats: [
        stat('Alice', 1, 1, 0, 20, 20),
        stat('Bob', 0, 0, 0, 10, 10),
        stat('Cara', 1, 0, 10, -10, -10),
      ],
    },
    {
      id: 'r-2',
      round_number: 2,
      card_count: 2,
      player_stats: [
        stat('Alice', 2, 1, 0, -10, 10),
        stat('Bob', 1, 1, 20, 40, 50),
        stat('Cara', 0, 0, 0, 20, 10),
      ],
    },
    {
      id: 'r-3',
      round_number: 3,
      card_count: 3,
      player_stats: [
        stat('Alice', 1, 1, 30, 50, 60),
        stat('Bob', 3, 0, 0, -30, 20),
        stat('Cara', 2, 2, 0, 40, 50),
      ],
    },
  ],
});

const find = (stats, name) => stats.players.find((p) => p.name === name);

// --- pointsAtStake -----------------------------------------------------------

describe('pointsAtStake', () => {
  it('scores a bid of every trick as the round maximum', () => {
    expect(pointsAtStake(10, 10)).toBe(200); // 20 × cards
  });

  it('does NOT treat a zero bid as cowardice — a round-10 zero is half the upside', () => {
    expect(pointsAtStake(0, 10)).toBe(100);
    expect(pointsAtStake(0, 10) / (20 * 10)).toBe(0.5);
  });

  it('scales a zero bid with the round size', () => {
    expect(pointsAtStake(0, 1)).toBe(10);
    expect(pointsAtStake(0, 5)).toBe(50);
  });
});

// --- Per-player fields -------------------------------------------------------

describe('deriveGameStats — per-player', () => {
  const stats = deriveGameStats(baseGame());

  it('returns players in seat order', () => {
    expect(stats.players.map((p) => p.name)).toEqual(['Alice', 'Bob', 'Cara']);
    expect(stats.players.map((p) => p.seatIndex)).toEqual([0, 1, 2]);
  });

  it('counts rounds played', () => {
    expect(stats.players.every((p) => p.roundsPlayed === 3)).toBe(true);
    expect(stats.roundsPlayed).toBe(3);
  });

  it('totals from Σ round_score', () => {
    expect(find(stats, 'Alice').total).toBe(60);
    expect(find(stats, 'Bob').total).toBe(20);
    expect(find(stats, 'Cara').total).toBe(50);
  });

  it('counts bids made and missed', () => {
    expect(find(stats, 'Alice').bidsMade).toBe(2);
    expect(find(stats, 'Alice').bidsMissed).toBe(1);
    expect(find(stats, 'Bob').bidsMade).toBe(2);
    expect(find(stats, 'Cara').bidsMade).toBe(2);
  });

  it('signs bidBias so positive means overbidding', () => {
    // Alice: (1−1, 2−1, 1−1) → mean 1/3
    expect(find(stats, 'Alice').bidBias).toBeCloseTo(1 / 3, 10);
    // Bob: (0−0, 1−1, 3−0) → mean 1
    expect(find(stats, 'Bob').bidBias).toBeCloseTo(1, 10);
    // Cara: (1−0, 0−0, 2−2) → mean 1/3
    expect(find(stats, 'Cara').bidBias).toBeCloseTo(1 / 3, 10);
  });

  it('computes daring as the mean share of each round upside', () => {
    // Alice: 20/20, 40/40, 20/60 → (1 + 1 + 1/3)/3 = 7/9
    expect(find(stats, 'Alice').daring).toBeCloseTo(7 / 9, 10);
    // Bob: 10/20, 20/40, 60/60 → (0.5 + 0.5 + 1)/3 = 2/3
    expect(find(stats, 'Bob').daring).toBeCloseTo(2 / 3, 10);
    // Cara: 20/20, 20/40, 40/60 → (1 + 0.5 + 2/3)/3
    expect(find(stats, 'Cara').daring).toBeCloseTo((1 + 0.5 + 2 / 3) / 3, 10);
  });

  it('counts zero bids attempted and made', () => {
    expect(find(stats, 'Bob').zeroBidsAttempted).toBe(1);
    expect(find(stats, 'Bob').zeroBidsMade).toBe(1);
    expect(find(stats, 'Cara').zeroBidsAttempted).toBe(1);
    expect(find(stats, 'Cara').zeroBidsMade).toBe(1);
    expect(find(stats, 'Alice').zeroBidsAttempted).toBe(0);
  });

  it('separates bonus banked from bonus forfeited', () => {
    expect(find(stats, 'Alice').bonusBanked).toBe(30);
    expect(find(stats, 'Alice').bonusForfeited).toBe(0);
    expect(find(stats, 'Bob').bonusBanked).toBe(20);
    expect(find(stats, 'Bob').bonusForfeited).toBe(0);
    // Cara entered a 10-point bonus in R1 and lost it by missing the bid.
    expect(find(stats, 'Cara').bonusBanked).toBe(0);
    expect(find(stats, 'Cara').bonusForfeited).toBe(10);
  });

  it('finds the best and worst round for each player', () => {
    expect(find(stats, 'Alice').bestRound).toEqual({ roundNumber: 3, score: 50 });
    expect(find(stats, 'Alice').worstRound).toEqual({ roundNumber: 2, score: -10 });
    expect(find(stats, 'Bob').bestRound).toEqual({ roundNumber: 2, score: 40 });
    expect(find(stats, 'Bob').worstRound).toEqual({ roundNumber: 3, score: -30 });
    expect(find(stats, 'Cara').bestRound).toEqual({ roundNumber: 3, score: 40 });
    expect(find(stats, 'Cara').worstRound).toEqual({ roundNumber: 1, score: -10 });
  });

  it('splits the score into bid points and penalties', () => {
    expect(find(stats, 'Alice').bidPoints).toBe(40); // (20−0) + (50−30)
    expect(find(stats, 'Alice').penalties).toBe(-10);
    expect(find(stats, 'Bob').bidPoints).toBe(30); // (10−0) + (40−20)
    expect(find(stats, 'Bob').penalties).toBe(-30);
    expect(find(stats, 'Cara').bidPoints).toBe(60); // 20 + 40
    expect(find(stats, 'Cara').penalties).toBe(-10);
  });

  it('keeps penalties non-positive', () => {
    expect(stats.players.every((p) => p.penalties <= 0)).toBe(true);
  });

  it('computes trick share against all tricks won', () => {
    // Total tricks taken across the game: 1 + 2 + 3 = 6
    expect(find(stats, 'Alice').tricksWon).toBe(3);
    expect(find(stats, 'Alice').trickShare).toBeCloseTo(0.5, 10);
    expect(find(stats, 'Bob').trickShare).toBeCloseTo(1 / 6, 10);
    expect(find(stats, 'Cara').trickShare).toBeCloseTo(1 / 3, 10);
    const shareSum = stats.players.reduce((a, p) => a + p.trickShare, 0);
    expect(shareSum).toBeCloseTo(1, 10);
  });

  it('counts rounds each player strictly led', () => {
    // Leaders: R1 Alice (20), R2 Bob (50), R3 Alice (60)
    expect(find(stats, 'Alice').leadRounds).toBe(2);
    expect(find(stats, 'Bob').leadRounds).toBe(1);
    expect(find(stats, 'Cara').leadRounds).toBe(0);
  });

  it('exposes byPlayerId keyed on the player id', () => {
    expect(stats.byPlayerId.get('p-Alice').total).toBe(60);
  });
});

// --- Game level --------------------------------------------------------------

describe('deriveGameStats — game level', () => {
  const stats = deriveGameStats(baseGame());

  it('names the winner and the margin over the runner-up', () => {
    expect(stats.winner.name).toBe('Alice');
    expect(stats.winners.map((w) => w.name)).toEqual(['Alice']);
    expect(stats.margin).toBe(10); // 60 − 50
  });

  it('counts lead changes and reports where they happened', () => {
    expect(stats.leadChanges).toBe(2);
    expect(stats.leadChangeRounds).toEqual([
      { roundNumber: 2, playerId: 'p-Bob', playerName: 'Bob', fromPlayerId: 'p-Alice', fromPlayerName: 'Alice' },
      { roundNumber: 3, playerId: 'p-Alice', playerName: 'Alice', fromPlayerId: 'p-Bob', fromPlayerName: 'Bob' },
    ]);
  });

  it('finds the biggest swing by magnitude, keeping its sign', () => {
    expect(stats.biggestSwing).toEqual({
      roundNumber: 3,
      playerId: 'p-Alice',
      playerName: 'Alice',
      score: 50,
    });
  });

  it('prefers a large negative swing over a smaller positive one', () => {
    const game = baseGame();
    game.rounds[1].player_stats[1] = stat('Bob', 2, 0, 0, -80, -70);
    game.rounds[2].player_stats[1] = stat('Bob', 3, 0, 0, -30, -100);
    const swung = deriveGameStats(game);
    expect(swung.biggestSwing.score).toBe(-80);
    expect(swung.biggestSwing.playerName).toBe('Bob');
  });

  it('builds cumulative progression per round', () => {
    expect(stats.progression.map((s) => s.roundNumber)).toEqual([1, 2, 3]);
    expect(stats.progression[0].totals).toEqual({ 'p-Alice': 20, 'p-Bob': 10, 'p-Cara': -10 });
    expect(stats.progression[1].totals).toEqual({ 'p-Alice': 10, 'p-Bob': 50, 'p-Cara': 10 });
    expect(stats.progression[2].totals).toEqual({ 'p-Alice': 60, 'p-Bob': 20, 'p-Cara': 50 });
    expect(stats.progression.map((s) => s.leaderId)).toEqual(['p-Alice', 'p-Bob', 'p-Alice']);
  });

  it('reports no leader for a round where the top is tied', () => {
    const game = baseGame();
    // Make R1 a tie at the top between Alice and Bob at 20 each.
    game.rounds[0].player_stats[1] = stat('Bob', 1, 1, 0, 20, 20);
    const tied = deriveGameStats(game);
    expect(tied.progression[0].leaderId).toBeNull();
    // A tie has no leader, so it never counts as a handover in either direction.
    expect(tied.leadChangeRounds.map((lc) => lc.roundNumber)).toEqual([3]);
  });

  it('lists every winner when the game ends level', () => {
    const game = baseGame();
    // Give Cara the 10 points that separate her from Alice.
    game.rounds[2].player_stats[2] = stat('Cara', 2, 2, 10, 50, 60);
    const drawn = deriveGameStats(game);
    expect(drawn.winners.map((w) => w.name).sort()).toEqual(['Alice', 'Cara']);
    expect(drawn.margin).toBe(0);
  });
});

// --- Invariants --------------------------------------------------------------

describe('deriveGameStats — invariants', () => {
  it('reports no warnings on a consistent game', () => {
    expect(deriveGameStats(baseGame()).warnings).toEqual([]);
  });

  it('reconciles bidPoints + bonusBanked + penalties === total', () => {
    // This invariant is algebraically implied by how the three parts are defined
    // (they partition the same round scores), so it cannot break on data alone.
    // It is asserted here to catch a future REDEFINITION of any of the three —
    // if someone changes what bidPoints means, the composition chart stops adding
    // up to the leaderboard and this fails.
    const stats = deriveGameStats(baseGame());
    stats.players.forEach((p) => {
      expect(p.bidPoints + p.bonusBanked + p.penalties).toBe(p.total);
    });
  });

  it('FAILS LOUDLY when total_score_snapshot has gone stale', () => {
    const game = baseGame();
    // Exactly what undo_round leaves behind: round scores are right, the stored
    // running totals are from before the undo.
    game.rounds[2].player_stats[0] = stat('Alice', 1, 1, 30, 50, 999);
    game.rounds[2].player_stats[1] = stat('Bob', 3, 0, 0, -30, 123);

    const stats = deriveGameStats(game);
    const warning = stats.warnings.find((w) => w.code === 'STALE_SNAPSHOT');

    expect(warning).toBeDefined();
    expect(warning.players).toEqual([
      { playerId: 'p-Alice', name: 'Alice', sum: 60, snapshot: 999 },
      { playerId: 'p-Bob', name: 'Bob', sum: 20, snapshot: 123 },
    ]);
    // Σ round_score stays the source of truth — the reported totals do NOT move.
    expect(find(stats, 'Alice').total).toBe(60);
    expect(stats.winner.name).toBe('Alice');
  });
});

// --- Edge cases --------------------------------------------------------------

describe('deriveGameStats — edge cases', () => {
  it('handles a player who made every bid', () => {
    const game = baseGame();
    game.rounds[1].player_stats[0] = stat('Alice', 1, 1, 0, 20, 40);
    game.rounds[2].player_stats[0] = stat('Alice', 1, 1, 30, 50, 90);
    const stats = deriveGameStats(game);
    const alice = find(stats, 'Alice');
    expect(alice.bidsMade).toBe(3);
    expect(alice.bidsMissed).toBe(0);
    expect(alice.penalties).toBe(0);
    expect(alice.bonusForfeited).toBe(0);
    expect(alice.bidPoints + alice.bonusBanked + alice.penalties).toBe(alice.total);
  });

  it('handles a player who made no bids at all', () => {
    const game = baseGame();
    game.rounds[0].player_stats[0] = stat('Alice', 1, 0, 10, -10, -10);
    game.rounds[1].player_stats[0] = stat('Alice', 2, 1, 20, -10, -20);
    game.rounds[2].player_stats[0] = stat('Alice', 1, 0, 30, -10, -30);
    const stats = deriveGameStats(game);
    const alice = find(stats, 'Alice');
    expect(alice.bidsMade).toBe(0);
    expect(alice.bidPoints).toBe(0);
    expect(alice.bonusBanked).toBe(0);
    expect(alice.bonusForfeited).toBe(60); // every bonus entered, every one lost
    expect(alice.penalties).toBe(-30);
    expect(alice.total).toBe(-30);
    expect(alice.leadRounds).toBe(0);
  });

  it('handles a game with no bonuses anywhere', () => {
    const game = baseGame();
    game.rounds.forEach((r) => r.player_stats.forEach((s) => { s.bonus_points = 0; }));
    const stats = deriveGameStats(game);
    expect(stats.players.every((p) => p.bonusBanked === 0 && p.bonusForfeited === 0)).toBe(true);
    // With no bonuses, bid points and penalties alone account for the total.
    stats.players.forEach((p) => expect(p.bidPoints + p.penalties).toBe(p.total));
  });

  it('ignores unscored rounds in a mid-game game', () => {
    const game = baseGame();
    game.status = 'ACTIVE';
    game.rounds.push({ id: 'r-4', round_number: 4, card_count: 4, player_stats: [] });
    game.rounds.push({ id: 'r-5', round_number: 5, card_count: 5, player_stats: null });

    const stats = deriveGameStats(game);
    expect(stats.roundsPlayed).toBe(3);
    expect(stats.progression).toHaveLength(3);
    expect(find(stats, 'Alice').total).toBe(60);
    // The snapshot invariant reads the last SCORED round, not the empty ones.
    expect(stats.warnings).toEqual([]);
  });

  it('handles a game with no scored rounds at all', () => {
    const game = baseGame();
    game.rounds = [{ id: 'r-1', round_number: 1, card_count: 1, player_stats: [] }];
    const stats = deriveGameStats(game);
    expect(stats.roundsPlayed).toBe(0);
    expect(stats.progression).toEqual([]);
    expect(stats.biggestSwing).toBeNull();
    expect(stats.leadChanges).toBe(0);
    expect(stats.warnings).toEqual([]);
    expect(stats.players.every((p) => p.total === 0 && p.bestRound === null)).toBe(true);
  });

  it('handles a 2-player game', () => {
    const game = {
      id: 'g-2',
      status: 'COMPLETED',
      players: [player('Alice', 0), player('Bob', 1)],
      rounds: [
        {
          id: 'r-1',
          round_number: 1,
          card_count: 1,
          player_stats: [stat('Alice', 1, 1, 0, 20, 20), stat('Bob', 0, 0, 0, 10, 10)],
        },
        {
          id: 'r-2',
          round_number: 2,
          card_count: 2,
          player_stats: [stat('Alice', 2, 2, 0, 40, 60), stat('Bob', 1, 0, 20, -10, 0)],
        },
      ],
    };
    const stats = deriveGameStats(game);
    expect(stats.players).toHaveLength(2);
    expect(stats.winner.name).toBe('Alice');
    expect(stats.margin).toBe(60);
    expect(find(stats, 'Alice').leadRounds).toBe(2);
    expect(find(stats, 'Bob').bonusForfeited).toBe(20);
    expect(stats.leadChanges).toBe(0);
    expect(stats.warnings).toEqual([]);
  });

  it('skips a player who has no stats in a round', () => {
    const game = baseGame();
    game.players.push(player('Dave', 3));
    const stats = deriveGameStats(game);
    const dave = find(stats, 'Dave');
    expect(dave.roundsPlayed).toBe(0);
    expect(dave.total).toBe(0);
    expect(dave.daring).toBe(0);
    expect(dave.bestRound).toBeNull();
    // A player with nothing recorded must not become the winner.
    expect(stats.winner.name).toBe('Alice');
  });

  it('sorts unordered rounds before deriving anything', () => {
    const game = baseGame();
    game.rounds.reverse();
    const stats = deriveGameStats(game);
    expect(stats.progression.map((s) => s.roundNumber)).toEqual([1, 2, 3]);
    expect(stats.warnings).toEqual([]);
  });

  it('survives an empty or missing game', () => {
    expect(deriveGameStats({ players: [], rounds: [] }).players).toEqual([]);
    expect(deriveGameStats({}).roundsPlayed).toBe(0);
    expect(deriveGameStats(undefined).winner).toBeNull();
  });

  it('scoredRounds only returns rounds with recorded stats, in order', () => {
    const game = baseGame();
    game.rounds.push({ id: 'r-9', round_number: 9, card_count: 9, player_stats: [] });
    expect(scoredRounds(game).map((r) => r.round_number)).toEqual([1, 2, 3]);
  });
});

// --- Award selection ---------------------------------------------------------

describe('awardWinners', () => {
  const stats = deriveGameStats(baseGame());

  it('picks the single clear winner', () => {
    const daring = awardWinners(stats.players, (p) => p.daring);
    expect(daring.winners.map((w) => w.name)).toEqual(['Alice']);
    expect(daring.value).toBeCloseTo(7 / 9, 10);
  });

  it('returns every player tied at the top', () => {
    // Bob and Cara each made one zero bid; Alice attempted none.
    const ghost = awardWinners(stats.players, (p) => p.zeroBidsMade);
    expect(ghost.winners.map((w) => w.name)).toEqual(['Bob', 'Cara']);
    expect(ghost.value).toBe(1);
  });

  it('suppresses an award nobody earned', () => {
    // No player forfeited a bonus in this variant, so the tile is noise.
    const clean = deriveGameStats(baseGame());
    clean.players.forEach((p) => { p.bonusForfeited = 0; });
    expect(awardWinners(clean.players, (p) => p.bonusForfeited)).toBeNull();
  });

  it('suppresses an award every player ties on', () => {
    // All three made exactly 2 bids in the base game — there is no story here.
    expect(awardWinners(stats.players, (p) => p.bidsMade)).toBeNull();
  });

  it('keeps a zero-valued award when explicitly allowed', () => {
    const clean = deriveGameStats(baseGame());
    clean.players.forEach((p) => { p.bonusForfeited = 0; });
    // All-tied at zero → suppressed even with allowZero, because a tie across
    // everyone has no story regardless of the value.
    expect(awardWinners(clean.players, (p) => p.bonusForfeited, { allowZero: true })).toBeNull();
    // But a genuine zero-best with a distinct winner survives.
    const some = deriveGameStats(baseGame());
    some.players[0].bonusForfeited = 0;
    some.players[1].bonusForfeited = -1;
    some.players[2].bonusForfeited = -2;
    const award = awardWinners(some.players, (p) => p.bonusForfeited, { allowZero: true });
    expect(award.winners.map((w) => w.name)).toEqual(['Alice']);
  });

  it('finds a minimum for the deepest-hole award', () => {
    const worst = awardWinners(stats.players, (p) => p.worstRound?.score ?? 0, { direction: 'min' });
    expect(worst.winners.map((w) => w.name)).toEqual(['Bob']);
    expect(worst.value).toBe(-30);
  });

  it('returns null for an empty roster', () => {
    expect(awardWinners([], (p) => p.total)).toBeNull();
    expect(awardWinners(null, (p) => p.total)).toBeNull();
  });

  it('returns null rather than an award over a missing metric', () => {
    expect(awardWinners(stats.players, () => undefined)).toBeNull();
    expect(awardWinners(stats.players, () => NaN)).toBeNull();
  });

  it('does not suppress a single-player game with a real value', () => {
    const solo = [{ name: 'Alice', total: 40 }];
    expect(awardWinners(solo, (p) => p.total).winners).toHaveLength(1);
  });
});

// --- Palette lock ------------------------------------------------------------

describe('vizTheme palette', () => {
  it('locks the six validated series hexes', () => {
    // validated: node scripts/validate_palette.js \
    //   "#2a78d6,#eb6834,#1baf7a,#eda100,#e87ba4,#008300" --mode light --surface "#ffffff"
    // → ALL CHECKS PASS · adjacent CVD ΔE 9.1 (protan) · normal-vision ΔE 19.6
    // Changing any hex here means re-running that command before shipping.
    expect(SERIES).toEqual(['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300']);
    expect(SERIES).toHaveLength(6);
  });

  it('locks the three slots that clear the all-pairs gate', () => {
    // validated: … "#2a78d6,#eb6834,#1baf7a" --mode light --surface "#ffffff" --pairs all
    // → ALL CHECKS PASS · all-pairs CVD ΔE 9.2 · normal-vision ΔE 24.0
    expect(SERIES_ALL_PAIRS).toEqual(['#2a78d6', '#eb6834', '#1baf7a']);
  });

  it('assigns color by seat, never by rank', () => {
    expect(colorForSeat(0)).toBe('#2a78d6');
    expect(colorForSeat(5)).toBe('#008300');
  });

  it('does NOT cycle past six players — a 7th must look wrong, not look like player 1', () => {
    expect(colorForSeat(6)).not.toBe(SERIES[0]);
    expect(colorForSeat(6)).toBe(CHROME.inkMuted);
    expect(colorForSeat(12)).toBe(CHROME.inkMuted);
  });

  it('orders players by seat and attaches their color', () => {
    const shuffled = [player('Cara', 2), player('Alice', 0), player('Bob', 1)];
    expect(playersInSeatOrder(shuffled).map((p) => [p.name, p.color])).toEqual([
      ['Alice', '#2a78d6'],
      ['Bob', '#eb6834'],
      ['Cara', '#1baf7a'],
    ]);
  });

  it('does not mutate the array it is given', () => {
    const input = [player('Cara', 2), player('Alice', 0)];
    playersInSeatOrder(input);
    expect(input.map((p) => p.name)).toEqual(['Cara', 'Alice']);
  });
});
