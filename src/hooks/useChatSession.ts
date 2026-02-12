'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { sanitizeChatResponse, type ChatResponsePayload } from '@/lib/chat-contract';
import { MAX_TRANSCRIPT_MESSAGES } from '@/lib/chatLimits';

const CHAT_API_URL = '/api/chat';
const WELCOME_MESSAGE =
  "Hi! I'm Mia, your TEAMS Technology assistant. I can help with vehicle lookups, inventory questions, and more.\n\nTo get started, please share your phone number or code name so I can identify you.";

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ChatState {
  sessionId: string | null;
  identifier: string | null;
  verified: boolean;
  role: string;
}

type UseChatSessionResult = {
  messages: ChatMessage[];
  inputValue: string;
  setInputValue: (value: string) => void;
  isLoading: boolean;
  chatState: ChatState;
  showPinInput: boolean;
  setShowPinInput: (show: boolean) => void;
  pinValue: string;
  setPinValue: (value: string) => void;
  sendMessage: (content: string) => Promise<void>;
  verifyPin: () => Promise<void>;
};

export function useChatSession(isOpen: boolean): UseChatSessionResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
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

  const logClientError = useCallback((context: string, error: unknown) => {
    if (process.env.NODE_ENV !== 'production') {
      console.error(context, error);
    }
  }, []);

  const appendMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message].slice(-MAX_TRANSCRIPT_MESSAGES));
  }, []);

  const createMessage = useCallback(
    (role: ChatMessage['role'], content: string): ChatMessage => {
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
    if (isOpen && messages.length === 0) {
      setMessages([createMessage('assistant', WELCOME_MESSAGE)]);
    }
  }, [createMessage, isOpen, messages.length]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      appendMessage(createMessage('user', content.trim()));
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
          setChatState((prev) => ({ ...prev, sessionId }));
        }

        const identifier = data.identifier;
        if (data.identified && typeof identifier === 'string') {
          setChatState((prev) => ({ ...prev, identifier }));
        }

        const verified = data.verified;
        if (typeof verified === 'boolean') {
          setChatState((prev) => ({
            ...prev,
            verified,
            role: data.role || prev.role,
          }));
        }

        appendMessage(
          createMessage('assistant', data.message || 'I apologize, but I encountered an error. Please try again.')
        );

        if (data.identified && !data.verified && data.message?.toLowerCase().includes('pin')) {
          setShowPinInput(true);
        }
      } catch (error) {
        logClientError('Chat request failed', error);
        appendMessage(createMessage('system', 'Connection error. Please check your internet and try again.'));
      } finally {
        setIsLoading(false);
      }
    },
    [appendMessage, chatState.sessionId, chatState.identifier, createMessage, isLoading, logClientError]
  );

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
        setChatState((prev) => ({
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

  return {
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
  };
}
