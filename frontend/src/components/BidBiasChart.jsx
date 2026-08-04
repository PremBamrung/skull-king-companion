import React from 'react';
import { useGameStore } from '../store';
import { translations } from '../i18n';
import { Card } from './UI';
import { Scale } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, LabelList
} from 'recharts';
import { CHROME, DIVERGING, barChartHeight } from '../lib/vizTheme';

// The job here is POLARITY — which side of zero — so the form is a diverging bar:
// two hues that read as opposite, and a neutral gray at the midpoint. Never a hue
// at zero.
//
// Players stay in SEAT ORDER. bidBias is a mean over ten rounds, and the honesty
// rules forbid ranking anyone by a noisy derived rate — sorting this chart by it
// would turn a wide-error-bar average into a league table.

const BAR_THICKNESS = 18; // ≤ 24px; the band's leftover is air, not more bar

/**
 * Normalise Recharts' bar rect into {left, right, dataEnd}.
 *
 * For a NEGATIVE value in a vertical-layout bar, Recharts anchors `x` at the zero
 * baseline and hands back a NEGATIVE width — so x is the baseline end, not the left
 * edge. Reading x as "left" rounds the wrong corner and puts the label inside the bar.
 */
const barGeometry = (x, width, value) => {
  const left = Math.min(x, x + width);
  const right = Math.max(x, x + width);
  return { left, right, dataEnd: value >= 0 ? right : left };
};

/** Rounded 4px on the data end, square where it meets the zero baseline. */
const DivergingBar = (props) => {
  const { x, y, width, height, value } = props;
  if (width == null || height == null) return null;

  // A zero-length bar has no end to round and nothing to draw.
  if (Math.abs(width) < 0.5) return null;

  const { left, right } = barGeometry(x, width, value);
  const r = Math.min(4, right - left, height / 2);
  const fill = value >= 0 ? DIVERGING.negative : DIVERGING.positive;

  const path =
    value >= 0
      ? // grows right: round the right end
        `M ${left},${y} H ${right - r} Q ${right},${y} ${right},${y + r} V ${y + height - r} Q ${right},${y + height} ${right - r},${y + height} H ${left} Z`
      : // grows left: round the left end
        `M ${right},${y} H ${left + r} Q ${left},${y} ${left},${y + r} V ${y + height - r} Q ${left},${y + height} ${left + r},${y + height} H ${right} Z`;

  return <path d={path} fill={fill} />;
};

const format = (v) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(1)}`;

export default function BidBiasChart({ stats }) {
  const { language } = useGameStore();
  const t = (key) => translations[language][key] || key;

  const players = (stats?.players ?? []).filter((p) => p.roundsPlayed > 0);
  if (players.length === 0) return null;

  const data = players.map((p) => ({ name: p.name, bidBias: p.bidBias, roundsPlayed: p.roundsPlayed }));

  // Symmetric domain, so equal distances left and right mean equal amounts.
  const extent = Math.max(0.5, ...data.map((d) => Math.abs(d.bidBias))) * 1.35;

  return (
    <Card
      className="p-4 w-full flex flex-col gap-3"
      style={{ height: barChartHeight(players.length) }}
    >
      <h3 className="text-brand-navy font-bold flex items-center gap-2 font-serif text-sm shrink-0">
        <Scale size={16} className="text-brand-teal" /> {t('bid_too_high_or_low')}
      </h3>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 44, left: 4, bottom: 4 }}
            barSize={BAR_THICKNESS}
          >
            {/* No gridlines. The x-axis is hidden (every value is direct-labelled),
                so gridlines would mark unlabelled positions — decoration that reads
                as data. The zero rule is the only vertical line this chart needs. */}
            <XAxis type="number" domain={[-extent, extent]} hide />
            <YAxis
              type="category"
              dataKey="name"
              fontSize={11}
              tick={{ fill: CHROME.inkSecondary, fontWeight: 700 }}
              axisLine={false}
              tickLine={false}
              width={72}
              // Every player must be named. Recharts' default tick thinning drops
              // all but the last category here, which would leave the bars unlabelled.
              interval={0}
            />
            <Tooltip
              cursor={{ fill: 'rgba(11,11,11,0.03)' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div
                    className="rounded-lg px-3 py-2 text-xs shadow-lg"
                    style={{ backgroundColor: CHROME.surface, border: `1px solid ${CHROME.grid}` }}
                  >
                    <div className="font-bold" style={{ color: CHROME.inkPrimary }}>{d.name}</div>
                    <div style={{ color: CHROME.inkSecondary }}>
                      {d.bidBias > 0 ? t('tooltip_overbid_by') : d.bidBias < 0 ? t('tooltip_underbid_by') : t('tooltip_bid_exactly')}
                      {d.bidBias !== 0 && ` ${Math.abs(d.bidBias).toFixed(1)} ${t('tooltip_tricks_per_round')}`}
                    </div>
                  </div>
                );
              }}
            />
            {/* The neutral zero rule. A hairline in chrome gray — #f0efec would be
                invisible on a white card, and the midpoint must never wear a hue. */}
            <ReferenceLine x={0} stroke={CHROME.axis} strokeWidth={1} />
            <Bar dataKey="bidBias" shape={<DivergingBar />} isAnimationActive={false}>
              {/* Value always OUTSIDE the bar end: these bars are 18px thin, so an
                  inside label would be clipped rather than read. */}
              <LabelList
                dataKey="bidBias"
                content={({ x, y, width, height, value }) => {
                  if (value == null) return null;
                  const positive = value >= 0;
                  const { dataEnd } = barGeometry(x, width ?? 0, value);
                  return (
                    <text
                      x={dataEnd + (positive ? 8 : -8)}
                      y={y + height / 2}
                      textAnchor={positive ? 'start' : 'end'}
                      dominantBaseline="central"
                      fill={CHROME.inkSecondary}
                      fontSize={11}
                      fontWeight={700}
                    >
                      {format(value)}
                    </text>
                  );
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Poles named in words. Each swatch is the mark; the text stays in ink. */}
      <div className="flex items-center justify-between gap-2 text-[11px] shrink-0" style={{ color: CHROME.inkMuted }}>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: DIVERGING.positive }} />
          {t('legend_bid_too_low')}
        </span>
        <span className="flex items-center gap-1.5">
          {t('legend_bid_too_high')}
          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: DIVERGING.negative }} />
        </span>
      </div>
    </Card>
  );
}
