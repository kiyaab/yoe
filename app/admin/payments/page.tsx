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
          <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Payment Verification Queue</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Inspect uploaded CBE & Telebirr receipts and verify participant tickets
          </p>
        </div>

        <button
          onClick={fetchPayments}
          className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-2xs transition"
          title="Refresh Queue"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm animate-pulse font-medium">Loading pending receipts...</div>
      ) : payments.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm max-w-md mx-auto my-12">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4 border border-emerald-200">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">Queue is Empty</h2>
          <p className="text-xs text-slate-500">All submitted payment receipts have been reviewed!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {payments.map((p) => {
            const receiptFilename = p.receipt?.originalName;
            const imageUrl = receiptFilename ? `/api/receipts/${receiptFilename}` : null;

            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md space-y-4 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 font-black text-base flex items-center justify-center font-mono shadow-sm">
                        #{String(p.ticket?.ticketNumber).padStart(3, '0')}
                      </span>
                      <div>
                        <div className="text-sm font-bold text-slate-900">
                          {p.user?.firstName || 'Participant'}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {p.user?.phone || `@${p.user?.username}` || p.user?.telegramId}
                        </div>
                      </div>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-amber-100 text-amber-900 border border-amber-300">
                    {p.method} • 100 ETB
                  </span>
                </div>

                {/* Receipt Image Thumbnail */}
                {imageUrl && (
                  <div
                    onClick={() => setPreviewImage(imageUrl)}
                    className="h-44 rounded-xl overflow-hidden border border-slate-200 relative group cursor-pointer bg-slate-50"
                  >
                    <img
                      src={imageUrl}
                      alt="Receipt Screenshot"
                      className="w-full h-full object-contain group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5 text-xs text-white font-bold backdrop-blur-xs">
                      <Eye className="w-4 h-4" /> Click to Enlarge
                    </div>
                  </div>
                )}

                {p.referenceNumber && (
                  <div className="text-xs text-slate-700 bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-mono">
                    Ref / SMS: <strong className="text-slate-900">{p.referenceNumber}</strong>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => setRejectingPayment(p)}
                    disabled={processingId === p.id}
                    className="flex-1 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" /> Reject
                  </button>

                  <button
                    onClick={() => handleAction(p.id, 'APPROVE')}
                    disabled={processingId === p.id}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm shadow-emerald-600/20 disabled:opacity-50"
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
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-3xl w-full max-h-[90vh]">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 p-2 text-white hover:text-amber-400 text-xs flex items-center gap-1 font-bold"
            >
              <X className="w-4 h-4" /> Close (Esc)
            </button>
            <img
              src={previewImage}
              alt="Receipt Full View"
              className="max-h-[85vh] mx-auto rounded-2xl border border-white/20 shadow-2xl object-contain bg-white"
            />
          </div>
        </div>
      )}

      {/* Reject Reason Dialog */}
      {rejectingPayment && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              Reject Payment for #{String(rejectingPayment.ticket?.ticketNumber).padStart(3, '0')}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Select or type the reason for rejection. The ticket will be released back to the available pool.
            </p>

            <select
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-amber-500"
            >
              <option value="Invalid receipt screenshot">Invalid receipt screenshot</option>
              <option value="Incorrect transfer amount (must be 100 ETB)">Incorrect transfer amount (must be 100 ETB)</option>
              <option value="Unreadable or blurry screenshot">Unreadable or blurry screenshot</option>
              <option value="Duplicate transaction reference">Duplicate transaction reference</option>
              <option value="Payment not received in bank account">Payment not received in bank account</option>
            </select>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectingPayment(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleAction(rejectingPayment.id, 'REJECT', rejectReason)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition shadow-sm"
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
