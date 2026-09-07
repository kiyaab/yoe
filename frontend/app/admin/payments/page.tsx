'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const loadPayments = async () => {
    setLoading(true);
    const token = localStorage.getItem('yalfal_admin_token') || '';
    try {
      const res = await api.getAdminPayments(token, {
        status: statusFilter || undefined,
        search: search.trim() || undefined,
      });
      setPayments(res.payments);
    } catch (err) {
      console.error('Error loading payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadPayments();
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-extrabold text-navy mb-0">Payment Transactions</h3>
          <p className="text-muted small mb-0">
            Real PostgreSQL transaction history across CBE and Telebirr channels.
          </p>
        </div>
        <Link href="/admin/receipts" className="btn btn-navy d-flex align-items-center gap-2">
          <i className="bi bi-receipt"></i>
          <span>Open Receipt Review Desk</span>
        </Link>
      </div>

      {/* Filter and Search */}
      <div className="card shadow-sm border-0 p-3 bg-white mb-4">
        <form onSubmit={handleSearch} className="row g-2 align-items-center">
          <div className="col-md-5">
            <input
              type="text"
              className="form-control"
              placeholder="Search reference, username, or ticket #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
          <div className="col-md-2">
            <button type="submit" className="btn btn-primary w-100">
              Filter
            </button>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      ) : payments.length === 0 ? (
        <div className="card shadow-sm border-0 p-5 text-center bg-white">
          <p className="text-muted mb-0">No payment records found.</p>
        </div>
      ) : (
        <div className="card shadow-sm border-0 bg-white">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light small text-muted text-uppercase">
                <tr>
                  <th>Ticket</th>
                  <th>User</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Reference</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="fw-bold text-navy">#{String(p.ticket?.ticketNumber).padStart(3, '0')}</td>
                    <td>
                      <div>@{p.user?.username || 'user'}</div>
                      <small className="text-muted font-monospace">{p.user?.telegramId}</small>
                    </td>
                    <td className="fw-bold">{p.amount} ETB</td>
                    <td>
                      <span className="badge bg-light text-navy border">{p.method}</span>
                    </td>
                    <td className="font-monospace small">{p.reference}</td>
                    <td>
                      <span
                        className={`badge ${
                          p.status === 'APPROVED'
                            ? 'bg-success'
                            : p.status === 'PENDING'
                            ? 'bg-warning text-dark'
                            : 'bg-danger'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="small text-muted">{new Date(p.createdAt).toLocaleString()}</td>
                    <td>
                      <Link href="/admin/receipts" className="btn btn-sm btn-outline-primary">
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
