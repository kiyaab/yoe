import React from 'react';

export default function SupportPage() {
  return (
    <div className="container py-5 max-w-700 mx-auto">
      <div className="text-center mb-5">
        <span className="badge bg-success text-white px-3 py-1 fw-bold text-uppercase rounded-pill">
          24/7 DEDICATED ASSISTANCE
        </span>
        <h1 className="display-5 fw-extrabold text-navy mt-2">Customer Support</h1>
        <p className="text-muted">
          Need help with ticket reservation, payment confirmation, or prize claims? Reach out anytime.
        </p>
      </div>

      <div className="glass-card p-4 p-md-5 border mb-4">
        <div className="d-flex align-items-center gap-3 mb-4 p-3 bg-light rounded-3 border">
          <div className="fs-1 text-primary">
            <i className="bi bi-telegram"></i>
          </div>
          <div>
            <h5 className="fw-bold text-navy mb-0">Telegram Direct Support</h5>
            <div className="text-muted small">Instant response within minutes</div>
            <a href="https://t.me/YalfalSupport" target="_blank" rel="noreferrer" className="fw-bold text-primary text-decoration-none">
              @YalfalSupport →
            </a>
          </div>
        </div>

        <div className="d-flex align-items-center gap-3 mb-4 p-3 bg-light rounded-3 border">
          <div className="fs-1 text-success">
            <i className="bi bi-telephone"></i>
          </div>
          <div>
            <h5 className="fw-bold text-navy mb-0">Phone Helpline</h5>
            <div className="text-muted small">Open 24 hours / 7 days a week</div>
            <span className="fw-bold text-navy font-monospace">+251 91 100 0000</span>
          </div>
        </div>

        <div className="d-flex align-items-center gap-3 p-3 bg-light rounded-3 border">
          <div className="fs-1 text-warning">
            <i className="bi bi-geo-alt"></i>
          </div>
          <div>
            <h5 className="fw-bold text-navy mb-0">Operating Office</h5>
            <div className="text-muted small">Bole Subcity, Addis Ababa, Ethiopia</div>
          </div>
        </div>
      </div>
    </div>
  );
}
