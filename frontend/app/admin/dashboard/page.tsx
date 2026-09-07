'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      const token = localStorage.getItem('yalfal_admin_token') || '';
      try {
        const data = await api.getAdminStats(token);
        setStats(data);
      } catch (err) {
        console.error('Error loading dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <div className="text-muted mt-2">Loading live metrics from PostgreSQL...</div>
      </div>
    );
  }

  const cards = [
    {
      title: 'TOTAL REVENUE',
      value: `${(stats?.totalRevenue || 0).toLocaleString()} ETB`,
      icon: 'bi-cash-coin',
      bg: 'bg-primary',
      desc: 'Real verified payments',
    },
    {
      title: 'TICKETS SOLD',
      value: `${stats?.ticketsSold || 0} / 200`,
      icon: 'bi-ticket-detailed',
      bg: 'bg-success',
      desc: 'Confirmed numbers in active draw',
    },
    {
      title: 'PENDING PAYMENTS',
      value: stats?.pendingPayments || 0,
      icon: 'bi-hourglass-split',
      bg: 'bg-warning text-dark',
      desc: 'Awaiting admin receipt review',
      link: '/admin/receipts',
    },
    {
      title: 'APPROVED PAYMENTS',
      value: stats?.approvedPayments || 0,
      icon: 'bi-check-circle',
      bg: 'bg-info text-dark',
      desc: 'Successfully entered tickets',
    },
    {
      title: 'CURRENT ROUND',
      value: stats?.currentRound ? `#${String(stats.currentRound).padStart(3, '0')}` : 'N/A',
      icon: 'bi-disc',
      bg: 'bg-dark',
      desc: 'Active draw stage',
    },
    {
      title: 'AVAILABLE NUMBERS',
      value: stats?.availableNumbers || 0,
      icon: 'bi-grid-3x3',
      bg: 'bg-secondary',
      desc: 'Open for registration',
    },
  ];

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="fw-extrabold text-navy mb-1">Live Overview Dashboard</h3>
          <p className="text-muted small mb-0">
            Real-time statistics synchronized directly with PostgreSQL database.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Link href="/admin/spin" className="btn btn-gold fw-bold d-flex align-items-center gap-2">
            <span>🎡</span>
            <span>Open Spin Wheel Draw</span>
          </Link>
          <Link href="/admin/receipts" className="btn btn-navy d-flex align-items-center gap-2">
            <i className="bi bi-receipt"></i>
            <span>Review Receipts ({stats?.pendingPayments || 0})</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="row g-3 mb-4">
        {cards.map((card, idx) => (
          <div className="col-md-6 col-lg-4" key={idx}>
            <div className="card h-100 shadow-sm border-0 p-3 bg-white">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="small text-muted fw-bold text-uppercase">{card.title}</span>
                <div className={`p-2 rounded-3 ${card.bg} text-white d-flex align-items-center justify-content-center`}>
                  <i className={`bi ${card.icon} fs-5`}></i>
                </div>
              </div>
              <div className="display-6 fw-extrabold text-navy mb-1">{card.value}</div>
              <div className="small text-muted d-flex justify-content-between align-items-center">
                <span>{card.desc}</span>
                {card.link && (
                  <Link href={card.link} className="text-primary fw-bold text-decoration-none">
                    Review →
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Operation Guidance */}
      <div className="card shadow-sm border-0 p-4 bg-white">
        <h5 className="fw-bold text-navy mb-3">Operator Workflow Guidelines</h5>
        <div className="row g-3">
          <div className="col-md-4">
            <div className="p-3 bg-light rounded-3 border h-100">
              <h6 className="fw-bold text-navy">1. Payment Verification</h6>
              <p className="small text-muted mb-2">
                Inspect receipts in <strong>Receipt Review</strong>. Verify amount equals 100 ETB and transaction reference matches.
              </p>
              <Link href="/admin/receipts" className="btn btn-sm btn-outline-primary">
                Open Queue →
              </Link>
            </div>
          </div>
          <div className="col-md-4">
            <div className="p-3 bg-light rounded-3 border h-100">
              <h6 className="fw-bold text-navy">2. Lottery Capacity</h6>
              <p className="small text-muted mb-2">
                Each round accommodates exactly 200 numbers. When all 200 are approved, the draw engine is unlocked.
              </p>
              <Link href="/admin/rounds" className="btn btn-sm btn-outline-primary">
                View Rounds →
              </Link>
            </div>
          </div>
          <div className="col-md-4">
            <div className="p-3 bg-light rounded-3 border h-100">
              <h6 className="fw-bold text-navy">3. Live Spin Wheel</h6>
              <p className="small text-muted mb-2">
                Draw 1st (10,000 ETB), 2nd (1,000 ETB), and 3rd (500 ETB) prizes using verifiable cryptographic selection.
              </p>
              <Link href="/admin/spin" className="btn btn-sm btn-outline-warning text-dark fw-bold">
                Launch Wheel →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
