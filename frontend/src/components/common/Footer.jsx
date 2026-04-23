import React from 'react';
import { Activity } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 px-6 py-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-blue-400" />
          <span>© {new Date().getFullYear()} TRD — Trading & Risk Dashboard</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          <span>All systems operational</span>
        </div>
      </div>
    </footer>
  );
}
