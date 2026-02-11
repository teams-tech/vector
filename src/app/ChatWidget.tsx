'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface Message {
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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const logClientError = useCallback((context: string, error: unknown) => {
    if (process.env.NODE_ENV !== 'production') {
      console.error(context, error);
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle iOS keyboard - scroll to bottom when input focused
  useEffect(() => {
    const handleFocus = () => {
      // Small delay to let iOS keyboard fully open
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    };

    const input = inputRef.current;
    if (input) {
      input.addEventListener('focus', handleFocus);
      return () => input.removeEventListener('focus', handleFocus);
    }
  }, [isOpen]);

  // Initialize chat with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: "Hi! I'm Mia, your TEAMS Technology assistant. I can help with vehicle lookups, inventory questions, and more.\n\nTo get started, please share your phone number or code name so I can identify you.",
        timestamp: new Date(),
      }]);
    }
  }, [isOpen, messages.length]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
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

      const data = await response.json();

      if (data.session_id && !chatState.sessionId) {
        setChatState(prev => ({ ...prev, sessionId: data.session_id }));
      }

      if (data.identified && data.identifier) {
        setChatState(prev => ({ ...prev, identifier: data.identifier }));
      }

      if (data.verified !== undefined) {
        setChatState(prev => ({
          ...prev,
          verified: data.verified,
          role: data.role || prev.role,
        }));
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message || 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Check if we need PIN verification
      if (data.identified && !data.verified && data.message?.toLowerCase().includes('pin')) {
        setShowPinInput(true);
      }

    } catch (error) {
      logClientError('Chat request failed', error);
      setMessages(prev => [...prev, {
        role: 'system',
        content: 'Connection error. Please check your internet and try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [chatState.sessionId, chatState.identifier, isLoading, logClientError]);

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

      const data = await response.json();

      if (data.success) {
        setChatState(prev => ({
          ...prev,
          verified: true,
          role: data.role || 'employee',
        }));
        setShowPinInput(false);
        setPinValue('');

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.message || `PIN verified! You now have ${data.role} access.`,
          timestamp: new Date(),
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'system',
          content: data.message || 'PIN verification failed. Please try again.',
          timestamp: new Date(),
        }]);
      }
    } catch (error) {
      logClientError('PIN verification failed', error);
      setMessages(prev => [...prev, {
        role: 'system',
        content: 'Error verifying PIN. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
      setPinValue('');
    }
  }, [pinValue, chatState.sessionId, chatState.identifier, logClientError]);

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
        className="chat-trigger"
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
        <div className="chat-window">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-info">
              <div className="chat-avatar">M</div>
              <div>
                <div className="chat-title">Chat with Mia</div>
                <div className="chat-status">
                  {chatState.verified ? (
                    <span className="status-verified">{chatState.role} access</span>
                  ) : chatState.identifier ? (
                    <span className="status-identified">Identified</span>
                  ) : (
                    <span className="status-anonymous">Anonymous</span>
                  )}
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="chat-close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`chat-message chat-message-${msg.role}`}
              >
                {msg.role === 'assistant' && (
                  <div className="message-avatar">M</div>
                )}
                <div className="message-content">
                  {msg.content.split('\n').map((line, j) => (
                    <p key={j}>{line}</p>
                  ))}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="chat-message chat-message-assistant">
                <div className="message-avatar">M</div>
                <div className="message-content typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* PIN Input (shown when needed) */}
          {showPinInput && (
            <div className="chat-pin-input">
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
              <button onClick={() => setShowPinInput(false)} className="pin-skip">
                Skip
              </button>
            </div>
          )}

          {/* Input */}
          <div className="chat-input-container">
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
              className="chat-send"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <style>{`
        .chat-trigger {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
          border: 1px solid #333;
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(196, 30, 58, 0.2);
          transition: all 0.3s ease;
          z-index: 1000;
        }

        .chat-trigger:hover {
          border-color: #c41e3a;
          box-shadow: 0 6px 30px rgba(196, 30, 58, 0.3);
          transform: scale(1.05);
        }

        .chat-window {
          position: fixed;
          bottom: 96px;
          right: 24px;
          width: 420px;
          height: calc(100vh - 120px);
          max-height: 800px;
          background: #0d0d0d;
          border: 1px solid #222;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 8px 40px rgba(0, 0, 0, 0.5);
          z-index: 1000;
        }

        @media (max-width: 480px) {
          .chat-window {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            width: 100vw;
            height: 100%;
            height: 100dvh; /* Dynamic viewport height for iOS */
            max-height: -webkit-fill-available; /* iOS Safari keyboard handling */
            border-radius: 0;
            display: flex;
            flex-direction: column;
            z-index: 9999;
          }

          .chat-trigger {
            width: 50px;
            height: 50px;
            bottom: 20px;
            right: 16px;
          }

          .chat-header {
            padding: 12px 16px;
            padding-top: max(12px, env(safe-area-inset-top));
            flex-shrink: 0;
            min-height: 60px;
          }

          .chat-header-info {
            gap: 10px;
          }

          .chat-avatar {
            width: 36px;
            height: 36px;
            font-size: 14px;
          }

          .chat-title {
            font-size: 16px;
          }

          .chat-status {
            font-size: 12px;
          }

          .chat-messages {
            padding: 12px 16px;
            gap: 10px;
            flex: 1;
            min-height: 0; /* Important for flex overflow */
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
          }

          .message-avatar {
            width: 28px;
            height: 28px;
            font-size: 12px;
          }

          .message-content {
            padding: 10px 14px;
            font-size: 15px;
            line-height: 1.5;
          }

          .message-content p {
            margin: 0 0 6px 0;
          }

          .chat-input-container {
            padding: 12px 16px;
            padding-bottom: max(12px, env(safe-area-inset-bottom));
            flex-shrink: 0;
            background: #111;
          }

          .chat-input-container input {
            padding: 12px 14px;
            font-size: 16px; /* Prevents iOS zoom on focus */
          }

          .chat-send {
            width: 44px;
            height: 44px;
          }

          .chat-pin-input {
            padding: 12px 16px;
            padding-bottom: max(12px, env(safe-area-inset-bottom));
            flex-shrink: 0;
          }

          .chat-pin-input input {
            padding: 12px;
            font-size: 16px; /* Prevents iOS zoom */
          }

          .chat-pin-input button {
            padding: 12px 16px;
            font-size: 14px;
          }
        }

        .chat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          background: linear-gradient(180deg, #151515 0%, #0d0d0d 100%);
          border-bottom: 1px solid #222;
        }

        .chat-header-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .chat-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #c41e3a 0%, #8b1528 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 16px;
          color: #fff;
        }

        .chat-title {
          font-weight: 600;
          color: #fff;
          font-size: 15px;
        }

        .chat-status {
          font-size: 12px;
          margin-top: 2px;
        }

        .status-verified {
          color: #4ade80;
        }

        .status-identified {
          color: #fbbf24;
        }

        .status-anonymous {
          color: #666;
        }

        .chat-close {
          background: none;
          border: none;
          color: #666;
          cursor: pointer;
          padding: 4px;
          transition: color 0.2s;
        }

        .chat-close:hover {
          color: #fff;
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .chat-message {
          display: flex;
          gap: 8px;
          max-width: 85%;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .chat-message-user {
          align-self: flex-end;
          flex-direction: row-reverse;
        }

        .chat-message-assistant {
          align-self: flex-start;
        }

        .chat-message-system {
          align-self: center;
          max-width: 90%;
        }

        .message-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #c41e3a 0%, #8b1528 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          color: #fff;
          flex-shrink: 0;
        }

        .message-content {
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 14px;
          line-height: 1.5;
        }

        .chat-message-user .message-content {
          background: linear-gradient(135deg, #1e3a5f 0%, #162d4d 100%);
          color: #e0e0e0;
          border-bottom-right-radius: 4px;
        }

        .chat-message-assistant .message-content {
          background: linear-gradient(135deg, #1a1a1a 0%, #151515 100%);
          color: #c0c0c0;
          border: 1px solid #252525;
          border-bottom-left-radius: 4px;
        }

        .chat-message-system .message-content {
          background: #1a1a1a;
          color: #888;
          font-size: 13px;
          text-align: center;
          border: 1px solid #333;
        }

        .message-content p {
          margin: 0 0 8px 0;
        }

        .message-content p:last-child {
          margin-bottom: 0;
        }

        .typing {
          display: flex;
          gap: 4px;
          padding: 14px 18px;
        }

        .typing span {
          width: 8px;
          height: 8px;
          background: #444;
          border-radius: 50%;
          animation: typing 1.2s infinite;
        }

        .typing span:nth-child(2) { animation-delay: 0.2s; }
        .typing span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes typing {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }

        .chat-pin-input {
          display: flex;
          gap: 8px;
          padding: 12px 16px;
          background: #111;
          border-top: 1px solid #222;
        }

        .chat-pin-input input {
          flex: 1;
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 8px;
          padding: 10px 12px;
          color: #fff;
          font-size: 14px;
          letter-spacing: 4px;
          text-align: center;
        }

        .chat-pin-input input:focus {
          outline: none;
          border-color: #c41e3a;
        }

        .chat-pin-input button {
          padding: 10px 16px;
          background: linear-gradient(135deg, #c41e3a 0%, #8b1528 100%);
          border: none;
          border-radius: 8px;
          color: #fff;
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .chat-pin-input button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .chat-pin-input .pin-skip {
          background: #333;
        }

        .chat-input-container {
          display: flex;
          gap: 8px;
          padding: 12px 16px;
          background: #111;
          border-top: 1px solid #222;
        }

        .chat-input-container input {
          flex: 1;
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 8px;
          padding: 12px 14px;
          color: #fff;
          font-size: 14px;
        }

        .chat-input-container input:focus {
          outline: none;
          border-color: #444;
        }

        .chat-input-container input::placeholder {
          color: #555;
        }

        .chat-send {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #c41e3a 0%, #8b1528 100%);
          border: none;
          border-radius: 8px;
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.2s;
        }

        .chat-send:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .chat-send:not(:disabled):hover {
          opacity: 0.9;
        }

        /* Scrollbar */
        .chat-messages::-webkit-scrollbar {
          width: 6px;
        }

        .chat-messages::-webkit-scrollbar-track {
          background: transparent;
        }

        .chat-messages::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 3px;
        }

        .chat-messages::-webkit-scrollbar-thumb:hover {
          background: #444;
        }
      `}</style>
    </>
  );
}
