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
    <html lang="en" className="dark">
      <head>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      </head>
      <body className="bg-[#07090e] text-gray-100 flex flex-col min-h-screen antialiased selection:bg-amber-500 selection:text-black">
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
