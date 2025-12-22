
import React, { useState } from 'react';
import { Match } from '../types';
import { BrainCircuit, Star, Wallet, PlayCircle, Trophy } from 'lucide-react';

interface MatchCardProps {
  match: Match;
  showOdds?: boolean;
  onPredict?: (home: string, away: string) => void;
  onBet?: (match: Match) => void;
  onWatchLive?: (match: Match) => void;
  isFavoriteHome?: boolean;
  isFavoriteAway?: boolean;
  onToggleFavorite?: (teamName: string) => void;
}

const MatchCard: React.FC<MatchCardProps> = ({ 
  match, 
  showOdds, 
  onPredict, 
  onBet,
  onWatchLive,
  isFavoriteHome,
  isFavoriteAway,
  onToggleFavorite 
}) => {
  const [isPredictingLocal, setIsPredictingLocal] = useState(false);
  const isLive = match.status.toLowerCase().includes('live') || match.status.toLowerCase().includes('in corso');
  const isFavoriteMatch = isFavoriteHome || isFavoriteAway;

  const handlePredictClick = () => {
    if (!onPredict) return;
    setIsPredictingLocal(true);
    onPredict(match.homeTeam, match.awayTeam);
    
    // Reset animation after 1.5 seconds for visual feedback
    setTimeout(() => {
      setIsPredictingLocal(false);
    }, 1500);
  };

  return (
    <div className={`bg-white rounded-3xl shadow-sm border p-5 hover:shadow-xl transition-all relative overflow-hidden group ${
      isFavoriteMatch 
        ? 'ring-2 ring-amber-400 border-amber-100 bg-amber-50/20 shadow-amber-100' 
        : 'border-green-100'
    }`}>
      {/* Background decoration */}
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full -mr-12 -mt-12 transition-colors ${
        isFavoriteMatch ? 'bg-amber-100/50' : 'bg-green-50 group-hover:bg-green-100'
      }`}></div>

      <div className="flex justify-between items-center mb-6 relative z-10">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-widest border flex items-center gap-1.5 ${
            isFavoriteMatch 
              ? 'bg-amber-400 text-white border-amber-500' 
              : 'bg-emerald-50 text-emerald-700 border-emerald-100'
          }`}>
            {isFavoriteMatch && <Star className="w-3 h-3 fill-current animate-pulse" />}
            {match.league}
          </span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 ${
          isLive
            ? 'bg-red-50 text-red-600 animate-pulse border border-red-100' 
            : 'bg-slate-100 text-slate-500 border border-slate-200'
        }`}>
          {isLive && <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>}
          {match.status}
        </span>
      </div>

      <div className="grid grid-cols-3 items-center text-center gap-2 relative z-10 mb-6">
        <TeamDisplay 
            name={match.homeTeam} 
            isFavorite={isFavoriteHome || false} 
            onToggle={() => onToggleFavorite?.(match.homeTeam)} 
        />

        <div className="flex flex-col items-center">
          <p className="text-3xl font-black text-slate-800 tracking-tighter">{match.score}</p>
          <div className="mt-1 px-2 py-0.5 bg-slate-50 rounded text-[9px] text-slate-400 font-bold uppercase">
            {match.time || 'Orario'}
          </div>
        </div>

        <TeamDisplay 
            name={match.awayTeam} 
            isFavorite={isFavoriteAway || false} 
            onToggle={() => onToggleFavorite?.(match.awayTeam)} 
        />
      </div>

      <div className="flex items-center justify-between gap-3 relative z-10">
        <div className="flex flex-col gap-2 flex-1">
          {isLive && onWatchLive && (
            <button 
              onClick={() => onWatchLive(match)}
              className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black py-2 rounded-xl transition-all shadow-md shadow-red-100 uppercase"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              Guarda Live
            </button>
          )}
          {onPredict && (
            <button 
              onClick={handlePredictClick}
              disabled={isPredictingLocal}
              className={`flex items-center justify-center gap-2 text-white text-[10px] font-black py-2 rounded-xl transition-all shadow-md uppercase ${
                isPredictingLocal ? 'bg-emerald-900 scale-[0.98]' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100'
              }`}
            >
              <BrainCircuit className={`w-3.5 h-3.5 transition-all ${isPredictingLocal ? 'animate-brain-pulse text-lime-400' : ''}`} />
              IA Predict
            </button>
          )}
          {onBet && (
            <button 
              onClick={() => onBet(match)}
              className="flex items-center justify-center gap-2 bg-lime-400 hover:bg-lime-500 text-emerald-900 text-[10px] font-black py-2 rounded-xl transition-all shadow-md shadow-lime-100 uppercase"
            >
              <Wallet className="w-3.5 h-3.5" />
              Bet Sim
            </button>
          )}
        </div>

        {showOdds && match.odds && (
          <div className="flex gap-1.5 flex-[2]">
            <OddBox label="1" value={match.odds.home} onClick={() => onBet?.(match)} />
            <OddBox label="X" value={match.odds.draw} onClick={() => onBet?.(match)} />
            <OddBox label="2" value={match.odds.away} onClick={() => onBet?.(match)} />
          </div>
        )}
      </div>
      
      {isFavoriteMatch && (
        <div className="absolute -bottom-1 -right-1 opacity-10 rotate-12">
          <Trophy className="w-16 h-16 text-amber-500" />
        </div>
      )}
    </div>
  );
};

const TeamDisplay: React.FC<{ name: string; isFavorite: boolean; onToggle: () => void }> = ({ name, isFavorite, onToggle }) => (
  <div className="flex flex-col items-center group/team">
    <div className="relative">
        <div className={`w-14 h-14 bg-gradient-to-br from-slate-50 to-green-50 rounded-2xl flex items-center justify-center mb-3 shadow-inner border group-hover/team:scale-110 transition-transform ${
          isFavorite ? 'border-amber-200 shadow-amber-50' : 'border-slate-100'
        }`}>
           <img src={`https://avatar.vercel.sh/${name}?size=60`} alt={name} className="w-10 h-10 rounded-lg" />
        </div>
        <button 
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            className={`absolute -top-1 -right-1 p-1 rounded-full shadow-sm border transition-all ${
                isFavorite ? 'bg-amber-400 border-amber-500 text-white scale-110' : 'bg-white border-slate-200 text-slate-300 hover:text-amber-400'
            }`}
        >
            <Star className={`w-3 h-3 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
    </div>
    <p className={`text-[10px] font-black uppercase truncate w-full px-1 ${
      isFavorite ? 'text-amber-700' : 'text-slate-700'
    }`}>{name}</p>
  </div>
);

const OddBox: React.FC<{ label: string; value: number; onClick?: () => void }> = ({ label, value, onClick }) => (
  <div 
    onClick={onClick}
    className="flex-1 bg-white rounded-xl p-2 text-center border border-slate-100 hover:border-emerald-300 transition-colors cursor-pointer group"
  >
    <p className="text-[9px] text-slate-400 group-hover:text-emerald-500 font-black mb-0.5">{label}</p>
    <p className="text-xs font-mono font-black text-slate-700">{value.toFixed(2)}</p>
  </div>
);

export default MatchCard;
