import api from './api';

const normalizePredictionType = (predictionType, predictedPrice, actualPrice) => {
  if (predictionType === 'BULLISH') return 'UP';
  if (predictionType === 'BEARISH') return 'DOWN';
  if (predictionType === 'UP' || predictionType === 'DOWN') return predictionType;

  return Number(predictedPrice) >= Number(actualPrice) ? 'UP' : 'DOWN';
};

const mapPrediction = (prediction, currentPrice) => {
  const actualPrice = prediction.actualPrice ?? currentPrice ?? prediction.predictedPrice;
  const trend = prediction.trend ?? normalizePredictionType(prediction.predictionType, prediction.predictedPrice, actualPrice);

  return {
    ...prediction,
    actualPrice,
    predictionType: trend,
    trend,
  };
};

const predictionService = {
  getPredictions: async () => {
    const response = await api.get('/predictions');
    return Array.isArray(response.data)
      ? response.data.map((prediction) => mapPrediction(prediction))
      : [];
  },

  getPrediction: async (symbol) => {
    const stockResponse = await api.get(`/stocks/symbol/${symbol}`);
    const predictionResponse = await api.post(`/predictions/stock/${stockResponse.data.id}`, null, {
      params: { daysAhead: 30 },
    });

    return mapPrediction(predictionResponse.data, stockResponse.data.currentPrice);
  },

  trainModel: async () => {
    return { message: 'Model training is not exposed by the current backend API.' };
  },
};

export default predictionService;
