import React from 'react';
import Link from 'next/link';

export default function HowItWorksPage() {
  return (
    <div className="container py-5 max-w-900 mx-auto">
      <div className="text-center mb-5">
        <span className="badge bg-primary text-white px-3 py-1 fw-bold text-uppercase rounded-pill">
          TRANSPARENT & SIMPLE
        </span>
        <h1 className="display-5 fw-extrabold text-navy mt-2">How Yalfal Online Eta Works</h1>
        <p className="lead text-muted">
          Your journey from picking a lucky number to celebrating a cash prize.
        </p>
      </div>

      <div className="row g-4 mb-5">
        {[
          {
            step: 'Step 01',
            icon: '🎟',
            title: 'Select Your Lucky Number (1–200)',
            body: 'Each lottery round consists of strictly 200 numbers. Browse the live grid on the website or through our Telegram bot (@yalfalonlinebot). Click any open number to reserve it.',
          },
          {
            step: 'Step 02',
            icon: '💳',
            title: 'Pay the 100 ETB Entry Fee',
            body: 'Transfer exact 100 ETB to our verified Commercial Bank of Ethiopia (CBE) account or Ethio Telecom Telebirr mobile number. Each number is priced equally at 100 ETB.',
          },
          {
            step: 'Step 03',
            icon: '📄',
            title: 'Upload Your Payment Receipt',
            body: 'Attach your transfer screenshot or PDF receipt. Our platform computes an anti-fraud SHA-256 hash to verify receipt uniqueness.',
          },
          {
            step: 'Step 04',
            icon: '🛡️',
            title: 'Administrative Verification',
            body: 'Authorized staff review the receipt details. Upon approval, your ticket turns permanently CONFIRMED, and you receive an immediate notification.',
          },
          {
            step: 'Step 05',
            icon: '🎡',
            title: 'Live Verifiable Draw & Instant Payout',
            body: 'As soon as all 200 numbers are filled, the cryptographic draw engine spins. 1st Prize (10,000 ETB), 2nd Prize (1,000 ETB), and 3rd Prize (500 ETB) are immediately awarded!',
          },
        ].map((item, idx) => (
          <div className="col-12" key={idx}>
            <div className="glass-card p-4 border d-flex flex-column flex-md-row gap-4 align-items-start">
              <div className="fs-1 p-3 rounded-3 bg-light border text-center" style={{ minWidth: '80px' }}>
                {item.icon}
              </div>
              <div>
                <div className="text-gold-dark fw-bold small text-uppercase">{item.step}</div>
                <h4 className="fw-bold text-navy my-1">{item.title}</h4>
                <p className="text-muted mb-0">{item.body}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card bg-gradient-navy text-white p-4 p-md-5 text-center rounded-4 shadow">
        <h3 className="fw-bold mb-2">Ready to Test Your Luck?</h3>
        <p className="text-white-50 mb-4 max-w-500 mx-auto">
          Numbers go fast! Select your preferred number from 1 to 200 and enter the current draw.
        </p>
        <div>
          <Link href="/tickets" className="btn btn-gold btn-lg px-5 py-3 fw-bold">
            🎟 Choose My Number Now
          </Link>
        </div>
      </div>
    </div>
  );
}
