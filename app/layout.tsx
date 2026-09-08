import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Yalfal Online Eta — 10,000 ETB Digital Lottery & Telegram Mini App',
  description: 'Pick your lucky number from 1–200 for 100 ETB. Win 10,000 ETB first prize, 1,000 ETB second prize, and 500 ETB third prize! Pay via CBE or Telebirr.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <head>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      </head>
      <body className="bg-[#f8fafc] text-slate-900 flex flex-col min-h-screen antialiased selection:bg-amber-400 selection:text-slate-950 font-sans relative overflow-x-hidden">
        {/* Soft Ambient Light Glows */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[750px] h-[500px] bg-gradient-to-b from-amber-200/40 via-yellow-100/30 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-1/3 -left-48 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl" />
          <div className="absolute top-2/3 -right-48 w-96 h-96 bg-amber-100/35 rounded-full blur-3xl" />
        </div>

        {/* Telegram WebApp Initializer Script */}
        <Script id="telegram-webapp-init" strategy="afterInteractive">
          {`
            if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
              const tg = window.Telegram.WebApp;
              tg.ready();
              tg.expand();
              if (tg.initData) {
                // Auto-authenticate Telegram Mini App user
                fetch('/api/auth/telegram', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ initData: tg.initData }),
                }).catch(() => {});
              }
            }
          `}
        </Script>

        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
