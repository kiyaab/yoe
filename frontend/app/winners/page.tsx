'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';

export default function WinnersPage() {
  const [rounds, setRounds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWinners() {
      try {
        const data = await api.getPublicWinners();
        setRounds(data);
      } catch (err) {
        console.error('Error fetching winners:', err);
      } finally {
        setLoading(false);
      }
    }
    loadWinners();
  }, []);

  return (
    <div className="container py-5">
      <div className="text-center max-w-700 mx-auto mb-5">
        <span className="badge bg-warning bg-opacity-10 text-gold-dark px-3 py-2 fw-bold text-uppercase rounded-pill">
          Cryptographically Verified
        </span>
        <h1 className="display-5 fw-extrabold text-navy mt-2">Hall of Winners</h1>
        <p className="text-muted">
          All lottery winners are selected using cryptographic random selection and verified 
          by our automated draw system.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <div className="text-muted mt-2">Loading historical draws...</div>
        </div>
      ) : rounds.length === 0 ? (
        <div className="glass-card p-5 text-center my-4 border max-w-600 mx-auto">
          <div className="display-4 mb-3">🏆</div>
          <h4 className="fw-bold text-navy">First Draw in Progress!</h4>
          <p className="text-muted mb-4">
            Round #001 is currently accepting participants. Be among the first winners to claim 
            up to 10,000 ETB!
          </p>
          <Link href="/tickets" className="btn btn-gold btn-lg px-4 py-2 fw-bold">
            🎟 Choose Your Number
          </Link>
        </div>
      ) : (
        <div className="row g-4">
          {rounds.map((round) => (
            <div className="col-lg-6" key={round.id}>
              <div className="glass-card p-4 border h-100">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <span className="badge bg-primary text-white me-2">
                      Round #{String(round.roundNumber).padStart(3, '0')}
                    </span>
                    <span className="fw-bold text-navy">{round.name}</span>
                  </div>
                  <span className="text-muted small">
                    {round.drawnAt ? new Date(round.drawnAt).toLocaleDateString() : 'Recent'}
                  </span>
                </div>

                <div className="row g-2">
                  {round.winners.map((winner: any) => {
                    let badge = '🥇 1ST PRIZE';
                    let badgeClass = 'bg-warning text-dark';
                    if (winner.position === 'SECOND_PRIZE') {
                      badge = '🥈 2ND PRIZE';
                      badgeClass = 'bg-secondary text-white';
                    } else if (winner.position === 'THIRD_PRIZE') {
                      badge = '🥉 3RD PRIZE';
                      badgeClass = 'bg-secondary text-white';
                    }

                    return (
                      <div className="col-12" key={winner.id}>
                        <div className="p-3 rounded-3 bg-light border d-flex align-items-center justify-content-between">
                          <div className="d-flex align-items-center gap-3">
                            <span className={`badge ${badgeClass} fw-bold px-2 py-1`}>{badge}</span>
                            <div>
                              <span className="fs-5 fw-extrabold text-navy">
                                #{String(winner.ticketNumber).padStart(3, '0')}
                              </span>
                              <span className="text-muted small ms-2">({winner.winnerDisplay})</span>
                            </div>
                          </div>
                          <div className="fw-extrabold fs-5 text-gold-dark">
                            {winner.prizeAmount.toLocaleString()} ETB
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
