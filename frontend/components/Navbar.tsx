'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthContext';

export default function Navbar() {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();

  if (isAdminPage) {
    return null; // Admin has dedicated SaaS sidebar
  }

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/how-it-works', label: 'How It Works' },
    { href: '/rules', label: 'Rules' },
    { href: '/winners', label: 'Winners' },
    { href: '/dashboard', label: 'My Tickets' },
  ];

  return (
    <header className="sticky-top bg-gradient-navy shadow-sm">
      <div className="ethiopia-strip"></div>
      <nav className="navbar navbar-expand-lg navbar-dark py-3">
        <div className="container">
          <Link href="/" className="navbar-brand d-flex align-items-center gap-2 text-decoration-none">
            <span className="fs-3">🎡</span>
            <div>
              <div className="fw-bolder tracking-tight text-white lh-1 fs-5">YALFAL</div>
              <div className="small text-gold fw-bold letter-spacing-1" style={{ fontSize: '0.65rem' }}>
                ONLINE ETA
              </div>
            </div>
          </Link>

          <button
            className="navbar-toggler border-0"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarMain"
            aria-controls="navbarMain"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <i className="bi bi-list fs-2 text-white"></i>
          </button>

          <div className="collapse navbar-collapse" id="navbarMain">
            <ul className="navbar-nav mx-auto mb-2 mb-lg-0">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <li className="nav-item mx-1" key={link.href}>
                    <Link
                      href={link.href}
                      className={`nav-link px-3 fw-semibold ${isActive ? 'text-gold active' : 'text-white-50'}`}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="d-flex align-items-center gap-2">
              {isAuthenticated && user ? (
                <div className="d-flex align-items-center gap-2 me-2">
                  <div className="text-end d-none d-md-block">
                    <div className="text-white small fw-bold">
                      {user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (user.username ? `@${user.username}` : user.phone)}
                    </div>
                    {user.phone && <div className="text-gold" style={{ fontSize: '0.7rem' }}>{user.phone}</div>}
                  </div>
                  <button
                    onClick={logout}
                    className="btn btn-sm btn-outline-danger px-2 py-1"
                    title="Sign Out"
                  >
                    <i className="bi bi-box-arrow-right"></i>
                  </button>
                </div>
              ) : (
                <div className="d-flex align-items-center gap-1 me-2">
                  <button
                    onClick={() => openAuthModal('login')}
                    className="btn btn-sm btn-outline-light px-3 py-2 fw-semibold"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => openAuthModal('register')}
                    className="btn btn-sm btn-gold text-navy px-3 py-2 fw-bold"
                  >
                    Register
                  </button>
                </div>
              )}

              <Link href="/tickets" className="btn btn-gold d-flex align-items-center gap-2 shadow-sm">
                <span>🎟</span>
                <span>Choose Number</span>
              </Link>
              <Link href="/admin/login" className="btn btn-sm btn-outline-light px-3 py-2 ms-1" title="Admin Portal">
                <i className="bi bi-shield-lock"></i>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
