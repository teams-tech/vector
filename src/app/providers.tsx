'use client';

// ElevenLabs v1.0 no longer requires ConversationProvider
// The useConversation hook works directly without a context wrapper
export function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
