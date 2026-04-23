import React from 'react';

export default function Loader({ size = 'md', text = 'Loading...' }) {
  const sizes = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="relative">
        <div className={`${sizes[size]} rounded-full border-slate-700 border-t-blue-400 animate-spin`} />
        <div className="absolute inset-0 rounded-full bg-blue-400/10 animate-pulse" />
      </div>
      {text && <p className="text-sm text-slate-400 animate-pulse">{text}</p>}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader size="lg" text="Loading data..." />
    </div>
  );
}

export function InlineLoader() {
  return (
    <div className="flex items-center gap-2 text-slate-400">
      <div className="w-4 h-4 rounded-full border-2 border-slate-700 border-t-blue-400 animate-spin" />
      <span className="text-sm">Loading...</span>
    </div>
  );
}
