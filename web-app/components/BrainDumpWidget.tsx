import React from 'react';
import { Lightbulb } from 'lucide-react';

interface BrainDumpWidgetProps {
  data: string;
  onUpdate: (val: string) => void;
}

const BrainDumpWidget = ({ data, onUpdate }: BrainDumpWidgetProps) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 border-b-2 border-slate-900 dark:border-slate-100 pb-1">
        <Lightbulb size={14} className="text-slate-400" />
        <h3 className="font-black uppercase tracking-wider text-[11px] dark:text-white">Brain Dump</h3>
      </div>
      <textarea
        value={data}
        onChange={(e) => onUpdate(e.target.value)}
        placeholder="Capture thoughts..."
        className="w-full h-32 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg outline-none text-[11px] leading-relaxed dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700 resize-none border border-transparent focus:border-slate-200 dark:focus:border-slate-800 transition-all"
      />
    </div>
  );
};

export default BrainDumpWidget;
