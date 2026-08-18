import React from 'react';
import { Activity, Plus, Minus, Trash2 } from 'lucide-react';
import { QuickTracker } from './WeeklyPlanner';

interface QuickTrackersWidgetProps {
  data: QuickTracker[];
  onUpdate: (id: string, updates: Partial<QuickTracker>) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}

const QuickTrackersWidget = ({ data, onUpdate, onAdd, onRemove }: QuickTrackersWidgetProps) => {
  return (
    <div className="space-y-4">
      <style jsx global>{`
        /* Hide number input spinners */
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>

      <div className="flex justify-between items-center border-b-2 border-slate-900 dark:border-slate-100 pb-1">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-slate-400" />
          <h3 className="font-black uppercase tracking-wider text-[11px] dark:text-white">Quick Trackers</h3>
        </div>
        <button
          onClick={onAdd}
          className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <Plus size={12} />
        </button>
      </div>

      <div className="space-y-4">
        {data.map((tracker) => (
          <div key={tracker.id} className="space-y-2 group">
            <div className="flex justify-between items-baseline px-1">
              <input
                value={tracker.name}
                onChange={(e) => onUpdate(tracker.id, { name: e.target.value })}
                className="text-[10px] font-bold dark:text-slate-300 bg-transparent outline-none border-none w-1/2 focus:text-slate-900 dark:focus:text-white transition-colors"
                placeholder="Name..."
              />
              <div className="flex items-center gap-2">
                <div className="flex items-baseline text-[11px] font-black dark:text-white">
                  <span className="w-5 text-right">{Math.min(tracker.value, tracker.target)}</span>
                  <span className="mx-1 text-slate-300 opacity-50">/</span>
                  <input
                    type="number"
                    value={tracker.target}
                    onChange={(e) => {
                      const newTarget = parseInt(e.target.value) || 1;
                      onUpdate(tracker.id, {
                        target: newTarget,
                        value: Math.min(tracker.value, newTarget)
                      });
                    }}
                    className="w-6 bg-transparent outline-none border-none text-left focus:text-slate-900 dark:focus:text-white transition-colors"
                  />
                </div>
                <button
                  onClick={() => onRemove(tracker.id)}
                  className="opacity-20 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all ml-1"
                  title="Remove Tracker"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onUpdate(tracker.id, { value: Math.max(0, tracker.value - 1) })}
                className="w-6 h-6 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-100 dark:border-slate-800"
              >
                <Minus size={10} className="text-slate-400 group-hover:text-slate-600" />
              </button>
              <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-900/50 rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full transition-all duration-700 ease-out"
                  style={{
                    width: `${Math.min(100, (tracker.value / tracker.target) * 100)}%`,
                    backgroundColor: tracker.color
                  }}
                />
              </div>
              <button
                onClick={() => onUpdate(tracker.id, { value: Math.min(tracker.target, tracker.value + 1) })}
                className="w-6 h-6 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-100 dark:border-slate-800"
              >
                <Plus size={10} className="text-slate-400 group-hover:text-slate-600" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuickTrackersWidget;
