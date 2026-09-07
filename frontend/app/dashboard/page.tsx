'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';
import { useAuth } from '../../components/AuthContext';

export default function UserDashboard() {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadUserTickets = async (id: string) => {
    setLoading(true);
    try {
      const data = await api.getMyTickets(id);
      setTickets(data);
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const activeId = user?.telegramId || localStorage.getItem('yalfal_user_telegram_id');
    if (activeId) {
      loadUserTickets(activeId);
    }
  }, [user]);

  if (!isAuthenticated && !user) {
    return (
      <div className="container py-5 text-center">
        <div className="card shadow-lg border-0 rounded-4 p-5 max-w-500 mx-auto bg-white">
          <div className="display-3 mb-3">🔒</div>
          <h3 className="fw-extrabold text-navy mb-2">Authentication Required</h3>
          <p className="text-muted mb-4">
            Please sign in with your Ethiopian phone number or Telegram account to view your purchased tickets, payment verifications, and draw status.
          </p>
          <div className="d-flex gap-2 justify-content-center">
            <button
              onClick={() => openAuthModal('login', 'Sign in to access your personal tickets dashboard')}
              className="btn btn-navy px-4 py-2 fw-bold"
            >
              Sign In
            </button>
            <button
              onClick={() => openAuthModal('register', 'Create an account to track your lottery numbers')}
              className="btn btn-gold text-navy px-4 py-2 fw-bold"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <span className="badge bg-primary text-white px-3 py-1 rounded-pill mb-1">USER DASHBOARD</span>
          <h2 className="fw-extrabold text-navy mb-0">
            Welcome back, {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (user?.username ? `@${user.username}` : user?.phone)} 👋
          </h2>
          <p className="text-muted small mb-0">
            Phone: <strong>{user?.phone || 'N/A'}</strong> • ID: <code>{user?.telegramId}</code>
          </p>
        </div>

        <Link href="/tickets" className="btn btn-gold px-4 py-2 fw-bold shadow-sm">
          🎟 Choose Another Number
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <div className="text-muted mt-2">Loading your tickets...</div>
        </div>
      ) : tickets.length === 0 ? (
        <div className="glass-card p-5 text-center my-4 border">
          <div className="display-4 mb-3">🎟</div>
          <h4 className="fw-bold text-navy">No Tickets Found</h4>
          <p className="text-muted max-w-500 mx-auto mb-4">
            You haven’t entered a lottery draw with this Telegram ID yet. 
            Choose your lucky number between 1 and 200 to join the current 10,000 ETB draw!
          </p>
          <Link href="/tickets" className="btn btn-gold btn-lg px-4 py-2 fw-bold">
            Choose a Number (1–200)
          </Link>
        </div>
      ) : (
        <div className="row g-4">
          {tickets.map((ticket) => {
            const isConfirmed = ticket.status === 'CONFIRMED';
            const isPending = ticket.status === 'RESERVED';
            const hasWon = !!ticket.winner;

            return (
              <div className="col-md-6 col-lg-4" key={ticket.id}>
                <div
                  className={`glass-card p-4 h-100 border position-relative ${
                    hasWon ? 'border-warning shadow-gold' : ''
                  }`}
                >
                  {hasWon && (
                    <span className="position-absolute top-0 end-0 badge bg-warning text-dark m-3 px-3 py-1 fw-bold">
                      🏆 WINNER • {ticket.winner.position.replace('_', ' ')}
                    </span>
                  )}

                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <span className="badge bg-light text-navy border">
                      Round #{ticket.round.roundNumber}
                    </span>
                    <span
                      className={`badge ${
                        isConfirmed
                          ? 'bg-success text-white'
                          : isPending
                          ? 'bg-warning text-dark'
                          : 'bg-secondary text-white'
                      }`}
                    >
                      {isConfirmed ? '✅ Confirmed' : isPending ? '⏳ Awaiting Payment' : ticket.status}
                    </span>
                  </div>

                  <div className="text-center my-3">
                    <div className="small text-muted text-uppercase">Your Lucky Number</div>
                    <div className="display-4 fw-extrabold text-navy">
                      #{String(ticket.ticketNumber).padStart(3, '0')}
                    </div>
                  </div>

                  <div className="bg-light p-3 rounded-3 small mb-3 border">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted">Entry Fee:</span>
                      <span className="fw-bold text-navy">{ticket.round.ticketPrice} ETB</span>
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted">Payment:</span>
                      <span className="fw-bold">
                        {ticket.payment?.status || (isConfirmed ? 'APPROVED' : 'PENDING')}
                      </span>
                    </div>
                    {ticket.payment?.reference && (
                      <div className="d-flex justify-content-between mb-1">
                        <span className="text-muted">Reference:</span>
                        <span className="font-monospace text-navy">{ticket.payment.reference}</span>
                      </div>
                    )}
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Round Status:</span>
                      <span className="fw-bold text-navy">{ticket.round.status}</span>
                    </div>
                  </div>

                  {isPending && (
                    <Link
                      href={`/payment?ticketId=${ticket.id}`}
                      className="btn btn-warning w-100 fw-bold"
                    >
                      Upload Payment Receipt →
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
