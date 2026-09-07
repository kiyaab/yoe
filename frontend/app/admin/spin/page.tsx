'use client';

import React, { useEffect, useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import { api } from '../../../lib/api';

export default function AdminSpinWheelPage() {
  const [roundId, setRoundId] = useState<string>('');
  const [round, setRound] = useState<any>(null);
  const [eligibleTickets, setEligibleTickets] = useState<any[]>([]);
  const [existingWinners, setExistingWinners] = useState<any>({});
  const [targetPrize, setTargetPrize] = useState<'FIRST_PRIZE' | 'SECOND_PRIZE' | 'THIRD_PRIZE' | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [latestWinner, setLatestWinner] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [drawAudit, setDrawAudit] = useState<any | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentAngleRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  const loadData = async () => {
    const token = localStorage.getItem('yalfal_admin_token') || '';
    try {
      const current = await api.getCurrentRound();
      if (!current) {
        setErrorMessage('No active lottery round found');
        return;
      }
      setRoundId(current.id);
      setRound(current);

      const participants = await api.getDrawParticipants(token, current.id);
      setEligibleTickets(participants.eligibleTickets || []);
      setExistingWinners(participants.existingWinners || {});
    } catch (err: any) {
      setErrorMessage(err.message || 'Error loading draw participants');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Draw the wheel onto canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = width / 2 - 20;

    // Use eligible tickets count or fallback to 20 representative slices
    const count = Math.max(12, Math.min(60, eligibleTickets.length || 30));
    const sliceAngle = (2 * Math.PI) / count;

    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(currentAngleRef.current);

    const colors = ['#071A35', '#FFC107', '#0D47A1', '#D99A00', '#1565C0', '#FFA000'];

    for (let i = 0; i < count; i++) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, i * sliceAngle, (i + 1) * sliceAngle);
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();

      // Number text
      ctx.save();
      ctx.rotate(i * sliceAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = (i % colors.length) % 2 === 0 ? '#FFFFFF' : '#071A35';
      ctx.font = 'bold 13px Plus Jakarta Sans, sans-serif';
      const ticketNum = eligibleTickets[i] ? eligibleTickets[i].ticketNumber : i + 1;
      ctx.fillText(`#${String(ticketNum).padStart(2, '0')}`, radius - 20, 5);
      ctx.restore();
    }

    // Draw Wheel Center Cap
    ctx.beginPath();
    ctx.arc(0, 0, 45, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#FFC107';
    ctx.stroke();

    ctx.fillStyle = '#071A35';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 16px Plus Jakarta Sans, sans-serif';
    ctx.fillText('YALFAL', 0, 0);

    ctx.restore();
  }, [eligibleTickets]);

  const initiateDraw = (position: 'FIRST_PRIZE' | 'SECOND_PRIZE' | 'THIRD_PRIZE') => {
    setTargetPrize(position);
    setShowConfirmModal(true);
  };

  const handleConfirmDraw = async () => {
    if (!targetPrize || !roundId) return;
    setShowConfirmModal(false);
    setSpinning(true);
    setErrorMessage('');
    setLatestWinner(null);

    const token = localStorage.getItem('yalfal_admin_token') || '';

    try {
      // 1. Backend determines winner via CSPRNG
      const res = await api.executeDraw(token, {
        roundId,
        position: targetPrize,
      });

      // 2. Animate wheel to celebrate result
      const winningTicket = res.winner;
      setDrawAudit(res.randomnessAudit);

      let startSpeed = 0.35;
      const duration = 6000; // 6 seconds spin
      const startTime = performance.now();

      const animateSpin = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);

        // Ease-out cubic deceleration
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentSpeed = startSpeed * (1 - easeOut);

        currentAngleRef.current += currentSpeed;

        // Redraw
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const width = canvas.width;
            const centerX = width / 2;
            const centerY = width / 2;
            const radius = width / 2 - 20;
            const count = Math.max(12, Math.min(60, eligibleTickets.length || 30));
            const sliceAngle = (2 * Math.PI) / count;

            ctx.clearRect(0, 0, width, width);
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(currentAngleRef.current);

            const colors = ['#071A35', '#FFC107', '#0D47A1', '#D99A00', '#1565C0', '#FFA000'];

            for (let i = 0; i < count; i++) {
              ctx.beginPath();
              ctx.moveTo(0, 0);
              ctx.arc(0, 0, radius, i * sliceAngle, (i + 1) * sliceAngle);
              ctx.fillStyle = colors[i % colors.length];
              ctx.fill();
              ctx.lineWidth = 2;
              ctx.strokeStyle = '#FFFFFF';
              ctx.stroke();

              ctx.save();
              ctx.rotate(i * sliceAngle + sliceAngle / 2);
              ctx.textAlign = 'right';
              ctx.fillStyle = (i % colors.length) % 2 === 0 ? '#FFFFFF' : '#071A35';
              ctx.font = 'bold 13px Plus Jakarta Sans, sans-serif';
              const num = eligibleTickets[i] ? eligibleTickets[i].ticketNumber : i + 1;
              ctx.fillText(`#${String(num).padStart(2, '0')}`, radius - 20, 5);
              ctx.restore();
            }

            // Center cap
            ctx.beginPath();
            ctx.arc(0, 0, 45, 0, 2 * Math.PI);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#FFC107';
            ctx.stroke();

            ctx.fillStyle = '#071A35';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = 'bold 16px Plus Jakarta Sans, sans-serif';
            ctx.fillText('YALFAL', 0, 0);

            ctx.restore();
          }
        }

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animateSpin);
        } else {
          // Finished Spin! Reveal Winner and trigger confetti
          setSpinning(false);
          setLatestWinner(winningTicket);
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 },
          });
          loadData();
        }
      };

      animationFrameRef.current = requestAnimationFrame(animateSpin);
    } catch (err: any) {
      setSpinning(false);
      setErrorMessage(err.message || 'Error executing cryptographic draw');
    }
  };

  const getPrizeLabel = (pos: string) => {
    if (pos === 'FIRST_PRIZE') return { title: '1ST PRIZE', amount: '10,000 ETB', emoji: '🥇' };
    if (pos === 'SECOND_PRIZE') return { title: '2ND PRIZE', amount: '1,000 ETB', emoji: '🥈' };
    return { title: '3RD PRIZE', amount: '500 ETB', emoji: '🥉' };
  };

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="text-center mb-4">
        <span className="badge bg-danger text-white px-3 py-1 fw-bold rounded-pill mb-1">
          🔴 LIVE WHEEL DRAW
        </span>
        <h2 className="fw-extrabold text-navy mb-0">
          🎡 YALFAL ONLINE ETA — ROUND #{round?.roundNumber || '001'}
        </h2>
        <p className="text-muted small">
          Eligible Approved Participants: <strong>{eligibleTickets.length} Tickets</strong>
        </p>
      </div>

      {errorMessage && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-4 max-w-700 mx-auto">
          <i className="bi bi-exclamation-triangle-fill fs-5"></i>
          <div>{errorMessage}</div>
        </div>
      )}

      {/* Winner Fanfare Reveal Card */}
      {latestWinner && (
        <div className="card shadow-lg border-2 border-warning p-4 p-md-5 text-center mb-5 max-w-700 mx-auto glass-card">
          <div className="display-2 mb-2">🎉</div>
          <span className="badge bg-warning text-dark px-3 py-1 rounded-pill fw-bold fs-6 mb-2">
            WE HAVE A WINNER!
          </span>
          <h4 className="fw-bold text-muted mb-1">{latestWinner.position.replace('_', ' ')}</h4>
          <div className="display-3 fw-extrabold text-navy my-2">
            TICKET #{String(latestWinner.ticketNumber).padStart(3, '0')}
          </div>
          <div className="display-6 fw-extrabold text-gold-dark mb-3">
            {latestWinner.prizeAmount.toLocaleString()} ETB
          </div>
          <div className="small text-muted mb-3">
            Winner Handle: <strong>@{latestWinner.winnerName}</strong>
          </div>

          {drawAudit && (
            <div className="bg-light p-3 rounded-3 small font-monospace text-start border text-muted">
              <div><strong>Audit Hash:</strong> {drawAudit.drawSeedHex}</div>
              <div><strong>Entropy Pool:</strong> {drawAudit.algorithm}</div>
              <div><strong>Eligible Count:</strong> {drawAudit.eligibleCount} candidates</div>
              <div><strong>Drawn Timestamp:</strong> {drawAudit.timestamp}</div>
            </div>
          )}
        </div>
      )}

      {/* Wheel and Draw Controls */}
      <div className="row g-4 align-items-center justify-content-center">
        {/* Animated Wheel */}
        <div className="col-lg-6 text-center">
          <div className="wheel-container" style={{ width: '420px', height: '420px' }}>
            <div className="wheel-pointer"></div>
            <canvas
              ref={canvasRef}
              width={420}
              height={420}
              className="rounded-circle shadow-lg"
              style={{ maxWidth: '100%', height: 'auto' }}
            ></canvas>
          </div>
        </div>

        {/* Prize Spin Controls */}
        <div className="col-lg-5">
          <div className="card shadow-sm border-0 p-4 bg-white">
            <h5 className="fw-bold text-navy mb-3">Prize Draw Controls</h5>

            {/* 1st Prize Button */}
            <div className="p-3 rounded-3 bg-light border mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="fw-bold text-navy">🥇 1ST PRIZE • 10,000 ETB</span>
                {existingWinners.firstPrize ? (
                  <span className="badge bg-success">
                    Won by #{existingWinners.firstPrize.ticket?.ticketNumber}
                  </span>
                ) : (
                  <span className="badge bg-secondary">Awaiting Draw</span>
                )}
              </div>
              <button
                onClick={() => initiateDraw('FIRST_PRIZE')}
                disabled={spinning || !!existingWinners.firstPrize || eligibleTickets.length === 0}
                className="btn btn-gold w-100 py-2 fw-bold"
              >
                {existingWinners.firstPrize ? '✓ 1st Prize Completed' : '🎡 Spin for 1st Prize'}
              </button>
            </div>

            {/* 2nd Prize Button */}
            <div className="p-3 rounded-3 bg-light border mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="fw-bold text-navy">🥈 2ND PRIZE • 1,000 ETB</span>
                {existingWinners.secondPrize ? (
                  <span className="badge bg-success">
                    Won by #{existingWinners.secondPrize.ticket?.ticketNumber}
                  </span>
                ) : (
                  <span className="badge bg-secondary">Awaiting Draw</span>
                )}
              </div>
              <button
                onClick={() => initiateDraw('SECOND_PRIZE')}
                disabled={
                  spinning ||
                  !existingWinners.firstPrize ||
                  !!existingWinners.secondPrize ||
                  eligibleTickets.length < 2
                }
                className="btn btn-navy w-100 py-2 fw-bold"
              >
                {existingWinners.secondPrize ? '✓ 2nd Prize Completed' : '🎡 Spin for 2nd Prize'}
              </button>
            </div>

            {/* 3rd Prize Button */}
            <div className="p-3 rounded-3 bg-light border">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="fw-bold text-navy">🥉 3RD PRIZE • 500 ETB</span>
                {existingWinners.thirdPrize ? (
                  <span className="badge bg-success">
                    Won by #{existingWinners.thirdPrize.ticket?.ticketNumber}
                  </span>
                ) : (
                  <span className="badge bg-secondary">Awaiting Draw</span>
                )}
              </div>
              <button
                onClick={() => initiateDraw('THIRD_PRIZE')}
                disabled={
                  spinning ||
                  !existingWinners.secondPrize ||
                  !!existingWinners.thirdPrize ||
                  eligibleTickets.length < 3
                }
                className="btn btn-outline-navy w-100 py-2 fw-bold"
              >
                {existingWinners.thirdPrize ? '✓ 3rd Prize Completed' : '🎡 Spin for 3rd Prize'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Safety Confirmation Modal (Section 68) */}
      {showConfirmModal && targetPrize && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-navy text-white">
                <h5 className="modal-title fw-bold">ARE YOU SURE?</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowConfirmModal(false)}
                ></button>
              </div>
              <div className="modal-body p-4 text-center">
                <div className="display-4 mb-2">{getPrizeLabel(targetPrize).emoji}</div>
                <h4 className="fw-bold text-navy">{getPrizeLabel(targetPrize).title}</h4>
                <div className="display-6 fw-extrabold text-gold-dark mb-3">
                  {getPrizeLabel(targetPrize).amount}
                </div>
                <p className="text-muted small">
                  This action will permanently and immutably select the winner for the current prize 
                  from among <strong>{eligibleTickets.length} eligible participants</strong>.
                </p>
                <div className="alert alert-warning small py-2 mb-0">
                  <i className="bi bi-shield-lock me-1"></i>
                  Cryptographic random selection will be recorded permanently in the audit log.
                </div>
              </div>
              <div className="modal-footer bg-light d-flex justify-content-between">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowConfirmModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDraw}
                  className="btn btn-gold px-4 fw-bold"
                >
                  Confirm & Start Draw
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
