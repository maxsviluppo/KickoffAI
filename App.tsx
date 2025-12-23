
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Layout from './components/Layout';
import MatchCard from './components/MatchCard';
import BettingModal from './components/BettingModal';
import LiveStreamModal from './components/LiveStreamModal';
import { fetchSoccerData, getMatchPrediction, getHistoricalAnalysis } from './services/geminiService';
import { SportsData, Tab, Standing, AIPrediction, Match, Bet, AppNotification, HistoricalSnapshot, GroundingSource } from './types';
import { 
  RefreshCw, Trophy, BrainCircuit, X, Star, Wallet, Sparkles, ChevronRight, RotateCcw, Lightbulb, Power, MapPin, ShieldCheck, Activity, Volume2, AlertTriangle, ExternalLink, Search, Filter, SlidersHorizontal, Radio, Receipt, Clock, ArrowUpRight, TrendingUp, DollarSign, LineChart, Timer, Settings, Mail, User, Info, Key, Zap
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
  const [thinkingMode, setThinkingMode] = useState<boolean>(false);
  const [currentTip, setCurrentTip] = useState(0);
  const [retryWithNoSearch, setRetryWithNoSearch] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [refreshCountdown, setRefreshCountdown] = useState<number>(30);
  const [loadingSeconds, setLoadingSeconds] = useState(0);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeague, setSelectedLeague] = useState('All');
  const [liveOnly, setLiveOnly] = useState(false);

  useEffect(() => {
    setSearchTerm('');
    setSelectedLeague('All');
    setLiveOnly(false);
  }, [activeTab]);

  useEffect(() => {
    let timer: any;
    if (loading) {
      timer = setInterval(() => setLoadingSeconds(s => s + 1), 1000);
    } else {
      setLoadingSeconds(0);
    }
    return () => clearInterval(timer);
  }, [loading]);
  
  const [history, setHistory] = useState<HistoricalSnapshot[]>(() => {
    try {
      const saved = localStorage.getItem('kickoff_history');
      return saved ? (JSON.parse(saved) as HistoricalSnapshot[]) : [];
    } catch {
      return [];
    }
  });

  const [betHistory, setBetHistory] = useState<Bet[]>(() => {
    try {
      const saved = localStorage.getItem('kickoff_bet_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
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
      await window.aistudio?.openSelectKey();
      setIsQuotaExhausted(false);
      setError(null);
      setTimeout(() => loadData(true), 500); 
    } catch (err) {
      addNotification("Errore", "Impossibile aprire la selezione chiave.", "info");
    }
  };

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          addNotification("Localizzazione", "Coordinate sbloccate per l'IA.", "info");
        },
        (err) => console.warn("Geolocation blocked", err),
        { enableHighAccuracy: true }
      );
    }
  }, [addNotification]);

  useEffect(() => {
    let interval: any;
    if (loading) {
      interval = setInterval(() => {
        setCurrentTip(prev => (prev + 1) % SOCCER_TIPS.length);
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const loadData = useCallback(async (isInitial = false, forceNoSearch = false, isSilent = false) => {
    if ((loading || isRefreshing) && !isInitial) return;
    
    if (isSilent) {
        setIsRefreshing(true);
    } else {
        setLoading(true);
    }
    setError(null);

    // Timeout per ricerca live estesa (90s) o safe mode (25s)
    const timeoutThreshold = forceNoSearch ? 25000 : 90000;
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error("IA_TIMEOUT")), timeoutThreshold)
    );

    try {
      const result = await Promise.race([
        fetchSoccerData(thinkingMode, !forceNoSearch && !retryWithNoSearch, location),
        timeoutPromise
      ]) as SportsData;

      if (!result || !result.matches) throw new Error("Risposta vuota");
      
      setData(result);
      saveToHistory(result);
      setError(null);
      setIsQuotaExhausted(false);
      setRetryWithNoSearch(false);
      setRefreshCountdown(30); 
    } catch (err: any) {
      console.error("Load Error:", err);
      
      const errorMsg = err?.message || JSON.stringify(err);
      
      if (errorMsg === "IA_TIMEOUT" || errorMsg.includes("timeout")) {
        if (!forceNoSearch) {
          addNotification("IA Lenta", "Tentativo di caricamento rapido senza ricerca...", "info");
          setRetryWithNoSearch(true);
          loadData(false, true, isSilent);
          return;
        }
        setError("L'IA è troppo lenta. Consigliato inserire una API Key personale per sbloccare la priorità.");
      } else if (errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED")) {
        setIsQuotaExhausted(true);
        setError("Quota IA Esaurita. Per favore inserisci la tua API Key.");
      } else if (!forceNoSearch && !retryWithNoSearch) {
        setRetryWithNoSearch(true);
        loadData(false, true, isSilent); 
        return;
      } else {
        const cached = localStorage.getItem('kickoff_history');
        if (cached) {
          const parsed = JSON.parse(cached) as HistoricalSnapshot[];
          if (parsed.length > 0) {
            setData(parsed[0].data);
            setError("Visualizzazione dati in cache per problemi di rete IA.");
          }
        } else {
          setError("Errore critico. Prova a inserire la tua chiave API.");
        }
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [thinkingMode, saveToHistory, retryWithNoSearch, location, loading, isRefreshing, addNotification]);

  useEffect(() => {
    let countdownInterval: any;
    if (activeTab === Tab.LIVE && !loading && !isRefreshing && !isQuotaExhausted) {
        countdownInterval = setInterval(() => {
            setRefreshCountdown(prev => {
                if (prev <= 1) {
                    loadData(false, false, true);
                    return 30;
                }
                return prev - 1;
            });
        }, 1000);
    } else {
        setRefreshCountdown(30);
    }
    return () => clearInterval(countdownInterval);
  }, [activeTab, loading, isRefreshing, isQuotaExhausted, loadData]);

  useEffect(() => {
    loadData(true);
  }, [thinkingMode, location]); 

  const resetApp = () => {
    localStorage.clear();
    window.location.reload();
  };

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

  const filteredMatches = useMemo(() => {
    if (!data) return [];
    return data.matches.filter(m => {
      const matchesSearch = m.homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) || m.awayTeam.toLowerCase().includes(searchTerm.toLowerCase()) || m.league.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLeague = selectedLeague === 'All' || m.league === selectedLeague;
      const isMatchLive = m.status.toLowerCase().includes('live') || m.status.toLowerCase().includes('in corso');
      return matchesSearch && matchesLeague && (!liveOnly || isMatchLive);
    });
  }, [data, searchTerm, selectedLeague, liveOnly]);

  const filteredStandings = useMemo(() => {
    if (!data) return {};
    const filtered: Record<string, Standing[]> = {};
    Object.entries(data.standings).forEach(([league, teams]) => {
      const leagueMatchesFilter = selectedLeague === 'All' || league === selectedLeague;
      const filteredTeams = (teams as Standing[]).filter(t => t.team.toLowerCase().includes(searchTerm.toLowerCase()) || league.toLowerCase().includes(searchTerm.toLowerCase()));
      if (leagueMatchesFilter && (filteredTeams.length > 0 || league.toLowerCase().includes(searchTerm.toLowerCase()))) {
        filtered[league] = filteredTeams.length > 0 ? filteredTeams : teams as Standing[];
      }
    });
    return filtered;
  }, [data, searchTerm, selectedLeague]);

  const handlePredict = async (home: string, away: string) => {
    setPredictModalMatch({ home, away });
    setPredicting(true);
    try {
      const res = await getMatchPrediction(home, away, thinkingMode);
      setPrediction(res);
    } catch (err: any) {
      setPrediction({ prediction: "N/D", confidence: "0%", analysis: "Limite IA. Inserire API Key personale." });
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

  const handleAnalyzeHistory = async () => {
    if (history.length < 2) return;
    setIsAnalyzingHistory(true);
    try {
      const analysis = await getHistoricalAnalysis(history, thinkingMode);
      setHistoricalAnalysis(analysis);
    } catch (err) {
      setHistoricalAnalysis("Errore. API Key personale richiesta per analisi massive.");
    } finally {
      setIsAnalyzingHistory(false);
    }
  };

  const totalBetAmount = useMemo(() => betHistory.reduce((sum, b) => sum + b.amount, 0), [betHistory]);
  const totalPotentialWin = useMemo(() => betHistory.reduce((sum, b) => sum + b.potentialWin, 0), [betHistory]);

  const renderContent = () => {
    if (loading && !data) {
      return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="relative mb-12">
            <div className="w-28 h-28 border-[12px] border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
                <ShieldCheck className="w-10 h-10 text-emerald-600 animate-pulse" />
            </div>
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-emerald-600 whitespace-nowrap">
              TEMPO: {loadingSeconds}s
            </div>
          </div>
          <h3 className="text-3xl font-black text-emerald-950 mb-6 italic tracking-tighter">Ricerca Live IA...</h3>
          <div className="bg-white p-8 rounded-[2.5rem] border border-emerald-100 shadow-2xl max-w-sm mx-auto flex flex-col items-center gap-6">
            <p className="text-slate-700 text-sm font-bold leading-relaxed italic">"{SOCCER_TIPS[currentTip]}"</p>
          </div>
          <div className="mt-12 flex flex-col items-center gap-6">
             <div className="flex gap-4">
                <button onClick={handleOpenApiKeyDialog} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase shadow-xl flex items-center gap-2">
                    <Key className="w-4 h-4" /> Inserisci API Key Personale
                </button>
                {loadingSeconds > 15 && (
                  <button onClick={() => loadData(true, true)} className="bg-amber-100 text-amber-700 px-8 py-4 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 animate-in fade-in">
                    <Zap className="w-4 h-4" /> Forza Safe Mode
                  </button>
                )}
             </div>
             <p className="text-xs text-slate-400 font-medium">Nota: Se l'IA impiega troppo tempo, la tua connessione o i server Gemini potrebbero essere saturi.</p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case Tab.LIVE:
        return (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between bg-white/50 p-4 rounded-3xl border border-emerald-100 mb-2">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-600 rounded-full animate-ping"></div>
                <h2 className="text-xl font-black text-emerald-900 uppercase tracking-tighter">Campo Live</h2>
                <div className="hidden sm:flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                    <Timer className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-emerald-600' : 'text-slate-400'}`} />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-tight">Auto-Refresh: {refreshCountdown}s</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {location && <div className="flex items-center gap-1 bg-lime-100 text-emerald-700 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase"><MapPin className="w-3 h-3" /> Local</div>}
                <button onClick={() => loadData(false)} disabled={loading || isRefreshing} className="p-2 bg-emerald-600 text-white rounded-xl shadow-lg hover:rotate-180 transition-transform duration-500"><RefreshCw className={`w-4 h-4 ${loading || isRefreshing ? 'animate-spin' : ''}`} /></button>
              </div>
            </div>
            <SearchAndFilterControls searchTerm={searchTerm} setSearchTerm={setSearchTerm} selectedLeague={selectedLeague} setSelectedLeague={setSelectedLeague} liveOnly={liveOnly} setLiveOnly={setLiveOnly} activeTab={activeTab} leagues={leagues} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredMatches.length > 0 ? (
                filteredMatches.map(m => (
                  <MatchCard key={m.id} match={m} onPredict={handlePredict} onBet={setBettingMatch} onWatchLive={setStreamingMatch} isFavoriteHome={favorites.includes(m.homeTeam)} isFavoriteAway={favorites.includes(m.awayTeam)} onToggleFavorite={toggleFavorite} showOdds={true} />
                ))
              ) : (
                <div className="col-span-full py-20 text-center bg-white/40 rounded-[2.5rem] border-2 border-dashed border-emerald-100">
                  <p className="text-slate-400 font-bold italic">Nessun match trovato.</p>
                </div>
              )}
            </div>
          </div>
        );
      case Tab.STANDINGS:
        return (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-xl font-black text-emerald-900 uppercase tracking-tight mb-4">Campionati</h2>
            <SearchAndFilterControls searchTerm={searchTerm} setSearchTerm={setSearchTerm} selectedLeague={selectedLeague} setSelectedLeague={setSelectedLeague} liveOnly={liveOnly} setLiveOnly={setLiveOnly} activeTab={activeTab} leagues={leagues} />
            {Object.keys(filteredStandings).length > 0 ? (
              Object.entries(filteredStandings).map(([league, teams]) => (
                <div key={league} className="bg-white rounded-[2.5rem] shadow-sm border border-emerald-50 overflow-hidden mb-8 animate-in slide-in-from-bottom-4">
                  <div className="bg-emerald-900 text-white p-6 font-black text-xs uppercase tracking-widest flex justify-between items-center">
                    <span>{league}</span><Trophy className="w-5 h-5 text-lime-400" />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500 font-black uppercase text-[10px]">
                        <tr><th className="p-6">Pos</th><th className="p-6">Squadra</th><th className="p-6 text-center">Pts</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(teams as Standing[]).map(t => (
                          <tr key={t.team} className="hover:bg-emerald-50/50 transition-colors">
                            <td className="p-6 font-bold text-emerald-600">#{t.rank}</td>
                            <td className="p-6 font-black text-slate-800">{t.team}</td>
                            <td className="p-6 text-center font-mono font-bold bg-slate-50/30">{t.points}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            ) : <div className="py-20 text-center bg-white/40 rounded-[2.5rem] border-2 border-dashed border-emerald-100"><p className="text-slate-400 font-bold italic">Nessuna classifica trovata.</p></div>}
          </div>
        );
      case Tab.HISTORY:
        return (
          <div className="space-y-8 animate-in fade-in">
             <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex bg-white p-1.5 rounded-2xl border border-emerald-100 shadow-sm w-full md:w-auto">
                   <button onClick={() => setHistorySubTab('snapshots')} className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${historySubTab === 'snapshots' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'text-slate-400 hover:text-emerald-600'}`}><Clock className="w-3.5 h-3.5" /> Snapshots</button>
                   <button onClick={() => setHistorySubTab('bets')} className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${historySubTab === 'bets' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'text-slate-400 hover:text-emerald-600'}`}><Receipt className="w-3.5 h-3.5" /> Schedine</button>
                </div>
             </div>
             {historySubTab === 'snapshots' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                   <div className="lg:col-span-1 space-y-3">
                     {history.length > 0 ? history.map((s) => (
                       <button key={s.id} onClick={() => setSelectedHistoricalData(s)} className={`w-full p-6 rounded-[2rem] border-2 text-left flex justify-between items-center transition-all ${selectedHistoricalData?.id === s.id ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-white border-slate-100 text-slate-700 hover:border-emerald-200'}`}>
                         <span className="text-xs font-black uppercase">{s.timestamp}</span>
                         <ChevronRight className="w-5 h-5" />
                       </button>
                     )) : <div className="p-12 text-center text-slate-300 border-2 border-dashed border-slate-100 rounded-[2rem] font-bold italic">Nessun dato</div>}
                   </div>
                   <div className="lg:col-span-2">
                     {selectedHistoricalData ? (
                       <div className="bg-white rounded-[2.5rem] p-10 border-2 border-emerald-50 animate-in slide-in-from-right">
                          <p className="text-2xl font-black text-emerald-950 mb-8">{selectedHistoricalData.timestamp}</p>
                          <div className="grid grid-cols-2 gap-4">
                            {Object.entries(selectedHistoricalData.data.standings || {}).map(([league]) => (
                              <div key={league} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                                <span className="text-[10px] font-black uppercase text-slate-600">{league}</span>
                              </div>
                            ))}
                          </div>
                       </div>
                     ) : <div className="p-32 border-4 border-dashed border-slate-100 rounded-[3rem] text-center text-slate-200 font-black uppercase text-2xl">Seleziona Log</div>}
                   </div>
                </div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {betHistory.map((bet) => (
                    <div key={bet.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-lg p-6 relative overflow-hidden group">
                      <div className="flex justify-between items-start mb-4">
                          <span className="text-[9px] font-black text-emerald-600 uppercase">TICKET #{bet.id.slice(0,5)}</span>
                      </div>
                      <p className="font-black text-sm uppercase leading-tight mb-4">{bet.matchName}</p>
                      <div className="flex justify-between items-center text-xs pt-4 border-t border-dashed border-slate-100">
                        <span className="font-black">€{bet.amount.toFixed(2)}</span>
                        <span className="font-black text-emerald-700">Win: €{bet.potentialWin.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
               </div>
             )}
          </div>
        );
      case Tab.AI_CHAT:
        return (
          <div className="space-y-8 animate-in fade-in">
             <div className="bg-emerald-950 p-12 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                <h3 className="text-4xl font-black mb-6 flex items-center gap-4"><Sparkles className="w-10 h-10 text-lime-400 animate-pulse" /> Tactical Engine</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <p className="text-emerald-200 text-sm font-medium">Analisi avanzata trend storici.</p>
                      <button onClick={handleAnalyzeHistory} disabled={isAnalyzingHistory || history.length < 2} className="w-full bg-lime-400 text-emerald-950 font-black py-5 rounded-[2rem] text-xs uppercase shadow-2xl shadow-lime-500/20">{isAnalyzingHistory ? "Analisi..." : "Avvia Predizione Storica"}</button>
                   </div>
                   <div className="bg-white/10 backdrop-blur-md p-8 rounded-[2rem] text-sm text-emerald-50 italic border border-white/5">{historicalAnalysis || "Sincronizza almeno 2 snapshots per sbloccare l'analisi."}</div>
                </div>
             </div>
          </div>
        );
      case Tab.FAVORITES:
        return (
          <div className="space-y-10 animate-in fade-in">
             <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 p-10 rounded-[3rem] text-white flex justify-between items-center shadow-xl">
                <div><h2 className="text-3xl font-black tracking-tighter uppercase">Squadre del Cuore</h2></div>
                <Star className="w-12 h-12 text-lime-400 fill-current animate-spin-slow" />
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {favorites.map(team => {
                  let teamStanding: Standing | undefined;
                  if (data) Object.values(data.standings).forEach((leagueTeams: Standing[]) => { const found = leagueTeams.find(t => t.team === team); if (found) teamStanding = found; });
                  return <TeamPerformanceCard key={team} team={team} standing={teamStanding} />;
                })}
             </div>
          </div>
        );
      case Tab.SETTINGS:
        return (
          <div className="space-y-10 animate-in fade-in">
             <div className="bg-white rounded-[3rem] shadow-xl border border-emerald-50 overflow-hidden p-12 space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="bg-emerald-50 p-8 rounded-[2rem] border border-emerald-100 space-y-4">
                      <div className="flex items-center gap-3 mb-2"><Key className="w-5 h-5 text-emerald-600" /><h4 className="text-sm font-black uppercase text-emerald-900 tracking-tight">Gestione API Key Personale</h4></div>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">L'inserimento di una chiave personale risolve gli errori di timeout e quota esaurita.</p>
                      <button onClick={handleOpenApiKeyDialog} className="w-full bg-emerald-600 text-white font-black py-4 rounded-xl text-[10px] uppercase shadow-lg shadow-emerald-100">Collega API Key</button>
                      <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="block text-center text-[9px] font-bold text-emerald-500 uppercase hover:underline">Link Billing Documentazione</a>
                   </div>
                   <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 space-y-4">
                      <div className="flex items-center gap-3 mb-2"><Info className="w-5 h-5 text-slate-600" /><h4 className="text-sm font-black uppercase text-slate-900 tracking-tight">Info Sviluppo</h4></div>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">Creato da Castro Massimo per un'esperienza calcistica IA definitiva.</p>
                      <a href="mailto:castromassimo@gmail.com" className="w-full bg-white border border-slate-200 text-slate-800 font-black py-4 rounded-xl text-[10px] uppercase flex items-center justify-center gap-2"><Mail className="w-4 h-4" /> Supporto Tecnico</a>
                   </div>
                </div>
             </div>
          </div>
        );
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} lastUpdated={data?.lastUpdated} balance={balance}>
      <div className="fixed top-24 right-6 z-[200] space-y-3 max-w-[280px]">
        {activeNotifications.map(n => (
          <div key={n.id} className="p-4 rounded-[2rem] shadow-2xl bg-white border-2 border-emerald-100 flex items-center gap-4 animate-in slide-in-from-right"><Volume2 className="w-5 h-5 text-emerald-600" /><p className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{n.message}</p></div>
        ))}
      </div>

      <div className="mb-8 flex justify-between items-center bg-emerald-950 p-6 rounded-[2.5rem] border border-emerald-800 shadow-2xl relative overflow-hidden">
          <div className="flex items-center gap-4 relative z-10">
             <div className={`p-3 rounded-2xl transition-all duration-700 ${thinkingMode ? 'bg-lime-400 text-emerald-900 rotate-12' : 'bg-emerald-900 text-emerald-500'}`}><BrainCircuit className="w-6 h-6" /></div>
             <div><p className="text-white text-[10px] font-black uppercase tracking-[0.2em]">Analisi Tattica IA</p><p className="text-emerald-400 text-[9px] font-bold uppercase">{location ? 'Localizzazione OK' : 'GPS in attesa...'}</p></div>
          </div>
          <div className="flex gap-3 relative z-10">
            <button onClick={() => setThinkingMode(!thinkingMode)} className={`px-8 py-3 rounded-2xl text-[10px] font-black transition-all border-2 ${thinkingMode ? 'bg-lime-400 border-lime-300 text-emerald-950' : 'bg-transparent border-emerald-800 text-emerald-500 hover:border-emerald-600'}`}>{thinkingMode ? 'DEEP MODE ON' : 'IA STANDARD'}</button>
            <button onClick={handleOpenApiKeyDialog} className={`p-3 rounded-2xl transition-all ${error ? 'bg-red-600 text-white animate-pulse' : 'bg-emerald-900 border border-emerald-800 text-emerald-400 hover:text-lime-400'}`} title="Inserisci API Key">
              <Key className="w-5 h-5" />
            </button>
          </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border-2 border-red-200 p-6 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between text-red-900 animate-in bounce-in shadow-xl gap-4">
          <div className="flex items-center gap-5">
            <div className="bg-red-100 p-4 rounded-2xl text-red-600"><AlertTriangle className="w-8 h-8" /></div>
            <div><p className="text-sm font-black uppercase tracking-tight">Errore di Caricamento</p><p className="text-xs font-medium opacity-80">{error}</p></div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
             <button onClick={handleOpenApiKeyDialog} className="flex-1 md:flex-none px-8 py-4 bg-emerald-600 text-white rounded-2xl shadow-lg hover:bg-emerald-700 transition-all font-black text-[10px] uppercase flex items-center justify-center gap-2"><Key className="w-4 h-4" /> Inserisci la tua API Key</button>
             <button onClick={() => loadData(true)} className="p-4 bg-white text-emerald-600 rounded-2xl border border-emerald-100"><RefreshCw className="w-5 h-5" /></button>
          </div>
        </div>
      )}

      {renderContent()}
      
      {data?.sources && data.sources.length > 0 && (
        <div className="mt-8 p-6 bg-white rounded-[2rem] border border-emerald-50 shadow-sm animate-in fade-in slide-in-from-bottom-2">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Search className="w-3 h-3 text-emerald-500" /> Fonti Grounding Google Search</h4>
          <div className="flex flex-wrap gap-3">
            {data.sources.map((source, idx) => (
              <a key={idx} href={source.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-100 transition-colors border border-emerald-100/50">{source.title || 'Sito Web'} <ExternalLink className="w-3 h-3" /></a>
            ))}
          </div>
        </div>
      )}

      {predictModalMatch && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-emerald-950/60 backdrop-blur-xl animate-in fade-in">
           <div className="bg-white w-full max-w-sm rounded-[3rem] overflow-hidden shadow-2xl border-2 border-emerald-50">
              <div className="bg-emerald-900 p-8 text-white flex justify-between items-center">
                 <div><h4 className="font-black text-sm uppercase text-emerald-400 tracking-widest">IA Tactic</h4><p className="font-black text-xl tracking-tighter truncate max-w-[200px]">{predictModalMatch.home} vs {predictModalMatch.away}</p></div>
                 <button onClick={() => setPredictModalMatch(null)} className="p-2 hover:bg-emerald-800 rounded-full transition-colors"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-10 text-center">
                {predicting ? <div className="py-12 flex flex-col items-center gap-4"><RefreshCw className="w-10 h-10 text-emerald-600 animate-spin" /><span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Consultando i dati...</span></div> : (
                  <div className="space-y-8 animate-in zoom-in">
                    <div className="bg-emerald-50 p-10 rounded-[2.5rem] border-2 border-emerald-100 shadow-inner"><p className="text-4xl font-black text-emerald-950 tracking-tighter">{prediction?.prediction}</p><div className="inline-block px-4 py-1.5 bg-lime-400 text-emerald-950 rounded-full text-[9px] font-black uppercase mt-4">Precisione: {prediction?.confidence}</div></div>
                    <p className="text-sm text-slate-700 font-bold italic">"{prediction?.analysis}"</p>
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
