'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, CheckCircle2, Settings as SettingsIcon } from 'lucide-react';

export default function AdminSettingsPage() {
  const [cbeAccount, setCbeAccount] = useState('');
  const [cbeName, setCbeName] = useState('');
  const [telebirrPhone, setTelebirrPhone] = useState('');
  const [telebirrName, setTelebirrName] = useState('');
  const [supportContact, setSupportContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetch('/api/payments/methods')
      .then((res) => res.json())
      .then((data) => {
        if (data.methods) {
          const cbe = data.methods.find((m: any) => m.code === 'CBE');
          const telebirr = data.methods.find((m: any) => m.code === 'TELEBIRR');
          if (cbe) {
            setCbeAccount(cbe.accountNumber);
            setCbeName(cbe.accountName);
          }
          if (telebirr) {
            setTelebirrPhone(telebirr.accountNumber);
            setTelebirrName(telebirr.accountName);
          }
        }
        if (data.support) setSupportContact(data.support);
      })
      .catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cbeAccount,
          cbeName,
          telebirrPhone,
          telebirrName,
          supportContact,
        }),
      });

      if (res.ok) {
        setSuccessMsg('Payment accounts and support settings saved successfully!');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 lg:px-8 max-w-3xl mx-auto">
      <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-6">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900">Payment & System Settings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure official bank accounts and Telebirr details shown to participants during ticket checkout
        </p>
      </div>

      {successMsg && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* CBE Account Settings */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-extrabold text-amber-800 uppercase tracking-wider">
            Commercial Bank of Ethiopia (CBE)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">CBE Account Number</label>
              <input
                type="text"
                required
                value={cbeAccount}
                onChange={(e) => setCbeAccount(e.target.value)}
                placeholder="1000234567890"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-mono focus:bg-white focus:outline-none focus:border-amber-500 shadow-2xs transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">CBE Beneficiary Name</label>
              <input
                type="text"
                required
                value={cbeName}
                onChange={(e) => setCbeName(e.target.value)}
                placeholder="Yalfal Online Eta Lottery"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-amber-500 shadow-2xs transition"
              />
            </div>
          </div>
        </div>

        {/* Telebirr Settings */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-extrabold text-emerald-800 uppercase tracking-wider">
            Ethio Telecom Telebirr
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Telebirr Phone Number</label>
              <input
                type="text"
                required
                value={telebirrPhone}
                onChange={(e) => setTelebirrPhone(e.target.value)}
                placeholder="0911223344"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-mono focus:bg-white focus:outline-none focus:border-amber-500 shadow-2xs transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Telebirr Account Name</label>
              <input
                type="text"
                required
                value={telebirrName}
                onChange={(e) => setTelebirrName(e.target.value)}
                placeholder="Yalfal Online Eta"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-amber-500 shadow-2xs transition"
              />
            </div>
          </div>
        </div>

        {/* Support Handle */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
            Customer Support Contact
          </h2>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Telegram Support Username</label>
            <input
              type="text"
              required
              value={supportContact}
              onChange={(e) => setSupportContact(e.target.value)}
              placeholder="@yalfalsupport"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-mono focus:bg-white focus:outline-none focus:border-amber-500 shadow-2xs transition"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 gold-btn text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 hover:scale-[1.01] transition disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> {loading ? 'Saving Settings...' : 'Save Configuration'}
        </button>
      </form>
    </div>
  );
}
