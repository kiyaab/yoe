import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gradient-navy text-white mt-auto pt-5 border-top border-white border-opacity-10">
      <div className="container pb-4">
        <div className="row g-4">
          <div className="col-lg-4 col-md-6">
            <div className="d-flex align-items-center gap-2 mb-3">
              <span className="fs-3">🎡</span>
              <div>
                <span className="fw-bold fs-5 text-white">YALFAL ONLINE ETA</span>
                <div className="text-gold small fw-bold">“Your Number. Your Chance. Your Moment.”</div>
              </div>
            </div>
            <p className="text-white-50 small mb-3">
              Ethiopia’s premier Telegram-first digital lottery platform. Transparent numbers, 
              cryptographically verifiable draws, and instant prize payouts for 1st, 2nd, and 3rd prize winners.
            </p>
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-danger text-white px-2 py-1">18+ Only</span>
              <span className="badge bg-primary text-white px-2 py-1">Ethiopia Compliant</span>
            </div>
          </div>

          <div className="col-lg-2 col-md-6 col-6">
            <h6 className="text-gold fw-bold mb-3 text-uppercase small">Platform</h6>
            <ul className="list-unstyled text-white-50 small d-flex flex-column gap-2">
              <li><Link href="/tickets" className="text-decoration-none text-white-50 hover-text-white">Choose Number</Link></li>
              <li><Link href="/how-it-works" className="text-decoration-none text-white-50 hover-text-white">How It Works</Link></li>
              <li><Link href="/winners" className="text-decoration-none text-white-50 hover-text-white">Past Winners</Link></li>
              <li><Link href="/rules" className="text-decoration-none text-white-50 hover-text-white">Rules & Prizes</Link></li>
            </ul>
          </div>

          <div className="col-lg-2 col-md-6 col-6">
            <h6 className="text-gold fw-bold mb-3 text-uppercase small">Compliance</h6>
            <ul className="list-unstyled text-white-50 small d-flex flex-column gap-2">
              <li><Link href="/faq" className="text-decoration-none text-white-50 hover-text-white">FAQ</Link></li>
              <li><Link href="/terms" className="text-decoration-none text-white-50 hover-text-white">Terms of Service</Link></li>
              <li><Link href="/privacy" className="text-decoration-none text-white-50 hover-text-white">Privacy Policy</Link></li>
              <li><Link href="/support" className="text-decoration-none text-white-50 hover-text-white">24/7 Support</Link></li>
            </ul>
          </div>

          <div className="col-lg-4 col-md-6">
            <h6 className="text-gold fw-bold mb-3 text-uppercase small">Support & Channels</h6>
            <div className="text-white-50 small mb-2">
              <i className="bi bi-telegram text-gold me-2"></i>
              Official Telegram Bot: <a href="https://t.me/yalfalonlinebot" target="_blank" rel="noreferrer" className="text-gold text-decoration-none">@yalfalonlinebot</a>
            </div>
            <div className="text-white-50 small mb-2">
              <i className="bi bi-telephone text-gold me-2"></i>
              Helpline: +251 91 100 0000
            </div>
            <div className="text-white-50 small">
              <i className="bi bi-shield-check text-gold me-2"></i>
              Payment Accounts: CBE & Telebirr Verified
            </div>
          </div>
        </div>

        <hr className="my-4 border-white border-opacity-10" />

        <div className="d-flex flex-column flex-md-row align-items-center justify-content-between text-white-50 small">
          <div>© {new Date().getFullYear()} Yalfal Online Eta. All rights reserved. Addis Ababa, Ethiopia.</div>
          <div className="d-flex align-items-center gap-3 mt-2 mt-md-0">
            <span>Commercial Bank of Ethiopia (CBE)</span>
            <span>•</span>
            <span>Ethio Telecom Telebirr</span>
          </div>
        </div>
      </div>
      <div className="ethiopia-strip"></div>
    </footer>
  );
}
