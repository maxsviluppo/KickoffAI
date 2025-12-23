
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Layout from './components/Layout';
import MatchCard from './components/MatchCard';
import BettingModal from './components/BettingModal';
import LiveStreamModal from './components/LiveStreamModal';
import { fetchSoccerData, getMatchPrediction, getHistoricalAnalysis } from './services/geminiService';
import { SportsData, Tab, Standing, AIPrediction, Match, Bet, AppNotification, HistoricalSnapshot } from './types';
import { 
  RefreshCw, Trophy, BrainCircuit, X, Star, Sparkles, ShieldCheck, Volume2, AlertTriangle, Search, Filter, SlidersHorizontal, Radio, BarChart3, LineChart, FileSearch, History, Settings, Key, Info, ExternalLink
} from 'lucide-react';

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

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.LIVE);
  const [data, setData] = useState<SportsData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const isFetchingRef = useRef(false);
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);

  const [thinkingMode, setThinkingMode] = useState<boolean>(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | undefined>(undefined);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeague, setSelectedLeague] = useState('All');
  const [liveOnly, setLiveOnly] = useState(false);

  const [history, setHistory] = useState<HistoricalSnapshot[]>(() => {
    try {
      const saved = localStorage.getItem('kickoff_history');
      return saved ? (JSON.parse(saved) as HistoricalSnapshot[]) : [];
    } catch { return []; }
  });

  const [historicalAnalysis, setHistoricalAnalysis] = useState<string | null>(null);
  const [isAnalyzingHistory, setIsAnalyzingHistory] = useState(false);

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

  const checkApiKey = useCallback(async () => {
    if (window.aistudio) {
      const ok = await window.aistudio.hasSelectedApiKey();
      setHasApiKey(ok);
      return ok;
    }
    return true;
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

  const loadData = useCallback(async (isInitial = false, forceNoSearch = false, isSilent = false) => {
    const ok = await checkApiKey();
    if (!ok) {
       setLoading(false);
       return;
    }

    if (isFetchingRef.current && !isInitial) return;
    
    isFetchingRef.current = true;
    if (isSilent) setIsRefreshing(true);
    else setLoading(true);

    try {
      const result = await fetchSoccerData(thinkingMode, !forceNoSearch, location);
      if (!result || !result.matches) throw new Error("Risposta vuota");
      
      setData(result);
      saveToHistory(result);
    } catch (err: any) {
      console.error("Critical Load Error:", err);
      const errorStr = JSON.stringify(err);
      if (errorStr.includes("429") || errorStr.includes("RESOURCE_EXHAUSTED")) {
        addNotification("Limite Quota", "Quota API Gemini esaurita.", "info");
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      isFetchingRef.current = false;
    }
  }, [thinkingMode, saveToHistory, location, addNotification, checkApiKey]);

  useEffect(() => {
    checkApiKey();
    loadData(true);
  }, [thinkingMode, location, loadData, checkApiKey]);

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
      setPrediction({ prediction: "N/D", confidence: "0%", analysis: "Errore API." });
    } finally {
      setPredicting(false);
    }
  };

  // Fixed: handleOpenApiKeyDialog handles assumed success and no delay as per guidelines
  const handleOpenApiKeyDialog = async () => {
    if (window.aistudio) {
       await window.aistudio.openSelectKey();
       setHasApiKey(true);
       loadData(true);
    }
  };

  // Fixed: Added missing handlePlaceBet function
  const handlePlaceBet = useCallback((bet: Bet) => {
    setBalance(prev => {
      const newBalance = prev - bet.amount;
      localStorage.setItem('kickoff_balance', newBalance.toString());
      return newBalance;
    });
    addNotification("Scommessa Simulata", `Piazzata giocata di €${bet.amount} su ${bet.matchName}`, "info");
  }, [addNotification]);

  // Fixed: Added missing handleAnalyzeFavorites function
  const handleAnalyzeFavorites = useCallback(async () => {
    if (favorites.length === 0) return;
    setIsAnalyzingHistory(true);
    try {
      const result = await getHistoricalAnalysis(history, favorites, thinkingMode);
      setHistoricalAnalysis(result);
    } catch (err) {
      addNotification("Errore Analisi", "Impossibile generare il report strategico.", "info");
    } finally {
      setIsAnalyzingHistory(false);
    }
  }, [favorites, history, thinkingMode, addNotification]);

  const renderContent = () => {
    if (!hasApiKey && activeTab !== Tab.SETTINGS) {
       return (
          <div className="py-20 flex flex-col items-center justify-center text-center px-6 bg-white/50 rounded-[3rem] border-2 border-dashed border-red-200 animate-in fade-in">
             <div className="bg-red-50 p-6 rounded-full mb-6">
                <AlertTriangle className="w-12 h-12 text-red-500" />
             </div>
             <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-4">API Key Mancante</h3>
             <p className="text-sm text-slate-600 max-w-sm mb-8 font-medium">L'app richiede una chiave API Gemini per analizzare i match e generare statistiche. Configurala ora nel tab delle impostazioni.</p>
             <button 
               onClick={() => setActiveTab(Tab.SETTINGS)}
               className="bg-emerald-800 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-900/10 hover:scale-105 active:scale-95 transition-all"
             >
                Vai alle Impostazioni
             </button>
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
          <h3 className="text-3xl font-black text-emerald-950 mb-6 italic tracking-tighter uppercase">Analisi In Corso...</h3>
        </div>
      );
    }

    switch (activeTab) {
      case Tab.LIVE:
        return (
          <div className="space-y-6 animate-in fade-in">
            {!hasApiKey && (
              <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-4 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <p className="text-xs font-bold text-red-800 flex-1">Configurazione API richiesta per sbloccare le funzionalità IA.</p>
                <button onClick={() => setActiveTab(Tab.SETTINGS)} className="text-[10px] font-black uppercase text-red-600 underline">Configura</button>
              </div>
            )}
            <div className="flex items-center justify-between bg-white/50 p-4 rounded-3xl border border-emerald-100 mb-2">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-600 rounded-full animate-ping"></div>
                <h2 className="text-xl font-black text-emerald-900 uppercase tracking-tighter">Campo Live</h2>
              </div>
              <button onClick={() => loadData(false)} disabled={loading || isRefreshing} className="p-2 bg-emerald-600 text-white rounded-xl shadow-lg hover:rotate-180 transition-transform duration-500"><RefreshCw className={`w-4 h-4 ${loading || isRefreshing ? 'animate-spin' : ''}`} /></button>
            </div>
            <SearchAndFilterControls searchTerm={searchTerm} setSearchTerm={setSearchTerm} selectedLeague={selectedLeague} setSelectedLeague={setSelectedLeague} liveOnly={liveOnly} setLiveOnly={setLiveOnly} activeTab={activeTab} leagues={leagues} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredMatches.length > 0 ? filteredMatches.map(m => (
                <MatchCard key={m.id} match={m} onPredict={handlePredict} onBet={setBettingMatch} onWatchLive={setStreamingMatch} isFavoriteHome={favorites.includes(m.homeTeam)} isFavoriteAway={favorites.includes(m.awayTeam)} onToggleFavorite={toggleFavorite} showOdds={true} />
              )) : (
                 <div className="col-span-full py-12 text-center text-slate-400 font-bold italic">Nessun match trovato per i criteri selezionati.</div>
              )}
            </div>
          </div>
        );
      case Tab.SETTINGS:
        return (
          <div className="space-y-10 animate-in fade-in">
             <div className="bg-white rounded-[3rem] shadow-xl border border-emerald-50 p-12 space-y-10">
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="bg-emerald-50 p-4 rounded-full"><Settings className="w-12 h-12 text-emerald-600" /></div>
                    <h3 className="text-2xl font-black uppercase tracking-tight">Impostazioni Applicazione</h3>
                    <p className="text-sm text-slate-500 max-w-sm font-medium">Gestisci la connessione all'IA e resetta le tue simulazioni.</p>
                </div>

                <div className="bg-emerald-50 p-8 rounded-[2rem] border border-emerald-100 space-y-6">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <Key className={`w-5 h-5 ${hasApiKey ? 'text-emerald-600' : 'text-red-500'}`} />
                          <h4 className="font-black text-xs uppercase text-slate-800 tracking-wider">Connessione Gemini API</h4>
                       </div>
                       <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${hasApiKey ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                          {hasApiKey ? 'Connesso' : 'Disconnesso'}
                       </div>
                    </div>
                    
                    <p className="text-xs text-slate-600 font-medium">
                       L'app utilizza Gemini 3 Flash per l'analisi dei dati in tempo reale. È necessario selezionare un progetto con fatturazione abilitata.
                    </p>

                    <button 
                      onClick={handleOpenApiKeyDialog}
                      className="w-full bg-emerald-800 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-emerald-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                    >
                       <Key className="w-4 h-4" />
                       Seleziona / Cambia API Key
                    </button>
                    
                    <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="flex items-center justify-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:underline">
                       <Info className="w-3 h-3" /> Guida Fatturazione Google Cloud
                    </a>
                </div>

                <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-center gap-4">
                   <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="px-6 py-3 border border-red-100 text-red-500 font-black text-[10px] uppercase flex items-center justify-center gap-2 hover:bg-red-50 rounded-xl transition-colors"><RefreshCw className="w-3 h-3" /> Reset Totale Dati</button>
                   <button onClick={() => { localStorage.removeItem('kickoff_balance'); window.location.reload(); }} className="px-6 py-3 border border-slate-200 text-slate-600 font-black text-[10px] uppercase flex items-center justify-center gap-2 hover:bg-slate-50 rounded-xl transition-colors"><BarChart3 className="w-3 h-3" /> Reset Saldo (1000€)</button>
                </div>
             </div>
          </div>
        );
      case Tab.STANDINGS:
        return (
          <div className="space-y-6 animate-in fade-in">
            <SearchAndFilterControls searchTerm={searchTerm} setSearchTerm={setSearchTerm} selectedLeague={selectedLeague} setSelectedLeague={setSelectedLeague} liveOnly={liveOnly} setLiveOnly={setLiveOnly} activeTab={activeTab} leagues={leagues} />
            {data && (Object.entries(filteredStandings) as [string, Standing[]][]).map(([league, teams]) => (
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
      case Tab.AI_CHAT:
        return (
          <div className="space-y-8 animate-in fade-in pb-12">
             <div className="bg-emerald-950 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-lime-400/10 blur-[100px] -mr-32 -mt-32"></div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                   <div className="space-y-2">
                      <h3 className="text-4xl font-black flex items-center gap-4 uppercase tracking-tighter">
                         <Sparkles className="w-10 h-10 text-lime-400 animate-pulse" /> AI Performance Hub
                      </h3>
                      <p className="text-emerald-200 text-sm font-medium">Analisi strategica e proiezioni sulle tue squadre del cuore.</p>
                   </div>
                   <button 
                     onClick={handleAnalyzeFavorites} 
                     disabled={isAnalyzingHistory || favorites.length === 0}
                     className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-3 ${
                        isAnalyzingHistory 
                          ? 'bg-emerald-900 text-emerald-500 cursor-not-allowed' 
                          : 'bg-lime-400 text-emerald-950 shadow-2xl shadow-lime-500/20 hover:scale-105 active:scale-95'
                     }`}
                   >
                      {isAnalyzingHistory ? <RefreshCw className="w-5 h-5 animate-spin" /> : <BarChart3 className="w-5 h-5" />}
                      {isAnalyzingHistory ? "Analisi in Corso..." : "Avvia Analisi Storica"}
                   </button>
                </div>
                {/* Fixed: Render favorite teams in AI_CHAT tab */}
                {favorites.length > 0 && (
                   <div className="flex flex-wrap gap-2 mt-6 relative z-10">
                      {favorites.map(f => (
                         <span key={f} className="px-3 py-1 bg-emerald-800/50 border border-emerald-700 rounded-lg text-[10px] font-black uppercase text-lime-400">{f}</span>
                      ))}
                   </div>
                )}
             </div>
             {/* Fixed: Render historical analysis results */}
             {historicalAnalysis && (
                <div className="bg-white p-10 rounded-[3rem] border border-emerald-50 shadow-xl animate-in slide-in-from-bottom-4">
                   <div className="flex items-center justify-between mb-8">
                      <h4 className="text-xl font-black text-emerald-950 uppercase tracking-tight">Report Strategico IA</h4>
                      <button onClick={() => setHistoricalAnalysis(null)} className="text-slate-400 hover:text-red-500"><X className="w-5 h-5" /></button>
                   </div>
                   <div className="prose prose-emerald max-w-none whitespace-pre-wrap text-sm text-slate-700 font-medium leading-relaxed">
                      {historicalAnalysis}
                   </div>
                </div>
             )}
          </div>
        );
      case Tab.FAVORITES:
        return (
          <div className="space-y-10 animate-in fade-in">
             <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 p-10 rounded-[3rem] text-white flex justify-between items-center shadow-xl">
                <div><h2 className="text-3xl font-black tracking-tighter uppercase">Le Mie Squadre</h2></div>
                <Star className="w-12 h-12 text-lime-400 fill-current" />
             </div>
             {favorites.length > 0 ? (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {favorites.map(team => {
                    let teamStanding: Standing | undefined;
                    if (data) (Object.values(data.standings) as Standing[][]).forEach((leagueTeams: Standing[]) => { const found = leagueTeams.find(t => t.team === team); if (found) teamStanding = found; });
                    return <div key={team} className="bg-white p-6 rounded-3xl border border-emerald-50 shadow-sm flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <img src={`https://avatar.vercel.sh/${team}?size=32`} className="w-8 h-8 rounded-lg" alt="" />
                          <span className="font-black text-slate-800 uppercase text-xs">{team}</span>
                       </div>
                       <button onClick={() => toggleFavorite(team)} className="text-red-500"><X className="w-4 h-4" /></button>
                    </div>;
                  })}
               </div>
             ) : (
               <div className="py-20 text-center bg-white/40 rounded-[3rem] border-2 border-dashed border-emerald-100 text-slate-400 font-bold italic">Non hai ancora squadre preferite.</div>
             )}
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
             <div><p className="text-white text-[11px] font-black uppercase tracking-[0.2em]">KickOff AI Engine</p></div>
          </div>
          <div className="flex gap-4 relative z-10 w-full md:w-auto">
            <button onClick={() => setThinkingMode(!thinkingMode)} className={`flex-1 md:flex-none px-8 py-4 rounded-2xl text-[11px] font-black transition-all border-2 uppercase tracking-widest ${thinkingMode ? 'bg-lime-400 border-lime-300 text-emerald-950 shadow-lg shadow-lime-500/20' : 'bg-transparent border-emerald-800 text-emerald-500 hover:border-emerald-600'}`}>{thinkingMode ? 'Analysis On' : 'Standard'}</button>
          </div>
      </div>

      {renderContent()}
      
      {data?.sources && data.sources.length > 0 && activeTab !== Tab.SETTINGS && (
        <div className="mt-12 p-8 bg-white rounded-[3rem] border-2 border-emerald-50 shadow-sm">
          <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3"><Search className="w-4 h-4 text-emerald-500" /> Fonti Analizzate</h4>
          <div className="flex flex-wrap gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {data.sources.map((source, idx) => (
              <a key={idx} href={source.uri} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 flex items-center gap-3 bg-emerald-50 text-emerald-700 px-4 py-2.5 rounded-[1.25rem] text-[11px] font-black uppercase hover:bg-emerald-100 transition-all border border-emerald-100 shadow-sm">{source.title || 'Dettaglio'} <ExternalLink className="w-4 h-4" /></a>
            ))}
          </div>
        </div>
      )}

      {predictModalMatch && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-emerald-950/80 backdrop-blur-2xl">
           <div className="bg-white w-full max-w-md rounded-[3.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95">
              <div className="bg-emerald-900 p-10 text-white flex justify-between items-center">
                 <div className="max-w-[80%]"><h4 className="font-black text-[10px] uppercase text-emerald-400 tracking-[0.3em] mb-2">IA Prediction</h4><p className="font-black text-2xl tracking-tighter truncate">{predictModalMatch.home} vs {predictModalMatch.away}</p></div>
                 <button onClick={() => setPredictModalMatch(null)} className="p-2 hover:bg-emerald-800 rounded-full"><X className="w-8 h-8" /></button>
              </div>
              <div className="p-12 text-center">
                {predicting ? (
                  <div className="py-16 flex flex-col items-center gap-6">
                    <div className="w-16 h-16 border-8 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
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
