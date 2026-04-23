import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  Eye,
  Radio,
  Shield,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import Card, { CardHeader, CardTitle } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { PageLoader } from '../components/common/Loader';
import AllocationPieChart from '../components/charts/AllocationPieChart';
import PortfolioGrowthChart from '../components/charts/PortfolioGrowthChart';
import portfolioService from '../services/portfolioService';
import stockService from '../services/stockService';
import tradeService from '../services/tradeService';
import riskService from '../services/riskService';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate, formatDateTime, formatPercentage } from '../utils/calculations';
import {
  buildAllocationChartData,
  buildPortfolioGrowthData,
  filterTimelineByPeriod,
  toNumber,
} from '../utils/chartData';

const chartPeriods = ['7D', '30D', '90D', 'ALL'];

const getStockChangePercent = (current, previous) => {
  const previousValue = toNumber(previous);
  if (!previousValue) {
    return 0;
  }

  return ((toNumber(current) - previousValue) / previousValue) * 100;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chartPeriod, setChartPeriod] = useState('90D');
  const [holdings, setHoldings] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [trades, setTrades] = useState([]);
  const [riskLevel, setRiskLevel] = useState('MEDIUM');

  useEffect(() => {
    const fetchData = async () => {
      const [portfolioRes, tradesRes, riskRes, stocksRes] = await Promise.allSettled([
        portfolioService.getPortfolio(),
        tradeService.getTrades(),
        riskService.getRiskAnalysis(),
        stockService.getStocks(),
      ]);

      if (portfolioRes.status === 'fulfilled') {
        setHoldings(Array.isArray(portfolioRes.value) ? portfolioRes.value : []);
      }

      if (tradesRes.status === 'fulfilled') {
        setTrades(Array.isArray(tradesRes.value) ? tradesRes.value : []);
      }

      if (riskRes.status === 'fulfilled' && riskRes.value?.riskLevel) {
        setRiskLevel(riskRes.value.riskLevel);
      }

      if (stocksRes.status === 'fulfilled') {
        setStocks(Array.isArray(stocksRes.value) ? stocksRes.value : []);
      }

      if (
        portfolioRes.status === 'rejected' &&
        tradesRes.status === 'rejected' &&
        riskRes.status === 'rejected' &&
        stocksRes.status === 'rejected'
      ) {
        setError('Unable to load dashboard analytics from the backend right now.');
      } else if (
        portfolioRes.status === 'rejected' ||
        tradesRes.status === 'rejected' ||
        riskRes.status === 'rejected' ||
        stocksRes.status === 'rejected'
      ) {
        setError('Some dashboard sections could not be refreshed. Showing the live data that is available.');
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return <PageLoader />;
  }

  const totalInvestment = holdings.reduce((sum, holding) => sum + toNumber(holding.totalInvested), 0);
  const currentValue = holdings.reduce((sum, holding) => sum + toNumber(holding.currentValue), 0);
  const profitLoss = currentValue - totalInvestment;
  const profitLossPercent = totalInvestment ? (profitLoss / totalInvestment) * 100 : 0;
  const isProfit = profitLoss >= 0;
  const portfolioGrowthData = filterTimelineByPeriod(buildPortfolioGrowthData(trades, stocks), chartPeriod);
  const allocationData = buildAllocationChartData(holdings);
  const recentTransactions = [...trades].slice(0, 5);
  const marketSnapshot = stocks.slice(0, 4);

  const statCards = [
    {
      title: 'Total Investment',
      value: formatCurrency(totalInvestment),
      icon: DollarSign,
      iconBg: 'bg-sky-400/10',
      iconColor: 'text-sky-300',
      sub: `${holdings.length} active holdings`,
    },
    {
      title: 'Current Value',
      value: formatCurrency(currentValue),
      icon: Activity,
      iconBg: 'bg-cyan-400/10',
      iconColor: 'text-cyan-300',
      sub: 'Marked to live prices',
    },
    {
      title: 'Profit / Loss',
      value: `${isProfit ? '+' : ''}${formatCurrency(profitLoss)}`,
      valueColor: isProfit ? 'text-emerald-300' : 'text-rose-300',
      icon: isProfit ? TrendingUp : TrendingDown,
      iconBg: isProfit ? 'bg-emerald-400/10' : 'bg-rose-400/10',
      iconColor: isProfit ? 'text-emerald-300' : 'text-rose-300',
      sub: `${formatPercentage(profitLossPercent)} all time`,
    },
    {
      title: 'Risk Level',
      value: riskLevel,
      icon: Shield,
      iconBg: 'bg-amber-400/10',
      iconColor: 'text-amber-300',
      sub: 'Portfolio risk score',
      badge: true,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">Live analytics built from your current holdings, trades, and risk data.</p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="group overflow-hidden border-slate-700/60 bg-slate-900/90">
              <div className="flex items-start justify-between">
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${card.iconBg} transition-transform duration-300 group-hover:scale-110`}>
                  <Icon className={`h-5 w-5 ${card.iconColor}`} />
                </div>
                {card.badge ? (
                  <Badge
                    variant={riskLevel === 'LOW' ? 'success' : riskLevel === 'HIGH' ? 'danger' : 'warning'}
                    size="sm"
                    dot
                  >
                    {riskLevel}
                  </Badge>
                ) : (
                  <div className={`flex items-center gap-1 text-xs ${isProfit ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {isProfit ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                  </div>
                )}
              </div>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{card.title}</p>
              <p className={`mt-2 text-2xl font-bold ${card.valueColor || 'text-white'}`}>{card.value}</p>
              <p className="mt-2 text-sm text-slate-500">{card.sub}</p>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card className="overflow-hidden border-slate-700/60 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.12),_transparent_30%),linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(15,23,42,0.92),_rgba(30,41,59,0.95))]">
          <CardHeader className="items-start gap-4 md:items-center">
            <div>
              <CardTitle>Portfolio Growth</CardTitle>
              <p className="mt-2 text-sm text-slate-500">
                Reconstructed from live trade history and current market prices.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {chartPeriods.map((period) => (
                <button
                  key={period}
                  onClick={() => setChartPeriod(period)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    chartPeriod === period
                      ? 'bg-sky-400/15 text-sky-200'
                      : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </CardHeader>
          <PortfolioGrowthChart data={portfolioGrowthData} />
        </Card>

        <Card className="overflow-hidden border-slate-700/60 bg-slate-900/90">
          <CardHeader>
            <div>
              <CardTitle>Allocation Mix</CardTitle>
              <p className="mt-2 text-sm text-slate-500">Live portfolio weights by position value.</p>
            </div>
          </CardHeader>
          <AllocationPieChart data={allocationData} />
        </Card>
      </div>

      <Card className="overflow-hidden border-slate-700/60 bg-[radial-gradient(circle_at_top_right,_rgba(96,165,250,0.12),_transparent_28%),linear-gradient(135deg,_rgba(15,23,42,0.95),_rgba(15,23,42,0.9),_rgba(30,41,59,0.92))]">
        <CardHeader>
          <div>
            <CardTitle>Market Snapshot</CardTitle>
            <p className="mt-2 text-sm text-slate-500">Live quotes for the watchlist available in the trading board.</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/trading')} icon={Radio}>
            Open Trading
          </Button>
        </CardHeader>
        {marketSnapshot.length ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            {marketSnapshot.map((stock) => {
              const change = getStockChangePercent(stock.currentPrice, stock.previousPrice);
              const rising = change >= 0;

              return (
                <div key={stock.symbol} className="rounded-2xl border border-slate-700/60 bg-slate-900/55 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-white">{stock.symbol}</p>
                      <p className="mt-1 text-xs text-slate-500">{stock.name}</p>
                    </div>
                    <Badge variant={rising ? 'success' : 'danger'} size="sm">
                      {rising ? '+' : ''}{change.toFixed(2)}%
                    </Badge>
                  </div>
                  <p className="mt-5 text-2xl font-bold text-white">{formatCurrency(stock.currentPrice)}</p>
                  <div className={`mt-2 flex items-center gap-1 text-xs font-semibold ${rising ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {rising ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {rising ? 'Momentum positive' : 'Momentum negative'}
                  </div>
                  <p className="mt-3 text-xs text-slate-500">
                    Updated {stock.updatedAt ? formatDateTime(stock.updatedAt) : 'recently'}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-700/70 bg-slate-950/30 px-6 py-10 text-center text-sm text-slate-500">
            No live stock quotes are available yet.
          </div>
        )}
      </Card>

      <Card className="overflow-hidden border-slate-700/60 bg-slate-900/90">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/transactions')} icon={Eye}>
            View All
          </Button>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                {['Symbol', 'Type', 'Quantity', 'Price', 'Total', 'Date', 'Status'].map((heading) => (
                  <th key={heading} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {recentTransactions.length ? recentTransactions.map((trade) => (
                <tr key={trade.id} className="transition-colors hover:bg-slate-800/40">
                  <td className="px-4 py-3 text-sm font-semibold text-white">{trade.symbol}</td>
                  <td className="px-4 py-3">
                    <Badge variant={trade.tradeType === 'BUY' ? 'success' : 'danger'} size="sm">
                      {trade.tradeType}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300">{trade.quantity}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">{formatCurrency(trade.price)}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-white">{formatCurrency(trade.total || trade.totalAmount)}</td>
                  <td className="px-4 py-3 text-sm text-slate-400">{formatDate(trade.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Badge variant="info" size="sm">{trade.status || 'COMPLETED'}</Badge>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-500">
                    No transactions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
