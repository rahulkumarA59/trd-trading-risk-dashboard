import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
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

export default function PerformanceComparisonChart({ data }) {
  if (!data?.length) {
    return (
      <ChartEmptyState
        title="No performance comparison available"
        message="Portfolio holdings are required before invested versus live value can be compared."
      />
    );
  }

  return (
    <div className="h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barGap={8}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
          <XAxis
            dataKey="symbol"
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
          <Legend wrapperStyle={{ color: '#cbd5e1', fontSize: 12 }} />
          <Bar dataKey="invested" name="Invested" fill="#334155" radius={[8, 8, 0, 0]} />
          <Bar dataKey="currentValue" name="Current Value" fill="#38bdf8" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
