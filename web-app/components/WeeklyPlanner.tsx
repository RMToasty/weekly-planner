'use client';

import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import DayColumn from './DayColumn';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Sun, Moon, Download, FileText, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper to get Sunday of the week for a given date
const getSunday = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
};

const formatDateId = (date: Date) => date.toISOString().split('T')[0];

// Helper to get week number
const getWeekNumber = (d: Date) => {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
};

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
  blockMetadata?: Record<number, { text?: string, symbol?: string, iconName?: string }>;
  dayNumber?: string;
}

export interface SidebarSettings {
  showPriorities: boolean;
  showTodos: boolean;
  showHabits: boolean;
  showFocus: boolean;
  showBrainDump: boolean;
  showMealPlanner: boolean;
  showGratitude: boolean;
  showQuickTrackers: boolean;
}

export interface QuickTracker {
  id: string;
  name: string;
  value: number;
  target: number;
  color: string;
}

const DEFAULT_SETTINGS: SidebarSettings = {
  showPriorities: true,
  showTodos: true,
  showHabits: true,
  showFocus: true,
  showBrainDump: true,
  showMealPlanner: false,
  showGratitude: false,
  showQuickTrackers: false,
};

const DEFAULT_COLORS = ['#dbeafe', '#dcfce7', '#fee2e2', '#fef9c3', '#f3e8ff', '#ffedd5'];

export interface SyncedEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
}

const WeeklyPlanner = () => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [templateMode, setTemplateMode] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [currentWeekId, setCurrentWeekId] = useState(formatDateId(getSunday(new Date())));
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);
  const plannerRef = useRef<HTMLDivElement>(null);

  // Helper to get dynamic header defaults
  const getDynamicHeader = (isTemplate: boolean, weekStart?: Date) => {
    if (isTemplate) return { month: '', weekOf: '' };

    const sunday = weekStart || getSunday(new Date());
    const month = sunday.toLocaleString('default', { month: 'short' });
    const weekOf = `${month} ${sunday.getDate()}`;

    return { month: month.toUpperCase(), weekOf };
  };

  // --- STATE ---

  // Header
  const [header, setHeader] = useState({ month: '', weekOf: '' });
  const [calendarUrl, setCalendarUrl] = useState('');
  const [syncedEvents, setSyncedEvents] = useState<SyncedEvent[]>([]);

  // Weekly Lists
  const [weeklyPriorities, setWeeklyPriorities] = useState<TodoItem[]>([]);
  const [weeklyTodos, setWeeklyTodos] = useState<TodoItem[]>([]);

  // Habits
  const [habits, setHabits] = useState<HabitItem[]>([]);

  // Modular Widgets State
  const [sidebarSettings, setSidebarSettings] = useState<SidebarSettings>(DEFAULT_SETTINGS);
  const [focusData, setFocusData] = useState<string[]>(['', '', '']);
  const [brainDump, setBrainDump] = useState<string>('');
  const [mealData, setMealData] = useState<string[]>(new Array(7).fill(''));
  const [gratitudeData, setGratitudeData] = useState<string[]>(new Array(7).fill(''));
  const [quickTrackers, setQuickTrackers] = useState<QuickTracker[]>([]);

  // Color Palette
  const [plannerColors, setPlannerColors] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState('transparent');

  // Daily Data (Schedule, Notes, Priorities)
  const [dailyData, setDailyData] = useState<DailyData[]>([]);

  // --- PERSISTENCE ---

  // Load Global Settings & Week-specific Data
  useEffect(() => {
    const savedGlobal = localStorage.getItem('planner_global_v1');
    const savedTheme = localStorage.getItem('planner_theme');

    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    if (savedGlobal) {
      const global = JSON.parse(savedGlobal);
      setSidebarSettings(global.sidebarSettings || DEFAULT_SETTINGS);
      setPlannerColors(global.plannerColors || DEFAULT_COLORS);
      setCalendarUrl(global.calendarUrl || '');
      setTemplateMode(global.templateMode !== undefined ? global.templateMode : true);
      // We don't automatically set currentWeekId from global here to avoid
      // overwriting the initial state if the user just navigated.
    }
  }, []);

  useEffect(() => {
    const savedWeek = localStorage.getItem(`planner_week_${currentWeekId}`);
    const legacyData = localStorage.getItem('planner_data_v7');

    const loadWeekData = (rawData: string | null) => {
      if (rawData) {
        const data = JSON.parse(rawData);
        setHeader(data.header || getDynamicHeader(templateMode, new Date(currentWeekId)));
        setWeeklyPriorities(data.weeklyPriorities || []);
        setWeeklyTodos(data.weeklyTodos || []);
        setHabits(data.habits || []);
        setFocusData(data.focusData || ['', '', '']);
        setBrainDump(data.brainDump || '');
        setMealData(data.mealData || new Array(7).fill(''));
        setGratitudeData(data.gratitudeData || new Array(7).fill(''));
        setQuickTrackers(data.quickTrackers || []);
        setDailyData((data.dailyData || []).map((d: any) => ({
          ...d,
          blockMetadata: d.blockMetadata || {}
        })));
      } else {
        // Init New Week
        setHeader(getDynamicHeader(templateMode, new Date(currentWeekId)));
        setWeeklyPriorities([]);
        setWeeklyTodos([]);
        setHabits(Array.from({ length: 5 }, () => ({ name: '', days: new Array(7).fill(false) })));
        setFocusData(['', '', '']);
        setBrainDump('');
        setMealData(new Array(7).fill(''));
        setGratitudeData(new Array(7).fill(''));
        setQuickTrackers([
          { id: 'water', name: 'Water (glasses)', value: 0, target: 8, color: '#3b82f6' },
          { id: 'sleep', name: 'Sleep (hours)', value: 0, target: 8, color: '#8b5cf6' }
        ]);
        setDailyData(days.map((_, dayIdx) => ({
          priorities: Array.from({ length: 4 }, (_, i) => ({ id: `dp-${dayIdx}-${i}`, text: '', completed: false })),
          notes: '',
          schedule: new Array(144).fill('transparent'),
          blockMetadata: {}
        })));
      }
      setIsInitialLoadDone(true);
    };

    // Migration logic
    if (legacyData && !savedWeek && currentWeekId === formatDateId(getSunday(new Date()))) {
      loadWeekData(legacyData);
      localStorage.removeItem('planner_data_v7'); // Move to week-specific storage
    } else {
      loadWeekData(savedWeek);
    }
  }, [currentWeekId]);

  // Save Global Settings
  useEffect(() => {
    localStorage.setItem('planner_global_v1', JSON.stringify({
      sidebarSettings, plannerColors, calendarUrl, templateMode
    }));
  }, [sidebarSettings, plannerColors, calendarUrl, templateMode]);

  // Save Week-specific Data
  useEffect(() => {
    if (isInitialLoadDone && dailyData.length > 0) {
      localStorage.setItem(`planner_week_${currentWeekId}`, JSON.stringify({
        header, weeklyPriorities, weeklyTodos, habits,
        focusData, brainDump, mealData, gratitudeData, quickTrackers,
        dailyData
      }));
    }
  }, [currentWeekId, header, weeklyPriorities, weeklyTodos, habits, focusData, brainDump, mealData, gratitudeData, quickTrackers, dailyData, isInitialLoadDone]);

  // Calendar Sync Logic
  useEffect(() => {
    if (!calendarUrl) {
      setSyncedEvents([]);
      return;
    }

    const fetchCalendar = async () => {
      try {
        // Use a CORS proxy to bypass browser security restrictions for Google/Outlook
        const proxiedUrl = `https://corsproxy.io/?${encodeURIComponent(calendarUrl)}`;
        const res = await fetch(proxiedUrl);
        const text = await res.text();

        // Improved basic ICS parser
        const events: SyncedEvent[] = [];
        const lines = text.split(/\r?\n/);
        let currentEvent: any = null;

        lines.forEach(line => {
          // Handle line folding (lines starting with space/tab are continuations)
          if ((line.startsWith(' ') || line.startsWith('\t')) && currentEvent && currentEvent._lastKey) {
             currentEvent[currentEvent._lastKey] += line.substring(1);
             return;
          }

          if (line.startsWith('BEGIN:VEVENT')) {
            currentEvent = {};
            return;
          }

          if (line.startsWith('END:VEVENT') && currentEvent) {
            if (currentEvent.start && currentEvent.end) {
              events.push({
                id: `sync-${Date.now()}-${Math.random()}`,
                title: currentEvent.summary || 'Untitled Event',
                start: currentEvent.start,
                end: currentEvent.end
              });
            }
            currentEvent = null;
            return;
          }

          if (!currentEvent) return;

          const match = line.match(/^([A-Z][-A-Z0-9]*)(?:;.*)?:(.*)$/);
          if (match) {
            const key = match[1];
            const value = match[2].trim();
            currentEvent._lastKey = key.toLowerCase();

            if (key === 'SUMMARY') currentEvent.summary = value;
            if (key === 'DTSTART') currentEvent.start = parseICSDate(value);
            if (key === 'DTEND') currentEvent.end = parseICSDate(value);
          }
        });

        setSyncedEvents(events);
      } catch (err) {
        console.error('Calendar sync failed', err);
      }
    };

    fetchCalendar();
    const interval = setInterval(fetchCalendar, 1000 * 60 * 15); // Every 15 mins
    return () => clearInterval(interval);
  }, [calendarUrl]);

  const parseICSDate = (str: string) => {
    // Basic formats: 20231025T143000Z or 20231025
    if (!str) return new Date();

    const y = parseInt(str.substring(0, 4));
    const m = parseInt(str.substring(4, 6)) - 1;
    const d = parseInt(str.substring(6, 8));

    if (str.includes('T')) {
      const h = parseInt(str.substring(9, 11));
      const min = parseInt(str.substring(11, 13));
      // Note: This ignores seconds and assumes local time for simplicity
      // In a full app, we'd handle the 'Z' (UTC) or TZID
      return new Date(y, m, d, h, min);
    }

    // All day event
    return new Date(y, m, d, 0, 0);
  };

  // --- HANDLERS ---

  const changeWeek = (delta: number) => {
    const current = new Date(currentWeekId);
    current.setDate(current.getDate() + (delta * 7));
    setCurrentWeekId(formatDateId(current));
    setIsInitialLoadDone(false); // Reset to allow loading effect to trigger correctly
  };

  const handleExport = async (format: 'png' | 'pdf') => {
    if (!plannerRef.current) return;

    setIsExporting(true);

    // Small delay to allow React to re-render with expanded styles
    await new Promise(resolve => setTimeout(resolve, 100));

    const filter = (node: HTMLElement) => {
      return !node.classList?.contains('no-export');
    };

    try {
      const dataUrl = await htmlToImage.toPng(plannerRef.current, {
        quality: 1,
        pixelRatio: 2, // Double resolution
        backgroundColor: isDarkMode ? '#020617' : '#ffffff',
        filter: filter as any
      });

      if (format === 'png') {
        const link = document.createElement('a');
        link.download = `weekly-planner-${header.month || 'template'}.png`;
        link.href = dataUrl;
        link.click();
      } else {
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'px',
          format: [plannerRef.current.offsetWidth * 2, plannerRef.current.offsetHeight * 2]
        });
        pdf.addImage(dataUrl, 'PNG', 0, 0, plannerRef.current.offsetWidth * 2, plannerRef.current.offsetHeight * 2);
        pdf.save(`weekly-planner-${header.month || 'template'}.pdf`);
      }
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setIsExporting(false);
    }
  };

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

  const addHabit = () => {
    setHabits(prev => [...prev, { name: '', days: new Array(7).fill(false) }]);
  };

  const removeHabit = (index: number) => {
    setHabits(prev => prev.filter((_, i) => i !== index));
  };

  const updateSidebarSettings = (updates: Partial<SidebarSettings>) => {
    setSidebarSettings(prev => ({ ...prev, ...updates }));
  };

  const updateFocus = (index: number, val: string) => {
    setFocusData(prev => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const updateMeal = (index: number, val: string) => {
    setMealData(prev => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const updateGratitude = (index: number, val: string) => {
    setGratitudeData(prev => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const updateQuickTracker = (id: string, delta: number) => {
    setQuickTrackers(prev => prev.map(t =>
      t.id === id ? { ...t, value: Math.max(0, t.value + delta) } : t
    ));
  };

  const addQuickTracker = () => {
    const name = prompt('Tracker Name:');
    if (name) {
      setQuickTrackers(prev => [...prev, {
        id: `qt-${Date.now()}`,
        name,
        value: 0,
        target: 8,
        color: plannerColors[Math.floor(Math.random() * plannerColors.length)]
      }]);
    }
  };

  const removeQuickTracker = (id: string) => {
    setQuickTrackers(prev => prev.filter(t => t.id !== id));
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

  const calculateProgress = () => {
    // Total tasks (Priorities + Todos) across all 7 days + Weekly lists
    const dailyTodos = dailyData.reduce((acc, day) => acc + day.priorities.length, 0);
    const completedDaily = dailyData.reduce((acc, day) => acc + day.priorities.filter(p => p.completed).length, 0);

    const weeklyTotal = weeklyPriorities.length + weeklyTodos.length;
    const completedWeekly = weeklyPriorities.filter(p => p.completed).length + weeklyTodos.filter(t => t.completed).length;

    const total = dailyTodos + weeklyTotal;
    const completed = completedDaily + completedWeekly;

    if (total > 0) return (completed / total) * 100;

    // Fallback: Time progress if no tasks
    const now = new Date();
    const sunday = getSunday(new Date(currentWeekId));
    const nextSunday = new Date(sunday);
    nextSunday.setDate(sunday.getDate() + 7);

    if (now >= sunday && now < nextSunday) {
      const elapsed = now.getTime() - sunday.getTime();
      const totalWeek = 7 * 24 * 60 * 60 * 1000;
      return (elapsed / totalWeek) * 100;
    }

    return now > nextSunday ? 100 : 0;
  };

  const progress = calculateProgress();
  const weekNumber = getWeekNumber(new Date(currentWeekId));

  return (
    <div
      ref={plannerRef}
      className={cn(
        "flex flex-col w-full mx-auto border-x border-slate-300 bg-white dark:bg-slate-950 dark:border-slate-800 relative shadow-2xl",
        isExporting
          ? "h-auto min-w-[1400px]"
          : "h-screen overflow-hidden md:h-[95vh] md:my-4"
      )}
    >
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end p-4 sm:p-6 border-b-2 border-slate-900 dark:border-slate-100 shrink-0 gap-4 bg-white dark:bg-slate-950 z-20">
        <div className="flex justify-between items-center w-full sm:w-auto">
          <div className="flex flex-col">
            <h1 className="text-2xl sm:text-4xl font-black tracking-tighter uppercase dark:text-white">Weekly Schedule</h1>
            {!isExporting && (
              <div className="flex gap-2 mt-2 no-export">
                <button
                  onClick={() => handleExport('png')}
                  className="flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-bold uppercase hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors dark:text-white"
                >
                  <ImageIcon size={12} /> PNG
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-bold uppercase hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors dark:text-white"
                >
                  <FileText size={12} /> PDF
                </button>
              </div>
            )}
          </div>
          {!isExporting && (
            <button
              onClick={toggleDarkMode}
              className="sm:hidden p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400 no-export"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          )}
        </div>
        <div className="flex items-end gap-4 sm:gap-8 pb-1 w-full sm:w-auto justify-between sm:justify-end">
           {!isExporting && (
             <button
               onClick={toggleDarkMode}
               className="hidden sm:flex p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400 mb-1 no-export"
             >
               {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
             </button>
           )}
           <div className="flex items-baseline gap-2">
             <input
               value={header.month}
               onChange={(e) => updateHeader({ month: e.target.value })}
               className="text-2xl sm:text-3xl font-black uppercase text-slate-400 bg-transparent outline-none w-16 sm:w-20 text-right focus:text-slate-900 dark:focus:text-white transition-colors"
               placeholder="Month"
             />
             <span className="w-px h-6 sm:h-8 bg-slate-900 dark:bg-slate-100 mx-1" />
             <div className="flex flex-col min-w-[100px]">
               <div className="flex items-center justify-between gap-2">
                 {!isExporting && (
                   <button onClick={() => changeWeek(-1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors text-slate-400 no-export">
                     <ChevronLeft size={14}/>
                   </button>
                 )}
                 <span className="text-xl sm:text-2xl font-black uppercase tracking-tighter dark:text-white">
                   Week {weekNumber}
                 </span>
                 {!isExporting && (
                   <button onClick={() => changeWeek(1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors text-slate-400 no-export">
                     <ChevronRight size={14}/>
                   </button>
                 )}
               </div>

               {/* Progress Bar */}
               <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full mt-1 overflow-hidden">
                 <div
                   className="h-full bg-slate-900 dark:bg-white transition-all duration-500 ease-out"
                   style={{ width: `${progress}%` }}
                 />
               </div>

               {!templateMode && (
                 <span className="text-[7px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                   {header.weekOf}
                 </span>
               )}
             </div>
           </div>
        </div>
      </header>

      {/* Day Selector (Mobile Only) */}
      {!isExporting && (
        <div className="lg:hidden flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto bg-slate-50 dark:bg-slate-900 shrink-0 no-export">
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
      )}

      {/* Color Palette (Floating Toolbar) */}
      {!isExporting && (
        <div className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 p-2 flex items-center justify-center gap-4 shrink-0 z-10 shadow-sm overflow-x-auto no-export">
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
      )}

      {/* Main Area */}
      <main className={cn(
        "flex flex-1 relative",
        isExporting ? "overflow-visible" : "overflow-hidden"
      )}>
        {/* Sidebar - Desktop: Fixed, Mobile: Floating Island */}
        <div className={cn(
          "shrink-0 border-r border-slate-300 dark:border-slate-800",
          !isExporting && "hidden lg:flex"
        )}>
          <Sidebar
            settings={sidebarSettings}
            onUpdateSettings={updateSidebarSettings}
            templateMode={templateMode}
            onToggleTemplateMode={() => setTemplateMode(!templateMode)}
            isExporting={isExporting}
            calendarUrl={calendarUrl}
            onUpdateCalendarUrl={setCalendarUrl}
            priorities={weeklyPriorities}
            todos={weeklyTodos}
            habits={habits}
            focusData={focusData}
            onUpdateFocus={updateFocus}
            brainDump={brainDump}
            onUpdateBrainDump={setBrainDump}
            mealData={mealData}
            onUpdateMeal={updateMeal}
            gratitudeData={gratitudeData}
            onUpdateGratitude={updateGratitude}
            quickTrackers={quickTrackers}
            onUpdateQuickTracker={updateQuickTracker}
            onAddQuickTracker={addQuickTracker}
            onRemoveQuickTracker={removeQuickTracker}
            plannerColors={plannerColors}
            selectedColor={selectedColor}
            onUpdateWeekly={updateWeekly}
            onUpdateHabit={updateHabit}
            onAddHabit={addHabit}
            onRemoveHabit={removeHabit}
            onAddWeekly={addWeeklyItem}
            onRemoveWeekly={removeWeeklyItem}
            onClearWeekly={clearWeeklyList}
            onAddColor={addPlannerColor}
            onRemoveColor={removePlannerColor}
            onSelectColor={setSelectedColor}
          />
        </div>

        {/* Floating Island for Mobile */}
        {isOverviewOpen && !isExporting && (
          <div className="lg:hidden fixed inset-0 z-50 flex items-center justify-center p-4 no-export">
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
                  settings={sidebarSettings}
                  onUpdateSettings={updateSidebarSettings}
                  templateMode={templateMode}
                  onToggleTemplateMode={() => setTemplateMode(!templateMode)}
                  calendarUrl={calendarUrl}
                  onUpdateCalendarUrl={setCalendarUrl}
                  priorities={weeklyPriorities}
                  todos={weeklyTodos}
                  habits={habits}
                  focusData={focusData}
                  onUpdateFocus={updateFocus}
                  brainDump={brainDump}
                  onUpdateBrainDump={setBrainDump}
                  mealData={mealData}
                  onUpdateMeal={updateMeal}
                  gratitudeData={gratitudeData}
                  onUpdateGratitude={updateGratitude}
                  quickTrackers={quickTrackers}
                  onUpdateQuickTracker={updateQuickTracker}
                  onAddQuickTracker={addQuickTracker}
                  onRemoveQuickTracker={removeQuickTracker}
                  plannerColors={plannerColors}
                  selectedColor={selectedColor}
                  onUpdateWeekly={updateWeekly}
                  onUpdateHabit={updateHabit}
                  onAddHabit={addHabit}
                  onRemoveHabit={removeHabit}
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
        <div className={cn(
          "flex-1 flex bg-slate-50/30 dark:bg-slate-900/10",
          isExporting ? "overflow-visible" : "overflow-x-auto overflow-y-auto"
        )}>
          {days.map((day, index) => {
            // Filter synced events for this day
            const dayStart = new Date();
            dayStart.setDate(dayStart.getDate() - dayStart.getDay() + index);
            dayStart.setHours(0,0,0,0);
            const dayEnd = new Date(dayStart);
            dayEnd.setHours(23,59,59,999);

            const dayEvents = syncedEvents.filter(e =>
              e.start >= dayStart && e.start <= dayEnd
            );

            return (
              <div
                key={day}
                className={cn(
                  "flex-1 flex flex-col min-w-[180px] lg:min-w-[200px]",
                  isExporting ? "flex" : (activeDayIndex === index ? "flex" : "hidden lg:flex")
                )}
              >
                {dailyData[index] && (
                  <DayColumn
                    day={day}
                    data={dailyData[index]}
                    templateMode={templateMode}
                    isExporting={isExporting}
                    selectedColor={selectedColor}
                    syncedEvents={dayEvents}
                    isToday={!templateMode && new Date().getDay() === index}
                    onUpdate={(updates) => updateDaily(index, updates)}
                    onAddPriority={() => addDailyPriority(index)}
                    onRemovePriority={(id) => removeDailyPriority(index, id)}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile Floating Action Button */}
        {!isExporting && (
          <button
            onClick={() => setIsOverviewOpen(true)}
            className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-40 no-export"
          >
            <div className="flex flex-col items-center">
              <span className="text-[8px] font-black uppercase leading-none mb-0.5">Show</span>
              <span className="text-[10px] font-black uppercase leading-none">Habits</span>
            </div>
          </button>
        )}
      </main>
    </div>
  );
};

export default WeeklyPlanner;
