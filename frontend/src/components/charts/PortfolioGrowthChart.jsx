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

const formatAxisValue = (value) => {
  if (Math.abs(value) >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${Number(value).toFixed(0)}`;
};

export default function PortfolioGrowthChart({ data }) {
  if (!data?.length) {
    return (
      <ChartEmptyState
        title="No portfolio growth yet"
        message="Create some trades and holdings to unlock the live portfolio growth line."
      />
    );
  }

  return (
    <div className="h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="portfolio-growth-line" x1="0%" y1="0%" x2="100%" y2="0%">
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
            tickFormatter={formatAxisValue}
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
            dataKey="invested"
            name="Invested Capital"
            stroke="#475569"
            strokeDasharray="6 6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#64748b' }}
          />
          <Line
            type="monotone"
            dataKey="value"
            name="Portfolio Value"
            stroke="url(#portfolio-growth-line)"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 5, fill: '#38bdf8', stroke: '#0f172a', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
