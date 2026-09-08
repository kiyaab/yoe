'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Ticket, Clock, CheckCircle2, XCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/tickets/my')
      .then((res) => res.json())
      .then((data) => {
        if (data.tickets) setTickets(data.tickets);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen py-10 px-4 lg:px-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">My Lottery Tickets</h1>
          <p className="text-xs text-gray-400 mt-1">Review your entries and payment verification status</p>
        </div>

        <Link
          href="/tickets"
          className="px-5 py-2.5 gold-btn text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20"
        >
          <Ticket className="w-3.5 h-3.5" /> Buy More Numbers
        </Link>
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-400 text-sm animate-pulse">Loading your tickets...</div>
      ) : tickets.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center border border-white/10 max-w-md mx-auto my-12">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-4 text-2xl">
            🎟
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No Tickets Purchased Yet</h2>
          <p className="text-xs text-gray-400 mb-6 leading-relaxed">
            You have not selected any lottery numbers for the active round. Numbers start at 100 ETB!
          </p>
          <Link href="/tickets" className="inline-flex items-center gap-2 px-6 py-3.5 gold-btn text-slate-950 font-bold text-sm">
            Pick a Number (1–200) <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tickets.map((t) => {
            const isConfirmed = t.status === 'CONFIRMED';
            const isPending = t.status === 'RESERVED';

            return (
              <div
                key={t.id}
                className="glass-card rounded-2xl p-5 border border-white/10 flex items-center justify-between relative overflow-hidden group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-black text-2xl flex items-center justify-center font-mono shadow-lg shadow-amber-500/20">
                    #{String(t.ticketNumber).padStart(3, '0')}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-400">
                      Round #{t.round?.roundNumber || 1}
                    </div>
                    <div className="text-base font-black text-white">
                      100 ETB <span className="text-xs text-amber-400 font-normal">Entry</span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  {isConfirmed ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> CONFIRMED
                    </span>
                  ) : isPending ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs font-bold">
                      <Clock className="w-3.5 h-3.5" /> VERIFYING
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 text-xs font-bold">
                      <XCircle className="w-3.5 h-3.5" /> REJECTED
                    </span>
                  )}
                  <div className="text-[10px] text-gray-400 mt-1">
                    {isConfirmed ? 'In Live Draw 🏆' : 'Under Admin Review'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
