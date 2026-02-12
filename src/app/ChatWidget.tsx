'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import styles from './ChatWidget.module.css';
import { MAX_TRANSCRIPT_MESSAGES, TRANSCRIPT_SCROLL_THROTTLE_MS } from '@/lib/chatLimits';
import { sanitizeChatResponse, type ChatResponsePayload } from '@/lib/chat-contract';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface ChatState {
  sessionId: string | null;
  identifier: string | null;
  verified: boolean;
  role: string;
}

const CHAT_API_URL = '/api/chat';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatState, setChatState] = useState<ChatState>({
    sessionId: null,
    identifier: null,
    verified: false,
    role: 'unverified',
  });
  const [showPinInput, setShowPinInput] = useState(false);
  const [pinValue, setPinValue] = useState('');

  const messageIdRef = useRef(0);
  const prefersReducedMotionRef = useRef(false);
  const scrollThrottleUntilRef = useRef(0);
  const scrollRafRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const logClientError = useCallback((context: string, error: unknown) => {
    if (process.env.NODE_ENV !== 'production') {
      console.error(context, error);
    }
  }, []);

  const appendMessage = useCallback((message: Message) => {
    setMessages((prev) => [...prev, message].slice(-MAX_TRANSCRIPT_MESSAGES));
  }, []);

  const createMessage = useCallback(
    (role: Message['role'], content: string): Message => {
      messageIdRef.current += 1;
      return {
        id: `chat-msg-${messageIdRef.current}`,
        role,
        content,
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

  // Initialize chat with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        createMessage(
          'assistant',
          "Hi! I'm Mia, your TEAMS Technology assistant. I can help with vehicle lookups, inventory questions, and more.\n\nTo get started, please share your phone number or code name so I can identify you."
        ),
      ]);
    }
  }, [createMessage, isOpen, messages.length]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage = createMessage('user', content.trim());
    appendMessage(userMessage);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch(CHAT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        cache: 'no-store',
        body: JSON.stringify({
          session_id: chatState.sessionId,
          message: content.trim(),
          identifier: chatState.identifier,
        }),
      });

      const data: ChatResponsePayload = sanitizeChatResponse(await response.json());

      const sessionId = data.session_id;
      if (typeof sessionId === 'string' && !chatState.sessionId) {
        setChatState(prev => ({ ...prev, sessionId }));
      }

      const identifier = data.identifier;
      if (data.identified && typeof identifier === 'string') {
        setChatState(prev => ({ ...prev, identifier }));
      }

      const verified = data.verified;
      if (typeof verified === 'boolean') {
        setChatState(prev => ({
          ...prev,
          verified,
          role: data.role || prev.role,
        }));
      }

      const assistantMessage = createMessage(
        'assistant',
        data.message || 'I apologize, but I encountered an error. Please try again.'
      );
      appendMessage(assistantMessage);

      // Check if we need PIN verification
      if (data.identified && !data.verified && data.message?.toLowerCase().includes('pin')) {
        setShowPinInput(true);
      }

    } catch (error) {
      logClientError('Chat request failed', error);
      appendMessage(createMessage('system', 'Connection error. Please check your internet and try again.'));
    } finally {
      setIsLoading(false);
    }
  }, [appendMessage, chatState.sessionId, chatState.identifier, createMessage, isLoading, logClientError]);

  const verifyPin = useCallback(async () => {
    if (!pinValue || pinValue.length !== 6 || !chatState.identifier) return;

    setIsLoading(true);

    try {
      const response = await fetch(CHAT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        cache: 'no-store',
        body: JSON.stringify({
          session_id: chatState.sessionId,
          message: 'Verifying PIN...',
          identifier: chatState.identifier,
          pin: pinValue,
        }),
      });

      const data: ChatResponsePayload = sanitizeChatResponse(await response.json());

      if (data.success) {
        setChatState(prev => ({
          ...prev,
          verified: true,
          role: data.role || 'employee',
        }));
        setShowPinInput(false);
        setPinValue('');

        appendMessage(createMessage('assistant', data.message || `PIN verified! You now have ${data.role} access.`));
      } else {
        appendMessage(createMessage('system', data.message || 'PIN verification failed. Please try again.'));
      }
    } catch (error) {
      logClientError('PIN verification failed', error);
      appendMessage(createMessage('system', 'Error verifying PIN. Please try again.'));
    } finally {
      setIsLoading(false);
      setPinValue('');
    }
  }, [appendMessage, pinValue, chatState.sessionId, chatState.identifier, createMessage, logClientError]);

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
