import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  User, Lock, Mail, Activity, ArrowRight, Eye, EyeOff,
  CheckCircle, TrendingUp, Shield, Zap, Sparkles,
} from 'lucide-react';

export default function Register() {
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.username.trim() || !formData.email.trim() || !formData.password.trim()) {
      return setError('Please fill in all fields');
    }
    if (formData.password.length < 6) {
      return setError('Password must be at least 6 characters');
    }
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }
    setLoading(true);
    try {
      await register({ username: formData.username, email: formData.email, password: formData.password });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    'Real-time portfolio tracking & analytics',
    'AI-powered stock price predictions',
    'Advanced risk analysis with VaR metrics',
    'Comprehensive trade history & reporting',
  ];
  const authInputClassName = 'auth-input';
  const passwordInputClassName = 'auth-input with-action';

  return (
    <div className="min-h-screen bg-[#070C18] flex relative overflow-hidden">

      {/* ── Background Blobs ── */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute w-[600px] h-[600px] -top-48 -right-48 rounded-full opacity-20 animate-pulse"
          style={{ background: 'radial-gradient(circle, #8B5CF6 0%, transparent 70%)', animationDuration: '8s' }} />
        <div className="absolute w-[500px] h-[500px] -bottom-48 -left-48 rounded-full opacity-15 animate-pulse"
          style={{ background: 'radial-gradient(circle, #3B82F6 0%, transparent 70%)', animationDuration: '10s' }} />
        <div className="absolute w-[400px] h-[400px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-10 animate-pulse"
          style={{ background: 'radial-gradient(circle, #06B6D4 0%, transparent 70%)', animationDuration: '12s' }} />
      </div>

      {/* Grid */}
      <div className="absolute inset-0 opacity-[0.025] pointer-events-none z-0"
        style={{
          backgroundImage: `linear-gradient(rgba(59,130,246,0.4) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(59,130,246,0.4) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }} />

      {/* ═══ LEFT — Branding ═══ */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 via-transparent to-blue-600/5" />

        <div className="relative z-10 flex flex-col justify-center w-full max-w-lg mx-auto px-10 xl:px-6">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10 group">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
              <div className="relative w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform duration-300">
                <Activity className="w-8 h-8 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">TRD</h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-[0.2em] uppercase">Trading & Risk Dashboard</p>
            </div>
          </div>

          {/* Hero */}
          <div className="space-y-4 mb-10">
            <h2 className="text-5xl xl:text-6xl font-bold text-white leading-[1.1]">
              Start Your
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 animate-gradient">
                Trading Journey.
              </span>
            </h2>
            <p className="text-slate-400 text-lg max-w-md leading-relaxed">
              Join thousands of traders who trust TRD for smarter investment decisions.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3.5 mb-12">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-3" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="w-6 h-6 rounded-full bg-green-400/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                </div>
                <span className="text-sm text-slate-300">{f}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="flex gap-4">
            {[
              { label: 'Active Traders', value: '12.5K+', change: '+12%', icon: TrendingUp },
              { label: 'Daily Volume',   value: '$2.4M',  change: '+8%',  icon: Activity   },
              { label: 'AI Accuracy',    value: '94.2%',  change: '+2.1%',icon: Sparkles   },
            ].map((s, i) => (
              <div key={i} className="bg-slate-800/20 backdrop-blur-sm border border-slate-700/30 rounded-2xl px-5 py-4 hover:bg-slate-800/40 hover:border-slate-600/50 transition-all duration-300 cursor-default group">
                <div className="flex items-center justify-between mb-2">
                  <s.icon className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
                  <span className="text-xs text-green-400 font-medium">{s.change}</span>
                </div>
                <p className="text-2xl font-bold text-white font-mono tracking-tight">{s.value}</p>
                <p className="text-xs text-slate-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ RIGHT — Register Form ═══ */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-[420px] relative">

          {/* Glow */}
          <div className="absolute -inset-px bg-gradient-to-r from-purple-500/30 to-blue-500/30 rounded-2xl blur-2xl opacity-60" />

          {/* Card */}
          <div className="relative bg-[#0D1526]/80 backdrop-blur-2xl border border-slate-700/60 rounded-2xl shadow-[0_32px_64px_rgba(0,0,0,0.6)] p-8">

            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500 rounded-xl blur-lg opacity-50" />
                <div className="relative w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center">
                  <Activity className="w-7 h-7 text-white" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-white">TRD</h1>
            </div>

            {/* Heading */}
            <div className="mb-7">
              <h2 className="text-3xl font-bold text-white mb-1">Create account</h2>
              <p className="text-slate-500 text-sm">Start your trading journey today</p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 flex items-center gap-2 animate-slideUp">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 tracking-wide uppercase">Username</label>
                <div className="auth-field">
                  <User className="auth-icon" />
                  <input type="text" name="username" value={formData.username} onChange={handleChange('username')}
                    placeholder="Choose a username" autoComplete="username" autoCapitalize="none" autoCorrect="off"
                    spellCheck={false} required className={authInputClassName} />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 tracking-wide uppercase">Email</label>
                <div className="auth-field">
                  <Mail className="auth-icon" />
                  <input type="email" name="email" value={formData.email} onChange={handleChange('email')}
                    placeholder="Enter your email" autoComplete="email" autoCapitalize="none" autoCorrect="off"
                    spellCheck={false} required className={authInputClassName} />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 tracking-wide uppercase">Password</label>
                <div className="auth-field">
                  <Lock className="auth-icon" />
                  <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange('password')}
                    placeholder="Create a password (min 6 chars)" autoComplete="new-password" required className={passwordInputClassName} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="auth-action">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 tracking-wide uppercase">Confirm Password</label>
                <div className="auth-field">
                  <Lock className="auth-icon" />
                  <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange('confirmPassword')}
                    placeholder="Confirm your password" autoComplete="new-password" required className={authInputClassName} />
                </div>
              </div>

              {/* Terms */}
              <div className="pt-1">
                <label className="flex items-start gap-2 cursor-pointer group select-none">
                  <input type="checkbox" className="mt-0.5 w-4 h-4 rounded border-slate-600 bg-slate-800 accent-blue-500 cursor-pointer" />
                  <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors leading-tight">
                    I agree to the{' '}
                    <a href="#" className="text-blue-400 hover:text-blue-300">Terms of Service</a>
                    {' '}and{' '}
                    <a href="#" className="text-blue-400 hover:text-blue-300">Privacy Policy</a>
                  </span>
                </label>
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading}
                className="
                  relative w-full py-2.5 px-4 mt-1
                  bg-gradient-to-r from-blue-600 to-cyan-500
                  hover:from-blue-500 hover:to-cyan-400
                  text-white text-sm font-semibold rounded-lg
                  shadow-lg shadow-blue-600/30 hover:shadow-blue-500/40
                  transition-all duration-200
                  hover:scale-[1.015] active:scale-[0.99]
                  disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100
                  overflow-hidden group
                ">
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                <span className="relative flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                    </>
                  )}
                </span>
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                Sign in
              </Link>
            </p>

            <div className="mt-5 flex items-center justify-center gap-1.5 text-xs text-slate-600">
              <Shield className="w-3 h-3" />
              <span>256-bit SSL Secure Connection</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50%       { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 4s ease infinite;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        .animate-slideUp { animation: slideUp 0.25s ease-out; }
      `}</style>
    </div>
  );
}
