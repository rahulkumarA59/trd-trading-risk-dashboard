import React from 'react';
import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from 'recharts';
import ChartEmptyState from './ChartEmptyState';

const levelBase = {
  LOW: 28,
  MEDIUM: 58,
  MODERATE: 62,
  HIGH: 84,
  CRITICAL: 95,
};

const levelColor = {
  LOW: '#10b981',
  MEDIUM: '#f59e0b',
  MODERATE: '#f59e0b',
  HIGH: '#f97316',
  CRITICAL: '#f43f5e',
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export default function RiskGaugeChart({ riskLevel, volatility, diversificationScore }) {
  if (!riskLevel) {
    return (
      <ChartEmptyState
        title="No risk gauge available"
        message="Risk analysis data is required before the gauge can be rendered."
      />
    );
  }

  const normalizedLevel = riskLevel.toUpperCase();
  const baseScore = levelBase[normalizedLevel] ?? 60;
  const volatilityScore = clamp(Number(volatility) * 3, 0, 100);
  const diversificationPenalty = clamp(100 - Number(diversificationScore || 0), 0, 100);
  const score = Math.round((baseScore + volatilityScore + diversificationPenalty) / 3);
  const color = levelColor[normalizedLevel] ?? '#38bdf8';

  return (
    <div className="relative h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          data={[{ name: 'Risk Score', value: score, fill: color }]}
          startAngle={210}
          endAngle={-30}
          innerRadius="70%"
          outerRadius="100%"
          barSize={20}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar background dataKey="value" cornerRadius={16} />
        </RadialBarChart>
      </ResponsiveContainer>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Risk Level</p>
        <p className="mt-2 text-5xl font-bold text-white">{score}</p>
        <p className="mt-3 text-sm font-semibold" style={{ color }}>
          {normalizedLevel}
        </p>
        <p className="mt-2 max-w-[220px] text-center text-sm leading-6 text-slate-500">
          Based on live volatility, diversification, and portfolio risk status from the backend.
        </p>
      </div>
    </div>
  );
}
