import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Shield,
  Target,
  TrendingDown,
} from 'lucide-react';
import Card, { CardHeader, CardTitle } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { PageLoader } from '../components/common/Loader';
import RiskGaugeChart from '../components/charts/RiskGaugeChart';
import VolatilityChart from '../components/charts/VolatilityChart';
import portfolioService from '../services/portfolioService';
import riskService from '../services/riskService';
import { formatCurrency } from '../utils/formatCurrency';
import { toNumber, buildVolatilityChartData } from '../utils/chartData';

export default function RiskAnalysis() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [riskData, setRiskData] = useState(null);
  const [holdings, setHoldings] = useState([]);

  useEffect(() => {
    const fetchRiskData = async () => {
      const [riskRes, portfolioRes] = await Promise.allSettled([
        riskService.getRiskAnalysis(),
        portfolioService.getPortfolio(),
      ]);

      if (riskRes.status === 'fulfilled') {
        setRiskData(riskRes.value);
      }

      if (portfolioRes.status === 'fulfilled') {
        setHoldings(Array.isArray(portfolioRes.value) ? portfolioRes.value : []);
      }

      if (riskRes.status === 'rejected' && portfolioRes.status === 'rejected') {
        setError('Unable to load risk analytics from the backend right now.');
      } else if (riskRes.status === 'rejected' || portfolioRes.status === 'rejected') {
        setError('Some risk visuals are limited because part of the backend data is unavailable.');
      }

      setLoading(false);
    };

    fetchRiskData();
  }, []);

  if (loading) {
    return <PageLoader />;
  }

  const liveRisk = riskData || {
    totalPortfolioValue: 0,
    totalInvested: 0,
    volatility: 0,
    sharpeRatio: 0,
    var90: 0,
    var95: 0,
    var99: 0,
    maxDrawdown: 0,
    diversificationScore: 0,
    riskLevel: 'MEDIUM',
  };

  const riskLevel = liveRisk.riskLevel?.toUpperCase?.() || 'MEDIUM';
  const volatilityData = buildVolatilityChartData(holdings);

  const riskMetrics = [
    {
      title: 'Risk Level',
      value: riskLevel,
      icon: Shield,
      iconBg: 'bg-amber-400/10',
      iconColor: 'text-amber-300',
      sub: 'Overall portfolio posture',
      badge: true,
    },
    {
      title: 'Volatility',
      value: `${toNumber(liveRisk.volatility).toFixed(2)}%`,
      icon: Activity,
      iconBg: 'bg-sky-400/10',
      iconColor: 'text-sky-300',
      sub: 'Average live price dispersion',
    },
    {
      title: 'Sharpe Ratio',
      value: toNumber(liveRisk.sharpeRatio).toFixed(2),
      icon: Target,
      iconBg: 'bg-violet-400/10',
      iconColor: 'text-violet-300',
      sub: 'Risk-adjusted performance',
    },
    {
      title: 'Max Drawdown',
      value: `${toNumber(liveRisk.maxDrawdown).toFixed(2)}%`,
      icon: TrendingDown,
      iconBg: 'bg-rose-400/10',
      iconColor: 'text-rose-300',
      sub: 'Largest peak-to-trough loss',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Risk Analysis</h1>
          <p className="mt-1 text-sm text-slate-400">Visual risk analytics derived from your live portfolio and backend risk engine.</p>
        </div>
        <Badge
          variant={riskLevel === 'LOW' ? 'success' : riskLevel === 'HIGH' || riskLevel === 'CRITICAL' ? 'danger' : 'warning'}
          size="lg"
          dot
        >
          {riskLevel} RISK
        </Badge>
      </div>

      {error ? (
        <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {riskMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.title} className="overflow-hidden border-slate-700/60 bg-slate-900/90">
              <div className="flex items-start justify-between">
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${metric.iconBg}`}>
                  <Icon className={`h-5 w-5 ${metric.iconColor}`} />
                </div>
                {metric.badge ? (
                  <Badge
                    variant={riskLevel === 'LOW' ? 'success' : riskLevel === 'HIGH' ? 'danger' : 'warning'}
                    size="sm"
                    dot
                  >
                    {riskLevel}
                  </Badge>
                ) : null}
              </div>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{metric.title}</p>
              <p className="mt-2 text-2xl font-bold text-white">{metric.value}</p>
              <p className="mt-2 text-sm text-slate-500">{metric.sub}</p>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1.4fr]">
        <Card className="overflow-hidden border-slate-700/60 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.12),_transparent_30%),linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(15,23,42,0.92),_rgba(30,41,59,0.95))]">
          <CardHeader>
            <div>
              <CardTitle>Risk Gauge</CardTitle>
              <p className="mt-2 text-sm text-slate-500">Visual score combining backend risk level, volatility, and diversification.</p>
            </div>
          </CardHeader>
          <RiskGaugeChart
            riskLevel={riskLevel}
            volatility={liveRisk.volatility}
            diversificationScore={liveRisk.diversificationScore}
          />
        </Card>

        <Card className="overflow-hidden border-slate-700/60 bg-slate-900/90">
          <CardHeader>
            <div>
              <CardTitle>Position Volatility</CardTitle>
              <p className="mt-2 text-sm text-slate-500">Per-holding volatility inferred from live price versus average cost.</p>
            </div>
          </CardHeader>
          <VolatilityChart data={volatilityData} />
        </Card>
      </div>

      <Card className="overflow-hidden border-slate-700/60 bg-slate-900/90">
        <CardHeader>
          <div>
            <CardTitle>Risk Summary</CardTitle>
            <p className="mt-2 text-sm text-slate-500">Key backend risk metrics for rapid portfolio review.</p>
          </div>
          <AlertTriangle className="h-4 w-4 text-amber-300" />
        </CardHeader>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {[
            { label: 'Portfolio Value', value: formatCurrency(liveRisk.totalPortfolioValue), color: 'text-white' },
            { label: 'Total Invested', value: formatCurrency(liveRisk.totalInvested), color: 'text-sky-300' },
            { label: '95% VaR', value: formatCurrency(liveRisk.var95), color: 'text-amber-300' },
            { label: '99% VaR', value: formatCurrency(liveRisk.var99), color: 'text-rose-300' },
            { label: 'Diversification', value: `${toNumber(liveRisk.diversificationScore).toFixed(0)}/100`, color: 'text-emerald-300' },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl bg-slate-950/45 px-4 py-5 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
              <p className={`mt-3 text-xl font-bold ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
