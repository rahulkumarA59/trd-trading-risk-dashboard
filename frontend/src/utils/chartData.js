const CHART_PALETTE = [
  '#38bdf8',
  '#818cf8',
  '#f59e0b',
  '#10b981',
  '#f43f5e',
  '#14b8a6',
  '#fb7185',
  '#a78bfa',
];

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
});

const monthFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
});

export const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toDate = (value) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
};

export const getChartPalette = () => CHART_PALETTE;

export const buildAllocationChartData = (holdings) => {
  const totalValue = (holdings || []).reduce((sum, holding) => sum + toNumber(holding.currentValue), 0);

  return (holdings || [])
    .filter((holding) => toNumber(holding.currentValue) > 0)
    .map((holding, index) => {
      const value = toNumber(holding.currentValue);

      return {
        symbol: holding.stockSymbol,
        name: holding.stockName,
        value,
        invested: toNumber(holding.totalInvested),
        percentage: totalValue ? (value / totalValue) * 100 : 0,
        color: CHART_PALETTE[index % CHART_PALETTE.length],
      };
    });
};

export const buildPortfolioGrowthData = (trades, stocks) => {
  const sortedTrades = [...(trades || [])]
    .filter((trade) => trade?.createdAt)
    .sort((left, right) => new Date(left.createdAt) - new Date(right.createdAt));

  if (!sortedTrades.length) {
    return [];
  }

  const livePriceBySymbol = Object.fromEntries(
    (stocks || []).map((stock) => [stock.symbol, toNumber(stock.currentPrice)])
  );

  const latestTradePriceBySymbol = {};
  const positions = new Map();
  const snapshots = new Map();
  let investedCapital = 0;

  sortedTrades.forEach((trade, index) => {
    const symbol = trade.symbol ?? trade.stockSymbol;
    const quantity = toNumber(trade.quantity);
    const price = toNumber(trade.price);
    const total = toNumber(trade.total ?? trade.totalAmount);
    const direction = trade.tradeType === 'SELL' ? -1 : 1;
    const currentPosition = positions.get(symbol) ?? 0;

    positions.set(symbol, currentPosition + (direction * quantity));
    latestTradePriceBySymbol[symbol] = price || latestTradePriceBySymbol[symbol] || 0;
    investedCapital += direction * total;

    const portfolioValue = Array.from(positions.entries()).reduce((sum, [trackedSymbol, trackedQuantity]) => {
      if (trackedQuantity <= 0) {
        return sum;
      }

      const currentPrice = livePriceBySymbol[trackedSymbol] || latestTradePriceBySymbol[trackedSymbol] || 0;
      return sum + (trackedQuantity * currentPrice);
    }, 0);

    const tradeDate = toDate(trade.createdAt);
    if (!tradeDate) {
      return;
    }

    const snapshotKey = tradeDate.toISOString().slice(0, 10);
    snapshots.set(snapshotKey, {
      date: snapshotKey,
      label: dateFormatter.format(tradeDate),
      month: monthFormatter.format(tradeDate),
      invested: Math.max(investedCapital, 0),
      value: portfolioValue,
      trades: index + 1,
    });
  });

  return Array.from(snapshots.values());
};

export const filterTimelineByPeriod = (timeline, period) => {
  if (!timeline.length || period === 'ALL') {
    return timeline;
  }

  const latestDate = toDate(timeline[timeline.length - 1]?.date);
  if (!latestDate) {
    return timeline;
  }

  const lookbackDays = {
    '7D': 7,
    '30D': 30,
    '90D': 90,
    '1Y': 365,
  }[period];

  if (!lookbackDays) {
    return timeline;
  }

  const threshold = new Date(latestDate);
  threshold.setDate(threshold.getDate() - lookbackDays);

  return timeline.filter((point) => {
    const pointDate = toDate(point.date);
    return pointDate ? pointDate >= threshold : false;
  });
};

export const buildPerformanceComparisonData = (holdings) => (
  [...(holdings || [])]
    .map((holding, index) => ({
      symbol: holding.stockSymbol,
      name: holding.stockName,
      invested: toNumber(holding.totalInvested),
      currentValue: toNumber(holding.currentValue),
      profitLoss: toNumber(holding.profitLoss),
      color: CHART_PALETTE[index % CHART_PALETTE.length],
    }))
    .sort((left, right) => right.currentValue - left.currentValue)
);

export const buildPnLChartData = (holdings) => (
  [...(holdings || [])]
    .map((holding) => ({
      symbol: holding.stockSymbol,
      name: holding.stockName,
      profitLoss: toNumber(holding.profitLoss),
      profitLossPercentage: toNumber(holding.profitLossPercentage),
      fill: toNumber(holding.profitLoss) >= 0 ? '#10b981' : '#f43f5e',
    }))
    .sort((left, right) => Math.abs(right.profitLoss) - Math.abs(left.profitLoss))
);

export const buildVolatilityChartData = (holdings) => (
  [...(holdings || [])]
    .map((holding, index) => {
      const quantity = toNumber(holding.quantity);
      const averagePrice = toNumber(holding.averagePrice);
      const currentValue = toNumber(holding.currentValue);
      const currentPrice = quantity ? currentValue / quantity : 0;
      const volatility = averagePrice ? Math.abs(((currentPrice - averagePrice) / averagePrice) * 100) : 0;

      return {
        symbol: holding.stockSymbol,
        currentPrice,
        averagePrice,
        volatility,
        fill: CHART_PALETTE[index % CHART_PALETTE.length],
      };
    })
    .sort((left, right) => right.volatility - left.volatility)
);

export const buildForecastChartData = (stock, prediction) => {
  if (!prediction) {
    return [];
  }

  const previousPrice = toNumber(stock?.previousPrice);
  const currentPrice = toNumber(stock?.currentPrice || prediction.actualPrice);
  const predictedPrice = toNumber(prediction.predictedPrice);
  const targetDate = toDate(prediction.targetDate);

  const series = [];

  if (previousPrice > 0) {
    series.push({
      label: 'Previous',
      actual: previousPrice,
      predicted: null,
    });
  }

  series.push({
    label: 'Current',
    actual: currentPrice,
    predicted: currentPrice,
  });

  if (predictedPrice > 0) {
    series.push({
      label: targetDate ? dateFormatter.format(targetDate) : 'Target',
      actual: null,
      predicted: predictedPrice,
    });
  }

  return series;
};

export const buildPredictionLeaderboard = (predictions) => (
  [...(predictions || [])]
    .sort((left, right) => toNumber(right.confidence) - toNumber(left.confidence))
    .slice(0, 5)
);
