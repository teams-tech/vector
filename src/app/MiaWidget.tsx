'use client';

import { useConversation } from '@elevenlabs/react';
import { useCallback, useState, useRef, useEffect } from 'react';
import styles from './MiaWidget.module.css';
import { MAX_TRANSCRIPT_MESSAGES, TRANSCRIPT_SCROLL_THROTTLE_MS } from '@/lib/chatLimits';
import { PUBLIC_CONFIG } from '@/lib/config';

interface Message {
  id: string;
  role: 'user' | 'agent';
  text: string;
  timestamp: Date;
}

export default function MiaWidget() {
  const [statusText, setStatusText] = useState("Let's get going!");
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const messageIdRef = useRef(0);
  const prefersReducedMotionRef = useRef(false);
  const scrollThrottleUntilRef = useRef(0);
  const scrollRafRef = useRef<number | null>(null);
  const scratchpadRef = useRef<HTMLDivElement>(null);
  const agentId = PUBLIC_CONFIG.elevenLabsAgentId;

  const logClientError = useCallback((context: string, err: unknown) => {
    if (process.env.NODE_ENV !== 'production') {
      console.error(context, err);
    }
  }, []);

  const createMessage = useCallback(
    (role: Message['role'], text: string): Message => {
      messageIdRef.current += 1;
      return {
        id: `mia-msg-${messageIdRef.current}`,
        role,
        text,
        timestamp: new Date(),
      };
    },
    []
  );

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => {
      prefersReducedMotionRef.current = mediaQuery.matches;
    };

    updatePreference();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updatePreference);
      return () => mediaQuery.removeEventListener('change', updatePreference);
    }

    mediaQuery.addListener(updatePreference);
    return () => mediaQuery.removeListener(updatePreference);
  }, []);

  const scheduleScratchpadScroll = useCallback((preferSmooth: boolean) => {
    if (typeof window === 'undefined') {
      return;
    }

    if (scrollRafRef.current !== null) {
      return;
    }

    scrollRafRef.current = window.requestAnimationFrame(() => {
      scrollRafRef.current = null;

      const now = performance.now();
      if (now < scrollThrottleUntilRef.current) {
        return;
      }
      scrollThrottleUntilRef.current = now + TRANSCRIPT_SCROLL_THROTTLE_MS;

      const scratchpad = scratchpadRef.current;
      if (!scratchpad) {
        return;
      }

      scratchpad.scrollTo({
        top: scratchpad.scrollHeight,
        behavior: preferSmooth && !prefersReducedMotionRef.current ? 'smooth' : 'auto',
      });
    });
  }, []);

  useEffect(() => {
    return () => {
      if (scrollRafRef.current !== null && typeof window !== 'undefined') {
        window.cancelAnimationFrame(scrollRafRef.current);
        scrollRafRef.current = null;
      }
    };
  }, []);

  const conversation = useConversation({
    micMuted: isMuted,
    onConnect: () => {
      setStatusText('Connected — speak now');
      messageIdRef.current = 0;
      setMessages([]);
    },
    onDisconnect: () => {
      setStatusText("Let's get going!");
    },
    onError: (err) => {
      logClientError('ElevenLabs onError:', err);
      setStatusText('Error — try again');
    },
    onMessage: ({ message, role }) => {
      setMessages((prev) => [
        ...prev,
        createMessage(role, message),
      ].slice(-MAX_TRANSCRIPT_MESSAGES));
    },
  });

  // Auto-scroll scratchpad
  useEffect(() => {
    scheduleScratchpadScroll(false);
  }, [messages, scheduleScratchpadScroll]);

  const handleClick = useCallback(async () => {
    try {
      if (conversation.status === 'connected') {
        await conversation.endSession();
      } else {
        if (!agentId) {
          setStatusText('Agent not configured');
          return;
        }

        setStatusText('Requesting mic...');
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setStatusText('Connecting to Mia...');
        await conversation.startSession({
          agentId,
          connectionType: 'websocket',
        });
      }
    } catch (err) {
      logClientError('Mia session error:', err);
      setStatusText(
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Mic blocked — check permissions'
          : 'Connection failed — try again'
      );
    }
  }, [agentId, conversation, logClientError]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const connected = conversation.status === 'connected';

  return (
    <div className={styles['mia-container']}>
      {/* Main button */}
      <button
        onClick={handleClick}
        className={`${styles['mia-btn']} ${connected ? styles['mia-active'] : ''}`}
      >
        <div className={`${styles['mia-ring']} ${connected ? styles['mia-ring-pulse'] : ''}`}>
          <div className={styles['mia-avatar']}>M</div>
        </div>
        <span className={styles['mia-label']}>{statusText}</span>
      </button>

      {/* Controls (only show when connected) */}
      {connected && (
        <div className={styles['mia-controls']}>
          <button
            onClick={toggleMute}
            className={`${styles['mia-control-btn']} ${isMuted ? styles['mia-muted'] : ''}`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="1" y1="1" x2="23" y2="23" />
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            )}
          </button>
        </div>
      )}

      {/* Scratchpad */}
      {connected && (
        <div className={styles['mia-scratchpad']} ref={scratchpadRef}>
          {messages.length === 0 ? (
            <div className={styles['mia-scratchpad-empty']}>
              Conversation will appear here...
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`${styles['mia-message']} ${styles[`mia-message-${msg.role}`]}`}>
                <span className={styles['mia-message-role']}>
                  {msg.role === 'agent' ? 'Mia' : 'You'}
                </span>
                <span className={styles['mia-message-text']}>{msg.text}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
