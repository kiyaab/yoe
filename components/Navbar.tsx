'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Ticket, Trophy, User as UserIcon, ShieldAlert, LogOut, Menu, X, Sparkles } from 'lucide-react';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setUser(data.user);
          setIsAdmin(Boolean(data.isAdmin));
        }
      })
      .catch(() => {});
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/me', { method: 'DELETE' });
    setUser(null);
    setIsAdmin(false);
    router.push('/');
    router.refresh();
  };

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Pick Numbers (1–200)', href: '/tickets', icon: Ticket },
    { label: 'Live Draw', href: '/draw', icon: Trophy },
  ];

  if (user) {
    navLinks.push({ label: 'My Tickets', href: '/my-tickets', icon: Sparkles });
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/85 backdrop-blur-xl border-b border-slate-200/80 px-4 lg:px-8 py-3.5 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)] transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-black text-xl shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
            🎡
          </div>
          <div>
            <div className="font-extrabold text-lg tracking-wider text-slate-900 flex items-center gap-1.5">
              YALFAL <span className="text-amber-800 font-semibold text-xs uppercase px-2 py-0.5 rounded-full bg-amber-100/80 border border-amber-300/60">Online Eta</span>
            </div>
            <div className="text-[10px] text-slate-500 font-medium tracking-wide">
              100 ETB • 200 Numbers • 10,000 ETB Jackpot
            </div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1.5">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-amber-50 text-amber-900 border border-amber-300/80 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                {link.icon && <link.icon className="w-4 h-4 text-amber-600" />}
                {link.label}
              </Link>
            );
          })}

          {isAdmin && (
            <Link
              href="/admin"
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                pathname.startsWith('/admin')
                  ? 'bg-rose-50 text-rose-800 border border-rose-300/80 shadow-sm'
                  : 'text-rose-600 hover:bg-rose-50/80'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              Admin Suite
            </Link>
          )}
        </div>

        {/* User / Auth Actions */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs font-bold text-slate-900">
                  {user.firstName || user.username || user.phone || 'User'}
                </div>
                <div className="text-[10px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Verified</div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 transition-colors"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-950 rounded-lg hover:bg-slate-100 transition"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 rounded-lg hover:brightness-105 shadow-sm shadow-amber-500/20 transition"
              >
                Register
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 text-slate-600 hover:text-slate-950 rounded-lg hover:bg-slate-100"
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {menuOpen && (
        <div className="md:hidden pt-4 pb-2 border-t border-slate-200/80 mt-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              {link.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-rose-700 bg-rose-50"
            >
              Admin Suite
            </Link>
          )}
          <div className="pt-3 border-t border-slate-200/80">
            {user ? (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg"
              >
                Log Out
              </button>
            ) : (
              <div className="flex gap-2 pt-1">
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex-1 text-center py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMenuOpen(false)}
                  className="flex-1 text-center py-2 text-sm font-bold text-slate-950 bg-amber-400 rounded-lg shadow-sm"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
