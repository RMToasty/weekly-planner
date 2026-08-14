import React from 'react';
import { Activity, Plus, Minus, Trash2 } from 'lucide-react';
import { QuickTracker } from './WeeklyPlanner';

interface QuickTrackersWidgetProps {
  data: QuickTracker[];
  onUpdate: (id: string, delta: number) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}

const QuickTrackersWidget = ({ data, onUpdate, onAdd, onRemove }: QuickTrackersWidgetProps) => {
  return (
    <div className="space-y-4">
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

      <div className="space-y-3">
        {data.map((tracker) => (
          <div key={tracker.id} className="space-y-1.5 group">
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-bold dark:text-slate-300">{tracker.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black">{tracker.value} / {tracker.target}</span>
                <button
                  onClick={() => onRemove(tracker.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onUpdate(tracker.id, -1)}
                className="w-6 h-6 flex items-center justify-center rounded bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Minus size={10} />
              </button>
              <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (tracker.value / tracker.target) * 100)}%`,
                    backgroundColor: tracker.color
                  }}
                />
              </div>
              <button
                onClick={() => onUpdate(tracker.id, 1)}
                className="w-6 h-6 flex items-center justify-center rounded bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Plus size={10} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuickTrackersWidget;
