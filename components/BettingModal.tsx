
import React, { useState } from 'react';
import { Match, Bet } from '../types';
import { X, Wallet, TrendingUp, CheckCircle2 } from 'lucide-react';

interface BettingModalProps {
  match: Match;
  balance: number;
  onClose: () => void;
  onPlaceBet: (bet: Bet) => void;
}

const BettingModal: React.FC<BettingModalProps> = ({ match, balance, onClose, onPlaceBet }) => {
  const [selectedOdd, setSelectedOdd] = useState<{ label: string; value: number } | null>(null);
  const [amount, setAmount] = useState<string>('10');
  const [placed, setPlaced] = useState(false);

  const handlePlaceBet = () => {
    if (!selectedOdd || parseFloat(amount) <= 0 || parseFloat(amount) > balance) return;

    const bet: Bet = {
      id: Math.random().toString(36).substr(2, 9),
      matchId: match.id,
      matchName: `${match.homeTeam} vs ${match.awayTeam}`,
      selection: selectedOdd.label,
      odds: selectedOdd.value,
      amount: parseFloat(amount),
      potentialWin: parseFloat(amount) * selectedOdd.value,
      timestamp: Date.now(),
    };

    onPlaceBet(bet);
    setPlaced(true);
    setTimeout(() => onClose(), 2000);
  };

  const potentialWin = selectedOdd ? (parseFloat(amount) || 0) * selectedOdd.value : 0;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-emerald-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-emerald-100 animate-in zoom-in-95 duration-300">
        <div className="bg-emerald-800 p-6 text-white flex justify-between items-center relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-lime-400 to-emerald-400"></div>
          <div>
            <h4 className="text-[10px] font-black text-lime-400 uppercase tracking-widest mb-1 flex items-center gap-2">
              <TrendingUp className="w-3 h-3" /> Virtual Betting Simulation
            </h4>
            <p className="font-bold text-lg">{match.homeTeam} - {match.awayTeam}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-emerald-700 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8">
          {placed ? (
            <div className="flex flex-col items-center py-12 text-center space-y-4">
              <div className="w-20 h-20 bg-lime-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 animate-bounce" />
              </div>
              <h3 className="text-2xl font-black text-emerald-900">Scommessa Piazzata!</h3>
              <p className="text-slate-500 font-medium">In bocca al lupo per la tua giocata virtuale.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Virtual Balance Header */}
              <div className="flex items-center justify-between bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                <span className="text-xs font-black text-emerald-800 uppercase flex items-center gap-2">
                  <Wallet className="w-4 h-4" /> Saldo Virtuale
                </span>
                <span className="text-xl font-black text-emerald-700">€{balance.toFixed(2)}</span>
              </div>

              {/* Odds Grid */}
              <div className="space-y-4">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Esito Finale 1X2</h5>
                <div className="grid grid-cols-3 gap-2">
                  <OddButton label="1" value={match.odds.home} selected={selectedOdd?.label === '1'} onClick={() => setSelectedOdd({ label: '1', value: match.odds.home })} />
                  <OddButton label="X" value={match.odds.draw} selected={selectedOdd?.label === 'X'} onClick={() => setSelectedOdd({ label: 'X', value: match.odds.draw })} />
                  <OddButton label="2" value={match.odds.away} selected={selectedOdd?.label === '2'} onClick={() => setSelectedOdd({ label: '2', value: match.odds.away })} />
                </div>

                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pt-2">Gol / No Gol</h5>
                <div className="grid grid-cols-2 gap-2">
                  <OddButton label="GOL" value={match.odds.gg || 1.85} selected={selectedOdd?.label === 'GOL'} onClick={() => setSelectedOdd({ label: 'GOL', value: match.odds.gg || 1.85 })} />
                  <OddButton label="NO GOL" value={match.odds.ng || 1.90} selected={selectedOdd?.label === 'NO GOL'} onClick={() => setSelectedOdd({ label: 'NO GOL', value: match.odds.ng || 1.90 })} />
                </div>
              </div>

              {/* Amount Selection */}
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Importo Scommessa</h5>
                  {parseFloat(amount) > balance && <span className="text-[10px] font-bold text-red-500 uppercase">Saldo insufficiente</span>}
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">€</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-8 pr-4 font-black text-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>

              {/* Potential Win Summary */}
              {selectedOdd && (
                <div className="bg-lime-50 p-4 rounded-2xl border border-lime-200 flex justify-between items-center animate-in slide-in-from-top-2">
                  <div className="text-[10px] font-black text-emerald-800 uppercase">Vincita Potenziale</div>
                  <div className="text-xl font-black text-emerald-700">€{potentialWin.toFixed(2)}</div>
                </div>
              )}

              <button
                disabled={!selectedOdd || parseFloat(amount) <= 0 || parseFloat(amount) > balance}
                onClick={handlePlaceBet}
                className="w-full bg-emerald-600 disabled:opacity-50 disabled:grayscale text-white font-black py-4 rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 uppercase tracking-widest text-sm"
              >
                Piazza Scommessa Virtuale
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const OddButton: React.FC<{ label: string; value: number; selected: boolean; onClick: () => void }> = ({ label, value, selected, onClick }) => (
  <button
    onClick={onClick}
    className={`flex-1 p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${
      selected 
        ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100' 
        : 'bg-white border-slate-100 text-slate-800 hover:border-emerald-300'
    }`}
  >
    <span className={`text-[10px] font-black uppercase ${selected ? 'text-emerald-100' : 'text-slate-400'}`}>{label}</span>
    <span className="font-mono font-black">{value.toFixed(2)}</span>
  </button>
);

export default BettingModal;
