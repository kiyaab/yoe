import React from 'react';

export default function RulesPage() {
  return (
    <div className="container py-5 max-w-800 mx-auto">
      <div className="text-center mb-5">
        <span className="badge bg-warning text-dark px-3 py-1 fw-bold text-uppercase rounded-pill">
          OFFICIAL LOTTERY RULES
        </span>
        <h1 className="display-5 fw-extrabold text-navy mt-2">Draw Rules & Prize Structure</h1>
        <p className="text-muted">
          Clear, immutable, and transparent guidelines governing every Yalfal Online Eta draw.
        </p>
      </div>

      <div className="glass-card p-4 p-md-5 border mb-4">
        <h4 className="fw-bold text-navy mb-3">1. Draw Capacity & Revenue</h4>
        <p className="text-muted">
          Every draw contains exactly <strong>200 numbers</strong>, ranging from <strong>001 to 200</strong>. 
          Each number is sold at an exact fixed price of <strong>100 ETB</strong>. Total maximum ticket revenue per round is 
          <strong> 20,000 ETB</strong> (200 × 100 ETB).
        </p>

        <h4 className="fw-bold text-navy mb-3 mt-4">2. Prize Distribution (11,500 ETB Total)</h4>
        <ul className="text-muted">
          <li className="mb-2"><strong>🥇 1st Prize: 10,000 ETB</strong> — Awarded to the primary winning ticket.</li>
          <li className="mb-2"><strong>🥈 2nd Prize: 1,000 ETB</strong> — Awarded to a second unique ticket (excluding the 1st prize winner).</li>
          <li className="mb-2"><strong>🥉 3rd Prize: 500 ETB</strong> — Awarded to a third unique ticket (excluding the 1st and 2nd prize winners).</li>
        </ul>

        <h4 className="fw-bold text-navy mb-3 mt-4">3. Eligibility & Age Restriction</h4>
        <p className="text-muted">
          Participants must be at least <strong>18 years of age</strong> and legally capable of entering digital contests 
          under applicable laws of the Federal Democratic Republic of Ethiopia.
        </p>

        <h4 className="fw-bold text-navy mb-3 mt-4">4. Cryptographic Winner Selection</h4>
        <p className="text-muted">
          The winner is never determined by client-side browser animations. The backend uses Node.js cryptographically 
          secure pseudorandom number generators (CSPRNG) backed by OS system entropy pools and SHA-256 seed hashing.
        </p>

        <h4 className="fw-bold text-navy mb-3 mt-4">5. Payment Verification & Receipts</h4>
        <p className="text-muted mb-0">
          Only tickets with verified receipts (CBE or Telebirr) enter the draw. Receipts are hashed with SHA-256 
          to block duplicate receipt submissions. If a payment is rejected, the number is immediately released back to the pool.
        </p>
      </div>
    </div>
  );
}
