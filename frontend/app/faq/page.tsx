import React from 'react';

export default function FAQPage() {
  const faqs = [
    {
      q: 'How many numbers are available in each draw?',
      a: 'Each lottery draw has strictly 200 numbers numbered from 1 to 200.',
    },
    {
      q: 'How much does one ticket cost?',
      a: 'Every ticket number costs 100 ETB. You can enter as many numbers as you wish.',
    },
    {
      q: 'Which payment methods can I use?',
      a: 'We accept payments via Commercial Bank of Ethiopia (CBE) account transfer and Ethio Telecom Telebirr.',
    },
    {
      q: 'How do I know the draw is fair and not rigged?',
      a: 'Winners are determined on our server using cryptographically secure random number facilities (CSPRNG) with SHA-256 entropy verification. The spin wheel in the admin suite is purely for presentation and synchronizes to the backend outcome.',
    },
    {
      q: 'Can one person win multiple prizes in the same round?',
      a: 'A single ticket number can only win one prize. The 1st prize winner is excluded from the 2nd and 3rd prize draws. However, if you purchased multiple distinct ticket numbers (e.g. #23 and #87), both numbers have independent chances to win!',
    },
    {
      q: 'How do I receive my prize payout?',
      a: 'Winners are contacted via Telegram or phone immediately upon completion of the draw. Funds are disbursed directly to your CBE account or Telebirr wallet within 30 minutes.',
    },
  ];

  return (
    <div className="container py-5 max-w-800 mx-auto">
      <div className="text-center mb-5">
        <span className="badge bg-primary text-white px-3 py-1 fw-bold text-uppercase rounded-pill">
          HELP & ANSWERS
        </span>
        <h1 className="display-5 fw-extrabold text-navy mt-2">Frequently Asked Questions</h1>
        <p className="text-muted">
          Everything you need to know about purchasing tickets, receipts, and prize payouts.
        </p>
      </div>

      <div className="accordion glass-card p-3 border" id="faqAccordion">
        {faqs.map((faq, idx) => (
          <div className="accordion-item border-0 mb-3 rounded-3 overflow-hidden" key={idx}>
            <h2 className="accordion-header" id={`heading-${idx}`}>
              <button
                className={`accordion-button fw-bold text-navy ${idx !== 0 ? 'collapsed' : ''}`}
                type="button"
                data-bs-toggle="collapse"
                data-bs-target={`#collapse-${idx}`}
                aria-expanded={idx === 0 ? 'true' : 'false'}
                aria-controls={`collapse-${idx}`}
              >
                {faq.q}
              </button>
            </h2>
            <div
              id={`collapse-${idx}`}
              className={`accordion-collapse collapse ${idx === 0 ? 'show' : ''}`}
              aria-labelledby={`heading-${idx}`}
              data-bs-parent="#faqAccordion"
            >
              <div className="accordion-body text-muted small">{faq.a}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
