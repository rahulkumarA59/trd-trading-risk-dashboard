import React, { useEffect, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Brain,
  Clock,
  Search,
  Sparkles,
} from 'lucide-react';
import Card, { CardHeader, CardTitle } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { PageLoader } from '../components/common/Loader';
import ForecastChart from '../components/charts/ForecastChart';
import predictionService from '../services/predictionService';
import stockService from '../services/stockService';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate, formatDateTime } from '../utils/calculations';
import {
  buildForecastChartData,
  buildPredictionLeaderboard,
  toNumber,
} from '../utils/chartData';

export default function Prediction() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchSymbol, setSearchSymbol] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedPrediction, setSelectedPrediction] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const data = await predictionService.getPredictions();
        const predictionList = Array.isArray(data) ? data : [];
        setPredictions(predictionList);

        if (predictionList.length) {
          await handleSelectPrediction(predictionList[0], false);
        }
      } catch {
        setError('Unable to load prediction analytics from the backend.');
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();
  }, []);

  const handleSelectPrediction = async (prediction, updateSelection = true) => {
    try {
      const stock = await stockService.getStockBySymbol(prediction.stockSymbol);
      setSelectedStock(stock);
    } catch {
      setSelectedStock(null);
    }

    if (updateSelection) {
      setSelectedPrediction(prediction);
      return;
    }

    setSelectedPrediction(prediction);
  };

  const handleSearch = async (event) => {
    event.preventDefault();
    const symbol = searchSymbol.trim().toUpperCase();
    if (!symbol) {
      return;
    }

    setSearchLoading(true);
    setError('');

    try {
      const [prediction, stock] = await Promise.all([
        predictionService.getPrediction(symbol),
        stockService.getStockBySymbol(symbol).catch(() => null),
      ]);

      setSelectedPrediction(prediction);
      setSelectedStock(stock);
      setPredictions((current) => {
        const withoutSameSymbol = current.filter((item) => item.stockSymbol !== prediction.stockSymbol);
        return [prediction, ...withoutSameSymbol];
      });
    } catch {
      setError(`Unable to generate a prediction for ${symbol}. Check that the symbol exists and the backend prediction service is available.`);
    } finally {
      setSearchLoading(false);
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  const leaderboard = buildPredictionLeaderboard(predictions);
  const forecastData = buildForecastChartData(selectedStock, selectedPrediction);
  const selectedTrend = selectedPrediction?.trend ?? selectedPrediction?.predictionType ?? 'UP';
  const isUp = selectedTrend === 'UP';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Prediction</h1>
          <p className="mt-1 text-sm text-slate-400">Machine-learning forecasts driven by the live backend prediction pipeline.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-4 py-2 text-sm font-semibold text-violet-200">
          <Sparkles className="h-4 w-4" />
          Live ML Forecasts
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      <Card className="overflow-hidden border-slate-700/60 bg-[radial-gradient(circle_at_top_left,_rgba(167,139,250,0.12),_transparent_32%),linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(15,23,42,0.92),_rgba(30,41,59,0.95))]">
        <form onSubmit={handleSearch} className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
          <Input
            label="Search Stock Symbol"
            icon={Search}
            placeholder="Enter symbol, for example AAPL or MSFT"
            value={searchSymbol}
            onChange={(event) => setSearchSymbol(event.target.value)}
            id="prediction-search"
          />
          <div className="flex items-end">
            <Button type="submit" loading={searchLoading} icon={Brain} className="h-[46px] w-full md:w-auto" id="predict-btn">
              Generate Forecast
            </Button>
          </div>
        </form>

        {selectedPrediction ? (
          <div className="mt-6 rounded-2xl border border-slate-700/60 bg-slate-950/45 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-white">{selectedPrediction.stockSymbol}</h2>
                  <Badge variant={isUp ? 'success' : 'danger'} size="md" dot>
                    {isUp ? 'UP' : 'DOWN'}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-slate-400">{selectedPrediction.stockName}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                  Target date {formatDate(selectedPrediction.targetDate)}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-slate-900/80 px-4 py-3 text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Current</p>
                  <p className="mt-2 text-xl font-bold text-white">{formatCurrency(selectedPrediction.actualPrice)}</p>
                </div>
                <div className="rounded-2xl bg-slate-900/80 px-4 py-3 text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Predicted</p>
                  <p className={`mt-2 text-xl font-bold ${isUp ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {formatCurrency(selectedPrediction.predictedPrice)}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-900/80 px-4 py-3 text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Confidence</p>
                  <p className="mt-2 text-xl font-bold text-violet-200">{toNumber(selectedPrediction.confidence).toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.7fr_1fr]">
        <Card className="overflow-hidden border-slate-700/60 bg-slate-900/90">
          <CardHeader>
            <div>
              <CardTitle>Forecast Chart</CardTitle>
              <p className="mt-2 text-sm text-slate-500">Historical quote context plus the selected prediction target.</p>
            </div>
          </CardHeader>
          <ForecastChart data={forecastData} />
        </Card>

        <Card className="overflow-hidden border-slate-700/60 bg-slate-900/90">
          <CardHeader>
            <CardTitle>Top Predictions</CardTitle>
            <Brain className="h-4 w-4 text-violet-300" />
          </CardHeader>
          <div className="space-y-3">
            {leaderboard.length ? leaderboard.map((prediction) => {
              const rising = (prediction.trend ?? prediction.predictionType) === 'UP';

              return (
                <button
                  key={`${prediction.stockSymbol}-${prediction.predictionDate}`}
                  onClick={() => handleSelectPrediction(prediction)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors ${
                    selectedPrediction?.stockSymbol === prediction.stockSymbol
                      ? 'border-violet-400/40 bg-violet-400/10'
                      : 'border-slate-700/60 bg-slate-950/40 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{prediction.stockSymbol}</p>
                      <p className="mt-1 text-xs text-slate-500">{prediction.stockName}</p>
                    </div>
                    <Badge variant={rising ? 'success' : 'danger'} size="sm">
                      {rising ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {rising ? 'UP' : 'DOWN'}
                    </Badge>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-slate-400">Target</span>
                    <span className={`font-semibold ${rising ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {formatCurrency(prediction.predictedPrice)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                    <span>Confidence {toNumber(prediction.confidence).toFixed(0)}%</span>
                    <span>{formatDate(prediction.targetDate)}</span>
                  </div>
                </button>
              );
            }) : (
              <div className="rounded-2xl border border-dashed border-slate-700/70 bg-slate-950/35 px-4 py-10 text-center text-sm text-slate-500">
                No prediction history is available yet. Generate your first forecast above.
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden border-slate-700/60 bg-slate-900/90">
        <CardHeader>
          <CardTitle>Prediction History</CardTitle>
          <Badge variant="info" size="sm">{predictions.length} records</Badge>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                {['Stock', 'Predicted Price', 'Current Price', 'Trend', 'Confidence', 'Target Date', 'Created'].map((heading) => (
                  <th key={heading} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {predictions.length ? predictions.map((prediction) => {
                const rising = (prediction.trend ?? prediction.predictionType) === 'UP';

                return (
                  <tr
                    key={`${prediction.stockSymbol}-${prediction.predictionDate}-${prediction.createdAt}`}
                    className="cursor-pointer transition-colors hover:bg-slate-800/40"
                    onClick={() => handleSelectPrediction(prediction)}
                  >
                    <td className="px-4 py-3.5">
                      <div>
                        <p className="text-sm font-semibold text-white">{prediction.stockSymbol}</p>
                        <p className="text-xs text-slate-500">{prediction.stockName}</p>
                      </div>
                    </td>
                    <td className={`px-4 py-3.5 text-sm font-semibold ${rising ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {formatCurrency(prediction.predictedPrice)}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-300">{formatCurrency(prediction.actualPrice)}</td>
                    <td className="px-4 py-3.5">
                      <Badge variant={rising ? 'success' : 'danger'} size="sm" dot>
                        {rising ? 'Bullish' : 'Bearish'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-violet-200">{toNumber(prediction.confidence).toFixed(1)}%</td>
                    <td className="px-4 py-3.5 text-sm text-slate-400">{formatDate(prediction.targetDate)}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDateTime(prediction.createdAt || prediction.predictionDate)}
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-500">
                    No prediction records were returned by the backend.
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
