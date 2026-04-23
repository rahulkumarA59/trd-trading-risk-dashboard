import React from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import ChartEmptyState from './ChartEmptyState';
import ChartTooltip from './ChartTooltip';
import { formatCurrency } from '../../utils/formatCurrency';
import { CHART_COLORS } from '../../utils/constants';

export default function ForecastChart({ data }) {
  if (!data?.length) {
    return (
      <ChartEmptyState
        title="No forecast selected"
        message="Search for a stock symbol or choose an existing prediction to render the historical versus predicted chart."
      />
    );
  }

  return (
    <div className="h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="forecast-line" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
            tickFormatter={(value) => formatCurrency(value)}
            width={72}
          />
          <Tooltip
            content={(
              <ChartTooltip
                valueFormatter={(value) => formatCurrency(value)}
              />
            )}
          />
          <Line
            type="monotone"
            dataKey="actual"
            name="Historical"
            stroke="#38bdf8"
            strokeWidth={2.5}
            connectNulls={false}
            dot={{ r: 4, fill: '#38bdf8' }}
            activeDot={{ r: 5, fill: '#38bdf8', stroke: '#0f172a', strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="predicted"
            name="Predicted"
            stroke="url(#forecast-line)"
            strokeWidth={2.5}
            strokeDasharray="7 6"
            connectNulls
            dot={{ r: 4, fill: '#a78bfa' }}
            activeDot={{ r: 5, fill: '#a78bfa', stroke: '#0f172a', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
