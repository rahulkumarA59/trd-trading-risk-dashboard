import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import Trading from '../pages/Trading';
import Stocks from '../pages/Stocks';
import Portfolio from '../pages/Portfolio';
import RiskAnalysis from '../pages/RiskAnalysis';
import Prediction from '../pages/Prediction';
import Transactions from '../pages/Transactions';
import NotFound from '../pages/NotFound';
import ProtectedRoute from '../components/common/ProtectedRoute';
import Sidebar from '../components/common/Sidebar';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';

function AppLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <Navbar />
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}

function ProtectedLayout({ children }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

export default function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
        <Route path="/trading" element={<ProtectedLayout><Trading /></ProtectedLayout>} />
        <Route path="/stocks" element={<ProtectedLayout><Stocks /></ProtectedLayout>} />
        <Route path="/portfolio" element={<ProtectedLayout><Portfolio /></ProtectedLayout>} />
        <Route path="/risk-analysis" element={<ProtectedLayout><RiskAnalysis /></ProtectedLayout>} />
        <Route path="/prediction" element={<ProtectedLayout><Prediction /></ProtectedLayout>} />
        <Route path="/transactions" element={<ProtectedLayout><Transactions /></ProtectedLayout>} />

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
