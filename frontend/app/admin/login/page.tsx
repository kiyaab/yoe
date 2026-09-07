'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@yalfal.et');
  const [password, setPassword] = useState('AdminPassword2026!');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const res = await api.adminLogin({ email, password });
      localStorage.setItem('yalfal_admin_token', res.accessToken);
      localStorage.setItem('yalfal_admin_user', JSON.stringify(res.admin));
      router.push('/admin/dashboard');
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid administrative credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 bg-gradient-navy d-flex align-items-center justify-content-center p-3">
      <div className="glass-card p-4 p-md-5 text-dark w-100 max-w-500 shadow-lg border-2 border-warning">
        <div className="text-center mb-4">
          <div className="display-4 mb-2">🎡</div>
          <h3 className="fw-extrabold text-navy">YALFAL ONLINE ETA</h3>
          <span className="badge bg-warning text-dark px-3 py-1 fw-bold">STAFF & ADMIN PORTAL</span>
        </div>

        {errorMessage && (
          <div className="alert alert-danger small py-2 d-flex align-items-center gap-2 mb-3">
            <i className="bi bi-exclamation-octagon-fill"></i>
            <div>{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label small fw-bold text-navy">Admin Email</label>
            <div className="input-group">
              <span className="input-group-text bg-light"><i className="bi bi-envelope"></i></span>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label small fw-bold text-navy">Password</label>
            <div className="input-group">
              <span className="input-group-text bg-light"><i className="bi bi-lock"></i></span>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-navy w-100 py-3 fw-bold d-flex align-items-center justify-content-center gap-2"
          >
            {loading ? (
              <span className="spinner-border spinner-border-sm" role="status"></span>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <i className="bi bi-arrow-right"></i>
              </>
            )}
          </button>
        </form>

        <div className="mt-4 pt-3 border-top text-center text-muted small">
          Default Dev Admin: <code>admin@yalfal.et</code> / <code>AdminPassword2026!</code>
        </div>
      </div>
    </div>
  );
}
