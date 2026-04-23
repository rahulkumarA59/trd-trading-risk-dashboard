import React, { useEffect, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Briefcase,
  DollarSign,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import Card, { CardHeader, CardTitle } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { PageLoader } from '../components/common/Loader';
import AllocationPieChart from '../components/charts/AllocationPieChart';
import PerformanceComparisonChart from '../components/charts/PerformanceComparisonChart';
import PnLBarChart from '../components/charts/PnLBarChart';
import portfolioService from '../services/portfolioService';
import { formatCurrency } from '../utils/formatCurrency';
import { formatPercentage } from '../utils/calculations';
import {
  buildAllocationChartData,
  buildPerformanceComparisonData,
  buildPnLChartData,
  toNumber,
} from '../utils/chartData';

export default function Portfolio() {
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const data = await portfolioService.getPortfolio();
        setHoldings(Array.isArray(data) ? data : []);
      } catch {
        setError('Unable to load portfolio analytics from the backend.');
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, []);

  if (loading) {
    return <PageLoader />;
  }

  const totalInvested = holdings.reduce((sum, holding) => sum + toNumber(holding.totalInvested), 0);
  const totalCurrentValue = holdings.reduce((sum, holding) => sum + toNumber(holding.currentValue), 0);
  const totalProfitLoss = totalCurrentValue - totalInvested;
  const totalProfitPercent = totalInvested ? (totalProfitLoss / totalInvested) * 100 : 0;
  const isProfit = totalProfitLoss >= 0;
  const allocationData = buildAllocationChartData(holdings);
  const performanceData = buildPerformanceComparisonData(holdings);
  const pnlData = buildPnLChartData(holdings);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Portfolio</h1>
        <p className="mt-1 text-sm text-slate-400">Position-level analytics from your live portfolio and current market data.</p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="group overflow-hidden border-slate-700/60 bg-slate-900/90">
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-400/10 transition-transform duration-300 group-hover:scale-110">
              <DollarSign className="h-5 w-5 text-sky-300" />
            </div>
          </div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Total Invested</p>
          <p className="mt-2 text-2xl font-bold text-white">{formatCurrency(totalInvested)}</p>
          <p className="mt-2 text-sm text-slate-500">{holdings.length} live positions</p>
        </Card>

        <Card className="group overflow-hidden border-slate-700/60 bg-slate-900/90">
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/10 transition-transform duration-300 group-hover:scale-110">
              <Briefcase className="h-5 w-5 text-cyan-300" />
            </div>
          </div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Current Value</p>
          <p className="mt-2 text-2xl font-bold text-white">{formatCurrency(totalCurrentValue)}</p>
          <p className="mt-2 text-sm text-slate-500">Marked to market</p>
        </Card>

        <Card className="group overflow-hidden border-slate-700/60 bg-slate-900/90">
          <div className="flex items-start justify-between">
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 ${isProfit ? 'bg-emerald-400/10' : 'bg-rose-400/10'}`}>
              {isProfit ? <TrendingUp className="h-5 w-5 text-emerald-300" /> : <TrendingDown className="h-5 w-5 text-rose-300" />}
            </div>
            <Badge variant={isProfit ? 'success' : 'danger'} size="sm" dot>
              {formatPercentage(totalProfitPercent)}
            </Badge>
          </div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Net P/L</p>
          <p className={`mt-2 text-2xl font-bold ${isProfit ? 'text-emerald-300' : 'text-rose-300'}`}>
            {isProfit ? '+' : ''}{formatCurrency(totalProfitLoss)}
          </p>
          <p className="mt-2 text-sm text-slate-500">Across all active holdings</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card className="overflow-hidden border-slate-700/60 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.1),_transparent_28%),linear-gradient(135deg,_rgba(15,23,42,0.96),_rgba(15,23,42,0.92),_rgba(30,41,59,0.94))]">
          <CardHeader>
            <div>
              <CardTitle>Investment vs Current Value</CardTitle>
              <p className="mt-2 text-sm text-slate-500">Direct comparison of capital deployed against current live value for each position.</p>
            </div>
          </CardHeader>
          <PerformanceComparisonChart data={performanceData} />
        </Card>

        <Card className="overflow-hidden border-slate-700/60 bg-slate-900/90">
          <CardHeader>
            <div>
              <CardTitle>Allocation</CardTitle>
              <p className="mt-2 text-sm text-slate-500">Percentage weight by current position value.</p>
            </div>
          </CardHeader>
          <AllocationPieChart data={allocationData} />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1.8fr]">
        <Card className="overflow-hidden border-slate-700/60 bg-slate-900/90">
          <CardHeader>
            <div>
              <CardTitle>P/L Distribution</CardTitle>
              <p className="mt-2 text-sm text-slate-500">Green bars indicate profitable positions and red bars highlight drawdowns.</p>
            </div>
          </CardHeader>
          <PnLBarChart data={pnlData} />
        </Card>

        <Card className="overflow-hidden border-slate-700/60 bg-slate-900/90">
          <CardHeader>
            <CardTitle>Holdings</CardTitle>
            <Badge variant="info" size="sm">{holdings.length} positions</Badge>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  {['Stock', 'Qty', 'Avg Price', 'Current Value', 'Invested', 'P/L', 'P/L %'].map((heading) => (
                    <th key={heading} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {holdings.length ? holdings.map((holding) => {
                  const profitLoss = toNumber(holding.profitLoss);
                  const rising = profitLoss >= 0;

                  return (
                    <tr key={holding.id || holding.stockSymbol} className="transition-colors hover:bg-slate-800/40">
                      <td className="px-4 py-3.5">
                        <div>
                          <p className="text-sm font-bold text-white">{holding.stockSymbol}</p>
                          <p className="text-xs text-slate-500">{holding.stockName}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-300">{holding.quantity}</td>
                      <td className="px-4 py-3.5 text-sm text-slate-300">{formatCurrency(holding.averagePrice)}</td>
                      <td className="px-4 py-3.5 text-sm font-semibold text-white">{formatCurrency(holding.currentValue)}</td>
                      <td className="px-4 py-3.5 text-sm text-slate-400">{formatCurrency(holding.totalInvested)}</td>
                      <td className="px-4 py-3.5">
                        <div className={`flex items-center gap-1 text-sm font-semibold ${rising ? 'text-emerald-300' : 'text-rose-300'}`}>
                          {rising ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                          {rising ? '+' : ''}{formatCurrency(profitLoss)}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant={rising ? 'success' : 'danger'} size="sm">
                          {formatPercentage(holding.profitLossPercentage)}
                        </Badge>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-500">
                      No portfolio positions were returned by the backend.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
