import React, { useState, useRef, useEffect } from 'react';
import { DailyData, TodoItem } from './WeeklyPlanner';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { MessageSquare, Smile, X, Check } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DayColumnProps {
  day: string;
  data: DailyData;
  templateMode: boolean;
  isExporting?: boolean;
  selectedColor: string;
  isToday?: boolean;
  onUpdate: (updates: Partial<DailyData>) => void;
  onAddPriority: () => void;
  onRemovePriority: (id: string) => void;
}

const DayColumn = ({ day, data, templateMode, isExporting, selectedColor, isToday, onUpdate, onAddPriority, onRemovePriority }: DayColumnProps) => {
  const [editingBlockIdx, setEditingBlockIdx] = useState<number | null>(null);
  const [hoveredBlockIdx, setHoveredBlockIdx] = useState<number | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

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

  const getBlockRoot = (idx: number) => {
    const color = data.schedule[idx];
    if (color === 'transparent') return null;
    let current = idx;
    // Look up as far as possible
    while (current >= 6 && data.schedule[current - 6] === color) current -= 6;
    // Look left as far as possible within the same hour
    while (current % 6 > 0 && data.schedule[current - 1] === color) current -= 1;
    return current;
  };

  const getBlockDimensions = (rootIdx: number) => {
    const color = data.schedule[rootIdx];
    let width = 0;
    let height = 0;

    // Calculate max width in the first row of the block
    let current = rootIdx;
    while (current % 6 < 6 && data.schedule[current] === color && (current === rootIdx || current % 6 !== 0)) {
      width++;
      current++;
      if (current % 6 === 0) break;
    }

    // Calculate height (must have the same width across all rows to be a "block")
    let rowStart = rootIdx;
    while (rowStart + 6 < 144) {
      let isRowMatch = true;
      for (let i = 0; i < width; i++) {
        if (data.schedule[rowStart + 6 + i] !== color) {
          isRowMatch = false;
          break;
        }
      }
      if (isRowMatch) {
        height++;
        rowStart += 6;
      } else {
        break;
      }
    }

    return { width, height: height + 1 };
  };

  const handleContextMenu = (e: React.MouseEvent, idx: number) => {
    if (data.schedule[idx] === 'transparent') return;
    e.preventDefault();
    setEditingBlockIdx(getBlockRoot(idx));
  };

  const handleTouchStart = (idx: number) => {
    if (data.schedule[idx] === 'transparent') return;
    longPressTimer.current = setTimeout(() => {
      setEditingBlockIdx(getBlockRoot(idx));
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const updateMetadata = (rootIdx: number, updates: { text?: string, symbol?: string }) => {
    const newMetadata = { ...(data.blockMetadata || {}) };
    newMetadata[rootIdx] = { ...(newMetadata[rootIdx] || {}), ...updates };
    onUpdate({ blockMetadata: newMetadata });
  };

  const deleteMetadata = (rootIdx: number) => {
    const newMetadata = { ...(data.blockMetadata || {}) };
    delete newMetadata[rootIdx];
    onUpdate({ blockMetadata: newMetadata });
  };

  return (
    <div className={cn(
      "flex-1 flex flex-col text-xs bg-white dark:bg-slate-950 relative",
      isExporting ? "min-w-[200px]" : "min-w-[180px] lg:min-w-[200px] border-r border-slate-300 dark:border-slate-800"
    )}>
      {/* Sticky Top Section: Header + Priorities + Grid Header */}
      <div className={cn(
        "z-30 bg-white dark:bg-slate-950 shadow-sm",
        isExporting ? "relative" : "sticky top-0"
      )}>
        {/* Day Header */}
        <div className={cn(
          "border-b-2 p-1.5 flex items-center gap-2 transition-colors duration-500",
          isToday
            ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white"
            : "bg-white border-slate-900 dark:bg-slate-950 dark:border-white dark:text-white"
        )}>
           <div className={cn(
             "w-4 h-4 border-2 flex items-center justify-center font-black text-[10px]",
             isToday
               ? "border-white dark:border-slate-900"
               : "border-slate-900 dark:border-white"
           )} />
           <span className="font-black uppercase tracking-widest text-[10px]">{day}</span>
        </div>

        {/* Today's Priorities */}
        <div className="p-1.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
          <div className="flex justify-between items-center mb-1">
            <h4 className="font-black uppercase text-[8px] text-slate-400 dark:text-slate-500 tracking-wider">Today's Priorities</h4>
            <button
              onClick={onAddPriority}
              className="w-3.5 h-3.5 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors font-bold text-[8px]"
            >
              +
            </button>
          </div>
          <div className="space-y-0.5">
            {data.priorities.map((item) => (
              <div key={item.id} className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-900 py-0.5 group">
                <button
                  onClick={() => updatePriority(item.id, { completed: !item.completed })}
                  className={cn(
                    "w-3 h-3 rounded-full border-2 border-slate-300 dark:border-slate-700 shrink-0 transition-colors",
                    item.completed ? "bg-slate-900 dark:bg-white border-slate-900 dark:border-white" : "hover:border-slate-400 dark:hover:border-slate-500"
                  )}
                />
                <input
                  value={item.text}
                  onChange={(e) => updatePriority(item.id, { text: e.target.value })}
                  className={cn(
                    "flex-1 bg-transparent outline-none border-none placeholder:text-slate-200 dark:placeholder:text-slate-800 text-[9px] dark:text-white",
                    item.completed && "line-through text-slate-300 dark:text-slate-600"
                  )}
                  placeholder="..."
                />
                <button
                  onClick={() => onRemovePriority(item.id)}
                  className="opacity-0 group-hover:opacity-100 w-3.5 h-3.5 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-950 text-slate-300 dark:text-slate-600 hover:text-red-500 transition-all text-[7px]"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Schedule Grid Header */}
        <div className="grid grid-cols-[50px_1fr] border-b border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-900/90 backdrop-blur-md">
           <div className="border-r border-slate-200 dark:border-slate-800 text-[8px] text-center font-black py-1 uppercase tracking-tighter text-slate-900 dark:text-slate-100">Time</div>
           <div className="grid grid-cols-6 text-[7px] font-black py-1 text-slate-900 dark:text-slate-100 text-center">
             <span>10</span><span>20</span><span>30</span><span>40</span><span>50</span><span>60</span>
           </div>
        </div>
      </div>

      {/* Hourly Schedule (Scrollable area) */}
      <div className={cn(
        "flex-grow flex flex-col min-h-0 bg-slate-50/10 dark:bg-slate-900/5",
        isExporting ? "overflow-visible" : ""
      )}>
        <div className="flex flex-col">
          {hours.map((hour, hIdx) => (
            <div key={hIdx} className="grid grid-cols-[50px_1fr] h-8 group relative">
              <div className="text-[9px] border-r border-slate-200 dark:border-slate-800 border-b border-slate-100 dark:border-slate-800 flex items-center justify-center font-black text-slate-900 dark:text-white bg-slate-50/80 dark:bg-slate-900/80">
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

                  const rootIdx = getBlockRoot(globalIdx);
                  const metadata = rootIdx !== null ? data.blockMetadata?.[rootIdx] : null;
                  const isRoot = rootIdx === globalIdx;
                  const dims = isRoot ? getBlockDimensions(rootIdx) : null;

                  return (
                    <div
                      key={sIdx}
                      onClick={() => updateCell(hIdx, sIdx)}
                      onContextMenu={(e) => handleContextMenu(e, globalIdx)}
                      onTouchStart={() => handleTouchStart(globalIdx)}
                      onTouchEnd={handleTouchEnd}
                      onMouseEnter={(e) => {
                        if (e.buttons === 1) updateCell(hIdx, sIdx);
                        if (rootIdx !== null) setHoveredBlockIdx(rootIdx);
                      }}
                      onMouseLeave={() => setHoveredBlockIdx(null)}
                      className={cn(
                        "flex-1 transition-colors duration-75 cursor-crosshair relative group/cell",
                        showBorderR && "border-r border-slate-100 dark:border-slate-800",
                        showBorderB && "border-b border-slate-100 dark:border-slate-800",
                        isTransparent ? "hover:bg-slate-50/50 dark:hover:bg-slate-800/50" : "hover:brightness-95"
                      )}
                      style={{ backgroundColor: isTransparent ? undefined : color }}
                    >
                      {isRoot && metadata?.symbol && dims && (
                        <div
                          className="absolute top-0 left-0 flex items-center justify-center text-[10px] pointer-events-none select-none z-10"
                          style={{
                            width: `${dims.width * 100}%`,
                            height: `${dims.height * 100}%`
                          }}
                        >
                          <span className="bg-white/20 dark:bg-black/20 backdrop-blur-[2px] rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                            {metadata.symbol}
                          </span>
                        </div>
                      )}

                      {/* Floating Island Tooltip - Rendered only at root for proper centering */}
                      {isRoot && metadata?.text && hoveredBlockIdx === rootIdx && dims && (
                        <div
                          className="absolute bottom-full mb-2 z-50 pointer-events-none flex justify-center"
                          style={{
                            left: 0,
                            width: `${dims.width * 100}%`
                          }}
                        >
                          <div className="px-2 py-1 bg-slate-900 dark:bg-slate-800 text-white text-[8px] font-bold rounded shadow-xl whitespace-nowrap animate-tooltip relative">
                            {metadata.text}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-800" />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sticky Bottom Section: Notes */}
      <div className={cn(
        "z-30 border-t-2 border-slate-900 dark:border-slate-100 p-3 bg-white dark:bg-slate-950 shadow-[0_-1px_3px_rgba(0,0,0,0.05)]",
        isExporting ? "relative" : "sticky bottom-0"
      )}>
        <h4 className="font-black uppercase text-[9px] mb-1.5 text-slate-400 dark:text-slate-500 tracking-wider">Notes</h4>
        <textarea
          value={data.notes}
          onChange={(e) => onUpdate({ notes: e.target.value })}
          className="bg-lined bg-transparent w-full h-24 outline-none resize-none text-sm font-sans leading-[24px] pt-[21px] pb-0 overflow-hidden dark:text-white dark:placeholder:text-slate-800"
          spellCheck={false}
          placeholder="Daily reflections..."
        />
      </div>

      {/* Edit Modal */}
      {editingBlockIdx !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setEditingBlockIdx(null)}
          />
          <div className="relative w-full max-w-[280px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in duration-200">
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <span className="font-black uppercase tracking-widest text-[10px] dark:text-white">Label Block</span>
              <button
                onClick={() => setEditingBlockIdx(null)}
                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 dark:text-white"
              >
                <X size={14} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-400">Symbol / Emoji</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={2}
                    value={data.blockMetadata?.[editingBlockIdx]?.symbol || ''}
                    onChange={(e) => updateMetadata(editingBlockIdx, { symbol: e.target.value })}
                    placeholder="⚡"
                    className="w-12 h-10 text-center text-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-slate-900 dark:focus:border-white transition-all dark:text-white"
                  />
                  <div className="flex-1 flex items-center px-3 bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg text-[10px] text-slate-400">
                    Max 2 chars
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-400">Description</label>
                <textarea
                  value={data.blockMetadata?.[editingBlockIdx]?.text || ''}
                  onChange={(e) => updateMetadata(editingBlockIdx, { text: e.target.value })}
                  placeholder="Task description..."
                  className="w-full h-20 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-slate-900 dark:focus:border-white transition-all text-xs dark:text-white resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    deleteMetadata(editingBlockIdx);
                    setEditingBlockIdx(null);
                  }}
                  className="flex-1 h-9 text-[10px] font-black uppercase text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors border border-red-100 dark:border-red-900/30"
                >
                  Clear
                </button>
                <button
                  onClick={() => setEditingBlockIdx(null)}
                  className="flex-1 h-9 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase rounded-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                >
                  <Check size={14} /> Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DayColumn;
