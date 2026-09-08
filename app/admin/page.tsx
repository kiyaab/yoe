'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, CreditCard, Trophy, Settings, Users, Ticket, ArrowRight, Clock, AlertTriangle } from 'lucide-react';

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((res) => res.json())
      .then((stats) => {
        setData(stats);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const stats = data?.stats || {
    confirmedCount: 0,
    reservedCount: 0,
    availableCount: 200,
    revenueETB: 0,
    pendingPaymentsCount: 0,
    totalUsers: 0,
  };

  return (
    <div className="min-h-screen py-10 px-4 lg:px-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-rose-100 border border-rose-200 text-rose-800 text-xs font-bold mb-2 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5" /> Administrator Control Suite
          </div>
          <h1 className="text-3xl font-black text-slate-900">Platform Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">Live metrics for Round #{data?.roundNumber || 1}</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/payments"
            className="px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold flex items-center gap-2 hover:bg-amber-100 transition shadow-2xs"
          >
            <CreditCard className="w-4 h-4 text-amber-700" />
            Review Receipts ({stats.pendingPaymentsCount})
          </Link>
          <Link
            href="/admin/draw"
            className="px-4 py-2.5 gold-btn text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md shadow-amber-500/20"
          >
            <Trophy className="w-4 h-4" /> Trigger Live Draw
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-500">Total Revenue</div>
          <div className="text-2xl sm:text-3xl font-black font-mono gold-gradient-text my-1">
            {stats.revenueETB.toLocaleString()} ETB
          </div>
          <div className="text-[11px] text-slate-400 font-medium">Max Potential: 20,000 ETB</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-500">Confirmed Tickets</div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-700 my-1">
            {stats.confirmedCount} <span className="text-xs text-slate-400 font-normal">/ 200</span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium">Available: {stats.availableCount}</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-500">Pending Verification</div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-700 my-1">
            {stats.pendingPaymentsCount}
          </div>
          <div className="text-[11px] text-slate-400 font-medium">Awaiting Admin Approval</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-500">Total Participants</div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 my-1">
            {stats.totalUsers}
          </div>
          <div className="text-[11px] text-slate-400 font-medium">Registered Users</div>
        </div>
      </div>

      {/* Quick Action Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/admin/payments"
          className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all group shadow-sm"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-100 border border-amber-200 text-amber-900 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <CreditCard className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center justify-between">
            Payment Receipts Queue
            <ArrowRight className="w-4 h-4 text-amber-600 group-hover:translate-x-1 transition-transform" />
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Inspect customer CBE and Telebirr screenshots in full resolution. Confirm or reject submissions.
          </p>
        </Link>

        <Link
          href="/admin/draw"
          className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all group shadow-sm"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-900 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Trophy className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center justify-between">
            Provably Fair Draw Console
            <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-1 transition-transform" />
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Execute certified CSPRNG draws for 1st (10,000 ETB), 2nd (1,000 ETB), and 3rd (500 ETB) prizes.
          </p>
        </Link>

        <Link
          href="/admin/settings"
          className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all group shadow-sm"
        >
          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Settings className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center justify-between">
            Payment & Bank Accounts
            <ArrowRight className="w-4 h-4 text-slate-600 group-hover:translate-x-1 transition-transform" />
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Configure active CBE account numbers, Telebirr merchant phone numbers, and support contact handles.
          </p>
        </Link>
      </div>
    </div>
  );
}
