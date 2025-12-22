
import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';

interface WidgetWrapperProps {
  src: string;
  height: string;
  title: string;
  description?: string;
}

const WidgetWrapper: React.FC<WidgetWrapperProps> = ({ src, height, title, description }) => {
  return (
    <div className="bg-white rounded-[2.5rem] border border-emerald-100 shadow-sm overflow-hidden flex flex-col mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-emerald-50 px-8 py-4 border-b border-emerald-100 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5" /> {title} - Fonte Ufficiale
          </span>
          {description && <p className="text-[10px] text-emerald-600 font-bold mt-0.5">{description}</p>}
        </div>
        <div className="bg-white/50 p-1.5 rounded-lg border border-emerald-100">
          <Info className="w-4 h-4 text-emerald-400" />
        </div>
      </div>
      <div className="flex justify-center bg-slate-50/30 overflow-x-auto py-8">
        <div className="min-w-[500px] flex justify-center px-4">
            <iframe 
                src={src} 
                width="500" 
                height={height} 
                scrolling="no" 
                frameBorder="0" 
                loading="lazy"
                className="shadow-2xl rounded-[2rem] border border-emerald-100/50 bg-white"
            ></iframe>
        </div>
      </div>
    </div>
  );
};

export default WidgetWrapper;
