import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  BarChart3,
  Briefcase,
  Shield,
  Brain,
  Receipt,
  ChevronLeft,
  ChevronRight,
  Activity,
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/trading', label: 'Trading', icon: TrendingUp },
  { path: '/stocks', label: 'Markets', icon: BarChart3 },
  { path: '/portfolio', label: 'Portfolio', icon: Briefcase },
  { path: '/risk-analysis', label: 'Risk Analysis', icon: Shield },
  { path: '/prediction', label: 'Prediction', icon: Brain },
  { path: '/transactions', label: 'Transactions', icon: Receipt },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      <div className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm hidden" />
      
      <aside className={`
        fixed left-0 top-0 h-screen z-50
        bg-slate-900 border-r border-slate-800
        flex flex-col
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-[72px]' : 'w-64'}
        hidden md:flex
      `}>
        {/* Logo */}
        <div className={`
          flex items-center gap-3 px-5 h-16 border-b border-slate-800
          ${collapsed ? 'justify-center' : ''}
        `}>
          <div className="relative">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-slate-900" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="text-lg font-bold text-white tracking-tight">TRD</h1>
              <p className="text-[10px] text-slate-500 font-medium -mt-0.5">Trading & Risk</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {!collapsed && (
            <p className="px-3 mb-3 text-[10px] font-semibold text-slate-600 uppercase tracking-widest">
              Navigation
            </p>
          )}
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`
                  group flex items-center gap-3 px-3 py-2.5 rounded-xl
                  transition-all duration-200 relative
                  ${isActive
                    ? 'bg-blue-500/10 text-blue-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }
                  ${collapsed ? 'justify-center' : ''}
                `}
                title={collapsed ? item.label : ''}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-400 rounded-r-full" />
                )}
                <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${!isActive ? 'group-hover:scale-110' : ''}`} />
                {!collapsed && (
                  <span className="text-sm font-medium animate-fade-in">{item.label}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Collapse Toggle */}
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl
              text-slate-500 hover:text-white hover:bg-slate-800 transition-all duration-200"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {!collapsed && <span className="text-xs font-medium">Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Spacer div to push content */}
      <div className={`hidden md:block flex-shrink-0 transition-all duration-300 ${collapsed ? 'w-[72px]' : 'w-64'}`} />
    </>
  );
}
