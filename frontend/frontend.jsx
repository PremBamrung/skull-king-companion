import React, { useState, useEffect } from 'react';
import { 
  Skull, 
  Anchor, 
  Scroll, 
  Trophy, 
  Users, 
  ChevronRight, 
  Minus, 
  Plus, 
  HelpCircle, 
  X,
  Swords,
  Crown,
  Info,
  RotateCcw
} from 'lucide-react';

const Card = ({ children, className = "" }) => (
  <div className={`bg-slate-800/90 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-xl transition-all ${className}`}>
    {children}
  </div>
);

const Button = ({ onClick, children, variant = "primary", className = "", disabled = false }) => {
  const variants = {
    primary: "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 font-bold shadow-lg shadow-amber-900/20",
    secondary: "bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium border border-slate-600",
    danger: "bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50",
    ghost: "text-slate-400 hover:text-amber-400 hover:bg-slate-800/50"
  };
  
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`px-6 py-3 rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

// --- LOGIC HELPERS ---

const calculateScore = (bid, tricks, roundNumber, bonusPoints = 0) => {
  let score = 0;
  
  if (bid === 0) {
    if (tricks === 0) {
      score = 10 * roundNumber;
    } else {
      score = -10 * roundNumber;
    }
  } else {
    if (bid === tricks) {
      score = 20 * tricks;
      score += bonusPoints;
    } else {
      const diff = Math.abs(bid - tricks);
      score = -10 * diff;
    }
  }
  return score;
};

export default function SkullKingApp() {
  const [phase, setPhase] = useState('SETUP');
  const [round, setRound] = useState(1);
  const [players, setPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [currentBids, setCurrentBids] = useState({});
  const [currentTricks, setCurrentTricks] = useState({});
  const [currentBonuses, setCurrentBonuses] = useState({});
  const [showRules, setShowRules] = useState(false);
  const [history, setHistory] = useState([]);

  // --- ACTIONS ---

  const addPlayer = () => {
    if (newPlayerName.trim()) {
      setPlayers([...players, { 
        id: Date.now(), 
        name: newPlayerName.trim(), 
        totalScore: 0,
        scores: [] 
      }]);
      setNewPlayerName('');
    }
  };

  const removePlayer = (id) => {
    setPlayers(players.filter(p => p.id !== id));
  };

  const startGame = () => {
    if (players.length >= 2) {
      setPhase('BIDDING');
      setRound(1);
      setHistory([]);
      const resetPlayers = players.map(p => ({ ...p, totalScore: 0, scores: [] }));
      setPlayers(resetPlayers);
    }
  };

  const submitBids = () => {
    setPhase('PLAYING');
  };

  const submitRound = () => {
    const roundScores = {};
    const updatedPlayers = players.map(player => {
      const pid = player.id;
      const bid = currentBids[pid] || 0;
      const tricks = currentTricks[pid] || 0;
      const bonus = currentBonuses[pid] || 0;
      
      const roundScore = calculateScore(bid, tricks, round, bonus);
      roundScores[pid] = roundScore;

      return {
        ...player,
        totalScore: player.totalScore + roundScore,
        scores: [...player.scores, roundScore]
      };
    });

    setHistory([...history, { round, bids: {...currentBids}, tricks: {...currentTricks}, scores: roundScores }]);
    setPlayers(updatedPlayers);
    setCurrentBids({});
    setCurrentTricks({});
    setCurrentBonuses({});

    if (round >= 10) {
      setPhase('GAMEOVER');
    } else {
      setRound(round + 1);
      setPhase('BIDDING');
    }
  };

  const getTotalTricksEntered = () => {
    return Object.values(currentTricks).reduce((a, b) => a + b, 0);
  };

  const getLeader = () => {
    return [...players].sort((a, b) => b.totalScore - a.totalScore)[0];
  };

  // --- COMPONENT SECTIONS ---

  const RulesModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-amber-500/30 w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col">
        <div className="sticky top-0 bg-slate-900/95 p-6 border-b border-slate-700 flex justify-between items-center z-10">
          <h2 className="text-2xl font-bold text-amber-400 flex items-center gap-3">
            <Scroll size={24} /> Captain's Log
          </h2>
          <button onClick={() => setShowRules(false)} className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-lg transition-colors">
            <X size={24} />
          </button>
        </div>
        <div className="p-8 grid md:grid-cols-2 gap-8 text-slate-300">
          <section>
            <h3 className="text-amber-200 font-bold text-xl mb-4 flex items-center gap-2"><Crown size={18}/> Card Hierarchy</h3>
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-1">
                   <div className="w-3 h-3 rounded-full bg-green-500 ring-2 ring-slate-800"></div>
                   <div className="w-3 h-3 rounded-full bg-yellow-400 ring-2 ring-slate-800"></div>
                   <div className="w-3 h-3 rounded-full bg-purple-500 ring-2 ring-slate-800"></div>
                </div>
                <span className="flex-1"><strong>Suits (1-14):</strong> Green, Yellow, Purple</span>
              </div>
              <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-black border border-slate-500"></div><span className="flex-1"><strong>Trump:</strong> Jolly Roger (Black) beats colors</span></div>
              <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.5)]"></div><span className="flex-1"><strong>Mermaid:</strong> Beats numbers & Skull King</span></div>
              <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]"></div><span className="flex-1"><strong>Pirate:</strong> Beats numbers & Mermaid</span></div>
              <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]"></div><span className="flex-1"><strong>Skull King:</strong> Beats all except Mermaid</span></div>
              <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.3)]"></div><span className="flex-1"><strong>Escape:</strong> White Flag (Value 0)</span></div>
            </div>
          </section>

          <section>
            <h3 className="text-amber-200 font-bold text-xl mb-4 flex items-center gap-2"><Trophy size={18}/> Scoring</h3>
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 space-y-4">
              <div>
                <strong className="text-white text-lg block mb-1">Standard Bid (&gt; 0)</strong>
                <p className="text-sm">Exact: <span className="text-green-400 font-mono font-bold">+20</span> / trick</p>
                <p className="text-sm">Miss: <span className="text-red-400 font-mono font-bold">-10</span> / diff</p>
              </div>
              <div className="border-t border-slate-700/50 pt-3">
                <strong className="text-white text-lg block mb-1">The Zero Bid</strong>
                <p className="text-sm">Exact: <span className="text-green-400 font-mono font-bold">+10</span> × Round No.</p>
                <p className="text-sm">Miss: <span className="text-red-400 font-mono font-bold">-10</span> × Round No.</p>
              </div>
              <div className="border-t border-slate-700/50 pt-3">
                <strong className="text-white text-lg block mb-1">Bonuses</strong>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
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

  const Sidebar = () => (
    <div className="lg:col-span-1 space-y-6">
       {/* Round Status Card */}
       <Card className="p-6 border-amber-500/20 bg-slate-900/50">
          <h3 className="text-slate-400 text-sm uppercase tracking-wider font-bold mb-4">Current Voyage</h3>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-4xl font-bold text-amber-500">{round}</span>
            <span className="text-slate-500">/ 10</span>
          </div>
          <div className="text-sm text-slate-400 mb-6">Cards per player</div>
          
          {phase === 'PLAYING' && (
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <div className="flex justify-between text-sm mb-2 text-slate-400">
                <span>Tricks Accounted For</span>
              </div>
              <div className="flex items-center justify-between">
                 <span className={`text-2xl font-bold ${getTotalTricksEntered() === round ? 'text-green-400' : 'text-white'}`}>
                    {getTotalTricksEntered()}
                    <span className="text-slate-500 text-lg"> / {round}</span>
                 </span>
                 {getTotalTricksEntered() === round && <Crown size={20} className="text-green-400" />}
              </div>
              <div className="w-full bg-slate-700 h-2 rounded-full mt-3 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${getTotalTricksEntered() > round ? 'bg-red-500' : 'bg-amber-500'}`} 
                  style={{ width: `${Math.min((getTotalTricksEntered() / round) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
       </Card>

       {/* Leaderboard Card */}
       <Card className="flex-1 overflow-hidden flex flex-col bg-slate-900/50">
         <div className="p-4 border-b border-slate-800 bg-slate-900/80">
           <h3 className="text-amber-500 font-bold flex items-center gap-2">
             <Trophy size={16} /> Leaderboard
           </h3>
         </div>
         <div className="p-2 overflow-y-auto max-h-[500px]">
           <table className="w-full text-sm">
             <tbody className="divide-y divide-slate-800/50">
               {players.sort((a,b) => b.totalScore - a.totalScore).map((p, i) => (
                 <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                   <td className="py-3 px-3 w-8 font-mono text-slate-500">{i+1}</td>
                   <td className="py-3 px-3 font-medium text-slate-200">{p.name}</td>
                   <td className="py-3 px-3 text-right font-bold text-amber-400 font-mono">{p.totalScore}</td>
                 </tr>
               ))}
               {players.length === 0 && (
                 <tr>
                   <td colSpan="3" className="text-center py-8 text-slate-600 italic">No crew yet</td>
                 </tr>
               )}
             </tbody>
           </table>
         </div>
       </Card>

       {/* Action Buttons (Desktop Sidebar) */}
       <div className="hidden lg:block space-y-3">
         <Button variant="ghost" onClick={() => setShowRules(true)} className="w-full justify-start border border-slate-800">
            <HelpCircle size={18} /> View Rules
         </Button>
         {phase === 'GAMEOVER' && (
           <Button variant="secondary" onClick={startGame} className="w-full justify-start">
             <RotateCcw size={18} /> New Game
           </Button>
         )}
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500/30 pb-12">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black z-0 pointer-events-none" />
      <div className="fixed inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')] z-0 pointer-events-none" />

      {showRules && <RulesModal />}

      {/* Navbar */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              <Skull className="text-slate-900" size={24} strokeWidth={2.5} />
            </div>
            <h1 className="font-bold text-xl tracking-wider text-amber-500 hidden sm:block">SKULL KING <span className="text-slate-600 font-normal text-sm ml-2 tracking-normal">COMPANION APP</span></h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="lg:hidden text-right mr-2">
               {phase !== 'SETUP' && (
                 <p className="text-xs text-slate-400 font-mono">RD {round}</p>
               )}
            </div>
            <Button variant="ghost" onClick={() => setShowRules(true)} className="lg:hidden p-2">
              <HelpCircle size={24} />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 md:p-6 relative z-10">
        <div className="grid lg:grid-cols-4 gap-8 items-start">
          
          {/* Main Game Area */}
          <main className="lg:col-span-3 space-y-6">
            
            {phase === 'SETUP' && (
              <div className="max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pt-12">
                <Card className="p-8 text-center border-amber-500/20 mb-8 bg-gradient-to-b from-slate-800 to-slate-900">
                  <Skull size={48} className="mx-auto text-amber-500 mb-4 opacity-80" />
                  <h2 className="text-3xl font-bold text-amber-400 mb-2">Assemble The Crew</h2>
                  <p className="text-slate-400">Enter the names of all pirates daring to join this voyage.</p>
                </Card>

                <div className="flex gap-3 mb-6">
                  <input
                    type="text"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
                    placeholder="Enter pirate name..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-6 py-4 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-lg placeholder:text-slate-600 transition-all shadow-inner"
                    autoFocus
                  />
                  <Button onClick={addPlayer} className="w-20 shadow-none text-2xl pb-4">+</Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                  {players.map(player => (
                    <div key={player.id} className="flex items-center justify-between p-4 bg-slate-800 rounded-xl border border-slate-700 group hover:border-slate-600 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 font-bold text-sm shadow-inner">
                          {player.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-lg">{player.name}</span>
                      </div>
                      <button onClick={() => removePlayer(player.id)} className="text-slate-600 hover:text-red-400 p-2 hover:bg-slate-700/50 rounded-lg transition-colors">
                        <X size={20} />
                      </button>
                    </div>
                  ))}
                </div>

                <Button 
                  onClick={startGame} 
                  disabled={players.length < 2} 
                  className="w-full text-lg py-4 shadow-xl"
                >
                  Set Sail <Anchor size={20} />
                </Button>
              </div>
            )}

            {phase === 'BIDDING' && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between mb-6">
                   <h2 className="text-2xl font-bold text-amber-400 flex items-center gap-2">
                     <Swords className="text-slate-500" /> Bidding Phase
                   </h2>
                   <span className="text-slate-400 text-sm hidden sm:inline-block">Round {round}: Raise fingers on "Yo-Ho-Ho!"</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-24 lg:mb-0">
                  {players.map(player => {
                    const currentBid = currentBids[player.id] ?? 0;
                    return (
                      <Card key={player.id} className="p-5 flex flex-col gap-4 hover:border-amber-500/30 transition-colors">
                        <div className="font-bold text-lg text-slate-200 border-b border-slate-700/50 pb-2">{player.name}</div>
                        <div className="flex items-center justify-between gap-4 bg-slate-950/30 p-2 rounded-xl border border-slate-800 shadow-inner">
                          <button 
                            onClick={() => setCurrentBids({...currentBids, [player.id]: Math.max(0, currentBid - 1)})}
                            className="w-12 h-12 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white active:scale-95 transition-all border border-slate-700"
                          >
                            <Minus size={20} />
                          </button>
                          <span className={`flex-1 text-center text-3xl font-bold font-mono ${currentBid === 0 ? 'text-amber-500' : 'text-white'}`}>
                            {currentBid}
                          </span>
                          <button 
                            onClick={() => setCurrentBids({...currentBids, [player.id]: Math.min(round, currentBid + 1)})}
                            className="w-12 h-12 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white active:scale-95 transition-all border border-slate-700"
                          >
                            <Plus size={20} />
                          </button>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                {/* Floating Action Bar for Mobile/Desktop unification */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 lg:relative lg:bg-transparent lg:border-0 lg:p-0 lg:mt-8 z-20">
                  <div className="max-w-7xl mx-auto lg:flex lg:justify-end">
                    <Button onClick={submitBids} className="w-full lg:w-auto lg:px-12 text-lg">
                      Confirm Bids <Swords size={20} />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {phase === 'PLAYING' && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between mb-6">
                   <h2 className="text-2xl font-bold text-amber-400 flex items-center gap-2">
                     <Crown className="text-slate-500" /> Resolution Phase
                   </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-24 lg:mb-0">
                  {players.map(player => {
                    const tricks = currentTricks[player.id] ?? 0;
                    const bid = currentBids[player.id] ?? 0;
                    const bonus = currentBonuses[player.id] ?? 0;
                    const totalTricksEntered = getTotalTricksEntered();
                    // Lock adding tricks if total equals round
                    const canAddTrick = totalTricksEntered < round;
                    
                    return (
                      <Card key={player.id} className="p-5 space-y-4 hover:border-slate-600 transition-colors">
                        <div className="flex justify-between items-center border-b border-slate-700/50 pb-3">
                          <span className="font-bold text-xl text-slate-200">{player.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Bid</span>
                            <span className={`text-lg font-mono font-bold px-3 py-1 rounded bg-slate-900 border border-slate-700 ${bid === 0 ? 'text-amber-500' : 'text-slate-200'}`}>
                              {bid}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-[1fr_160px] gap-6">
                          <div className="flex flex-col justify-center">
                            <label className="text-xs text-slate-500 uppercase font-bold mb-2">Tricks Won</label>
                            <div className="flex items-center gap-3 bg-slate-950/30 p-2 rounded-xl border border-slate-800">
                               <button 
                                onClick={() => setCurrentTricks({...currentTricks, [player.id]: Math.max(0, tricks - 1)})}
                                className="w-12 h-12 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors border border-slate-700"
                              >
                                <Minus size={20} />
                              </button>
                              <span className={`flex-1 text-center font-bold text-3xl font-mono ${tricks === bid ? 'text-green-500' : 'text-slate-200'}`}>
                                {tricks}
                              </span>
                               <button 
                                onClick={() => setCurrentTricks({...currentTricks, [player.id]: Math.min(round, tricks + 1)})}
                                disabled={!canAddTrick}
                                className="w-12 h-12 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-slate-700"
                              >
                                <Plus size={20} />
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-col justify-center">
                             <label className="text-xs text-slate-500 uppercase font-bold mb-2">Bonus Pts</label>
                             <div className="flex items-center gap-2 bg-slate-950/30 p-2 rounded-xl border border-slate-800 h-[66px]">
                                <button 
                                  onClick={() => setCurrentBonuses({...currentBonuses, [player.id]: Math.max(0, bonus - 10)})}
                                  className="w-10 h-12 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors border border-slate-700 active:scale-95"
                                >
                                  <Minus size={16} />
                                </button>
                                <span className="flex-1 text-center font-bold text-xl font-mono text-amber-400">
                                  {bonus}
                                </span>
                                <button 
                                  onClick={() => setCurrentBonuses({...currentBonuses, [player.id]: bonus + 10})}
                                  className="w-10 h-12 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors border border-slate-700 active:scale-95"
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

                {/* Floating Action Bar */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 lg:relative lg:bg-transparent lg:border-0 lg:p-0 lg:mt-8 z-20">
                  <div className="max-w-7xl mx-auto lg:flex lg:justify-end">
                    <Button 
                      onClick={submitRound} 
                      disabled={getTotalTricksEntered() !== round}
                      className="w-full lg:w-auto lg:px-12 text-lg"
                    >
                      Finish Round {round} <ChevronRight size={20} />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {phase === 'GAMEOVER' && (
               <div className="text-center space-y-8 animate-in zoom-in duration-500 pt-12">
                 <div className="relative inline-block group">
                   <div className="absolute inset-0 bg-amber-500 blur-3xl opacity-20 rounded-full group-hover:opacity-30 transition-opacity"></div>
                   <Trophy size={120} className="text-amber-500 relative z-10 mx-auto drop-shadow-2xl" />
                 </div>
                 
                 <div>
                   <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">Captain of the Seas</h2>
                   <div className="text-3xl md:text-4xl text-amber-400 font-serif font-bold bg-slate-900/50 inline-block px-8 py-4 rounded-2xl border border-amber-500/30">
                     {getLeader()?.name}
                   </div>
                   <p className="text-slate-400 mt-4 text-xl">{getLeader()?.totalScore} Points</p>
                 </div>
               </div>
            )}

          </main>

          {/* Sidebar Area (Desktop: Right Column, Mobile: Hidden/Integrated) */}
          {phase !== 'SETUP' && (
            <aside className="hidden lg:block lg:sticky lg:top-24">
              <Sidebar />
            </aside>
          )}

        </div>
      </div>
    </div>
  );
}