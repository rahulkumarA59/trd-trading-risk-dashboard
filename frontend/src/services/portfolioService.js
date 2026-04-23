import api from './api';

const buildPortfolioSummary = (holdings) => {
  const list = Array.isArray(holdings) ? holdings : [];
  const totalInvested = list.reduce((sum, holding) => sum + (Number(holding.totalInvested) || 0), 0);
  const currentValue = list.reduce((sum, holding) => sum + (Number(holding.currentValue) || 0), 0);
  const profitLoss = currentValue - totalInvested;

  return {
    holdings: list,
    totalInvested,
    currentValue,
    profitLoss,
    profitLossPercentage: totalInvested ? (profitLoss / totalInvested) * 100 : 0,
  };
};

const portfolioService = {
  getPortfolio: async () => {
    const response = await api.get('/portfolio');
    return response.data;
  },

  getHoldings: async () => {
    return portfolioService.getPortfolio();
  },

  getPerformance: async () => {
    const holdings = await portfolioService.getPortfolio();
    return buildPortfolioSummary(holdings);
  },

  getSummary: async () => {
    const holdings = await portfolioService.getPortfolio();
    return buildPortfolioSummary(holdings);
  },
};

export default portfolioService;
