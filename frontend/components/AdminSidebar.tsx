'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const links = [
    { href: '/admin/dashboard', icon: 'bi-grid-1x2', label: 'Dashboard' },
    { href: '/admin/spin', icon: 'bi-disc', label: 'Spin Wheel Draw', highlight: true },
    { href: '/admin/rounds', icon: 'bi-calendar3', label: 'Lottery Rounds' },
    { href: '/admin/tickets', icon: 'bi-ticket-perforated', label: 'Tickets (1-200)' },
    { href: '/admin/payments', icon: 'bi-credit-card', label: 'Payments' },
    { href: '/admin/receipts', icon: 'bi-receipt', label: 'Receipt Review' },
    { href: '/admin/users', icon: 'bi-people', label: 'Users' },
    { href: '/admin/winners', icon: 'bi-trophy', label: 'Winners' },
    { href: '/admin/settings', icon: 'bi-sliders', label: 'Payment Settings' },
    { href: '/admin/audit', icon: 'bi-shield-check', label: 'Audit Logs' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('yalfal_admin_token');
    localStorage.removeItem('yalfal_admin_user');
    router.push('/admin/login');
  };

  return (
    <aside className="admin-sidebar d-flex flex-column py-3 shadow">
      <div className="px-3 pb-3 mb-2 border-bottom border-white border-opacity-10 d-flex align-items-center justify-content-between">
        <Link href="/admin/dashboard" className="text-decoration-none d-flex align-items-center gap-2">
          <span className="fs-3">🎡</span>
          <div>
            <div className="fw-bolder text-white small lh-1">YALFAL ETA</div>
            <span className="badge bg-warning text-dark mt-1" style={{ fontSize: '0.65rem' }}>ADMIN SUITE</span>
          </div>
        </Link>
      </div>

      <div className="flex-grow-1 overflow-y-auto">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`admin-nav-item ${isActive ? 'active' : ''} ${link.highlight ? 'text-gold fw-bold' : ''}`}
            >
              <i className={`bi ${link.icon} me-2 fs-5`}></i>
              <span>{link.label}</span>
              {link.highlight && (
                <span className="badge bg-danger ms-auto small" style={{ fontSize: '0.6rem' }}>LIVE</span>
              )}
            </Link>
          );
        })}
      </div>

      <div className="pt-3 px-3 border-top border-white border-opacity-10">
        <button
          onClick={handleLogout}
          className="btn btn-outline-danger w-100 btn-sm d-flex align-items-center justify-content-center gap-2"
        >
          <i className="bi bi-box-arrow-right"></i>
          <span>Logout Staff</span>
        </button>
      </div>
    </aside>
  );
}
