import React from 'react';
import { useGameStore } from '../store';
import { translations } from '../i18n';
import { X, Scroll, Crown, Trophy, Info } from 'lucide-react';

const RulesModal = ({ onClose }) => {
  const { language } = useGameStore();
  const t = (key) => translations[language][key] || key;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-navy/80 backdrop-blur-sm">
      <div className="bg-brand-parchment border border-brand-slate/20 w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col">
        <div className="sticky top-0 bg-brand-navy p-6 border-b border-brand-teal/20 flex justify-between items-center z-10">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3 font-serif">
            <Scroll size={24} className="text-brand-teal" /> {t('rules')}
          </h2>
          <button onClick={onClose} className="text-white/60 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X size={24} />
          </button>
        </div>
        <div className="p-8 grid md:grid-cols-2 gap-8 text-brand-charcoal">
          <section>
            <h3 className="text-brand-oxblood font-bold text-xl mb-4 flex items-center gap-2 border-b border-brand-charcoal/10 pb-2 font-serif"><Crown size={18} /> {t('hierarchy')}</h3>
            <div className="bg-brand-navy/5 p-4 rounded-xl border border-brand-charcoal/5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-1">
                  <div className="w-4 h-4 rounded-full bg-suit-green border border-white"></div>
                  <div className="w-4 h-4 rounded-full bg-suit-yellow border border-white"></div>
                  <div className="w-4 h-4 rounded-full bg-suit-purple border border-white"></div>
                </div>
                <span className="flex-1"><strong>{t('suits')}:</strong> {t('suits_desc')}</span>
              </div>
              <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-full bg-suit-black border border-white"></div><span className="flex-1"><strong>{t('trump')}:</strong> {t('trump_desc')}</span></div>
              <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-full bg-cyan-500 border border-white"></div><span className="flex-1"><strong>{t('mermaid')}:</strong> {t('mermaid_desc')}</span></div>
              <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-full bg-orange-500 border border-white"></div><span className="flex-1"><strong>{t('tigress')}:</strong> {t('tigress_desc')}</span></div>
              <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-full bg-brand-oxblood border border-white"></div><span className="flex-1"><strong>{t('pirate')}:</strong> {t('pirate_desc')}</span></div>
              <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-full bg-suit-yellow border border-white"></div><span className="flex-1"><strong>{t('skull_king')}:</strong> {t('skull_king_desc')}</span></div>
              <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-full bg-white border border-brand-charcoal/20"></div><span className="flex-1"><strong>{t('escape')}:</strong> {t('escape_desc')}</span></div>
            </div>
          </section>

          <section>
            <h3 className="text-brand-oxblood font-bold text-xl mb-4 flex items-center gap-2 border-b border-brand-charcoal/10 pb-2 font-serif"><Trophy size={18} /> {t('scoring')}</h3>
            <div className="bg-brand-navy/5 p-4 rounded-xl border border-brand-charcoal/5 space-y-4">
              <div>
                <strong className="text-brand-charcoal text-lg block mb-1">{t('standard_bid')} ({'>'} 0)</strong>
                <p className="text-sm">{t('exact')}: <span className="text-suit-green font-mono font-bold">+20</span> / trick</p>
                <p className="text-sm">{t('miss')}: <span className="text-brand-oxblood font-mono font-bold">-10</span> / diff</p>
              </div>
              <div className="border-t border-brand-charcoal/10 pt-3">
                <strong className="text-brand-charcoal text-lg block mb-1">{t('zero_bid')}</strong>
                <p className="text-sm">{t('exact')}: <span className="text-suit-green font-mono font-bold">+10</span> × Round No.</p>
                <p className="text-sm">{t('miss')}: <span className="text-brand-oxblood font-mono font-bold">-10</span> × Round No.</p>
              </div>
              <div className="border-t border-brand-charcoal/10 pt-3">
                <strong className="text-brand-charcoal text-lg block mb-1 font-serif">{t('bonuses')}</strong>
                <div className="grid grid-cols-2 gap-2 text-xs text-brand-slate">
                  <span>{t('bonus_colored_14')}</span>
                  <span>{t('bonus_black_14')}</span>
                  <span>{t('bonus_pirate_mermaid')}</span>
                  <span>{t('bonus_king_pirate')}</span>
                  <span>{t('bonus_mermaid_king')}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="md:col-span-2">
            <h3 className="text-brand-oxblood font-bold text-xl mb-4 flex items-center gap-2 border-b border-brand-charcoal/10 pb-2 font-serif"><Info size={18} /> {t('gameplay_rules')}</h3>
            <div className="bg-brand-navy/5 p-6 rounded-xl border border-brand-charcoal/5 space-y-4 text-sm leading-relaxed">
              <p>
                <strong>{t('the_goal')}:</strong> {t('goal_desc')}
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p><strong>{t('bidding')}:</strong> {t('bidding_desc')}</p>
                  <p><strong>{t('playing_tricks')}:</strong> {t('playing_tricks_desc')}</p>
                </div>
                <div className="space-y-2">
                  <p><strong>{t('special_cards')}:</strong> {t('special_cards_desc')}</p>
                  <p><strong>{t('the_kraken')}:</strong> {t('the_kraken_desc')}</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default RulesModal;
