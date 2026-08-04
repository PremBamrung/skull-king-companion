import React, { useState } from 'react';
import { useGameStore } from '../store';
import { translations } from '../i18n';
import { Card, cn } from './UI';
import { Table, ChevronRight, Edit } from 'lucide-react';
import { scoredRounds } from '../lib/gameStats';
import { CHROME, colorForSeat } from '../lib/vizTheme';

// The table view every chart needs, and the relief the palette's sub-3:1 contrast
// WARN obligates. It is also the thing a non-technical person actually scans:
// players down the side, rounds across, one cell per round showing what they took
// against what they bid, and the points it earned.
//
// `tabular-nums` belongs HERE — these columns have to line up vertically. It is
// deliberately absent from the stat tiles, where a large standalone number wants
// proportional figures.

export default function Scoresheet({ game, stats, onEditRound, defaultOpen = false }) {
  const { language } = useGameStore();
  const t = (key) => translations[language][key] || key;
  const [open, setOpen] = useState(defaultOpen);

  const rounds = scoredRounds(game);
  if (rounds.length === 0) return null;

  // Seat order, so the colored dot beside each name matches every chart.
  const players = [...(game.players ?? [])].sort((a, b) => a.seat_index - b.seat_index);
  const totalFor = (playerId) => stats?.byPlayerId.get(playerId)?.total ?? 0;

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center gap-2 p-4 text-left hover:bg-brand-navy/5 transition-colors"
      >
        <ChevronRight
          size={16}
          className={cn('text-brand-slate transition-transform duration-200', open && 'rotate-90')}
        />
        <Table size={16} className="text-brand-teal" />
        <h3 className="text-brand-navy font-bold font-serif text-sm">{t('full_scoresheet')}</h3>
        <span className="ml-auto text-[11px]" style={{ color: CHROME.inkMuted }}>
          {rounds.length} {rounds.length === 1 ? t('round_lower') : t('rounds_lower')}
        </span>
      </button>

      {open && (
        // Its own horizontal scroll container: on a phone the sheet scrolls
        // sideways instead of making the whole page scroll sideways.
        <div className="overflow-x-auto border-t border-brand-charcoal/5">
          <table className="w-full text-xs tabular-nums border-collapse">
            <thead>
              <tr className="bg-brand-navy/5">
                <th
                  className="sticky left-0 z-10 bg-brand-parchment text-left font-bold px-3 py-2 whitespace-nowrap"
                  style={{ color: CHROME.inkSecondary }}
                  scope="col"
                >
                  {t('player')}
                </th>
                {rounds.map((r) => (
                  <th key={r.id} className="px-2 py-2 font-bold whitespace-nowrap" scope="col">
                    <div className="flex items-center justify-center gap-1">
                      <span style={{ color: CHROME.inkSecondary }}>R{r.round_number}</span>
                      {onEditRound && (
                        <button
                          type="button"
                          onClick={() => onEditRound(r)}
                          title={`${t('edit_round')} ${r.round_number}`}
                          aria-label={`${t('edit_round')} ${r.round_number}`}
                          className="p-1 rounded text-brand-slate hover:text-brand-teal hover:bg-brand-navy/10 transition-colors"
                        >
                          <Edit size={11} />
                        </button>
                      )}
                    </div>
                    <div className="font-normal text-[10px]" style={{ color: CHROME.inkMuted }}>
                      {r.card_count} {r.card_count === 1 ? t('card_lower') : t('cards_lower')}
                    </div>
                  </th>
                ))}
                <th
                  className="px-3 py-2 text-right font-bold whitespace-nowrap"
                  style={{ color: CHROME.inkSecondary }}
                  scope="col"
                >
                  {t('total')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-charcoal/5">
              {players.map((p) => (
                <tr key={p.id} className="hover:bg-brand-navy/5 transition-colors">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 bg-white text-left px-3 py-2 whitespace-nowrap font-bold text-brand-navy font-serif"
                  >
                    <span className="flex items-center gap-2">
                      {/* The dot carries identity; the name stays in ink. */}
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: colorForSeat(p.seat_index) }}
                      />
                      <span className="truncate max-w-[110px]">{p.name}</span>
                    </span>
                  </th>

                  {rounds.map((r) => {
                    const s = r.player_stats.find((x) => x.player_id === p.id);
                    if (!s) {
                      return (
                        <td key={r.id} className="px-2 py-2 text-center" style={{ color: CHROME.inkMuted }}>
                          –
                        </td>
                      );
                    }
                    const made = s.bid === s.tricks_won;
                    return (
                      <td key={r.id} className="px-2 py-2 text-center whitespace-nowrap">
                        <div style={{ color: CHROME.inkSecondary }}>
                          {s.tricks_won}/{s.bid}
                        </div>
                        <div
                          className={cn('font-bold', made ? 'text-suit-green' : 'text-brand-oxblood')}
                        >
                          {s.round_score > 0 ? '+' : ''}{s.round_score}
                        </div>
                        {s.bonus_points > 0 && (
                          <div className="text-[10px]" style={{ color: CHROME.inkMuted }}>
                            {made ? '+' : '×'}{s.bonus_points}
                          </div>
                        )}
                      </td>
                    );
                  })}

                  {/* Colour by sign: a negative total in teal reads as a good number. */}
                  <td
                    className={cn(
                      'px-3 py-2 text-right font-bold text-base whitespace-nowrap',
                      totalFor(p.id) < 0 ? 'text-brand-oxblood' : 'text-brand-teal'
                    )}
                  >
                    {totalFor(p.id)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="px-3 py-2 text-[11px] flex flex-wrap gap-x-4 gap-y-1" style={{ color: CHROME.inkMuted }}>
            <span>{t('scoresheet_key_cell')}</span>
            <span>{t('scoresheet_key_bonus')}</span>
          </div>
        </div>
      )}
    </Card>
  );
}
