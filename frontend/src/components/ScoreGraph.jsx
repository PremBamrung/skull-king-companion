import React from 'react';
import { useGameStore } from '../store';
import { translations } from '../i18n';
import { Card, cn } from './UI';
import { LineChart } from 'lucide-react';
import {
  LineChart as ReChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const ScoreGraph = ({ game, variant = 'sidebar' }) => {
  const { language } = useGameStore();
  const t = (key) => translations[language][key] || key;

  const data = game.rounds
    .filter(r => r.player_stats && r.player_stats.length > 0)
    .map(r => {
      const entry = { name: `R${r.round_number}` };
      r.player_stats.forEach(s => {
        const playerName = game.players.find(p => p.id === s.player_id)?.name || t('unknown');
        entry[playerName] = s.total_score_snapshot;
      });
      return entry;
    });

  if (data.length === 0) return null;

  const colors = ['#0D9488', '#991B1B', '#EAB308', '#7C3AED', '#2563EB', '#D97706'];
  const isHero = variant === 'hero';

  return (
    <Card className={cn("p-4 w-full flex flex-col gap-4 overflow-hidden", isHero ? "h-[500px]" : "h-80")}>
      <h3 className="text-brand-navy font-bold flex items-center gap-2 font-serif text-sm shrink-0">
        <LineChart size={16} className="text-brand-teal" /> {t('point_progression')}
      </h3>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ReChart data={data} margin={{ top: 10, right: 15, left: -25, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis
              dataKey="name"
              fontSize={10}
              tick={{ fill: '#4b5563', fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              interval={0}
              dy={10}
            />
            <YAxis
              fontSize={10}
              tick={{ fill: '#4b5563', fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#fdfcf0', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ fontWeight: 'bold', fontSize: '12px' }}
            />
            {game.players.map((p, i) => (
              <Line
                key={p.id}
                type="monotone"
                dataKey={p.name}
                stroke={colors[i % colors.length]}
                strokeWidth={isHero ? 4 : 3}
                dot={{ r: isHero ? 4 : 3, fill: colors[i % colors.length], strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
                animationDuration={1000}
              />
            ))}
          </ReChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 px-4 py-3 border-t border-brand-charcoal/5 shrink-0 bg-brand-navy/5 -mx-4 -mb-4">
        {game.players.map((p, i) => (
          <div key={p.id} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: colors[i % colors.length] }} />
            <span className="text-xs font-bold text-brand-navy truncate max-w-[100px]">
              {p.name}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default ScoreGraph;
