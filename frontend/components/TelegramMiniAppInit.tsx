'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        initDataUnsafe?: {
          user?: {
            id: number;
            first_name?: string;
            last_name?: string;
            username?: string;
            language_code?: string;
          };
        };
        HapticFeedback?: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
        };
        MainButton?: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
        };
      };
    };
  }
}

export default function TelegramMiniAppInit() {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();

      const user = tg.initDataUnsafe?.user;
      if (user && user.id) {
        localStorage.setItem('yalfal_user_telegram_id', user.id.toString());
        if (user.username) {
          localStorage.setItem('yalfal_user_username', user.username);
        }
        if (user.first_name) {
          localStorage.setItem('yalfal_user_first_name', user.first_name);
        }
        console.log(`📱 Telegram Mini App initialized for @${user.username || user.first_name} (ID: ${user.id})`);
      }
    }
  }, []);

  return null;
}
