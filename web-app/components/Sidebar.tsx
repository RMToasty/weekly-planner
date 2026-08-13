import React, { useRef } from 'react';
import { TodoItem, HabitItem } from './WeeklyPlanner';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  priorities: TodoItem[];
  todos: TodoItem[];
  habits: HabitItem[];
  plannerColors: string[];
  selectedColor: string;
  onUpdateWeekly: (type: 'priority' | 'todo', id: string, updates: Partial<TodoItem>) => void;
  onUpdateHabit: (index: number, updates: Partial<HabitItem>) => void;
  onAddWeekly: (type: 'priority' | 'todo', color?: string) => void;
  onRemoveWeekly: (type: 'priority' | 'todo', id: string) => void;
  onClearWeekly: (type: 'priority' | 'todo') => void;
  onAddColor: (hex: string) => void;
  onRemoveColor: (hex: string) => void;
  onSelectColor: (hex: string) => void;
}

const Sidebar = ({
  priorities, todos, habits, plannerColors, selectedColor,
  onUpdateWeekly, onUpdateHabit, onAddWeekly, onRemoveWeekly, onClearWeekly,
  onAddColor, onRemoveColor, onSelectColor
}: SidebarProps) => {
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [addingType, setAddingType] = React.useState<'priority' | 'todo' | null>(null);

  const renderColorPicker = (type: 'priority' | 'todo') => (
    <div className="flex items-center gap-1.5 p-2 bg-slate-50 rounded-lg animate-in slide-in-from-top-1 duration-200 mt-1 mb-2">
      <span className="text-[9px] font-black text-slate-400 uppercase mr-1">Pick:</span>
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => { onAddWeekly(type, 'transparent'); setAddingType(null); }}
          className="w-5 h-5 rounded-full border border-slate-300 bg-white flex items-center justify-center text-[10px] hover:scale-110 transition-transform"
        >
          ✕
        </button>
        {plannerColors.map((c) => (
          <button
            key={c}
            onClick={() => { onAddWeekly(type, c); setAddingType(null); }}
            className="w-5 h-5 rounded-full hover:scale-110 transition-transform border border-white shadow-sm"
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-full lg:w-72 lg:border-r border-slate-300 p-4 flex flex-col gap-6 text-sm shrink-0 overflow-y-auto bg-white">
      {/* Mini Calendar */}
      <div className="space-y-3">
        <h3 className="font-bold uppercase tracking-wider text-[10px] text-slate-500 border-b border-slate-100 pb-1">August 2026</h3>
        <div className="grid grid-cols-7 gap-1 text-center max-w-[240px]">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} className={cn(
              "font-bold text-[9px]",
              new Date().getDay() === i ? "text-slate-900" : "text-slate-300"
            )}>{d}</div>
          ))}
          {Array.from({ length: 31 }, (_, i) => {
            const day = i + 1;
            const today = new Date();
            const isToday = day === today.getDate() && today.getMonth() === 7 && today.getFullYear() === 2026;
            return (
              <div key={i} className={cn(
                "py-0.5 text-[9px] rounded-full transition-all duration-300 flex items-center justify-center",
                isToday
                  ? "bg-slate-900 text-white font-black scale-110 shadow-sm"
                  : "text-slate-400 hover:bg-slate-50 hover:text-slate-900"
              )}>{day}</div>
            );
          })}
        </div>
      </div>

      {/* Color Key (Keys only) */}
      <div className="space-y-3">
        <h3 className="font-black uppercase tracking-wider text-[11px] border-b-2 border-slate-900 pb-1">Color Key</h3>
        <div className="flex flex-wrap gap-2 py-1">
          {plannerColors.map((color) => (
            <div key={color} className="relative group">
              <button
                onClick={() => onSelectColor(color)}
                className={cn(
                  "w-6 h-6 rounded-full border-2 transition-all hover:scale-110",
                  selectedColor === color ? "border-slate-900 ring-2 ring-slate-100" : "border-slate-100"
                )}
                style={{ backgroundColor: color }}
              />
              <button
                onClick={(e) => { e.stopPropagation(); onRemoveColor(color); }}
                className="absolute -top-1 -right-1 w-3 h-3 bg-white border border-slate-200 rounded-full flex items-center justify-center text-[6px] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-500 shadow-sm"
              >
                ✕
              </button>
            </div>
          ))}
          {/* Add Color Picker Button */}
          <button
            onClick={() => colorInputRef.current?.click()}
            className="w-6 h-6 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 hover:border-slate-900 hover:text-slate-900 transition-all text-xs"
          >
            +
          </button>
          <input
            ref={colorInputRef}
            type="color"
            className="hidden"
            onChange={(e) => onAddColor(e.target.value)}
          />
        </div>
      </div>

      {/* Weekly Priorities */}
      <div className="space-y-3">
        <div className="flex justify-between items-center border-b-2 border-slate-900 pb-1">
          <h3 className="font-black uppercase tracking-wider text-[11px]">Weekly Priorities</h3>
          <div className="flex items-center gap-2">
            {priorities.length > 0 && (
              <button
                onClick={() => onClearWeekly('priority')}
                className="text-[8px] font-black uppercase text-slate-300 hover:text-red-500 transition-colors"
                title="Clear all priorities"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => setAddingType(addingType === 'priority' ? null : 'priority')}
              className={cn(
                "w-5 h-5 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors font-bold",
                addingType === 'priority' && "bg-slate-900 text-white rotate-45"
              )}
            >
              +
            </button>
          </div>
        </div>

        {addingType === 'priority' && renderColorPicker('priority')}

        <div className="space-y-1">
          {priorities.map((item) => (
            <div key={item.id} className="flex items-center gap-2 border-b border-slate-100 py-1.5 group">
              <button
                onClick={() => onUpdateWeekly('priority', item.id, { completed: !item.completed })}
                className={cn(
                  "w-4 h-4 rounded-full border-2 border-slate-300 shrink-0 transition-colors",
                  item.completed ? "bg-slate-900 border-slate-900" : "hover:border-slate-400"
                )}
              />
              <input
                type="text"
                value={item.text}
                onChange={(e) => onUpdateWeekly('priority', item.id, { text: e.target.value })}
                placeholder="..."
                className={cn(
                  "flex-1 bg-transparent outline-none border-none placeholder:text-slate-200 text-xs",
                  item.completed && "line-through text-slate-400"
                )}
              />
              <button
                onClick={() => onRemoveWeekly('priority', item.id)}
                className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded-full hover:bg-red-50 text-slate-300 hover:text-red-500 transition-all text-[10px]"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly To-Do List */}
      <div className="space-y-3">
        <div className="flex justify-between items-center border-b-2 border-slate-900 pb-1">
          <h3 className="font-black uppercase tracking-wider text-[11px]">Weekly To Do List</h3>
          <div className="flex items-center gap-2">
            {todos.length > 0 && (
              <button
                onClick={() => onClearWeekly('todo')}
                className="text-[8px] font-black uppercase text-slate-300 hover:text-red-500 transition-colors"
                title="Clear all tasks"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => setAddingType(addingType === 'todo' ? null : 'todo')}
              className={cn(
                "w-5 h-5 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors font-bold",
                addingType === 'todo' && "bg-slate-900 text-white rotate-45"
              )}
            >
              +
            </button>
          </div>
        </div>

        {addingType === 'todo' && renderColorPicker('todo')}

        <div className="space-y-1">
          {todos.map((item) => (
            <div
              key={item.id}
              className={cn(
                "flex items-center gap-2 border-b border-slate-100 py-1.5 group transition-all px-1 rounded-sm",
                item.color && item.color !== 'transparent' && "border-l-4"
              )}
              style={{ borderLeftColor: item.color }}
            >
              <button
                onClick={() => onUpdateWeekly('todo', item.id, { completed: !item.completed })}
                className={cn(
                  "w-4 h-4 border-2 border-slate-300 shrink-0 transition-colors",
                  item.completed ? "bg-slate-900 border-slate-900" : "hover:border-slate-400"
                )}
              />

              {/* Color Tag Picker */}
              <button
                onClick={() => onUpdateWeekly('todo', item.id, { color: selectedColor })}
                className={cn(
                  "w-3 h-3 rounded-full border border-slate-200 transition-all hover:scale-125 shrink-0",
                  (!item.color || item.color === 'transparent') ? "border-dashed opacity-30" : "border-solid"
                )}
                style={{ backgroundColor: item.color || 'transparent' }}
                title="Tag with active color"
              />

              <input
                type="text"
                value={item.text}
                onChange={(e) => onUpdateWeekly('todo', item.id, { text: e.target.value })}
                placeholder="..."
                className={cn(
                  "flex-1 bg-transparent outline-none border-none placeholder:text-slate-200 text-xs",
                  item.completed && "line-through text-slate-400"
                )}
              />
              <button
                onClick={() => onRemoveWeekly('todo', item.id)}
                className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded-full hover:bg-red-50 text-slate-300 hover:text-red-500 transition-all text-[10px]"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Habit Tracker (Others) */}
      <div className="space-y-4 pb-8">
        <h3 className="font-black uppercase tracking-wider text-[11px] border-b-2 border-slate-900 pb-1">Habit Tracker</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-1 mb-1 font-bold text-center text-[9px] text-slate-400">
             <div className="text-left pl-1">Habit</div>
             {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d}>{d}</div>)}
          </div>
          {habits.map((habit, hIdx) => (
            <div key={hIdx} className="grid grid-cols-[80px_repeat(7,1fr)] gap-1 items-center">
              <input
                value={habit.name}
                onChange={(e) => onUpdateHabit(hIdx, { name: e.target.value })}
                className="bg-transparent border-b border-slate-100 outline-none placeholder:text-slate-200 text-[10px] pr-1 focus:border-slate-900 transition-all"
                placeholder="Name..."
              />
              {habit.days.map((checked, dIdx) => (
                <button
                  key={dIdx}
                  onClick={() => {
                    const newDays = [...habit.days];
                    newDays[dIdx] = !newDays[dIdx];
                    onUpdateHabit(hIdx, { days: newDays });
                  }}
                  className={cn(
                    "w-4 h-4 rounded-full border-2 border-slate-200 mx-auto transition-colors",
                    checked ? "bg-slate-900 border-slate-900" : "hover:border-slate-300"
                  )}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
