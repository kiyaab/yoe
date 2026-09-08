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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Administrator Control Suite
          </div>
          <h1 className="text-3xl font-black text-white">Platform Dashboard</h1>
          <p className="text-xs text-gray-400 mt-1">Live metrics for Round #{data?.roundNumber || 1}</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/payments"
            className="px-4 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center gap-2 hover:bg-amber-500/25 transition"
          >
            <CreditCard className="w-4 h-4" />
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
        <div className="glass-panel rounded-2xl p-5 border border-white/10">
          <div className="text-xs font-semibold text-gray-400">Total Revenue</div>
          <div className="text-2xl sm:text-3xl font-black font-mono gold-gradient-text my-1">
            {stats.revenueETB.toLocaleString()} ETB
          </div>
          <div className="text-[11px] text-gray-400">Max Potential: 20,000 ETB</div>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-white/10">
          <div className="text-xs font-semibold text-gray-400">Confirmed Tickets</div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 my-1">
            {stats.confirmedCount} <span className="text-xs text-gray-500 font-normal">/ 200</span>
          </div>
          <div className="text-[11px] text-gray-400">Available: {stats.availableCount}</div>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-white/10">
          <div className="text-xs font-semibold text-gray-400">Pending Verification</div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400 my-1">
            {stats.pendingPaymentsCount}
          </div>
          <div className="text-[11px] text-gray-400">Awaiting Admin Approval</div>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-white/10">
          <div className="text-xs font-semibold text-gray-400">Total Participants</div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-white my-1">
            {stats.totalUsers}
          </div>
          <div className="text-[11px] text-gray-400">Registered Users</div>
        </div>
      </div>

      {/* Quick Action Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/admin/payments"
          className="glass-card rounded-2xl p-6 border border-white/10 hover:border-amber-400 transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <CreditCard className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">Verify Receipts</h3>
          <p className="text-xs text-gray-400 mb-4">
            Review uploaded CBE & Telebirr receipts, inspect images, and approve or reject tickets.
          </p>
          <span className="text-xs font-bold text-amber-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Go to Receipts Queue <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>

        <Link
          href="/admin/draw"
          className="glass-card rounded-2xl p-6 border border-white/10 hover:border-amber-400 transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Trophy className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">CSPRNG Lottery Draw</h3>
          <p className="text-xs text-gray-400 mb-4">
            Execute the hardware-random winner draw and notify 1st, 2nd, and 3rd prize winners.
          </p>
          <span className="text-xs font-bold text-amber-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Open Draw Console <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>

        <Link
          href="/admin/settings"
          className="glass-card rounded-2xl p-6 border border-white/10 hover:border-amber-400 transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Settings className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">Payment Settings</h3>
          <p className="text-xs text-gray-400 mb-4">
            Update official CBE Account Number, Telebirr Phone Number, and Telegram support contacts.
          </p>
          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Configure Accounts <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>
      </div>
    </div>
  );
}
