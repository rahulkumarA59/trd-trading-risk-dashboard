import React from 'react';
import { ArrowDownRight, ArrowUpRight, TrendingDown, TrendingUp, RefreshCw } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDateTime } from '../../utils/calculations';

const getChangePercent = (current, previous) => {
  const currentValue = Number(current) || 0;
  const previousValue = Number(previous) || 0;
  if (!previousValue) return 0;
  return ((currentValue - previousValue) / previousValue) * 100;
};

export default function StockCard({ stock, onRefresh, loading, onBuy, onSell }) {
  const change = getChangePercent(stock.currentPrice, stock.previousPrice);
  const isPositive = change >= 0;

  return (
    <Card className="group relative overflow-hidden border-slate-700/60 bg-slate-900/90 transition-all duration-300 hover:border-slate-600 hover:shadow-lg hover:shadow-slate-900/50">
      <div className="flex items-start justify-between gap-4">
        {/* Left Section - Stock Info */}
        <div className="flex-1 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-white">{stock.symbol}</h3>
              <p className="mt-1 line-clamp-1 text-sm text-slate-400">{stock.name}</p>
            </div>
            <Badge
              variant={isPositive ? 'success' : 'danger'}
              size="sm"
              className="whitespace-nowrap"
            >
              {isPositive ? '+' : ''}{change.toFixed(2)}%
            </Badge>
          </div>

          <div className="space-y-1">
            <p className="text-2xl font-bold text-white">{formatCurrency(stock.currentPrice)}</p>
            <p className="text-xs text-slate-500">
              {isPositive ? 'Prev: ' : 'Prev: '}
              <span className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                {formatCurrency(stock.previousPrice)}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            {isPositive ? (
              <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                <ArrowUpRight className="h-3.5 w-3.5" />
                <span>Momentum positive</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-rose-400 text-xs font-semibold">
                <ArrowDownRight className="h-3.5 w-3.5" />
                <span>Momentum negative</span>
              </div>
            )}
          </div>

          {stock.sector && (
            <Badge variant="neutral" size="sm" className="text-xs">
              {stock.sector}
            </Badge>
          )}

          <p className="text-xs text-slate-500 pt-1">
            Updated {stock.updatedAt ? formatDateTime(stock.updatedAt) : 'pending sync'}
          </p>
        </div>

        {/* Right Section - Icon and Actions */}
        <div className="flex flex-col items-end gap-3">
          <div className={`rounded-2xl p-3 ${isPositive ? 'bg-emerald-400/10 text-emerald-300' : 'bg-rose-400/10 text-rose-300'}`}>
            {isPositive ? (
              <TrendingUp className="h-5 w-5" />
            ) : (
              <TrendingDown className="h-5 w-5" />
            )}
          </div>

          <div className="flex flex-col gap-2 w-full min-w-[100px]">
            <Button
              size="sm"
              variant="outline"
              className="border-slate-600/80 bg-slate-950/30 text-slate-200 hover:border-sky-400/40 hover:bg-sky-400/10 text-xs"
              icon={RefreshCw}
              loading={loading}
              onClick={onRefresh}
            >
              Sync
            </Button>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="success"
                className="flex-1 text-xs"
                onClick={onBuy}
              >
                Buy
              </Button>
              <Button
                size="sm"
                variant="danger"
                className="flex-1 text-xs"
                onClick={onSell}
              >
                Sell
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

