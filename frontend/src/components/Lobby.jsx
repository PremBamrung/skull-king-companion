import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store';
import { translations } from '../i18n';
import { api } from '../api';
import { Card, Button, cn } from './UI';
import { Anchor, Trophy, Crown, ChevronRight, Trash2 } from 'lucide-react';

const formatDate = (dateString) => {
  if (!dateString) return '';
  const cleanDateString = (dateString.includes('T') && !dateString.endsWith('Z') && !dateString.includes('+'))
    ? dateString + 'Z'
    : dateString;
  const date = new Date(cleanDateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  return `${day}/${month}/${year}, ${time}`;
};

export default function Lobby({ onNewVoyage, onSelectGame }) {
  const { language } = useGameStore();
  const t = (key) => translations[language][key] || key;
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => api.getHistory().then(setHistory);

  const deleteGame = async (id, e) => {
    e.stopPropagation();
    if (window.confirm(t('sink_ship_confirm'))) {
      await api.deleteGame(id);
      loadHistory();
    }
  };

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pt-12">
      <div className="grid lg:grid-cols-5 gap-12 items-start">
        <div className="lg:col-span-2 text-center lg:text-left sticky lg:top-32">
          <Card className="p-8">
            <div className="bg-brand-navy w-20 h-20 rounded-2xl flex items-center justify-center mx-auto lg:mx-0 mb-6 shadow-xl border border-white/10">
              <Anchor size={40} className="text-brand-teal" />
            </div>
            <h2 className="text-4xl font-bold text-brand-navy mb-2 font-serif">{t('welcome_aboard')}</h2>
            <p className="text-brand-slate font-sans mb-8">{t('ready_to_set_sail')}</p>

            <Button onClick={onNewVoyage} className="w-full py-5 text-xl font-bold">
              {t('start_new_voyage')}
            </Button>
          </Card>
        </div>

        <div className="lg:col-span-3">
          {history.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-center gap-4 text-brand-slate">
              <div className="w-16 h-16 rounded-2xl bg-brand-navy/5 flex items-center justify-center">
                <Anchor size={32} className="text-brand-slate/40" />
              </div>
              <div>
                <p className="font-bold text-brand-navy font-serif text-lg">{t('no_voyages_yet')}</p>
                <p className="text-sm mt-1">{t('start_first_voyage')}</p>
              </div>
            </div>
          )}
          {history.length > 0 && (
            <div className="text-left">
              <h3 className="text-brand-navy font-bold text-xl mb-4 flex items-center gap-2 font-serif">
                <Trophy size={20} className="text-brand-teal" /> {t('captains_log')}
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-1 gap-3">
                {history.map((g) => (
                  <div
                    key={g.id}
                    onClick={() => onSelectGame(g)}
                    className={cn("bg-white hover:bg-brand-navy/5 border p-4 rounded-xl cursor-pointer transition-all flex justify-between items-center group shadow-sm hover:shadow-md border-brand-slate/10", g.status === 'ACTIVE' && "border-l-4 border-l-brand-teal")}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4 flex-1 min-w-0">
                      <div className="flex items-start gap-4 flex-shrink-0">
                        <div className="w-10 h-10 rounded-lg bg-brand-navy/5 flex items-center justify-center text-brand-navy group-hover:bg-brand-teal/10 group-hover:text-brand-teal transition-colors flex-shrink-0">
                          <Anchor size={20} />
                        </div>
                        <div className="min-w-[200px]">
                          <div className="flex flex-col">
                            <span className="font-bold text-brand-navy text-sm group-hover:text-brand-teal transition-colors">
                              {formatDate(g.last_accessed)}
                            </span>
                          </div>
                          <p className="text-xs text-brand-slate uppercase tracking-wider font-bold mt-1">
                            {t(g.status.toLowerCase())}
                            {g.status === 'ACTIVE' && (
                              <span className="ml-2 text-brand-teal">
                                • {t('round')} {g.rounds.find(r => !r.player_stats || r.player_stats.length === 0)?.round_number || g.rounds.length}/10
                              </span>
                            )}
                            {g.status === 'COMPLETED' && (
                              <span className="ml-2 text-brand-slate/60">
                                • {(() => {
                                  const start = new Date(g.created_at);
                                  const end = new Date(g.last_accessed);
                                  const diffMs = end - start;
                                  const diffMins = Math.floor(diffMs / 60000);
                                  const hours = Math.floor(diffMins / 60);
                                  const mins = diffMins % 60;
                                  const diffDays = Math.floor(diffMs / 86400000);
                                  const months = Math.floor(diffDays / 30);
                                  const remDays = diffDays % 30;
                                  if (months > 0) return remDays > 0 ? `${months}mo ${remDays}d` : `${months}mo`;
                                  if (diffDays > 0) return `${diffDays}d`;
                                  if (hours > 0) return `${hours}h ${mins}m`;
                                  return diffMins < 1 ? '< 1m' : `${diffMins}m`;
                                })()}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {g.players
                          .map(p => {
                            const latestStat = g.rounds
                              .filter(r => r.player_stats && r.player_stats.length > 0)
                              .sort((a, b) => b.round_number - a.round_number)[0]
                              ?.player_stats.find(s => s.player_id === p.id);
                            return { ...p, score: latestStat?.total_score_snapshot || 0 };
                          })
                          .sort((a, b) => b.score - a.score)
                          .map((p, idx) => {
                            const isWinner = g.status === 'COMPLETED' && idx === 0;
                            return (
                              <div
                                key={p.id}
                                className={cn(
                                  "flex items-center gap-2 px-2 py-1 rounded-md border transition-colors",
                                  isWinner
                                    ? "bg-suit-yellow/20 border-suit-yellow/50 shadow-sm"
                                    : "bg-brand-navy/5 border-brand-charcoal/5"
                                )}
                              >
                                <div className="flex items-center gap-1.5 min-w-0">
                                  {isWinner && <Crown size={12} className="text-suit-yellow flex-shrink-0" />}
                                  <span className="text-xs font-bold text-brand-navy">
                                    {p.name}
                                  </span>
                                </div>
                                <span className={cn(
                                  "text-xs font-mono font-bold ml-1",
                                  isWinner ? "text-brand-navy" : (p.score >= 0 ? "text-suit-green" : "text-brand-oxblood")
                                )}>
                                  {p.score}
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => deleteGame(g.id, e)}
                        className="p-2 text-brand-slate/40 hover:text-brand-oxblood hover:bg-brand-oxblood/5 rounded-lg transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                      <ChevronRight className="text-brand-slate/40 group-hover:text-brand-teal" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
