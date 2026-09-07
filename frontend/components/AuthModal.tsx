'use client';

import React, { useState } from 'react';
import { useAuth } from './AuthContext';

export default function AuthModal() {
  const { authModalOpen, authModalTab, authModalReason, closeAuthModal, login, register } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>(authModalTab);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Login form state
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regPhone, setRegPhone] = useState('');
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regTelegram, setRegTelegram] = useState('');

  React.useEffect(() => {
    setActiveTab(authModalTab);
    setErrorMsg('');
  }, [authModalTab, authModalOpen]);

  if (!authModalOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginId.trim() || !loginPassword.trim()) {
      setErrorMsg('Please enter your phone number/username and password');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    const res = await login(loginId.trim(), loginPassword);
    setLoading(false);
    if (!res.success) {
      setErrorMsg(res.error || 'Login failed. Please check your credentials.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regPhone.trim() || !regFirstName.trim() || !regPassword.trim()) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    const res = await register({
      phone: regPhone.trim(),
      firstName: regFirstName.trim(),
      lastName: regLastName.trim() || undefined,
      password: regPassword,
      telegramUsername: regTelegram.trim() || undefined,
    });
    setLoading(false);
    if (!res.success) {
      setErrorMsg(res.error || 'Registration failed. Please try again.');
    }
  };

  return (
    <div
      className="modal show d-block"
      tabIndex={-1}
      style={{ backgroundColor: 'rgba(7, 26, 53, 0.85)', zIndex: 1055 }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '460px' }}>
        <div className="modal-content border-0 shadow-2xl overflow-hidden rounded-4">
          {/* Ethiopia Header Stripe */}
          <div className="ethiopia-strip"></div>

          {/* Modal Header */}
          <div className="bg-navy p-4 text-white position-relative">
            <button
              type="button"
              className="btn-close btn-close-white position-absolute top-0 end-0 m-3"
              onClick={closeAuthModal}
              aria-label="Close"
            ></button>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="fs-3">🎡</span>
              <h5 className="fw-bolder mb-0 text-white letter-spacing-1">YALFAL ONLINE ETA</h5>
            </div>
            <p className="small text-white-50 mb-0">
              {authModalReason || 'Official Ethiopian Telegram Lottery Platform'}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="d-flex bg-light border-bottom">
            <button
              type="button"
              className={`flex-fill py-3 fw-bold border-0 bg-transparent ${
                activeTab === 'login' ? 'text-primary border-bottom border-3 border-primary' : 'text-muted'
              }`}
              onClick={() => {
                setActiveTab('login');
                setErrorMsg('');
              }}
            >
              <i className="bi bi-box-arrow-in-right me-1"></i> Sign In
            </button>
            <button
              type="button"
              className={`flex-fill py-3 fw-bold border-0 bg-transparent ${
                activeTab === 'register' ? 'text-primary border-bottom border-3 border-primary' : 'text-muted'
              }`}
              onClick={() => {
                setActiveTab('register');
                setErrorMsg('');
              }}
            >
              <i className="bi bi-person-plus-fill me-1"></i> Create Account
            </button>
          </div>

          {/* Modal Body */}
          <div className="modal-body p-4 bg-white">
            {errorMsg && (
              <div className="alert alert-danger py-2 small mb-3 d-flex align-items-center gap-2">
                <i className="bi bi-exclamation-triangle-fill flex-shrink-0"></i>
                <div>{errorMsg}</div>
              </div>
            )}

            {activeTab === 'login' ? (
              <form onSubmit={handleLoginSubmit}>
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
                      value={loginId}
                      onChange={(e) => setLoginId(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label small fw-bold text-navy">Password</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light">
                      <i className="bi bi-lock text-muted"></i>
                    </span>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
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
                      <span>Sign In to Continue</span>
                      <i className="bi bi-arrow-right"></i>
                    </>
                  )}
                </button>

                <div className="text-center mt-3 small text-muted">
                  Don&apos;t have an account yet?{' '}
                  <button
                    type="button"
                    className="btn btn-link p-0 small fw-bold text-primary text-decoration-none"
                    onClick={() => {
                      setActiveTab('register');
                      setErrorMsg('');
                    }}
                  >
                    Register now (10 sec)
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit}>
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label small fw-bold text-navy">First Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Abebe"
                      value={regFirstName}
                      onChange={(e) => setRegFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-bold text-navy">Last Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Bikila"
                      value={regLastName}
                      onChange={(e) => setRegLastName(e.target.value)}
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
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-text text-muted small">
                    Use your Telebirr or CBE Birr phone number for payouts.
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
                      value={regTelegram}
                      onChange={(e) => setRegTelegram(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label small fw-bold text-navy">Create Password *</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Min. 6 characters"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
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
                      <span>Complete Registration</span>
                      <i className="bi bi-check-circle-fill"></i>
                    </>
                  )}
                </button>

                <div className="text-center mt-3 small text-muted">
                  Already have an account?{' '}
                  <button
                    type="button"
                    className="btn btn-link p-0 small fw-bold text-primary text-decoration-none"
                    onClick={() => {
                      setActiveTab('login');
                      setErrorMsg('');
                    }}
                  >
                    Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
