import React from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import ChartEmptyState from './ChartEmptyState';
import ChartTooltip from './ChartTooltip';
import { formatCurrency } from '../../utils/formatCurrency';

export default function AllocationPieChart({ data }) {
  if (!data?.length) {
    return (
      <ChartEmptyState
        title="No allocation to show"
        message="Portfolio allocations will appear here once the backend returns live holdings."
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="symbol"
              cx="50%"
              cy="50%"
              innerRadius={72}
              outerRadius={104}
              paddingAngle={3}
              stroke="none"
            >
              {data.map((entry) => (
                <Cell key={entry.symbol} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={(
                <ChartTooltip
                  valueFormatter={(value, _name, payload) => `${formatCurrency(value)} (${payload.percentage.toFixed(1)}%)`}
                />
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="grid gap-2">
        {data.map((entry) => (
          <div key={entry.symbol} className="flex items-center justify-between rounded-2xl bg-slate-950/45 px-3 py-2.5">
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
              <div>
                <p className="text-sm font-medium text-white">{entry.symbol}</p>
                <p className="text-xs text-slate-500">{entry.name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-white">{entry.percentage.toFixed(1)}%</p>
              <p className="text-xs text-slate-500">{formatCurrency(entry.value)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
