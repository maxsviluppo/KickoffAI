
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Layout from './components/Layout';
import MatchCard from './components/MatchCard';
import BettingModal from './components/BettingModal';
import LiveStreamModal from './components/LiveStreamModal';
import { fetchSoccerData, getMatchPrediction, getHistoricalAnalysis } from './services/geminiService';
import { SportsData, Tab, Standing, AIPrediction, Match, Bet, AppNotification, HistoricalSnapshot } from './types';
import { 
  RefreshCw, Trophy, BrainCircuit, X, Star, Sparkles, ChevronRight, MapPin, ShieldCheck, Volume2, AlertTriangle, ExternalLink, Search, Filter, SlidersHorizontal, Radio, Receipt, Clock, Timer, Mail, Info, Key, Lock
} from 'lucide-react';

const SOCCER_TIPS = [
  "L'IA analizza oltre 50 parametri per ogni match.",
  "La geolocalizzazione sbloccata permette analisi sul meteo locale degli stadi.",
  "System Test AI: Il motore di ricerca è ora in modalità estesa.",
  "Gemini usa Google Search per dati real-time.",
  "Sapevi che il recupero dei dati può richiedere fino a 30s?",
  "La modalità Deep Analysis attiva il 'pensiero' dell'IA."
];

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

interface SearchAndFilterProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  selectedLeague: string;
  setSelectedLeague: (val: string) => void;
  liveOnly: boolean;
  setLiveOnly: (val: boolean) => void;
  activeTab: Tab;
  leagues: string[];
}

const SearchAndFilterControls: React.FC<SearchAndFilterProps> = ({
  searchTerm,
  setSearchTerm,
  selectedLeague,
  setSelectedLeague,
  liveOnly,
  setLiveOnly,
  activeTab,
  leagues
}) => (
  <div className="flex flex-col md:flex-row gap-4 mb-8">
    <div className="flex-1 flex gap-3">
      <div className="flex-1 relative group">
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-emerald-400 group-focus-within:text-lime-500 transition-colors" />
        </div>
        <input 
          type="text" 
          placeholder="Cerca squadra o competizione..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border-2 border-emerald-50 rounded-2xl py-4 pl-14 pr-12 font-bold text-slate-800 focus:outline-none focus:border-lime-400 shadow-sm transition-all text-sm"
        />
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm('')}
            className="absolute inset-y-0 right-4 flex items-center text-slate-300 hover:text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      {activeTab === Tab.LIVE && (
        <button 
          onClick={() => setLiveOnly(!liveOnly)}
          className={`px-5 rounded-2xl font-black text-[10px] uppercase tracking-wider flex items-center gap-2 transition-all border-2 ${
            liveOnly 
              ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-200 animate-pulse' 
              : 'bg-white border-emerald-50 text-slate-400 hover:border-red-200 hover:text-red-500'
          }`}
        >
          <Radio className={`w-4 h-4 ${liveOnly ? 'animate-bounce' : ''}`} />
          Live
        </button>
      )}
    </div>
    <div className="md:w-64 relative">
      <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
        <Filter className="w-4 h-4 text-emerald-400" />
      </div>
      <select 
        value={selectedLeague}
        onChange={(e) => setSelectedLeague(e.target.value)}
        className="w-full bg-white border-2 border-emerald-50 rounded-2xl py-4 pl-12 pr-6 font-bold text-slate-800 focus:outline-none focus:border-lime-400 shadow-sm appearance-none transition-all text-sm"
      >
        <option value="All">Tutte le Leghe</option>
        {leagues.map(l => <option key={l} value={l}>{l}</option>)}
      </select>
      <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none">
        <SlidersHorizontal className="w-3 h-3 text-emerald-300" />
      </div>
    </div>
  </div>
);

const TeamPerformanceCard: React.FC<{ team: string, standing?: Standing }> = ({ team, standing }) => {
  const form = standing?.formSequence || ['W', 'D', 'L', 'W', 'W']; 
  const chartData = useMemo(() => {
    const pointsMap = { 'W': 3, 'D': 1, 'L': 0 };
    return form.map(res => pointsMap[res] || 0);
  }, [form]);

  const width = 120;
  const height = 40;
  const padding = 5;
  const points = useMemo(() => {
    const step = (width - padding * 2) / (chartData.length - 1);
    return chartData.map((val, i) => {
      const x = padding + i * step;
      const y = height - padding - (val / 3) * (height - padding * 2);
      return `${x},${y}`;
    }).join(' ');
  }, [chartData]);

  return (
    <div className="bg-white rounded-[2rem] p-6 border border-emerald-50 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center">
          <img src={`https://avatar.vercel.sh/${team}?size=40`} alt={team} className="w-8 h-8 rounded-md" />
        </div>
        <div className="flex-1">
          <h4 className="font-black text-slate-800 uppercase text-xs tracking-tight">{team}</h4>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] font-bold text-emerald-600">Pos. #{standing?.rank || '-'}</span>
            <span className="text-[10px] font-bold text-slate-400">• {standing?.points || '-'} Pts</span>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Analisi Trend IA</p>
        <div className="relative h-14 w-full flex items-center justify-center bg-emerald-50/30 rounded-xl border border-emerald-50/50">
           <svg width="100%" height="40" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
              <polyline fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
              {chartData.map((val, i) => {
                const step = (width - padding * 2) / (chartData.length - 1);
                const x = padding + i * step;
                const y = height - padding - (val / 3) * (height - padding * 2);
                return <circle key={i} cx={x} cy={y} r="3" className={`${val === 3 ? 'fill-emerald-600' : val === 1 ? 'fill-slate-400' : 'fill-red-500'}`} />;
              })}
           </svg>
        </div>
        <div className="flex justify-between mt-1 px-1">
          {form.map((res, i) => (
            <span key={i} className={`text-[8px] font-black ${res === 'W' ? 'text-emerald-600' : res === 'D' ? 'text-slate-400' : 'text-red-500'}`}>{res}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.LIVE);
  const [historySubTab, setHistorySubTab] = useState<'snapshots' | 'bets'>('snapshots');
  const [data, setData] = useState<SportsData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isQuotaExhausted, setIsQuotaExhausted] = useState<boolean>(false);
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);
  const [thinkingMode, setThinkingMode] = useState<boolean>(false);
  const [currentTip, setCurrentTip] = useState(0);
  const [retryWithNoSearch, setRetryWithNoSearch] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [refreshCountdown, setRefreshCountdown] = useState<number>(60);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeague, setSelectedLeague] = useState('All');
  const [liveOnly, setLiveOnly] = useState(false);

  const checkApiKeyStatus = useCallback(async () => {
    if (window.aistudio) {
      const selected = await window.aistudio.hasSelectedApiKey();
      setHasApiKey(selected);
      return selected;
    }
    return true;
  }, []);

  useEffect(() => {
    checkApiKeyStatus();
  }, [checkApiKeyStatus]);

  const [history, setHistory] = useState<HistoricalSnapshot[]>(() => {
    try {
      const saved = localStorage.getItem('kickoff_history');
      return saved ? (JSON.parse(saved) as HistoricalSnapshot[]) : [];
    } catch { return []; }
  });

  const [betHistory, setBetHistory] = useState<Bet[]>(() => {
    try {
      const saved = localStorage.getItem('kickoff_bet_history');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [historicalAnalysis, setHistoricalAnalysis] = useState<string | null>(null);
  const [isAnalyzingHistory, setIsAnalyzingHistory] = useState(false);
  const [selectedHistoricalData, setSelectedHistoricalData] = useState<HistoricalSnapshot | null>(null);

  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('kickoff_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  const [balance, setBalance] = useState<number>(() => {
    const saved = localStorage.getItem('kickoff_balance');
    return saved ? parseFloat(saved) : 1000.00;
  });

  const [activeNotifications, setActiveNotifications] = useState<AppNotification[]>([]);
  const [predicting, setPredicting] = useState(false);
  const [prediction, setPrediction] = useState<AIPrediction | null>(null);
  const [predictModalMatch, setPredictModalMatch] = useState<{home: string, away: string} | null>(null);
  const [bettingMatch, setBettingMatch] = useState<Match | null>(null);
  const [streamingMatch, setStreamingMatch] = useState<Match | null>(null);

  const saveToHistory = useCallback((newData: SportsData) => {
    setHistory(prev => {
      const snapshot: HistoricalSnapshot = {
        id: Math.random().toString(36).substring(7),
        timestamp: new Date().toLocaleString('it-IT'),
        data: newData
      };
      const updatedHistory = [snapshot, ...prev].slice(0, 20); 
      localStorage.setItem('kickoff_history', JSON.stringify(updatedHistory));
      return updatedHistory;
    });
  }, []);

  const addNotification = useCallback((title: string, message: string, type: AppNotification['type']) => {
    const newNotif: AppNotification = {
      id: Math.random().toString(36).substring(7),
      title,
      message,
      type,
      timestamp: Date.now()
    };
    setActiveNotifications(prev => [newNotif, ...prev].slice(0, 3));
    setTimeout(() => {
      setActiveNotifications(prev => prev.filter(n => n.id !== newNotif.id));
    }, 6000);
  }, []);

  const handleOpenApiKeyDialog = async () => {
    try {
      if (window.aistudio) {
        await window.aistudio.openSelectKey();
        // Assume success and proceed per evitare race condition
        setHasApiKey(true);
        setIsQuotaExhausted(false);
        setError(null);
        setTimeout(() => loadData(true), 1500);
      }
    } catch (err) {
      addNotification("Errore", "Impossibile caricare il selettore.", "info");
    }
  };

  const loadData = useCallback(async (isInitial = false, forceNoSearch = false, isSilent = false) => {
    if ((loading || isRefreshing) && !isInitial) return;
    
    if (!isSilent) {
      const keyOk = await checkApiKeyStatus();
      if (!keyOk) return;
    }

    if (isSilent) setIsRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const result = await fetchSoccerData(thinkingMode, !forceNoSearch && !retryWithNoSearch, location);
      if (!result || !result.matches) throw new Error("Risposta vuota");
      
      setData(result);
      saveToHistory(result);
      setError(null);
      setIsQuotaExhausted(false);
      setRetryWithNoSearch(false);
    } catch (err: any) {
      console.error("Critical Load Error:", err);
      const errorStr = JSON.stringify(err);
      const is429 = errorStr.includes("429") || errorStr.includes("RESOURCE_EXHAUSTED");
      
      if (is429) {
        setIsQuotaExhausted(true);
        setHasApiKey(false); 
        setError("Quota API Gemini Esaurita. Seleziona una chiave API personale con fatturazione attiva (Pay-as-you-go).");
        addNotification("Errore Sistema", "Quota API esaurita.", "info");
      } else {
        setError("Errore IA. Verifica la tua configurazione API Key.");
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [thinkingMode, saveToHistory, retryWithNoSearch, location, loading, isRefreshing, addNotification, checkApiKeyStatus]);

  useEffect(() => {
    if (hasApiKey) loadData(true);
  }, [thinkingMode, location, loadData, hasApiKey]);

  const toggleFavorite = (team: string) => {
    setFavorites(prev => {
      const newFavs = prev.includes(team) ? prev.filter(t => t !== team) : [...prev, team];
      localStorage.setItem('kickoff_favorites', JSON.stringify(newFavs));
      return newFavs;
    });
  };

  const leagues = useMemo(() => {
    if (!data) return [];
    const matchLeagues = data.matches.map(m => m.league);
    const standingLeagues = Object.keys(data.standings);
    return Array.from(new Set([...matchLeagues, ...standingLeagues])).sort();
  }, [data]);

  const filteredStandings = useMemo(() => {
    if (!data) return {};
    const filtered: Record<string, Standing[]> = {};
    (Object.entries(data.standings) as [string, Standing[]][]).forEach(([league, teams]) => {
      const leagueMatchesFilter = selectedLeague === 'All' || league === selectedLeague;
      const filteredTeams = teams.filter(t => t.team.toLowerCase().includes(searchTerm.toLowerCase()));
      if (leagueMatchesFilter && filteredTeams.length > 0) {
        filtered[league] = filteredTeams;
      }
    });
    return filtered;
  }, [data, searchTerm, selectedLeague]);

  const filteredMatches = useMemo(() => {
    if (!data) return [];
    return data.matches.filter(m => {
      const matchesSearch = m.homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) || m.awayTeam.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLeague = selectedLeague === 'All' || m.league === selectedLeague;
      const isMatchLive = m.status.toLowerCase().includes('live') || m.status.toLowerCase().includes('in corso');
      return matchesSearch && matchesLeague && (!liveOnly || isMatchLive);
    });
  }, [data, searchTerm, selectedLeague, liveOnly]);

  const handlePredict = async (home: string, away: string) => {
    setPredictModalMatch({ home, away });
    setPredicting(true);
    try {
      const res = await getMatchPrediction(home, away, thinkingMode);
      setPrediction(res);
    } catch (err: any) {
      setPrediction({ prediction: "N/D", confidence: "0%", analysis: "Verifica quota API." });
    } finally {
      setPredicting(false);
    }
  };

  const handlePlaceBet = (bet: Bet) => {
    setBalance(prev => {
      const newBalance = prev - bet.amount;
      localStorage.setItem('kickoff_balance', newBalance.toString());
      return newBalance;
    });
    setBetHistory(prev => {
      const newHist = [bet, ...prev];
      localStorage.setItem('kickoff_bet_history', JSON.stringify(newHist));
      return newHist;
    });
    addNotification("Scommessa", `€${bet.amount} su ${bet.matchName}`, 'info');
  };

  const renderContent = () => {
    if (!hasApiKey && !loading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-in fade-in zoom-in-95">
           <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-8 ${isQuotaExhausted ? 'bg-red-100' : 'bg-emerald-100'}`}>
              {isQuotaExhausted ? <AlertTriangle className="w-12 h-12 text-red-600 animate-pulse" /> : <Lock className="w-12 h-12 text-emerald-600" />}
           </div>
           <h2 className="text-3xl font-black text-emerald-950 mb-4 tracking-tighter uppercase">
             {isQuotaExhausted ? "Quota Esaurita" : "Configurazione API Key"}
           </h2>
           <p className="text-slate-600 max-w-md mb-10 leading-relaxed font-medium">
             Per accedere ai dati live e alle analisi IA, collega la tua chiave API Gemini personale tramite il selettore ufficiale. Se la quota è esaurita, usa un progetto GCP con fatturazione attiva.
           </p>
           <div className="flex flex-col gap-4 w-full max-w-xs">
              <button 
                onClick={handleOpenApiKeyDialog}
                className="bg-emerald-600 text-white font-black py-5 rounded-[2.5rem] shadow-2xl shadow-emerald-200 hover:bg-emerald-700 transition-all uppercase text-sm tracking-widest flex items-center justify-center gap-3 active:scale-95"
              >
                <Key className="w-6 h-6" /> Seleziona API Key
              </button>
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <a 
                  href="https://ai.google.dev/gemini-api/docs/billing" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[11px] font-black text-emerald-600 uppercase tracking-widest hover:underline flex items-center justify-center gap-2"
                >
                  <Info className="w-4 h-4" /> Info Fatturazione API
                </a>
              </div>
           </div>
        </div>
      );
    }

    if (loading && !data) {
      return (
        <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in">
          <div className="relative mb-12">
            <div className="w-28 h-28 border-[12px] border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
                <ShieldCheck className="w-12 h-12 text-emerald-600 animate-pulse" />
            </div>
          </div>
          <h3 className="text-3xl font-black text-emerald-950 mb-6 italic tracking-tighter">Sincronizzazione Live...</h3>
        </div>
      );
    }

    switch (activeTab) {
      case Tab.LIVE:
        return (
          <div className="space-y-6 animate-in fade-in">
            <SearchAndFilterControls searchTerm={searchTerm} setSearchTerm={setSearchTerm} selectedLeague={selectedLeague} setSelectedLeague={setSelectedLeague} liveOnly={liveOnly} setLiveOnly={setLiveOnly} activeTab={activeTab} leagues={leagues} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredMatches.map(m => (
                <MatchCard key={m.id} match={m} onPredict={handlePredict} onBet={setBettingMatch} onWatchLive={setStreamingMatch} isFavoriteHome={favorites.includes(m.homeTeam)} isFavoriteAway={favorites.includes(m.awayTeam)} onToggleFavorite={toggleFavorite} showOdds={true} />
              ))}
            </div>
          </div>
        );
      case Tab.STANDINGS:
        return (
          <div className="space-y-6 animate-in fade-in">
            <SearchAndFilterControls searchTerm={searchTerm} setSearchTerm={setSearchTerm} selectedLeague={selectedLeague} setSelectedLeague={setSelectedLeague} liveOnly={liveOnly} setLiveOnly={setLiveOnly} activeTab={activeTab} leagues={leagues} />
            {(Object.entries(filteredStandings) as [string, Standing[]][]).map(([league, teams]) => (
                <div key={league} className="bg-white rounded-[2.5rem] shadow-sm border border-emerald-50 overflow-hidden mb-8">
                  <div className="bg-emerald-900 text-white p-6 font-black text-xs uppercase tracking-widest flex justify-between items-center">
                    <span>{league}</span><Trophy className="w-5 h-5 text-lime-400" />
                  </div>
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-black uppercase text-[10px]">
                      <tr><th className="p-6">Pos</th><th className="p-6">Squadra</th><th className="p-6 text-center">Pts</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {teams.map(t => (
                        <tr key={t.team} className="hover:bg-emerald-50/50 transition-colors">
                          <td className="p-6 font-bold text-emerald-600">#{t.rank}</td>
                          <td className="p-6 font-black text-slate-800">{t.team}</td>
                          <td className="p-6 text-center font-mono font-bold">{t.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
          </div>
        );
      case Tab.SETTINGS:
        return (
          <div className="space-y-10 animate-in fade-in">
             <div className="bg-white rounded-[3rem] shadow-xl border border-emerald-50 p-12 space-y-8">
                <div className="bg-emerald-50 p-8 rounded-[2rem] border border-emerald-100 flex flex-col items-center text-center space-y-4">
                    <Key className="w-12 h-12 text-emerald-600" />
                    <h3 className="text-xl font-black uppercase tracking-tight">API Key Pro / Test</h3>
                    <p className="text-sm text-slate-600 max-w-sm">Collega la tua chiave personale per sbloccare i limiti di quota e analizzare i dati live senza interruzioni.</p>
                    <button onClick={handleOpenApiKeyDialog} className="px-8 py-4 bg-emerald-600 text-white font-black rounded-2xl uppercase text-xs tracking-widest shadow-xl shadow-emerald-200">Modifica Chiave API</button>
                </div>
                <div className="flex justify-center pt-8 border-t border-slate-100">
                   {/* FIX: Avoid using logical OR on void expressions like localStorage.clear() */}
                   <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="text-red-500 font-black text-[10px] uppercase flex items-center gap-2 hover:bg-red-50 px-4 py-2 rounded-xl transition-colors"><RefreshCw className="w-3 h-3" /> Reset Cache</button>
                </div>
             </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} lastUpdated={data?.lastUpdated} balance={balance}>
      <div className="fixed top-24 right-6 z-[200] space-y-3 max-w-[280px]">
        {activeNotifications.map(n => (
          <div key={n.id} className="p-4 rounded-[2rem] shadow-2xl bg-white border-2 border-emerald-100 flex items-center gap-4 animate-in slide-in-from-right">
            <Volume2 className="w-5 h-5 text-emerald-600" />
            <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{n.message}</p>
          </div>
        ))}
      </div>

      <div className="mb-8 flex flex-col md:flex-row justify-between items-center bg-emerald-950 p-6 rounded-[2.5rem] border border-emerald-800 shadow-2xl relative overflow-hidden gap-4">
          <div className="flex items-center gap-4 relative z-10">
             <div className={`p-4 rounded-2xl transition-all duration-700 ${thinkingMode ? 'bg-lime-400 text-emerald-900 rotate-12 shadow-[0_0_20px_rgba(163,230,53,0.5)]' : 'bg-emerald-900 text-emerald-500'}`}><BrainCircuit className="w-8 h-8" /></div>
             <div><p className="text-white text-[11px] font-black uppercase tracking-[0.2em]">KickOff AI Engine</p><p className="text-emerald-400 text-[10px] font-bold uppercase tracking-tight">Status: {hasApiKey ? 'Attivo' : 'Offline'}</p></div>
          </div>
          <div className="flex gap-4 relative z-10 w-full md:w-auto">
            <button onClick={() => setThinkingMode(!thinkingMode)} className={`flex-1 md:flex-none px-8 py-4 rounded-2xl text-[11px] font-black transition-all border-2 uppercase tracking-widest ${thinkingMode ? 'bg-lime-400 border-lime-300 text-emerald-950 shadow-lg shadow-lime-500/20' : 'bg-transparent border-emerald-800 text-emerald-500 hover:border-emerald-600'}`}>{thinkingMode ? 'Analysis On' : 'Standard'}</button>
            <button onClick={handleOpenApiKeyDialog} className={`p-4 rounded-2xl transition-all ${isQuotaExhausted ? 'bg-red-600 text-white animate-pulse' : 'bg-emerald-900 border border-emerald-800 text-emerald-400 hover:text-lime-400'}`}>
              <Key className="w-6 h-6" />
            </button>
          </div>
      </div>

      {(error || isQuotaExhausted) && (
        <div className="mb-8 bg-red-50 border-2 border-red-200 p-8 rounded-[3rem] flex flex-col md:flex-row items-center justify-between text-red-900 animate-in bounce-in shadow-2xl gap-6">
          <div className="flex items-center gap-6 text-left">
            <div className="bg-red-100 p-5 rounded-[1.5rem] text-red-600"><AlertTriangle className="w-10 h-10" /></div>
            <div>
              <p className="text-sm font-black uppercase tracking-[0.1em]">Allerta Sistema</p>
              <p className="text-xs font-bold opacity-80 mt-1 leading-relaxed">{error}</p>
            </div>
          </div>
          <button onClick={handleOpenApiKeyDialog} className="px-8 py-5 bg-emerald-600 text-white rounded-[2rem] shadow-xl hover:bg-emerald-700 transition-all font-black text-xs uppercase tracking-widest flex items-center gap-3"><Key className="w-5 h-5" /> Collega API Key</button>
        </div>
      )}

      {renderContent()}
      
      {data?.sources && data.sources.length > 0 && (
        <div className="mt-12 p-8 bg-white rounded-[3rem] border-2 border-emerald-50 shadow-sm">
          <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3"><Search className="w-4 h-4 text-emerald-500" /> Fonti Analizzate (Google Search Grounding)</h4>
          <div className="flex flex-wrap gap-4">
            {data.sources.map((source, idx) => (
              <a key={idx} href={source.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-emerald-50 text-emerald-700 px-4 py-2.5 rounded-[1.25rem] text-[11px] font-black uppercase hover:bg-emerald-100 transition-all border border-emerald-100 shadow-sm">{source.title || 'Dettaglio'} <ExternalLink className="w-4 h-4" /></a>
            ))}
          </div>
        </div>
      )}

      {predictModalMatch && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-emerald-950/80 backdrop-blur-2xl">
           <div className="bg-white w-full max-w-md rounded-[3.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95">
              <div className="bg-emerald-900 p-10 text-white flex justify-between items-center">
                 <div><h4 className="font-black text-[10px] uppercase text-emerald-400 tracking-[0.3em] mb-2">IA Prediction</h4><p className="font-black text-2xl tracking-tighter truncate max-w-[250px]">{predictModalMatch.home} vs {predictModalMatch.away}</p></div>
                 <button onClick={() => setPredictModalMatch(null)} className="p-2 hover:bg-emerald-800 rounded-full"><X className="w-8 h-8" /></button>
              </div>
              <div className="p-12 text-center">
                {predicting ? (
                  <div className="py-16 flex flex-col items-center gap-6">
                    <div className="w-16 h-16 border-8 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
                    <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">Analisi...</span>
                  </div>
                ) : (
                  <div className="space-y-10 animate-in zoom-in">
                    <div className="bg-emerald-50 p-12 rounded-[3rem] border-2 border-emerald-100 shadow-inner">
                        <p className="text-6xl font-black text-emerald-950 tracking-tighter">{prediction?.prediction}</p>
                        <div className="inline-block px-6 py-2 bg-lime-400 text-emerald-950 rounded-full text-[11px] font-black uppercase mt-6 shadow-lg shadow-lime-500/20">Confidenza: {prediction?.confidence}</div>
                    </div>
                    <p className="text-sm text-slate-700 font-bold italic leading-relaxed">"{prediction?.analysis}"</p>
                  </div>
                )}
              </div>
           </div>
        </div>
      )}

      {bettingMatch && <BettingModal match={bettingMatch} balance={balance} onClose={() => setBettingMatch(null)} onPlaceBet={handlePlaceBet} />}
      {streamingMatch && <LiveStreamModal match={streamingMatch} onClose={() => setStreamingMatch(null)} />}
    </Layout>
  );
};

export default App;
