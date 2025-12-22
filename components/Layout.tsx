
import React from 'react';
import { Tab } from '../types';
import { Trophy, Star, Radio, TrendingUp, BrainCircuit, History } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  lastUpdated?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, lastUpdated }) => {
  return (
    <div className="min-h-screen flex flex-col max-w-5xl mx-auto bg-white shadow-2xl border-x border-green-100">
      {/* Header with Green Soccer Theme */}
      <header className="bg-emerald-800 text-white p-6 sticky top-0 z-50 shadow-md">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-lime-400 p-2 rounded-lg shadow-lg">
              <Trophy className="w-8 h-8 text-emerald-900" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                KickOff <span className="text-lime-400">AI</span>
              </h1>
              <p className="text-xs text-emerald-100 font-medium opacity-90 uppercase tracking-widest">Il tuo campo virtuale</p>
            </div>
          </div>
          {lastUpdated && (
            <div className="text-right hidden sm:block bg-emerald-900/50 px-3 py-1 rounded-full border border-emerald-700">
              <p className="text-[10px] font-bold text-lime-400 uppercase">Aggiornamento</p>
              <p className="text-xs font-mono">{lastUpdated}</p>
            </div>
          )}
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b sticky top-[92px] z-40 overflow-x-auto scrollbar-hide shadow-sm">
        <div className="flex justify-around min-w-[600px]">
          <NavButton 
            active={activeTab === Tab.LIVE} 
            onClick={() => setActiveTab(Tab.LIVE)} 
            icon={<Radio className="w-4 h-4" />} 
            label="Live" 
          />
          <NavButton 
            active={activeTab === Tab.STANDINGS} 
            onClick={() => setActiveTab(Tab.STANDINGS)} 
            icon={<TrendingUp className="w-4 h-4" />} 
            label="Classifiche" 
          />
          <NavButton 
            active={activeTab === Tab.HISTORY} 
            onClick={() => setActiveTab(Tab.HISTORY)} 
            icon={<History className="w-4 h-4" />} 
            label="Cronologia" 
          />
          <NavButton 
            active={activeTab === Tab.FAVORITES} 
            onClick={() => setActiveTab(Tab.FAVORITES)} 
            icon={<Star className="w-4 h-4" />} 
            label="Mie Squadre" 
          />
          <NavButton 
            active={activeTab === Tab.AI_CHAT} 
            onClick={() => setActiveTab(Tab.AI_CHAT)} 
            icon={<BrainCircuit className="w-4 h-4" />} 
            label="IA Stats" 
          />
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 bg-green-50/30">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-emerald-900 p-8 border-t border-emerald-800 text-emerald-200 text-center text-sm">
        <div className="flex justify-center gap-4 mb-4">
            <div className="w-2 h-2 rounded-full bg-lime-400"></div>
            <div className="w-2 h-2 rounded-full bg-emerald-600"></div>
            <div className="w-2 h-2 rounded-full bg-lime-400"></div>
        </div>
        <p className="font-medium italic">Powered by Gemini AI - Dati in tempo reale tramite Google Search Grounding</p>
      </footer>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-4 transition-all border-b-4 ${
      active 
        ? 'border-emerald-600 text-emerald-700 font-bold bg-emerald-50/50' 
        : 'border-transparent text-slate-500 hover:text-emerald-500 hover:bg-slate-50'
    }`}
  >
    {icon}
    <span className="text-sm">{label}</span>
  </button>
);

export default Layout;
