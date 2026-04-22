import React, { useState, useEffect } from 'react';
import { useGameStore } from './store';
import { translations } from './i18n';
import { Button } from './components/UI';
import { Skull, Globe, Home, HelpCircle } from 'lucide-react';
import RulesModal from './components/RulesModal';
import Lobby from './components/Lobby';
import Setup from './components/Setup';
import GameLoop from './components/GameLoop';

export default function App() {
  const { game, setGame, clearGame, language, setLanguage } = useGameStore();
  const t = (key) => translations[language][key] || key;
  const [view, setView] = useState('LOBBY'); // LOBBY, SETUP, PLAY
  const [showRules, setShowRules] = useState(false);

  // Sync state with browser history
  useEffect(() => {
    window.history.replaceState({ view: 'LOBBY' }, '');

    const handlePopState = (event) => {
      if (event.state && event.state.view) {
        setView(event.state.view);
      } else {
        setView('LOBBY');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (newView) => {
    if (newView === view) return;
    window.history.pushState({ view: newView }, '');
    setView(newView);
  };

  const handleNewVoyage = () => navigateTo('SETUP');

  const handleSelectGame = (g) => {
    setGame(g);
    navigateTo('PLAY');
  };

  return (
    <div className="min-h-screen bg-brand-parchment text-brand-charcoal pb-12 font-sans">
      {showRules && <RulesModal onClose={() => setShowRules(false)} />}

      <header className="sticky top-0 z-30 bg-brand-navy text-white shadow-xl">
        <div className="max-w-[1600px] 2xl:max-w-[2000px] mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigateTo('LOBBY')}>
            <div className="w-12 h-12 bg-brand-oxblood rounded-xl flex items-center justify-center shadow-lg border border-white/10 transform hover:scale-105 transition-transform">
              <Skull className="text-white" size={28} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="font-bold text-2xl tracking-tight text-white font-serif">SKULL KING</h1>
              <p className="text-brand-teal text-xs font-sans tracking-widest uppercase font-bold">{t('companion')}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => setLanguage(language === 'en' ? 'fr' : 'en')}
              className="text-white hover:text-brand-teal flex items-center gap-2 px-3"
            >
              <Globe size={20} />
              <span className="font-bold text-sm uppercase">{language}</span>
            </Button>
            {view === 'PLAY' && (
              <Button
                variant="ghost"
                onClick={() => {
                  if (window.confirm(t('return_home_confirm'))) {
                    navigateTo('LOBBY');
                  }
                }}
                className="text-white hover:text-brand-teal"
              >
                <Home size={24} />
              </Button>
            )}
            <Button variant="ghost" onClick={() => setShowRules(true)} className="text-white hover:text-brand-teal">
              <HelpCircle size={24} />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] 2xl:max-w-[2000px] mx-auto p-4 md:p-6 relative z-10">
        {view === 'LOBBY' && <Lobby onNewVoyage={handleNewVoyage} onSelectGame={handleSelectGame} />}
        {view === 'SETUP' && <Setup onBack={() => navigateTo('LOBBY')} onStart={(g) => { setGame(g); navigateTo('PLAY'); }} />}
        {view === 'PLAY' && <GameLoop game={game} onExit={() => { clearGame(); navigateTo('LOBBY'); }} setGame={setGame} />}
      </div>
    </div>
  );
}
