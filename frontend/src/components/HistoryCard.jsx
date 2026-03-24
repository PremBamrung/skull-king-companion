import React from 'react';
import { useGameStore } from '../store';
import { translations } from '../i18n';
import { Card, Button, cn } from './UI';
import { Edit } from 'lucide-react';

const HistoryCard = ({ round, players, onEdit }) => {
  const { language } = useGameStore();
  const t = (key) => translations[language][key] || key;

  return (
    <Card className="p-4 bg-white/50 border-brand-charcoal/5 hover:border-brand-teal/30 transition-colors">
      <div className="flex justify-between items-center mb-4 border-b border-brand-charcoal/5 pb-2">
        <span className="font-bold text-brand-navy font-serif">{t('round')} {round.round_number}</span>
        <Button variant="ghost" size="sm" onClick={onEdit} className="text-brand-slate hover:text-brand-teal h-8 w-8 p-0">
          <Edit size={14} />
        </Button>
      </div>
      <div className="space-y-2">
        {round.player_stats.map(s => {
          const player = players.find(p => p.id === s.player_id);
          const success = s.bid === s.tricks_won;
          return (
            <div key={s.player_id} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", success ? "bg-suit-green" : "bg-brand-oxblood")} />
                <span className="font-bold text-brand-navy truncate max-w-[100px]">{player?.name}</span>
              </div>
              <div className="flex items-center gap-2 font-mono">
                <div className="text-brand-slate">
                  {s.tricks_won}/{s.bid}
                </div>
                <div className={cn("font-bold min-w-[35px] text-right", s.round_score >= 0 ? "text-suit-green" : "text-brand-oxblood")}>
                  {s.round_score > 0 ? "+" : ""}{s.round_score}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default HistoryCard;
