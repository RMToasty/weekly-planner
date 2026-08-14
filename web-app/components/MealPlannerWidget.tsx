import React from 'react';
import { UtensilsCrossed } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MealPlannerWidgetProps {
  data: string[];
  onUpdate: (index: number, val: string) => void;
}

const MealPlannerWidget = ({ data, onUpdate }: MealPlannerWidgetProps) => {
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 border-b-2 border-slate-900 dark:border-slate-100 pb-1">
        <UtensilsCrossed size={14} className="text-slate-400" />
        <h3 className="font-black uppercase tracking-wider text-[11px] dark:text-white">Meal Planner</h3>
      </div>
      <div className="space-y-1.5">
        {data.map((meal, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-4 text-[9px] font-black text-slate-400 dark:text-slate-500">{days[i]}</span>
            <input
              value={meal}
              onChange={(e) => onUpdate(i, e.target.value)}
              placeholder="..."
              className="flex-1 bg-transparent border-b border-slate-50 dark:border-slate-800 outline-none text-[10px] py-0.5 focus:border-slate-900 dark:focus:border-white transition-all dark:text-white placeholder:text-slate-200 dark:placeholder:text-slate-700"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default MealPlannerWidget;
