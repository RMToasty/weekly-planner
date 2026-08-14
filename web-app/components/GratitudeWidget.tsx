import React from 'react';
import { Heart } from 'lucide-react';

interface GratitudeWidgetProps {
  data: string[];
  onUpdate: (index: number, val: string) => void;
}

const GratitudeWidget = ({ data, onUpdate }: GratitudeWidgetProps) => {
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 border-b-2 border-slate-900 dark:border-slate-100 pb-1">
        <Heart size={14} className="text-red-400" />
        <h3 className="font-black uppercase tracking-wider text-[11px] dark:text-white">Gratitude Log</h3>
      </div>
      <div className="space-y-1.5">
        {data.map((note, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-4 text-[9px] font-black text-slate-400 dark:text-slate-500">{days[i]}</span>
            <input
              value={note}
              onChange={(e) => onUpdate(i, e.target.value)}
              placeholder="I am grateful for..."
              className="flex-1 bg-transparent border-b border-slate-50 dark:border-slate-800 outline-none text-[10px] py-0.5 focus:border-slate-900 dark:focus:border-white transition-all dark:text-white placeholder:text-slate-200 dark:placeholder:text-slate-700"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default GratitudeWidget;
