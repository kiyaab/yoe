import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Send, CheckCircle2, Lock } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#06080d] py-12 px-4 lg:px-8 text-gray-400 text-xs mt-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        <div className="space-y-3 md:col-span-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎡</span>
            <span className="font-extrabold text-white text-base tracking-wider">YALFAL ONLINE ETA</span>
          </div>
          <p className="text-gray-400 text-xs leading-relaxed max-w-md">
            Ethiopia's trusted digital lottery platform. Certified CSPRNG cryptographic draws, instant CBE and Telebirr payment verification, and guaranteed prize payouts for 1st, 2nd, and 3rd place winners.
          </p>
          <div className="flex items-center gap-4 pt-2">
            <a
              href="https://t.me/yalfalonlinebot"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#229ED9]/15 text-[#229ED9] border border-[#229ED9]/30 hover:bg-[#229ED9]/25 transition"
            >
              <Send className="w-3.5 h-3.5" />
              Telegram Bot @yalfalonlinebot
            </a>
          </div>
        </div>

        <div>
          <div className="text-white font-semibold text-sm mb-3">Guaranteed Prizes</div>
          <ul className="space-y-2 text-xs">
            <li className="flex items-center justify-between py-1 border-b border-white/5">
              <span>🥇 1st Prize</span>
              <span className="font-mono text-amber-400 font-bold">10,000 ETB</span>
            </li>
            <li className="flex items-center justify-between py-1 border-b border-white/5">
              <span>🥈 2nd Prize</span>
              <span className="font-mono text-gray-300 font-bold">1,000 ETB</span>
            </li>
            <li className="flex items-center justify-between py-1 border-b border-white/5">
              <span>🥉 3rd Prize</span>
              <span className="font-mono text-amber-600 font-bold">500 ETB</span>
            </li>
          </ul>
        </div>

        <div>
          <div className="text-white font-semibold text-sm mb-3">Accepted Payments</div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-white font-medium">Commercial Bank of Ethiopia (CBE)</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span className="text-white font-medium">Ethio Telecom Telebirr</span>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-[11px] text-gray-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            SHA-256 Anti-Fraud Duplicate Protection
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
        <p>© 2026 Yalfal Online Eta. All rights reserved.</p>
        <p className="flex items-center gap-2">
          <Lock className="w-3 h-3 text-gray-500" />
          End-to-End Cryptographically Secure Lottery Engine
        </p>
      </div>
    </footer>
  );
}
