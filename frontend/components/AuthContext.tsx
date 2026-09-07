'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';

export interface UserProfile {
  id: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  telegramId: string;
  status?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  authModalOpen: boolean;
  authModalTab: 'login' | 'register';
  authModalReason: string;
  openAuthModal: (tab?: 'login' | 'register', reason?: string) => void;
  closeAuthModal: () => void;
  login: (identifier: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    phone: string;
    firstName: string;
    lastName?: string;
    password: string;
    telegramUsername?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true,
  authModalOpen: false,
  authModalTab: 'login',
  authModalReason: '',
  openAuthModal: () => {},
  closeAuthModal: () => {},
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');
  const [authModalReason, setAuthModalReason] = useState('');

  useEffect(() => {
    // Check saved session in localStorage
    const savedToken = localStorage.getItem('yalfal_user_token');
    const savedUserData = localStorage.getItem('yalfal_user_data');

    if (savedToken && savedUserData) {
      try {
        const parsed = JSON.parse(savedUserData);
        setUser(parsed);
        setToken(savedToken);
      } catch (e) {
        localStorage.removeItem('yalfal_user_token');
        localStorage.removeItem('yalfal_user_data');
      }
    } else {
      // Check if running inside Telegram Mini App
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe?.user) {
        const tgUser = window.Telegram.WebApp.initDataUnsafe.user;
        if (tgUser && tgUser.id) {
          const autoUser: UserProfile = {
            id: tgUser.id.toString(),
            telegramId: tgUser.id.toString(),
            username: tgUser.username,
            firstName: tgUser.first_name,
            lastName: tgUser.last_name,
          };
          setUser(autoUser);
          localStorage.setItem('yalfal_user_telegram_id', tgUser.id.toString());
        }
      }
    }
    setLoading(false);
  }, []);

  const openAuthModal = (tab: 'login' | 'register' = 'login', reason: string = '') => {
    setAuthModalTab(tab);
    setAuthModalReason(reason);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
    setAuthModalReason('');
  };

  const login = async (identifier: string, pass: string) => {
    try {
      const res = await api.userLogin({ identifier, password: pass });
      if (res.accessToken && res.user) {
        setToken(res.accessToken);
        setUser(res.user);
        localStorage.setItem('yalfal_user_token', res.accessToken);
        localStorage.setItem('yalfal_user_data', JSON.stringify(res.user));
        localStorage.setItem('yalfal_user_telegram_id', res.user.telegramId);
        if (res.user.phone) localStorage.setItem('yalfal_user_phone', res.user.phone);
        closeAuthModal();
        return { success: true };
      }
      return { success: false, error: 'Login failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  const register = async (data: {
    phone: string;
    firstName: string;
    lastName?: string;
    password: string;
    telegramUsername?: string;
  }) => {
    try {
      const res = await api.userRegister(data);
      if (res.accessToken && res.user) {
        setToken(res.accessToken);
        setUser(res.user);
        localStorage.setItem('yalfal_user_token', res.accessToken);
        localStorage.setItem('yalfal_user_data', JSON.stringify(res.user));
        localStorage.setItem('yalfal_user_telegram_id', res.user.telegramId);
        if (res.user.phone) localStorage.setItem('yalfal_user_phone', res.user.phone);
        closeAuthModal();
        return { success: true };
      }
      return { success: false, error: 'Registration failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('yalfal_user_token');
    localStorage.removeItem('yalfal_user_data');
    localStorage.removeItem('yalfal_user_phone');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        loading,
        authModalOpen,
        authModalTab,
        authModalReason,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
