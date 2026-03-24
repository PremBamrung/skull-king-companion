import React from 'react';
import { useGameStore } from '../store';
import { translations } from '../i18n';
import { Card, Button, Badge, cn } from './UI';
import { Minus, Plus, Swords } from 'lucide-react';

export default function BiddingPhase({ game, bids, touchedBids, setBids, setTouchedBids, dealerIndex, maxBid, totalBids, activeRoundNum, onConfirm }) {
  const { language } = useGameStore();
  const t = (key) => translations[language][key] || key;

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <div className={`grid grid-cols-2 gap-6 mb-24 lg:mb-0 ${game.players.length >= 7 ? 'lg:grid-cols-4' : game.players.length >= 4 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
        {game.players.map((player, idx) => {
          const currentBid = bids[player.id] ?? 0;
          const isDealer = idx === dealerIndex;
          return (
            <Card key={player.id} className={`p-6 flex flex-col gap-4 relative overflow-hidden group transition-all ${isDealer ? 'ring-2 ring-brand-teal/20 bg-brand-teal/5' : touchedBids.has(player.id) ? 'ring-2 ring-brand-navy/30 bg-brand-navy/5' : 'hover:border-brand-teal/30'}`}>
              <div className="absolute top-0 left-0 right-0 h-1 bg-brand-teal opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="font-bold text-xl text-brand-navy border-b border-brand-charcoal/5 pb-2 flex justify-between items-center font-serif">
                <div className="flex items-center gap-2">
                  {player.name}
                  {isDealer && <Badge className="bg-brand-teal text-white text-xs">{t('dealer')}</Badge>}
                  {touchedBids.has(player.id) && !isDealer && <span className="text-suit-green text-xs">✓</span>}
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 bg-brand-navy/5 p-3 rounded-xl border border-brand-charcoal/5">
                <button
                  onClick={() => {
                    setBids({ ...bids, [player.id]: Math.max(0, currentBid - 1) });
                    setTouchedBids(prev => new Set(prev).add(player.id));
                  }}
                  className="w-12 h-12 rounded-lg bg-brand-navy hover:bg-brand-charcoal flex items-center justify-center text-white active:scale-95 transition-all shadow-md"
                >
                  <Minus size={24} />
                </button>
                <span className={`flex-1 text-center text-4xl font-bold font-mono ${currentBid === 0 ? 'text-brand-teal' : 'text-brand-navy'}`}>
                  {currentBid}
                </span>
                <button
                  onClick={() => {
                    setBids({ ...bids, [player.id]: Math.min(maxBid, currentBid + 1) });
                    setTouchedBids(prev => new Set(prev).add(player.id));
                  }}
                  className="w-12 h-12 rounded-lg bg-brand-navy hover:bg-brand-charcoal flex items-center justify-center text-white active:scale-95 transition-all shadow-md"
                >
                  <Plus size={24} />
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      <div className={`fixed bottom-0 left-0 right-0 p-4 backdrop-blur-md border-t lg:relative lg:bg-transparent lg:border-0 lg:p-0 lg:mt-8 z-20 transition-colors ${totalBids === activeRoundNum ? 'bg-suit-yellow/20 border-suit-yellow/40' : 'bg-white/80 border-brand-slate/10'}`}>
        <div className="max-w-[1600px] 2xl:max-w-[2000px] mx-auto flex items-center gap-4 lg:justify-end">
          <div className="lg:hidden flex items-center gap-2 flex-shrink-0">
            <span className={`text-sm font-bold font-mono px-3 py-1.5 rounded-lg border ${totalBids > activeRoundNum ? 'text-brand-oxblood bg-brand-oxblood/10 border-brand-oxblood/20' : totalBids === activeRoundNum ? 'text-brand-oxblood bg-suit-yellow/20 border-suit-yellow/40' : 'text-brand-teal bg-brand-teal/10 border-brand-teal/20'}`}>
              {totalBids} / {activeRoundNum}
            </span>
            {totalBids === activeRoundNum && <span className="text-[10px] font-bold text-brand-oxblood uppercase tracking-wide">{t('forbidden_total')}</span>}
          </div>
          <Button onClick={onConfirm} className="flex-1 lg:flex-none lg:w-auto lg:px-12 text-xl shadow-xl">
            {t('confirm_bids')} <Swords size={24} />
          </Button>
        </div>
      </div>
    </div>
  );
}
