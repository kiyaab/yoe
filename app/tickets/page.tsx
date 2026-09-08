'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Ticket as TicketIcon, Check, Lock, Clock, ArrowRight, Sparkles, Filter } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';

interface TicketItem {
  ticketNumber: number;
  status: 'AVAILABLE' | 'RESERVED' | 'CONFIRMED' | 'CANCELLED';
  id?: string;
}

export default function TicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState<'ALL' | 'AVAILABLE'>('ALL');
  const [reserving, setReserving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const pageSize = 20; // 10 pages for 200 numbers

  useEffect(() => {
    apiFetch('/api/tickets')
      .then((res) => res.json())
      .then((data) => {
        if (data.tickets) {
          setTickets(data.tickets);
        }
        setLoading(false);
      })
      .catch(() => {
        // Fallback demo data
        const demo: TicketItem[] = Array.from({ length: 200 }, (_, i) => ({
          ticketNumber: i + 1,
          status: i % 4 === 0 ? 'CONFIRMED' : i % 7 === 0 ? 'RESERVED' : 'AVAILABLE',
        }));
        setTickets(demo);
        setLoading(false);
      });
  }, []);

  // Filtered tickets
  const filteredTickets = tickets.filter((t) => {
    if (filter === 'AVAILABLE') return t.status === 'AVAILABLE';
    return true;
  });

  // Paginated tickets for current view
  const totalPages = Math.ceil(200 / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const currentViewTickets = tickets.slice(startIndex, startIndex + pageSize);

  const handleSelect = (num: number, status: string) => {
    if (status !== 'AVAILABLE') return;
    setErrorMsg('');
    setSelectedNumber(selectedNumber === num ? null : num);
  };

  const handleProceed = async () => {
    if (!selectedNumber) return;
    setReserving(true);
    setErrorMsg('');

    try {
      const res = await apiFetch('/api/tickets/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketNumber: selectedNumber }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          router.push(`/login?redirect=/checkout&ticketNumber=${selectedNumber}`);
          return;
        }
        throw new Error(data.error || 'Failed to reserve ticket');
      }

      router.push(`/checkout?ticketId=${data.ticket.id}&ticketNumber=${data.ticket.ticketNumber}`);
    } catch (err: any) {
      setErrorMsg(err.message);
      setReserving(false);
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 lg:px-8 max-w-6xl mx-auto pb-32">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold uppercase tracking-wider mb-3 shadow-2xs">
          <TicketIcon className="w-3.5 h-3.5 text-amber-600" />
          Choose Your Number • 100 ETB
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 mb-3 tracking-tight">
          Select Your Lucky Number
        </h1>
        <p className="text-sm text-slate-600">
          Pick any available number from <strong className="text-slate-900">1 to 200</strong>. Each number costs 100 ETB and enters the 10,000 ETB grand draw.
        </p>
      </div>

      {/* Error notification */}
      {errorMsg && (
        <div className="max-w-md mx-auto mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center font-semibold shadow-xs">
          {errorMsg}
        </div>
      )}

      {/* Legend & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white/95 rounded-2xl p-4 mb-6 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-5 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-md bg-emerald-100 border border-emerald-300 flex items-center justify-center text-[10px] text-emerald-800 font-bold">✓</span>
            <span className="text-slate-700">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-md bg-amber-100 border border-amber-300 flex items-center justify-center text-[10px] text-amber-800 font-bold">⌛</span>
            <span className="text-slate-700">Pending Review</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-md bg-slate-200 border border-slate-300 flex items-center justify-center text-[10px] text-slate-500 font-bold">✕</span>
            <span className="text-slate-700">Sold Out</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs ${
              filter === 'ALL' ? 'bg-amber-400 text-slate-950' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All 200
          </button>
          <button
            onClick={() => setFilter('AVAILABLE')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs ${
              filter === 'AVAILABLE' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Available Only
          </button>
        </div>
      </div>

      {/* 10-Page Pagination Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
          const startNum = (page - 1) * pageSize + 1;
          const endNum = page * pageSize;
          const isActive = currentPage === page;

          return (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all flex flex-col items-center border ${
                isActive
                  ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-md shadow-amber-400/20 scale-105'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-slate-200 shadow-2xs'
              }`}
            >
              <span>Page {page}</span>
              <span className="text-[10px] opacity-80">{startNum}–{endNum}</span>
            </button>
          );
        })}
      </div>

      {/* Grid of Numbers */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm animate-pulse font-medium">
          Loading numbers 1–200...
        </div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-5 gap-3 sm:gap-4">
          {currentViewTickets.map((t) => {
            const isSelected = selectedNumber === t.ticketNumber;
            const isAvailable = t.status === 'AVAILABLE';
            const isPending = t.status === 'RESERVED';
            const isConfirmed = t.status === 'CONFIRMED';

            return (
              <button
                key={t.ticketNumber}
                onClick={() => handleSelect(t.ticketNumber, t.status)}
                disabled={!isAvailable}
                className={`h-24 sm:h-28 rounded-2xl p-3 flex flex-col items-center justify-between border-2 transition-all duration-200 relative overflow-hidden group ${
                  isSelected
                    ? 'bg-gradient-to-br from-amber-400 to-amber-500 border-amber-400 scale-105 shadow-xl shadow-amber-400/30 ring-4 ring-amber-300/40 text-slate-950'
                    : isAvailable
                    ? 'bg-white border-slate-200/90 hover:border-emerald-500 hover:scale-[1.02] hover:shadow-md cursor-pointer text-slate-900'
                    : isPending
                    ? 'bg-amber-50/70 border-amber-200/60 opacity-80 cursor-not-allowed text-amber-900'
                    : 'bg-slate-100 border-slate-200/70 opacity-60 cursor-not-allowed text-slate-400'
                }`}
              >
                {/* Status Dot / Badge */}
                <div className="w-full flex items-center justify-between text-[10px] font-mono">
                  <span className={`font-semibold ${isSelected ? 'text-slate-950' : 'text-slate-400'}`}>
                    TICKET
                  </span>
                  {isSelected ? (
                    <span className="w-4 h-4 rounded-full bg-slate-950 text-amber-400 flex items-center justify-center font-black">
                      ✓
                    </span>
                  ) : isAvailable ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                  ) : isPending ? (
                    <span className="text-amber-700 font-bold">⌛</span>
                  ) : (
                    <span className="text-slate-400 font-bold">✕</span>
                  )}
                </div>

                {/* Number Display */}
                <div
                  className={`text-2xl sm:text-3xl font-black font-mono tracking-wider ${
                    isSelected
                      ? 'text-slate-950 scale-110'
                      : isAvailable
                      ? 'text-slate-900 group-hover:text-emerald-700'
                      : 'text-slate-400 line-through'
                  }`}
                >
                  #{String(t.ticketNumber).padStart(3, '0')}
                </div>

                {/* Footer Label */}
                <div className="text-[10px] font-bold uppercase tracking-wider">
                  {isSelected ? (
                    <span className="bg-white/90 text-slate-950 px-2 py-0.5 rounded-full shadow-2xs">SELECTED</span>
                  ) : isAvailable ? (
                    <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200 font-extrabold">100 ETB</span>
                  ) : isPending ? (
                    <span className="text-amber-800 bg-amber-100/60 px-1.5 py-0.5 rounded-full">PENDING</span>
                  ) : (
                    <span className="text-slate-400">SOLD</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Floating Bottom Sticky Checkout Dock */}
      {selectedNumber && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-xl">
          <div className="bg-white/95 backdrop-blur-2xl rounded-2xl p-4 sm:p-5 border-2 border-amber-400 shadow-2xl shadow-slate-900/15 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 font-black text-xl flex items-center justify-center shadow-md shadow-amber-400/40 font-mono">
                #{String(selectedNumber).padStart(3, '0')}
              </div>
              <div>
                <div className="text-xs text-slate-500 font-bold">Selected Lucky Number</div>
                <div className="text-base font-black text-slate-900 flex items-center gap-2">
                  100 ETB <span className="text-xs text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Entry Fee</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleProceed}
              disabled={reserving}
              className="px-6 py-3.5 gold-btn text-slate-950 font-black text-sm flex items-center gap-2 shadow-lg shadow-amber-500/30 hover:scale-105 transition disabled:opacity-50"
            >
              {reserving ? 'Reserving...' : 'Proceed to Payment'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
