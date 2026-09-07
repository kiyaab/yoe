'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';

export default function HomePage() {
  const [round, setRound] = useState<any>(null);
  const [latestWinners, setLatestWinners] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentRound = async () => {
    try {
      const data = await api.getCurrentRound();
      setRound(data);
    } catch (err) {
      console.error('Error fetching round:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWinners = async () => {
    try {
      const data = await api.getLatestWinners();
      setLatestWinners(data);
    } catch (err) {
      console.error('Error fetching winners:', err);
    }
  };

  useEffect(() => {
    fetchCurrentRound();
    fetchWinners();

    // Listen for live WebSocket updates
    const socket = getSocket();
    socket.on('ticket.confirmed', () => {
      fetchCurrentRound();
    });
    socket.on('ticket.reserved', () => {
      fetchCurrentRound();
    });
    socket.on('draw.winner', () => {
      fetchCurrentRound();
      fetchWinners();
    });

    return () => {
      socket.off('ticket.confirmed');
      socket.off('ticket.reserved');
      socket.off('draw.winner');
    };
  }, []);

  const stats = round?.stats || {
    soldCount: 0,
    remainingCount: 200,
    progressPercent: 0,
  };

  return (
    <div>
      {/* 1. HERO SECTION */}
      <section className="bg-gradient-navy text-white py-5 position-relative overflow-hidden">
        <div className="container py-lg-5 position-relative z-1">
          <div className="row align-items-center g-5">
            <div className="col-lg-7">
              <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill bg-white bg-opacity-10 text-gold mb-3 small fw-bold">
                <span className="spinner-grow spinner-grow-sm text-warning" role="status"></span>
                <span>REGISTRATION OPEN • 200 NUMBERS ONLY</span>
              </div>
              <h1 className="display-4 fw-extrabold lh-tight mb-3">
                Your Number. <br />
                <span className="text-gold">Your Chance.</span> <br />
                Your Moment.
              </h1>
              <p className="lead text-white-50 mb-4 pe-lg-4">
                Enter Ethiopia’s premier Telegram digital lottery. Pick your lucky number from 
                <strong> 1–200</strong>, complete your 100 ETB entry via CBE or Telebirr, and win up to 
                <strong className="text-gold"> 10,000 ETB</strong> in a live verifiable draw.
              </p>
              <div className="d-flex flex-wrap gap-3">
                <Link href="/tickets" className="btn btn-gold btn-lg px-4 py-3 d-flex align-items-center gap-2">
                  <span>🎟</span>
                  <span>Choose My Number</span>
                </Link>
                <Link href="/how-it-works" className="btn btn-outline-light btn-lg px-4 py-3">
                  See How It Works
                </Link>
                <a
                  href="https://t.me/yalfalonlinebot"
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline-info btn-lg px-3 py-3"
                  title="Play on Telegram"
                >
                  <i className="bi bi-telegram me-1"></i> Telegram Bot
                </a>
              </div>
            </div>

            {/* LIVE DRAW STATUS CARD */}
            <div className="col-lg-5">
              <div className="glass-card p-4 p-md-5 text-dark">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-danger text-white px-2 py-1">🔥 LIVE DRAW</span>
                    <span className="fw-bold text-navy">Round #{round ? String(round.roundNumber).padStart(3, '0') : '001'}</span>
                  </div>
                  <span className="badge bg-primary text-white">🎟 100 ETB / Number</span>
                </div>

                <h4 className="fw-bold text-navy mb-1">{round?.name || 'Ethiopian New Era Draw'}</h4>
                <p className="small text-muted mb-4">
                  Closes immediately when all 200 numbers are confirmed.
                </p>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between small fw-bold mb-1">
                    <span className="text-navy">{stats.soldCount} / {round?.maxTickets || 200} Sold</span>
                    <span className="text-gold-dark">{stats.remainingCount} Numbers Left</span>
                  </div>
                  <div className="progress" style={{ height: '14px', borderRadius: '10px' }}>
                    <div
                      className="progress-bar progress-bar-striped progress-bar-animated bg-gradient-gold"
                      role="progressbar"
                      style={{ width: `${stats.progressPercent}%` }}
                      aria-valuenow={stats.progressPercent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    ></div>
                  </div>
                </div>

                {/* Quick Prizes Breakdown */}
                <div className="row g-2 text-center mb-4">
                  <div className="col-4">
                    <div className="p-2 rounded bg-light border">
                      <div className="small text-muted">🥇 1st Prize</div>
                      <div className="fw-bold text-navy">10,000 ETB</div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="p-2 rounded bg-light border">
                      <div className="small text-muted">🥈 2nd Prize</div>
                      <div className="fw-bold text-navy">1,000 ETB</div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="p-2 rounded bg-light border">
                      <div className="small text-muted">🥉 3rd Prize</div>
                      <div className="fw-bold text-navy">500 ETB</div>
                    </div>
                  </div>
                </div>

                <Link href="/tickets" className="btn btn-navy w-100 py-3 fw-bold">
                  View Available Numbers (1–200) →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PRIZE SECTION */}
      <section className="py-5 bg-white">
        <div className="container py-4">
          <div className="text-center max-w-700 mx-auto mb-5">
            <span className="badge bg-warning bg-opacity-10 text-gold-dark px-3 py-2 fw-bold text-uppercase rounded-pill">
              Guaranteed Payouts
            </span>
            <h2 className="display-6 fw-extrabold text-navy mt-2">Prizes for Every Draw</h2>
            <p className="text-muted">
              Total advertised prizes per round: <strong>11,500 ETB</strong>. Automatically awarded 
              to 3 separate winning ticket holders.
            </p>
          </div>

          <div className="row g-4 justify-content-center">
            {/* 1st Prize */}
            <div className="col-lg-4 col-md-6">
              <div className="prize-card first-prize p-4 bg-gradient-navy text-white text-center h-100 position-relative">
                <div className="display-3 mb-2">🥇</div>
                <div className="badge bg-warning text-dark px-3 py-1 mb-2 fw-bold">TOP WINNER</div>
                <h3 className="fw-bold mb-1">1ST PRIZE</h3>
                <div className="display-5 fw-extrabold text-gold my-3">10,000 ETB</div>
                <p className="text-white-50 small mb-0">
                  Transferred directly via CBE or Telebirr immediately following the cryptographic draw.
                </p>
              </div>
            </div>

            {/* 2nd Prize */}
            <div className="col-lg-4 col-md-6">
              <div className="prize-card p-4 glass-card text-center h-100 border">
                <div className="display-3 mb-2">🥈</div>
                <span className="badge bg-secondary text-white px-3 py-1 mb-2 fw-bold">RUNNER UP</span>
                <h3 className="fw-bold text-navy mb-1">2ND PRIZE</h3>
                <div className="display-5 fw-extrabold text-navy my-3">1,000 ETB</div>
                <p className="text-muted small mb-0">
                  Drawn from all remaining approved tickets (excluding the 1st prize winner).
                </p>
              </div>
            </div>

            {/* 3rd Prize */}
            <div className="col-lg-4 col-md-6">
              <div className="prize-card p-4 glass-card text-center h-100 border">
                <div className="display-3 mb-2">🥉</div>
                <span className="badge bg-secondary text-white px-3 py-1 mb-2 fw-bold">BRONZE</span>
                <h3 className="fw-bold text-navy mb-1">3RD PRIZE</h3>
                <div className="display-5 fw-extrabold text-navy my-3">500 ETB</div>
                <p className="text-muted small mb-0">
                  Guaranteed 3rd reward drawn strictly among all remaining entries.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS TIMELINE */}
      <section className="py-5 bg-light">
        <div className="container py-4">
          <div className="text-center max-w-700 mx-auto mb-5">
            <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 fw-bold text-uppercase rounded-pill">
              Simple 5-Step Process
            </span>
            <h2 className="display-6 fw-extrabold text-navy mt-2">How to Enter and Win</h2>
            <p className="text-muted">
              Participate online through this website or directly inside the official Telegram Bot.
            </p>
          </div>

          <div className="row g-4">
            {[
              { num: '01', title: 'Choose a Number', desc: 'Pick any open lucky number between 1 and 200 on the live ticket grid.' },
              { num: '02', title: 'Pay 100 ETB', desc: 'Transfer exact entry fee to our official CBE account or Telebirr phone number.' },
              { num: '03', title: 'Upload Receipt', desc: 'Upload the transaction screenshot or PDF receipt with reference visible.' },
              { num: '04', title: 'Admin Verifies', desc: 'Our team verifies the receipt and permanently confirms your ticket.' },
              { num: '05', title: 'Enter Live Draw', desc: 'When all 200 numbers are filled, the cryptographically secure spin wheel draws the 3 winners!' },
            ].map((step, idx) => (
              <div className="col-lg col-md-6" key={idx}>
                <div className="glass-card p-4 h-100 text-center border">
                  <div className="display-6 fw-extrabold text-gold mb-2">{step.num}</div>
                  <h5 className="fw-bold text-navy mb-2">{step.title}</h5>
                  <p className="small text-muted mb-0">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-5">
            <Link href="/tickets" className="btn btn-gold btn-lg px-5 py-3">
              🎟 Pick Your Lucky Number Now
            </Link>
          </div>
        </div>
      </section>

      {/* 4. TELEGRAM INTEGRATION CTA */}
      <section className="py-5 bg-gradient-navy text-white text-center">
        <div className="container py-4">
          <span className="fs-1">📱</span>
          <h2 className="display-6 fw-extrabold mt-2">Prefer Using Telegram?</h2>
          <p className="lead text-white-50 max-w-600 mx-auto mb-4">
            You can also choose numbers, view live draws, receive instant receipt confirmations, 
            and get winner alerts directly inside Telegram.
          </p>
          <a
            href="https://t.me/yalfalonlinebot"
            target="_blank"
            rel="noreferrer"
            className="btn btn-light btn-lg px-4 py-3 fw-bold d-inline-flex align-items-center gap-2"
          >
            <i className="bi bi-telegram fs-5 text-primary"></i>
            <span>Open @yalfalonlinebot</span>
          </a>
        </div>
      </section>
    </div>
  );
}
