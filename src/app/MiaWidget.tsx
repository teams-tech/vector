'use client';

import { useConversation } from '@elevenlabs/react';
import { useCallback, useState } from 'react';

export default function MiaWidget() {
  const [statusText, setStatusText] = useState("Let's get going!");

  const conversation = useConversation({
    onConnect: () => {
      console.log('ElevenLabs: connected');
      setStatusText('Connected — speak now');
    },
    onDisconnect: () => {
      console.log('ElevenLabs: disconnected');
      setStatusText("Let's get going!");
    },
    onError: (err) => {
      console.error('ElevenLabs onError:', err);
      setStatusText('Error — try again');
    },
  });

  const handleClick = useCallback(async () => {
    console.log('Button clicked, status:', conversation.status);
    try {
      if (conversation.status === 'connected') {
        await conversation.endSession();
      } else {
        setStatusText('Requesting mic...');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('Mic granted, tracks:', stream.getTracks().length);
        setStatusText('Connecting to Mia...');
        const sessionId = await conversation.startSession({
          agentId: 'agent_8701kft0qqnceac80688vb207xta',
          connectionType: 'websocket',
        });
        console.log('Session started:', sessionId);
      }
    } catch (err) {
      console.error('handleClick error:', err);
      setStatusText(
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Mic blocked — check permissions'
          : 'Connection failed — try again'
      );
    }
  }, [conversation]);

  const connected = conversation.status === 'connected';

  return (
    <button
      onClick={handleClick}
      className={`mia-btn ${connected ? 'mia-active' : ''}`}
    >
      <div className={`mia-ring ${connected ? 'mia-ring-pulse' : ''}`}>
        <div className="mia-avatar">M</div>
      </div>
      <span className="mia-label">{statusText}</span>
    </button>
  );
}
