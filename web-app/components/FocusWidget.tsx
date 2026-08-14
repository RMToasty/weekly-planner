import React from 'react';
import { Target } from 'lucide-react';

interface FocusWidgetProps {
  data: string[];
  onUpdate: (index: number, val: string) => void;
}

const FocusWidget = ({ data, onUpdate }: FocusWidgetProps) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 border-b-2 border-slate-900 dark:border-slate-100 pb-1">
        <Target size={14} className="text-slate-400" />
        <h3 className="font-black uppercase tracking-wider text-[11px] dark:text-white">Weekly Focus</h3>
      </div>
      <div className="space-y-2">
        {data.map((focus, i) => (
          <div key={i} className="flex items-center gap-2 group">
            <span className="text-[10px] font-black text-slate-300 dark:text-slate-600">{i + 1}</span>
            <input
              value={focus}
              onChange={(e) => onUpdate(i, e.target.value)}
              placeholder="Primary focus..."
              className="flex-1 bg-transparent border-b border-slate-50 dark:border-slate-800 outline-none text-[11px] py-0.5 focus:border-slate-900 dark:focus:border-white transition-all dark:text-white placeholder:text-slate-200 dark:placeholder:text-slate-700"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default FocusWidget;
