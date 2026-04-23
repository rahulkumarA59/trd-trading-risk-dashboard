import api from './api';

const mapTrade = (trade) => ({
  ...trade,
  symbol: trade.symbol ?? trade.stockSymbol,
  total: trade.total ?? trade.totalAmount,
});

const tradeService = {
  getStocks: async () => {
    const response = await api.get('/stocks');
    return response.data;
  },

  executeTrade: async (tradeData) => {
    const response = await api.post('/trades', tradeData);
    return mapTrade(response.data);
  },

  getTrades: async () => {
    const response = await api.get('/trades');
    return Array.isArray(response.data) ? response.data.map(mapTrade) : [];
  },

  getTradeById: async (id) => {
    const trades = await tradeService.getTrades();
    return trades.find((trade) => trade.id === id) || null;
  },

  cancelTrade: async (id) => {
    return { message: 'Trade cancellation is not exposed by the current backend API.', id };
  },
};

export default tradeService;
