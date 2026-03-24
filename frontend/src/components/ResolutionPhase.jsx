import React from 'react';
import { useGameStore } from '../store';
import { translations } from '../i18n';
import { Card, Button, Badge, cn } from './UI';
import { Minus, Plus, ChevronRight } from 'lucide-react';

export default function ResolutionPhase({ game, bids, tricks, bonuses, kraken, setTricks, setBonuses, setKraken, dealerIndex, editingRoundNum, currentRound, onBack, onSubmit }) {
  const { language } = useGameStore();
  const t = (key) => translations[language][key] || key;

  const targetRoundNum = editingRoundNum || currentRound.round_number;
  const maxAllowedTricks = kraken ? targetRoundNum - 1 : targetRoundNum;
  const totalTricksEntered = Object.values(tricks).reduce((a, b) => a + b, 0);
  const isSubmitDisabled = totalTricksEntered !== maxAllowedTricks;

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <div className={`grid grid-cols-1 gap-6 mb-24 lg:mb-0 ${game.players.length >= 5 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
        {game.players.map((player, idx) => {
          const playerTricks = tricks[player.id] ?? 0;
          const bid = bids[player.id] ?? 0;
          const bonus = bonuses[player.id] ?? 0;
          const canAddTrick = totalTricksEntered < maxAllowedTricks;
          const isDealer = idx === dealerIndex;
          const lastRoundSnapshot = game.rounds
            .filter(r => r.player_stats?.length > 0 && r.round_number < targetRoundNum)
            .sort((a, b) => b.round_number - a.round_number)[0]
            ?.player_stats?.find(s => s.player_id === player.id)?.total_score_snapshot ?? 0;

          return (
            <Card key={player.id} className={`p-6 space-y-4 transition-all ${isDealer ? 'ring-2 ring-brand-teal/20 bg-brand-teal/5' : playerTricks === bid ? 'ring-2 ring-suit-green/40 bg-suit-green/5' : 'hover:border-brand-teal/30'}`}>
              <div className="flex justify-between items-center border-b border-brand-charcoal/5 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-2xl text-brand-navy font-serif">{player.name}</span>
                  {isDealer && <Badge className="bg-brand-teal text-white text-xs">{t('dealer')}</Badge>}
                  {targetRoundNum > 1 && (
                    <span className={`text-xs font-mono font-bold ${lastRoundSnapshot >= 0 ? 'text-brand-slate' : 'text-brand-oxblood'}`}>
                      ({lastRoundSnapshot > 0 ? '+' : ''}{lastRoundSnapshot}pts)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-brand-slate uppercase font-bold tracking-wider">{t('bid')}</span>
                  <span className={`text-xl font-mono font-bold px-4 py-1 rounded-lg bg-brand-navy border border-brand-teal/20 ${bid === 0 ? 'text-brand-teal' : 'text-white'}`}>
                    {bid}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="flex flex-col justify-center flex-1 min-w-[140px]">
                  <label className="text-xs text-brand-slate uppercase font-bold mb-2 tracking-wider">{t('tricks_won')}</label>
                  <div className="flex items-center gap-3 bg-brand-navy/5 p-2 rounded-xl border border-brand-charcoal/5">
                    <button
                      onClick={() => setTricks({ ...tricks, [player.id]: Math.max(0, playerTricks - 1) })}
                      className="w-12 h-12 rounded-lg bg-brand-navy hover:bg-brand-charcoal flex items-center justify-center text-white transition-all shadow-md"
                    >
                      <Minus size={20} />
                    </button>
                    <span className={`flex-1 text-center font-bold text-4xl font-mono ${playerTricks === bid ? 'text-suit-green' : 'text-brand-navy'}`}>
                      {playerTricks}
                    </span>
                    <button
                      onClick={() => setTricks({ ...tricks, [player.id]: Math.min(targetRoundNum, playerTricks + 1) })}
                      disabled={!canAddTrick}
                      className="w-12 h-12 rounded-lg bg-brand-navy hover:bg-brand-charcoal flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-md"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col justify-center w-[160px] shrink-0">
                  <label className="text-xs text-brand-slate uppercase font-bold mb-2 tracking-wider">{t('bonus_pts')}</label>
                  <div className="flex items-center gap-2 bg-brand-navy/5 p-2 rounded-xl border border-brand-charcoal/5 h-[66px]">
                    <button
                      onClick={() => setBonuses({ ...bonuses, [player.id]: Math.max(0, bonus - 10) })}
                      className="w-10 h-12 rounded-lg bg-brand-navy hover:bg-brand-charcoal flex items-center justify-center text-white transition-colors active:scale-95 shadow-sm"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="flex-1 text-center font-bold text-xl font-mono text-brand-teal">
                      {bonus}
                    </span>
                    <button
                      onClick={() => setBonuses({ ...bonuses, [player.id]: bonus + 10 })}
                      className="w-10 h-12 rounded-lg bg-brand-navy hover:bg-brand-charcoal flex items-center justify-center text-white transition-colors active:scale-95 shadow-sm"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-brand-slate/10 lg:relative lg:bg-transparent lg:border-0 lg:p-0 lg:mt-8 z-20 flex flex-col items-end gap-4">
        <div className="flex items-center gap-3 text-brand-charcoal bg-brand-navy/5 p-2 rounded-lg border border-brand-charcoal/10">
          <input
            type="checkbox"
            id="kraken"
            checked={kraken}
            onChange={e => setKraken(e.target.checked)}
            className="w-5 h-5 rounded border-brand-slate text-brand-teal focus:ring-brand-teal bg-white"
          />
          <label htmlFor="kraken" className="text-sm font-bold">{t('kraken_played')}</label>
        </div>

        <div className="flex w-full lg:w-auto gap-4">
          <Button onClick={onBack} variant="secondary" className="flex-1 lg:flex-none">
            {t('back_to_bids')}
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isSubmitDisabled}
            className="flex-[2] lg:flex-none lg:w-auto lg:px-12 text-xl shadow-xl"
          >
            {editingRoundNum ? t('update_round') : `${t('finish_round')} ${currentRound.round_number}`} <ChevronRight size={24} />
          </Button>
        </div>
      </div>
    </div>
  );
}
