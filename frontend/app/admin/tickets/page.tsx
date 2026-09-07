'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../../lib/api';

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [round, setRound] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadTickets() {
      try {
        const res = await api.getTickets();
        setRound(res.round);
        setTickets(res.tickets);
      } catch (err) {
        console.error('Error loading tickets:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTickets();
  }, []);

  const filtered = tickets.filter((t) => {
    if (!search.trim()) return true;
    return t.ticketNumber.toString().includes(search.trim());
  });

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-extrabold text-navy mb-0">Tickets Overview (1–200)</h3>
          <p className="text-muted small mb-0">
            Round #{round?.roundNumber || '001'} • 100 ETB Entry Fee
          </p>
        </div>
        <div className="w-25">
          <input
            type="text"
            className="form-control"
            placeholder="Search ticket #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      ) : (
        <div className="card shadow-sm border-0 bg-white">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light small text-muted text-uppercase">
                <tr>
                  <th>Ticket #</th>
                  <th>Status</th>
                  <th>Reserved At</th>
                  <th>Confirmed At</th>
                  <th>Payment Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id}>
                    <td className="fw-bold text-navy">#{String(t.ticketNumber).padStart(3, '0')}</td>
                    <td>
                      <span
                        className={`badge ${
                          t.status === 'CONFIRMED'
                            ? 'bg-success'
                            : t.status === 'RESERVED'
                            ? 'bg-warning text-dark'
                            : 'bg-light text-dark border'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="small text-muted">
                      {t.reservedAt ? new Date(t.reservedAt).toLocaleString() : '—'}
                    </td>
                    <td className="small text-muted">
                      {t.confirmedAt ? new Date(t.confirmedAt).toLocaleString() : '—'}
                    </td>
                    <td>
                      {t.paymentStatus ? (
                        <span className="badge bg-primary text-white">{t.paymentStatus}</span>
                      ) : (
                        '—'
                      )}
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
