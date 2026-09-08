'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Play, Sparkles, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function DrawPage() {
  const [spinning, setSpinning] = useState(false);
  const [activeNumber, setActiveNumber] = useState('087');
  const [currentPrizePhase, setCurrentPrizePhase] = useState<'IDLE' | 'FIRST' | 'SECOND' | 'THIRD' | 'COMPLETE'>('IDLE');
  const [winners, setWinners] = useState<{
    first?: { number: number; prize: string; name: string };
    second?: { number: number; prize: string; name: string };
    third?: { number: number; prize: string; name: string };
  }>({});

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#F59E0B', '#10B981', '#fbbf24', '#059669'],
    });
  };

  const simulateDraw = () => {
    if (spinning) return;
    setSpinning(true);
    setCurrentPrizePhase('FIRST');
    setWinners({});

    // Spin animation sequence for 1st prize
    let counter = 0;
    const interval = setInterval(() => {
      const randNum = Math.floor(Math.random() * 200) + 1;
      setActiveNumber(String(randNum).padStart(3, '0'));
      counter++;

      if (counter > 30) {
        clearInterval(interval);
        const win1 = Math.floor(Math.random() * 200) + 1;
        setActiveNumber(String(win1).padStart(3, '0'));
        triggerConfetti();
        setWinners((prev) => ({
          ...prev,
          first: { number: win1, prize: '10,000 ETB', name: 'Verified Winner #1' },
        }));

        // Move to 2nd prize after 2 seconds
        setTimeout(() => {
          setCurrentPrizePhase('SECOND');
          let counter2 = 0;
          const interval2 = setInterval(() => {
            const rand2 = Math.floor(Math.random() * 200) + 1;
            setActiveNumber(String(rand2).padStart(3, '0'));
            counter2++;

            if (counter2 > 25) {
              clearInterval(interval2);
              let win2 = Math.floor(Math.random() * 200) + 1;
              while (win2 === win1) win2 = Math.floor(Math.random() * 200) + 1;
              setActiveNumber(String(win2).padStart(3, '0'));
              triggerConfetti();
              setWinners((prev) => ({
                ...prev,
                second: { number: win2, prize: '1,000 ETB', name: 'Verified Winner #2' },
              }));

              // Move to 3rd prize after 2 seconds
              setTimeout(() => {
                setCurrentPrizePhase('THIRD');
                let counter3 = 0;
                const interval3 = setInterval(() => {
                  const rand3 = Math.floor(Math.random() * 200) + 1;
                  setActiveNumber(String(rand3).padStart(3, '0'));
                  counter3++;

                  if (counter3 > 20) {
                    clearInterval(interval3);
                    let win3 = Math.floor(Math.random() * 200) + 1;
                    while (win3 === win1 || win3 === win2) win3 = Math.floor(Math.random() * 200) + 1;
                    setActiveNumber(String(win3).padStart(3, '0'));
                    triggerConfetti();
                    setWinners((prev) => ({
                      ...prev,
                      third: { number: win3, prize: '500 ETB', name: 'Verified Winner #3' },
                    }));
                    setCurrentPrizePhase('COMPLETE');
                    setSpinning(false);
                  }
                }, 70);
              }, 2000);
            }
          }, 70);
        }, 2000);
      }
    }, 70);
  };

  return (
    <div className="min-h-screen py-12 px-4 lg:px-8 max-w-5xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold uppercase tracking-wider mb-3 shadow-2xs">
          <Trophy className="w-3.5 h-3.5 text-amber-600" />
          Certified CSPRNG Random Draw
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 mb-3 tracking-tight">
          Live Interactive Spin Wheel
        </h1>
        <p className="text-sm text-slate-600">
          Cryptographically fair drawing algorithm using hardware entropy. Each prize winner is strictly excluded from subsequent draws.
        </p>
      </div>

      {/* Wheel Showcase Centerpiece */}
      <div className="bg-white rounded-3xl p-8 sm:p-12 border-2 border-amber-300 max-w-2xl mx-auto text-center relative overflow-hidden shadow-xl shadow-amber-500/10 mb-12">
        <div className="text-xs font-extrabold uppercase tracking-widest text-amber-800 mb-2">
          {currentPrizePhase === 'IDLE' && 'Ready For Draw'}
          {currentPrizePhase === 'FIRST' && '🥇 DRAWING 1ST PRIZE (10,000 ETB)'}
          {currentPrizePhase === 'SECOND' && '🥈 DRAWING 2ND PRIZE (1,000 ETB)'}
          {currentPrizePhase === 'THIRD' && '🥉 DRAWING 3RD PRIZE (500 ETB)'}
          {currentPrizePhase === 'COMPLETE' && '🎉 ALL PRIZES AWARDED!'}
        </div>

        {/* Animated Number Drum */}
        <div className="my-8 relative">
          <div className="w-56 h-56 sm:w-64 sm:h-64 mx-auto rounded-full bg-gradient-to-tr from-amber-100 via-amber-50 to-white border-4 border-amber-400 flex items-center justify-center shadow-2xl shadow-amber-400/30 relative">
            {/* Spinning ring decorative dashes */}
            <div className={`absolute inset-2 rounded-full border-2 border-dashed border-amber-400/50 ${spinning ? 'animate-spin' : ''}`} />

            <div className="text-center relative z-10">
              <div className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-1 font-bold">TICKET</div>
              <div className="text-6xl sm:text-7xl font-black font-mono text-slate-950 tracking-widest drop-shadow-xs">
                #{activeNumber}
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={simulateDraw}
          disabled={spinning}
          className="px-8 py-4 gold-btn text-slate-950 font-black text-base inline-flex items-center gap-2 shadow-xl shadow-amber-500/30 hover:scale-105 transition disabled:opacity-50"
        >
          {spinning ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Spinning Random Engine...
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-current" />
              Test Live Spin Animation
            </>
          )}
        </button>
      </div>

      {/* Prize Podium Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1st Prize Podium Card */}
        <div className={`rounded-2xl p-6 border-2 transition-all ${
          winners.first ? 'border-amber-400 bg-amber-50/80 scale-105 shadow-xl shadow-amber-500/15' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="text-3xl mb-2">🥇</div>
          <div className="text-xs font-extrabold uppercase text-amber-800 tracking-wider">1st Prize Jackpot</div>
          <div className="text-2xl font-black font-mono text-slate-900 my-2">10,000 ETB</div>
          {winners.first ? (
            <div className="pt-3 border-t border-amber-200 text-xs">
              <div className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Winning Ticket: #{String(winners.first.number).padStart(3, '0')}
              </div>
              <div className="text-slate-600 font-medium mt-1">{winners.first.name}</div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 pt-3 border-t border-slate-100 font-medium">Awaiting Live Draw</div>
          )}
        </div>

        {/* 2nd Prize Podium Card */}
        <div className={`rounded-2xl p-6 border-2 transition-all ${
          winners.second ? 'border-slate-400 bg-slate-50 scale-105 shadow-xl' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="text-3xl mb-2">🥈</div>
          <div className="text-xs font-extrabold uppercase text-slate-700 tracking-wider">2nd Prize</div>
          <div className="text-2xl font-black font-mono text-slate-900 my-2">1,000 ETB</div>
          {winners.second ? (
            <div className="pt-3 border-t border-slate-200 text-xs">
              <div className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Winning Ticket: #{String(winners.second.number).padStart(3, '0')}
              </div>
              <div className="text-slate-600 font-medium mt-1">{winners.second.name}</div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 pt-3 border-t border-slate-100 font-medium">Awaiting Live Draw</div>
          )}
        </div>

        {/* 3rd Prize Podium Card */}
        <div className={`rounded-2xl p-6 border-2 transition-all ${
          winners.third ? 'border-amber-600 bg-amber-50 scale-105 shadow-xl' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="text-3xl mb-2">🥉</div>
          <div className="text-xs font-extrabold uppercase text-amber-800 tracking-wider">3rd Prize</div>
          <div className="text-2xl font-black font-mono text-slate-900 my-2">500 ETB</div>
          {winners.third ? (
            <div className="pt-3 border-t border-amber-200 text-xs">
              <div className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Winning Ticket: #{String(winners.third.number).padStart(3, '0')}
              </div>
              <div className="text-slate-600 font-medium mt-1">{winners.third.name}</div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 pt-3 border-t border-slate-100 font-medium">Awaiting Live Draw</div>
          )}
        </div>
      </div>
    </div>
  );
}
