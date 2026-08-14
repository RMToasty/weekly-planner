import React, { useRef, useState } from 'react';
import { TodoItem, HabitItem, SidebarSettings, QuickTracker } from './WeeklyPlanner';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Settings, X, Check, LayoutGrid } from 'lucide-react';
import FocusWidget from './FocusWidget';
import BrainDumpWidget from './BrainDumpWidget';
import MealPlannerWidget from './MealPlannerWidget';
import GratitudeWidget from './GratitudeWidget';
import QuickTrackersWidget from './QuickTrackersWidget';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  settings: SidebarSettings;
  onUpdateSettings: (updates: Partial<SidebarSettings>) => void;
  priorities: TodoItem[];
  todos: TodoItem[];
  habits: HabitItem[];
  focusData: string[];
  onUpdateFocus: (index: number, val: string) => void;
  brainDump: string;
  onUpdateBrainDump: (val: string) => void;
  mealData: string[];
  onUpdateMeal: (index: number, val: string) => void;
  gratitudeData: string[];
  onUpdateGratitude: (index: number, val: string) => void;
  quickTrackers: QuickTracker[];
  onUpdateQuickTracker: (id: string, delta: number) => void;
  onAddQuickTracker: () => void;
  onRemoveQuickTracker: (id: string) => void;
  plannerColors: string[];
  selectedColor: string;
  onUpdateWeekly: (type: 'priority' | 'todo', id: string, updates: Partial<TodoItem>) => void;
  onUpdateHabit: (index: number, updates: Partial<HabitItem>) => void;
  onAddHabit: () => void;
  onRemoveHabit: (index: number) => void;
  onAddWeekly: (type: 'priority' | 'todo', color?: string) => void;
  onRemoveWeekly: (type: 'priority' | 'todo', id: string) => void;
  onClearWeekly: (type: 'priority' | 'todo') => void;
  onAddColor: (hex: string) => void;
  onRemoveColor: (hex: string) => void;
  onSelectColor: (hex: string) => void;
}

const Sidebar = ({
  settings, onUpdateSettings,
  priorities, todos, habits,
  focusData, onUpdateFocus,
  brainDump, onUpdateBrainDump,
  mealData, onUpdateMeal,
  gratitudeData, onUpdateGratitude,
  quickTrackers, onUpdateQuickTracker, onAddQuickTracker, onRemoveQuickTracker,
  plannerColors, selectedColor,
  onUpdateWeekly, onUpdateHabit, onAddHabit, onRemoveHabit, onAddWeekly, onRemoveWeekly, onClearWeekly,
  onAddColor, onRemoveColor, onSelectColor
}: SidebarProps) => {
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [addingType, setAddingType] = useState<'priority' | 'todo' | null>(null);
  const [isCustomizing, setIsCustomizing] = useState(false);

  // Dynamic Calendar Logic
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const todayDate = now.getDate();

  const monthName = now.toLocaleString('default', { month: 'long' });

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Current Week Bounds
  const startOfWeek = new Date(now);
  startOfWeek.setDate(todayDate - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const renderColorPicker = (type: 'priority' | 'todo') => (
    <div className="flex items-center gap-1.5 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg animate-in slide-in-from-top-1 duration-200 mt-1 mb-2">
      <span className="text-[9px] font-black text-slate-400 uppercase mr-1">Pick:</span>
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => { onAddWeekly(type, 'transparent'); setAddingType(null); }}
          className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 flex items-center justify-center text-[10px] hover:scale-110 transition-transform dark:text-white"
        >
          ✕
        </button>
        {plannerColors.map((c) => (
          <button
            key={c}
            onClick={() => { onAddWeekly(type, c); setAddingType(null); }}
            className="w-5 h-5 rounded-full hover:scale-110 transition-transform border border-white dark:border-slate-700 shadow-sm"
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-full lg:w-72 lg:border-r border-slate-300 dark:border-slate-800 p-4 flex flex-col gap-6 text-sm shrink-0 overflow-y-auto bg-white dark:bg-slate-950 relative">
      {/* Sidebar Header with Settings */}
      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <LayoutGrid size={14} className="text-slate-400" />
          <span className="font-black uppercase tracking-widest text-[10px] dark:text-slate-400 text-slate-500">Dashboard</span>
        </div>
        <button
          onClick={() => setIsCustomizing(!isCustomizing)}
          className={cn(
            "p-1.5 rounded-full transition-all hover:bg-slate-100 dark:hover:bg-slate-800",
            isCustomizing ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 rotate-90" : "text-slate-400"
          )}
        >
          <Settings size={14} />
        </button>
      </div>

      {/* Customize Menu overlay */}
      {isCustomizing && (
        <div className="absolute top-12 left-4 right-4 z-40 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-[10px] font-black uppercase text-slate-400">Toggle Widgets</h4>
            <button onClick={() => setIsCustomizing(false)}><X size={14} /></button>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {[
              { id: 'showPriorities', label: 'Weekly Priorities' },
              { id: 'showTodos', label: 'Weekly To-Dos' },
              { id: 'showFocus', label: 'Weekly Focus' },
              { id: 'showHabits', label: 'Habit Tracker' },
              { id: 'showQuickTrackers', label: 'Quick Trackers' },
              { id: 'showMealPlanner', label: 'Meal Planner' },
              { id: 'showGratitude', label: 'Gratitude Log' },
              { id: 'showBrainDump', label: 'Brain Dump' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => onUpdateSettings({ [item.id]: !settings[item.id as keyof SidebarSettings] })}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <span className="text-xs font-bold dark:text-slate-300">{item.label}</span>
                <div className={cn(
                  "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                  settings[item.id as keyof SidebarSettings] ? "bg-slate-900 border-slate-900 dark:bg-white dark:border-white" : "border-slate-300"
                )}>
                  {settings[item.id as keyof SidebarSettings] && <Check size={10} className="text-white dark:text-slate-900" />}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mini Calendar */}
      <div className="space-y-3">
        <h3 className="font-bold uppercase tracking-wider text-[10px] text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-1">
          {monthName} {currentYear}
        </h3>
        <div className="grid grid-cols-7 gap-1 text-center max-w-[240px]">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} className={cn(
              "font-bold text-[9px]",
              now.getDay() === i ? "text-slate-900 dark:text-white" : "text-slate-300 dark:text-slate-600"
            )}>{d}</div>
          ))}

          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const date = new Date(currentYear, currentMonth, day);
            const isToday = day === todayDate;
            const isCurrentWeek = date >= startOfWeek && date <= endOfWeek;

            return (
              <div key={day} className={cn(
                "py-1 text-[9px] rounded-full transition-all duration-300 flex items-center justify-center relative",
                isCurrentWeek && !isToday && "bg-slate-100/50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-200",
                isToday
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-black scale-110 shadow-sm z-10"
                  : !isCurrentWeek && "text-slate-400 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
              )}>
                {day}
              </div>
            );
          })}
        </div>
      </div>

      {/* Color Key */}
      <div className="space-y-3">
        <h3 className="font-black uppercase tracking-wider text-[11px] border-b-2 border-slate-900 dark:border-slate-100 pb-1 dark:text-white">Color Key</h3>
        <div className="flex flex-wrap gap-2 py-1">
          {plannerColors.map((color) => (
            <div key={color} className="relative group">
              <button
                onClick={() => onSelectColor(color)}
                className={cn(
                  "w-6 h-6 rounded-full border-2 transition-all hover:scale-110",
                  selectedColor === color ? "border-slate-900 dark:border-white ring-2 ring-slate-100 dark:ring-slate-800" : "border-slate-100 dark:border-slate-800"
                )}
                style={{ backgroundColor: color }}
              />
              <button
                onClick={(e) => { e.stopPropagation(); onRemoveColor(color); }}
                className="absolute -top-1 -right-1 w-3 h-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center text-[6px] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-500 shadow-sm dark:text-white"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            onClick={() => colorInputRef.current?.click()}
            className="w-6 h-6 rounded-full border-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:border-slate-900 dark:hover:border-white hover:text-slate-900 dark:hover:text-white transition-all text-xs"
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

      {/* Weekly Focus */}
      {settings.showFocus && (
        <FocusWidget data={focusData} onUpdate={onUpdateFocus} />
      )}

      {/* Weekly Priorities */}
      {settings.showPriorities && (
        <div className="space-y-3">
          <div className="flex justify-between items-center border-b-2 border-slate-900 dark:border-slate-100 pb-1">
            <h3 className="font-black uppercase tracking-wider text-[11px] dark:text-white">Weekly Priorities</h3>
            <div className="flex items-center gap-2">
              {priorities.length > 0 && (
                <button
                  onClick={() => onClearWeekly('priority')}
                  className="text-[8px] font-black uppercase text-slate-300 dark:text-slate-600 hover:text-red-500 transition-colors"
                  title="Clear all priorities"
                >
                  Clear
                </button>
              )}
              <button
                onClick={() => setAddingType(addingType === 'priority' ? null : 'priority')}
                className={cn(
                  "w-5 h-5 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors font-bold",
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
              <div key={item.id} className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 py-1.5 group">
                <button
                  onClick={() => onUpdateWeekly('priority', item.id, { completed: !item.completed })}
                  className={cn(
                    "w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600 shrink-0 transition-colors",
                    item.completed ? "bg-slate-900 dark:bg-white border-slate-900 dark:border-white" : "hover:border-slate-400 dark:hover:border-slate-500"
                  )}
                />
                <input
                  type="text"
                  value={item.text}
                  onChange={(e) => onUpdateWeekly('priority', item.id, { text: e.target.value })}
                  placeholder="..."
                  className={cn(
                    "flex-1 bg-transparent outline-none border-none placeholder:text-slate-200 dark:placeholder:text-slate-700 text-xs dark:text-white",
                    item.completed && "line-through text-slate-400 dark:text-slate-600"
                  )}
                />
                <button
                  onClick={() => onRemoveWeekly('priority', item.id)}
                  className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-950 text-slate-300 dark:text-slate-600 hover:text-red-500 transition-all text-[10px]"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekly To-Do List */}
      {settings.showTodos && (
        <div className="space-y-3">
          <div className="flex justify-between items-center border-b-2 border-slate-900 dark:border-slate-100 pb-1">
            <h3 className="font-black uppercase tracking-wider text-[11px] dark:text-white">Weekly To Do List</h3>
            <div className="flex items-center gap-2">
              {todos.length > 0 && (
                <button
                  onClick={() => onClearWeekly('todo')}
                  className="text-[8px] font-black uppercase text-slate-300 dark:text-slate-600 hover:text-red-500 transition-colors"
                  title="Clear all tasks"
                >
                  Clear
                </button>
              )}
              <button
                onClick={() => setAddingType(addingType === 'todo' ? null : 'todo')}
                className={cn(
                  "w-5 h-5 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors font-bold",
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
                  "flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 py-1.5 group transition-all px-1 rounded-sm",
                  item.color && item.color !== 'transparent' && "border-l-4"
                )}
                style={{ borderLeftColor: item.color }}
              >
                <button
                  onClick={() => onUpdateWeekly('todo', item.id, { completed: !item.completed })}
                  className={cn(
                    "w-4 h-4 border-2 border-slate-300 dark:border-slate-600 shrink-0 transition-colors",
                    item.completed ? "bg-slate-900 dark:bg-white border-slate-900 dark:border-white" : "hover:border-slate-400 dark:hover:border-slate-500"
                  )}
                />

                <button
                  onClick={() => onUpdateWeekly('todo', item.id, { color: selectedColor })}
                  className={cn(
                    "w-3 h-3 rounded-full border border-slate-200 dark:border-slate-700 transition-all hover:scale-125 shrink-0",
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
                    "flex-1 bg-transparent outline-none border-none placeholder:text-slate-200 dark:placeholder:text-slate-700 text-xs dark:text-white",
                    item.completed && "line-through text-slate-400 dark:text-slate-600"
                  )}
                />
                <button
                  onClick={() => onRemoveWeekly('todo', item.id)}
                  className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-950 text-slate-300 dark:text-slate-600 hover:text-red-500 transition-all text-[10px]"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Habit Tracker */}
      {settings.showHabits && (
        <div className="space-y-4 pb-8">
          <div className="flex justify-between items-center border-b-2 border-slate-900 dark:border-slate-100 pb-1">
            <h3 className="font-black uppercase tracking-wider text-[11px] dark:text-white">Habit Tracker</h3>
            <button
              onClick={onAddHabit}
              className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors font-bold"
            >
              +
            </button>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-[80px_repeat(7,1fr)_20px] gap-1 mb-1 font-bold text-center text-[9px] text-slate-400 dark:text-slate-500">
               <div className="text-left pl-1">Habit</div>
               {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d}>{d}</div>)}
               <div></div>
            </div>
            {habits.map((habit, hIdx) => (
              <div key={hIdx} className="grid grid-cols-[80px_repeat(7,1fr)_20px] gap-1 items-center group">
                <input
                  value={habit.name}
                  onChange={(e) => onUpdateHabit(hIdx, { name: e.target.value })}
                  className="bg-transparent border-b border-slate-100 dark:border-slate-800 outline-none placeholder:text-slate-200 dark:placeholder:text-slate-700 text-[10px] pr-1 focus:border-slate-900 dark:focus:border-white transition-all dark:text-white"
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
                      "w-4 h-4 rounded-full border-2 border-slate-200 dark:border-slate-700 mx-auto transition-colors",
                      checked ? "bg-slate-900 dark:bg-white border-slate-900 dark:border-white" : "hover:border-slate-300 dark:hover:border-slate-600"
                    )}
                  />
                ))}
                <button
                  onClick={() => onRemoveHabit(hIdx)}
                  className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-950 text-slate-300 dark:text-slate-600 hover:text-red-500 transition-all text-[8px]"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Trackers */}
      {settings.showQuickTrackers && (
        <QuickTrackersWidget
          data={quickTrackers}
          onUpdate={onUpdateQuickTracker}
          onAdd={onAddQuickTracker}
          onRemove={onRemoveQuickTracker}
        />
      )}

      {/* Meal Planner */}
      {settings.showMealPlanner && (
        <MealPlannerWidget data={mealData} onUpdate={onUpdateMeal} />
      )}

      {/* Gratitude Log */}
      {settings.showGratitude && (
        <GratitudeWidget data={gratitudeData} onUpdate={onUpdateGratitude} />
      )}

      {/* Brain Dump */}
      {settings.showBrainDump && (
        <BrainDumpWidget data={brainDump} onUpdate={onUpdateBrainDump} />
      )}
    </div>
  );
};

export default Sidebar;
