import React from 'react';

export default function PrivacyPage() {
  return (
    <div className="container py-5 max-w-800 mx-auto">
      <div className="glass-card p-4 p-md-5 border">
        <span className="badge bg-secondary text-white px-3 py-1 mb-2">PRIVACY POLICY</span>
        <h2 className="fw-extrabold text-navy mb-4">Privacy & Data Protection</h2>
        <p className="text-muted">
          At Yalfal Online Eta, we prioritize the protection and confidentiality of our participants’ 
          information. This Privacy Policy details how we collect, handle, and secure your data.
        </p>

        <h5 className="fw-bold text-navy mt-4">1. Information We Collect</h5>
        <p className="text-muted">
          We collect your Telegram ID, Telegram username, transaction reference numbers, and payment receipt screenshots. 
          We do not store banking passwords or credit card PINs.
        </p>

        <h5 className="fw-bold text-navy mt-4">2. Receipt Security & Deduplication</h5>
        <p className="text-muted">
          Receipt images are stored securely on our protected servers. A cryptographic SHA-256 hash is generated 
          to protect the community against counterfeit or duplicate receipt submissions.
        </p>

        <h5 className="fw-bold text-navy mt-4">3. Winner Publicity</h5>
        <p className="text-muted mb-0">
          To maintain transparency, winning ticket numbers and public Telegram usernames are published on our Hall of Winners. 
          Private banking details and contact phone numbers are never shared publicly.
        </p>
      </div>
    </div>
  );
}
