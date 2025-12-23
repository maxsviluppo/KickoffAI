
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Layout from './components/Layout';
import MatchCard from './components/MatchCard';
import BettingModal from './components/BettingModal';
import LiveStreamModal from './components/LiveStreamModal';
import { fetchSoccerData, getMatchPrediction, getHistoricalAnalysis } from './services/geminiService';
import { SportsData, Tab, Standing, AIPrediction, Match, Bet, AppNotification, HistoricalSnapshot, FavoriteTeam, TeamNotifications } from './types';
import { 
  RefreshCw, Trophy, BrainCircuit, X, Star, Sparkles, ShieldCheck, Volume2, AlertTriangle, Search, Filter, SlidersHorizontal, Radio, BarChart3, LineChart, FileSearch, History, Settings, Key, Info, ExternalLink, ClipboardList, ChevronRight, Clock, Bell, BellRing, Target, Flag
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
      {(activeTab === Tab.LIVE || activeTab === Tab.RESULTS) && (
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

  // Gestione avanzata preferiti con notifiche
  const [favorites, setFavorites] = useState<FavoriteTeam[]>(() => {
    const saved = localStorage.getItem('kickoff_favorites_v2');
    if (saved) return JSON.parse(saved);
    // Migrazione vecchi preferiti se presenti
    const oldSaved = localStorage.getItem('kickoff_favorites');
    if (oldSaved) {
       const oldNames = JSON.parse(oldSaved) as string[];
       return oldNames.map(name => ({
         name,
         notifications: { goals: true, finalResult: true, matchStart: true }
       }));
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('kickoff_favorites_v2', JSON.stringify(favorites));
  }, [favorites]);

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

  const toggleFavorite = (teamName: string) => {
    setFavorites(prev => {
      const exists = prev.find(f => f.name === teamName);
      if (exists) {
        return prev.filter(f => f.name !== teamName);
      } else {
        return [...prev, {
          name: teamName,
          notifications: { goals: true, finalResult: true, matchStart: true }
        }];
      }
    });
  };

  const updateFavoriteNotification = (teamName: string, type: keyof TeamNotifications) => {
    setFavorites(prev => prev.map(f => {
      if (f.name === teamName) {
        return {
          ...f,
          notifications: { ...f.notifications, [type]: !f.notifications[type] }
        };
      }
      return f;
    }));
  };

  const leagues = useMemo(() => {
    const baseLeagues = ['Serie A', 'Premier League', 'La Liga', 'Bundesliga', 'Ligue 1', 'Champions League'];
    if (!data) return baseLeagues;
    const matchLeagues = data.matches.map(m => m.league);
    const standingLeagues = Object.keys(data.standings);
    return Array.from(new Set([...baseLeagues, ...matchLeagues, ...standingLeagues])).sort();
  }, [data]);

  const matchesByStatus = useMemo(() => {
    if (!data) return { live: [], upcoming: [], finished: [] };
    const filtered = data.matches.filter(m => {
       const searchOk = m.homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) || m.awayTeam.toLowerCase().includes(searchTerm.toLowerCase());
       const leagueOk = selectedLeague === 'All' || m.league === selectedLeague;
       return searchOk && leagueOk;
    });

    return {
      live: filtered.filter(m => m.status.toLowerCase().includes('live') || m.status.toLowerCase().includes('in corso')),
      upcoming: filtered.filter(m => m.status.toLowerCase().includes(':') || m.status.toLowerCase().includes('prossima') || !m.score || m.score === '0-0' && m.status === 'Non iniziata'),
      finished: filtered.filter(m => m.status.toLowerCase().includes('finale') || m.status.toLowerCase().includes('terminata') || m.status.toLowerCase().includes('ft'))
    };
  }, [data, searchTerm, selectedLeague]);

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

  const handleOpenApiKeyDialog = async () => {
    if (window.aistudio) {
       await window.aistudio.openSelectKey();
       setHasApiKey(true);
       loadData(true);
    }
  };

  const handlePlaceBet = useCallback((bet: Bet) => {
    setBalance(prev => {
      const newBalance = prev - bet.amount;
      localStorage.setItem('kickoff_balance', newBalance.toString());
      return newBalance;
    });
    addNotification("Scommessa Simulata", `Piazzata giocata di €${bet.amount} su ${bet.matchName}`, "info");
  }, [addNotification]);

  const handleAnalyzeFavorites = useCallback(async () => {
    if (favorites.length === 0) return;
    setIsAnalyzingHistory(true);
    try {
      const result = await getHistoricalAnalysis(history, favorites.map(f => f.name), thinkingMode);
      setHistoricalAnalysis(result);
    } catch (err) {
      addNotification("Errore Analisi", "Impossibile generare il report strategico.", "info");
    } finally {
      setIsAnalyzingHistory(false);
    }
  }, [favorites, history, thinkingMode, addNotification]);

  const favoriteNames = useMemo(() => favorites.map(f => f.name), [favorites]);

  const renderContent = () => {
    if (!hasApiKey && activeTab !== Tab.SETTINGS) {
       return (
          <div className="py-20 flex flex-col items-center justify-center text-center px-6 bg-white/50 rounded-[3rem] border-2 border-dashed border-red-200 animate-in fade-in">
             <div className="bg-red-50 p-6 rounded-full mb-6"><AlertTriangle className="w-12 h-12 text-red-500" /></div>
             <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-4">API Key Mancante</h3>
             <p className="text-sm text-slate-600 max-w-sm mb-8 font-medium">Configurala nel tab Config per sbloccare l'IA.</p>
             <button onClick={() => setActiveTab(Tab.SETTINGS)} className="bg-emerald-800 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase shadow-xl hover:scale-105 transition-all">Vai alle Impostazioni</button>
          </div>
       );
    }

    if (loading && !data) {
      return (
        <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in">
          <div className="w-28 h-28 border-[12px] border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
          <h3 className="text-3xl font-black text-emerald-950 mt-6 uppercase">Aggiornamento Dati...</h3>
        </div>
      );
    }

    switch (activeTab) {
      case Tab.LIVE:
        return (
          <div className="space-y-10 animate-in fade-in">
            <SearchAndFilterControls searchTerm={searchTerm} setSearchTerm={setSearchTerm} selectedLeague={selectedLeague} setSelectedLeague={setSelectedLeague} liveOnly={false} setLiveOnly={() => {}} activeTab={activeTab} leagues={leagues} />
            
            {/* MATCH LIVE */}
            {matchesByStatus.live.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-600 rounded-full animate-ping"></div><h2 className="text-xl font-black text-emerald-950 uppercase">Match in Corso</h2></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {matchesByStatus.live.map(m => (
                    <MatchCard key={m.id} match={m} onPredict={handlePredict} onBet={setBettingMatch} onWatchLive={setStreamingMatch} onToggleFavorite={toggleFavorite} isFavoriteHome={favoriteNames.includes(m.homeTeam)} isFavoriteAway={favoriteNames.includes(m.awayTeam)} />
                  ))}
                </div>
              </section>
            )}

            {/* PROSSIME PARTITE */}
            <section className="space-y-4">
                <div className="flex items-center gap-2"><Clock className="w-5 h-5 text-emerald-600" /><h2 className="text-xl font-black text-emerald-950 uppercase">Prossime Partite</h2></div>
                <div className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide">
                  {matchesByStatus.upcoming.length > 0 ? matchesByStatus.upcoming.map(m => (
                    <div key={m.id} className="min-w-[300px] flex-shrink-0">
                      <MatchCard match={m} onPredict={handlePredict} onBet={setBettingMatch} onToggleFavorite={toggleFavorite} isFavoriteHome={favoriteNames.includes(m.homeTeam)} isFavoriteAway={favoriteNames.includes(m.awayTeam)} showOdds={true} />
                    </div>
                  )) : <div className="text-slate-400 italic font-medium">Nessuna partita programmata a breve.</div>}
                </div>
            </section>

            {/* ULTIMI 10 RISULTATI */}
            <section className="space-y-4">
                <div className="flex items-center gap-2"><Trophy className="w-5 h-5 text-emerald-600" /><h2 className="text-xl font-black text-emerald-950 uppercase">Ultimi 10 Risultati</h2></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {matchesByStatus.finished.slice(0, 10).map(m => (
                    <MatchCard key={m.id} match={m} onPredict={handlePredict} onToggleFavorite={toggleFavorite} isFavoriteHome={favoriteNames.includes(m.homeTeam)} isFavoriteAway={favoriteNames.includes(m.awayTeam)} />
                  ))}
                </div>
            </section>
          </div>
        );

      case Tab.RESULTS:
        return (
          <div className="space-y-6 animate-in fade-in">
             <SearchAndFilterControls searchTerm={searchTerm} setSearchTerm={setSearchTerm} selectedLeague={selectedLeague} setSelectedLeague={setSelectedLeague} liveOnly={liveOnly} setLiveOnly={setLiveOnly} activeTab={activeTab} leagues={leagues} />
             <div className="bg-white rounded-[2.5rem] shadow-sm border border-emerald-50 overflow-hidden">
                <div className="bg-emerald-900 text-white p-6 font-black uppercase text-xs tracking-widest flex justify-between items-center">
                   <span>Tabellone Risultati</span>
                   <ClipboardList className="w-5 h-5 text-lime-400" />
                </div>
                <div className="divide-y divide-slate-100">
                   {(liveOnly ? matchesByStatus.live : [...matchesByStatus.live, ...matchesByStatus.finished]).map(m => (
                     <div key={m.id} onClick={() => handlePredict(m.homeTeam, m.awayTeam)} className="p-4 md:p-6 hover:bg-emerald-50 cursor-pointer transition-colors flex items-center justify-between group">
                        <div className="flex items-center gap-3 md:gap-8 flex-1">
                           <span className="text-[9px] font-black text-slate-400 uppercase w-20 hidden lg:block truncate">{m.league}</span>
                           <div className="flex-1 flex items-center justify-end gap-3 text-right">
                              <span className="font-bold text-slate-800 text-sm hidden sm:inline">{m.homeTeam}</span>
                              <img src={`https://avatar.vercel.sh/${m.homeTeam}?size=24`} className="w-5 h-5 rounded" />
                           </div>
                           <div className="px-3 py-1 bg-slate-900 text-white font-mono font-black text-lg rounded-lg min-w-[65px] text-center shadow-lg border border-white/10">
                              {m.score}
                           </div>
                           <div className="flex-1 flex items-center gap-3 text-left">
                              <img src={`https://avatar.vercel.sh/${m.awayTeam}?size=24`} className="w-5 h-5 rounded" />
                              <span className="font-bold text-slate-800 text-sm hidden sm:inline">{m.awayTeam}</span>
                           </div>
                        </div>
                        <div className="ml-4 flex items-center gap-4">
                           <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full border ${m.status.toLowerCase().includes('ft') || m.status.toLowerCase().includes('finale') ? 'bg-slate-50 text-slate-400 border-slate-100' : 'bg-red-50 text-red-600 border-red-100 animate-pulse'}`}>{m.status}</span>
                           <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                        </div>
                     </div>
                   ))}
                   {matchesByStatus.live.length === 0 && matchesByStatus.finished.length === 0 && (
                      <div className="p-16 text-center text-slate-400 italic font-medium">Nessun risultato trovato per i criteri selezionati.</div>
                   )}
                </div>
             </div>
          </div>
        );

      case Tab.FAVORITES:
        return (
          <div className="space-y-10 animate-in fade-in">
             <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 p-10 rounded-[3rem] text-white flex justify-between items-center shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-lime-400/10 blur-3xl rounded-full -mr-16 -mt-16"></div>
                <div>
                  <h2 className="text-3xl font-black tracking-tighter uppercase mb-1">Mie Squadre</h2>
                  <p className="text-emerald-300 text-xs font-medium uppercase tracking-widest">Configura notifiche push personalizzate</p>
                </div>
                <Star className="w-12 h-12 text-lime-400 fill-current" />
             </div>

             {favorites.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {favorites.map(fav => (
                    <div key={fav.name} className="bg-white p-8 rounded-[2.5rem] border border-emerald-50 shadow-sm hover:shadow-md transition-shadow">
                       <div className="flex items-center justify-between mb-8">
                          <div className="flex items-center gap-4">
                             <div className="p-3 bg-emerald-50 rounded-2xl">
                                <img src={`https://avatar.vercel.sh/${fav.name}?size=40`} className="w-10 h-10 rounded-lg" alt="" />
                             </div>
                             <div>
                                <h4 className="font-black text-slate-800 uppercase text-lg tracking-tight">{fav.name}</h4>
                                <span className="text-[10px] font-black text-emerald-500 uppercase flex items-center gap-1.5">
                                   <BellRing className="w-3 h-3" /> Alert Attivi
                                </span>
                             </div>
                          </div>
                          <button onClick={() => toggleFavorite(fav.name)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                            <X className="w-6 h-6" />
                          </button>
                       </div>

                       <div className="grid grid-cols-3 gap-3">
                          <NotificationToggle 
                             active={fav.notifications.matchStart} 
                             label="Inizio" 
                             icon={<Clock className="w-3.5 h-3.5" />} 
                             onClick={() => updateFavoriteNotification(fav.name, 'matchStart')}
                          />
                          <NotificationToggle 
                             active={fav.notifications.goals} 
                             label="Gol" 
                             icon={<Target className="w-3.5 h-3.5" />} 
                             onClick={() => updateFavoriteNotification(fav.name, 'goals')}
                          />
                          <NotificationToggle 
                             active={fav.notifications.finalResult} 
                             label="Finale" 
                             icon={<Flag className="w-3.5 h-3.5" />} 
                             onClick={() => updateFavoriteNotification(fav.name, 'finalResult')}
                          />
                       </div>
                    </div>
                  ))}
               </div>
             ) : (
               <div className="py-24 text-center bg-white/40 rounded-[3rem] border-2 border-dashed border-emerald-100 flex flex-col items-center gap-6">
                  <div className="bg-emerald-50 p-6 rounded-full"><Star className="w-12 h-12 text-emerald-200" /></div>
                  <div className="space-y-2">
                    <p className="text-slate-500 font-black uppercase text-sm tracking-widest">Nessun preferito salvato</p>
                    <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto">Aggiungi squadre dalla Home cliccando sulla stella per ricevere aggiornamenti in tempo reale.</p>
                  </div>
               </div>
             )}
          </div>
        );

      case Tab.STANDINGS:
        return (
          <div className="space-y-6 animate-in fade-in">
            <SearchAndFilterControls searchTerm={searchTerm} setSearchTerm={setSearchTerm} selectedLeague={selectedLeague} setSelectedLeague={setSelectedLeague} liveOnly={false} setLiveOnly={() => {}} activeTab={activeTab} leagues={leagues} />
            {data && (Object.entries(data.standings) as [string, Standing[]][]).filter(([league]) => selectedLeague === 'All' || league === selectedLeague).map(([league, teams]) => (
                <div key={league} className="bg-white rounded-[2.5rem] shadow-sm border border-emerald-50 overflow-hidden mb-8">
                  <div className="bg-emerald-900 text-white p-6 font-black text-xs uppercase tracking-widest flex justify-between items-center">
                    <span>{league}</span><Trophy className="w-5 h-5 text-lime-400" />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[500px]">
                        <thead className="bg-slate-50 text-slate-500 font-black uppercase text-[10px]">
                        <tr><th className="p-6">Pos</th><th className="p-6">Squadra</th><th className="p-6 text-center">G</th><th className="p-6 text-center">Pts</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                        {teams.map(t => (
                            <tr key={t.team} className="hover:bg-emerald-50/50 transition-colors">
                            <td className="p-6 font-bold text-emerald-600">#{t.rank}</td>
                            <td className="p-6 font-black text-slate-800">{t.team}</td>
                            <td className="p-6 text-center font-bold text-slate-500">{t.played}</td>
                            <td className="p-6 text-center font-mono font-bold text-emerald-700">{t.points}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                  </div>
                </div>
              ))}
          </div>
        );

      case Tab.SETTINGS:
        return (
          <div className="space-y-10 animate-in fade-in">
             <div className="bg-white rounded-[3rem] shadow-xl border border-emerald-50 p-12 space-y-10">
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="bg-emerald-50 p-4 rounded-full"><Settings className="w-12 h-12 text-emerald-600" /></div>
                    <h3 className="text-2xl font-black uppercase tracking-tight">Impostazioni Applicazione</h3>
                </div>
                <div className="bg-emerald-50 p-8 rounded-[2rem] border border-emerald-100 space-y-6">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <Key className={`w-5 h-5 ${hasApiKey ? 'text-emerald-600' : 'text-red-500'}`} />
                          <h4 className="font-black text-xs uppercase text-slate-800 tracking-wider">Gemini API Key</h4>
                       </div>
                       <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${hasApiKey ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                          {hasApiKey ? 'Attiva' : 'Mancante'}
                       </div>
                    </div>
                    <button onClick={handleOpenApiKeyDialog} className="w-full bg-emerald-800 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-3"><Key className="w-4 h-4" /> Configura API Key</button>
                    <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="flex items-center justify-center gap-2 text-[10px] font-black text-emerald-600 uppercase hover:underline"><Info className="w-3 h-3" /> Info Fatturazione Google</a>
                </div>
                <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-center gap-4">
                   <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="px-6 py-3 border border-red-100 text-red-500 font-black text-[10px] uppercase flex items-center justify-center gap-2 hover:bg-red-50 rounded-xl transition-colors"><RefreshCw className="w-3 h-3" /> Reset App</button>
                </div>
             </div>
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
                      <p className="text-emerald-200 text-sm font-medium">Analisi strategica basata sui dati storici e le tue squadre.</p>
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
                      {isAnalyzingHistory ? "Analisi..." : "Avvia Analisi Strategica"}
                   </button>
                </div>
                {favorites.length > 0 && (
                   <div className="flex flex-wrap gap-2 mt-6 relative z-10">
                      {favorites.map(f => (
                         <span key={f.name} className="px-3 py-1 bg-emerald-800/50 border border-emerald-700 rounded-lg text-[10px] font-black uppercase text-lime-400">{f.name}</span>
                      ))}
                   </div>
                )}
             </div>
             {historicalAnalysis && (
                <div className="bg-white p-10 rounded-[3rem] border border-emerald-50 shadow-xl animate-in slide-in-from-bottom-4">
                   <div className="flex items-center justify-between mb-8">
                      <h4 className="text-xl font-black text-emerald-950 uppercase tracking-tight">Report IA</h4>
                      <button onClick={() => setHistoricalAnalysis(null)} className="text-slate-400 hover:text-red-500"><X className="w-5 h-5" /></button>
                   </div>
                   <div className="prose prose-emerald max-w-none whitespace-pre-wrap text-sm text-slate-700 font-medium leading-relaxed">
                      {historicalAnalysis}
                   </div>
                </div>
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
             <div className={`p-4 rounded-2xl transition-all duration-700 ${thinkingMode ? 'bg-lime-400 text-emerald-900 rotate-12 shadow-[0_0_20px_rgba(163,230,53,0.5)]' : 'bg-emerald-900 text-emerald-50'}`}><BrainCircuit className="w-8 h-8" /></div>
             <div><p className="text-white text-[11px] font-black uppercase tracking-[0.2em]">IA Analysis Mode</p></div>
          </div>
          <button onClick={() => setThinkingMode(!thinkingMode)} className={`px-8 py-4 rounded-2xl text-[11px] font-black transition-all border-2 uppercase tracking-widest ${thinkingMode ? 'bg-lime-400 border-lime-300 text-emerald-950 shadow-lg' : 'bg-transparent border-emerald-800 text-emerald-500'}`}>{thinkingMode ? 'Thinking On' : 'Standard'}</button>
      </div>

      {renderContent()}
      
      {data?.sources && data.sources.length > 0 && activeTab !== Tab.SETTINGS && (
        <div className="mt-12 p-8 bg-white rounded-[3rem] border-2 border-emerald-50">
          <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3"><Search className="w-4 h-4 text-emerald-500" /> Fonti Analizzate</h4>
          <div className="flex flex-wrap gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {data.sources.map((source, idx) => (
              <a key={idx} href={source.uri} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 flex items-center gap-3 bg-emerald-50 text-emerald-700 px-4 py-2.5 rounded-[1.25rem] text-[11px] font-black uppercase hover:bg-emerald-100 transition-all border border-emerald-100">{source.title || 'Dettaglio'} <ExternalLink className="w-4 h-4" /></a>
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
                        <div className="inline-block px-6 py-2 bg-lime-400 text-emerald-950 rounded-full text-[11px] font-black uppercase mt-6 shadow-lg">Confidenza: {prediction?.confidence}</div>
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

const NotificationToggle: React.FC<{ active: boolean; label: string; icon: React.ReactNode; onClick: () => void }> = ({ active, label, icon, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
      active 
        ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-100' 
        : 'bg-slate-50 border-slate-100 text-slate-400 grayscale'
    }`}
  >
    {icon}
    <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

export default App;
