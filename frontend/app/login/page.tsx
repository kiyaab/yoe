'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../components/AuthContext';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/tickets';
  const { login, isAuthenticated } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  React.useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectUrl);
    }
  }, [isAuthenticated, redirectUrl, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setErrorMsg('Please enter your phone number/username and password');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    const res = await login(identifier.trim(), password);
    setLoading(false);
    if (res.success) {
      router.push(redirectUrl);
    } else {
      setErrorMsg(res.error || 'Invalid credentials');
    }
  };

  return (
    <div className="card-body p-4 bg-white">
      {errorMsg && (
        <div className="alert alert-danger py-2 small mb-4 d-flex align-items-center gap-2">
          <i className="bi bi-exclamation-triangle-fill flex-shrink-0"></i>
          <div>{errorMsg}</div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label small fw-bold text-navy">
            Phone Number or Telegram Username
          </label>
          <div className="input-group">
            <span className="input-group-text bg-light">
              <i className="bi bi-telephone text-muted"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. 0911223344 or @username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <label className="form-label small fw-bold text-navy mb-0">Password</label>
          </div>
          <div className="input-group">
            <span className="input-group-text bg-light">
              <i className="bi bi-lock text-muted"></i>
            </span>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-navy w-100 py-3 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
        >
          {loading ? (
            <span className="spinner-border spinner-border-sm" role="status"></span>
          ) : (
            <>
              <span>Sign In</span>
              <i className="bi bi-arrow-right"></i>
            </>
          )}
        </button>
      </form>

      <div className="text-center mt-4 small text-muted">
        Don&apos;t have an account yet?{' '}
        <Link
          href={`/register?redirect=${encodeURIComponent(redirectUrl)}`}
          className="fw-bold text-primary text-decoration-none"
        >
          Register Now
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="py-5 bg-light min-vh-100 d-flex align-items-center">
      <div className="container" style={{ maxWidth: '440px' }}>
        <div className="card shadow-lg border-0 rounded-4 overflow-hidden">
          <div className="ethiopia-strip"></div>
          <div className="bg-navy p-4 text-center text-white">
            <span className="fs-1 d-block mb-1">🎡</span>
            <h4 className="fw-bolder mb-1 letter-spacing-1">YALFAL ONLINE ETA</h4>
            <p className="small text-white-50 mb-0">Sign In to Your Lottery Account</p>
          </div>
          <Suspense fallback={<div className="p-5 text-center text-muted"><span className="spinner-border spinner-border-sm"></span> Loading...</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
