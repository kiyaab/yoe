'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '../../lib/api';

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const ticketId = searchParams.get('ticketId');

  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<'CBE' | 'TELEBIRR'>('TELEBIRR');
  const [reference, setReference] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittedStatus, setSubmittedStatus] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedText, setCopiedText] = useState('');

  useEffect(() => {
    async function loadPaymentMethods() {
      try {
        const methods = await api.getPaymentMethods();
        setPaymentMethods(methods);
      } catch (err: any) {
        setErrorMessage('Could not load payment methods');
      } finally {
        setLoading(false);
      }
    }
    loadPaymentMethods();
  }, []);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(''), 2500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      if (selectedFile.size > 5 * 1024 * 1024) {
        setErrorMessage('File exceeds the 5MB size limit.');
        return;
      }

      setFile(selectedFile);
      setErrorMessage('');

      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleSubmitReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketId) {
      setErrorMessage('No reserved ticket specified. Please select a ticket number first.');
      return;
    }
    if (!file) {
      setErrorMessage('Please attach your payment receipt screenshot or PDF.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      // 1. Create payment entry
      const payment = await api.createPayment({
        ticketId,
        method: selectedMethod,
        reference: reference.trim() || undefined,
        amount: 100.0,
      });

      // 2. Upload receipt file
      await api.uploadReceipt(payment.id, file);

      setSubmittedStatus({
        ticketId,
        paymentId: payment.id,
        reference: payment.reference,
        method: selectedMethod,
        amount: 100.0,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Error submitting payment receipt.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentMethodData = paymentMethods.find((m) => m.code === selectedMethod) || {
    accountName: selectedMethod === 'CBE' ? 'Yalfal Online Eta Ltd.' : 'Yalfal Online Eta',
    accountNumber: selectedMethod === 'CBE' ? '1000234567891' : '0911223344',
    instructions:
      selectedMethod === 'CBE'
        ? 'Transfer exact 100 ETB to our CBE account. Capture a screenshot of the receipt showing reference.'
        : 'Send 100 ETB via Telebirr. Take a screenshot or PDF showing the confirmation transaction code.',
  };

  if (submittedStatus) {
    return (
      <div className="container py-5 text-center max-w-600 mx-auto">
        <div className="glass-card p-5 border-2 border-warning">
          <div className="display-3 mb-3">⏳</div>
          <span className="badge bg-warning text-dark px-3 py-2 fw-bold text-uppercase rounded-pill mb-2">
            PENDING VERIFICATION
          </span>
          <h2 className="fw-extrabold text-navy mt-2">Payment Receipt Submitted</h2>
          <p className="text-muted mb-4">
            Your receipt has been submitted to the admin queue. Once verified, your ticket will 
            be permanently confirmed for the draw!
          </p>

          <div className="bg-light p-4 rounded-3 text-start mb-4 border">
            <div className="d-flex justify-content-between py-2 border-bottom">
              <span className="text-muted">Amount</span>
              <span className="fw-bold text-navy">100 ETB</span>
            </div>
            <div className="d-flex justify-content-between py-2 border-bottom">
              <span className="text-muted">Method</span>
              <span className="fw-bold text-navy">{submittedStatus.method}</span>
            </div>
            <div className="d-flex justify-content-between py-2 border-bottom">
              <span className="text-muted">Reference</span>
              <span className="font-monospace small text-navy">{submittedStatus.reference}</span>
            </div>
            <div className="d-flex justify-content-between py-2">
              <span className="text-muted">Status</span>
              <span className="badge bg-warning text-dark">Pending Verification</span>
            </div>
          </div>

          <div className="d-flex flex-column gap-2">
            <button
              onClick={() => router.push('/dashboard')}
              className="btn btn-navy py-3 fw-bold"
            >
              View in My Dashboard →
            </button>
            <button
              onClick={() => router.push('/tickets')}
              className="btn btn-outline-secondary py-2"
            >
              Return to Ticket Grid
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5 max-w-800 mx-auto">
      <div className="text-center mb-4">
        <span className="badge bg-primary text-white px-3 py-1 fw-bold text-uppercase rounded-pill mb-1">
          STEP 2 OF 3 • PAYMENT INSTRUCTIONS
        </span>
        <h2 className="fw-extrabold text-navy">Pay 100 ETB Entry Fee</h2>
        <p className="text-muted small">
          Choose your preferred Ethiopian payment method, transfer 100 ETB, and upload your receipt below.
        </p>
      </div>

      {errorMessage && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-4">
          <i className="bi bi-exclamation-triangle-fill fs-5"></i>
          <div>{errorMessage}</div>
        </div>
      )}

      {/* Payment Method Switcher */}
      <div className="row g-3 mb-4">
        <div className="col-6">
          <div
            onClick={() => setSelectedMethod('TELEBIRR')}
            className={`p-3 rounded-3 text-center border-2 cursor-pointer transition ${
              selectedMethod === 'TELEBIRR'
                ? 'border-warning bg-warning bg-opacity-10 shadow-sm'
                : 'border bg-white'
            }`}
            style={{ cursor: 'pointer' }}
          >
            <div className="fs-2 mb-1">📱</div>
            <h5 className="fw-bold mb-0 text-navy">Telebirr</h5>
            <small className="text-muted">Ethio Telecom Mobile Money</small>
          </div>
        </div>

        <div className="col-6">
          <div
            onClick={() => setSelectedMethod('CBE')}
            className={`p-3 rounded-3 text-center border-2 cursor-pointer transition ${
              selectedMethod === 'CBE'
                ? 'border-warning bg-warning bg-opacity-10 shadow-sm'
                : 'border bg-white'
            }`}
            style={{ cursor: 'pointer' }}
          >
            <div className="fs-2 mb-1">🏦</div>
            <h5 className="fw-bold mb-0 text-navy">CBE Bank</h5>
            <small className="text-muted">Commercial Bank of Ethiopia</small>
          </div>
        </div>
      </div>

      {/* Account Details Box */}
      <div className="glass-card p-4 mb-4 border">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold text-navy mb-0">
            {selectedMethod === 'CBE' ? 'Commercial Bank of Ethiopia (CBE)' : 'Telebirr'} Account
          </h5>
          <span className="badge bg-success text-white">Verified Platform Account</span>
        </div>

        <div className="bg-light p-3 rounded-3 mb-3 border">
          <div className="row g-2 align-items-center">
            <div className="col-sm-4 text-muted small">Account Name</div>
            <div className="col-sm-8 fw-bold text-navy">{currentMethodData.accountName}</div>

            <div className="col-sm-4 text-muted small">
              {selectedMethod === 'CBE' ? 'Account Number' : 'Phone Number'}
            </div>
            <div className="col-sm-8 d-flex align-items-center gap-2">
              <span className="fw-bolder fs-5 text-navy font-monospace">
                {currentMethodData.accountNumber}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(currentMethodData.accountNumber, 'acc')}
                className="btn btn-sm btn-outline-primary py-1 px-2"
              >
                <i className="bi bi-clipboard me-1"></i>
                {copiedText === 'acc' ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <div className="col-sm-4 text-muted small">Amount to Transfer</div>
            <div className="col-sm-8 fw-extrabold text-gold-dark fs-5">100.00 ETB</div>
          </div>
        </div>

        <div className="small text-muted">
          <i className="bi bi-info-circle me-1 text-primary"></i>
          {currentMethodData.instructions}
        </div>
      </div>

      {/* Receipt Uploader Form */}
      <div className="glass-card p-4 border">
        <h5 className="fw-bold text-navy mb-3">Upload Payment Receipt</h5>
        <form onSubmit={handleSubmitReceipt}>
          <div className="mb-3">
            <label className="form-label small fw-bold text-navy">
              Transaction Reference / SMS Code (Optional)
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. TXN9812489 or Telebirr reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label small fw-bold text-navy">
              Receipt Screenshot or PDF <span className="text-danger">*</span>
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="form-control"
              onChange={handleFileChange}
              required
            />
            <div className="form-text small">
              Supported: JPG, PNG, WEBP, PDF. Maximum size: 5 MB.
            </div>
          </div>

          {filePreview && (
            <div className="mb-3 text-center">
              <div className="small text-muted mb-1">Receipt Preview:</div>
              <img
                src={filePreview}
                alt="Receipt preview"
                className="img-thumbnail rounded shadow-sm"
                style={{ maxHeight: '200px' }}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !file}
            className="btn btn-gold btn-lg w-100 py-3 fw-bold d-flex align-items-center justify-content-center gap-2"
          >
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status"></span>
                <span>Uploading & Verifying Hash...</span>
              </>
            ) : (
              <>
                <span>Submit Receipt for Verification</span>
                <i className="bi bi-check-circle-fill"></i>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="container py-5 text-center">Loading payment screen...</div>}>
      <PaymentContent />
    </Suspense>
  );
}
