import React, { useState, useEffect } from 'react';
import { useGameStore } from './store';
import { api } from './api';
import { Button, Card, Input, Badge, cn } from './components/UI';
import {
  Skull, Anchor, Scroll, Trophy, Users, ChevronRight, Minus, Plus,
  HelpCircle, X, Swords, Crown, RotateCcw, Info, Trash2, Home, LineChart, Edit, Target
} from 'lucide-react';
import {
  LineChart as ReChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// --- SCORE GRAPH COMPONENT ---
const ScoreGraph = ({ game, variant = 'sidebar' }) => {
  const data = game.rounds
    .filter(r => r.player_stats && r.player_stats.length > 0)
    .map(r => {
      const entry = { name: `R${r.round_number}` };
      r.player_stats.forEach(s => {
        const playerName = game.players.find(p => p.id === s.player_id)?.name || 'Unknown';
        entry[playerName] = s.total_score_snapshot;
      });
      return entry;
    });

  if (data.length === 0) return null;

  const colors = ['#0D9488', '#991B1B', '#EAB308', '#7C3AED', '#2563EB', '#D97706'];
  const isHero = variant === 'hero';

  return (
    <Card className={cn("p-4 w-full flex flex-col gap-4 overflow-hidden", isHero ? "h-[500px]" : "h-80")}>
      <h3 className="text-brand-navy font-bold flex items-center gap-2 font-serif text-sm shrink-0">
        <LineChart size={16} className="text-brand-teal" /> Point Progression
      </h3>
      
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ReChart data={data} margin={{ top: 10, right: 15, left: -25, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis 
              dataKey="name" 
              fontSize={10} 
              tick={{ fill: '#4b5563', fontWeight: 600 }} 
              axisLine={false}
              tickLine={false}
              interval={0}
              dy={10}
            />
            <YAxis 
              fontSize={10} 
              tick={{ fill: '#4b5563', fontWeight: 600 }} 
              axisLine={false}
              tickLine={false}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fdfcf0', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ fontWeight: 'bold', fontSize: '12px' }}
            />
            {game.players.map((p, i) => (
              <Line 
                key={p.id} 
                type="monotone" 
                dataKey={p.name} 
                stroke={colors[i % colors.length]} 
                strokeWidth={isHero ? 4 : 3}
                dot={{ r: isHero ? 4 : 3, fill: colors[i % colors.length], strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
                animationDuration={1000}
              />
            ))}
          </ReChart>
        </ResponsiveContainer>
      </div>

      {/* Custom Legend UI */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 px-4 py-3 border-t border-brand-charcoal/5 shrink-0 bg-brand-navy/5 -mx-4 -mb-4">
        {game.players.map((p, i) => (
          <div key={p.id} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: colors[i % colors.length] }} />
            <span className="text-[10px] font-bold text-brand-navy truncate max-w-[100px]">
              {p.name}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
};

// --- RULES MODAL (Ported from old_frontend.jsx) ---
const RulesModal = ({ onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-navy/80 backdrop-blur-sm">
    <div className="bg-brand-parchment border border-brand-slate/20 w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col">
      <div className="sticky top-0 bg-brand-navy p-6 border-b border-brand-teal/20 flex justify-between items-center z-10">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3 font-serif">
          <Scroll size={24} className="text-brand-teal" /> Captain's Log
        </h2>
        <button onClick={onClose} className="text-white/60 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors">
          <X size={24} />
        </button>
      </div>
      <div className="p-8 grid md:grid-cols-2 gap-8 text-brand-charcoal">
        <section>
          <h3 className="text-brand-oxblood font-bold text-xl mb-4 flex items-center gap-2 border-b border-brand-charcoal/10 pb-2 font-serif"><Crown size={18} /> Card Hierarchy</h3>
          <div className="bg-brand-navy/5 p-4 rounded-xl border border-brand-charcoal/5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-1">
                <div className="w-4 h-4 rounded-full bg-suit-green border border-white"></div>
                <div className="w-4 h-4 rounded-full bg-suit-yellow border border-white"></div>
                <div className="w-4 h-4 rounded-full bg-suit-purple border border-white"></div>
              </div>
              <span className="flex-1"><strong>Suits (1-14):</strong> Green, Yellow, Purple</span>
            </div>
            <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-full bg-suit-black border border-white"></div><span className="flex-1"><strong>Trump:</strong> Jolly Roger (Black) beats colors</span></div>
            <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-full bg-cyan-500 border border-white"></div><span className="flex-1"><strong>Mermaid:</strong> Beats numbers & Skull King</span></div>
            <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-full bg-brand-oxblood border border-white"></div><span className="flex-1"><strong>Pirate:</strong> Beats numbers & Mermaid</span></div>
            <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-full bg-suit-yellow border border-white"></div><span className="flex-1"><strong>Skull King:</strong> Beats all except Mermaid</span></div>
            <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-full bg-white border border-brand-charcoal/20"></div><span className="flex-1"><strong>Escape:</strong> White Flag (Value 0)</span></div>
          </div>
        </section>

        <section>
          <h3 className="text-brand-oxblood font-bold text-xl mb-4 flex items-center gap-2 border-b border-brand-charcoal/10 pb-2 font-serif"><Trophy size={18} /> Scoring</h3>
          <div className="bg-brand-navy/5 p-4 rounded-xl border border-brand-charcoal/5 space-y-4">
            <div>
              <strong className="text-brand-charcoal text-lg block mb-1">Standard Bid ({'>'} 0)</strong>
              <p className="text-sm">Exact: <span className="text-suit-green font-mono font-bold">+20</span> / trick</p>
              <p className="text-sm">Miss: <span className="text-brand-oxblood font-mono font-bold">-10</span> / diff</p>
            </div>
            <div className="border-t border-brand-charcoal/10 pt-3">
              <strong className="text-brand-charcoal text-lg block mb-1">The Zero Bid</strong>
              <p className="text-sm">Exact: <span className="text-suit-green font-mono font-bold">+10</span> × Round No.</p>
              <p className="text-sm">Miss: <span className="text-brand-oxblood font-mono font-bold">-10</span> × Round No.</p>
            </div>
            <div className="border-t border-brand-charcoal/10 pt-3">
              <strong className="text-brand-charcoal text-lg block mb-1 font-serif">Bonuses</strong>
              <div className="grid grid-cols-2 gap-2 text-xs text-brand-slate">
                <span>Colored 14: +10</span>
                <span>Black 14: +20</span>
                <span>Pirate captures Mermaid: +20</span>
                <span>King captures Pirate: +30</span>
                <span>Mermaid captures King: +40</span>
              </div>
            </div>
          </div>
        </section>

        <section className="md:col-span-2">
            <h3 className="text-brand-oxblood font-bold text-xl mb-4 flex items-center gap-2 border-b border-brand-charcoal/10 pb-2 font-serif"><Info size={18} /> Gameplay & Rules</h3>
            <div className="bg-brand-navy/5 p-6 rounded-xl border border-brand-charcoal/5 space-y-4 text-sm leading-relaxed">
                <p>
                    <strong>The Goal:</strong> Predict exactly how many tricks you will win each round. 
                    The game lasts 10 rounds. In round 1, you have 1 card; in round 10, you have 10 cards.
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <p><strong>Bidding:</strong> All players simultaneously pound their fists 3 times and shout "Yo-Ho-Ho!", then extend fingers to show their bid.</p>
                        <p><strong>Playing Tricks:</strong> The first player leads a card. Others must follow suit if possible. If you can't follow suit, you can play any other card (including trump or special cards).</p>
                    </div>
                    <div className="space-y-2">
                        <p><strong>Special Cards:</strong> Special cards (Pirates, Mermaid, Skull King) can be played at any time, even if you could follow suit.</p>
                        <p><strong>The Kraken:</strong> If played, the entire trick is destroyed. No one wins it. The next trick starts with the same person who started the Kraken trick.</p>
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

  const handleNewVoyage = () => setView('SETUP');
  
  const handleSelectGame = (g) => {
    setGame(g);
    setView('PLAY');
  };

  return (
    <div className="min-h-screen bg-brand-parchment text-brand-charcoal pb-12 font-sans">
      {showRules && <RulesModal onClose={() => setShowRules(false)} />}

      {/* Header */}
      <header className="sticky top-0 z-30 bg-brand-navy text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => setView('LOBBY')}>
            <div className="w-12 h-12 bg-brand-oxblood rounded-xl flex items-center justify-center shadow-lg border border-white/10 transform hover:scale-105 transition-transform">
              <Skull className="text-white" size={28} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="font-bold text-2xl tracking-tight text-white font-serif">SKULL KING</h1>
              <p className="text-brand-teal text-xs font-sans tracking-widest uppercase font-bold">Companion</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {view === 'PLAY' && (
              <Button
                variant="ghost"
                onClick={() => {
                  if (window.confirm('Return to home screen? Game progress will be saved.')) {
                    setView('LOBBY');
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

      <div className="max-w-7xl mx-auto p-4 md:p-6 relative z-10">
        {view === 'LOBBY' && <Lobby onNewVoyage={handleNewVoyage} onSelectGame={handleSelectGame} />}
        {view === 'SETUP' && <Setup onBack={() => setView('LOBBY')} onStart={(g) => { setGame(g); setView('PLAY'); }} />}
        {view === 'PLAY' && <GameLoop game={game} onExit={() => { clearGame(); setView('LOBBY'); }} setGame={setGame} />}
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function Lobby({ onNewVoyage, onSelectGame }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => api.getHistory().then(setHistory);

  const deleteGame = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to sink this ship? (Delete game)')) {
      await api.deleteGame(id);
      loadHistory();
    }
  };

  return (
    <div className="max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pt-12 text-center">
      <Card className="p-8">
        <div className="bg-brand-navy w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl border border-white/10">
          <Anchor size={40} className="text-brand-teal" />
        </div>
        <h2 className="text-4xl font-bold text-brand-navy mb-2 font-serif">Welcome Aboard</h2>
        <p className="text-brand-slate font-sans mb-8">Ready to set sail on a new adventure?</p>
        
        <Button onClick={onNewVoyage} className="w-full py-5 text-xl font-bold">
          Start New Voyage
        </Button>
      </Card>

      {history.length > 0 && (
        <div className="mt-12 text-left">
          <h3 className="text-brand-navy font-bold text-xl mb-4 flex items-center gap-2 font-serif">
            <Trophy size={20} className="text-brand-teal" /> Captain's Log
          </h3>
          <div className="space-y-3">
            {history.map((g) => (
              <div
                key={g.id}
                onClick={() => onSelectGame(g)}
                className="bg-white hover:bg-brand-navy/5 border border-brand-slate/10 p-4 rounded-xl cursor-pointer transition-all flex justify-between items-center group shadow-sm hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-brand-navy/5 flex items-center justify-center text-brand-navy group-hover:bg-brand-teal/10 group-hover:text-brand-teal transition-colors">
                    <Anchor size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-brand-navy group-hover:text-brand-teal transition-colors">
                      {new Date(g.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-brand-slate uppercase tracking-wider font-bold">{g.status}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => deleteGame(g.id, e)}
                    className="p-2 text-brand-slate/40 hover:text-brand-oxblood hover:bg-brand-oxblood/5 rounded-lg transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                  <ChevronRight className="text-brand-slate/40 group-hover:text-brand-teal" />
                </div>
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
      <Card className="p-8 text-center">
        <div className="flex justify-start mb-4">
           <Button variant="ghost" onClick={onBack} className="text-brand-slate hover:text-brand-navy -ml-4"><ChevronRight className="rotate-180" /> Back</Button>
        </div>
        <div className="bg-brand-navy w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl border border-white/10">
          <Users size={40} className="text-brand-teal" />
        </div>
        <h2 className="text-4xl font-bold text-brand-navy mb-2 font-serif">Assemble The Crew</h2>
        <p className="text-brand-slate font-sans">Enter the names of all pirates daring to join this voyage.</p>
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
        <Button onClick={addPlayer} className="w-14 h-14 shrink-0 rounded-xl text-3xl font-light">+</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        {players.filter(p => p).map((name, i) => (
          <div key={i} className="flex items-center justify-between p-4 bg-white rounded-xl border border-brand-slate/10 group hover:border-brand-teal/50 transition-colors shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand-navy flex items-center justify-center text-brand-teal font-bold text-lg shadow-inner">
                {name.charAt(0).toUpperCase()}
              </div>
              <span className="font-bold text-xl text-brand-charcoal">{name}</span>
            </div>
            <button onClick={() => removePlayer(name)} className="text-brand-slate/40 hover:text-brand-oxblood p-2 rounded-lg transition-colors">
              <X size={24} />
            </button>
          </div>
        ))}
      </div>

      <Button
        onClick={start}
        disabled={players.filter(p => p).length < 2}
        className="w-full text-xl py-5 shadow-xl"
      >
        Set Sail <Anchor size={24} />
      </Button>
    </div>
  );
}

function GameLoop({ game, onExit, setGame }) {
  const [localPhase, setLocalPhase] = useState('BID'); // BID, RESOLUTION
  const [editingRoundNum, setEditingRoundNum] = useState(null);
  const [bids, setBids] = useState({});
  const [tricks, setTricks] = useState({});
  const [bonuses, setBonuses] = useState({});
  const [kraken, setKraken] = useState(false);
  const [showGraph, setShowGraph] = useState(false);

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
  const activeRoundNum = editingRoundNum || currentRound.round_number;
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
    setBids(newBids);
    setTricks(newTricks);
    setBonuses(newBonuses);
    setLocalPhase('RESOLUTION'); // Direct to resolution for editing
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
  if (game.status === 'COMPLETED' && !editingRoundNum) {
    const leader = [...game.players].sort((a, b) => {
      const scoreA = game.rounds.reduce((acc, r) => acc + (r.player_stats?.find(s => s.player_id === a.id)?.round_score || 0), 0);
      const scoreB = game.rounds.reduce((acc, r) => acc + (r.player_stats?.find(s => s.player_id === b.id)?.round_score || 0), 0);
      return scoreB - scoreA;
    })[0];

    return (
      <div className="max-w-6xl mx-auto space-y-12 animate-in zoom-in duration-500 pt-12">
        <div className="text-center space-y-8">
          <div className="relative inline-block group">
            <div className="absolute inset-0 bg-brand-teal blur-3xl opacity-20 rounded-full group-hover:opacity-40 transition-opacity"></div>
            <Trophy size={120} className="text-suit-yellow relative z-10 mx-auto drop-shadow-2xl" />
          </div>

          <div>
            <h2 className="text-4xl md:text-6xl font-bold text-brand-navy mb-6 tracking-tight drop-shadow-md font-serif">Captain of the Seas</h2>
            <div className="text-4xl md:text-5xl text-white font-bold bg-brand-navy inline-block px-12 py-6 rounded-3xl border border-brand-teal/20 shadow-2xl transform hover:scale-105 transition-transform">
              {leader?.name}
            </div>
            <div className="mt-8 flex justify-center gap-4">
              <Button onClick={onExit} variant="secondary">Return to Port</Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <ScoreGraph game={game} variant="hero" />
          <Leaderboard game={game} onEditRound={startEditRound} />
        </div>
      </div>
    );
  }

  // 2. ACTIVE GAME VIEW
  // Dealer Calculation: (Round - 1) % PlayerCount
  // Note: If editing a round, we should calculate based on THAT round number
  const dealerIndex = (activeRoundNum - 1) % game.players.length;

  return (
    <div className="grid lg:grid-cols-4 gap-8 items-start">
        {/* MAIN AREA */}
        <main className="lg:col-span-3 space-y-6">
            <div className="lg:hidden flex justify-end">
                <Button variant="secondary" size="sm" onClick={() => setShowGraph(!showGraph)}>
                    <LineChart size={16} className="mr-2" /> {showGraph ? 'Hide Graph' : 'Show Graph'}
                </Button>
            </div>

            {showGraph && (
                <div className="lg:hidden animate-in fade-in slide-in-from-top-4">
                    <ScoreGraph game={game} />
                </div>
            )}
            
            {/* Header for Round */}
            <div className="flex items-center justify-between mb-2">
                <div>
                   <div className="flex items-center gap-3">
                       <h2 className="text-3xl font-bold text-brand-navy flex items-center gap-3 font-serif">
                           {editingRoundNum ? <Edit className="text-brand-teal" size={32} /> : (localPhase === 'BID' ? <Swords className="text-brand-oxblood" size={32} /> : <Crown className="text-suit-yellow" size={32} />)}
                           {editingRoundNum ? `Editing Round ${editingRoundNum}` : (localPhase === 'BID' ? 'Bidding Phase' : 'Resolution Phase')}
                       </h2>
                   </div>
                   <p className="text-brand-slate text-sm font-sans tracking-widest mt-1 font-bold uppercase">
                       {editingRoundNum ? 'CORRECTING THE LOGS' : `ROUND ${currentRound.round_number} • ${currentRound.card_count} CARDS`}
                   </p>
                </div>
                 <div className="flex gap-2">
                     {editingRoundNum ? (
                         <Button variant="secondary" onClick={() => { setEditingRoundNum(null); setLocalPhase('BID'); }} className="px-3">Cancel Edit</Button>
                     ) : (
                         <Button variant="danger" onClick={undoLast} className="px-3" title="Undo Last Round"><RotateCcw size={16}/></Button>
                     )}
                 </div>
            </div>

            {/* PHASE: BIDDING */}
            {localPhase === 'BID' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-24 lg:mb-0">
                        {game.players.map((player, idx) => {
                            const currentBid = bids[player.id] ?? 0;
                            const isDealer = idx === dealerIndex;
                            return (
                                <Card key={player.id} className={`p-6 flex flex-col gap-4 relative overflow-hidden group hover:border-brand-teal/30 ${isDealer ? 'ring-2 ring-brand-teal/20 bg-brand-teal/5' : ''}`}>
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-brand-teal opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="font-bold text-xl text-brand-navy border-b border-brand-charcoal/5 pb-2 flex justify-between items-center font-serif">
                                        <div className="flex items-center gap-2">
                                            {player.name}
                                            {isDealer && <Badge className="bg-brand-teal text-white text-xs">DEALER</Badge>}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 bg-brand-navy/5 p-3 rounded-xl border border-brand-charcoal/5">
                                        <button
                                            onClick={() => setBids({ ...bids, [player.id]: Math.max(0, currentBid - 1) })}
                                            className="w-12 h-12 rounded-lg bg-brand-navy hover:bg-brand-charcoal flex items-center justify-center text-white active:scale-95 transition-all shadow-md"
                                        >
                                            <Minus size={24} />
                                        </button>
                                        <span className={`flex-1 text-center text-4xl font-bold font-mono ${currentBid === 0 ? 'text-brand-teal' : 'text-brand-navy'}`}>
                                            {currentBid}
                                        </span>
                                        <button
                                            onClick={() => setBids({ ...bids, [player.id]: Math.min(currentRound.round_number, currentBid + 1) })}
                                            className="w-12 h-12 rounded-lg bg-brand-navy hover:bg-brand-charcoal flex items-center justify-center text-white active:scale-95 transition-all shadow-md"
                                        >
                                            <Plus size={24} />
                                        </button>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                    {/* Action Bar */}
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-brand-slate/10 lg:relative lg:bg-transparent lg:border-0 lg:p-0 lg:mt-8 z-20">
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
                        {game.players.map((player, idx) => {
                            const playerTricks = tricks[player.id] ?? 0;
                            const bid = bids[player.id] ?? 0;
                            const bonus = bonuses[player.id] ?? 0;
                            const totalTricksEntered = Object.values(tricks).reduce((a,b)=>a+b,0);
                            // If editing, use the editing round number, otherwise current
                            const targetRoundNum = editingRoundNum || currentRound.round_number;
                            const canAddTrick = totalTricksEntered < targetRoundNum;
                            const isDealer = idx === dealerIndex;

                            return (
                                <Card key={player.id} className={`p-6 space-y-4 hover:border-brand-teal/30 transition-colors ${isDealer ? 'ring-2 ring-brand-teal/20 bg-brand-teal/5' : ''}`}>
                                    <div className="flex justify-between items-center border-b border-brand-charcoal/5 pb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-2xl text-brand-navy font-serif">{player.name}</span>
                                            {isDealer && <Badge className="bg-brand-teal text-white text-xs">DEALER</Badge>}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-brand-slate uppercase font-bold tracking-wider">Bid</span>
                                            <span className={`text-xl font-mono font-bold px-4 py-1 rounded-lg bg-brand-navy border border-brand-teal/20 ${bid === 0 ? 'text-brand-teal' : 'text-white'}`}>
                                                {bid}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_160px] gap-6">
                                        <div className="flex flex-col justify-center">
                                            <label className="text-xs text-brand-slate uppercase font-bold mb-2 tracking-wider">Tricks Won</label>
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

                                        <div className="flex flex-col justify-center">
                                            <label className="text-xs text-brand-slate uppercase font-bold mb-2 tracking-wider">Bonus Pts</label>
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

                     {/* Validation / Submit */}
                     <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-brand-slate/10 lg:relative lg:bg-transparent lg:border-0 lg:p-0 lg:mt-8 z-20 flex flex-col items-end gap-4">
                        <div className="flex items-center gap-3 text-brand-charcoal bg-brand-navy/5 p-2 rounded-lg border border-brand-charcoal/10">
                             <input 
                               type="checkbox" 
                               id="kraken" 
                               checked={kraken} 
                               onChange={e => setKraken(e.target.checked)}
                               className="w-5 h-5 rounded border-brand-slate text-brand-teal focus:ring-brand-teal bg-white" 
                             />
                             <label htmlFor="kraken" className="text-sm font-bold">Kraken/Whale Played (Bypass Check)</label>
                        </div>

                        {/* Validation Error Message */}
                        {!kraken && Object.values(tricks).reduce((a,b)=>a+b,0) !== (editingRoundNum || currentRound.round_number) && (
                            <div className="flex items-center gap-2 text-brand-oxblood font-bold bg-brand-oxblood/10 px-4 py-2 rounded-lg border border-brand-oxblood/20 animate-in slide-in-from-bottom-2">
                                <Info size={18} />
                                <span>Tricks claimed: {Object.values(tricks).reduce((a,b)=>a+b,0)} / {editingRoundNum || currentRound.round_number}</span>
                            </div>
                        )}

                        <div className="flex w-full lg:w-auto gap-4">
                             <Button onClick={() => setLocalPhase('BID')} variant="secondary" className="flex-1 lg:flex-none">
                                Back to Bids
                            </Button>
                            <Button
                                onClick={submitGameRound}
                                disabled={!kraken && Object.values(tricks).reduce((a,b)=>a+b,0) !== (editingRoundNum || currentRound.round_number)}
                                className="flex-[2] lg:flex-none lg:w-auto lg:px-12 text-xl shadow-xl"
                            >
                                {editingRoundNum ? 'Update Round' : `Finish Round ${currentRound.round_number}`} <ChevronRight size={24} />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            
        </main>
        
        {/* SIDEBAR */}
        <aside className="hidden lg:block lg:sticky lg:top-28 space-y-6">
            <Card className="p-6">
                 <h3 className="text-brand-slate text-sm uppercase tracking-wider font-bold mb-4">Current Voyage</h3>
                 <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-5xl font-bold text-brand-navy font-serif">{currentRound.round_number}</span>
                    <span className="text-brand-slate text-xl font-bold">/ 10</span>
                 </div>
                 
                 {localPhase === 'RESOLUTION' && (
                     <div className="bg-brand-navy/5 rounded-lg p-4 border border-brand-charcoal/5 mt-4">
                        <div className="flex justify-between text-sm mb-2 text-brand-slate font-medium">
                            <span>Tricks Accounted For</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className={`text-2xl font-bold ${Object.values(tricks).reduce((a,b)=>a+b,0) === activeRoundNum ? 'text-suit-green' : 'text-brand-navy'}`}>
                                {Object.values(tricks).reduce((a,b)=>a+b,0)}
                                <span className="text-brand-slate text-lg"> / {activeRoundNum}</span>
                            </span>
                             {Object.values(tricks).reduce((a,b)=>a+b,0) === activeRoundNum && <Crown size={20} className="text-suit-yellow" />}
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

function Leaderboard({ game, compact = false, onEditRound }) {
  const [expandedRounds, setExpandedRounds] = React.useState({});

  const toggleRound = (roundNum) => {
    setExpandedRounds(prev => ({
      ...prev,
      [roundNum]: !prev[roundNum]
    }));
  };

  const isGameCompleted = game.status === 'COMPLETED';

  // Calculate standings
  const standings = game.players.map(p => {
    const total = game.rounds.reduce((acc, r) => {
      const stat = r.player_stats?.find(s => s.player_id === p.id);
      return acc + (stat?.round_score || 0);
    }, 0);
    return { ...p, total };
  }).sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-6">
      <Card className="flex-1 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-brand-charcoal/5 bg-brand-navy/5">
              <h3 className="text-brand-oxblood font-bold flex items-center gap-2 font-serif">
                  <Trophy size={16} className="text-brand-teal" /> Leaderboard
              </h3>
          </div>
          <div className="p-2 overflow-y-auto max-h-[500px]">
              <table className="w-full text-sm">
                  <tbody className="divide-y divide-brand-charcoal/5">
                      {standings.map((p, i) => (
                          <tr key={p.id} className="hover:bg-brand-navy/5 transition-colors">
                              <td className="py-3 px-3 w-8 font-mono text-brand-slate font-bold">{i + 1}</td>
                              <td className="py-3 px-3 font-bold text-brand-navy font-serif">{p.name}</td>
                              <td className="py-3 px-3 text-right font-bold text-brand-teal font-mono text-lg">{p.total}</td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </Card>

      {!compact && (
        <Card className="p-4">
          <h3 className="text-brand-navy font-bold mb-4 flex items-center gap-2 font-serif text-sm">
            <RotateCcw size={16} className="text-brand-teal" /> Voyage History
          </h3>
          <div className="space-y-3">
            {game.rounds.filter(r => r.player_stats?.length > 0).sort((a,b) => b.round_number - a.round_number).map(r => {
              const isExpanded = expandedRounds[r.round_number] || isGameCompleted;
              
              return (
                <div key={r.id} className="bg-brand-navy/5 rounded-xl border border-brand-charcoal/5 overflow-hidden transition-all">
                  <div 
                    onClick={() => !isGameCompleted && toggleRound(r.round_number)}
                    className={cn(
                      "flex items-center justify-between p-3 cursor-pointer hover:bg-brand-navy/10 transition-colors",
                      isGameCompleted && "cursor-default hover:bg-brand-navy/5"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-brand-navy font-serif">Round {r.round_number}</span>
                      {!isGameCompleted && (
                        <div className={cn("transition-transform duration-200", isExpanded ? "rotate-90" : "")}>
                          <ChevronRight size={14} className="text-brand-slate" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {/* Compact summary when collapsed */}
                      {!isExpanded && (
                        <div className="flex -space-x-1 items-center">
                          {r.player_stats.map(s => {
                            const success = s.bid === s.tricks_won;
                            return (
                              <div 
                                key={s.player_id}
                                title={`${game.players.find(p => p.id === s.player_id)?.name}: ${s.round_score} pts`}
                                className={cn(
                                  "w-5 h-5 rounded-full border border-white flex items-center justify-center text-[8px] font-bold text-white",
                                  success ? "bg-suit-green" : "bg-brand-oxblood"
                                )}
                              >
                                {s.round_score > 0 ? "+" : ""}{s.round_score}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onEditRound(r); }} className="text-brand-slate hover:text-brand-teal h-8 w-8 p-0">
                        <Edit size={14} />
                      </Button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-3 pb-3 pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                      <div className="grid grid-cols-1 gap-2">
                        {r.player_stats.map(s => {
                          const player = game.players.find(p => p.id === s.player_id);
                          const success = s.bid === s.tricks_won;
                          return (
                            <div key={s.player_id} className="flex items-center justify-between text-xs bg-white/50 p-2 rounded-lg border border-brand-charcoal/5">
                              <div className="flex items-center gap-2">
                                <div className={cn("w-2 h-2 rounded-full", success ? "bg-suit-green" : "bg-brand-oxblood")} />
                                <span className="font-bold text-brand-navy truncate max-w-[80px]">{player?.name}</span>
                              </div>
                              <div className="flex items-center gap-3 font-mono">
                                <div className="flex items-center gap-1 text-brand-slate">
                                  <span className="font-bold text-brand-navy">{s.tricks_won}</span>
                                  <span>/</span>
                                  <span>{s.bid}</span>
                                  <Target size={10} className="ml-0.5 opacity-50" />
                                </div>
                                {s.bonus_points > 0 && (
                                  <div className="text-suit-yellow font-bold">+{s.bonus_points}</div>
                                )}
                                <div className={cn("font-bold min-w-[30px] text-right", s.round_score >= 0 ? "text-suit-green" : "text-brand-oxblood")}>
                                  {s.round_score > 0 ? "+" : ""}{s.round_score}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
