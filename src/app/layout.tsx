import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'TEAMS Technology | Voice Assistant',
  description: 'AI-powered dealership management voice assistant by TEAMS Technology',
  icons: { icon: '/icon.svg', apple: '/icon.svg' },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'Mia',
    statusBarStyle: 'black-translucent',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
