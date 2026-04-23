import React from 'react';
import { BarChart3 } from 'lucide-react';

export default function ChartEmptyState({
  title = 'No chart data yet',
  message = 'The backend did not return enough live data to render this visualization.',
}) {
  return (
    <div className="flex h-full min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700/70 bg-slate-950/40 px-6 text-center">
      <div className="rounded-2xl bg-slate-800/70 p-3 text-sky-300">
        <BarChart3 className="h-5 w-5" />
      </div>
      <p className="mt-4 text-sm font-semibold text-white">{title}</p>
      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">{message}</p>
    </div>
  );
}
