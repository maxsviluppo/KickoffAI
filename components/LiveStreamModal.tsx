
import React, { useState, useEffect } from 'react';
import { Match } from '../types';
import { X, Play, Pause, Volume2, VolumeX, Settings, Maximize, User, MessageCircle, Activity, Signal } from 'lucide-react';

interface LiveStreamModalProps {
  match: Match;
  onClose: () => void;
}

const LiveStreamModal: React.FC<LiveStreamModalProps> = ({ match, onClose }) => {
  const [viewers, setViewers] = useState(Math.floor(Math.random() * 50000) + 10000);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setViewers(prev => prev + (Math.random() > 0.5 ? 12 : -8));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-0 md:p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-slate-900 w-full max-w-6xl h-full md:h-auto md:aspect-video rounded-none md:rounded-[3rem] shadow-2xl flex flex-col md:flex-row overflow-hidden border border-white/10 relative">
        
        {/* Close Button Mobile */}
        <button onClick={onClose} className="absolute top-4 right-4 z-[160] p-3 bg-black/50 text-white rounded-full md:hidden">
          <X className="w-6 h-6" />
        </button>

        {/* Video Player Section */}
        <div className="flex-1 bg-black relative flex flex-col group overflow-hidden">
          
          {/* Simulated Video Placeholder */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 via-black to-slate-950 flex items-center justify-center overflow-hidden">
            <div className={`absolute inset-0 transition-opacity duration-700 ${isPlaying ? 'opacity-20' : 'opacity-10 backdrop-blur-sm'}`}>
                <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] from-emerald-500 animate-pulse"></div>
            </div>
            
            <div className="flex flex-col items-center gap-6 relative z-10">
               {!isPlaying && (
                 <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20 backdrop-blur-sm animate-in fade-in">
                    <div className="flex flex-col items-center gap-2">
                       <Pause className="w-16 h-16 text-white opacity-50" />
                       <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Stream Paused</span>
                    </div>
                 </div>
               )}

               <div className={`w-24 h-24 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20 transition-transform ${isPlaying ? 'animate-bounce' : 'scale-90 opacity-50'}`}>
                  {isPlaying ? (
                    <Play className="w-10 h-10 text-white fill-current translate-x-1" />
                  ) : (
                    <Pause className="w-10 h-10 text-white fill-current" />
                  )}
               </div>
               <div className="text-center">
                  <h4 className="text-white text-xl font-black uppercase tracking-tighter mb-1">Feed Canale {isPlaying ? 'Sincronizzato' : 'Pausato'}</h4>
                  <p className="text-emerald-400 text-xs font-bold flex items-center gap-2 justify-center">
                    <Signal className={`w-3 h-3 ${isPlaying ? 'animate-pulse' : 'text-slate-500'}`} /> 
                    {isPlaying ? 'Crittografia AI 256-bit attiva' : 'Streaming in attesa...'}
                  </p>
               </div>
            </div>

            {/* Simulated Watermark */}
            <div className="absolute bottom-20 left-8 opacity-40">
                <p className="text-[10px] text-white font-black tracking-widest uppercase flex items-center gap-2">
                    <Activity className="w-3 h-3 text-lime-400" /> KickOff AI TV - FEED #{match.id.slice(0,3).toUpperCase()}
                </p>
            </div>
          </div>

          {/* Player Overlays */}
          <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-30">
            <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-6">
                    <button 
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="hover:text-emerald-400 transition-colors"
                    >
                      {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                    </button>
                    <button 
                      onClick={() => setIsMuted(!isMuted)}
                      className="hover:text-emerald-400 transition-colors"
                    >
                      {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                    <div className="text-xs font-mono font-bold tracking-wider">LIVE • {match.status}</div>
                </div>
                <div className="flex items-center gap-6">
                    <button className="hover:text-emerald-400 transition-colors"><Settings className="w-5 h-5" /></button>
                    <button className="hover:text-emerald-400 transition-colors"><Maximize className="w-5 h-5" /></button>
                </div>
            </div>
            <div className="mt-4 h-1 bg-white/20 rounded-full overflow-hidden">
                <div className={`h-full bg-red-600 transition-all duration-300 ${isPlaying ? 'w-full animate-pulse' : 'w-1/2 opacity-30'}`}></div>
            </div>
          </div>

          {/* Scoreboard Floating */}
          <div className="absolute top-6 left-6 p-4 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 flex items-center gap-6 z-30">
             <div className="flex items-center gap-3">
                <img src={`https://avatar.vercel.sh/${match.homeTeam}?size=32`} className="w-6 h-6 rounded-lg" alt="" />
                <span className="text-sm font-black text-white uppercase">{match.homeTeam}</span>
             </div>
             <div className="bg-white/10 px-3 py-1 rounded-lg text-lg font-black text-white font-mono">
                {match.score}
             </div>
             <div className="flex items-center gap-3">
                <span className="text-sm font-black text-white uppercase">{match.awayTeam}</span>
                <img src={`https://avatar.vercel.sh/${match.awayTeam}?size=32`} className="w-6 h-6 rounded-lg" alt="" />
             </div>
          </div>

          {/* LIVE Badge */}
          <div className="absolute top-6 right-6 flex items-center gap-3 z-30">
             <div className="bg-red-600 px-3 py-1 rounded-lg text-[10px] font-black text-white flex items-center gap-2 animate-pulse">
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                LIVE
             </div>
             <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-black text-white flex items-center gap-2 border border-white/10">
                <User className="w-3 h-3 text-emerald-400" />
                {viewers.toLocaleString()}
             </div>
          </div>
        </div>

        {/* Sidebar Chat/Stats Section */}
        <div className="w-full md:w-80 bg-slate-900 flex flex-col border-l border-white/10">
          <div className="p-6 border-b border-white/10 flex justify-between items-center">
            <div className="flex flex-col">
               <h5 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                   <MessageCircle className="w-4 h-4 text-emerald-400" /> Chat Live
               </h5>
               <span className="text-[8px] font-bold text-emerald-500/50 uppercase">Moderazione IA attiva</span>
            </div>
            <button onClick={onClose} className="hidden md:block text-white/40 hover:text-white transition-colors">
                <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-[300px] md:max-h-none scrollbar-hide">
            <ChatMessage user="AI_Analyst" msg="Statistiche in tempo reale: possesso palla 54% - 46%" color="text-emerald-400" />
            <ChatMessage user="KickOffBot" msg={`Streaming sincronizzato per ${match.homeTeam} vs ${match.awayTeam}`} color="text-lime-400" />
            <ChatMessage user="UltraTifoso" msg="Che partita incredibile! ⚽⚽⚽" />
            <ChatMessage user="BetMaster" msg="Ho giocato la vittoria casa, l'IA Predict sembrava sicura." />
            <ChatMessage user="Scommettitore_99" msg="Qualcuno ha visto le quote live? Sono impazzite." />
            <ChatMessage user="SportLover" msg="Il portiere sta parando tutto oggi!" />
          </div>
          <div className="p-4 border-t border-white/10">
            <div className="relative">
                <input 
                    type="text" 
                    placeholder="Invia un messaggio..." 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-white/20"
                />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ChatMessage: React.FC<{ user: string, msg: string, color?: string }> = ({ user, msg, color = "text-white/60" }) => (
    <div className="flex flex-col animate-in slide-in-from-bottom-1">
        <span className={`text-[10px] font-black uppercase tracking-wider ${color}`}>{user}</span>
        <p className="text-xs text-white/90 font-medium leading-tight">{msg}</p>
    </div>
);

export default LiveStreamModal;
