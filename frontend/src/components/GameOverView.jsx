import React from 'react';
import { useGameStore } from '../store';
import { translations } from '../i18n';
import { Button } from './UI';
import { Trophy, RotateCcw } from 'lucide-react';
import ScoreGraph from './ScoreGraph';
import Leaderboard from './Leaderboard';
import HistoryCard from './HistoryCard';

export default function GameOverView({ game, onExit, onStartEditRound }) {
  const { language } = useGameStore();
  const t = (key) => translations[language][key] || key;

  const leader = [...game.players].sort((a, b) => {
    const scoreA = game.rounds.reduce((acc, r) => acc + (r.player_stats?.find(s => s.player_id === a.id)?.round_score || 0), 0);
    const scoreB = game.rounds.reduce((acc, r) => acc + (r.player_stats?.find(s => s.player_id === b.id)?.round_score || 0), 0);
    return scoreB - scoreA;
  })[0];

  return (
    <div className="max-w-[1600px] 2xl:max-w-[2000px] mx-auto space-y-8 animate-in zoom-in duration-500 pt-12 pb-24">
      <div className="grid lg:grid-cols-4 gap-8 items-start">
        <div className="lg:col-span-1 space-y-8 text-center sticky lg:top-32">
          <div className="relative inline-block group">
            <div className="absolute inset-0 bg-brand-teal blur-3xl opacity-20 rounded-full group-hover:opacity-40 transition-opacity"></div>
            <Trophy size={120} className="text-suit-yellow relative z-10 mx-auto drop-shadow-2xl" />
          </div>

          <div>
            <h2 className="text-4xl font-bold text-brand-navy mb-4 tracking-tight font-serif uppercase text-sm">
              {t('captain_of_seas')}
            </h2>
            <div className="text-3xl font-bold bg-brand-navy text-white px-8 py-4 rounded-2xl border border-brand-teal/20 shadow-xl mb-6">
              {leader?.name}
            </div>
            <Button onClick={onExit} variant="secondary" className="w-full py-4 text-lg">
              {t('return_to_port')}
            </Button>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <ScoreGraph game={game} variant="hero" />
            </div>
            <div className="lg:col-span-1">
              <Leaderboard game={game} compact onEditRound={onStartEditRound} />
            </div>
          </div>

          <div className="pt-8 border-t border-brand-charcoal/10">
            <h3 className="text-2xl font-bold text-brand-navy mb-6 flex items-center gap-3 font-serif">
              <RotateCcw size={28} className="text-brand-teal" /> {t('voyage_history')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {game.rounds
                .filter(r => r.player_stats?.length > 0)
                .sort((a, b) => a.round_number - b.round_number)
                .map(r => (
                  <HistoryCard
                    key={r.id}
                    round={r}
                    players={game.players}
                    onEdit={() => onStartEditRound(r)}
                  />
                ))
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
