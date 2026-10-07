import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, User as UserIcon, Phone, MapPin, Sparkles, ShieldCheck, ArrowRight, Store } from 'lucide-react';
import type { User } from '../types';
import { loginUser, registerUser } from '../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialMode = 'signin',
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [role, setRole] = useState<'customer' | 'artisan'>('customer');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMode(initialMode);
    setError(null);
  }, [initialMode, isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        const res = await loginUser({ email, password });
        onLoginSuccess(res.user);
        onClose();
      } else {
        const res = await registerUser({
          name,
          email,
          password,
          role,
          phone,
          address,
        });
        onLoginSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Viva Demo Login handler
  const handleQuickLogin = async (demoEmail: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await loginUser({ email: demoEmail, password: 'Pass@123' });
      onLoginSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-black/10 overflow-hidden relative my-6 animate-in zoom-in-95 duration-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-slate-900 to-emerald-950 text-white p-6 sm:p-8">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-md transition"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>LocalBiz Identity Gateway</span>
          </div>

          <h2 id="auth-modal-title" className="font-editorial text-2xl sm:text-3xl font-bold tracking-tight">
            {mode === 'signin' ? 'Welcome Back' : 'Create an Account'}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            {mode === 'signin'
              ? 'Access your orders, saved artisan favorites, or vendor studio.'
              : 'Join as a conscious buyer or register your rural craft workshop.'}
          </p>

          {/* Mode Switch Tabs */}
          <div className="flex bg-white/10 backdrop-blur-md rounded-full p-1 mt-6 text-xs font-medium border border-white/10">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
              }}
              className={`flex-1 py-1.5 rounded-full transition ${
                mode === 'signin' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-200 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              className={`flex-1 py-1.5 rounded-full transition ${
                mode === 'signup' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-200 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[75vh]">
          
          {/* Quick Demo Login Pill for Viva Evaluators */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center space-x-1.5 text-emerald-800 text-[11px] font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>1-Click Viva Demo Logins</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('aditi@tcet.edu')}
                disabled={loading}
                className="px-3 py-2 rounded-xl bg-white hover:bg-emerald-100/50 border border-emerald-200 text-slate-800 text-left transition flex items-center justify-between font-medium group"
              >
                <div>
                  <p className="font-semibold text-slate-900">Aditi Khandge</p>
                  <p className="text-[10px] text-slate-500">Customer (Mumbai)</p>
                </div>
                <ArrowRight className="w-3 h-3 text-emerald-600 group-hover:translate-x-0.5 transition" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('priya@pottery.in')}
                disabled={loading}
                className="px-3 py-2 rounded-xl bg-white hover:bg-emerald-100/50 border border-emerald-200 text-slate-800 text-left transition flex items-center justify-between font-medium group"
              >
                <div>
                  <p className="font-semibold text-slate-900">Priya Sharma</p>
                  <p className="text-[10px] text-emerald-700 font-medium">Artisan Potter (Jaipur)</p>
                </div>
                <ArrowRight className="w-3 h-3 text-emerald-600 group-hover:translate-x-0.5 transition" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('anish@tcet.edu')}
                disabled={loading}
                className="px-3 py-2 rounded-xl bg-white hover:bg-emerald-100/50 border border-emerald-200 text-slate-800 text-left transition flex items-center justify-between font-medium group sm:col-span-2"
              >
                <div>
                  <p className="font-semibold text-slate-900">Anish</p>
                  <p className="text-[10px] text-slate-500">Customer (Bandra, Mumbai)</p>
                </div>
                <ArrowRight className="w-3 h-3 text-emerald-600 group-hover:translate-x-0.5 transition" />
              </button>
            </div>
          </div>

          {error && (
            <div
              className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium animate-in fade-in"
              role="alert"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                {/* Role Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">I am joining as:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('customer')}
                      className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center space-x-1.5 transition ${
                        role === 'customer'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <UserIcon className="w-3.5 h-3.5" />
                      <span>Conscious Buyer</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole('artisan')}
                      className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center space-x-1.5 transition ${
                        role === 'artisan'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Store className="w-3.5 h-3.5" />
                      <span>Artisan / Maker</span>
                    </button>
                  </div>
                </div>

                {/* Name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Full Name</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="e.g. Aditi Khandge"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  placeholder="name@tcet.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                />
              </div>
            </div>

            {mode === 'signup' && (
              <>
                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="tel"
                      placeholder="e.g. 9820123456"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    {role === 'artisan' ? 'Studio / Workshop Location' : 'Default Delivery Address'}
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="e.g. Thakur Village, Kandivali East, Mumbai"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm transition shadow-md glow-emerald disabled:opacity-50 cursor-pointer"
            >
              {loading
                ? 'Processing securely...'
                : mode === 'signin'
                ? 'Sign In to LocalBiz'
                : 'Create Account & Continue'}
            </button>
          </form>

          <div className="text-center pt-2">
            <p className="text-xs text-slate-500">
              {mode === 'signin' ? "Don't have an account yet?" : 'Already registered?'}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'signin' ? 'signup' : 'signin');
                  setError(null);
                }}
                className="text-emerald-700 font-semibold ml-1.5 hover:underline"
              >
                {mode === 'signin' ? 'Sign up here' : 'Sign in here'}
              </button>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
