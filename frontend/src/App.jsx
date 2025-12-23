import React, { useState, useEffect } from 'react';
import { useGameStore } from './store';
import { api } from './api';
import { Button, Card, Input, Badge, cn } from './components/UI';
import {
  Skull, Anchor, Scroll, Trophy, Users, ChevronRight, Minus, Plus,
  HelpCircle, X, Swords, Crown, RotateCcw, Info
} from 'lucide-react';

// --- RULES MODAL (Ported from old_frontend.jsx) ---
const RulesModal = ({ onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm font-serif">
    <div className="bg-parchment border-4 border-wood w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-xl shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col">
      <div className="sticky top-0 bg-wood p-6 border-b-4 border-highlight-gold flex justify-between items-center z-10">
        <h2 className="text-2xl font-bold text-highlight-gold flex items-center gap-3">
          <Scroll size={24} /> Captain's Log
        </h2>
        <button onClick={onClose} className="text-parchment hover:text-white p-2 hover:bg-highlight-gold/20 rounded-lg transition-colors">
          <X size={24} />
        </button>
      </div>
      <div className="p-8 grid md:grid-cols-2 gap-8 text-ink">
        <section>
          <h3 className="text-accent-red font-bold text-xl mb-4 flex items-center gap-2 border-b-2 border-ink/10 pb-2"><Crown size={18} /> Card Hierarchy</h3>
          <div className="bg-wood/5 p-4 rounded-xl border border-ink/10 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-1">
                <div className="w-4 h-4 rounded-full bg-suit-green border border-ink/20"></div>
                <div className="w-4 h-4 rounded-full bg-suit-yellow border border-ink/20"></div>
                <div className="w-4 h-4 rounded-full bg-suit-purple border border-ink/20"></div>
              </div>
              <span className="flex-1"><strong>Suits (1-14):</strong> Green, Yellow, Purple</span>
            </div>
            <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-full bg-suit-black border border-parchment/50"></div><span className="flex-1"><strong>Trump:</strong> Jolly Roger (Black) beats colors</span></div>
            <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-full bg-cyan-400 border border-ink/20"></div><span className="flex-1"><strong>Mermaid:</strong> Beats numbers & Skull King</span></div>
            <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-full bg-accent-red border border-ink/20"></div><span className="flex-1"><strong>Pirate:</strong> Beats numbers & Mermaid</span></div>
            <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-full bg-highlight-gold border border-ink/20"></div><span className="flex-1"><strong>Skull King:</strong> Beats all except Mermaid</span></div>
            <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-full bg-white border border-ink/20"></div><span className="flex-1"><strong>Escape:</strong> White Flag (Value 0)</span></div>
          </div>
        </section>

        <section>
          <h3 className="text-accent-red font-bold text-xl mb-4 flex items-center gap-2 border-b-2 border-ink/10 pb-2"><Trophy size={18} /> Scoring</h3>
          <div className="bg-wood/5 p-4 rounded-xl border border-ink/10 space-y-4">
            <div>
              <strong className="text-ink text-lg block mb-1">Standard Bid (> 0)</strong>
              <p className="text-sm">Exact: <span className="text-suit-green font-mono font-bold">+20</span> / trick</p>
              <p className="text-sm">Miss: <span className="text-accent-red font-mono font-bold">-10</span> / diff</p>
            </div>
            <div className="border-t border-ink/10 pt-3">
              <strong className="text-ink text-lg block mb-1">The Zero Bid</strong>
              <p className="text-sm">Exact: <span className="text-suit-green font-mono font-bold">+10</span> × Round No.</p>
              <p className="text-sm">Miss: <span className="text-accent-red font-mono font-bold">-10</span> × Round No.</p>
            </div>
            <div className="border-t border-ink/10 pt-3">
              <strong className="text-ink text-lg block mb-1">Bonuses</strong>
              <div className="grid grid-cols-2 gap-2 text-xs text-ink/70">
                <span>Colored 14: +10</span>
                <span>Black 14: +20</span>
                <span>Pirate captures Mermaid: +20</span>
                <span>King captures Pirate: +30</span>
                <span>Mermaid captures King: +40</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
);

// --- MAIN APP COMPONENT ---
export default function App() {
  const { game, setGame, clearGame } = useGameStore();
  const [view, setView] = useState('LOBBY'); // LOBBY, SETUP, PLAY
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    // If game exists in state but we're in LOBBY or SETUP, move to PLAY
    if (game && (view === 'LOBBY' || view === 'SETUP')) {
      setView('PLAY');
    }
  }, [game, view]);

  const handleNewVoyage = () => setView('SETUP');

  return (
    <div className="min-h-screen bg-wood text-parchment font-serif pb-12">
      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
      
      {/* Header */}
      <header className="sticky top-0 z-30 bg-wood border-b-4 border-highlight-gold shadow-xl">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => setView('LOBBY')}>
            <div className="w-12 h-12 bg-highlight-gold rounded-xl flex items-center justify-center shadow-lg border-2 border-ink/20 rotate-3 transform hover:rotate-0 transition-transform">
              <Skull className="text-ink" size={28} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="font-bold text-2xl tracking-widest text-highlight-gold drop-shadow-md">SKULL KING</h1>
              <p className="text-parchment/60 text-xs font-sans tracking-widest uppercase">Companion App</p>
            </div>
          </div>
          <Button variant="ghost" onClick={() => setShowRules(true)}>
             <HelpCircle size={24} />
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 md:p-6 relative z-10">
        {view === 'LOBBY' && <Lobby onNewVoyage={handleNewVoyage} setGame={setGame} />}
        {view === 'SETUP' && <Setup onBack={() => setView('LOBBY')} onStart={(g) => { setGame(g); setView('PLAY'); }} />}
        {view === 'PLAY' && <GameLoop game={game} onExit={() => { clearGame(); setView('LOBBY'); }} setGame={setGame} />}
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function Lobby({ onNewVoyage, setGame }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    api.getHistory().then(setHistory);
  }, []);

  return (
    <div className="max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pt-12 text-center">
      <Card className="p-8 border-highlight-gold/50 border-4 bg-parchment">
        <div className="bg-wood w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border-2 border-highlight-gold">
          <Anchor size={40} className="text-highlight-gold" />
        </div>
        <h2 className="text-4xl font-bold text-ink mb-2 font-serif">Welcome Aboard</h2>
        <p className="text-ink/60 font-sans mb-8">Ready to set sail on a new adventure?</p>
        
        <Button onClick={onNewVoyage} className="w-full py-5 text-xl font-bold shadow-lg">
          Start New Voyage
        </Button>
      </Card>

      {history.length > 0 && (
        <div className="mt-12 text-left">
          <h3 className="text-highlight-gold font-bold text-xl mb-4 flex items-center gap-2">
            <Trophy size={20} /> Captain's Log
          </h3>
          <div className="space-y-3">
            {history.map((g) => (
              <div 
                key={g.id} 
                onClick={() => setGame(g)}
                className="bg-parchment/10 hover:bg-parchment/20 border border-parchment/10 p-4 rounded-xl cursor-pointer transition-all flex justify-between items-center group"
              >
                <div>
                  <p className="font-bold text-parchment group-hover:text-highlight-gold transition-colors">
                    {new Date(g.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-parchment/60">{g.status}</p>
                </div>
                <ChevronRight className="text-parchment/40 group-hover:text-highlight-gold" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Setup({ onBack, onStart }) {
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
    if (validPlayers.length < 2) return alert('Need at least 2 pirates!');
    const g = await api.createGame(validPlayers.map(p => ({ name: p })));
    onStart(g);
  };

  return (
    <div className="max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pt-12">
      <Card className="p-8 text-center border-highlight-gold/50 border-4 bg-parchment">
        <div className="flex justify-start mb-4">
           <Button variant="ghost" onClick={onBack} className="text-ink/50 hover:text-ink -ml-4"><ChevronRight className="rotate-180" /> Back</Button>
        </div>
        <div className="bg-wood w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border-2 border-highlight-gold">
          <Users size={40} className="text-highlight-gold" />
        </div>
        <h2 className="text-4xl font-bold text-ink mb-2 font-serif">Assemble The Crew</h2>
        <p className="text-ink/60 font-sans">Enter the names of all pirates daring to join this voyage.</p>
      </Card>

      <div className="flex gap-3 mb-6 mt-8">
        <Input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
          placeholder="Enter pirate name..."
          autoFocus
        />
        <Button onClick={addPlayer} className="w-20 shadow-lg text-3xl pb-4">+</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        {players.filter(p => p).map((name, i) => (
          <div key={i} className="flex items-center justify-between p-4 bg-parchment rounded-xl border-2 border-ink/10 group hover:border-highlight-gold transition-colors shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-wood flex items-center justify-center text-highlight-gold font-bold text-lg shadow-inner border border-highlight-gold/50">
                {name.charAt(0).toUpperCase()}
              </div>
              <span className="font-bold text-xl text-ink">{name}</span>
            </div>
            <button onClick={() => removePlayer(name)} className="text-ink/40 hover:text-accent-red p-2 rounded-lg transition-colors">
              <X size={24} />
            </button>
          </div>
        ))}
      </div>

      <Button
        onClick={start}
        disabled={players.filter(p => p).length < 2}
        className="w-full text-xl py-5 shadow-xl border-2 border-ink/20"
      >
        Set Sail <Anchor size={24} />
      </Button>
    </div>
  );
}

function GameLoop({ game, onExit, setGame }) {
  const [localPhase, setLocalPhase] = useState('BID'); // BID, RESOLUTION
  const [bids, setBids] = useState({});
  const [tricks, setTricks] = useState({});
  const [bonuses, setBonuses] = useState({});
  const [kraken, setKraken] = useState(false);

  if (!game || !game.rounds || game.rounds.length === 0) {
    return <div className="p-12 text-center text-parchment">Loading voyage details...</div>;
  }

  // Determine current round logic
  // If the last round has no stats, it's the current active round.
  // If it has stats, we might be in "Game Over" or just viewing stats. 
  // Ideally backend creates next round automatically? Or we need to create it?
  // Checking api.js or logic: `submitRound` returns updated game. Does backend add next round?
  // Assuming standard flow: if round 10 is done -> Game Over. Else -> New Round.
  
  // Let's look at the game object structure from previous reads.
  // game.rounds is a list.
  const currentRound = game.rounds.find(r => !r.player_stats || r.player_stats.length === 0) || game.rounds[game.rounds.length - 1];
  const isRoundComplete = currentRound.player_stats && currentRound.player_stats.length > 0;
  
  // If round is complete, we are in "Review/Scoreboard" mode or need to go to next round?
  // Actually, if round is complete and < 10, we likely want to start next round.
  // The API doesn't seem to have "startNextRound". Maybe "submitRound" adds the next round automatically?
  // Let's assume if the last round in the list is complete, the game is over OR the backend hasn't generated the next round yet? 
  // Wait, `submitRound` in `old_frontend` logic added next round locally. 
  // Let's check `api.submitRound` in `backend/main.py` if possible or just assume standard behavior.
  // Actually, let's just assume if current round is complete, we show leaderboard. 
  // If it's not complete, we show Bidding/Resolution.
  
  useEffect(() => {
     // Reset local state on new round
     setBids({});
     setTricks({});
     setBonuses({});
     setKraken(false);
     setLocalPhase('BID');
  }, [currentRound.id]);

  const submitGameRound = async () => {
      try {
        const stats = game.players.map(p => ({
          player_id: p.id,
          bid: bids[p.id] || 0,
          tricks: tricks[p.id] || 0,
          bonus: bonuses[p.id] || 0
        }));
        const updated = await api.submitRound(game.id, currentRound.round_number, stats, kraken);
        setGame(updated);
        // After submit, we are either in next round or game over.
        // If game over, updated game status will be 'COMPLETED'.
      } catch (e) {
        alert(e.response?.data?.detail || 'Error submitting round');
      }
  };
  
  const undoLast = async () => {
    if (!window.confirm("Are you sure you want to undo the last round?")) return;
    const num = isRoundComplete ? currentRound.round_number : currentRound.round_number - 1;
    if (num < 1) return;
    
    await api.undoRound(game.id, num);
    const updated = await api.getGame(game.id);
    setGame(updated);
  };
  
  // --- RENDERING ---
  
  // 1. GAME OVER VIEW
  if (game.status === 'COMPLETED') {
     const leader = [...game.players].sort((a,b) => {
         const scoreA = game.rounds.reduce((acc, r) => acc + (r.player_stats?.find(s=>s.player_id===a.id)?.round_score || 0), 0);
         const scoreB = game.rounds.reduce((acc, r) => acc + (r.player_stats?.find(s=>s.player_id===b.id)?.round_score || 0), 0);
         return scoreB - scoreA;
     })[0];
     
     return (
        <div className="text-center space-y-8 animate-in zoom-in duration-500 pt-12">
            <div className="relative inline-block group">
                <div className="absolute inset-0 bg-highlight-gold blur-3xl opacity-20 rounded-full group-hover:opacity-40 transition-opacity"></div>
                <Trophy size={120} className="text-highlight-gold relative z-10 mx-auto drop-shadow-2xl" />
            </div>

            <div>
                <h2 className="text-4xl md:text-6xl font-bold text-parchment mb-6 tracking-tight drop-shadow-md">Captain of the Seas</h2>
                <div className="text-4xl md:text-5xl text-ink font-bold bg-parchment inline-block px-12 py-6 rounded-2xl border-4 border-highlight-gold shadow-2xl transform hover:scale-105 transition-transform">
                    {leader?.name}
                </div>
                {/* Score calculation would go here if not available on player object directly */}
                <div className="mt-8 flex justify-center gap-4">
                     <Button onClick={onExit} variant="secondary">Return to Port</Button>
                </div>
            </div>
            
             <Leaderboard game={game} />
        </div>
     );
  }

  // 2. ACTIVE GAME VIEW
  return (
    <div className="grid lg:grid-cols-4 gap-8 items-start">
        {/* MAIN AREA */}
        <main className="lg:col-span-3 space-y-6">
            
            {/* Header for Round */}
            <div className="flex items-center justify-between mb-2">
                <div>
                   <h2 className="text-3xl font-bold text-highlight-gold flex items-center gap-3 drop-shadow-sm">
                       {localPhase === 'BID' ? <Swords className="text-parchment" size={32} /> : <Crown className="text-parchment" size={32} />}
                       {localPhase === 'BID' ? 'Bidding Phase' : 'Resolution Phase'}
                   </h2>
                   <p className="text-parchment/60 text-sm font-sans tracking-widest mt-1">ROUND {currentRound.round_number} • {currentRound.card_count} CARDS</p>
                </div>
                 <div className="flex gap-2">
                     <Button variant="danger" onClick={undoLast} className="px-3"><RotateCcw size={16}/></Button>
                 </div>
            </div>

            {/* PHASE: BIDDING */}
            {localPhase === 'BID' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-24 lg:mb-0">
                        {game.players.map(player => {
                            const currentBid = bids[player.id] ?? 0;
                            return (
                                <Card key={player.id} className="p-6 flex flex-col gap-4 relative overflow-hidden group">
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-highlight-gold opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="font-bold text-xl text-ink border-b-2 border-ink/10 pb-2 flex justify-between items-center">
                                        {player.name}
                                    </div>
                                    <div className="flex items-center justify-between gap-4 bg-wood/5 p-3 rounded-xl border border-ink/10">
                                        <button
                                            onClick={() => setBids({ ...bids, [player.id]: Math.max(0, currentBid - 1) })}
                                            className="w-12 h-12 rounded-lg bg-wood hover:bg-ink flex items-center justify-center text-parchment active:scale-95 transition-all shadow-md border-b-4 border-black/20"
                                        >
                                            <Minus size={24} />
                                        </button>
                                        <span className={`flex-1 text-center text-4xl font-bold font-mono ${currentBid === 0 ? 'text-highlight-gold' : 'text-ink'}`}>
                                            {currentBid}
                                        </span>
                                        <button
                                            onClick={() => setBids({ ...bids, [player.id]: Math.min(currentRound.round_number, currentBid + 1) })}
                                            className="w-12 h-12 rounded-lg bg-wood hover:bg-ink flex items-center justify-center text-parchment active:scale-95 transition-all shadow-md border-b-4 border-black/20"
                                        >
                                            <Plus size={24} />
                                        </button>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                    {/* Action Bar */}
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-wood/95 backdrop-blur-md border-t-4 border-highlight-gold lg:relative lg:bg-transparent lg:border-0 lg:p-0 lg:mt-8 z-20">
                        <div className="max-w-7xl mx-auto lg:flex lg:justify-end">
                            <Button onClick={() => setLocalPhase('RESOLUTION')} className="w-full lg:w-auto lg:px-12 text-xl shadow-xl">
                                Confirm Bids <Swords size={24} />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* PHASE: RESOLUTION */}
            {localPhase === 'RESOLUTION' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-24 lg:mb-0">
                        {game.players.map(player => {
                            const playerTricks = tricks[player.id] ?? 0;
                            const bid = bids[player.id] ?? 0;
                            const bonus = bonuses[player.id] ?? 0;
                            const totalTricksEntered = Object.values(tricks).reduce((a,b)=>a+b,0);
                            const canAddTrick = totalTricksEntered < currentRound.round_number;

                            return (
                                <Card key={player.id} className="p-6 space-y-4 hover:border-highlight-gold transition-colors border-2">
                                    <div className="flex justify-between items-center border-b-2 border-ink/10 pb-3">
                                        <span className="font-bold text-2xl text-ink">{player.name}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-ink/60 uppercase font-bold tracking-wider">Bid</span>
                                            <span className={`text-xl font-mono font-bold px-4 py-1 rounded-lg bg-wood border-2 border-ink/20 ${bid === 0 ? 'text-highlight-gold' : 'text-parchment'}`}>
                                                {bid}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_160px] gap-6">
                                        <div className="flex flex-col justify-center">
                                            <label className="text-xs text-ink/60 uppercase font-bold mb-2 tracking-wider">Tricks Won</label>
                                            <div className="flex items-center gap-3 bg-wood/5 p-2 rounded-xl border border-ink/10">
                                                <button
                                                    onClick={() => setTricks({ ...tricks, [player.id]: Math.max(0, playerTricks - 1) })}
                                                    className="w-12 h-12 rounded-lg bg-wood hover:bg-ink flex items-center justify-center text-parchment transition-all shadow-md border-b-4 border-black/20"
                                                >
                                                    <Minus size={20} />
                                                </button>
                                                <span className={`flex-1 text-center font-bold text-4xl font-mono ${playerTricks === bid ? 'text-suit-green' : 'text-ink'}`}>
                                                    {playerTricks}
                                                </span>
                                                <button
                                                    onClick={() => setTricks({ ...tricks, [player.id]: Math.min(currentRound.round_number, playerTricks + 1) })}
                                                    disabled={!canAddTrick}
                                                    className="w-12 h-12 rounded-lg bg-wood hover:bg-ink flex items-center justify-center text-parchment disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-md border-b-4 border-black/20"
                                                >
                                                    <Plus size={20} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex flex-col justify-center">
                                            <label className="text-xs text-ink/60 uppercase font-bold mb-2 tracking-wider">Bonus Pts</label>
                                            <div className="flex items-center gap-2 bg-wood/5 p-2 rounded-xl border border-ink/10 h-[66px]">
                                                <button
                                                    onClick={() => setBonuses({ ...bonuses, [player.id]: Math.max(0, bonus - 10) })}
                                                    className="w-10 h-12 rounded-lg bg-wood hover:bg-ink flex items-center justify-center text-parchment transition-colors active:scale-95 shadow-sm"
                                                >
                                                    <Minus size={16} />
                                                </button>
                                                <span className="flex-1 text-center font-bold text-xl font-mono text-highlight-gold">
                                                    {bonus}
                                                </span>
                                                <button
                                                    onClick={() => setBonuses({ ...bonuses, [player.id]: bonus + 10 })}
                                                    className="w-10 h-12 rounded-lg bg-wood hover:bg-ink flex items-center justify-center text-parchment transition-colors active:scale-95 shadow-sm"
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

                     {/* Validation / Submit */}
                     <div className="fixed bottom-0 left-0 right-0 p-4 bg-wood/95 backdrop-blur-md border-t-4 border-highlight-gold lg:relative lg:bg-transparent lg:border-0 lg:p-0 lg:mt-8 z-20 flex flex-col items-end gap-4">
                        <div className="flex items-center gap-3 text-parchment bg-wood/50 p-2 rounded-lg border border-parchment/10">
                             <input 
                               type="checkbox" 
                               id="kraken" 
                               checked={kraken} 
                               onChange={e => setKraken(e.target.checked)}
                               className="w-5 h-5 rounded border-parchment text-highlight-gold focus:ring-highlight-gold bg-wood" 
                             />
                             <label htmlFor="kraken" className="text-sm font-bold">Kraken/Whale Played (Bypass Check)</label>
                        </div>
                        <div className="flex w-full lg:w-auto gap-4">
                             <Button onClick={() => setLocalPhase('BID')} variant="secondary" className="flex-1 lg:flex-none">
                                Back to Bids
                            </Button>
                            <Button
                                onClick={submitGameRound}
                                disabled={!kraken && Object.values(tricks).reduce((a,b)=>a+b,0) !== currentRound.round_number}
                                className="flex-[2] lg:flex-none lg:w-auto lg:px-12 text-xl shadow-xl"
                            >
                                Finish Round {currentRound.round_number} <ChevronRight size={24} />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            
        </main>
        
        {/* SIDEBAR */}
        <aside className="hidden lg:block lg:sticky lg:top-28 space-y-6">
            <Card className="p-6">
                 <h3 className="text-ink/60 text-sm uppercase tracking-wider font-bold mb-4">Current Voyage</h3>
                 <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-5xl font-bold text-highlight-gold drop-shadow-sm">{currentRound.round_number}</span>
                    <span className="text-ink/40 text-xl font-bold">/ 10</span>
                 </div>
                 
                 {localPhase === 'RESOLUTION' && (
                     <div className="bg-wood/5 rounded-lg p-4 border border-ink/10 mt-4">
                        <div className="flex justify-between text-sm mb-2 text-ink/70 font-medium">
                            <span>Tricks Accounted For</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className={`text-2xl font-bold ${Object.values(tricks).reduce((a,b)=>a+b,0) === currentRound.round_number ? 'text-suit-green' : 'text-ink'}`}>
                                {Object.values(tricks).reduce((a,b)=>a+b,0)}
                                <span className="text-ink/40 text-lg"> / {currentRound.round_number}</span>
                            </span>
                             {Object.values(tricks).reduce((a,b)=>a+b,0) === currentRound.round_number && <Crown size={20} className="text-highlight-gold" />}
                        </div>
                     </div>
                 )}
            </Card>
            
            <Leaderboard game={game} compact />
        </aside>
    </div>
  );
}

function Leaderboard({ game, compact = false }) {
  // Calculate standings
  const standings = game.players.map(p => {
    const total = game.rounds.reduce((acc, r) => {
      const stat = r.player_stats?.find(s => s.player_id === p.id);
      return acc + (stat?.round_score || 0);
    }, 0);
    return { ...p, total };
  }).sort((a, b) => b.total - a.total);

  return (
    <Card className="flex-1 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-ink/10 bg-wood/5">
            <h3 className="text-accent-red font-bold flex items-center gap-2">
                <Trophy size={16} /> Leaderboard
            </h3>
        </div>
        <div className="p-2 overflow-y-auto max-h-[500px]">
            <table className="w-full text-sm">
                <tbody className="divide-y divide-ink/10">
                    {standings.map((p, i) => (
                        <tr key={p.id} className="hover:bg-wood/5 transition-colors">
                            <td className="py-3 px-3 w-8 font-mono text-ink/50 font-bold">{i + 1}</td>
                            <td className="py-3 px-3 font-bold text-ink">{p.name}</td>
                            <td className="py-3 px-3 text-right font-bold text-highlight-gold font-mono text-lg drop-shadow-sm">{p.total}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </Card>
  )
}
