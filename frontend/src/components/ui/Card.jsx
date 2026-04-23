import React from 'react';

export default function Card({
  children,
  className = '',
  hover = true,
  gradient = false,
  padding = 'p-6',
  ...props
}) {
  return (
    <div
      className={`
        bg-slate-800 border border-slate-700/50 rounded-xl ${padding}
        ${hover ? 'hover:border-slate-600 hover:shadow-lg hover:shadow-slate-900/50 transition-all duration-300' : ''}
        ${gradient ? 'glass-card' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-sm font-semibold text-slate-400 uppercase tracking-wider ${className}`}>
      {children}
    </h3>
  );
}

export function CardValue({ children, className = '', positive, negative }) {
  const colorClass = positive ? 'text-green-400' : negative ? 'text-red-400' : 'text-white';
  return (
    <p className={`text-2xl font-bold mt-1 ${colorClass} ${className}`}>
      {children}
    </p>
  );
}
