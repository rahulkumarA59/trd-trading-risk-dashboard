import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import ChartEmptyState from './ChartEmptyState';
import ChartTooltip from './ChartTooltip';
import { formatCurrency } from '../../utils/formatCurrency';
import { CHART_COLORS } from '../../utils/constants';

export default function VolatilityChart({ data }) {
  if (!data?.length) {
    return (
      <ChartEmptyState
        title="No volatility data"
        message="Per-position volatility appears when the backend returns live holdings."
      />
    );
  }

  return (
    <div className="h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
            tickFormatter={(value) => `${Number(value).toFixed(0)}%`}
            width={56}
          />
          <Tooltip
            content={(
              <ChartTooltip
                valueFormatter={(value, _name, payload) => `${Number(value).toFixed(2)}% | Live ${formatCurrency(payload.currentPrice)}`}
              />
            )}
          />
          <Bar dataKey="volatility" name="Volatility" radius={[10, 10, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.symbol} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
