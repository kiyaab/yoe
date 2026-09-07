'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../components/AuthContext';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/tickets';
  const { register, isAuthenticated } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [telegram, setTelegram] = useState('');
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
    if (!firstName.trim() || !phone.trim() || !password.trim()) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    const res = await register({
      phone: phone.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim() || undefined,
      password,
      telegramUsername: telegram.trim() || undefined,
    });
    setLoading(false);

    if (res.success) {
      router.push(redirectUrl);
    } else {
      setErrorMsg(res.error || 'Registration failed');
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
        <div className="row g-2 mb-3">
          <div className="col-6">
            <label className="form-label small fw-bold text-navy">First Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="Abebe"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div className="col-6">
            <label className="form-label small fw-bold text-navy">Last Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="Bikila"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label small fw-bold text-navy">
            Ethiopian Mobile Phone Number *
          </label>
          <div className="input-group">
            <span className="input-group-text bg-light small fw-bold text-navy">🇪🇹 +251</span>
            <input
              type="tel"
              className="form-control"
              placeholder="911223344"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <div className="form-text text-muted small">
            Used for CBE Birr or Telebirr payout verification.
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label small fw-bold text-navy">
            Telegram Username (Optional)
          </label>
          <div className="input-group">
            <span className="input-group-text bg-light text-primary">@</span>
            <input
              type="text"
              className="form-control"
              placeholder="username"
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="form-label small fw-bold text-navy">Create Password *</label>
          <input
            type="password"
            className="form-control"
            placeholder="Min. 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-gold text-navy w-100 py-3 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
        >
          {loading ? (
            <span className="spinner-border spinner-border-sm" role="status"></span>
          ) : (
            <>
              <span>Create Account & Continue</span>
              <i className="bi bi-check-circle-fill"></i>
            </>
          )}
        </button>
      </form>

      <div className="text-center mt-4 small text-muted">
        Already have an account?{' '}
        <Link
          href={`/login?redirect=${encodeURIComponent(redirectUrl)}`}
          className="fw-bold text-primary text-decoration-none"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="py-5 bg-light min-vh-100 d-flex align-items-center">
      <div className="container" style={{ maxWidth: '480px' }}>
        <div className="card shadow-lg border-0 rounded-4 overflow-hidden">
          <div className="ethiopia-strip"></div>
          <div className="bg-navy p-4 text-center text-white">
            <span className="fs-1 d-block mb-1">🎡</span>
            <h4 className="fw-bolder mb-1 letter-spacing-1">YALFAL ONLINE ETA</h4>
            <p className="small text-white-50 mb-0">Create Your Player Account</p>
          </div>
          <Suspense fallback={<div className="p-5 text-center text-muted"><span className="spinner-border spinner-border-sm"></span> Loading...</div>}>
            <RegisterForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
