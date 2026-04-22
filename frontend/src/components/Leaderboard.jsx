import React, { useState } from 'react';
import { useGameStore } from '../store';
import { translations } from '../i18n';
import { Card, Button, cn } from './UI';
import { Trophy, RotateCcw, ChevronRight, Edit, Target } from 'lucide-react';

export default function Leaderboard({ game, compact = false, onEditRound }) {
  const { language } = useGameStore();
  const t = (key) => translations[language][key] || key;
  const [expandedRounds, setExpandedRounds] = useState({});

  const toggleRound = (roundNum) => {
    setExpandedRounds(prev => ({
      ...prev,
      [roundNum]: !prev[roundNum]
    }));
  };

  const isGameCompleted = game.status === 'COMPLETED';

  const lastCompletedRound = game.rounds
    .filter(r => r.player_stats?.length > 0)
    .sort((a, b) => b.round_number - a.round_number)[0];

  const standings = game.players.map(p => {
    const total = game.rounds.reduce((acc, r) => {
      const stat = r.player_stats?.find(s => s.player_id === p.id);
      return acc + (stat?.round_score || 0);
    }, 0);
    const lastDelta = lastCompletedRound?.player_stats?.find(s => s.player_id === p.id)?.round_score ?? null;
    return { ...p, total, lastDelta };
  }).sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-6">
      <Card className="flex-1 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-brand-charcoal/5 bg-brand-navy/5">
          <h3 className="text-brand-oxblood font-bold flex items-center gap-2 font-serif">
            <Trophy size={16} className="text-brand-teal" /> {t('leaderboard')}
          </h3>
        </div>
        <div className="p-2 overflow-y-auto max-h-[500px]">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-brand-charcoal/5">
              {standings.map((p, i) => (
                <tr key={p.id} className="hover:bg-brand-navy/5 transition-colors">
                  <td className="py-3 px-3 w-8 font-mono text-brand-slate font-bold">{i + 1}</td>
                  <td className="py-3 px-3 font-bold text-brand-navy font-serif">{p.name}</td>
                  <td className="py-3 px-3 text-right font-mono">
                    <span className="font-bold text-brand-teal text-lg">{p.total}</span>
                    {p.lastDelta !== null && (
                      <span className={`ml-1.5 text-xs font-bold ${p.lastDelta >= 0 ? 'text-suit-green' : 'text-brand-oxblood'}`}>
                        {p.lastDelta > 0 ? '+' : ''}{p.lastDelta}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {!compact && (
        <Card className="p-4">
          <h3 className="text-brand-navy font-bold mb-4 flex items-center gap-2 font-serif text-sm">
            <RotateCcw size={16} className="text-brand-teal" /> {t('voyage_history')}
          </h3>
          <div className="space-y-3">
            {game.rounds.filter(r => r.player_stats?.length > 0).sort((a, b) => b.round_number - a.round_number).map(r => {
              const isExpanded = expandedRounds[r.round_number] || isGameCompleted;

              return (
                <div key={r.id} className="bg-brand-navy/5 rounded-xl border border-brand-charcoal/5 overflow-hidden transition-all">
                  <div
                    onClick={() => !isGameCompleted && toggleRound(r.round_number)}
                    className={cn(
                      "flex items-center justify-between p-3 cursor-pointer hover:bg-brand-navy/10 transition-colors",
                      isGameCompleted && "cursor-default hover:bg-brand-navy/5"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-brand-navy font-serif">{t('round')} {r.round_number}</span>
                      {!isGameCompleted && (
                        <div className={cn("transition-transform duration-200", isExpanded ? "rotate-90" : "")}>
                          <ChevronRight size={14} className="text-brand-slate" />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      {!isExpanded && (
                        <div className="flex -space-x-1 items-center">
                          {r.player_stats.map(s => {
                            const success = s.bid === s.tricks_won;
                            return (
                              <div
                                key={s.player_id}
                                title={`${game.players.find(p => p.id === s.player_id)?.name}: ${s.round_score} pts`}
                                className={cn(
                                  "w-5 h-5 rounded-full border border-white flex items-center justify-center text-[8px] font-bold text-white",
                                  success ? "bg-suit-green" : "bg-brand-oxblood"
                                )}
                              >
                                {s.round_score > 0 ? "+" : ""}{s.round_score}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onEditRound(r); }} className="text-brand-slate hover:text-brand-teal h-8 w-8 p-0">
                        <Edit size={14} />
                      </Button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-3 pb-3 pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                      <div className="grid grid-cols-1 gap-2">
                        {r.player_stats.map(s => {
                          const player = game.players.find(p => p.id === s.player_id);
                          const success = s.bid === s.tricks_won;
                          return (
                            <div key={s.player_id} className="flex items-center justify-between text-xs bg-white/50 p-2 rounded-lg border border-brand-charcoal/5">
                              <div className="flex items-center gap-2">
                                <div className={cn("w-2 h-2 rounded-full", success ? "bg-suit-green" : "bg-brand-oxblood")} />
                                <span className="font-bold text-brand-navy truncate max-w-[80px]">{player?.name}</span>
                              </div>
                              <div className="flex items-center gap-3 font-mono">
                                <div className="flex items-center gap-1 text-brand-slate">
                                  <span className="font-bold text-brand-navy">{s.tricks_won}</span>
                                  <span>/</span>
                                  <span>{s.bid}</span>
                                  <Target size={10} className="ml-0.5 opacity-50" />
                                </div>
                                {s.bonus_points > 0 && (
                                  <div className="text-suit-yellow font-bold">+{s.bonus_points}</div>
                                )}
                                <div className={cn("font-bold min-w-[30px] text-right", s.round_score >= 0 ? "text-suit-green" : "text-brand-oxblood")}>
                                  {s.round_score > 0 ? "+" : ""}{s.round_score}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
