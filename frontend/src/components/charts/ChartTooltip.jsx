import React from 'react';

export default function ChartTooltip({
  active,
  payload,
  label,
  labelFormatter = (value) => value,
  valueFormatter = (value) => value,
}) {
  const entries = payload?.filter((entry) => entry && entry.value !== null && entry.value !== undefined) ?? [];

  if (!active || !entries.length) {
    return null;
  }

  return (
    <div className="min-w-[180px] rounded-2xl border border-slate-700/70 bg-slate-950/95 px-4 py-3 shadow-2xl shadow-slate-950/50 backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        {labelFormatter(label)}
      </p>
      <div className="mt-3 space-y-2">
        {entries.map((entry) => (
          <div key={`${entry.dataKey}-${entry.name}`} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: entry.color || entry.fill || '#38bdf8' }}
              />
              <span className="text-sm text-slate-300">{entry.name}</span>
            </div>
            <span className="text-sm font-semibold text-white">
              {valueFormatter(entry.value, entry.name, entry.payload)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
