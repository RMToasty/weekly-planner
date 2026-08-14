import React from 'react';
import { DailyData, TodoItem } from './WeeklyPlanner';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DayColumnProps {
  day: string;
  data: DailyData;
  selectedColor: string;
  isToday?: boolean;
  onUpdate: (updates: Partial<DailyData>) => void;
  onAddPriority: () => void;
  onRemovePriority: (id: string) => void;
}

const DayColumn = ({ day, data, selectedColor, isToday, onUpdate, onAddPriority, onRemovePriority }: DayColumnProps) => {
  const hours = [
    '1 AM', '2 AM', '3 AM', '4 AM', '5 AM', '6 AM', '7 AM', '8 AM', '9 AM', '10 AM', '11 AM', '12 PM',
    '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM', '7 PM', '8 PM', '9 PM', '10 PM', '11 PM', '12 AM'
  ];

  const updatePriority = (id: string, updates: Partial<TodoItem>) => {
    const newPriorities = data.priorities.map(p => p.id === id ? { ...p, ...updates } : p);
    onUpdate({ priorities: newPriorities });
  };

  const updateCell = (hourIdx: number, slotIdx: number) => {
    const globalIdx = hourIdx * 6 + slotIdx;
    const newSchedule = [...data.schedule];
    newSchedule[globalIdx] = selectedColor;
    onUpdate({ schedule: newSchedule });
  };

  return (
    <div className="flex-1 min-w-[180px] lg:min-w-[200px] border-r border-slate-300 dark:border-slate-800 flex flex-col text-xs bg-white dark:bg-slate-950">
      {/* Day Header */}
      <div className={cn(
        "border-b-2 p-2 flex items-center gap-2 sticky top-0 z-20 transition-colors duration-500",
        isToday
          ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white"
          : "bg-white border-slate-900 dark:bg-slate-950 dark:border-white dark:text-white"
      )}>
         <div className={cn(
           "w-5 h-5 border-2 flex items-center justify-center font-black text-xs",
           isToday
             ? "border-white dark:border-slate-900"
             : "border-slate-900 dark:border-white"
         )} />
         <span className="font-black uppercase tracking-widest text-[11px]">{day}</span>
      </div>

      {/* Today's Priorities */}
      <div className="p-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="flex justify-between items-center mb-1">
          <h4 className="font-black uppercase text-[9px] text-slate-400 dark:text-slate-500 tracking-wider">Today's Priorities</h4>
          <button
            onClick={onAddPriority}
            className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors font-bold text-[10px]"
          >
            +
          </button>
        </div>
        <div className="space-y-1">
          {data.priorities.map((item) => (
            <div key={item.id} className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-900 py-1 group">
              <button
                onClick={() => updatePriority(item.id, { completed: !item.completed })}
                className={cn(
                  "w-3.5 h-3.5 rounded-full border-2 border-slate-300 dark:border-slate-700 shrink-0 transition-colors",
                  item.completed ? "bg-slate-900 dark:bg-white border-slate-900 dark:border-white" : "hover:border-slate-400 dark:hover:border-slate-500"
                )}
              />
              <input
                value={item.text}
                onChange={(e) => updatePriority(item.id, { text: e.target.value })}
                className={cn(
                  "flex-1 bg-transparent outline-none border-none placeholder:text-slate-200 dark:placeholder:text-slate-800 text-[10px] dark:text-white",
                  item.completed && "line-through text-slate-300 dark:text-slate-600"
                )}
                placeholder="..."
              />
              <button
                onClick={() => onRemovePriority(item.id)}
                className="opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-950 text-slate-300 dark:text-slate-600 hover:text-red-500 transition-all text-[8px]"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Hourly Schedule */}
      <div className="flex-grow flex flex-col min-h-0 bg-slate-50/10 dark:bg-slate-900/5">
        <div className="grid grid-cols-[50px_1fr] border-b border-slate-200 dark:border-slate-800 sticky top-[48px] bg-slate-100/90 dark:bg-slate-900/90 backdrop-blur-md z-10 shadow-sm">
           <div className="border-r border-slate-200 dark:border-slate-800 text-[9px] text-center font-black py-2 uppercase tracking-tighter text-slate-900 dark:text-slate-100">Time</div>
           <div className="grid grid-cols-6 text-[8px] font-black py-2 text-slate-900 dark:text-slate-100 text-center">
             <span>10</span><span>20</span><span>30</span><span>40</span><span>50</span><span>60</span>
           </div>
        </div>
        <div className="flex flex-col">
          {hours.map((hour, hIdx) => (
            <div key={hIdx} className="grid grid-cols-[50px_1fr] h-12 group relative">
              <div className="text-[10px] border-r border-slate-200 dark:border-slate-800 border-b border-slate-100 dark:border-slate-900 flex items-center justify-center font-black text-slate-900 dark:text-white bg-slate-50/80 dark:bg-slate-900/80">
                {hour}
              </div>
              <div className="flex h-full">
                {Array.from({ length: 6 }).map((_, sIdx) => {
                  const globalIdx = hIdx * 6 + sIdx;
                  const color = data.schedule[globalIdx];
                  const rightColor = sIdx < 5 ? data.schedule[globalIdx + 1] : null;
                  const bottomColor = hIdx < 23 ? data.schedule[globalIdx + 6] : null;

                  const isTransparent = color === 'transparent';

                  // Show border-r if:
                  // 1. It's the last slot of the hour
                  // 2. OR the next slot has a different color
                  // 3. OR both are transparent (to show the grid)
                  const showBorderR = sIdx === 5 || color !== rightColor || (isTransparent && rightColor === 'transparent');

                  // Show border-b if:
                  // 1. It's the last hour of the day
                  // 2. OR the next hour's slot has a different color
                  // 3. OR both are transparent (to show the grid)
                  const showBorderB = hIdx === 23 || color !== bottomColor || (isTransparent && bottomColor === 'transparent');

                  return (
                    <div
                      key={sIdx}
                      onClick={() => updateCell(hIdx, sIdx)}
                      onMouseEnter={(e) => {
                        if (e.buttons === 1) updateCell(hIdx, sIdx);
                      }}
                      className={cn(
                        "flex-1 transition-colors duration-75 cursor-crosshair",
                        showBorderR && "border-r border-slate-100 dark:border-slate-900",
                        showBorderB && "border-b border-slate-100 dark:border-slate-900",
                        isTransparent ? "hover:bg-slate-50/50 dark:hover:bg-slate-800/50" : "hover:brightness-95"
                      )}
                      style={{ backgroundColor: isTransparent ? undefined : color }}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="border-t-2 border-slate-900 dark:border-slate-100 p-4 bg-white dark:bg-slate-950 relative">
        <h4 className="font-black uppercase text-[10px] mb-2 text-slate-400 dark:text-slate-500 tracking-wider">Notes</h4>
        <textarea
          value={data.notes}
          onChange={(e) => onUpdate({ notes: e.target.value })}
          className="bg-lined w-full h-40 outline-none resize-none text-sm leading-[24px] pt-[19px] pb-0 overflow-hidden dark:text-white dark:placeholder:text-slate-800"
          spellCheck={false}
          placeholder="Daily reflections..."
        />
      </div>
    </div>
  );
};

export default DayColumn;
