'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import styles from './ChatWidget.module.css';
import { TRANSCRIPT_SCROLL_THROTTLE_MS } from '@/lib/chatLimits';
import { useChatSession } from '@/hooks/useChatSession';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const {
    messages,
    inputValue,
    setInputValue,
    isLoading,
    chatState,
    showPinInput,
    setShowPinInput,
    pinValue,
    setPinValue,
    sendMessage,
    verifyPin,
  } = useChatSession(isOpen);

  const prefersReducedMotionRef = useRef(false);
  const scrollThrottleUntilRef = useRef(0);
  const scrollRafRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const scheduleScrollToBottom = useCallback((preferSmooth: boolean) => {
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

      messagesEndRef.current?.scrollIntoView({
        behavior: preferSmooth && !prefersReducedMotionRef.current ? 'smooth' : 'auto',
        block: 'end',
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

  // Auto-scroll to bottom
  useEffect(() => {
    scheduleScrollToBottom(false);
  }, [messages, scheduleScrollToBottom]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle iOS keyboard - scroll to bottom when input focused
  useEffect(() => {
    let focusTimeoutId: ReturnType<typeof setTimeout> | null = null;
    const handleFocus = () => {
      // Small delay to let iOS keyboard fully open
      if (focusTimeoutId) {
        clearTimeout(focusTimeoutId);
      }

      focusTimeoutId = setTimeout(() => {
        scheduleScrollToBottom(true);
      }, 300);
    };

    const input = inputRef.current;
    if (input) {
      input.addEventListener('focus', handleFocus);
    }

    return () => {
      if (input) {
        input.removeEventListener('focus', handleFocus);
      }
      if (focusTimeoutId) {
        clearTimeout(focusTimeoutId);
      }
    };
  }, [isOpen, scheduleScrollToBottom]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  const handlePinKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      verifyPin();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={styles['chat-trigger']}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className={styles['chat-window']}>
          {/* Header */}
          <div className={styles['chat-header']}>
            <div className={styles['chat-header-info']}>
              <div className={styles['chat-avatar']}>M</div>
              <div>
                <div className={styles['chat-title']}>Chat with Mia</div>
                <div className={styles['chat-status']}>
                  {chatState.verified ? (
                    <span className={styles['status-verified']}>{chatState.role} access</span>
                  ) : chatState.identifier ? (
                    <span className={styles['status-identified']}>Identified</span>
                  ) : (
                    <span className={styles['status-anonymous']}>Anonymous</span>
                  )}
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className={styles['chat-close']}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className={styles['chat-messages']}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`${styles['chat-message']} ${styles[`chat-message-${msg.role}`]}`}
              >
                {msg.role === 'assistant' && (
                  <div className={styles['message-avatar']}>M</div>
                )}
                <div className={styles['message-content']}>
                  {msg.content.split('\n').map((line, j) => (
                    <p key={j}>{line}</p>
                  ))}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className={`${styles['chat-message']} ${styles['chat-message-assistant']}`}>
                <div className={styles['message-avatar']}>M</div>
                <div className={`${styles['message-content']} ${styles.typing}`}>
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* PIN Input (shown when needed) */}
          {showPinInput && (
            <div className={styles['chat-pin-input']}>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="Enter 6-digit PIN"
                value={pinValue}
                onChange={(e) => setPinValue(e.target.value.replace(/\D/g, ''))}
                onKeyPress={handlePinKeyPress}
                disabled={isLoading}
              />
              <button onClick={verifyPin} disabled={isLoading || pinValue.length !== 6}>
                Verify
              </button>
              <button onClick={() => setShowPinInput(false)} className={styles['pin-skip']}>
                Skip
              </button>
            </div>
          )}

          {/* Input */}
          <div className={styles['chat-input-container']}>
            <input
              ref={inputRef}
              type="text"
              placeholder="Type a message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            <button
              onClick={() => sendMessage(inputValue)}
              disabled={isLoading || !inputValue.trim()}
              className={styles['chat-send']}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
