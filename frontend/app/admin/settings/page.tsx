'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../../lib/api';

export default function AdminSettingsPage() {
  const [methods, setMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{ type: string; msg: string } | null>(null);
  const [botStatus, setBotStatus] = useState<any>(null);
  const [botTokenInput, setBotTokenInput] = useState('');
  const [connectingBot, setConnectingBot] = useState(false);
  const [miniAppUrlInput, setMiniAppUrlInput] = useState('');
  const [updatingUrl, setUpdatingUrl] = useState(false);

  const loadSettings = async () => {
    setLoading(true);
    const token = localStorage.getItem('yalfal_admin_token') || '';
    try {
      const [data, tgStatus] = await Promise.all([
        api.getAdminPaymentMethods(token),
        api.getTelegramStatus(),
      ]);
      setMethods(data);
      setBotStatus(tgStatus);
      if (tgStatus?.miniAppUrl) {
        setMiniAppUrlInput(tgStatus.miniAppUrl);
      }
    } catch (err: any) {
      setAlert({ type: 'danger', msg: err.message || 'Error loading settings' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleConnectBot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!botTokenInput.trim()) return;
    setConnectingBot(true);
    try {
      const res = await api.connectTelegramBot(botTokenInput.trim());
      if (res.success) {
        setAlert({
          type: 'success',
          msg: `🎉 Bot @${res.bot?.username || 'yalfalonlinebot'} is now LIVE and connected to Telegram!`,
        });
        setBotTokenInput('');
        const updatedStatus = await api.getTelegramStatus();
        setBotStatus(updatedStatus);
      } else {
        setAlert({
          type: 'danger',
          msg: `Failed to connect bot: ${res.error}. Please check your token from @BotFather.`,
        });
      }
    } catch (err: any) {
      setAlert({ type: 'danger', msg: err.message || 'Bot connection error' });
    } finally {
      setConnectingBot(false);
    }
  };

  const handleUpdateMiniAppUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!miniAppUrlInput.trim()) return;
    setUpdatingUrl(true);
    try {
      const res = await api.updateMiniAppUrl(miniAppUrlInput.trim());
      if (res.success) {
        setAlert({
          type: 'success',
          msg: `🎉 Mini App URL updated to ${res.miniAppUrl} and synced with Telegram Chat Menu Button!`,
        });
        const updatedStatus = await api.getTelegramStatus();
        setBotStatus(updatedStatus);
      } else {
        setAlert({
          type: 'danger',
          msg: `Failed to update Mini App URL: ${res.error}`,
        });
      }
    } catch (err: any) {
      setAlert({ type: 'danger', msg: err.message || 'Error updating Mini App URL' });
    } finally {
      setUpdatingUrl(false);
    }
  };

  const handleSave = async (code: string, methodData: any) => {
    const token = localStorage.getItem('yalfal_admin_token') || '';
    try {
      await api.updatePaymentMethod(token, code, {
        accountName: methodData.accountName,
        accountNumber: methodData.accountNumber,
        instructions: methodData.instructions,
      });
      setAlert({ type: 'success', msg: `${code} account information successfully updated in database!` });
    } catch (err: any) {
      setAlert({ type: 'danger', msg: err.message || 'Failed to update payment method' });
    }
  };

  return (
    <div className="max-w-800">
      <div className="mb-4">
        <h3 className="fw-extrabold text-navy mb-0">System & Telegram Settings</h3>
        <p className="text-muted small mb-0">
          Configure official bank accounts, Telegram Bot credentials, and live Mini App WebApp URL.
        </p>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type} alert-dismissible fade show mb-4`} role="alert">
          {alert.msg}
          <button type="button" className="btn-close" onClick={() => setAlert(null)}></button>
        </div>
      )}

      {/* Telegram Bot Live Card */}
      <div className="card shadow-sm border-0 bg-white p-4 mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-telegram fs-4 text-primary"></i>
            <h5 className="fw-bold text-navy mb-0">Telegram Bot Live Integration</h5>
          </div>
          <span className={`badge ${botStatus?.connected ? 'bg-success' : 'bg-warning text-dark'} px-3 py-2 fw-bold`}>
            {botStatus?.connected ? '🟢 BOT IS LIVE & RUNNING' : '🟡 AWAITING BOTFATHER TOKEN'}
          </span>
        </div>

        <p className="small text-muted mb-3">
          Configured Bot Username: <strong>@{botStatus?.botUsername || 'yalfalonlinebot'}</strong>. 
          To activate the bot, paste your API token obtained from <strong>@BotFather</strong> on Telegram.
        </p>

        <form onSubmit={handleConnectBot} className="bg-light p-3 rounded-3 border">
          <label className="form-label small fw-bold text-navy">
            Telegram Bot Token (from @BotFather)
          </label>
          <div className="input-group">
            <input
              type="text"
              className="form-control font-monospace"
              placeholder="e.g. 7891234567:AAHk1234abcd..."
              value={botTokenInput}
              onChange={(e) => setBotTokenInput(e.target.value)}
            />
            <button
              type="submit"
              disabled={connectingBot || !botTokenInput.trim()}
              className="btn btn-navy px-4 fw-bold"
            >
              {connectingBot ? 'Connecting...' : 'Connect Bot Now'}
            </button>
          </div>
          <div className="small text-muted mt-2">
            <i className="bi bi-info-circle me-1 text-primary"></i>
            How to get a token: Open Telegram → Search <strong>@BotFather</strong> → Send <code>/token</code> → Select your bot.
          </div>
        </form>
      </div>

      {/* Telegram Mini App Configuration Card */}
      <div className="card shadow-sm border-0 bg-white p-4 mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-phone fs-4 text-warning"></i>
            <h5 className="fw-bold text-navy mb-0">Telegram Mini App (WebApp) URL</h5>
          </div>
          <span className="badge bg-primary px-3 py-2 fw-bold">
            {botStatus?.miniAppUrl ? '🚀 MINI APP LINKED' : '⚙ NOT CONFIGURED'}
          </span>
        </div>

        <p className="small text-muted mb-3">
          This HTTPS URL is loaded seamlessly inside Telegram when users tap the chat <strong>&quot;🎡 Open Mini App&quot;</strong> menu button or inline keyboard button.
        </p>

        <form onSubmit={handleUpdateMiniAppUrl} className="bg-light p-3 rounded-3 border">
          <label className="form-label small fw-bold text-navy">
            Mini App WebApp Base URL (Must start with https://)
          </label>
          <div className="input-group">
            <input
              type="url"
              className="form-control font-monospace"
              placeholder="https://your-domain.com or https://your-tunnel.life"
              value={miniAppUrlInput}
              onChange={(e) => setMiniAppUrlInput(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={updatingUrl || !miniAppUrlInput.trim()}
              className="btn btn-gold text-navy px-4 fw-bold"
            >
              {updatingUrl ? 'Syncing...' : 'Save & Sync Menu Button'}
            </button>
          </div>
          <div className="d-flex justify-content-between align-items-center mt-2 small text-muted">
            <span>
              <i className="bi bi-shield-check text-success me-1"></i>
              Active URL: <code className="text-navy fw-bold">{botStatus?.miniAppUrl || 'Not set'}</code>
            </span>
            {botStatus?.miniAppUrl && (
              <a
                href={`${botStatus.miniAppUrl}/tickets`}
                target="_blank"
                rel="noreferrer"
                className="text-primary text-decoration-none fw-semibold"
              >
                Test WebApp in Browser <i className="bi bi-box-arrow-up-right ms-1"></i>
              </a>
            )}
          </div>
        </form>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      ) : (
        <div className="d-flex flex-column gap-4">
          {methods.map((m, idx) => (
            <div className="card shadow-sm border-0 bg-white p-4" key={m.code}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold text-navy mb-0">
                  {m.code === 'CBE' ? '🏦 Commercial Bank of Ethiopia (CBE)' : '📱 Telebirr Mobile Money'}
                </h5>
                <span className="badge bg-success">ACTIVE IN CHECKOUT</span>
              </div>

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Account Holder Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={m.accountName}
                    onChange={(e) => {
                      const updated = [...methods];
                      updated[idx].accountName = e.target.value;
                      setMethods(updated);
                    }}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-bold">
                    {m.code === 'CBE' ? 'Account Number' : 'Phone Number'}
                  </label>
                  <input
                    type="text"
                    className="form-control font-monospace"
                    value={m.accountNumber}
                    onChange={(e) => {
                      const updated = [...methods];
                      updated[idx].accountNumber = e.target.value;
                      setMethods(updated);
                    }}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label small fw-bold">User Instructions</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    value={m.instructions || ''}
                    onChange={(e) => {
                      const updated = [...methods];
                      updated[idx].instructions = e.target.value;
                      setMethods(updated);
                    }}
                  ></textarea>
                </div>
              </div>

              <div className="text-end mt-3">
                <button
                  type="button"
                  onClick={() => handleSave(m.code, m)}
                  className="btn btn-navy px-4"
                >
                  Save Changes
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
