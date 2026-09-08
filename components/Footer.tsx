import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Send, CheckCircle2, Lock } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 py-12 px-4 lg:px-8 text-slate-600 text-xs mt-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        <div className="space-y-3 md:col-span-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎡</span>
            <span className="font-extrabold text-slate-900 text-base tracking-wider">YALFAL ONLINE ETA</span>
          </div>
          <p className="text-slate-500 text-xs leading-relaxed max-w-md">
            Ethiopia's premier digital lottery platform. Certified CSPRNG cryptographic draws, instant CBE and Telebirr payment verification, and guaranteed prize payouts for 1st, 2nd, and 3rd place winners.
          </p>
          <div className="flex items-center gap-4 pt-2">
            <a
              href="https://t.me/yalfalonlinebot"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#229ED9]/10 text-[#0088cc] border border-[#229ED9]/25 hover:bg-[#229ED9]/20 font-semibold transition"
            >
              <Send className="w-3.5 h-3.5" />
              Telegram Bot @yalfalonlinebot
            </a>
          </div>
        </div>

        <div>
          <div className="text-slate-900 font-bold text-sm mb-3">Guaranteed Prizes</div>
          <ul className="space-y-2 text-xs">
            <li className="flex items-center justify-between py-1.5 border-b border-slate-200/60">
              <span className="font-medium text-slate-700">🥇 1st Prize</span>
              <span className="font-mono text-amber-700 font-extrabold">10,000 ETB</span>
            </li>
            <li className="flex items-center justify-between py-1.5 border-b border-slate-200/60">
              <span className="font-medium text-slate-700">🥈 2nd Prize</span>
              <span className="font-mono text-slate-600 font-extrabold">1,000 ETB</span>
            </li>
            <li className="flex items-center justify-between py-1.5 border-b border-slate-200/60">
              <span className="font-medium text-slate-700">🥉 3rd Prize</span>
              <span className="font-mono text-amber-800 font-extrabold">500 ETB</span>
            </li>
          </ul>
        </div>

        <div>
          <div className="text-slate-900 font-bold text-sm mb-3">Accepted Payments</div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 shadow-2xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-slate-800 font-medium">Commercial Bank of Ethiopia (CBE)</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 shadow-2xs">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="text-slate-800 font-medium">Ethio Telecom Telebirr</span>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            SHA-256 Anti-Fraud Duplicate Protection
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left text-slate-500">
        <p>© 2026 Yalfal Online Eta. All rights reserved.</p>
        <p className="flex items-center gap-2 text-slate-500">
          <Lock className="w-3 h-3 text-slate-400" />
          Provably Fair Cryptographic Drawing System
        </p>
      </div>
    </footer>
  );
}
