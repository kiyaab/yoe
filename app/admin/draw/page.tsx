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
        colors: ['#F59E0B', '#10B981', '#fbbf24', '#059669'],
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
      <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-6">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
      </Link>

      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold mb-3 shadow-2xs">
          <Trophy className="w-3.5 h-3.5 text-amber-600" /> Official CSPRNG Draw Console
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2">Execute Lottery Draw</h1>
        <p className="text-xs text-slate-600">
          This console executes the Node.js CSPRNG (`crypto.randomInt`) algorithm across all confirmed tickets for Round #{stats?.roundNumber || 1}.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold text-center shadow-2xs">
          {errorMsg}
        </div>
      )}

      {/* Draw Status Panel */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-md max-w-xl mx-auto text-center space-y-6 mb-10">
        <div className="flex justify-around items-center py-4 border-b border-slate-100 text-center">
          <div>
            <div className="text-xs text-slate-500 font-semibold">Active Round</div>
            <div className="text-2xl font-black text-slate-900 font-mono">#{stats?.roundNumber || 1}</div>
          </div>
          <div className="h-10 w-px bg-slate-200" />
          <div>
            <div className="text-xs text-slate-500 font-semibold">Confirmed Tickets</div>
            <div className={`text-2xl font-black font-mono ${confirmedCount >= 3 ? 'text-emerald-700' : 'text-rose-600'}`}>
              {confirmedCount} / 200
            </div>
          </div>
        </div>

        {confirmedCount < 3 ? (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed font-medium">
            ⚠️ <strong>Notice:</strong> At least <strong>3 confirmed tickets</strong> are required to trigger a 3-prize draw. Please approve more pending payments or purchase tickets first.
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Ready for execution: {confirmedCount} tickets are eligible for the jackpot draw.
          </div>
        )}

        <button
          onClick={handleExecuteDraw}
          disabled={drawing || confirmedCount < 3}
          className="w-full py-4 gold-btn text-slate-950 font-black text-base flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 hover:scale-[1.01] transition disabled:opacity-50"
        >
          <Play className="w-5 h-5 fill-current" />
          {drawing ? 'Calculating Cryptographic Entropy...' : 'Execute Official Live Draw'}
        </button>
      </div>

      {/* Draw Result Reveal */}
      {winners && (
        <div className="bg-white rounded-3xl p-8 border-2 border-amber-300 shadow-xl space-y-6 max-w-2xl mx-auto text-center">
          <div className="text-4xl mb-2">🏆</div>
          <h2 className="text-2xl font-black text-slate-900">Official Draw Completed!</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <div className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-400">
              <div className="text-2xl mb-1">🥇</div>
              <div className="text-[10px] font-bold text-amber-800 uppercase">1st Prize Winner</div>
              <div className="text-2xl font-black font-mono text-slate-900 my-1">
                #{String(winners.first?.ticketNumber).padStart(3, '0')}
              </div>
              <div className="text-xs font-mono font-bold text-amber-800">{winners.first?.prizeAmount?.toLocaleString()} ETB</div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-300">
              <div className="text-2xl mb-1">🥈</div>
              <div className="text-[10px] font-bold text-slate-600 uppercase">2nd Prize Winner</div>
              <div className="text-2xl font-black font-mono text-slate-900 my-1">
                #{String(winners.second?.ticketNumber).padStart(3, '0')}
              </div>
              <div className="text-xs font-mono font-bold text-slate-700">{winners.second?.prizeAmount?.toLocaleString()} ETB</div>
            </div>

            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200">
              <div className="text-2xl mb-1">🥉</div>
              <div className="text-[10px] font-bold text-amber-800 uppercase">3rd Prize Winner</div>
              <div className="text-2xl font-black font-mono text-slate-900 my-1">
                #{String(winners.third?.ticketNumber).padStart(3, '0')}
              </div>
              <div className="text-xs font-mono font-bold text-amber-800">{winners.third?.prizeAmount?.toLocaleString()} ETB</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
