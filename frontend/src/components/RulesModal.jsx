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
              {/* Weakest to strongest: numbered cards */}
              <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-full bg-white border border-brand-charcoal/20"></div><span className="flex-1"><strong>{t('escape')}:</strong> {t('escape_desc')}</span></div>
              <div className="flex items-center gap-3">
                <div className="flex -space-x-1">
                  <div className="w-4 h-4 rounded-full bg-suit-green border border-white"></div>
                  <div className="w-4 h-4 rounded-full bg-suit-yellow border border-white"></div>
                  <div className="w-4 h-4 rounded-full bg-suit-purple border border-white"></div>
                </div>
                <span className="flex-1"><strong>{t('suits')}:</strong> {t('suits_desc')}</span>
              </div>
              <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-full bg-suit-black border border-white"></div><span className="flex-1"><strong>{t('trump')}:</strong> {t('trump_desc')}</span></div>

              {/* Special card triangle — SVG diagram */}
              <div className="rounded-xl bg-white/50 border border-brand-charcoal/10 p-2 mt-1">
                <svg viewBox="0 0 300 240" className="w-full">
                  <defs>
                    <filter id="node-shadow" x="-30%" y="-30%" width="160%" height="160%">
                      <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#00000018"/>
                    </filter>
                    <marker id="arr-amber" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto">
                      <polygon points="0 0, 8 3.5, 0 7" fill="#d97706" />
                    </marker>
                    <marker id="arr-red" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto">
                      <polygon points="0 0, 8 3.5, 0 7" fill="#dc2626" />
                    </marker>
                    <marker id="arr-cyan" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto">
                      <polygon points="0 0, 8 3.5, 0 7" fill="#0891b2" />
                    </marker>
                  </defs>

                  {/* Arrows — drawn before nodes so nodes appear on top */}
                  {/* Skull King beats Pirate */}
                  <line x1="140" y1="50" x2="74" y2="175" stroke="#d97706" strokeWidth="2" strokeOpacity="0.65" markerEnd="url(#arr-amber)"/>
                  {/* Pirate beats Mermaid */}
                  <line x1="120" y1="194" x2="180" y2="194" stroke="#dc2626" strokeWidth="2" strokeOpacity="0.65" markerEnd="url(#arr-red)"/>
                  {/* Mermaid beats Skull King */}
                  <line x1="226" y1="175" x2="160" y2="50" stroke="#0891b2" strokeWidth="2" strokeOpacity="0.65" markerEnd="url(#arr-cyan)"/>

                  {/* "beats" label pills */}
                  <rect x="60" y="100" width="36" height="16" rx="8" fill="white" fillOpacity="0.92"/>
                  <text x="78" y="112" textAnchor="middle" fontSize="9.5" fill="#64748b" fontWeight="500">{t('beats')}</text>

                  <rect x="133" y="182" width="34" height="16" rx="8" fill="white" fillOpacity="0.92"/>
                  <text x="150" y="194" textAnchor="middle" fontSize="9.5" fill="#64748b" fontWeight="500">{t('beats')}</text>

                  <rect x="204" y="100" width="36" height="16" rx="8" fill="white" fillOpacity="0.92"/>
                  <text x="222" y="112" textAnchor="middle" fontSize="9.5" fill="#64748b" fontWeight="500">{t('beats')}</text>

                  {/* Skull King node */}
                  <rect x="90" y="12" width="120" height="38" rx="19" fill="#fef3c7" stroke="#d97706" strokeWidth="2" filter="url(#node-shadow)"/>
                  <circle cx="113" cy="31" r="8" fill="#fbbf24" stroke="white" strokeWidth="2"/>
                  <text x="165" y="36" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1c1917">{t('skull_king')}</text>

                  {/* Pirate node */}
                  <rect x="8" y="175" width="112" height="38" rx="19" fill="#fee2e2" stroke="#dc2626" strokeWidth="2" filter="url(#node-shadow)"/>
                  <circle cx="31" cy="194" r="8" fill="#dc2626" stroke="white" strokeWidth="2"/>
                  <text x="79" y="199" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1c1917">{t('pirate')}</text>

                  {/* Mermaid node */}
                  <rect x="180" y="175" width="112" height="38" rx="19" fill="#cffafe" stroke="#0891b2" strokeWidth="2" filter="url(#node-shadow)"/>
                  <circle cx="203" cy="194" r="8" fill="#06b6d4" stroke="white" strokeWidth="2"/>
                  <text x="251" y="199" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1c1917">{t('mermaid')}</text>
                </svg>
                <p className="text-xs text-brand-slate/60 text-center italic pb-1">{t('special_trio_note')}</p>
              </div>

              {/* Detailed descriptions for special trio */}
              <div className="text-xs text-brand-slate space-y-1.5 pt-1">
                <p><strong className="text-brand-charcoal">{t('skull_king')}:</strong> {t('skull_king_desc')}</p>
                <p><strong className="text-brand-charcoal">{t('pirate')}:</strong> {t('pirate_desc')}</p>
                <p><strong className="text-brand-charcoal">{t('mermaid')}:</strong> {t('mermaid_desc')}</p>
              </div>

              <div className="flex items-center gap-3 pt-1 border-t border-brand-charcoal/10"><div className="w-4 h-4 rounded-full bg-orange-500 border border-white"></div><span className="flex-1"><strong>{t('tigress')}:</strong> {t('tigress_desc')}</span></div>
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
                <strong className="text-brand-charcoal text-lg block mb-2 font-serif">{t('bonuses')}</strong>
                <div className="space-y-1 text-xs text-brand-slate">
                  <div className="flex justify-between items-center py-1 border-b border-brand-charcoal/5">
                    <span>{t('bonus_pirate_mermaid')}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-brand-charcoal/5">
                    <span>{t('bonus_king_pirate')}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-brand-charcoal/5">
                    <span>{t('bonus_mermaid_king')}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-brand-charcoal/5">
                    <span>{t('bonus_colored_14')}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span>{t('bonus_black_14')}</span>
                  </div>
                </div>
                <p className="text-xs text-brand-slate/70 italic mt-2">{t('zero_bid_bonus_desc')}</p>
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
                  <p><strong>{t('leading_special')}:</strong> {t('leading_special_desc')}</p>
                  <p><strong>{t('the_kraken')}:</strong> {t('the_kraken_desc')}</p>
                  <p><strong>{t('white_whale')}:</strong> {t('white_whale_desc')}</p>
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
