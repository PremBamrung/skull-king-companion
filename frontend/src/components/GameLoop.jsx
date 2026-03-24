import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useGameStore } from '../store';
import { translations } from '../i18n';
import { api } from '../api';
import { Button, Card } from './UI';
import { Swords, Crown, Edit, RotateCcw, LineChart, Target } from 'lucide-react';
import ScoreGraph from './ScoreGraph';
import Leaderboard from './Leaderboard';
import BiddingPhase from './BiddingPhase';
import ResolutionPhase from './ResolutionPhase';
import GameOverView from './GameOverView';
import useRoundForm from '../hooks/useRoundForm';

export default function GameLoop({ game, onExit, setGame }) {
  const { language } = useGameStore();
  const t = (key) => translations[language][key] || key;
  const [localPhase, setLocalPhase] = useState('BID');
  const [editingRoundNum, setEditingRoundNum] = useState(null);
  const [showGraph, setShowGraph] = useState(false);

  const currentRound = game?.rounds?.find(r => !r.player_stats || r.player_stats.length === 0)
    || game?.rounds?.[game?.rounds?.length - 1];

  const { bids, setBids, touchedBids, setTouchedBids, tricks, setTricks, bonuses, setBonuses, kraken, setKraken, resetWithData } = useRoundForm(currentRound?.id);

  const activeRoundNum = editingRoundNum || currentRound?.round_number;
  const totalBids = Object.values(bids).reduce((a, b) => a + b, 0);
  const totalTricks = Object.values(tricks).reduce((a, b) => a + b, 0);

  useEffect(() => {
    if (game?.status === 'COMPLETED' && !editingRoundNum) {
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    }
  }, [game?.status, editingRoundNum, game?.id]);

  if (!game || !game.rounds || game.rounds.length === 0) {
    return <div className="p-12 text-center text-parchment">{t('loading_voyage')}</div>;
  }

  const submitGameRound = async () => {
    try {
      const stats = game.players.map(p => ({
        player_id: p.id,
        bid: bids[p.id] || 0,
        tricks: tricks[p.id] || 0,
        bonus: bonuses[p.id] || 0
      }));

      let updated;
      if (editingRoundNum) {
        updated = await api.updateRound(game.id, editingRoundNum, stats, kraken);
        setEditingRoundNum(null);
      } else {
        updated = await api.submitRound(game.id, currentRound.round_number, stats, kraken);
      }
      setGame(updated);
    } catch (e) {
      alert(e.response?.data?.detail || 'Error submitting round');
    }
  };

  const startEditRound = (round) => {
    setEditingRoundNum(round.round_number);
    const newBids = {};
    const newTricks = {};
    const newBonuses = {};
    round.player_stats.forEach(s => {
      newBids[s.player_id] = s.bid;
      newTricks[s.player_id] = s.tricks_won;
      newBonuses[s.player_id] = s.bonus_points;
    });
    resetWithData(newBids, newTricks, newBonuses);
    setLocalPhase('RESOLUTION');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const undoLast = async () => {
    if (!window.confirm(t('undo_confirm'))) return;
    const isRoundComplete = currentRound.player_stats && currentRound.player_stats.length > 0;
    const num = isRoundComplete ? currentRound.round_number : currentRound.round_number - 1;
    if (num < 1) return;
    await api.undoRound(game.id, num);
    const updated = await api.getGame(game.id);
    setGame(updated);
  };

  if (game.status === 'COMPLETED' && !editingRoundNum) {
    return <GameOverView game={game} onExit={onExit} onStartEditRound={startEditRound} />;
  }

  const dealerIndex = (activeRoundNum - 1) % game.players.length;

  return (
    <div className="grid lg:grid-cols-4 gap-8 items-start">
      <main className="lg:col-span-3 space-y-6">
        <div className="lg:hidden flex justify-end">
          <Button variant="secondary" size="sm" onClick={() => setShowGraph(!showGraph)}>
            <LineChart size={16} className="mr-2" /> {showGraph ? t('hide_graph') : t('show_graph')}
          </Button>
        </div>

        {showGraph && (
          <div className="lg:hidden animate-in fade-in slide-in-from-top-4">
            <ScoreGraph game={game} />
          </div>
        )}

        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold text-brand-navy flex items-center gap-3 font-serif">
                {editingRoundNum
                  ? <Edit className="text-brand-teal" size={32} />
                  : (localPhase === 'BID' ? <Swords className="text-brand-oxblood" size={32} /> : <Crown className="text-suit-yellow" size={32} />)
                }
                {editingRoundNum
                  ? `${t('editing_round')} ${editingRoundNum}`
                  : (localPhase === 'BID' ? t('bidding_phase') : t('resolution_phase'))
                }
              </h2>
            </div>
            <p className="text-brand-slate text-sm font-sans tracking-widest mt-1 font-bold uppercase">
              {editingRoundNum
                ? t('correcting_logs')
                : `${t('round')} ${currentRound.round_number} • ${currentRound.card_count} ${t('cards')}`
              }
            </p>
          </div>
          <div className="flex gap-2">
            {editingRoundNum ? (
              <Button variant="secondary" onClick={() => { setEditingRoundNum(null); setLocalPhase('BID'); }} className="px-3">{t('cancel_edit')}</Button>
            ) : (
              <Button variant="danger" onClick={undoLast} className="px-3" title="Undo Last Round"><RotateCcw size={16} /></Button>
            )}
          </div>
        </div>

        {localPhase === 'BID' && (
          <BiddingPhase
            game={game}
            bids={bids}
            touchedBids={touchedBids}
            setBids={setBids}
            setTouchedBids={setTouchedBids}
            dealerIndex={dealerIndex}
            maxBid={currentRound.round_number}
            totalBids={totalBids}
            activeRoundNum={activeRoundNum}
            onConfirm={() => setLocalPhase('RESOLUTION')}
          />
        )}

        {localPhase === 'RESOLUTION' && (
          <ResolutionPhase
            game={game}
            bids={bids}
            tricks={tricks}
            bonuses={bonuses}
            kraken={kraken}
            setTricks={setTricks}
            setBonuses={setBonuses}
            setKraken={setKraken}
            dealerIndex={dealerIndex}
            editingRoundNum={editingRoundNum}
            currentRound={currentRound}
            onBack={() => setLocalPhase('BID')}
            onSubmit={submitGameRound}
          />
        )}
      </main>

      <aside className="hidden lg:block lg:sticky lg:top-28 space-y-6">
        <Card className="p-6">
          <h3 className="text-brand-slate text-sm uppercase tracking-wider font-bold mb-4">{t('current_voyage')}</h3>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-5xl font-bold text-brand-navy font-serif">{currentRound.round_number}</span>
            <span className="text-brand-slate text-xl font-bold">/ 10</span>
          </div>

          {localPhase === 'BID' && (
            <div className="bg-brand-navy/5 rounded-lg p-4 border border-brand-charcoal/5 mt-4">
              <div className="flex justify-between text-sm mb-2 text-brand-slate font-medium">
                <span>{t('total_bids')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-2xl font-bold ${totalBids > activeRoundNum ? 'text-brand-oxblood' : totalBids < activeRoundNum ? 'text-brand-teal' : 'text-suit-green'}`}>
                  {totalBids}
                  <span className="text-brand-slate text-lg"> / {activeRoundNum}</span>
                </span>
                {totalBids === activeRoundNum && <Target size={20} className="text-suit-green" />}
              </div>
            </div>
          )}

          {localPhase === 'RESOLUTION' && (
            <div className="bg-brand-navy/5 rounded-lg p-4 border border-brand-charcoal/5 mt-4">
              <div className="flex justify-between text-sm mb-2 text-brand-slate font-medium">
                <span>{t('tricks_accounted_for')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-2xl font-bold ${totalTricks === activeRoundNum ? 'text-suit-green' : 'text-brand-navy'}`}>
                  {totalTricks}
                  <span className="text-brand-slate text-lg"> / {activeRoundNum}</span>
                </span>
                {totalTricks === activeRoundNum && <Crown size={20} className="text-suit-yellow" />}
              </div>
            </div>
          )}
        </Card>

        <ScoreGraph game={game} variant="sidebar" />
        <Leaderboard game={game} onEditRound={startEditRound} />
      </aside>
    </div>
  );
}
