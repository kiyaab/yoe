'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Phone, ArrowRight, Send, AlertCircle } from 'lucide-react';
import { apiFetch, setClientAuth } from '@/lib/api-client';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/tickets';
  const ticketNumber = searchParams.get('ticketNumber');
  const initialPhone = searchParams.get('phone') || '';

  const [login, setLogin] = useState(initialPhone);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isTelegramWebApp, setIsTelegramWebApp] = useState(false);

  useEffect(() => {
    if (initialPhone) {
      setLogin(initialPhone);
    }
  }, [initialPhone]);

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
      const res = await apiFetch('/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: tg.initData }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Telegram authentication failed');

      if (data.token && data.user) {
        setClientAuth(data.token, data.user, data.isAdmin);
      }

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
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid credentials');

      if (data.token && data.user) {
        setClientAuth(data.token, data.user, data.role === 'ADMIN' || data.isAdmin);
      }

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
      <div className="bg-white rounded-3xl p-8 sm:p-10 max-w-md w-full border border-slate-200 shadow-xl shadow-slate-200/50">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 font-black text-2xl flex items-center justify-center mx-auto mb-3 shadow-md shadow-amber-500/20">
            🎡
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Welcome Back</h1>
          <p className="text-xs text-slate-500 mt-1">Sign in to your Yalfal Online Eta account</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 shadow-xs">
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
              className="w-full py-3.5 rounded-xl bg-[#229ED9] hover:bg-[#1f8ec4] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-[#229ED9]/25 transition"
            >
              <Send className="w-4 h-4" />
              1-Click Log In with Telegram
            </button>
            <div className="flex items-center my-4">
              <div className="flex-1 border-t border-slate-200" />
              <span className="px-3 text-[10px] text-slate-400 uppercase font-semibold">or with phone</span>
              <div className="flex-1 border-t border-slate-200" />
            </div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number or Admin Email</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="0911223344 or admin@yalfal.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:bg-white focus:outline-none focus:border-amber-500 transition shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:bg-white focus:outline-none focus:border-amber-500 transition shadow-2xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 gold-btn text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 hover:scale-[1.01] transition disabled:opacity-50 mt-2"
          >
            {loading ? 'Signing In...' : 'Sign In'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-slate-500 font-medium">
          Don't have an account yet?{' '}
          <Link href="/register" className="text-amber-800 font-bold hover:underline">
            Register for Free
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-400 font-medium">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
