import React from 'react';
import { useGameStore } from '../store';
import { translations } from '../i18n';
import { Card } from './UI';
import { Compass } from 'lucide-react';
import {
  ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, ReferenceArea, LabelList, Label
} from 'recharts';
import { CHROME, SERIES_ALL_PAIRS, HERO_CHART_HEIGHT } from '../lib/vizTheme';

// Did the bold players actually deliver?
//   x = how much of each round's upside they signed up for
//   y = how many of those bids they actually made
//
// ONE HUE FOR EVERY DOT, on purpose. Scatter is an all-pairs form: any two marks
// can end up side by side, and the validated palette only clears the all-pairs
// colorblind gate for its first three slots. At 6 players no hue ordering is safe,
// so identity comes from a direct text label on each dot instead. That is the
// correct answer here, not a compromise — and it means no legend is needed, since
// every mark says its own name.
const DOT_COLOR = SERIES_ALL_PAIRS[0];

/**
 * The mark: a visible dot plus an invisible 24px hit target.
 *
 * An 8px dot you have to land on dead-centre is a pinpoint hover target. The
 * transparent circle underneath is the thing the pointer actually catches.
 */
const PlayerDot = (props) => {
  const { cx, cy } = props;
  if (cx == null || cy == null) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={12} fill="transparent" />
      {/* 2px ring in the surface color keeps overlapping dots legible. */}
      <circle cx={cx} cy={cy} r={5} fill={DOT_COLOR} stroke={CHROME.surface} strokeWidth={2} />
    </g>
  );
};

export default function DaringScatter({ stats }) {
  const { language } = useGameStore();
  const t = (key) => translations[language][key] || key;

  const players = (stats?.players ?? []).filter((p) => p.roundsPlayed > 0);
  if (players.length === 0) return null;

  const data = players.map((p) => ({
    name: p.name,
    // A single integer percent — the honesty rule's one allowed rate.
    daring: Math.round(p.daring * 100),
    bidsMade: p.bidsMade,
    roundsPlayed: p.roundsPlayed,
  }));

  // Padded domains, so no dot sits on an edge and the label has room to breathe.
  const daringValues = data.map((d) => d.daring);
  const xMin = Math.max(0, Math.min(...daringValues) - 10);
  const xMax = Math.min(100, Math.max(...daringValues) + 10);
  const madeValues = data.map((d) => d.bidsMade);
  const yMin = Math.max(0, Math.min(...madeValues) - 1);
  const yMax = Math.min(stats.roundsPlayed, Math.max(...madeValues) + 1);

  // Dividers at the midpoint of each axis. The quadrants are therefore relative
  // to THIS table — which is the point: the copy talks about this voyage, not
  // about how these people play in general.
  const midX = (xMin + xMax) / 2;
  const midY = (yMin + yMax) / 2;

  // Whole-number ticks at an even step. Recharts' auto ticks land the domain end
  // right next to the previous tick (…6, 8, 9), which reads as a mistake.
  const yStep = Math.max(1, Math.ceil((yMax - yMin) / 4));
  const yTicks = [];
  for (let v = yMin; v <= yMax; v += yStep) yTicks.push(v);

  const quadrants = [
    { key: 'cautious', x1: xMin, x2: midX, y1: midY, y2: yMax, position: 'insideTopLeft' },
    { key: 'captain', x1: midX, x2: xMax, y1: midY, y2: yMax, position: 'insideTopRight' },
    { key: 'adrift', x1: xMin, x2: midX, y1: yMin, y2: midY, position: 'insideBottomLeft' },
    { key: 'reckless', x1: midX, x2: xMax, y1: yMin, y2: midY, position: 'insideBottomRight' },
  ];

  return (
    // Matches ScoreGraph's hero height: these two sit side by side, and cards of
    // different heights in one row read as a mistake.
    <Card className="p-4 w-full flex flex-col gap-4" style={{ height: HERO_CHART_HEIGHT }}>
      <h3 className="text-brand-navy font-bold flex items-center gap-2 font-serif text-sm shrink-0">
        <Compass size={16} className="text-brand-teal" /> {t('daring_vs_delivery')}
      </h3>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 16, right: 40, left: 8, bottom: 34 }}>
            {/* NO gridlines. The quadrant dividers are the only lines in this plot,
                and a grid at the same weight makes them unreadable as dividers —
                the reader can't tell which line names the quadrants. */}
            <XAxis
              type="number"
              dataKey="daring"
              domain={[xMin, xMax]}
              tickFormatter={(v) => `${v}%`}
              fontSize={10}
              tick={{ fill: CHROME.inkMuted, fontWeight: 600 }}
              axisLine={{ stroke: CHROME.axis }}
              tickLine={false}
              interval={0}
            >
              {/* Units spelled out in words, not symbols. */}
              <Label
                value={t('axis_points_at_stake')}
                position="insideBottom"
                offset={-24}
                style={{ fill: CHROME.inkSecondary, fontSize: 11, fontWeight: 600 }}
              />
            </XAxis>
            <YAxis
              type="number"
              dataKey="bidsMade"
              domain={[yMin, yMax]}
              ticks={yTicks}
              allowDecimals={false}
              fontSize={10}
              tick={{ fill: CHROME.inkMuted, fontWeight: 600 }}
              axisLine={{ stroke: CHROME.axis }}
              tickLine={false}
              width={34}
              // Render the ticks we asked for; Recharts' thinning drops most of them.
              interval={0}
            >
              <Label
                value={t('axis_bids_made')}
                angle={-90}
                position="insideLeft"
                style={{ fill: CHROME.inkSecondary, fontSize: 11, fontWeight: 600, textAnchor: 'middle' }}
              />
            </YAxis>

            {quadrants.map((q) => (
              <ReferenceArea
                key={q.key}
                x1={q.x1}
                x2={q.x2}
                y1={q.y1}
                y2={q.y2}
                fill="transparent"
                stroke="none"
              >
                <Label
                  value={t(`quadrant_${q.key}`)}
                  position={q.position}
                  style={{ fill: CHROME.inkMuted, fontSize: 10, fontWeight: 700, letterSpacing: '0.05em' }}
                />
              </ReferenceArea>
            ))}

            {/* Hairline dividers, same weight as the axis — chrome, not data. */}
            <ReferenceLine x={midX} stroke={CHROME.axis} strokeWidth={1} />
            <ReferenceLine y={midY} stroke={CHROME.axis} strokeWidth={1} />

            <Tooltip
              cursor={{ stroke: CHROME.axis, strokeWidth: 1 }}
              contentStyle={{
                backgroundColor: CHROME.surface,
                borderRadius: '8px',
                border: `1px solid ${CHROME.grid}`,
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
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
                      {d.daring}% {t('tooltip_points_at_stake')}
                    </div>
                    <div style={{ color: CHROME.inkSecondary }}>
                      {d.bidsMade} {t('of')} {d.roundsPlayed} {t('tooltip_bids_made')}
                    </div>
                  </div>
                );
              }}
            />

            <Scatter data={data} shape={<PlayerDot />} isAnimationActive={false}>
              {/* Identity rides the mark. Text stays in ink — the dot carries the color. */}
              <LabelList
                dataKey="name"
                position="right"
                offset={10}
                style={{ fill: CHROME.inkSecondary, fontSize: 11, fontWeight: 700 }}
              />
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
