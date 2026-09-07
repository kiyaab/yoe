'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';

export default function BotSimulatorPage() {
  const [messages, setMessages] = useState<any[]>([
    {
      id: 1,
      sender: 'bot',
      text:
        `🎡 Welcome to Yalfal Online Eta!\n\n` +
        `“Your Number. Your Chance. Your Moment.”\n\n` +
        `🎟 Ticket Price: 100 ETB / Number\n` +
        `🏆 Prizes:\n` +
        `🥇 1st Prize: 10,000 ETB\n` +
        `🥈 2nd Prize: 1,000 ETB\n` +
        `🥉 3rd Prize: 500 ETB\n\n` +
        `Numbers: 1–200\n` +
        `Choose your lucky number below to enter the live draw!`,
      buttons: [
        [
          { label: '🚀 Launch Mini App (Full Screen)', action: 'open_mini_app', highlight: true },
        ],
        [
          { label: '🎟 Buy Number (In Chat)', action: 'buy_page_0' },
        ],
        [
          { label: '🎡 Current Draw', action: 'current_draw' },
          { label: '📋 My Ticket', action: 'my_tickets' },
        ],
        [
          { label: '💳 Payment Info', action: 'payment_info' },
          { label: '🏆 Winners', action: 'winners' },
        ],
      ],
    },
  ]);

  const [inputVal, setInputVal] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);
  const [simulatedTelegramId, setSimulatedTelegramId] = useState('8880998246');
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleButtonClick = async (btn: any) => {
    if (btn.action === 'open_mini_app') {
      window.location.href = '/tickets';
      return;
    }

    setLoadingAction(true);
    const userMsg = { id: Date.now(), sender: 'user', text: btn.label };
    setMessages((prev) => [...prev, userMsg]);

    setTimeout(async () => {
      try {
        if (btn.action.startsWith('buy_page_')) {
          const page = parseInt(btn.action.replace('buy_page_', ''), 10);
          const startNum = page * 20 + 1;
          const endNum = Math.min(200, startNum + 19);

          const res = await api.getTickets();
          const tickets = res.tickets;

          const numberButtons: any[][] = [];
          let row: any[] = [];

          for (let i = startNum; i <= endNum; i++) {
            const ticket = tickets.find((t: any) => t.ticketNumber === i);
            const isAvail = ticket && ticket.status === 'AVAILABLE';
            row.push({
              label: isAvail ? String(i).padStart(2, '0') : `❌${i}`,
              action: isAvail ? `pick_${i}` : 'taken',
              disabled: !isAvail,
            });
            if (row.length === 5) {
              numberButtons.push(row);
              row = [];
            }
          }
          if (row.length > 0) numberButtons.push(row);

          const navRow: any[] = [];
          if (page > 0) {
            navRow.push({ label: '⬅ Previous', action: `buy_page_${page - 1}` });
          }
          if (endNum < 200) {
            navRow.push({ label: 'Next ➡', action: `buy_page_${page + 1}` });
          }
          if (navRow.length > 0) numberButtons.push(navRow);

          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + 1,
              sender: 'bot',
              text: `🎟 Choose your lucky number (Numbers ${startNum}–${endNum}):\n• Click any number to reserve for 100 ETB.`,
              buttons: numberButtons,
            },
          ]);
        } else if (btn.action.startsWith('pick_')) {
          const num = parseInt(btn.action.replace('pick_', ''), 10);
          const reserveRes = await api.reserveTicket({
            ticketNumber: num,
            telegramId: simulatedTelegramId,
            username: 'lottery_player',
          });

          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + 1,
              sender: 'bot',
              text:
                `🎟 NUMBER #${String(num).padStart(3, '0')} RESERVED!\n\n` +
                `• Entry Fee: 100 ETB\n` +
                `• Status: ⏳ Awaiting Payment\n\n` +
                `Please select your payment method:`,
              buttons: [
                [
                  { label: '🏦 CBE Bank (100 ETB)', action: `pay_cbe_${reserveRes.ticket.id}` },
                  { label: '📱 Telebirr (100 ETB)', action: `pay_telebirr_${reserveRes.ticket.id}` },
                ],
              ],
            },
          ]);
        } else if (btn.action.startsWith('pay_')) {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + 1,
              sender: 'bot',
              text:
                `💳 Payment Instructions:\n\n` +
                `• Account Name: Yalfal Online Eta Ltd.\n` +
                `• CBE Account: 1000234567891\n` +
                `• Telebirr Number: 0911223344\n` +
                `• Amount to Pay: 100 ETB\n\n` +
                `After completing the transfer, upload your receipt directly via the Mini App or reply with the screenshot!`,
              buttons: [
                [
                  {
                    label: '📄 Upload Receipt in Mini App',
                    action: 'open_mini_app',
                    highlight: true,
                  },
                ],
              ],
            },
          ]);
        } else if (btn.action === 'current_draw') {
          const round = await api.getCurrentRound();
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + 1,
              sender: 'bot',
              text:
                `🎡 Round #${round.roundNumber}: ${round.name}\n\n` +
                `• Sold: ${round.stats?.soldCount || 0} / ${round.maxTickets}\n` +
                `• Remaining: ${round.stats?.remainingCount || 200}\n` +
                `• 1st Prize: ${round.firstPrize.toLocaleString()} ETB\n` +
                `• Status: ${round.status}`,
              buttons: [
                [{ label: '🎟 Pick Number (1-200)', action: 'buy_page_0' }],
              ],
            },
          ]);
        } else if (btn.action === 'my_tickets') {
          const my = await api.getMyTickets(simulatedTelegramId);
          let text = `📋 Your Tickets:\n\n`;
          if (my.length === 0) {
            text += 'You do not have any tickets yet in the current draw.';
          } else {
            for (const t of my) {
              text += `• Ticket #${String(t.ticketNumber).padStart(3, '0')} — Status: ${t.status}\n`;
            }
          }
          setMessages((prev) => [
            ...prev,
            { id: Date.now() + 1, sender: 'bot', text, buttons: [] },
          ]);
        }
      } catch (err: any) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            text: `⚠️ Notice: ${err.message || 'Action could not be completed.'}`,
            buttons: [],
          },
        ]);
      } finally {
        setLoadingAction(false);
      }
    }, 400);
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const userText = inputVal.trim();
    setInputVal('');

    setMessages((prev) => [...prev, { id: Date.now(), sender: 'user', text: userText }]);

    if (userText === '/start' || userText.toLowerCase() === 'start') {
      handleButtonClick({ label: 'Restart', action: 'buy_page_0' });
    } else {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            text: `👋 Type /start or click the buttons below to interact with Yalfal Online Eta!`,
            buttons: [
              [{ label: '🚀 Launch Mini App', action: 'open_mini_app', highlight: true }],
              [{ label: '🎟 Buy Number', action: 'buy_page_0' }],
            ],
          },
        ]);
      }, 400);
    }
  };

  return (
    <div className="container py-4 max-w-700 mx-auto">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h4 className="fw-extrabold text-navy mb-0">Telegram Bot & Mini App Interactive Preview</h4>
          <p className="text-muted small mb-0">
            Simulating live Telegram interactions with <strong>@yalfalonlinebot</strong>.
          </p>
        </div>
        <a
          href="https://t.me/yalfalonlinebot"
          target="_blank"
          rel="noreferrer"
          className="btn btn-sm btn-primary d-flex align-items-center gap-1"
        >
          <i className="bi bi-telegram"></i>
          <span>Open in Telegram App</span>
        </a>
      </div>

      {/* Simulated Phone Shell */}
      <div className="card shadow-lg border-0 rounded-4 overflow-hidden bg-white">
        {/* Telegram Header */}
        <div className="bg-navy text-white px-3 py-2 d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <span className="fs-3">🎡</span>
            <div>
              <div className="fw-bold small lh-1">Yalfal Online Eta bot</div>
              <div className="text-white-50" style={{ fontSize: '0.7rem' }}>bot • @yalfalonlinebot</div>
            </div>
          </div>
          <span className="badge bg-success small">LIVE</span>
        </div>

        {/* Chat Message Stream */}
        <div
          className="p-3 overflow-auto bg-light"
          style={{ height: '520px', backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)', backgroundSize: '16px 16px' }}
        >
          {messages.map((m) => {
            const isBot = m.sender === 'bot';
            return (
              <div
                key={m.id}
                className={`d-flex mb-3 ${isBot ? 'justify-content-start' : 'justify-content-end'}`}
              >
                <div
                  className={`p-3 rounded-4 shadow-sm ${
                    isBot ? 'bg-white text-dark' : 'bg-primary text-white'
                  }`}
                  style={{ maxWidth: '85%', whiteSpace: 'pre-line' }}
                >
                  <div className="small">{m.text}</div>

                  {/* Inline Buttons */}
                  {m.buttons && m.buttons.length > 0 && (
                    <div className="d-flex flex-column gap-1 mt-3 pt-2 border-top">
                      {m.buttons.map((row: any[], rIdx: number) => (
                        <div className="d-flex gap-1" key={rIdx}>
                          {row.map((btn: any, bIdx: number) => (
                            <button
                              key={bIdx}
                              onClick={() => handleButtonClick(btn)}
                              disabled={loadingAction || btn.disabled}
                              className={`btn btn-sm w-100 fw-bold ${
                                btn.highlight
                                  ? 'btn-warning text-dark shadow-sm'
                                  : 'btn-outline-primary bg-light'
                              }`}
                            >
                              {btn.label}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef}></div>
        </div>

        {/* Input Field */}
        <div className="p-2 bg-white border-top">
          <form onSubmit={handleSendText} className="d-flex gap-2">
            <input
              type="text"
              className="form-control form-control-sm rounded-pill px-3"
              placeholder="Type /start or message..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
            />
            <button type="submit" className="btn btn-primary btn-sm rounded-circle px-3">
              <i className="bi bi-send-fill"></i>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
