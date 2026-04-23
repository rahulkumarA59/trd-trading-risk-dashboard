import React, { useEffect, useState, useMemo } from 'react';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  DollarSign,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
  Eye,
  Zap,
} from 'lucide-react';
import Card, { CardHeader, CardTitle } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { PageLoader } from '../components/common/Loader';
import StockCard from '../components/stocks/StockCard';
import stockService from '../services/stockService';
import tradeService from '../services/tradeService';
import { formatCurrency, formatCompactCurrency } from '../utils/formatCurrency';
import { formatDateTime } from '../utils/calculations';
import toast from 'react-hot-toast';

const getChangePercent = (current, previous) => {
  const currentValue = Number(current) || 0;
  const previousValue = Number(previous) || 0;
  if (!previousValue) return 0;
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

export default function Stocks() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncingSymbol, setSyncingSymbol] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState(null);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeType, setTradeType] = useState('BUY');
  const [quantity, setQuantity] = useState('');
  const [tradeLoading, setTradeLoading] = useState(false);
  const [sortBy, setSortBy] = useState('symbol'); // symbol, price, change, volume
  const [filterSector, setFilterSector] = useState('ALL');

  const loadStocks = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);

    try {
      const data = await stockService.getStocks();
      if (Array.isArray(data) && data.length > 0) {
        setStocks(data);
      } else {
        toast.error('No stocks available');
      }
    } catch (err) {
      toast.error('Failed to load stocks');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadStocks();

    const intervalId = setInterval(() => {
      loadStocks({ silent: true });
    }, 60000);

    return () => clearInterval(intervalId);
  }, []);

  const filteredAndSortedStocks = useMemo(() => {
    let filtered = stocks.filter((stock) =>
      (stock.symbol?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.name?.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (filterSector === 'ALL' || stock.sector === filterSector)
    );

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return (Number(b.currentPrice) || 0) - (Number(a.currentPrice) || 0);
        case 'change':
          const changeA = getChangePercent(a.currentPrice, a.previousPrice);
          const changeB = getChangePercent(b.currentPrice, b.previousPrice);
          return changeB - changeA;
        case 'volume':
          return (Number(b.volume) || 0) - (Number(a.volume) || 0);
        case 'symbol':
        default:
          return (a.symbol || '').localeCompare(b.symbol || '');
      }
    });
  }, [stocks, searchQuery, sortBy, filterSector]);

  const sectors = useMemo(
    () => ['ALL', ...new Set(stocks.map((s) => s.sector).filter(Boolean))],
    [stocks]
  );

  const stats = useMemo(() => {
    const gainers = stocks.filter((s) => getChangePercent(s.currentPrice, s.previousPrice) >= 0).length;
    const losers = stocks.length - gainers;
    const topGainer = stocks.reduce((max, stock) => {
      const change = getChangePercent(stock.currentPrice, stock.previousPrice);
      const maxChange = getChangePercent(max.currentPrice, max.previousPrice);
      return change > maxChange ? stock : max;
    }, stocks[0]);
    const topLoser = stocks.reduce((min, stock) => {
      const change = getChangePercent(stock.currentPrice, stock.previousPrice);
      const minChange = getChangePercent(min.currentPrice, min.previousPrice);
      return change < minChange ? stock : min;
    }, stocks[0]);

    return { gainers, losers, topGainer, topLoser };
  }, [stocks]);

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
      setShowTradeModal(false);
      setQuantity('');
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
      toast.success('All stock prices refreshed');
    } catch {
      toast.error('Failed to refresh prices');
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefreshSymbol = async (symbol) => {
    setSyncingSymbol(symbol);
    try {
      await stockService.refreshStockPrice(symbol);
      await loadStocks({ silent: true });
      toast.success(`${symbol} price synced`);
    } catch {
      toast.error(`Failed to sync ${symbol}`);
    } finally {
      setSyncingSymbol('');
    }
  };

  const openTradeModal = (stock, type) => {
    setSelectedStock(stock);
    setTradeType(type);
    setQuantity('');
    setShowTradeModal(true);
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Stock Market</h1>
        <p className="mt-2 text-slate-400">
          Live quotes for {stocks.length} tracked stocks with real-time price updates
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-slate-700/60 bg-slate-900/90">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Total Stocks
              </p>
              <p className="mt-3 text-3xl font-bold text-white">{stocks.length}</p>
              <p className="mt-2 text-sm text-slate-400">Tracked symbols</p>
            </div>
            <div className="rounded-2xl bg-sky-400/10 p-3 text-sky-300">
              <Activity className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="border-slate-700/60 bg-slate-900/90">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Gainers
              </p>
              <p className="mt-3 text-3xl font-bold text-emerald-300">{stats.gainers}</p>
              <p className="mt-2 text-sm text-slate-400">Trading higher</p>
            </div>
            <div className="rounded-2xl bg-emerald-400/10 p-3 text-emerald-300">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="border-slate-700/60 bg-slate-900/90">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Losers
              </p>
              <p className="mt-3 text-3xl font-bold text-rose-300">{stats.losers}</p>
              <p className="mt-2 text-sm text-slate-400">Trading lower</p>
            </div>
            <div className="rounded-2xl bg-rose-400/10 p-3 text-rose-300">
              <TrendingDown className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="border-slate-700/60 bg-slate-900/90">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Sectors
              </p>
              <p className="mt-3 text-3xl font-bold text-amber-300">{sectors.length - 1}</p>
              <p className="mt-2 text-sm text-slate-400">Sector coverage</p>
            </div>
            <div className="rounded-2xl bg-amber-400/10 p-3 text-amber-300">
              <BarChart3 className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Top Movers */}
      {stats.topGainer && stats.topLoser && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="overflow-hidden border-emerald-600/40 bg-gradient-to-br from-emerald-950/40 via-slate-900/80 to-slate-900/90">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                  Top Gainer
                </p>
                <div className="mt-3">
                  <p className="text-2xl font-bold text-white">{stats.topGainer.symbol}</p>
                  <p className="mt-1 text-sm text-slate-400">{stats.topGainer.name}</p>
                </div>
                <p className="mt-3 text-3xl font-bold text-emerald-300">
                  {(getChangePercent(stats.topGainer.currentPrice, stats.topGainer.previousPrice).toFixed(2))}%
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  {formatCurrency(stats.topGainer.currentPrice)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-emerald-300 opacity-20" />
            </div>
          </Card>

          <Card className="overflow-hidden border-rose-600/40 bg-gradient-to-br from-rose-950/40 via-slate-900/80 to-slate-900/90">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-300">
                  Top Loser
                </p>
                <div className="mt-3">
                  <p className="text-2xl font-bold text-white">{stats.topLoser.symbol}</p>
                  <p className="mt-1 text-sm text-slate-400">{stats.topLoser.name}</p>
                </div>
                <p className="mt-3 text-3xl font-bold text-rose-300">
                  {(getChangePercent(stats.topLoser.currentPrice, stats.topLoser.previousPrice).toFixed(2))}%
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  {formatCurrency(stats.topLoser.currentPrice)}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-rose-300 opacity-20" />
            </div>
          </Card>
        </div>
      )}

      {/* Controls */}
      <Card className="border-slate-700/60 bg-slate-900/90">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <Input
                icon={Search}
                placeholder="Search by symbol or company name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                id="stock-search"
              />
            </div>
            <Button
              variant="outline"
              size="md"
              icon={RefreshCw}
              loading={refreshing}
              onClick={handleRefreshAll}
              className="border-slate-600/80 bg-slate-900/60 text-slate-100 hover:border-sky-400/50 hover:bg-sky-400/10"
            >
              Refresh All
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-400">Sector:</span>
              <div className="flex gap-2 flex-wrap">
                {sectors.map((sector) => (
                  <button
                    key={sector}
                    onClick={() => setFilterSector(sector)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                      filterSector === sector
                        ? 'bg-sky-500 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {sector}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs font-medium text-slate-400">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-300 hover:border-slate-500"
              >
                <option value="symbol">Symbol</option>
                <option value="price">Price</option>
                <option value="change">Change %</option>
                <option value="volume">Volume</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Stocks Grid */}
      {filteredAndSortedStocks.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredAndSortedStocks.map((stock) => (
            <StockCard
              key={stock.symbol}
              stock={stock}
              loading={syncingSymbol === stock.symbol}
              onRefresh={() => handleRefreshSymbol(stock.symbol)}
              onBuy={() => openTradeModal(stock, 'BUY')}
              onSell={() => openTradeModal(stock, 'SELL')}
            />
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-slate-700/70 bg-slate-950/30">
          <div className="py-12 text-center">
            <Eye className="mx-auto h-10 w-10 text-slate-600 opacity-50" />
            <p className="mt-3 text-slate-500">No stocks found matching your filters</p>
          </div>
        </Card>
      )}

      {/* Trade Modal */}
      <Modal
        isOpen={showTradeModal}
        onClose={() => setShowTradeModal(false)}
        title={`${tradeType} ${selectedStock?.symbol || ''}`}
      >
        {selectedStock && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-lg font-bold text-white">{selectedStock.symbol}</p>
                  <p className="text-sm text-slate-400">{selectedStock.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">{formatCurrency(selectedStock.currentPrice)}</p>
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
                  className={`rounded-xl py-2.5 text-sm font-semibold transition-all ${
                    tradeType === type
                      ? type === 'BUY'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-rose-500 text-white'
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
              placeholder="Enter shares"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
              id="trade-quantity"
            />

            {quantity && parseInt(quantity, 10) > 0 && (
              <div className="space-y-2 rounded-2xl border border-slate-700/60 bg-slate-900/60 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Price per share</span>
                  <span className="font-medium text-white">{formatCurrency(selectedStock.currentPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Quantity</span>
                  <span className="font-medium text-white">{quantity}</span>
                </div>
                <div className="border-t border-slate-700 pt-3 mt-2">
                  <div className="flex justify-between">
                    <span className="font-medium text-slate-300">Total</span>
                    <span className="text-lg font-bold text-white">
                      {formatCurrency(selectedStock.currentPrice * parseInt(quantity, 10))}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="secondary" className="flex-1" onClick={() => setShowTradeModal(false)}>
                Cancel
              </Button>
              <Button
                variant={tradeType === 'BUY' ? 'success' : 'danger'}
                className="flex-1"
                loading={tradeLoading}
                onClick={handleTrade}
              >
                {tradeType === 'BUY' ? 'Buy' : 'Sell'} Now
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

