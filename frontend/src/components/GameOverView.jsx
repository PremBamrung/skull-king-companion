import React, { useMemo } from 'react';
import { useGameStore } from '../store';
import { translations } from '../i18n';
import { Button, Card } from './UI';
import { Trophy, AlertTriangle } from 'lucide-react';
import ScoreGraph from './ScoreGraph';
import AwardsRow from './AwardsRow';
import DaringScatter from './DaringScatter';
import BidBiasChart from './BidBiasChart';
import CompositionChart from './CompositionChart';
import Scoresheet from './Scoresheet';
import { deriveGameStats } from '../lib/gameStats';
import { CHROME, STATUS } from '../lib/vizTheme';

/**
 * The story of the game, in the order a reader wants it: who won, the awards that
 * name what happened, the two charts that show how it happened, then the sheet
 * with every number in it.
 */
export default function GameOverView({ game, onExit, onStartEditRound, isRefreshing = false }) {
  const { language } = useGameStore();
  const t = (key) => translations[language][key] || key;

  const stats = useMemo(() => deriveGameStats(game), [game]);

  const winnerNames = stats.winners.map((w) => w.name);
  const isDraw = winnerNames.length > 1;
  const staleSnapshots = stats.warnings.some((w) => w.code === 'STALE_SNAPSHOT');

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500 pt-10 pb-24">
      {/* --- Hero. Exactly one hero figure in this view: the winning score. ----- */}
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        <div className="relative shrink-0 mx-auto md:mx-0">
          <div className="absolute inset-0 bg-brand-teal blur-3xl opacity-20 rounded-full" />
          <Trophy size={72} className="text-suit-yellow relative z-10 drop-shadow-2xl" />
        </div>

        <div className="flex-1 text-center md:text-left">
          <h2
            className="font-serif font-bold uppercase tracking-wide text-sm mb-1"
            style={{ color: CHROME.inkMuted }}
          >
            {isDraw ? t('captains_of_seas') : t('captain_of_seas')}
          </h2>
          <div className="text-2xl font-bold text-brand-navy font-serif mb-1">
            {winnerNames.join(` ${t('and_conjunction')} `)}
          </div>
          {/* ≥48px, system sans, proportional figures — never the serif display
              face, and never tabular-nums on a standalone number. */}
          <div className="font-sans text-6xl font-semibold leading-none" style={{ color: CHROME.inkPrimary }}>
            {stats.winner?.total ?? 0}
          </div>
          <div className="text-sm mt-1.5" style={{ color: CHROME.inkSecondary }}>
            {isDraw
              ? t('hero_tied_at_the_top')
              : `${t('hero_points_winning_by')} ${stats.margin}`}
          </div>
        </div>

        <div className="shrink-0">
          <Button onClick={onExit} variant="secondary" className="w-full md:w-auto">
            {t('return_to_port')}
          </Button>
        </div>
      </div>

      {/* --- Invariant warning ---------------------------------------------------
          Σ round_score is the source of truth. When the stored running totals
          disagree with it, say so out loud rather than quietly rendering numbers
          that contradict another screen. Icon + label, never colour alone. */}
      {staleSnapshots && (
        <Card
          className="p-3 flex items-start gap-2.5 text-xs"
          style={{ borderColor: STATUS.warning }}
        >
          <AlertTriangle size={16} className="shrink-0 mt-0.5" style={{ color: STATUS.warning }} aria-hidden="true" />
          <div>
            <div className="font-bold" style={{ color: CHROME.inkPrimary }}>{t('warning_totals_recalculated')}</div>
            <div style={{ color: CHROME.inkSecondary }}>{t('warning_totals_recalculated_detail')}</div>
          </div>
        </Card>
      )}

      {/* Hold the previous render at reduced opacity while a round is being saved:
          no skeleton flash, no layout jump. */}
      <div
        className="space-y-6 transition-opacity duration-200"
        style={{ opacity: isRefreshing ? 0.55 : 1 }}
        aria-busy={isRefreshing}
      >
        <AwardsRow stats={stats} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ScoreGraph game={game} variant="hero" stats={stats} />
          </div>
          <div className="lg:col-span-1">
            <DaringScatter stats={stats} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BidBiasChart stats={stats} />
          <CompositionChart stats={stats} />
        </div>

        <Scoresheet game={game} stats={stats} onEditRound={onStartEditRound} />
      </div>
    </div>
  );
}
