
import React, { useState, useEffect, useCallback } from 'react';
import { Tab } from '../types';
import { Trophy, Star, Radio, TrendingUp, BrainCircuit, Wallet, Settings, Key, Info, ExternalLink } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  lastUpdated?: string;
  balance?: number;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, lastUpdated, balance }) => {
  const [isPulsing, setIsPulsing] = useState(false);
  const [hasKey, setHasKey] = useState(true);

  const checkKey = useCallback(async () => {
    try {
      if (window.aistudio) {
          const ok = await window.aistudio.hasSelectedApiKey();
          setHasKey(ok);
      }
    } catch (e) {
      console.warn("API Key check delayed");
    }
  }, []);

  useEffect(() => {
    checkKey();
    // Ridotta frequenza di controllo per mobile
    const interval = setInterval(checkKey, 5000);
    return () => clearInterval(interval);
  }, [checkKey]);

  useEffect(() => {
    if (balance !== undefined) {
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 600);
      return () => clearTimeout(timer);
    }
  }, [balance]);

  const handleOpenKey = async () => {
    if (window.aistudio) {
        await window.aistudio.openSelectKey();
        // Procedi ottimisticamente come da linee guida
        setHasKey(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col max-w-5xl mx-auto bg-white shadow-2xl border-x border-green-100 overflow-x-hidden">
      <header className="bg-emerald-800 text-white p-4 md:p-6 sticky top-0 z-50 shadow-md">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-lime-400 p-2 rounded-lg shadow-lg"><Trophy className="w-6 h-6 md:w-8 md:h-8 text-emerald-900" /></div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2">KickOff <span className="text-lime-400">AI</span></h1>
              <p className="text-[10px] text-emerald-100 font-medium opacity-90 uppercase tracking-widest hidden md:block">Il tuo campo virtuale</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-3">
            <div className="relative group">
                <button 
                    onClick={handleOpenKey}
                    className={`p-2 md:p-2.5 rounded-2xl border transition-all shadow-inner relative ${
                        hasKey 
                        ? 'bg-emerald-700/50 border-emerald-600 text-lime-400 hover:bg-emerald-600' 
                        : 'bg-red-500/20 border-red-500 text-red-400 animate-pulse'
                    }`}
                >
                    <Key className="w-4 h-4 md:w-5 md:h-5" />
                    {!hasKey && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border border-emerald-800"></span>
                      </span>
                    )}
                </button>
                
                {/* GUIDE TOOLTIP - Hidden on small mobile touch */}
                <div className="absolute top-full right-0 mt-3 w-64 md:w-72 bg-white rounded-[1.5rem] shadow-2xl border border-emerald-100 p-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] text-slate-800 translate-y-1 group-hover:translate-y-0 hidden md:block">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="bg-emerald-100 p-1.5 rounded-lg"><Info className="w-3.5 h-3.5 text-emerald-600" /></div>
                        <p className="text-[11px] font-black uppercase text-emerald-700 tracking-wider">Gestione API Key</p>
                    </div>
                    <p className="text-xs font-medium leading-relaxed mb-4 text-slate-500">
                      Per sbloccare le analisi IA e i dati in tempo reale, collega una chiave API Gemini valida.
                    </p>
                    <div className="pt-3 border-t border-slate-50">
                      <a 
                        href="https://ai.google.dev/gemini-api/docs/billing" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[10px] font-black text-emerald-600 hover:text-emerald-500 uppercase flex items-center justify-between group/link"
                      >
                          Documentazione
                          <ExternalLink className="w-3 h-3 group-hover/link:translate-x-0.5 transition-transform" />
                      </a>
                    </div>
                </div>
            </div>

            {balance !== undefined && (
              <div className={`bg-emerald-700/50 px-3 md:px-4 py-1.5 md:py-2 rounded-2xl border border-emerald-600 flex items-center gap-2 md:gap-3 shadow-inner transition-all ${isPulsing ? 'animate-balance-ping border-lime-400 bg-emerald-600' : ''}`}>
                <div className={`p-1 rounded-lg hidden md:block transition-colors ${isPulsing ? 'bg-white' : 'bg-lime-400'}`}><Wallet className={`w-3 h-3 md:w-3.5 md:h-3.5 transition-colors ${isPulsing ? 'text-emerald-600' : 'text-emerald-900'}`} /></div>
                <div>
                  <p className={`text-[8px] font-black uppercase leading-none mb-0.5 transition-colors ${isPulsing ? 'text-white' : 'text-lime-400'}`}>Saldo</p>
                  <p className="text-xs md:text-sm font-black font-mono">€{balance.toFixed(2)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <nav className="bg-white border-b sticky top-[68px] md:top-[92px] z-40 overflow-x-auto scrollbar-hide shadow-sm">
        <div className="flex justify-around min-w-[500px] md:min-w-[700px]">
          <NavButton active={activeTab === Tab.LIVE} onClick={() => setActiveTab(Tab.LIVE)} icon={<Radio className="w-4 h-4" />} label="Live" />
          <NavButton active={activeTab === Tab.STANDINGS} onClick={() => setActiveTab(Tab.STANDINGS)} icon={<TrendingUp className="w-4 h-4" />} label="Classifiche" />
          <NavButton active={activeTab === Tab.FAVORITES} onClick={() => setActiveTab(Tab.FAVORITES)} icon={<Star className="w-4 h-4" />} label="Squadre" />
          <NavButton active={activeTab === Tab.AI_CHAT} onClick={() => setActiveTab(Tab.AI_CHAT)} icon={<BrainCircuit className="w-4 h-4" />} label="IA Stats" />
          <NavButton active={activeTab === Tab.SETTINGS} onClick={() => setActiveTab(Tab.SETTINGS)} icon={<Settings className="w-4 h-4" />} label="Config" />
        </div>
      </nav>

      <main className="flex-1 p-4 md:p-8 bg-green-50/30">{children}</main>

      <footer className="bg-emerald-900 p-6 md:p-8 border-t border-emerald-800 text-emerald-200 text-center text-xs md:text-sm">
        <p className="font-medium italic opacity-80">Powered by Gemini AI - Dati in tempo reale</p>
      </footer>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 md:px-6 py-4 transition-all border-b-4 ${active ? 'border-emerald-600 text-emerald-700 font-bold bg-emerald-50/50' : 'border-transparent text-slate-500 hover:text-emerald-500 hover:bg-slate-50'}`}
  >
    {icon}<span className="text-xs md:text-sm">{label}</span>
  </button>
);

export default Layout;
