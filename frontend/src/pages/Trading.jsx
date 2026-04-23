import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  Radio,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Waves,
} from 'lucide-react';
import Card, { CardHeader, CardTitle } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { PageLoader } from '../components/common/Loader';
import stockService from '../services/stockService';
import tradeService from '../services/tradeService';
import { formatCurrency, formatCompactCurrency } from '../utils/formatCurrency';
import { formatDateTime } from '../utils/calculations';
import toast from 'react-hot-toast';

const mockStocks = [
  { id: 1, symbol: 'AAPL', name: 'Apple Inc.', currentPrice: 210.15, previousPrice: 207.8, volume: 52345000, sector: 'Technology', marketCap: 3100000000000, updatedAt: '2026-04-22T17:20:00' },
  { id: 2, symbol: 'MSFT', name: 'Microsoft Corporation', currentPrice: 425.32, previousPrice: 421.14, volume: 22156000, sector: 'Technology', marketCap: 3200000000000, updatedAt: '2026-04-22T17:20:00' },
  { id: 3, symbol: 'GOOGL', name: 'Alphabet Inc.', currentPrice: 165.48, previousPrice: 164.25, volume: 18234000, sector: 'Communication Services', marketCap: 2050000000000, updatedAt: '2026-04-22T17:20:00' },
  { id: 4, symbol: 'AMZN', name: 'Amazon.com, Inc.', currentPrice: 182.64, previousPrice: 180.92, volume: 34567000, sector: 'Consumer Discretionary', marketCap: 1950000000000, updatedAt: '2026-04-22T17:20:00' },
  { id: 5, symbol: 'NVDA', name: 'NVIDIA Corporation', currentPrice: 945.5, previousPrice: 936.2, volume: 45678000, sector: 'Technology', marketCap: 2300000000000, updatedAt: '2026-04-22T17:20:00' },
  { id: 6, symbol: 'TSLA', name: 'Tesla, Inc.', currentPrice: 167.9, previousPrice: 171.25, volume: 98456000, sector: 'Consumer Discretionary', marketCap: 540000000000, updatedAt: '2026-04-22T17:20:00' },
  { id: 7, symbol: 'META', name: 'Meta Platforms, Inc.', currentPrice: 512.8, previousPrice: 505.9, volume: 16789000, sector: 'Communication Services', marketCap: 1300000000000, updatedAt: '2026-04-22T17:20:00' },
  { id: 8, symbol: 'JPM', name: 'JPMorgan Chase & Co.', currentPrice: 198.4, previousPrice: 196.8, volume: 8900000, sector: 'Financial Services', marketCap: 570000000000, updatedAt: '2026-04-22T17:20:00' },
];

const summaryCards = [
  {
    label: 'Coverage',
    icon: Activity,
    iconWrap: 'bg-sky-400/10 text-sky-300',
    panel: 'from-sky-500/12 via-slate-900 to-slate-900',
    description: 'Tracked symbols',
  },
  {
    label: 'Advancers',
    icon: TrendingUp,
    iconWrap: 'bg-emerald-400/10 text-emerald-300',
    panel: 'from-emerald-500/12 via-slate-900 to-slate-900',
    description: 'Stocks trading higher',
  },
  {
    label: 'Decliners',
    icon: TrendingDown,
    iconWrap: 'bg-rose-400/10 text-rose-300',
    panel: 'from-rose-500/12 via-slate-900 to-slate-900',
    description: 'Stocks trading lower',
  },
  {
    label: 'Sectors',
    icon: ShieldCheck,
    iconWrap: 'bg-amber-400/10 text-amber-300',
    panel: 'from-amber-500/12 via-slate-900 to-slate-900',
    description: 'Sector spread',
  },
];

const getChangePercent = (current, previous) => {
  const currentValue = Number(current) || 0;
  const previousValue = Number(previous) || 0;
  if (!previousValue) {
    return 0;
  }

  return ((currentValue - previousValue) / previousValue) * 100;
};

const formatVolume = (value) => {
  if (!value) return '-';
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return String(value);
};

const formatMarketCap = (value) => {
  if (!value) return '-';
  return formatCompactCurrency(value);
};

export default function Trading() {
  const [stocks, setStocks] = useState(mockStocks);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncingSymbol, setSyncingSymbol] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [tradeType, setTradeType] = useState('BUY');
  const [quantity, setQuantity] = useState('');
  const [tradeLoading, setTradeLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadStocks = async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const data = await stockService.getStocks();
      if (Array.isArray(data) && data.length > 0) {
        setStocks(data);
      } else {
        setStocks(mockStocks);
      }
      setLastUpdated(new Date().toISOString());
    } catch {
      setStocks((previousStocks) => previousStocks.length ? previousStocks : mockStocks);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadStocks();

    const intervalId = window.setInterval(() => {
      loadStocks({ silent: true });
    }, 60000);

    return () => window.clearInterval(intervalId);
  }, []);

  const filteredStocks = useMemo(() => (
    stocks.filter((stock) =>
      stock.symbol?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.sector?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  ), [searchQuery, stocks]);

  const topMover = useMemo(() => (
    [...stocks].sort((left, right) =>
      Math.abs(getChangePercent(right.currentPrice, right.previousPrice)) -
      Math.abs(getChangePercent(left.currentPrice, left.previousPrice))
    )[0]
  ), [stocks]);

  const mostActive = useMemo(() => (
    [...stocks].sort((left, right) => (Number(right.volume) || 0) - (Number(left.volume) || 0))[0]
  ), [stocks]);

  const featuredStocks = useMemo(() => (
    [...stocks].sort((left, right) => (Number(right.marketCap) || 0) - (Number(left.marketCap) || 0)).slice(0, 4)
  ), [stocks]);

  const marketStats = useMemo(() => {
    const gainers = stocks.filter((stock) => getChangePercent(stock.currentPrice, stock.previousPrice) >= 0).length;
    const losers = stocks.filter((stock) => getChangePercent(stock.currentPrice, stock.previousPrice) < 0).length;
    const sectors = new Set(stocks.map((stock) => stock.sector).filter(Boolean)).size;

    return {
      totalStocks: stocks.length,
      gainers,
      losers,
      sectors,
    };
  }, [stocks]);

  const openTradeModal = (stock, type) => {
    setSelectedStock(stock);
    setTradeType(type);
    setQuantity('');
    setShowModal(true);
  };

  const handleTrade = async () => {
    if (!quantity || parseInt(quantity, 10) <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    setTradeLoading(true);
    try {
      await tradeService.executeTrade({
        symbol: selectedStock.symbol,
        quantity: parseInt(quantity, 10),
        tradeType,
      });
      toast.success(`${tradeType} order for ${quantity} shares of ${selectedStock.symbol} executed`);
      setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Trade execution failed');
    } finally {
      setTradeLoading(false);
    }
  };

  const handleRefreshAll = async () => {
    setRefreshing(true);
    try {
      await stockService.refreshAllStocks();
      await loadStocks({ silent: true });
      toast.success('Market board refreshed');
    } catch {
      toast.error('Unable to refresh stock prices right now');
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefreshSymbol = async (symbol) => {
    setSyncingSymbol(symbol);
    try {
      await stockService.refreshStockPrice(symbol);
      await loadStocks({ silent: true });
      toast.success(`${symbol} quote synced`);
    } catch {
      toast.error(`Unable to sync ${symbol} right now`);
    } finally {
      setSyncingSymbol('');
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      <Card
        hover={false}
        className="relative overflow-hidden border-slate-700/60 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_28%),linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(15,23,42,0.92),_rgba(30,41,59,0.95))] p-0"
      >
        <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(148,163,184,0.04),transparent)]" />
        <div className="relative grid gap-6 p-6 md:p-8 xl:grid-cols-[1.65fr_1fr]">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="info" size="sm" className="rounded-full px-3 py-1">
                <Radio className="h-3.5 w-3.5" />
                Live Market Board
              </Badge>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                Auto sync every 60s
              </span>
            </div>

            <div className="space-y-3">
              <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-white md:text-4xl">
                Professional trading view with live-backed quotes and direct execution.
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
                Track the watchlist, sync quotes from the backend on demand, and place orders from the same board without leaving the screen.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]">
              <Input
                icon={Search}
                placeholder="Search by symbol, company, or sector"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                id="stock-search"
              />
              <Button
                variant="outline"
                size="md"
                className="h-[46px] border-slate-600/80 bg-slate-900/60 text-slate-100 hover:border-sky-400/50 hover:bg-sky-400/10"
                icon={RefreshCw}
                loading={refreshing}
                onClick={handleRefreshAll}
              >
                Refresh All
              </Button>
              <div className="flex items-center rounded-xl border border-slate-700/70 bg-slate-900/60 px-4 text-xs font-medium text-slate-400">
                Last checked: <span className="ml-2 text-slate-200">{lastUpdated ? formatDateTime(lastUpdated) : 'Just now'}</span>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              {featuredStocks.map((stock) => {
                const changePercent = getChangePercent(stock.currentPrice, stock.previousPrice);
                const rising = changePercent >= 0;

                return (
                  <div
                    key={stock.symbol}
                    className="rounded-2xl border border-slate-700/60 bg-slate-900/55 p-4 shadow-[0_16px_30px_-24px_rgba(15,23,42,0.95)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{stock.symbol}</p>
                        <p className="mt-1 line-clamp-1 text-xs text-slate-500">{stock.name}</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${rising ? 'bg-emerald-400/10 text-emerald-300' : 'bg-rose-400/10 text-rose-300'}`}>
                        {rising ? '+' : ''}{changePercent.toFixed(2)}%
                      </span>
                    </div>
                    <div className="mt-4 flex items-end justify-between">
                      <div>
                        <p className="text-xl font-bold text-white">{formatCurrency(stock.currentPrice)}</p>
                        <p className="text-xs text-slate-500">Market cap {formatMarketCap(stock.marketCap)}</p>
                      </div>
                      {rising ? (
                        <ArrowUpRight className="h-5 w-5 text-emerald-300" />
                      ) : (
                        <ArrowDownRight className="h-5 w-5 text-rose-300" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-3xl border border-slate-700/70 bg-slate-950/65 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Market Pulse</p>
                  <p className="mt-2 text-2xl font-bold text-white">{marketStats.totalStocks}</p>
                  <p className="text-sm text-slate-400">Symbols currently tracked</p>
                </div>
                <div className="rounded-2xl bg-sky-400/10 p-3 text-sky-300">
                  <Waves className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl border border-emerald-400/10 bg-emerald-400/5 p-3">
                  <p className="text-slate-500">Advancers</p>
                  <p className="mt-1 text-lg font-semibold text-emerald-300">{marketStats.gainers}</p>
                </div>
                <div className="rounded-2xl border border-rose-400/10 bg-rose-400/5 p-3">
                  <p className="text-slate-500">Decliners</p>
                  <p className="mt-1 text-lg font-semibold text-rose-300">{marketStats.losers}</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-700/70 bg-slate-950/65 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-400/10 p-2.5 text-emerald-300">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Best Move</p>
                  <p className="text-sm font-semibold text-white">{topMover?.symbol || 'N/A'}</p>
                </div>
              </div>
              <p className="mt-4 text-3xl font-bold text-white">
                {topMover ? `${getChangePercent(topMover.currentPrice, topMover.previousPrice) >= 0 ? '+' : ''}${getChangePercent(topMover.currentPrice, topMover.previousPrice).toFixed(2)}%` : '-'}
              </p>
              <p className="mt-1 text-sm text-slate-400">{topMover?.name || 'No market movement available yet'}</p>
            </div>

            <div className="rounded-3xl border border-slate-700/70 bg-slate-950/65 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-amber-400/10 p-2.5 text-amber-300">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Most Active</p>
                  <p className="text-sm font-semibold text-white">{mostActive?.symbol || 'N/A'}</p>
                </div>
              </div>
              <p className="mt-4 text-3xl font-bold text-white">{mostActive ? formatVolume(mostActive.volume) : '-'}</p>
              <p className="mt-1 text-sm text-slate-400">Shares traded in the current board snapshot</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          const valueMap = {
            Coverage: marketStats.totalStocks,
            Advancers: marketStats.gainers,
            Decliners: marketStats.losers,
            Sectors: marketStats.sectors,
          };

          return (
            <Card
              key={card.label}
              className={`overflow-hidden border-slate-700/60 bg-gradient-to-br ${card.panel}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{card.label}</p>
                  <p className="mt-3 text-3xl font-bold text-white">{valueMap[card.label]}</p>
                  <p className="mt-2 text-sm text-slate-400">{card.description}</p>
                </div>
                <div className={`rounded-2xl p-3 ${card.iconWrap}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="overflow-hidden border-slate-700/60 bg-slate-900/90">
        <CardHeader className="items-start gap-4 md:items-center">
          <div>
            <CardTitle className="text-slate-400">Market Board</CardTitle>
            <p className="mt-2 text-sm text-slate-500">
              {filteredStocks.length} of {stocks.length} stocks match the current filter.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info" size="sm">{marketStats.totalStocks} tracked</Badge>
            <Badge variant="success" size="sm">{marketStats.gainers} up</Badge>
            <Badge variant="danger" size="sm">{marketStats.losers} down</Badge>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead>
              <tr className="border-b border-slate-700/60 bg-slate-950/40">
                {['Stock', 'Price', 'Change', 'Volume', 'Market Cap', 'Sector', 'Updated', 'Action'].map((heading) => (
                  <th key={heading} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filteredStocks.length > 0 ? filteredStocks.map((stock) => {
                const change = getChangePercent(stock.currentPrice, stock.previousPrice);
                const rising = change >= 0;

                return (
                  <tr key={stock.id || stock.symbol} className="group transition-colors hover:bg-slate-800/35">
                    <td className="px-4 py-4">
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 rounded-2xl p-2 ${rising ? 'bg-emerald-400/10 text-emerald-300' : 'bg-rose-400/10 text-rose-300'}`}>
                          {rising ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{stock.symbol}</p>
                          <p className="mt-1 text-xs text-slate-500">{stock.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-white">{formatCurrency(stock.currentPrice)}</td>
                    <td className="px-4 py-4">
                      <div className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold ${rising ? 'bg-emerald-400/10 text-emerald-300' : 'bg-rose-400/10 text-rose-300'}`}>
                        {rising ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                        {rising ? '+' : ''}{change.toFixed(2)}%
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-300">{formatVolume(stock.volume)}</td>
                    <td className="px-4 py-4 text-sm text-slate-300">{formatMarketCap(stock.marketCap)}</td>
                    <td className="px-4 py-4">
                      <Badge variant="neutral" size="sm">{stock.sector || 'N/A'}</Badge>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-400">{stock.updatedAt ? formatDateTime(stock.updatedAt) : 'Pending sync'}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-slate-600/80 bg-slate-950/30 text-slate-200 hover:border-sky-400/40 hover:bg-sky-400/10"
                          loading={syncingSymbol === stock.symbol}
                          onClick={() => handleRefreshSymbol(stock.symbol)}
                        >
                          Sync
                        </Button>
                        <Button size="sm" variant="success" onClick={() => openTradeModal(stock, 'BUY')}>
                          Buy
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => openTradeModal(stock, 'SELL')}>
                          Sell
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-slate-500">
                    <Search className="mx-auto mb-3 h-10 w-10 opacity-30" />
                    <p>No stocks found matching "{searchQuery}"</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={`${tradeType} ${selectedStock?.symbol || ''}`}>
        {selectedStock && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-lg font-bold text-white">{selectedStock.symbol}</p>
                  <p className="text-sm text-slate-400">{selectedStock.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-white">{formatCurrency(selectedStock.currentPrice)}</p>
                  <p className={`text-xs font-semibold ${getChangePercent(selectedStock.currentPrice, selectedStock.previousPrice) >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {getChangePercent(selectedStock.currentPrice, selectedStock.previousPrice) >= 0 ? '+' : ''}
                    {getChangePercent(selectedStock.currentPrice, selectedStock.previousPrice).toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-700/50 bg-slate-900/40 p-1.5">
              {['BUY', 'SELL'].map((type) => (
                <button
                  key={type}
                  onClick={() => setTradeType(type)}
                  className={`rounded-xl py-2.5 text-sm font-semibold transition-all duration-200 ${
                    tradeType === type
                      ? type === 'BUY'
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                        : 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                      : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <Input
              label="Quantity"
              type="number"
              placeholder="Enter number of shares"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              min="1"
              icon={ShoppingCart}
              id="trade-quantity"
            />

            {quantity && parseInt(quantity, 10) > 0 && (
              <div className="space-y-2 rounded-2xl border border-slate-700/60 bg-slate-900/60 p-4 animate-fade-in">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Order Type</span>
                  <span className={`font-medium ${tradeType === 'BUY' ? 'text-emerald-300' : 'text-rose-300'}`}>
                    Market {tradeType}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Shares</span>
                  <span className="font-medium text-white">{quantity}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Price per share</span>
                  <span className="font-medium text-white">{formatCurrency(selectedStock.currentPrice)}</span>
                </div>
                <div className="mt-2 border-t border-slate-700 pt-3">
                  <div className="flex justify-between">
                    <span className="font-medium text-slate-300">Estimated Total</span>
                    <span className="text-lg font-bold text-white">
                      {formatCurrency(selectedStock.currentPrice * parseInt(quantity, 10))}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button
                variant={tradeType === 'BUY' ? 'success' : 'danger'}
                className="flex-1"
                loading={tradeLoading}
                onClick={handleTrade}
                icon={tradeType === 'BUY' ? ShoppingCart : DollarSign}
                id="execute-trade-btn"
              >
                {tradeType === 'BUY' ? 'Buy Now' : 'Sell Now'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
