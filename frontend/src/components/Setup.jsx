import React, { useState } from 'react';
import { useGameStore } from '../store';
import { translations } from '../i18n';
import { api } from '../api';
import { Card, Button, Input } from './UI';
import { Users, ChevronRight, Anchor, X } from 'lucide-react';

export default function Setup({ onBack, onStart }) {
  const { language } = useGameStore();
  const t = (key) => translations[language][key] || key;
  const [players, setPlayers] = useState(['']);
  const [newName, setNewName] = useState('');

  const addPlayer = () => {
    if (newName.trim()) {
      setPlayers([...players.filter(p => p), newName.trim()]);
      setNewName('');
    }
  };

  const removePlayer = (name) => {
    setPlayers(players.filter(p => p !== name));
  };

  const start = async () => {
    const validPlayers = players.filter(p => p.trim());
    if (validPlayers.length < 2) return alert(t('need_at_least_2'));
    const g = await api.createGame(validPlayers.map(p => ({ name: p })));
    onStart(g);
  };

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pt-12">
      <div className="grid lg:grid-cols-5 gap-12 items-start">
        <div className="lg:col-span-2 text-center lg:text-left sticky lg:top-32">
          <Card className="p-8">
            <div className="flex justify-start mb-4 lg:hidden">
              <Button variant="ghost" onClick={onBack} className="text-brand-slate hover:text-brand-navy -ml-4">
                <ChevronRight className="rotate-180" /> {t('back')}
              </Button>
            </div>
            <div className="hidden lg:flex justify-start mb-4">
              <Button variant="ghost" onClick={onBack} className="text-brand-slate hover:text-brand-navy -ml-4">
                <ChevronRight className="rotate-180" /> {t('back_to_lobby')}
              </Button>
            </div>
            <div className="bg-brand-navy w-20 h-20 rounded-2xl flex items-center justify-center mx-auto lg:mx-0 mb-6 shadow-xl border border-white/10">
              <Users size={40} className="text-brand-teal" />
            </div>
            <h2 className="text-4xl font-bold text-brand-navy mb-2 font-serif">{t('assemble_crew')}</h2>
            <p className="text-brand-slate font-sans mb-8">{t('enter_pirate_names')}</p>

            <div className="flex gap-3 mb-6">
              <Input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
                placeholder={t('enter_name_placeholder')}
                autoFocus
              />
              <Button onClick={addPlayer} className="w-14 h-14 shrink-0 rounded-xl text-3xl font-light">
                +
              </Button>
            </div>

            <Button
              onClick={start}
              disabled={players.filter((p) => p).length < 2}
              className="w-full text-xl py-5 shadow-xl"
            >
              {t('set_sail')} <Anchor size={24} className="ml-2" />
            </Button>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <div className="grid sm:grid-cols-2 lg:grid-cols-1 gap-3">
            {players
              .filter((p) => p)
              .map((name, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 bg-white rounded-xl border border-brand-slate/10 group hover:border-brand-teal/50 transition-colors shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-brand-navy flex items-center justify-center text-brand-teal font-bold text-xl shadow-inner">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-bold text-2xl text-brand-charcoal font-serif">{name}</span>
                  </div>
                  <button
                    onClick={() => removePlayer(name)}
                    className="text-brand-slate/40 hover:text-brand-oxblood p-2 rounded-lg transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              ))}
          </div>

          {players.filter((p) => p).length === 0 && (
            <div className="text-center py-20 border-2 border-dashed border-brand-slate/20 rounded-2xl">
              <p className="text-brand-slate font-bold uppercase tracking-widest">{t('no_pirates_yet')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
