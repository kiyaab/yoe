'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, X, Eye, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectingPayment, setRejectingPayment] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('Invalid receipt screenshot');

  const fetchPayments = () => {
    setLoading(true);
    fetch('/api/admin/payments')
      .then((res) => res.json())
      .then((data) => {
        if (data.payments) setPayments(data.payments);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleAction = async (paymentId: string, action: 'APPROVE' | 'REJECT', reason?: string) => {
    setProcessingId(paymentId);
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, action, reason }),
      });

      if (res.ok) {
        setPayments((prev) => prev.filter((p) => p.id !== paymentId));
        setRejectingPayment(null);
      }
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 lg:px-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white mb-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Payment Verification Queue</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Inspect uploaded CBE & Telebirr receipts and verify participant tickets
          </p>
        </div>

        <button
          onClick={fetchPayments}
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition"
          title="Refresh Queue"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-400 text-sm animate-pulse">Loading pending receipts...</div>
      ) : payments.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center border border-white/10 max-w-md mx-auto my-12">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-white mb-1">Queue is Empty</h2>
          <p className="text-xs text-gray-400">All submitted payment receipts have been reviewed!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {payments.map((p) => {
            const receiptFilename = p.receipt?.originalName;
            const imageUrl = receiptFilename ? `/api/receipts/${receiptFilename}` : null;

            return (
              <div
                key={p.id}
                className="glass-panel rounded-2xl p-6 border border-white/10 space-y-4 hover:border-white/20 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 font-black text-base flex items-center justify-center font-mono">
                        #{String(p.ticket?.ticketNumber).padStart(3, '0')}
                      </span>
                      <div>
                        <div className="text-sm font-bold text-white">
                          {p.user?.firstName || 'Participant'}
                        </div>
                        <div className="text-[11px] text-gray-400 font-mono">
                          {p.user?.phone || `@${p.user?.username}` || p.user?.telegramId}
                        </div>
                      </div>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    {p.method} • 100 ETB
                  </span>
                </div>

                {/* Receipt Image Thumbnail */}
                {imageUrl && (
                  <div
                    onClick={() => setPreviewImage(imageUrl)}
                    className="h-44 rounded-xl overflow-hidden border border-white/10 relative group cursor-pointer bg-slate-950"
                  >
                    <img
                      src={imageUrl}
                      alt="Receipt Screenshot"
                      className="w-full h-full object-contain group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5 text-xs text-white font-bold backdrop-blur-xs">
                      <Eye className="w-4 h-4" /> Click to Enlarge
                    </div>
                  </div>
                )}

                {p.referenceNumber && (
                  <div className="text-xs text-gray-300 bg-white/5 p-2.5 rounded-lg font-mono">
                    Ref / SMS: <strong className="text-white">{p.referenceNumber}</strong>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => setRejectingPayment(p)}
                    disabled={processingId === p.id}
                    className="flex-1 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" /> Reject
                  </button>

                  <button
                    onClick={() => handleAction(p.id, 'APPROVE')}
                    disabled={processingId === p.id}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {processingId === p.id ? 'Approving...' : 'Approve Ticket'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Resolution Photo Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-3xl w-full max-h-[90vh]">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white text-xs flex items-center gap-1"
            >
              <X className="w-4 h-4" /> Close (Esc)
            </button>
            <img
              src={previewImage}
              alt="Receipt Full View"
              className="max-h-[85vh] mx-auto rounded-2xl border border-white/20 shadow-2xl object-contain"
            />
          </div>
        </div>
      )}

      {/* Reject Reason Dialog */}
      {rejectingPayment && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl p-6 max-w-md w-full border border-red-500/30 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              Reject Payment for #{String(rejectingPayment.ticket?.ticketNumber).padStart(3, '0')}
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Select or type the reason for rejection. The ticket will be released back to the available pool and the user will be notified.
            </p>

            <select
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
            >
              <option value="Invalid receipt screenshot" className="bg-slate-900">Invalid receipt screenshot</option>
              <option value="Incorrect transfer amount (must be 100 ETB)" className="bg-slate-900">Incorrect transfer amount (must be 100 ETB)</option>
              <option value="Unreadable or blurry screenshot" className="bg-slate-900">Unreadable or blurry screenshot</option>
              <option value="Duplicate transaction reference" className="bg-slate-900">Duplicate transaction reference</option>
              <option value="Payment not received in bank account" className="bg-slate-900">Payment not received in bank account</option>
            </select>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectingPayment(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleAction(rejectingPayment.id, 'REJECT', rejectReason)}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs transition"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
