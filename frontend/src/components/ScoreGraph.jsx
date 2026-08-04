import React from 'react';
import { useGameStore } from '../store';
import { translations } from '../i18n';
import { Card, cn } from './UI';
import { LineChart } from 'lucide-react';
import {
  LineChart as ReChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceDot, Label, LabelList
} from 'recharts';
import { CHROME, playersInSeatOrder, HERO_CHART_HEIGHT } from '../lib/vizTheme';

const ScoreGraph = ({ game, variant = 'sidebar', stats = null }) => {
  const { language } = useGameStore();
  const t = (key) => translations[language][key] || key;

  // Seat order, so a player's color never changes when the standings reshuffle.
  const players = playersInSeatOrder(game.players);

  const scoredRounds = [...game.rounds]
    .filter(r => r.player_stats && r.player_stats.length > 0)
    .sort((a, b) => a.round_number - b.round_number);

  // Cumulative from Σ round_score, not total_score_snapshot: the snapshots can go
  // stale after an undo (see gameStats' snapshot invariant), the sum cannot.
  const running = new Map(players.map(p => [p.id, 0]));
  const data = scoredRounds.map(r => {
    const entry = { name: `R${r.round_number}`, roundNumber: r.round_number };
    r.player_stats.forEach(s => {
      if (!running.has(s.player_id)) return;
      running.set(s.player_id, running.get(s.player_id) + (s.round_score || 0));
    });
    players.forEach(p => { entry[p.name] = running.get(p.id); });
    return entry;
  });

  if (data.length === 0) return null;

  const isHero = variant === 'hero';
  const lastEntry = data[data.length - 1];

  // --- Endpoint direct labels (hero only) --------------------------------------
  // These are the relief the palette's sub-3:1 contrast WARN obligates, alongside
  // the scoresheet. Labelled selectively: when two lines finish close together,
  // nudging their labels apart would detach them from their lines, so the closer
  // one is dropped and the legend + tooltip + scoresheet carry it instead.
  const allValues = data.flatMap(d => players.map(p => d[p.name])).filter(v => typeof v === 'number');
  const yRange = Math.max(...allValues) - Math.min(...allValues) || 1;
  const minGap = yRange * 0.06;

  const endpointLabelled = new Set();
  if (isHero) {
    const finals = players
      .map(p => ({ id: p.id, value: lastEntry[p.name] }))
      .filter(f => typeof f.value === 'number')
      .sort((a, b) => b.value - a.value);
    finals.forEach((f, i) => {
      const above = finals[i - 1];
      const below = finals[i + 1];
      const clearOfAbove = !above || Math.abs(above.value - f.value) >= minGap;
      const clearOfBelow = !below || Math.abs(f.value - below.value) >= minGap;
      if (clearOfAbove && clearOfBelow) endpointLabelled.add(f.id);
    });
  }

  // --- Annotations (hero only, and only when stats are supplied) ---------------
  const annotations = [];
  if (isHero && stats) {
    // Lead changes get a small unlabelled ring each — labelling every one would
    // crowd the plot. The header note names the marker; the count is in the story.
    stats.leadChangeRounds.forEach(lc => {
      const entry = data.find(d => d.roundNumber === lc.roundNumber);
      const player = players.find(p => p.id === lc.playerId);
      if (!entry || !player) return;
      annotations.push({
        key: `lead-${lc.roundNumber}-${lc.playerId}`,
        x: entry.name,
        y: entry[player.name],
        color: player.color,
        kind: 'lead',
      });
    });

    const swing = stats.biggestSwing;
    if (swing) {
      const entry = data.find(d => d.roundNumber === swing.roundNumber);
      const player = players.find(p => p.id === swing.playerId);
      if (entry && player) {
        annotations.push({
          key: `swing-${swing.roundNumber}`,
          x: entry.name,
          y: entry[player.name],
          color: player.color,
          kind: 'swing',
          label: `${swing.score > 0 ? '+' : ''}${swing.score}`,
        });
      }
    }
  }

  return (
    // The hero height is shared with DaringScatter, which sits beside it; the
    // in-game sidebar keeps its own compact height.
    <Card
      className={cn('p-4 w-full flex flex-col gap-4 overflow-hidden', !isHero && 'h-80')}
      style={isHero ? { height: HERO_CHART_HEIGHT } : undefined}
    >
      <div className="flex items-baseline justify-between gap-3 shrink-0">
        <h3 className="text-brand-navy font-bold flex items-center gap-2 font-serif text-sm">
          <LineChart size={16} className="text-brand-teal" /> {t('point_progression')}
        </h3>
        {/* The glyph has to be the marker the plot actually draws — a hollow ring.
            A different shape here sends the reader hunting for a mark that isn't there. */}
        {isHero && stats && stats.leadChanges > 0 && (
          <span className="text-[11px]" style={{ color: CHROME.inkMuted }}>
            ○ {stats.leadChanges === 1 ? t('one_lead_change') : `${stats.leadChanges} ${t('lead_changes')}`}
          </span>
        )}
      </div>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ReChart
            data={data}
            margin={{ top: 14, right: isHero ? 78 : 15, left: -25, bottom: 25 }}
          >
            {/* Solid hairline grid — dashed reads as "threshold" or "projection". */}
            <CartesianGrid stroke={CHROME.grid} strokeWidth={1} vertical={false} />
            <XAxis
              dataKey="name"
              fontSize={10}
              tick={{ fill: CHROME.inkMuted, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              interval={0}
              dy={10}
            />
            <YAxis
              fontSize={10}
              tick={{ fill: CHROME.inkMuted, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: CHROME.surface,
                borderRadius: '8px',
                border: `1px solid ${CHROME.grid}`,
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
              labelStyle={{ color: CHROME.inkSecondary, fontWeight: 700, fontSize: '12px' }}
              itemStyle={{ color: CHROME.inkPrimary, fontWeight: 'bold', fontSize: '12px' }}
            />
            {players.map(p => (
              <Line
                key={p.id}
                type="linear"
                dataKey={p.name}
                stroke={p.color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                dot={{ r: 4, fill: p.color, strokeWidth: 2, stroke: CHROME.surface }}
                activeDot={{ r: 6, strokeWidth: 2, stroke: CHROME.surface }}
                animationDuration={1000}
              >
                {endpointLabelled.has(p.id) && (
                  <LabelList
                    position="right"
                    offset={10}
                    fill={CHROME.inkSecondary}
                    fontSize={11}
                    fontWeight={700}
                    // Only the final point gets a name — a label on every point is
                    // chaos. A nullish value renders nothing, so this labels one.
                    valueAccessor={(_entry, index) => (index === data.length - 1 ? p.name : undefined)}
                  />
                )}
              </Line>
            ))}
            {annotations.map(a => (
              <ReferenceDot
                key={a.key}
                x={a.x}
                y={a.y}
                r={a.kind === 'swing' ? 7 : 5}
                fill={a.kind === 'swing' ? a.color : CHROME.surface}
                stroke={a.color}
                strokeWidth={2}
                ifOverflow="extendDomain"
              >
                {a.label && (
                  <Label
                    value={a.label}
                    position="top"
                    offset={10}
                    fill={CHROME.inkSecondary}
                    fontSize={11}
                    fontWeight={700}
                  />
                )}
              </ReferenceDot>
            ))}
          </ReChart>
        </ResponsiveContainer>
      </div>

      {/* A legend is always present for two or more series. Identity is the dot; the
          text stays in ink so a light hue is never load-bearing as type. */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 px-4 py-3 border-t border-brand-charcoal/5 shrink-0 bg-brand-navy/5 -mx-4 -mb-4">
        {players.map(p => (
          <div key={p.id} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: p.color }} />
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
