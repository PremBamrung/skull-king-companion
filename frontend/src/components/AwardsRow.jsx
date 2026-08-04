import React from 'react';
import { useGameStore } from '../store';
import { translations } from '../i18n';
import { Card } from './UI';
import { Flame, Target, Skull, Coins, TrendingUp, TrendingDown, Ghost, Crown } from 'lucide-react';
import { awardWinners } from '../lib/gameStats';
import { CHROME, STATUS } from '../lib/vizTheme';

// Stat tiles, not charts. Each award is one number, and a number is not a chart —
// so this is the form the data's job actually asks for.
//
// Rules this file holds to:
//  - COUNTS, never percentages ("7 of 10", not "70%"). `daring` is the single
//    exception, and it renders as one integer percent with no decimals.
//  - No series color anywhere. Ink tokens, plus a status color only where the
//    value is genuinely good or bad — and status always ships with an icon and a
//    label, so color never carries the meaning alone.
//  - A tile is SUPPRESSED when nobody earned it or when everyone tied. An award
//    nobody won is noise, and the row has to stay compact.
//  - The award NAME keeps the pirate flavour; the line underneath is literal.

const joinNames = (winners, t) => {
  const names = winners.map((w) => w.name);
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} ${t('and_conjunction')} ${names[names.length - 1]}`;
};

const signed = (n) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n)}`;

function Tile({ icon: Icon, name, names, value, explanation, tone }) {
  const toneColor = tone === 'good' ? STATUS.good : tone === 'bad' ? STATUS.critical : CHROME.inkPrimary;

  return (
    <Card className="p-3 flex flex-col gap-1 shadow-md">
      <div
        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide"
        style={{ color: CHROME.inkMuted }}
      >
        <Icon size={12} aria-hidden="true" />
        <span className="truncate">{name}</span>
      </div>

      <div className="text-sm font-bold text-brand-navy font-serif leading-tight truncate" title={names}>
        {names}
      </div>

      {/* Proportional figures — no tabular-nums on a standalone number, and no
          serif face on the figure even though the app uses Playfair elsewhere. */}
      <div className="font-sans text-2xl font-semibold leading-none" style={{ color: toneColor }}>
        {value}
      </div>

      <div className="text-[11px] leading-snug" style={{ color: CHROME.inkMuted }}>
        {explanation}
      </div>
    </Card>
  );
}

export default function AwardsRow({ stats }) {
  const { language } = useGameStore();
  const t = (key) => translations[language][key] || key;

  const players = stats?.players ?? [];
  if (players.length === 0 || stats.roundsPlayed === 0) return null;

  const rounds = stats.roundsPlayed;
  const of = (n) => `${n} ${t('of')} ${rounds}`;

  // Each entry: pick the winners, then decide whether the award is worth a tile.
  const candidates = [
    {
      key: 'most_daring',
      icon: Flame,
      award: awardWinners(players, (p) => p.daring),
      // The one percentage in the whole dashboard, and one integer of it.
      value: (v) => `${Math.round(v * 100)}%`,
      explanation: t('award_daring_explain'),
    },
    {
      key: 'most_reliable',
      icon: Target,
      award: awardWinners(players, (p) => p.bidsMade),
      value: (v) => of(v),
      explanation: t('award_reliable_explain'),
      tone: 'good',
    },
    {
      key: 'treasure_lost',
      icon: Skull,
      award: awardWinners(players, (p) => p.bonusForfeited),
      // Stored as a positive sum; shown as the loss it is.
      value: (v) => signed(-v),
      explanation: t('award_treasure_lost_explain'),
      tone: 'bad',
    },
    {
      key: 'treasure_hunter',
      icon: Coins,
      award: awardWinners(players, (p) => p.bonusBanked),
      value: (v) => signed(v),
      explanation: t('award_treasure_hunter_explain'),
      tone: 'good',
    },
    {
      key: 'biggest_haul',
      icon: TrendingUp,
      award: awardWinners(players, (p) => p.bestRound?.score ?? 0),
      // A "biggest haul" that isn't a gain is not a haul.
      keepIf: (v) => v > 0,
      value: (v) => signed(v),
      explanation: (award) => `${t('award_points_in_round')} ${award.winners[0].bestRound.roundNumber}`,
      tone: 'good',
    },
    {
      key: 'deepest_hole',
      icon: TrendingDown,
      award: awardWinners(players, (p) => p.worstRound?.score ?? 0, { direction: 'min', allowZero: true }),
      // If nobody ever went negative there is no hole to be deepest in.
      keepIf: (v) => v < 0,
      value: (v) => signed(v),
      explanation: (award) => `${t('award_points_in_round')} ${award.winners[0].worstRound.roundNumber}`,
      tone: 'bad',
    },
    {
      key: 'ghost',
      icon: Ghost,
      award: awardWinners(players, (p) => p.zeroBidsMade),
      value: (v) => `${v}`,
      explanation: t('award_ghost_explain'),
    },
    {
      key: 'held_the_lead',
      icon: Crown,
      award: awardWinners(players, (p) => p.leadRounds),
      value: (v) => of(v),
      explanation: t('award_lead_explain'),
    },
  ];

  const tiles = candidates.filter(
    (c) => c.award && (!c.keepIf || c.keepIf(c.award.value))
  );

  if (tiles.length === 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {tiles.map((c) => (
        <Tile
          key={c.key}
          icon={c.icon}
          name={t(`award_${c.key}`)}
          names={joinNames(c.award.winners, t)}
          value={c.value(c.award.value)}
          explanation={typeof c.explanation === 'function' ? c.explanation(c.award) : c.explanation}
          tone={c.tone}
        />
      ))}
    </div>
  );
}
