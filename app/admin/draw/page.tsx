'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { ArrowLeft, Trophy, Play, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function AdminDrawPage() {
  const [stats, setStats] = useState<any>(null);
  const [drawing, setDrawing] = useState(false);
  const [winners, setWinners] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch(() => {});
  }, []);

  const handleExecuteDraw = async () => {
    if (!confirm('Are you sure you want to execute the official CSPRNG lottery draw? This will conclude the current round and record permanent winners.')) {
      return;
    }

    setDrawing(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/admin/draw', {
        method: 'POST',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Draw execution failed');
      }

      setWinners(data.winners);
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#10B981', '#ffffff', '#FBBF24'],
      });
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setDrawing(false);
    }
  };

  const confirmedCount = stats?.stats?.confirmedCount || 0;

  return (
    <div className="min-h-screen py-10 px-4 lg:px-8 max-w-4xl mx-auto">
      <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white mb-6">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
      </Link>

      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-semibold mb-3">
          <Trophy className="w-3.5 h-3.5" /> Official CSPRNG Draw Console
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">Execute Lottery Draw</h1>
        <p className="text-xs text-gray-400">
          This console executes the Node.js CSPRNG (`crypto.randomInt`) algorithm across all confirmed tickets for Round #{stats?.roundNumber || 1}.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-medium text-center">
          {errorMsg}
        </div>
      )}

      {/* Draw Status Panel */}
      <div className="glass-panel rounded-3xl p-8 border border-white/10 max-w-xl mx-auto text-center space-y-6 mb-10">
        <div className="flex justify-around items-center py-4 border-b border-white/10 text-center">
          <div>
            <div className="text-xs text-gray-400 font-semibold">Active Round</div>
            <div className="text-2xl font-black text-white font-mono">#{stats?.roundNumber || 1}</div>
          </div>
          <div className="h-10 w-px bg-white/10" />
          <div>
            <div className="text-xs text-gray-400 font-semibold">Confirmed Tickets</div>
            <div className={`text-2xl font-black font-mono ${confirmedCount >= 3 ? 'text-emerald-400' : 'text-red-400'}`}>
              {confirmedCount} / 200
            </div>
          </div>
        </div>

        {confirmedCount < 3 ? (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 leading-relaxed">
            ⚠️ <strong>Notice:</strong> At least <strong>3 confirmed tickets</strong> are required to trigger a 3-prize draw. Please approve more pending payments or purchase tickets first.
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Ready for execution: {confirmedCount} tickets are eligible for the jackpot draw.
          </div>
        )}

        <button
          onClick={handleExecuteDraw}
          disabled={drawing || confirmedCount < 3}
          className="w-full py-4 gold-btn text-slate-950 font-black text-base flex items-center justify-center gap-2 shadow-xl shadow-amber-500/30 hover:scale-[1.01] transition disabled:opacity-40"
        >
          {drawing ? (
            'Executing CSPRNG Hardware Draw...'
          ) : (
            <>
              <Play className="w-5 h-5 fill-current" /> Execute Official Draw
            </>
          )}
        </button>
      </div>

      {/* Winners Reveal Showcase */}
      {winners && (
        <div className="glass-panel rounded-3xl p-8 border border-amber-400/50 space-y-6 animate-fade-in shadow-2xl shadow-amber-500/20">
          <div className="text-center">
            <div className="text-4xl mb-2">🎉</div>
            <h2 className="text-2xl font-black text-white">Winners Certified & Awarded!</h2>
            <p className="text-xs text-gray-400">Prizes have been registered in the database and participants notified.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-amber-500/15 border border-amber-400 text-center">
              <div className="text-2xl mb-1">🥇</div>
              <div className="text-xs font-bold uppercase text-amber-400">1st Prize Winner</div>
              <div className="text-3xl font-black font-mono text-white my-2">
                #{String(winners.first.ticketNumber).padStart(3, '0')}
              </div>
              <div className="text-xs font-mono font-bold text-amber-300">10,000 ETB</div>
              <div className="text-[11px] text-gray-300 mt-1">{winners.first.winnerName}</div>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-gray-300 text-center">
              <div className="text-2xl mb-1">🥈</div>
              <div className="text-xs font-bold uppercase text-gray-300">2nd Prize Winner</div>
              <div className="text-3xl font-black font-mono text-white my-2">
                #{String(winners.second.ticketNumber).padStart(3, '0')}
              </div>
              <div className="text-xs font-mono font-bold text-gray-200">1,000 ETB</div>
              <div className="text-[11px] text-gray-300 mt-1">{winners.second.winnerName}</div>
            </div>

            <div className="p-5 rounded-2xl bg-amber-700/10 border border-amber-600 text-center">
              <div className="text-2xl mb-1">🥉</div>
              <div className="text-xs font-bold uppercase text-amber-600">3rd Prize Winner</div>
              <div className="text-3xl font-black font-mono text-white my-2">
                #{String(winners.third.ticketNumber).padStart(3, '0')}
              </div>
              <div className="text-xs font-mono font-bold text-amber-500">500 ETB</div>
              <div className="text-[11px] text-gray-300 mt-1">{winners.third.winnerName}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
