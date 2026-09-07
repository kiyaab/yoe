'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import { useAuth } from '../../components/AuthContext';

export default function TicketsPage() {
  const router = useRouter();
  const { user, isAuthenticated, openAuthModal } = useAuth();

  const [round, setRound] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState<'ALL' | 'AVAILABLE' | 'TAKEN' | 'MY'>('ALL');
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadData = async () => {
    try {
      const activeId = user?.telegramId || localStorage.getItem('yalfal_user_telegram_id') || '';
      const res = await api.getTickets(undefined, activeId);
      setRound(res.round);
      setTickets(res.tickets);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error loading tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // WebSocket real-time updates
    const socket = getSocket();
    socket.on('ticket.reserved', () => loadData());
    socket.on('ticket.confirmed', () => loadData());
    socket.on('ticket.released', () => loadData());

    return () => {
      socket.off('ticket.reserved');
      socket.off('ticket.confirmed');
      socket.off('ticket.released');
    };
  }, [user]);

  const handleTileClick = (ticket: any) => {
    if (ticket.status !== 'AVAILABLE' && !ticket.isMine) {
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
      }
      return; // Disabled
    }

    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }

    // MANDATORY WEB USER AUTH CHECK
    if (!isAuthenticated && !user) {
      openAuthModal('register', `Please sign in or create an account to pick Ticket #${String(ticket.ticketNumber).padStart(3, '0')}`);
      return;
    }

    if (selectedNumber === ticket.ticketNumber) {
      setSelectedNumber(null);
      setSelectedTicket(null);
    } else {
      setSelectedNumber(ticket.ticketNumber);
      setSelectedTicket(ticket);
      setErrorMessage('');
    }
  };

  const handleProceedToPayment = async () => {
    if (!selectedNumber || !selectedTicket) return;

    if (!isAuthenticated || !user) {
      openAuthModal('login', `Please sign in to complete reservation of Ticket #${String(selectedNumber).padStart(3, '0')}`);
      return;
    }

    setReserving(true);
    setErrorMessage('');

    try {
      const activeTelegramId = user.telegramId || (user.phone ? `web_${user.phone}` : `web_${user.id}`);
      localStorage.setItem('yalfal_user_telegram_id', activeTelegramId);

      const result = await api.reserveTicket({
        ticketNumber: selectedNumber,
        roundId: round?.id,
        telegramId: activeTelegramId,
        username: user.username || undefined,
        firstName: user.firstName || undefined,
        phone: user.phone || undefined,
      });

      // Navigate to payment screen
      router.push(`/payment?ticketId=${result.ticket.id}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'This number was just taken. Please pick another.');
      // Refresh tickets to show updated taken state
      loadData();
    } finally {
      setReserving(false);
    }
  };

  // Filter and search logic
  const filteredTickets = tickets.filter((t) => {
    if (searchQuery.trim()) {
      const q = searchQuery.trim();
      if (!t.ticketNumber.toString().includes(q)) return false;
    }

    if (filterState === 'AVAILABLE') return t.status === 'AVAILABLE';
    if (filterState === 'TAKEN') return t.status === 'CONFIRMED' || (t.status === 'RESERVED' && !t.isMine);
    if (filterState === 'MY') return t.isMine;

    return true;
  });

  const availableCount = tickets.filter((t) => t.status === 'AVAILABLE').length;
  const takenCount = tickets.filter((t) => t.status === 'CONFIRMED' || t.status === 'RESERVED').length;

  return (
    <div className="py-4 pb-5 mb-5">
      <div className="container pb-5">
        {/* Header Title */}
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="badge bg-primary text-white">Round #{round?.roundNumber || '001'}</span>
              <span className="badge bg-warning text-dark fw-bold">100 ETB / Number</span>
            </div>
            <h2 className="fw-extrabold text-navy mb-0">CHOOSE YOUR LUCKY NUMBER</h2>
            <p className="text-muted small mb-0">
              Numbers 1 to 200. Pick an open number to enter the live prize draw.
            </p>
          </div>

          {/* Legend */}
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <span className="d-flex align-items-center gap-1 small text-navy fw-semibold">
              <span className="d-inline-block rounded-2 border bg-white" style={{ width: 14, height: 14 }}></span>
              Available ({availableCount})
            </span>
            <span className="d-flex align-items-center gap-1 small text-dark fw-semibold">
              <span className="d-inline-block rounded-2 bg-gradient-gold" style={{ width: 14, height: 14 }}></span>
              Selected
            </span>
            <span className="d-flex align-items-center gap-1 small text-muted fw-semibold">
              <span className="d-inline-block rounded-2 bg-secondary" style={{ width: 14, height: 14 }}></span>
              Taken ({takenCount})
            </span>
            <span className="d-flex align-items-center gap-1 small text-success fw-semibold">
              <span className="d-inline-block rounded-2 bg-success" style={{ width: 14, height: 14 }}></span>
              My Ticket
            </span>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="glass-card p-3 mb-4">
          <div className="row g-2 align-items-center">
            <div className="col-md-5">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search number (e.g. 87)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="col-md-7">
              <div className="d-flex flex-wrap gap-2 justify-content-md-end">
                {(['ALL', 'AVAILABLE', 'TAKEN', 'MY'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilterState(f)}
                    className={`btn btn-sm px-3 py-2 fw-semibold ${
                      filterState === f ? 'btn-navy' : 'btn-outline-secondary'
                    }`}
                  >
                    {f === 'ALL' && 'All (200)'}
                    {f === 'AVAILABLE' && `Available (${availableCount})`}
                    {f === 'TAKEN' && `Taken (${takenCount})`}
                    {f === 'MY' && 'My Numbers'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="alert alert-danger d-flex align-items-center gap-2 mb-4" role="alert">
            <i className="bi bi-exclamation-triangle-fill fs-5"></i>
            <div>{errorMessage}</div>
          </div>
        )}

        {/* 1-200 GRID */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary mb-3" role="status"></div>
            <div className="text-muted">Loading live ticket grid...</div>
          </div>
        ) : (
          <div className="ticket-grid">
            {filteredTickets.map((ticket) => {
              const isSelected = selectedNumber === ticket.ticketNumber;
              const isTaken = ticket.status === 'CONFIRMED' || (ticket.status === 'RESERVED' && !ticket.isMine);
              const isMine = ticket.isMine;

              let stateClass = 'available';
              if (isSelected) stateClass = 'selected';
              else if (isMine) stateClass = 'my-number';
              else if (isTaken) stateClass = 'taken';

              return (
                <div
                  key={ticket.id}
                  onClick={() => handleTileClick(ticket)}
                  className={`ticket-tile ${stateClass}`}
                  title={`Number #${String(ticket.ticketNumber).padStart(3, '0')} — ${ticket.status}`}
                >
                  <span>{String(ticket.ticketNumber).padStart(2, '0')}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Reservation Modal / Drawer Form */}
        {selectedNumber && (
          <div className="card shadow-lg border-2 border-warning mt-4 p-4 glass-card">
            <div className="row align-items-center g-4">
              <div className="col-md-4 text-center text-md-start">
                <span className="badge bg-warning text-dark px-3 py-1 mb-2 fw-bold">SELECTED NUMBER</span>
                <div className="display-4 fw-extrabold text-navy">
                  #{String(selectedNumber).padStart(3, '0')}
                </div>
                <div className="text-muted small">
                  Round #{round?.roundNumber || '001'} • Entry Fee: <strong>100 ETB</strong>
                </div>
              </div>

              <div className="col-md-5">
                {isAuthenticated && user ? (
                  <div className="bg-light p-3 rounded-3 border">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <span className="badge bg-success">AUTHENTICATED PLAYER</span>
                      <strong className="text-navy">
                        {user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (user.username ? `@${user.username}` : user.phone)}
                      </strong>
                    </div>
                    <div className="small text-muted">
                      Phone: <strong>{user.phone || 'N/A'}</strong> • ID: <code>{user.telegramId}</code>
                    </div>
                  </div>
                ) : (
                  <div className="alert alert-warning mb-0 py-2 small d-flex align-items-center gap-2">
                    <i className="bi bi-shield-lock-fill fs-5 text-warning flex-shrink-0"></i>
                    <div>
                      <strong>Account Required:</strong> You must sign in or register to reserve this number.
                    </div>
                  </div>
                )}
              </div>

              <div className="col-md-3 text-end">
                {isAuthenticated && user ? (
                  <button
                    onClick={handleProceedToPayment}
                    disabled={reserving}
                    className="btn btn-gold btn-lg w-100 py-3 d-flex align-items-center justify-content-center gap-2 shadow-sm"
                  >
                    {reserving ? (
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                    ) : (
                      <>
                        <span>Continue to Payment</span>
                        <i className="bi bi-arrow-right"></i>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => openAuthModal('login', `Sign in to reserve Ticket #${String(selectedNumber).padStart(3, '0')}`)}
                    className="btn btn-navy btn-lg w-100 py-3 d-flex align-items-center justify-content-center gap-2 shadow-sm"
                  >
                    <i className="bi bi-box-arrow-in-right"></i>
                    <span>Sign In to Buy</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MOBILE STICKY BOTTOM BAR */}
      {selectedNumber && (
        <div className="mobile-sticky-bar d-md-none text-white">
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <div className="small text-white-50">Selected Number</div>
              <div className="fw-bolder text-gold fs-5">#{String(selectedNumber).padStart(3, '0')} • 100 ETB</div>
            </div>
            <button
              onClick={handleProceedToPayment}
              disabled={reserving}
              className="btn btn-gold px-4 py-2"
            >
              {reserving ? 'Reserving...' : 'Continue →'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
