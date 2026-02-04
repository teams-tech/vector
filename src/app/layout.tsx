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
      <head>
        {/* ElevenLabs Convai Widget Embed */}
        <script src="https://unpkg.com/@elevenlabs/convai-widget-embed" async type="text/javascript" />
      </head>
      <body>
        <Providers>{children}</Providers>

        {/* Floating Chat Widget - Dark theme with cardinal red accent */}
        {/* @ts-expect-error - Custom element from ElevenLabs */}
        <elevenlabs-convai
          agent-id="agent_8701kft0qqnceac80688vb207xta"
          avatar-orb-color-1="#c41e3a"
          avatar-orb-color-2="#1a1a1a"
        />
      </body>
    </html>
  );
}
