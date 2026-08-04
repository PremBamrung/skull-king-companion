import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useGameStore } from '../store';
import { deriveGameStats } from '../lib/gameStats';
import AwardsRow from '../components/AwardsRow';
import DaringScatter from '../components/DaringScatter';
import BidBiasChart from '../components/BidBiasChart';
import CompositionChart from '../components/CompositionChart';
import Scoresheet from '../components/Scoresheet';
import ScoreGraph from '../components/ScoreGraph';
import GameOverView from '../components/GameOverView';

// Recharts' ResponsiveContainer reads getBoundingClientRect() on mount and needs a
// ResizeObserver to exist; jsdom gives it a 0×0 box and no observer, so the charts
// would render as empty divs. Stubbing both means these tests smoke-test real SVG.
beforeEach(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.getBoundingClientRect = () => ({
    width: 800,
    height: 400,
    top: 0,
    left: 0,
    right: 800,
    bottom: 400,
    x: 0,
    y: 0,
    toJSON: () => {},
  });
  useGameStore.setState({ language: 'en' });
});

// --- Fixture builders --------------------------------------------------------
// Scores are plausible rather than hand-verified — gameStats.test.js is where the
// arithmetic is pinned down. These exist to give every component real shapes to
// render: 3 players, 6 players, and a game that stopped halfway.

const NAMES = ['Alice', 'Bob', 'Cara', 'Dave', 'Eve', 'Finn'];

function buildGame({ playerCount = 3, roundCount = 10, unscoredFrom = null } = {}) {
  const players = NAMES.slice(0, playerCount).map((name, i) => ({
    id: `p-${i}`,
    name,
    seat_index: i,
    is_ghost: false,
  }));

  const totals = new Map(players.map((p) => [p.id, 0]));
  const rounds = [];

  for (let n = 1; n <= roundCount; n += 1) {
    if (unscoredFrom && n >= unscoredFrom) {
      rounds.push({ id: `r-${n}`, round_number: n, card_count: n, player_stats: [] });
      continue;
    }
    let tricksLeft = n;
    const player_stats = players.map((p, i) => {
      // Deterministic, no randomness: spread bids and outcomes across players so
      // some make their bid, some miss, some bid zero, some carry a bonus.
      const bid = (i + n) % (n + 1);
      const tricks = Math.max(0, Math.min(tricksLeft, (i * n) % (n + 1)));
      tricksLeft -= tricks;
      const bonus = (i + n) % 3 === 0 ? 10 * ((i % 2) + 1) : 0;
      const made = bid === tricks;
      let score;
      if (made) score = (bid === 0 ? 10 * n : 20 * bid) + bonus;
      else score = bid === 0 ? -10 * n : -10 * Math.abs(bid - tricks);
      totals.set(p.id, totals.get(p.id) + score);
      return {
        player_id: p.id,
        bid,
        tricks_won: tricks,
        bonus_points: bonus,
        round_score: score,
        total_score_snapshot: totals.get(p.id),
      };
    });
    rounds.push({ id: `r-${n}`, round_number: n, card_count: n, player_stats });
  }

  return { id: 'g-smoke', status: unscoredFrom ? 'ACTIVE' : 'COMPLETED', players, rounds };
}

const CASES = [
  ['3 players, full game', buildGame({ playerCount: 3 })],
  ['6 players, full game', buildGame({ playerCount: 6 })],
  ['4 players, partially played', buildGame({ playerCount: 4, unscoredFrom: 5 })],
  ['2 players, full game', buildGame({ playerCount: 2 })],
];

const COMPONENTS = [
  ['AwardsRow', (game, stats) => <AwardsRow stats={stats} />],
  ['DaringScatter', (game, stats) => <DaringScatter stats={stats} />],
  ['BidBiasChart', (game, stats) => <BidBiasChart stats={stats} />],
  ['CompositionChart', (game, stats) => <CompositionChart stats={stats} />],
  ['Scoresheet', (game, stats) => <Scoresheet game={game} stats={stats} defaultOpen />],
  ['ScoreGraph (hero)', (game, stats) => <ScoreGraph game={game} variant="hero" stats={stats} />],
  ['ScoreGraph (sidebar)', (game) => <ScoreGraph game={game} variant="sidebar" />],
];

// --- Smoke -------------------------------------------------------------------

describe('dashboard components render without throwing', () => {
  COMPONENTS.forEach(([componentName, renderNode]) => {
    CASES.forEach(([caseName, game]) => {
      it(`${componentName} — ${caseName}`, () => {
        const stats = deriveGameStats(game);
        expect(() => render(renderNode(game, stats))).not.toThrow();
      });
    });
  });

  CASES.forEach(([caseName, game]) => {
    it(`GameOverView — ${caseName}`, () => {
      expect(() =>
        render(<GameOverView game={game} onExit={() => {}} onStartEditRound={() => {}} />)
      ).not.toThrow();
    });
  });

  it('renders every component in French too', () => {
    useGameStore.setState({ language: 'fr' });
    const game = buildGame({ playerCount: 6 });
    expect(() => render(<GameOverView game={game} onExit={() => {}} onStartEditRound={() => {}} />)).not.toThrow();
    expect(screen.getByText(/Capitaine/)).toBeInTheDocument();
  });
});

// --- Behaviour worth pinning -------------------------------------------------

describe('GameOverView', () => {
  it('names the winner and their score as the hero figure', () => {
    const game = buildGame({ playerCount: 4 });
    const stats = deriveGameStats(game);
    const { container } = render(<GameOverView game={game} onExit={() => {}} onStartEditRound={() => {}} />);
    // The winner's name appears in charts and the sheet too, so read the hero
    // block specifically: the ≥48px sans figure is the one hero number per view.
    const hero = container.querySelector('.text-6xl');
    expect(hero).toHaveTextContent(String(stats.winner.total));
    expect(hero.className).toContain('font-sans');
    expect(hero.className).not.toContain('tabular-nums');
    expect(hero.parentElement).toHaveTextContent(stats.winner.name);
  });

  it('shows the stale-snapshot banner only when the invariant breaks', () => {
    const clean = buildGame({ playerCount: 3 });
    const { unmount } = render(<GameOverView game={clean} onExit={() => {}} onStartEditRound={() => {}} />);
    expect(screen.queryByText(/Totals recalculated/)).not.toBeInTheDocument();
    unmount();

    const stale = buildGame({ playerCount: 3 });
    stale.rounds[stale.rounds.length - 1].player_stats.forEach((s) => { s.total_score_snapshot = 4242; });
    render(<GameOverView game={stale} onExit={() => {}} onStartEditRound={() => {}} />);
    expect(screen.getByText(/Totals recalculated/)).toBeInTheDocument();
  });

  it('still renders the winner from Σ round_score when snapshots are stale', () => {
    const stale = buildGame({ playerCount: 3 });
    const stats = deriveGameStats(stale);
    stale.rounds[stale.rounds.length - 1].player_stats.forEach((s) => { s.total_score_snapshot = 4242; });
    const { container } = render(<GameOverView game={stale} onExit={() => {}} onStartEditRound={() => {}} />);
    expect(container.querySelector('.text-6xl')).toHaveTextContent(String(stats.winner.total));
    // The bogus snapshot must not surface anywhere on the dashboard.
    expect(screen.queryByText('4242')).not.toBeInTheDocument();
  });

  it('dims the dashboard instead of unmounting it while a round is saving', () => {
    const game = buildGame({ playerCount: 3 });
    const { container, rerender } = render(
      <GameOverView game={game} onExit={() => {}} onStartEditRound={() => {}} isRefreshing={false} />
    );
    const panel = container.querySelector('[aria-busy]');
    expect(panel).toHaveAttribute('aria-busy', 'false');

    rerender(<GameOverView game={game} onExit={() => {}} onStartEditRound={() => {}} isRefreshing />);
    const busy = container.querySelector('[aria-busy="true"]');
    expect(busy).toBeInTheDocument();
    // Same node, still populated — no skeleton swap, no layout jump.
    expect(busy.querySelector('table, svg')).toBeTruthy();
  });

  it('renders nothing chart-shaped for a game with no scored rounds', () => {
    const empty = buildGame({ playerCount: 3, unscoredFrom: 1 });
    expect(() => render(<GameOverView game={empty} onExit={() => {}} onStartEditRound={() => {}} />)).not.toThrow();
  });
});

describe('AwardsRow', () => {
  it('suppresses awards nobody earned', () => {
    const game = buildGame({ playerCount: 3 });
    game.rounds.forEach((r) => r.player_stats.forEach((s) => { s.bonus_points = 0; }));
    const stats = deriveGameStats(game);
    render(<AwardsRow stats={stats} />);
    // No bonuses anywhere → neither bonus award has anything to say.
    expect(screen.queryByText('Treasure Lost')).not.toBeInTheDocument();
    expect(screen.queryByText('Treasure Hunter')).not.toBeInTheDocument();
    // But the daring award still stands.
    expect(screen.getByText('Most Daring')).toBeInTheDocument();
  });

  it('lists both names when an award is tied', () => {
    const game = buildGame({ playerCount: 3 });
    const stats = deriveGameStats(game);
    // Force a two-way tie at the top of Held the Lead.
    stats.players[0].leadRounds = 5;
    stats.players[1].leadRounds = 5;
    stats.players[2].leadRounds = 0;
    render(<AwardsRow stats={stats} />);
    const tile = screen.getByText('Held the Lead').closest('div').parentElement;
    expect(tile).toHaveTextContent(`${stats.players[0].name} & ${stats.players[1].name}`);
  });

  it('renders daring as a whole percent with no decimals', () => {
    const game = buildGame({ playerCount: 3 });
    const stats = deriveGameStats(game);
    render(<AwardsRow stats={stats} />);
    const daringTile = screen.getByText('Most Daring').closest('div').parentElement;
    expect(daringTile.textContent).toMatch(/\d+%/);
    expect(daringTile.textContent).not.toMatch(/\d+\.\d+%/);
  });

  it('renders nothing at all for a game with no scored rounds', () => {
    const stats = deriveGameStats(buildGame({ playerCount: 3, unscoredFrom: 1 }));
    const { container } = render(<AwardsRow stats={stats} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('Scoresheet', () => {
  it('is collapsed by default and opens on click', () => {
    const game = buildGame({ playerCount: 3 });
    const stats = deriveGameStats(game);
    render(<Scoresheet game={game} stats={stats} />);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Full Scoresheet/ }));
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('shows one column per scored round plus a totals column', () => {
    const game = buildGame({ playerCount: 3, unscoredFrom: 6 });
    const stats = deriveGameStats(game);
    render(<Scoresheet game={game} stats={stats} defaultOpen />);
    // Rounds 1–5 are scored; 6–10 are not and must not get columns.
    expect(screen.getByText('R5')).toBeInTheDocument();
    expect(screen.queryByText('R6')).not.toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
  });

  it('shows each player total from Σ round_score', () => {
    const game = buildGame({ playerCount: 3 });
    const stats = deriveGameStats(game);
    render(<Scoresheet game={game} stats={stats} defaultOpen />);
    stats.players.forEach((p) => {
      expect(screen.getAllByText(String(p.total)).length).toBeGreaterThan(0);
    });
  });

  it('offers an edit button per round and reports which round was clicked', () => {
    const game = buildGame({ playerCount: 3 });
    const stats = deriveGameStats(game);
    const onEditRound = vi.fn();
    render(<Scoresheet game={game} stats={stats} onEditRound={onEditRound} defaultOpen />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit round 3' }));
    expect(onEditRound).toHaveBeenCalledTimes(1);
    expect(onEditRound.mock.calls[0][0].round_number).toBe(3);
  });

  it('omits the edit affordance when no handler is given', () => {
    const game = buildGame({ playerCount: 3 });
    const stats = deriveGameStats(game);
    render(<Scoresheet game={game} stats={stats} defaultOpen />);
    expect(screen.queryByRole('button', { name: /Edit round/ })).not.toBeInTheDocument();
  });
});

describe('charts', () => {
  it('paints every scatter dot the same hue, since scatter is an all-pairs form', () => {
    const stats = deriveGameStats(buildGame({ playerCount: 6 }));
    const { container } = render(<DaringScatter stats={stats} />);
    const fills = [...container.querySelectorAll('circle')]
      .map((c) => c.getAttribute('fill'))
      .filter((f) => f && f !== 'transparent');
    expect(fills.length).toBeGreaterThan(0);
    expect(new Set(fills)).toEqual(new Set(['#2a78d6']));
  });

  it('labels every scatter dot with its player name, so no legend is needed', () => {
    const stats = deriveGameStats(buildGame({ playerCount: 6 }));
    const { container } = render(<DaringScatter stats={stats} />);
    const text = container.textContent;
    stats.players.forEach((p) => expect(text).toContain(p.name));
  });

  it('gives the score graph one line per player in seat order', () => {
    const game = buildGame({ playerCount: 6 });
    const stats = deriveGameStats(game);
    const { container } = render(<ScoreGraph game={game} variant="hero" stats={stats} />);
    const curves = container.querySelectorAll('.recharts-line-curve');
    expect(curves.length).toBe(6);
  });

  it('draws no dashed gridlines anywhere', () => {
    const game = buildGame({ playerCount: 4 });
    const stats = deriveGameStats(game);
    [
      <ScoreGraph key="a" game={game} variant="hero" stats={stats} />,
      <DaringScatter key="b" stats={stats} />,
      <BidBiasChart key="c" stats={stats} />,
      <CompositionChart key="d" stats={stats} />,
    ].forEach((node) => {
      const { container, unmount } = render(node);
      container.querySelectorAll('.recharts-cartesian-grid line').forEach((line) => {
        expect(line.getAttribute('stroke-dasharray')).toBeFalsy();
      });
      unmount();
    });
  });

  it('renders the composition bar sorted by total, descending', () => {
    const game = buildGame({ playerCount: 4 });
    const stats = deriveGameStats(game);
    const { container } = render(<CompositionChart stats={stats} />);
    // In Recharts v3 the tick TEXT is portaled into its own layer, so it is not a
    // descendant of .recharts-yAxis — read it from the label layer instead.
    const ticks = [...container.querySelectorAll('.recharts-yAxis-tick-labels .recharts-cartesian-axis-tick-value')]
      .map((n) => n.textContent);
    const expected = [...stats.players].sort((a, b) => b.total - a.total).map((p) => p.name);
    expect(ticks).toEqual(expected);
  });

  // Regression: Recharts anchors a NEGATIVE bar's x at the zero baseline and returns
  // a negative width. Reading x as "the left edge" rounded the corner on the baseline
  // side (overshooting zero by the 4px radius) and put the value label inside the bar.
  describe('diverging bar geometry for negative values', () => {
    const negativeStats = {
      roundsPlayed: 10,
      players: [
        { name: 'Under', bidBias: -0.6, roundsPlayed: 10 },
        { name: 'Level', bidBias: 0, roundsPlayed: 10 },
        { name: 'Over', bidBias: 0.6, roundsPlayed: 10 },
      ],
    };

    const geometry = () => {
      const { container } = render(<BidBiasChart stats={negativeStats} />);
      const svg = [...container.querySelectorAll('svg')].pop();
      const zeroX = Number(svg.querySelector('.recharts-reference-line-line').getAttribute('x1'));
      const paths = [...svg.querySelectorAll('.recharts-bar-rectangle path')].map((p) => {
        // Pull only the X coordinates out of the path: M x,y · H x · Q cx,cy x,y ·
        // V y (no x) · Z. Mixing in the Y values would make these assertions lie.
        const tokens = p.getAttribute('d').trim().split(/\s+/);
        const xs = [];
        for (let i = 0; i < tokens.length; i += 1) {
          const cmd = tokens[i];
          if (cmd === 'M') xs.push(Number(tokens[i + 1].split(',')[0]));
          else if (cmd === 'H') xs.push(Number(tokens[i + 1]));
          else if (cmd === 'Q') {
            xs.push(Number(tokens[i + 1].split(',')[0]));
            xs.push(Number(tokens[i + 2].split(',')[0]));
          }
        }
        return { fill: p.getAttribute('fill'), min: Math.min(...xs), max: Math.max(...xs) };
      });
      const labels = [...svg.querySelectorAll('.recharts-label-list text')].map((n) => ({
        text: n.textContent,
        x: Number(n.getAttribute('x')),
        anchor: n.getAttribute('text-anchor'),
      }));
      return { zeroX, paths, labels };
    };

    it('never lets a negative bar cross the zero baseline', () => {
      const { zeroX, paths } = geometry();
      const negative = paths.find((p) => p.fill === '#2a78d6');
      expect(negative).toBeDefined();
      expect(negative.max).toBeLessThanOrEqual(zeroX + 0.01);
      expect(negative.min).toBeLessThan(zeroX);
    });

    it('never lets a positive bar cross the zero baseline', () => {
      const { zeroX, paths } = geometry();
      const positive = paths.find((p) => p.fill === '#e34948');
      expect(positive.min).toBeGreaterThanOrEqual(zeroX - 0.01);
      expect(positive.max).toBeGreaterThan(zeroX);
    });

    it('places the negative value label outside the bar, at its data end', () => {
      const { paths, labels } = geometry();
      const negative = paths.find((p) => p.fill === '#2a78d6');
      const label = labels.find((l) => l.text === '−0.6');
      expect(label).toBeDefined();
      expect(label.anchor).toBe('end');
      // Left of the bar's own left edge — never sitting on top of the fill.
      expect(label.x).toBeLessThanOrEqual(negative.min);
    });

    it('places the positive value label outside the bar, at its data end', () => {
      const { paths, labels } = geometry();
      const positive = paths.find((p) => p.fill === '#e34948');
      const label = labels.find((l) => l.text === '+0.6');
      expect(label.anchor).toBe('start');
      expect(label.x).toBeGreaterThanOrEqual(positive.max);
    });

    it('still labels a player whose average is exactly zero, with no bar drawn', () => {
      const { labels, paths } = geometry();
      expect(labels.map((l) => l.text)).toContain('0.0');
      expect(paths).toHaveLength(2); // Under and Over only
    });
  });

  it('draws no gridlines in the charts whose only lines carry meaning', () => {
    const game = buildGame({ playerCount: 4 });
    const stats = deriveGameStats(game);
    // Scatter: the quadrant dividers must be the only lines. Bid bias: the x-axis is
    // hidden, so a gridline would mark an unlabelled position.
    [<DaringScatter key="a" stats={stats} />, <BidBiasChart key="b" stats={stats} />].forEach((node) => {
      const { container, unmount } = render(node);
      expect(container.querySelectorAll('.recharts-cartesian-grid line')).toHaveLength(0);
      unmount();
    });
  });

  it('gives the scatter whole-number y ticks with no crowded end tick', () => {
    const stats = deriveGameStats(buildGame({ playerCount: 6 }));
    const { container } = render(<DaringScatter stats={stats} />);
    const ticks = [...container.querySelectorAll('.recharts-yAxis-tick-labels .recharts-cartesian-axis-tick-value')]
      .map((n) => Number(n.textContent));
    expect(ticks.length).toBeGreaterThan(1);
    ticks.forEach((v) => expect(Number.isInteger(v)).toBe(true));
    // Evenly spaced: no final tick jammed against its neighbour.
    const gaps = ticks.slice(1).map((v, i) => v - ticks[i]);
    expect(new Set(gaps).size).toBe(1);
  });

  it('keeps the bid-bias chart in seat order rather than ranking a noisy mean', () => {
    const game = buildGame({ playerCount: 4 });
    const stats = deriveGameStats(game);
    const { container } = render(<BidBiasChart stats={stats} />);
    // In Recharts v3 the tick TEXT is portaled into its own layer, so it is not a
    // descendant of .recharts-yAxis — read it from the label layer instead.
    const ticks = [...container.querySelectorAll('.recharts-yAxis-tick-labels .recharts-cartesian-axis-tick-value')]
      .map((n) => n.textContent);
    expect(ticks).toEqual(stats.players.map((p) => p.name));
  });
});
