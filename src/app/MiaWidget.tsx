'use client';

import { useCallback, useRef, useEffect } from 'react';
import styles from './MiaWidget.module.css';
import { TRANSCRIPT_SCROLL_THROTTLE_MS } from '@/lib/chatLimits';
import { useMiaConversation } from '@/hooks/useMiaConversation';

export default function MiaWidget() {
  const { statusText, isMuted, messages, connected, handleClick, toggleMute } = useMiaConversation();
  const prefersReducedMotionRef = useRef(false);
  const scrollThrottleUntilRef = useRef(0);
  const scrollRafRef = useRef<number | null>(null);
  const scratchpadRef = useRef<HTMLDivElement>(null);

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

  // Auto-scroll scratchpad
  useEffect(() => {
    scheduleScratchpadScroll(false);
  }, [messages, scheduleScratchpadScroll]);

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
