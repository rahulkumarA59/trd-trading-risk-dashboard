import api from './api';

const parseMessagePayload = (payload) => {
  if (typeof payload !== 'string') {
    return payload;
  }

  try {
    return JSON.parse(payload);
  } catch {
    return { message: payload };
  }
};

const stockService = {
  getStocks: async () => {
    const response = await api.get('/stocks');
    return Array.isArray(response.data) ? response.data : [];
  },

  getStockBySymbol: async (symbol) => {
    const response = await api.get(`/stocks/symbol/${symbol}`);
    return response.data;
  },

  refreshStockPrice: async (symbol) => {
    const response = await api.get(`/stocks/update-price/${symbol}`);
    return response.data;
  },

  refreshAllStocks: async () => {
    const response = await api.post('/stocks/update-all-prices');
    return parseMessagePayload(response.data);
  },
};

export default stockService;
