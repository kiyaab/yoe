'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Check, Copy, Upload, AlertCircle, CheckCircle2, ArrowLeft, ShieldCheck, Sparkles } from 'lucide-react';
import Link from 'next/link';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const ticketId = searchParams.get('ticketId');
  const ticketNumber = searchParams.get('ticketNumber');

  const [methods, setMethods] = useState<any[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<'CBE' | 'TELEBIRR'>('CBE');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetch('/api/payments/methods')
      .then((res) => res.json())
      .then((data) => {
        if (data.methods) setMethods(data.methods);
      })
      .catch(() => {});
  }, []);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (selected.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(selected));
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg('Please upload your payment screenshot/receipt.');
      return;
    }
    if (!ticketId) {
      setErrorMsg('Missing ticket identifier. Please select your number again.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('ticketId', ticketId);
      formData.append('method', selectedMethod);
      formData.append('reference', reference);

      const res = await fetch('/api/payments/submit', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit receipt');
      }

      setSubmitted(true);
    } catch (err: any) {
      setErrorMsg(err.message);
      setLoading(false);
    }
  };

  if (!ticketId || !ticketNumber) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
        <AlertCircle className="w-12 h-12 text-amber-400 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">No Ticket Selected</h2>
        <p className="text-sm text-gray-400 mb-6">Please select a lucky number before proceeding to checkout.</p>
        <Link href="/tickets" className="px-6 py-3 gold-btn text-slate-950 font-bold text-sm">
          Browse Numbers 1–200
        </Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 max-w-lg mx-auto text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-6 animate-bounce">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-black text-white mb-2">Receipt Submitted!</h1>
        <p className="text-sm text-gray-300 mb-6 leading-relaxed">
          Your payment receipt for Ticket <strong className="text-amber-400 font-mono">#{String(ticketNumber).padStart(3, '0')}</strong> has been submitted. Our administrators are verifying your transaction.
        </p>

        <div className="glass-panel rounded-2xl p-6 w-full text-left space-y-3 mb-8 border border-white/10 text-xs">
          <div className="flex justify-between py-1 border-b border-white/5">
            <span className="text-gray-400">Reserved Ticket:</span>
            <span className="font-mono text-white font-bold">#{String(ticketNumber).padStart(3, '0')}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-white/5">
            <span className="text-gray-400">Entry Fee:</span>
            <span className="font-mono text-amber-400 font-bold">100 ETB</span>
          </div>
          <div className="flex justify-between py-1 border-b border-white/5">
            <span className="text-gray-400">Payment Method:</span>
            <span className="text-white font-semibold">{selectedMethod === 'CBE' ? 'Commercial Bank of Ethiopia' : 'Telebirr'}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-gray-400">Verification Status:</span>
            <span className="text-amber-400 font-bold">PENDING APPROVAL</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Link
            href="/my-tickets"
            className="flex-1 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm transition text-center"
          >
            View My Tickets
          </Link>
          <Link
            href="/tickets"
            className="flex-1 py-3.5 gold-btn text-slate-950 font-bold text-sm text-center shadow-lg shadow-amber-500/20"
          >
            Buy Another Number
          </Link>
        </div>
      </div>
    );
  }

  const activeMethod = methods.find((m) => m.code === selectedMethod) || {
    accountNumber: selectedMethod === 'CBE' ? '1000234567890' : '0911223344',
    accountName: 'Yalfal Online Eta Lottery',
    instructions: 'Send 100 ETB and upload screenshot.',
  };

  return (
    <div className="min-h-screen py-10 px-4 lg:px-8 max-w-4xl mx-auto">
      <Link href="/tickets" className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-white mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Ticket Grid
      </Link>

      <div className="text-center max-w-xl mx-auto mb-8">
        <h1 className="text-3xl font-black text-white mb-2">Complete Your Entry</h1>
        <p className="text-xs text-gray-400">
          Transfer <strong className="text-amber-400 font-mono">100 ETB</strong> to the official accounts below and attach your receipt.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-medium text-center">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Ticket Summary Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="glass-panel rounded-2xl p-6 border border-amber-500/30 relative overflow-hidden">
            <div className="text-xs font-semibold text-gray-400 uppercase mb-4">Reserved Ticket</div>
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-black text-3xl flex items-center justify-center mb-4 font-mono shadow-xl shadow-amber-500/25">
              #{String(ticketNumber).padStart(3, '0')}
            </div>
            <div className="space-y-2 text-xs border-t border-white/10 pt-4">
              <div className="flex justify-between">
                <span className="text-gray-400">Ticket Price:</span>
                <span className="font-mono text-white font-bold">100 ETB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Entries:</span>
                <span className="font-mono text-white font-bold">1 of 200</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Top Prize:</span>
                <span className="font-mono text-amber-400 font-bold">10,000 ETB</span>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-4 border border-white/10 text-[11px] text-gray-400 space-y-2">
            <div className="flex items-center gap-1.5 text-white font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Anti-Fraud Protection
            </div>
            <p>Every receipt image is verified via cryptographic SHA-256 hash. Duplicate receipts are automatically rejected.</p>
          </div>
        </div>

        {/* Payment & Upload Form */}
        <div className="md:col-span-2 space-y-6">
          {/* Method Selector Tabs */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedMethod('CBE')}
              className={`p-4 rounded-2xl border text-left transition-all ${
                selectedMethod === 'CBE'
                  ? 'bg-amber-500/15 border-amber-400 shadow-lg shadow-amber-500/10'
                  : 'glass-card border-white/10 hover:border-white/20'
              }`}
            >
              <div className="text-xs font-bold text-amber-400 mb-1">Commercial Bank of Ethiopia</div>
              <div className="text-sm font-black text-white">CBE Account / Birr</div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod('TELEBIRR')}
              className={`p-4 rounded-2xl border text-left transition-all ${
                selectedMethod === 'TELEBIRR'
                  ? 'bg-amber-500/15 border-amber-400 shadow-lg shadow-amber-500/10'
                  : 'glass-card border-white/10 hover:border-white/20'
              }`}
            >
              <div className="text-xs font-bold text-emerald-400 mb-1">Ethio Telecom</div>
              <div className="text-sm font-black text-white">Telebirr Transfer</div>
            </button>
          </div>

          {/* Official Bank / Telebirr Details */}
          <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-4">
            <div className="text-xs font-bold uppercase text-gray-400 tracking-wider">
              Official Transfer Details ({selectedMethod})
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10">
                <div>
                  <div className="text-[10px] text-gray-400 font-medium">Account / Phone Number</div>
                  <div className="text-base font-black font-mono text-white tracking-wider">
                    {activeMethod.accountNumber}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(activeMethod.accountNumber, 'num')}
                  className="px-3 py-1.5 rounded-lg bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 hover:brightness-110 transition"
                >
                  {copiedKey === 'num' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedKey === 'num' ? 'Copied' : 'Copy'}
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10">
                <div>
                  <div className="text-[10px] text-gray-400 font-medium">Account Beneficiary Name</div>
                  <div className="text-sm font-bold text-gray-200">{activeMethod.accountName}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(activeMethod.accountName, 'name')}
                  className="px-3 py-1.5 rounded-lg bg-white/10 text-gray-300 font-medium text-xs flex items-center gap-1.5 hover:bg-white/20 transition"
                >
                  {copiedKey === 'name' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedKey === 'name' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="text-xs text-amber-300/90 leading-relaxed bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
              💡 <strong>Instructions:</strong> Transfer exactly <strong>100 ETB</strong> to the details above. Take a screenshot of the completed transfer confirmation and upload it below.
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Drag and Drop File Area */}
            <div className="glass-panel rounded-2xl p-6 border-2 border-dashed border-white/20 hover:border-amber-400 transition-colors text-center relative">
              <input
                type="file"
                id="receiptUpload"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />

              {previewUrl ? (
                <div className="space-y-3">
                  <img
                    src={previewUrl}
                    alt="Receipt Preview"
                    className="max-h-48 mx-auto rounded-xl object-contain border border-white/10 shadow-lg"
                  />
                  <div className="text-xs text-emerald-400 font-medium flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {file?.name} ({Math.round((file?.size || 0) / 1024)} KB)
                  </div>
                  <div className="text-[11px] text-gray-400">Click or drag another image to replace</div>
                </div>
              ) : (
                <div className="space-y-3 py-4">
                  <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 text-amber-400 flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Click or Drag Payment Receipt Screenshot</div>
                    <div className="text-xs text-gray-400 mt-1">Supports JPG, PNG, WEBP, and PDF up to 25MB</div>
                  </div>
                </div>
              )}
            </div>

            {/* Optional reference number input */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Transaction Reference / SMS Code (Optional)
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. FT2609081234 or Telebirr Txn ID"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-amber-400 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !file}
              className="w-full py-4 gold-btn text-slate-950 font-black text-base flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 disabled:opacity-50 hover:scale-[1.01] transition"
            >
              {loading ? 'Submitting Receipt...' : `Submit Payment for Ticket #${String(ticketNumber).padStart(3, '0')}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-gray-400">Loading Checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
