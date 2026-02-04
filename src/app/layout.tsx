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

        {/* Floating Chat Widget */}
        {/* @ts-expect-error - Custom element from ElevenLabs */}
        <elevenlabs-convai agent-id="agent_8701kft0qqnceac80688vb207xta" />

        {/* Custom styling for the widget to match dark theme */}
        <style>{`
          elevenlabs-convai {
            --elevenlabs-convai-widget-width: 380px;
            --elevenlabs-convai-widget-height: 520px;
          }

          elevenlabs-convai::part(widget) {
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
          }

          elevenlabs-convai::part(trigger) {
            background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
            border: 1px solid #333;
            box-shadow: 0 4px 20px rgba(196, 30, 58, 0.15);
            transition: all 0.3s ease;
          }

          elevenlabs-convai::part(trigger):hover {
            border-color: #c41e3a;
            box-shadow: 0 6px 30px rgba(196, 30, 58, 0.25);
            transform: scale(1.05);
          }
        `}</style>
      </body>
    </html>
  );
}
