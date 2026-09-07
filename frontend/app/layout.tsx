import type { Metadata } from 'next';
import '../styles/globals.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TelegramMiniAppInit from '../components/TelegramMiniAppInit';
import { AuthProvider } from '../components/AuthContext';
import AuthModal from '../components/AuthModal';

export const metadata: Metadata = {
  title: '🎡 Yalfal Online Eta — Your Number. Your Chance. Your Moment.',
  description:
    'Ethiopia’s Telegram-first paid-number digital lottery platform. Choose numbers from 1–200, pay via CBE or Telebirr, and win up to 10,000 ETB in live verifiable draws.',
  keywords: [
    'Ethiopia lottery',
    'Yalfal Online Eta',
    'Telebirr lottery',
    'CBE Birr',
    'Telegram lottery Ethiopia',
    'lucky number 1-200',
  ],
  openGraph: {
    title: '🎡 Yalfal Online Eta — Official Lottery Draw',
    description: 'Choose your lucky number from 1 to 200 and enter the live draw for 10,000 ETB.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🎡</text></svg>" />
        <script src="https://telegram.org/js/telegram-web-app.js"></script>
      </head>
      <body>
        <AuthProvider>
          <TelegramMiniAppInit />
          <AuthModal />
          <Navbar />
          <main className="flex-grow-1">{children}</main>
          <Footer />
        </AuthProvider>
        <script
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
          async
        ></script>
      </body>
    </html>
  );
}
