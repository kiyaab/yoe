'use client';

export interface AuthUser {
  id: string;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  telegramId?: string | null;
}

export function getClientToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('yalfal_token');
}

export function getClientUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('yalfal_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isClientAdmin(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('yalfal_is_admin') === 'true';
}

export function setClientAuth(token: string, user: AuthUser, isAdmin: boolean = false) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('yalfal_token', token);
  localStorage.setItem('yalfal_user', JSON.stringify(user));
  localStorage.setItem('yalfal_is_admin', isAdmin ? 'true' : 'false');
  window.dispatchEvent(
    new CustomEvent('yalfal-auth-change', {
      detail: { authenticated: true, token, user, isAdmin },
    })
  );
}

export function clearClientAuth() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('yalfal_token');
  localStorage.removeItem('yalfal_user');
  localStorage.removeItem('yalfal_is_admin');
  window.dispatchEvent(
    new CustomEvent('yalfal-auth-change', {
      detail: { authenticated: false, token: null, user: null, isAdmin: false },
    })
  );
}

/**
 * Universal client fetch wrapper that automatically:
 * 1. Attaches Authorization: Bearer <token> from localStorage
 * 2. Attaches x-telegram-init-data if inside Telegram WebApp
 * 3. Includes credentials for cookie support
 */
export async function apiFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers || {});

  const token = getClientToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (typeof window !== 'undefined') {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.initData && !headers.has('x-telegram-init-data')) {
      headers.set('x-telegram-init-data', tg.initData);
    }
  }

  return fetch(url, {
    ...init,
    headers,
    credentials: 'include',
  });
}
