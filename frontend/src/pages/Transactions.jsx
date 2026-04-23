import React, { useState, useEffect } from 'react';
import { Receipt, Search, Calendar, ArrowUpRight, ArrowDownRight, Download } from 'lucide-react';
import Card, { CardHeader, CardTitle } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { PageLoader } from '../components/common/Loader';
import tradeService from '../services/tradeService';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDateTime } from '../utils/calculations';

const mockTx = [
  { id: 1, symbol: 'AAPL', tradeType: 'BUY', quantity: 50, price: 175.50, createdAt: '2024-01-15T10:30:00', status: 'COMPLETED' },
  { id: 2, symbol: 'GOOGL', tradeType: 'SELL', quantity: 25, price: 142.30, createdAt: '2024-01-14T14:20:00', status: 'COMPLETED' },
  { id: 3, symbol: 'MSFT', tradeType: 'BUY', quantity: 100, price: 380.20, createdAt: '2024-01-13T09:15:00', status: 'COMPLETED' },
  { id: 4, symbol: 'TSLA', tradeType: 'BUY', quantity: 30, price: 220.45, createdAt: '2024-01-12T11:45:00', status: 'COMPLETED' },
  { id: 5, symbol: 'NVDA', tradeType: 'SELL', quantity: 15, price: 540.80, createdAt: '2024-01-11T16:00:00', status: 'COMPLETED' },
  { id: 6, symbol: 'AMZN', tradeType: 'BUY', quantity: 40, price: 178.25, createdAt: '2024-01-10T13:30:00', status: 'COMPLETED' },
  { id: 7, symbol: 'META', tradeType: 'SELL', quantity: 20, price: 505.75, createdAt: '2024-01-09T10:00:00', status: 'COMPLETED' },
  { id: 8, symbol: 'JPM', tradeType: 'BUY', quantity: 35, price: 198.45, createdAt: '2024-01-08T15:20:00', status: 'COMPLETED' },
];

export default function Transactions() {
  const [transactions, setTransactions] = useState(mockTx);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await tradeService.getTrades();
        if (Array.isArray(data) && data.length > 0) setTransactions(data);
      } catch { /* mock */ }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return <PageLoader />;

  const filtered = transactions.filter(tx => {
    const ms = tx.symbol?.toLowerCase().includes(searchQuery.toLowerCase());
    const mt = filterType === 'ALL' || tx.tradeType === filterType;
    return ms && mt;
  });

  const buyVol = transactions.filter(t => t.tradeType === 'BUY').reduce((s, t) => s + t.price * t.quantity, 0);
  const sellVol = transactions.filter(t => t.tradeType === 'SELL').reduce((s, t) => s + t.price * t.quantity, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Transactions</h1>
          <p className="text-sm text-slate-400 mt-1">Complete history of all your trades</p>
        </div>
        <Button variant="outline" icon={Download} size="sm">Export CSV</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Trades', val: transactions.length, icon: Receipt, color: 'blue', valColor: 'text-white' },
          { label: 'Buy Volume', val: formatCurrency(buyVol), icon: ArrowUpRight, color: 'green', valColor: 'text-green-400' },
          { label: 'Sell Volume', val: formatCurrency(sellVol), icon: ArrowDownRight, color: 'red', valColor: 'text-red-400' },
        ].map((c, i) => {
          const Icon = c.icon;
          return (
            <Card key={i} className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl bg-${c.color}-400/10 flex items-center justify-center`}>
                <Icon className={`w-5 h-5 text-${c.color}-400`} />
              </div>
              <div>
                <p className="text-xs text-slate-400">{c.label}</p>
                <p className={`text-xl font-bold ${c.valColor}`}>{c.val}</p>
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <Badge variant="info" size="sm">{filtered.length} records</Badge>
        </CardHeader>

        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="flex-1">
            <Input icon={Search} placeholder="Search by symbol..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} id="transaction-search" />
          </div>
          <div className="flex gap-2">
            {['ALL', 'BUY', 'SELL'].map((type) => (
              <button key={type} onClick={() => setFilterType(type)}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                  filterType === type
                    ? type === 'BUY' ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : type === 'SELL' ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 border border-transparent'
                }`}>{type}</button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                {['Date', 'Symbol', 'Type', 'Quantity', 'Price', 'Total', 'Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {filtered.length > 0 ? filtered.map((tx) => {
                const isBuy = tx.tradeType === 'BUY';
                return (
                  <tr key={tx.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-4 py-3.5 text-sm text-slate-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />{formatDateTime(tx.createdAt)}
                    </td>
                    <td className="px-4 py-3.5 text-sm font-bold text-white">{tx.symbol}</td>
                    <td className="px-4 py-3.5">
                      <Badge variant={isBuy ? 'success' : 'danger'} size="sm">{tx.tradeType}</Badge>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-300">{tx.quantity}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-300">{formatCurrency(tx.price)}</td>
                    <td className="px-4 py-3.5 text-sm font-semibold text-white">{formatCurrency(tx.price * tx.quantity)}</td>
                    <td className="px-4 py-3.5"><Badge variant="info" size="sm">{tx.status || 'COMPLETED'}</Badge></td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={7} className="px-4 py-16 text-center text-slate-500">
                  <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No transactions found</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
