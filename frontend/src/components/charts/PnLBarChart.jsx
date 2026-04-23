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

export default function PnLBarChart({ data }) {
  if (!data?.length) {
    return (
      <ChartEmptyState
        title="No PnL distribution yet"
        message="The profit and loss view appears once your portfolio contains active positions."
      />
    );
  }

  return (
    <div className="h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} horizontal={false} />
          <XAxis
            type="number"
            axisLine={false}
            tickLine={false}
            tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
            tickFormatter={(value) => formatCurrency(value)}
          />
          <YAxis
            type="category"
            dataKey="symbol"
            axisLine={false}
            tickLine={false}
            tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
            width={56}
          />
          <Tooltip
            content={(
              <ChartTooltip
                valueFormatter={(value, _name, payload) => `${formatCurrency(value)} (${payload.profitLossPercentage.toFixed(2)}%)`}
              />
            )}
          />
          <Bar dataKey="profitLoss" name="Profit / Loss" radius={[0, 8, 8, 0]}>
            {data.map((entry) => (
              <Cell key={entry.symbol} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
