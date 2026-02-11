'use client';

import { useConversation } from '@elevenlabs/react';
import { useCallback, useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'agent';
  text: string;
  timestamp: Date;
}

export default function MiaWidget() {
  const [statusText, setStatusText] = useState("Let's get going!");
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const scratchpadRef = useRef<HTMLDivElement>(null);
  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

  const logClientError = useCallback((context: string, err: unknown) => {
    if (process.env.NODE_ENV !== 'production') {
      console.error(context, err);
    }
  }, []);

  const conversation = useConversation({
    micMuted: isMuted,
    onConnect: () => {
      setStatusText('Connected — speak now');
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
        { role, text: message, timestamp: new Date() },
      ]);
    },
  });

  // Auto-scroll scratchpad
  useEffect(() => {
    if (scratchpadRef.current) {
      scratchpadRef.current.scrollTop = scratchpadRef.current.scrollHeight;
    }
  }, [messages]);

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
    <div className="mia-container">
      {/* Main button */}
      <button
        onClick={handleClick}
        className={`mia-btn ${connected ? 'mia-active' : ''}`}
      >
        <div className={`mia-ring ${connected ? 'mia-ring-pulse' : ''}`}>
          <div className="mia-avatar">M</div>
        </div>
        <span className="mia-label">{statusText}</span>
      </button>

      {/* Controls (only show when connected) */}
      {connected && (
        <div className="mia-controls">
          <button
            onClick={toggleMute}
            className={`mia-control-btn ${isMuted ? 'mia-muted' : ''}`}
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
        <div className="mia-scratchpad" ref={scratchpadRef}>
          {messages.length === 0 ? (
            <div className="mia-scratchpad-empty">
              Conversation will appear here...
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`mia-message mia-message-${msg.role}`}>
                <span className="mia-message-role">
                  {msg.role === 'agent' ? 'Mia' : 'You'}
                </span>
                <span className="mia-message-text">{msg.text}</span>
              </div>
            ))
          )}
        </div>
      )}

      <style>{`
        .mia-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .mia-controls {
          display: flex;
          gap: 12px;
        }

        .mia-control-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 1px solid #333;
          background: #1a1a1a;
          color: #888;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .mia-control-btn:hover {
          border-color: #555;
          color: #fff;
        }

        .mia-control-btn.mia-muted {
          border-color: #c41e3a;
          color: #c41e3a;
        }

        .mia-scratchpad {
          width: 100%;
          max-width: 500px;
          min-height: 200px;
          max-height: 300px;
          overflow-y: auto;
          background: linear-gradient(180deg, #0c0c0c 0%, #111 100%);
          border: 1px solid #1a1a1a;
          border-radius: 8px;
          padding: 16px;
          font-size: 13px;
          line-height: 1.6;
        }

        .mia-scratchpad-empty {
          color: #333;
          text-align: center;
          font-style: italic;
          padding: 40px 0;
        }

        .mia-message {
          margin-bottom: 12px;
          padding: 10px 14px;
          border-radius: 8px;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .mia-message-agent {
          background: linear-gradient(135deg, #1a1a1a, #222);
          border-left: 2px solid #d4a574;
        }

        .mia-message-user {
          background: linear-gradient(135deg, #151515, #1a1a1a);
          border-left: 2px solid #4a6fa5;
        }

        .mia-message-role {
          display: block;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .mia-message-agent .mia-message-role {
          color: #d4a574;
        }

        .mia-message-user .mia-message-role {
          color: #4a6fa5;
        }

        .mia-message-text {
          color: #888;
          font-weight: 300;
        }

        /* Scrollbar styling */
        .mia-scratchpad::-webkit-scrollbar {
          width: 6px;
        }

        .mia-scratchpad::-webkit-scrollbar-track {
          background: #0a0a0a;
        }

        .mia-scratchpad::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 3px;
        }

        .mia-scratchpad::-webkit-scrollbar-thumb:hover {
          background: #444;
        }
      `}</style>
    </div>
  );
}
