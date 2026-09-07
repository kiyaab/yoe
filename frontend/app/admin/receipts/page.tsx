'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../../lib/api';

export default function AdminReceiptsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('PENDING');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('Receipt unreadable');
  const [customReason, setCustomReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [alert, setAlert] = useState<{ type: string; msg: string } | null>(null);

  const loadPayments = async () => {
    setLoading(true);
    const token = localStorage.getItem('yalfal_admin_token') || '';
    try {
      const res = await api.getAdminPayments(token, {
        status: filterStatus ? filterStatus : undefined,
      });
      setPayments(res.payments);
      if (res.payments.length > 0) {
        setSelectedPayment(res.payments[0]);
      } else {
        setSelectedPayment(null);
      }
    } catch (err: any) {
      setAlert({ type: 'danger', msg: err.message || 'Error loading payments' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [filterStatus]);

  const handleApprove = async () => {
    if (!selectedPayment) return;
    setProcessing(true);
    const token = localStorage.getItem('yalfal_admin_token') || '';
    try {
      await api.reviewPayment(token, selectedPayment.id, 'APPROVED');
      setAlert({
        type: 'success',
        msg: `Payment for Ticket #${selectedPayment.ticket.ticketNumber} successfully approved!`,
      });
      loadPayments();
    } catch (err: any) {
      setAlert({ type: 'danger', msg: err.message || 'Approval failed' });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPayment) return;
    setProcessing(true);
    const token = localStorage.getItem('yalfal_admin_token') || '';
    const finalReason = rejectionReason === 'Other' ? customReason : rejectionReason;

    try {
      await api.reviewPayment(token, selectedPayment.id, 'REJECTED', finalReason);
      setAlert({
        type: 'warning',
        msg: `Payment rejected. Ticket #${selectedPayment.ticket.ticketNumber} released back to pool.`,
      });
      setShowRejectModal(false);
      loadPayments();
    } catch (err: any) {
      setAlert({ type: 'danger', msg: err.message || 'Rejection failed' });
    } finally {
      setProcessing(false);
    }
  };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-extrabold text-navy mb-0">Receipt Verification Desk</h3>
          <p className="text-muted small mb-0">
            Inspect uploaded bank transfer receipts and approve or reject ticket entries.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="d-flex gap-2">
          {['PENDING', 'APPROVED', 'REJECTED', ''].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`btn btn-sm px-3 fw-semibold ${
                filterStatus === s ? 'btn-navy' : 'btn-outline-secondary'
              }`}
            >
              {s ? s : 'ALL'}
            </button>
          ))}
        </div>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type} alert-dismissible fade show mb-4`} role="alert">
          {alert.msg}
          <button type="button" className="btn-close" onClick={() => setAlert(null)}></button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <div className="text-muted mt-2">Loading receipts queue...</div>
        </div>
      ) : payments.length === 0 ? (
        <div className="card shadow-sm border-0 p-5 text-center bg-white">
          <div className="display-4 mb-2">🎉</div>
          <h5 className="fw-bold text-navy">No Receipts In This Category</h5>
          <p className="text-muted">The review queue is currently empty.</p>
        </div>
      ) : (
        <div className="row g-4">
          {/* Left Column: Payment Queue List */}
          <div className="col-lg-4">
            <div className="card shadow-sm border-0 bg-white h-100 overflow-hidden">
              <div className="card-header bg-light fw-bold text-navy small py-3">
                PAYMENT QUEUE ({payments.length})
              </div>
              <div className="list-group list-group-flush overflow-auto" style={{ maxHeight: '700px' }}>
                {payments.map((p) => {
                  const isSelected = selectedPayment?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPayment(p)}
                      className={`list-group-item list-group-item-action p-3 text-start border-bottom ${
                        isSelected ? 'bg-primary bg-opacity-10 border-start border-4 border-primary' : ''
                      }`}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="fw-extrabold text-navy">
                          Ticket #{String(p.ticket?.ticketNumber).padStart(3, '0')}
                        </span>
                        <span
                          className={`badge ${
                            p.status === 'APPROVED'
                              ? 'bg-success'
                              : p.status === 'RESERVED' || p.status === 'PENDING'
                              ? 'bg-warning text-dark'
                              : 'bg-danger'
                          }`}
                        >
                          {p.status}
                        </span>
                      </div>
                      <div className="small text-muted">
                        User: @{p.user?.username || p.user?.firstName || p.user?.telegramId}
                      </div>
                      <div className="d-flex justify-content-between small mt-2">
                        <span className="fw-semibold text-primary">{p.method}</span>
                        <span className="text-muted font-monospace">{p.amount} ETB</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Side-by-Side Receipt Preview & Review Controls */}
          {selectedPayment && (
            <div className="col-lg-8">
              <div className="card shadow-sm border-0 bg-white p-4 h-100">
                <div className="row g-4">
                  {/* Receipt Preview */}
                  <div className="col-md-7 border-end">
                    <h6 className="fw-bold text-navy mb-3">Receipt Document Preview</h6>
                    {selectedPayment.receipt ? (
                      <div className="text-center bg-light p-2 rounded-3 border">
                        <img
                          src={`${apiUrl}/receipts/${selectedPayment.receipt.id}/file`}
                          alt="Receipt"
                          className="img-fluid rounded shadow-sm"
                          style={{ maxHeight: '500px', objectFit: 'contain' }}
                        />
                        <div className="mt-2 small text-muted font-monospace">
                          SHA-256: {selectedPayment.receipt.hash.substring(0, 16)}...
                        </div>
                      </div>
                    ) : (
                      <div className="bg-light p-5 rounded-3 text-center text-muted">
                        <i className="bi bi-file-earmark-x fs-1 d-block mb-2"></i>
                        No file uploaded for this payment record
                      </div>
                    )}
                  </div>

                  {/* Payment Details & Actions */}
                  <div className="col-md-5 d-flex flex-column justify-content-between">
                    <div>
                      <h6 className="fw-bold text-navy mb-3">Payment Details</h6>
                      <div className="bg-light p-3 rounded-3 small mb-4 border">
                        <div className="mb-2">
                          <span className="text-muted d-block">Ticket Number</span>
                          <span className="fs-4 fw-extrabold text-navy">
                            #{String(selectedPayment.ticket?.ticketNumber).padStart(3, '0')}
                          </span>
                        </div>
                        <div className="mb-2">
                          <span className="text-muted d-block">Amount</span>
                          <span className="fw-bold text-navy fs-5">{selectedPayment.amount} ETB</span>
                        </div>
                        <div className="mb-2">
                          <span className="text-muted d-block">Method</span>
                          <span className="fw-bold text-navy">{selectedPayment.method}</span>
                        </div>
                        <div className="mb-2">
                          <span className="text-muted d-block">Telegram User</span>
                          <span className="fw-bold text-navy">
                            @{selectedPayment.user?.username || 'N/A'} (ID: {selectedPayment.user?.telegramId})
                          </span>
                        </div>
                        <div className="mb-2">
                          <span className="text-muted d-block">Transaction Reference</span>
                          <span className="font-monospace text-navy">{selectedPayment.reference}</span>
                        </div>
                        <div>
                          <span className="text-muted d-block">Submitted Date</span>
                          <span className="text-navy">
                            {new Date(selectedPayment.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {selectedPayment.status === 'PENDING' ? (
                      <div className="d-flex flex-column gap-2">
                        <button
                          onClick={handleApprove}
                          disabled={processing}
                          className="btn btn-success py-3 fw-bold d-flex align-items-center justify-content-center gap-2"
                        >
                          <i className="bi bi-check-circle-fill"></i>
                          <span>APPROVE PAYMENT</span>
                        </button>
                        <button
                          onClick={() => setShowRejectModal(true)}
                          disabled={processing}
                          className="btn btn-outline-danger py-2 fw-semibold"
                        >
                          REJECT WITH REASON
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 bg-light rounded-3 text-center border">
                        <span className="small text-muted">Reviewed Status: </span>
                        <strong className="text-navy">{selectedPayment.status}</strong>
                        {selectedPayment.rejectionReason && (
                          <div className="small text-danger mt-1">
                            Reason: {selectedPayment.rejectionReason}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reject Reason Modal */}
      {showRejectModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title fw-bold">Reject Payment Receipt</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowRejectModal(false)}
                ></button>
              </div>
              <div className="modal-body p-4">
                <p className="text-muted small mb-3">
                  Please select a verified reason for rejecting this payment. The participant will 
                  be notified immediately and the ticket will be released back to the available pool.
                </p>

                <div className="mb-3">
                  <label className="form-label small fw-bold">Rejection Reason</label>
                  <select
                    className="form-select"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  >
                    <option value="Receipt unreadable">Receipt unreadable</option>
                    <option value="Wrong amount">Wrong amount (Less than 100 ETB)</option>
                    <option value="Duplicate receipt">Duplicate receipt</option>
                    <option value="Invalid payment">Invalid payment / Not received</option>
                    <option value="Other">Other reason...</option>
                  </select>
                </div>

                {rejectionReason === 'Other' && (
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Specify Reason</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      placeholder="Explain rejection reason..."
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                    ></textarea>
                  </div>
                )}
              </div>
              <div className="modal-footer bg-light">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowRejectModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={processing}
                  className="btn btn-danger"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
