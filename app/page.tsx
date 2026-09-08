import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Trophy, Ticket, ShieldCheck, Zap, ArrowRight, CheckCircle2, Clock, Sparkles } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getRoundData() {
  try {
    let round = await prisma.lotteryRound.findFirst({
      where: { status: 'OPEN' },
      include: {
        tickets: { select: { status: true } },
      },
      orderBy: { roundNumber: 'desc' },
    });

    if (!round) {
      round = await prisma.lotteryRound.create({
        data: {
          roundNumber: 1,
          name: 'Yalfal Online Eta Round 1',
          maxTickets: 200,
          ticketPrice: 100,
          firstPrize: 10000,
          secondPrize: 1000,
          thirdPrize: 500,
          status: 'OPEN',
          tickets: {
            create: Array.from({ length: 200 }, (_, i) => ({
              ticketNumber: i + 1,
              status: 'AVAILABLE',
            })),
          },
        },
        include: { tickets: { select: { status: true } } },
      });
    }

    const confirmed = round.tickets.filter((t) => t.status === 'CONFIRMED').length;
    const reserved = round.tickets.filter((t) => t.status === 'RESERVED').length;
    const available = 200 - confirmed - reserved;

    return {
      roundNumber: round.roundNumber,
      ticketPrice: round.ticketPrice,
      firstPrize: Number(round.firstPrize),
      secondPrize: Number(round.secondPrize),
      thirdPrize: Number(round.thirdPrize),
      confirmed,
      reserved,
      available,
      percent: Math.round((confirmed / 200) * 100),
    };
  } catch {
    return {
      roundNumber: 1,
      ticketPrice: 100,
      firstPrize: 10000,
      secondPrize: 1000,
      thirdPrize: 500,
      confirmed: 42,
      reserved: 12,
      available: 146,
      percent: 21,
    };
  }
}

export default async function HomePage() {
  const round = await getRoundData();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 px-4 lg:px-8 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100/90 border border-amber-300 text-amber-900 text-xs font-bold uppercase tracking-wider mb-6 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Active Round #{round.roundNumber} is Now Live • 200 Numbers Only
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6">
            Your Number. Your Chance.{' '}
            <span className="block gold-gradient-text">Your Moment.</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            Choose your lucky number between <strong className="text-slate-900">1 and 200</strong> for just{' '}
            <strong className="text-amber-800 font-mono font-bold bg-amber-100/80 px-2 py-0.5 rounded border border-amber-200">100 ETB</strong>. Pay easily via CBE or Telebirr and win up to{' '}
            <strong className="text-amber-800 font-mono font-bold">10,000 ETB</strong> in our verified live draw!
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/tickets"
              className="w-full sm:w-auto px-8 py-4 gold-btn text-slate-950 font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 hover:scale-105 transition-all"
            >
              <Ticket className="w-5 h-5 text-slate-950" />
              Pick Your Lucky Number
              <ArrowRight className="w-5 h-5 text-slate-950" />
            </Link>

            <Link
              href="/draw"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-base flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <Trophy className="w-5 h-5 text-amber-600" />
              Live Spin Wheel
            </Link>
          </div>
        </div>

        {/* Live Round Progress Banner */}
        <div className="max-w-4xl mx-auto mt-16 bg-white/95 rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xl shadow-slate-200/50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-5">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Round Status</div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2 mt-0.5">
                Round #{round.roundNumber}{' '}
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">
                  OPEN FOR ENTRIES
                </span>
              </div>
            </div>

            <div className="flex items-center gap-6 text-center sm:text-right">
              <div>
                <div className="text-2xl font-black font-mono text-emerald-700">{round.available}</div>
                <div className="text-[11px] text-slate-500 font-medium">Available Numbers</div>
              </div>
              <div>
                <div className="text-2xl font-black font-mono text-amber-700">{round.confirmed}</div>
                <div className="text-[11px] text-slate-500 font-medium">Sold (100 ETB)</div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-700 shadow-sm"
              style={{ width: `${Math.max(round.percent, 5)}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-500 mt-2 font-mono font-medium">
            <span>{round.confirmed} Confirmed</span>
            <span>Capacity: 200 Numbers</span>
          </div>
        </div>
      </section>

      {/* Prize Showcase Section */}
      <section className="py-16 px-4 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="text-xs font-extrabold uppercase tracking-widest text-amber-700 mb-2">Guaranteed Payouts</div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900">Every Round Produces 3 Big Winners</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1st Prize */}
          <div className="bg-gradient-to-b from-amber-50/70 to-white rounded-2xl p-8 border-2 border-amber-300/80 relative overflow-hidden group hover:border-amber-400 transition-all md:-translate-y-2 shadow-xl shadow-amber-500/10">
            <div className="absolute top-0 right-0 px-4 py-1 rounded-bl-xl bg-gradient-to-l from-amber-400 to-amber-500 text-slate-950 font-black text-xs uppercase shadow-sm">
              Grand Jackpot
            </div>
            <div className="text-4xl mb-4">🥇</div>
            <div className="text-sm font-bold text-amber-900 uppercase tracking-wider">1st Prize Winner</div>
            <div className="text-3xl sm:text-4xl font-black font-mono gold-gradient-text my-3">
              {round.firstPrize.toLocaleString()} ETB
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Paid immediately via CBE direct transfer or Telebirr upon completion of the CSPRNG wheel draw.
            </p>
          </div>

          {/* 2nd Prize */}
          <div className="bg-white rounded-2xl p-8 border border-slate-200 relative overflow-hidden group hover:border-slate-300 transition-all shadow-md shadow-slate-200/40">
            <div className="text-4xl mb-4">🥈</div>
            <div className="text-sm font-bold text-slate-600 uppercase tracking-wider">2nd Prize Winner</div>
            <div className="text-3xl sm:text-4xl font-black font-mono text-slate-900 my-3">
              {round.secondPrize.toLocaleString()} ETB
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Second drawn ticket excluding the 1st prize winner. Certified random selection.
            </p>
          </div>

          {/* 3rd Prize */}
          <div className="bg-white rounded-2xl p-8 border border-slate-200 relative overflow-hidden group hover:border-slate-300 transition-all shadow-md shadow-slate-200/40">
            <div className="text-4xl mb-4">🥉</div>
            <div className="text-sm font-bold text-slate-600 uppercase tracking-wider">3rd Prize Winner</div>
            <div className="text-3xl sm:text-4xl font-black font-mono text-amber-800 my-3">
              {round.thirdPrize.toLocaleString()} ETB
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Third drawn ticket excluding the 1st and 2nd winners. Triple the chances to win!
            </p>
          </div>
        </div>
      </section>

      {/* 3-Step Journey */}
      <section className="py-16 px-4 lg:px-8 max-w-5xl mx-auto border-t border-slate-200/80">
        <div className="text-center mb-12">
          <div className="text-xs font-extrabold uppercase tracking-widest text-emerald-700 mb-2">Simple & Transparent</div>
          <h2 className="text-3xl font-black text-slate-900">How To Play In 3 Easy Steps</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-amber-100 border border-amber-200 text-amber-900 font-black text-xl flex items-center justify-center mb-4 shadow-xs">
              1
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Pick Your Number</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Browse numbers 1–200 on our interactive grid. Select your numbers for 100 ETB each.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-900 font-black text-xl flex items-center justify-center mb-4 shadow-xs">
              2
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Pay & Upload Receipt</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Transfer via Commercial Bank of Ethiopia (CBE) or Telebirr, and upload your payment screenshot.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-amber-100 border border-amber-200 text-amber-900 font-black text-xl flex items-center justify-center mb-4 shadow-xs">
              3
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Watch Live Draw</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Once all 200 numbers are confirmed, watch the live wheel spin reveal the 3 jackpot winners!
            </p>
          </div>
        </div>

        <div className="text-center mt-12">
          <Link
            href="/tickets"
            className="inline-flex items-center gap-2 px-8 py-3.5 gold-btn text-slate-950 font-black text-sm shadow-md shadow-amber-500/20 hover:scale-105 transition"
          >
            Enter Active Round Now
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
