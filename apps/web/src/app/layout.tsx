import type { Metadata } from 'next';
import { Manrope, IBM_Plex_Mono } from 'next/font/google';
import { AuthProvider } from '../components/auth/AuthProvider';
import './globals.css';

const manrope = Manrope({ 
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
});

const plexMono = IBM_Plex_Mono({ 
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-plex-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TemporalRent - Temporal Inventory Platform',
  description: 'Manage physical rental inventory across time, accounting for operational windows and concurrent bookings.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${manrope.variable} ${plexMono.variable}`}>
      <body className="font-sans antialiased bg-background text-text">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
