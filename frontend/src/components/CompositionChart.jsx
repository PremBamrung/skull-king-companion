import React from 'react';
import { useGameStore } from '../store';
import { translations } from '../i18n';
import { Card } from './UI';
import { Coins } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { CHROME, COMPOSITION, barChartHeight } from '../lib/vizTheme';

// HOW each player got where they got: steady bidding, bonus hunting, or surviving
// penalties. A diverging stacked bar centred on zero.
//
// The positive arm is TWO STEPS OF ONE HUE, so bid points and bonus points read as
// parts of one quantity rather than two unrelated things. The negative arm is the
// red pole. Colour sets validated — see vizTheme.js.

const BAR_THICKNESS = 20; // ≤ 24px
const SEGMENT_GAP = 2; // surface-coloured gap, never a border around a mark

/**
 * Builds a rect path with an optional 4px round on one end.
 * `round`: 'left' | 'right' | 'none' — the DATA end. The baseline end stays square.
 *
 * `width` may arrive NEGATIVE: for a negative value Recharts anchors x at the zero
 * baseline and grows leftwards. Normalise before drawing, or the rounded corner ends
 * up on the baseline side and overshoots it.
 */
const segmentPath = (x, y, rawWidth, height, round) => {
  const left = Math.min(x, x + rawWidth);
  const right = Math.max(x, x + rawWidth);
  const r = Math.min(4, right - left, height / 2);

  if (round === 'right') {
    return `M ${left},${y} H ${right - r} Q ${right},${y} ${right},${y + r} V ${y + height - r} Q ${right},${y + height} ${right - r},${y + height} H ${left} Z`;
  }
  if (round === 'left') {
    return `M ${right},${y} H ${left + r} Q ${left},${y} ${left},${y + r} V ${y + height - r} Q ${left},${y + height} ${left + r},${y + height} H ${right} Z`;
  }
  return `M ${left},${y} H ${right} V ${y + height} H ${left} Z`;
};

/** Bid points: sits against zero. Gives up 2px on its right when bonus follows. */
const BidPointsSegment = (props) => {
  const { x, y, width, height, payload } = props;
  if (!width || Math.abs(width) < 0.5) return null;
  const hasBonus = (payload?.bonusBanked ?? 0) > 0;
  // bidPoints is never negative, so the gap always comes off the right (outer) end.
  const w = hasBonus ? width - SEGMENT_GAP : width;
  if (w < 0.5) return null;
  return <path d={segmentPath(x, y, w, height, hasBonus ? 'none' : 'right')} fill={COMPOSITION.bidPoints} />;
};

/** Bonus banked: the outer end of the positive arm. */
const BonusSegment = (props) => {
  const { x, y, width, height } = props;
  if (!width || Math.abs(width) < 0.5) return null;
  return <path d={segmentPath(x, y, width, height, 'right')} fill={COMPOSITION.bonus} />;
};

/** Penalties: the whole negative arm, so its outer end is on the left. */
const PenaltiesSegment = (props) => {
  const { x, y, width, height } = props;
  if (!width || Math.abs(width) < 0.5) return null;
  return <path d={segmentPath(x, y, width, height, 'left')} fill={COMPOSITION.penalties} />;
};

export default function CompositionChart({ stats }) {
  const { language } = useGameStore();
  const t = (key) => translations[language][key] || key;

  const players = (stats?.players ?? []).filter((p) => p.roundsPlayed > 0);
  if (players.length === 0) return null;

  // Sorted by total, descending — the leaderboard's reading order.
  const data = [...players]
    .sort((a, b) => b.total - a.total)
    .map((p) => ({
      name: p.name,
      bidPoints: p.bidPoints,
      bonusBanked: p.bonusBanked,
      penalties: p.penalties,
      total: p.total,
    }));

  const legend = [
    { key: 'bid_points', color: COMPOSITION.bidPoints },
    { key: 'bonus_banked', color: COMPOSITION.bonus },
    { key: 'penalties', color: COMPOSITION.penalties },
  ];

  return (
    // Same formula as BidBiasChart so the two cards in this row stay level.
    <Card
      className="p-4 w-full flex flex-col gap-3"
      style={{ height: barChartHeight(players.length) }}
    >
      <h3 className="text-brand-navy font-bold flex items-center gap-2 font-serif text-sm shrink-0">
        <Coins size={16} className="text-brand-teal" /> {t('where_points_came_from')}
      </h3>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 16, left: 4, bottom: 20 }}
            barSize={BAR_THICKNESS}
            stackOffset="sign"
          >
            <CartesianGrid stroke={CHROME.grid} strokeWidth={1} horizontal={false} />
            <XAxis
              type="number"
              fontSize={10}
              tick={{ fill: CHROME.inkMuted, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              fontSize={11}
              tick={{ fill: CHROME.inkSecondary, fontWeight: 700 }}
              axisLine={false}
              tickLine={false}
              width={72}
              // As in BidBiasChart: force every player's name to render.
              interval={0}
            />
            <Tooltip
              cursor={{ fill: 'rgba(11,11,11,0.03)' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                const row = (labelKey, value, color) => (
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5" style={{ color: CHROME.inkSecondary }}>
                      <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }} />
                      {t(labelKey)}
                    </span>
                    <span className="font-bold tabular-nums" style={{ color: CHROME.inkPrimary }}>
                      {value > 0 ? '+' : value < 0 ? '−' : ''}{Math.abs(value)}
                    </span>
                  </div>
                );
                return (
                  <div
                    className="rounded-lg px-3 py-2 text-xs shadow-lg space-y-1 min-w-[170px]"
                    style={{ backgroundColor: CHROME.surface, border: `1px solid ${CHROME.grid}` }}
                  >
                    <div className="font-bold" style={{ color: CHROME.inkPrimary }}>{d.name}</div>
                    {row('legend_bid_points', d.bidPoints, COMPOSITION.bidPoints)}
                    {row('legend_bonus_banked', d.bonusBanked, COMPOSITION.bonus)}
                    {row('legend_penalties', d.penalties, COMPOSITION.penalties)}
                    <div
                      className="flex items-center justify-between gap-4 pt-1 mt-1"
                      style={{ borderTop: `1px solid ${CHROME.grid}` }}
                    >
                      <span style={{ color: CHROME.inkSecondary }}>{t('total')}</span>
                      <span className="font-bold tabular-nums" style={{ color: CHROME.inkPrimary }}>{d.total}</span>
                    </div>
                  </div>
                );
              }}
            />
            <ReferenceLine x={0} stroke={CHROME.axis} strokeWidth={1} />
            <Bar dataKey="penalties" stackId="score" shape={<PenaltiesSegment />} isAnimationActive={false} />
            <Bar dataKey="bidPoints" stackId="score" shape={<BidPointsSegment />} isAnimationActive={false} />
            <Bar dataKey="bonusBanked" stackId="score" shape={<BonusSegment />} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] shrink-0" style={{ color: CHROME.inkMuted }}>
        {legend.map((l) => (
          <span key={l.key} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: l.color }} />
            {t(`legend_${l.key}`)}
          </span>
        ))}
      </div>
    </Card>
  );
}
