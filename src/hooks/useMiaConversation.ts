'use client';

import { useConversation } from '@elevenlabs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MAX_TRANSCRIPT_MESSAGES } from '@/lib/chatLimits';
import { PUBLIC_CONFIG } from '@/lib/config';
import { reportClientError } from '@/lib/clientTelemetry';

const INITIAL_STATUS = "Let's get going!";

export interface MiaMessage {
  id: string;
  role: 'user' | 'agent';
  text: string;
  timestamp: Date;
}

type UseMiaConversationResult = {
  statusText: string;
  isMuted: boolean;
  messages: MiaMessage[];
  connected: boolean;
  handleClick: () => Promise<void>;
  toggleMute: () => void;
};

export function useMiaConversation(): UseMiaConversationResult {
  const [statusText, setStatusText] = useState(INITIAL_STATUS);
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState<MiaMessage[]>([]);
  const [agentId, setAgentId] = useState<string | null>(PUBLIC_CONFIG.elevenLabsAgentId);
  const messageIdRef = useRef(0);

  const createMessage = useCallback((role: MiaMessage['role'], text: string): MiaMessage => {
    messageIdRef.current += 1;
    return {
      id: `mia-msg-${messageIdRef.current}`,
      role,
      text,
      timestamp: new Date(),
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
      setStatusText(INITIAL_STATUS);
    },
    onError: (err) => {
      reportClientError('elevenlabs_on_error', err);
      setStatusText('Error — try again');
    },
    onMessage: ({ message, role }) => {
      setMessages((prev) => [...prev, createMessage(role, message)].slice(-MAX_TRANSCRIPT_MESSAGES));
    },
  });

  useEffect(() => {
    if (agentId) {
      return;
    }

    let isActive = true;
    const controller = new AbortController();

    const loadRuntimeConfig = async () => {
      try {
        const response = await fetch('/api/public-config', {
          method: 'GET',
          credentials: 'same-origin',
          cache: 'no-store',
          signal: controller.signal,
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as { elevenLabsAgentId?: unknown };
        if (!isActive || typeof payload.elevenLabsAgentId !== 'string') {
          return;
        }

        const normalizedAgentId = payload.elevenLabsAgentId.trim();
        if (normalizedAgentId.length > 0) {
          setAgentId(normalizedAgentId);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        reportClientError('public_config_fetch_failed', error);
      }
    };

    void loadRuntimeConfig();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [agentId]);

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
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
        setStatusText('Connecting to Mia...');
        await conversation.startSession({
          agentId,
          connectionType: 'websocket',
        });
      }
    } catch (err) {
      reportClientError('mia_session_error', err);
      const errorMessage = err instanceof Error ? err.message.toLowerCase() : '';
      const looksLikeAgentConfigIssue =
        errorMessage.includes('agent')
        || errorMessage.includes('unauthorized')
        || errorMessage.includes('forbidden');

      setStatusText(
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Mic blocked — check permissions'
          : looksLikeAgentConfigIssue
            ? 'Agent unavailable — verify configuration'
            : 'Connection failed — try again'
      );
    }
  }, [agentId, conversation]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  return {
    statusText,
    isMuted,
    messages,
    connected: conversation.status === 'connected',
    handleClick,
    toggleMute,
  };
}
