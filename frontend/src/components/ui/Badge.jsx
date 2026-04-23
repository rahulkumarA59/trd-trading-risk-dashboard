import React from 'react';

const variants = {
  success: 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20',
  danger: 'bg-red-400/10 text-red-400 border border-red-400/20',
  warning: 'bg-amber-400/10 text-amber-400 border border-amber-400/20',
  info: 'bg-blue-400/10 text-blue-400 border border-blue-400/20',
  neutral: 'bg-slate-600/30 text-slate-300 border border-slate-500/20',
};

const sizes = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

export default function Badge({
  children,
  variant = 'info',
  size = 'md',
  dot = false,
  className = '',
}) {
  return (
    <span className={`
      inline-flex items-center gap-1.5 font-semibold rounded-lg uppercase tracking-wide
      ${variants[variant]}
      ${sizes[size]}
      ${className}
    `}>
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full bg-current animate-pulse`} />
      )}
      {children}
    </span>
  );
}
