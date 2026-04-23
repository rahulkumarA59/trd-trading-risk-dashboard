// API Base URL
export const API_BASE_URL = '/api';

// App Info
export const APP_NAME = 'TRD';
export const APP_FULL_NAME = 'Trading & Risk Dashboard';

// Trade Types
export const TRADE_TYPES = {
  BUY: 'BUY',
  SELL: 'SELL',
};

// Risk Levels
export const RISK_LEVELS = {
  LOW: { label: 'Low', color: 'green' },
  MEDIUM: { label: 'Medium', color: 'yellow' },
  MODERATE: { label: 'Moderate', color: 'yellow' },
  HIGH: { label: 'High', color: 'red' },
  CRITICAL: { label: 'Critical', color: 'red' },
};

// Prediction Trends
export const PREDICTION_TRENDS = {
  UP: { label: 'Bullish', color: 'green', icon: '↑' },
  DOWN: { label: 'Bearish', color: 'red', icon: '↓' },
  NEUTRAL: { label: 'Neutral', color: 'yellow', icon: '→' },
};

// Navigation Items
export const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { path: '/trading', label: 'Trading', icon: 'TrendingUp' },
  { path: '/portfolio', label: 'Portfolio', icon: 'Briefcase' },
  { path: '/risk-analysis', label: 'Risk Analysis', icon: 'Shield' },
  { path: '/prediction', label: 'Prediction', icon: 'Brain' },
  { path: '/transactions', label: 'Transactions', icon: 'Receipt' },
];

// Chart Colors
export const CHART_COLORS = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  cyan: '#06b6d4',
  grid: '#1e293b',
  text: '#94a3b8',
};
