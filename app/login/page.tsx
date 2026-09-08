'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Phone, ArrowRight, Send, AlertCircle } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/tickets';
  const ticketNumber = searchParams.get('ticketNumber');

  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isTelegramWebApp, setIsTelegramWebApp] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.initData) {
      setIsTelegramWebApp(true);
    }
  }, []);

  const handleTelegramAuth = async () => {
    if (typeof window === 'undefined') return;
    const tg = (window as any).Telegram?.WebApp;
    if (!tg?.initData) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: tg.initData }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Telegram authentication failed');

      router.push(redirect);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message);
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid credentials');

      if (data.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push(redirect);
      }
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="glass-panel rounded-3xl p-8 sm:p-10 max-w-md w-full border border-white/10 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 font-black text-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/20">
            🎡
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Welcome Back</h1>
          <p className="text-xs text-gray-400 mt-1">Sign in to your Yalfal Online Eta account</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {isTelegramWebApp && (
          <div className="mb-6">
            <button
              type="button"
              onClick={handleTelegramAuth}
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#229ED9] hover:bg-[#1f8ec4] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#229ED9]/25 transition"
            >
              <Send className="w-4 h-4" />
              1-Click Log In with Telegram
            </button>
            <div className="flex items-center my-4">
              <div className="flex-1 border-t border-white/10" />
              <span className="px-3 text-[10px] text-gray-500 uppercase">or with phone</span>
              <div className="flex-1 border-t border-white/10" />
            </div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Phone Number or Admin Email</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="0911223344 or admin@yalfal.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-amber-400 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-amber-400 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 gold-btn text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 hover:scale-[1.01] transition disabled:opacity-50 mt-2"
          >
            {loading ? 'Signing In...' : 'Sign In'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-gray-400">
          Don't have an account yet?{' '}
          <Link href="/register" className="text-amber-400 font-bold hover:underline">
            Register for Free
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-gray-400">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
