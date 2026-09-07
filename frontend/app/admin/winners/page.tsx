'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../../lib/api';

export default function AdminWinnersPage() {
  const [rounds, setRounds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWinners() {
      try {
        const data = await api.getPublicWinners();
        setRounds(data);
      } catch (err) {
        console.error('Error loading winners:', err);
      } finally {
        setLoading(false);
      }
    }
    loadWinners();
  }, []);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-extrabold text-navy mb-0">Recorded Prize Winners</h3>
          <p className="text-muted small mb-0">
            Cryptographically audited results from all lottery rounds.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      ) : rounds.length === 0 ? (
        <div className="card shadow-sm border-0 p-5 text-center bg-white">
          <p className="text-muted mb-0">No prize draws have been executed yet.</p>
        </div>
      ) : (
        <div className="d-flex flex-column gap-4">
          {rounds.map((round) => (
            <div className="card shadow-sm border-0 bg-white p-4" key={round.id}>
              <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                <h5 className="fw-bold text-navy mb-0">
                  Round #{round.roundNumber}: {round.name}
                </h5>
                <span className="badge bg-success">
                  {round.drawnAt ? new Date(round.drawnAt).toLocaleDateString() : 'Active'}
                </span>
              </div>

              <div className="row g-3">
                {round.winners.map((w: any) => (
                  <div className="col-md-4" key={w.id}>
                    <div className="p-3 bg-light rounded-3 border">
                      <div className="badge bg-warning text-dark mb-2">
                        {w.position.replace('_', ' ')}
                      </div>
                      <div className="display-6 fw-extrabold text-navy">
                        #{String(w.ticketNumber).padStart(3, '0')}
                      </div>
                      <div className="fw-bold text-success fs-5 my-1">
                        {w.prizeAmount.toLocaleString()} ETB
                      </div>
                      <div className="small text-muted">Winner: {w.winnerDisplay}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
