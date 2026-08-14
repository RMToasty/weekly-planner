'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import DayColumn from './DayColumn';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Sun, Moon } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  color?: string;
}

export interface HabitItem {
  name: string;
  days: boolean[];
}

export interface DailyData {
  priorities: TodoItem[];
  notes: string;
  schedule: string[]; // 144 slots (24 hours * 6 slots/hour)
  blockMetadata?: Record<number, { text?: string, symbol?: string }>;
}

const DEFAULT_COLORS = ['#dbeafe', '#dcfce7', '#fee2e2', '#fef9c3', '#f3e8ff', '#ffedd5'];

const WeeklyPlanner = () => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // --- STATE ---

  // Header
  const [header, setHeader] = useState({ month: 'Aug', weekOf: '' });

  // Weekly Lists
  const [weeklyPriorities, setWeeklyPriorities] = useState<TodoItem[]>([]);
  const [weeklyTodos, setWeeklyTodos] = useState<TodoItem[]>([]);

  // Habits
  const [habits, setHabits] = useState<HabitItem[]>([]);

  // Color Palette
  const [plannerColors, setPlannerColors] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState('transparent');

  // Daily Data (Schedule, Notes, Priorities)
  const [dailyData, setDailyData] = useState<DailyData[]>([]);

  // --- PERSISTENCE ---

  useEffect(() => {
    const saved = localStorage.getItem('planner_data_v7');
    const savedTheme = localStorage.getItem('planner_theme');

    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    if (saved) {
      const data = JSON.parse(saved);
      setHeader(data.header || { month: 'Aug', weekOf: '' });
      setWeeklyPriorities(data.weeklyPriorities || []);
      setWeeklyTodos(data.weeklyTodos || []);
      setHabits(data.habits || []);
      setPlannerColors(data.plannerColors || DEFAULT_COLORS);
      setDailyData(data.dailyData || []);
      setSelectedColor(data.plannerColors?.[0] || DEFAULT_COLORS[0]);
    } else {
      // Default Init - Start with empty lists for the new "Color First" workflow
      setWeeklyPriorities([]);
      setWeeklyTodos([]);
      setHabits(Array.from({ length: 5 }, () => ({ name: '', days: new Array(7).fill(false) })));
      setPlannerColors(DEFAULT_COLORS);
      setSelectedColor(DEFAULT_COLORS[0]);
      setDailyData(days.map((_, dayIdx) => ({
        priorities: Array.from({ length: 4 }, (_, i) => ({ id: `dp-${dayIdx}-${i}`, text: '', completed: false })),
        notes: '',
        schedule: new Array(144).fill('transparent'),
        blockMetadata: {}
      })));
    }
  }, []);

  useEffect(() => {
    if (dailyData.length > 0) {
      localStorage.setItem('planner_data_v7', JSON.stringify({
        header, weeklyPriorities, weeklyTodos, habits, plannerColors, dailyData
      }));
    }
  }, [header, weeklyPriorities, weeklyTodos, habits, plannerColors, dailyData]);

  // --- HANDLERS ---

  const updateHeader = (updates: Partial<{ month: string, weekOf: string }>) => {
    setHeader(prev => ({ ...prev, ...updates }));
  };

  const updateWeekly = (type: 'priority' | 'todo', id: string, updates: Partial<TodoItem>) => {
    const setter = type === 'priority' ? setWeeklyPriorities : setWeeklyTodos;
    setter(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const updateHabit = (index: number, updates: Partial<HabitItem>) => {
    setHabits(prev => prev.map((h, i) => i === index ? { ...h, ...updates } : h));
  };

  const addPlannerColor = (hex: string) => {
    if (!plannerColors.includes(hex)) {
      setPlannerColors(prev => [...prev, hex]);
      setSelectedColor(hex);
    }
  };

  const removePlannerColor = (hex: string) => {
    setPlannerColors(prev => prev.filter(c => c !== hex));
    if (selectedColor === hex) setSelectedColor('transparent');
  };

  const updateDaily = (dayIndex: number, updates: Partial<DailyData>) => {
    setDailyData(prev => prev.map((d, i) => i === dayIndex ? { ...d, ...updates } : d));
  };

  const addWeeklyItem = (type: 'priority' | 'todo', color?: string) => {
    const setter = type === 'priority' ? setWeeklyPriorities : setWeeklyTodos;
    const prefix = type === 'priority' ? 'wp' : 'wt';
    setter(prev => [...prev, { id: `${prefix}-${Date.now()}`, text: '', completed: false, color: color || 'transparent' }]);
  };

  const removeWeeklyItem = (type: 'priority' | 'todo', id: string) => {
    const setter = type === 'priority' ? setWeeklyPriorities : setWeeklyTodos;
    setter(prev => prev.filter(item => item.id !== id));
  };

  const clearWeeklyList = (type: 'priority' | 'todo') => {
    const setter = type === 'priority' ? setWeeklyPriorities : setWeeklyTodos;
    setter([]);
  };

  const addDailyPriority = (dayIndex: number) => {
    setDailyData(prev => prev.map((d, i) => i === dayIndex ? {
      ...d,
      priorities: [...d.priorities, { id: `dp-${dayIndex}-${Date.now()}`, text: '', completed: false }]
    } : d));
  };

  const removeDailyPriority = (dayIndex: number, id: string) => {
    setDailyData(prev => prev.map((d, i) => i === dayIndex ? {
      ...d,
      priorities: d.priorities.filter(p => p.id !== id)
    } : d));
  };

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('planner_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('planner_theme', 'light');
    }
  };

  return (
    <div className="flex flex-col h-screen w-full mx-auto border-x border-slate-300 bg-white dark:bg-slate-950 dark:border-slate-800 overflow-hidden shadow-2xl md:h-[95vh] md:my-4 relative">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end p-4 sm:p-6 border-b-2 border-slate-900 dark:border-slate-100 shrink-0 gap-4 bg-white dark:bg-slate-950 z-20">
        <div className="flex justify-between items-center w-full sm:w-auto">
          <h1 className="text-2xl sm:text-4xl font-black tracking-tighter uppercase dark:text-white">Weekly Schedule</h1>
          <button
            onClick={toggleDarkMode}
            className="sm:hidden p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
        <div className="flex items-end gap-4 sm:gap-8 pb-1 w-full sm:w-auto justify-between sm:justify-end">
           <button
             onClick={toggleDarkMode}
             className="hidden sm:flex p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400 mb-1"
           >
             {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
           </button>
           <div className="flex items-baseline gap-2">
             <input
               value={header.month}
               onChange={(e) => updateHeader({ month: e.target.value })}
               className="text-2xl sm:text-3xl font-black uppercase text-slate-400 bg-transparent outline-none w-16 sm:w-20 text-right focus:text-slate-900 dark:focus:text-white transition-colors"
               placeholder="Month"
             />
             <span className="w-px h-6 sm:h-8 bg-slate-900 dark:bg-slate-100 mx-1" />
             <div className="flex flex-col">
               <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest leading-none dark:text-slate-400">Week of</span>
               <input
                 value={header.weekOf}
                 onChange={(e) => updateHeader({ weekOf: e.target.value })}
                 className="w-24 sm:w-32 border-b border-slate-400 dark:border-slate-700 h-5 sm:h-6 bg-transparent outline-none text-[10px] sm:text-xs font-bold dark:text-white"
                 placeholder="..."
               />
             </div>
           </div>
        </div>
      </header>

      {/* Day Selector (Mobile Only) */}
      <div className="lg:hidden flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto bg-slate-50 dark:bg-slate-900 shrink-0">
        {days.map((day, index) => (
          <button
            key={day}
            onClick={() => setActiveDayIndex(index)}
            className={cn(
              "flex-1 py-3 px-2 text-[10px] font-bold uppercase tracking-tighter border-b-2 transition-colors whitespace-nowrap",
              activeDayIndex === index
                ? "border-slate-900 bg-white text-slate-900 dark:border-white dark:bg-slate-950 dark:text-white"
                : "border-transparent text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
            )}
          >
            {day.substring(0, 3)}
          </button>
        ))}
      </div>

      {/* Color Palette (Floating Toolbar) */}
      <div className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 p-2 flex items-center justify-center gap-4 shrink-0 z-10 shadow-sm overflow-x-auto">
        <div className="flex gap-2.5">
          <button
            onClick={() => setSelectedColor('transparent')}
            className={cn(
              "w-7 h-7 rounded-full border-2 transition-all hover:scale-110 relative bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700",
              selectedColor === 'transparent' ? "border-slate-900 scale-110 ring-4 ring-slate-100 dark:border-white dark:ring-slate-800" : "border-transparent"
            )}
            title="Eraser"
          >
            {selectedColor === 'transparent' ? <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black dark:text-white">✓</div> : <div className="absolute inset-0 flex items-center justify-center text-[12px] opacity-20 dark:text-white">✕</div>}
          </button>

          <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 self-center mx-1" />

          {plannerColors.map((color) => (
            <button
              key={color}
              onClick={() => setSelectedColor(color)}
              className={cn(
                "w-7 h-7 rounded-full border-2 transition-all hover:scale-110 relative",
                selectedColor === color ? "border-slate-900 scale-110 ring-4 ring-slate-100 dark:border-white dark:ring-slate-800" : "border-transparent"
              )}
              style={{ backgroundColor: color }}
            >
              {selectedColor === color && <div className="absolute inset-0 flex items-center justify-center text-[8px] font-black pointer-events-none text-slate-900">✓</div>}
            </button>
          ))}
        </div>
      </div>

      {/* Main Area */}
      <main className="flex flex-1 overflow-hidden relative">
        {/* Sidebar - Desktop: Fixed, Mobile: Floating Island */}
        <div className="hidden lg:flex shrink-0 border-r border-slate-300 dark:border-slate-800">
          <Sidebar
            priorities={weeklyPriorities}
            todos={weeklyTodos}
            habits={habits}
            plannerColors={plannerColors}
            selectedColor={selectedColor}
            onUpdateWeekly={updateWeekly}
            onUpdateHabit={updateHabit}
            onAddWeekly={addWeeklyItem}
            onRemoveWeekly={removeWeeklyItem}
            onClearWeekly={clearWeeklyList}
            onAddColor={addPlannerColor}
            onRemoveColor={removePlannerColor}
            onSelectColor={setSelectedColor}
          />
        </div>

        {/* Floating Island for Mobile */}
        {isOverviewOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm dark:bg-slate-950/60"
              onClick={() => setIsOverviewOpen(false)}
            />
            <div className="relative w-full max-w-sm max-h-[80vh] bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <span className="font-black uppercase tracking-widest text-xs dark:text-white">Overview</span>
                <button
                  onClick={() => setIsOverviewOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 dark:text-white"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <Sidebar
                  priorities={weeklyPriorities}
                  todos={weeklyTodos}
                  habits={habits}
                  plannerColors={plannerColors}
                  selectedColor={selectedColor}
                  onUpdateWeekly={updateWeekly}
                  onUpdateHabit={updateHabit}
                  onAddWeekly={addWeeklyItem}
                  onRemoveWeekly={removeWeeklyItem}
                  onClearWeekly={clearWeeklyList}
                  onAddColor={addPlannerColor}
                  onRemoveColor={removePlannerColor}
                  onSelectColor={setSelectedColor}
                />
              </div>
            </div>
          </div>
        )}

        {/* Day Grid / Active Day */}
        <div className="flex-1 flex overflow-x-auto overflow-y-auto bg-slate-50/30 dark:bg-slate-900/10">
          {days.map((day, index) => (
            <div
              key={day}
              className={cn(
                "flex-1 flex flex-col min-w-[180px] lg:min-w-[200px] lg:flex",
                activeDayIndex === index ? "flex" : "hidden lg:flex"
              )}
            >
              {dailyData[index] && (
                <DayColumn
                  day={day}
                  data={dailyData[index]}
                  selectedColor={selectedColor}
                  isToday={new Date().getDay() === index}
                  onUpdate={(updates) => updateDaily(index, updates)}
                  onAddPriority={() => addDailyPriority(index)}
                  onRemovePriority={(id) => removeDailyPriority(index, id)}
                />
              )}
            </div>
          ))}
        </div>

        {/* Mobile Floating Action Button */}
        <button
          onClick={() => setIsOverviewOpen(true)}
          className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-40"
        >
          <div className="flex flex-col items-center">
            <span className="text-[8px] font-black uppercase leading-none mb-0.5">Show</span>
            <span className="text-[10px] font-black uppercase leading-none">Habits</span>
          </div>
        </button>
      </main>
    </div>
  );
};

export default WeeklyPlanner;
