import api from './api';

const riskService = {
  getRiskAnalysis: async () => {
    const response = await api.get('/risk');
    return response.data;
  },

  getRiskMetrics: async () => {
    return riskService.getRiskAnalysis();
  },

  getValueAtRisk: async (confidence = 95) => {
    const response = await riskService.getRiskAnalysis();

    if (confidence >= 99) {
      return response.var99;
    }
    if (confidence >= 95) {
      return response.var95;
    }
    return response.var90;
  },

  setRiskLimits: async (limits) => {
    return { message: 'Risk limits are not exposed by the current backend API.', limits };
  },
};

export default riskService;
