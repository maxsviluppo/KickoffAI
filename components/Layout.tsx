
import React, { useState, useEffect } from 'react';
import { Tab } from '../types';
import { Trophy, Star, Radio, TrendingUp, BrainCircuit, Wallet, Settings } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  lastUpdated?: string;
  balance?: number;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, balance }) => {
  const [isPulsing, setIsPulsing] = useState(false);

  useEffect(() => {
    if (balance !== undefined) {
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 600);
      return () => clearTimeout(timer);
    }
  }, [balance]);

  return (
    <div className="min-h-screen flex flex-col max-w-5xl mx-auto bg-white shadow-2xl border-x border-green-100 overflow-x-hidden">
      <header className="bg-emerald-800 text-white p-4 md:p-6 sticky top-0 z-50 shadow-md">
        <div className="flex justify-between items-center">
          {/* Left Section: Logo & Balance */}
          <div className="flex items-center gap-4 md:gap-6">
            <div className="flex items-center gap-3">
              <div className="bg-lime-400 p-2 rounded-lg shadow-lg"><Trophy className="w-6 h-6 md:w-8 md:h-8 text-emerald-900" /></div>
              <div className="hidden sm:block">
                <h1 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2">KickOff <span className="text-lime-400">AI</span></h1>
              </div>
            </div>

            {/* Spostato qui a SX come richiesto */}
            {balance !== undefined && (
              <div className={`bg-emerald-700/50 px-3 md:px-4 py-1.5 md:py-2 rounded-2xl border border-emerald-600 flex items-center gap-2 md:gap-3 shadow-inner transition-all ${isPulsing ? 'animate-balance-ping border-lime-400 bg-emerald-600' : ''}`}>
                <div className={`p-1 rounded-lg transition-colors ${isPulsing ? 'bg-white' : 'bg-lime-400'}`}><Wallet className={`w-3 h-3 md:w-3.5 md:h-3.5 transition-colors ${isPulsing ? 'text-emerald-600' : 'text-emerald-900'}`} /></div>
                <div>
                  <p className={`text-[8px] font-black uppercase leading-none mb-0.5 transition-colors ${isPulsing ? 'text-white' : 'text-lime-400'}`}>Saldo Virtuale</p>
                  <p className="text-xs md:text-sm font-black font-mono">€{balance.toFixed(2)}</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Right Section: Mobile Logo or Info */}
          <div className="flex items-center gap-2 sm:hidden">
             <h1 className="text-lg font-black tracking-tight">K<span className="text-lime-400">AI</span></h1>
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
