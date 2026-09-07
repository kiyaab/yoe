'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../../lib/api';

export default function AdminRoundsPage() {
  const [rounds, setRounds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roundNumber, setRoundNumber] = useState<number>(2);
  const [name, setName] = useState('Ethiopian Great Draw #002');
  const [ticketPrice, setTicketPrice] = useState(100);
  const [firstPrize, setFirstPrize] = useState(10000);
  const [secondPrize, setSecondPrize] = useState(1000);
  const [thirdPrize, setThirdPrize] = useState(500);
  const [alert, setAlert] = useState<{ type: string; msg: string } | null>(null);

  const loadRounds = async () => {
    setLoading(true);
    const token = localStorage.getItem('yalfal_admin_token') || '';
    try {
      const data = await api.getAdminRounds(token);
      setRounds(data);
      if (data.length > 0) {
        setRoundNumber(Math.max(...data.map((r) => r.roundNumber)) + 1);
      }
    } catch (err: any) {
      setAlert({ type: 'danger', msg: err.message || 'Error loading rounds' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRounds();
  }, []);

  const handleCreateRound = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('yalfal_admin_token') || '';
    try {
      await api.createRound(token, {
        roundNumber,
        name,
        ticketPrice,
        maxTickets: 200,
        firstPrize,
        secondPrize,
        thirdPrize,
      });
      setAlert({ type: 'success', msg: `Round #${roundNumber} created with 200 tickets!` });
      setShowCreateModal(false);
      loadRounds();
    } catch (err: any) {
      setAlert({ type: 'danger', msg: err.message || 'Error creating round' });
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    const token = localStorage.getItem('yalfal_admin_token') || '';
    try {
      await api.updateRoundStatus(token, id, status);
      setAlert({ type: 'success', msg: `Round status updated to ${status}` });
      loadRounds();
    } catch (err: any) {
      setAlert({ type: 'danger', msg: err.message || 'Error updating status' });
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-extrabold text-navy mb-0">Lottery Rounds Management</h3>
          <p className="text-muted small mb-0">
            Create, monitor, pause, or close lottery rounds.
          </p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-navy d-flex align-items-center gap-2">
          <i className="bi bi-plus-lg"></i>
          <span>Create New Round</span>
        </button>
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
        </div>
      ) : (
        <div className="card shadow-sm border-0 bg-white">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light small text-muted text-uppercase">
                <tr>
                  <th>Round</th>
                  <th>Name</th>
                  <th>Ticket Price</th>
                  <th>Capacity</th>
                  <th>Confirmed Sold</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rounds.map((r) => (
                  <tr key={r.id}>
                    <td className="fw-bold text-navy">#{String(r.roundNumber).padStart(3, '0')}</td>
                    <td>{r.name}</td>
                    <td className="fw-bold">{r.ticketPrice} ETB</td>
                    <td>{r.maxTickets} numbers</td>
                    <td>
                      <span className="fw-bold text-primary">{r.stats?.soldCount || 0}</span> / {r.maxTickets}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          r.status === 'OPEN'
                            ? 'bg-success'
                            : r.status === 'COMPLETED'
                            ? 'bg-primary'
                            : r.status === 'FULL' || r.status === 'DRAWING'
                            ? 'bg-warning text-dark'
                            : 'bg-secondary'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        {r.status === 'OPEN' && (
                          <button
                            onClick={() => handleUpdateStatus(r.id, 'PAUSED')}
                            className="btn btn-sm btn-outline-warning"
                          >
                            Pause
                          </button>
                        )}
                        {r.status === 'PAUSED' && (
                          <button
                            onClick={() => handleUpdateStatus(r.id, 'OPEN')}
                            className="btn btn-sm btn-outline-success"
                          >
                            Open
                          </button>
                        )}
                        {r.status !== 'COMPLETED' && (
                          <button
                            onClick={() => handleUpdateStatus(r.id, 'CANCELLED')}
                            className="btn btn-sm btn-outline-danger"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content border-0 shadow-lg">
              <form onSubmit={handleCreateRound}>
                <div className="modal-header bg-navy text-white">
                  <h5 className="modal-title fw-bold">Create New Lottery Round</h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setShowCreateModal(false)}
                  ></button>
                </div>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-4">
                      <label className="form-label small fw-bold">Round #</label>
                      <input
                        type="number"
                        className="form-control"
                        value={roundNumber}
                        onChange={(e) => setRoundNumber(parseInt(e.target.value, 10))}
                        required
                      />
                    </div>
                    <div className="col-8">
                      <label className="form-label small fw-bold">Round Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-bold">Ticket Price (ETB)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={ticketPrice}
                        onChange={(e) => setTicketPrice(parseFloat(e.target.value))}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-bold">Max Tickets</label>
                      <input type="number" className="form-control" value={200} disabled />
                    </div>
                    <div className="col-4">
                      <label className="form-label small fw-bold">1st Prize</label>
                      <input
                        type="number"
                        className="form-control"
                        value={firstPrize}
                        onChange={(e) => setFirstPrize(parseFloat(e.target.value))}
                      />
                    </div>
                    <div className="col-4">
                      <label className="form-label small fw-bold">2nd Prize</label>
                      <input
                        type="number"
                        className="form-control"
                        value={secondPrize}
                        onChange={(e) => setSecondPrize(parseFloat(e.target.value))}
                      />
                    </div>
                    <div className="col-4">
                      <label className="form-label small fw-bold">3rd Prize</label>
                      <input
                        type="number"
                        className="form-control"
                        value={thirdPrize}
                        onChange={(e) => setThirdPrize(parseFloat(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-navy fw-bold">
                    Create Round with 200 Numbers
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
