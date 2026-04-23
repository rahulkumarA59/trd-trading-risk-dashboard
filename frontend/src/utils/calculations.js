/**
 * Calculate percentage change between two values
 */
export const calculatePercentageChange = (oldValue, newValue) => {
  if (!oldValue || oldValue === 0) return newValue > 0 ? 100 : 0;
  return ((newValue - oldValue) / Math.abs(oldValue)) * 100;
};

/**
 * Calculate profit/loss
 */
export const calculateProfitLoss = (invested, currentValue) => {
  return currentValue - invested;
};

/**
 * Calculate portfolio total
 */
export const calculatePortfolioTotal = (holdings) => {
  if (!holdings || !holdings.length) return { totalInvested: 0, currentValue: 0, profitLoss: 0 };
  
  const totalInvested = holdings.reduce((sum, h) => sum + (h.averagePrice * h.quantity), 0);
  const currentValue = holdings.reduce((sum, h) => sum + (h.currentValue || 0), 0);
  const profitLoss = currentValue - totalInvested;
  
  return { totalInvested, currentValue, profitLoss };
};

/**
 * Format percentage with sign
 */
export const formatPercentage = (value, decimals = 2) => {
  if (value === null || value === undefined || isNaN(value)) return '0.00%';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${Number(value).toFixed(decimals)}%`;
};

/**
 * Format date string
 */
export const formatDate = (date) => {
  if (!date) return '-';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
};

/**
 * Format datetime string
 */
export const formatDateTime = (date) => {
  if (!date) return '-';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

/**
 * Get risk level color class
 */
export const getRiskColor = (level) => {
  const colors = {
    LOW: 'text-green-400',
    MEDIUM: 'text-yellow-400',
    MODERATE: 'text-yellow-400',
    HIGH: 'text-red-400',
    CRITICAL: 'text-red-500',
  };
  return colors[level?.toUpperCase()] || 'text-gray-400';
};

/**
 * Get risk level bg class
 */
export const getRiskBgColor = (level) => {
  const colors = {
    LOW: 'bg-green-400/10 text-green-400 border-green-400/20',
    MEDIUM: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
    MODERATE: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
    HIGH: 'bg-red-400/10 text-red-400 border-red-400/20',
    CRITICAL: 'bg-red-500/10 text-red-500 border-red-500/20',
  };
  return colors[level?.toUpperCase()] || 'bg-gray-400/10 text-gray-400 border-gray-400/20';
};

/**
 * Debounce function
 */
export const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Clamp number between min and max
 */
export const clamp = (num, min, max) => Math.min(Math.max(num, min), max);
