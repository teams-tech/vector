import 'server-only';

import { normalizeEnvValue } from './config';

export type ServerConfig = {
  chatApiUrl: string | null;
  hasErrors: boolean;
};

function normalizeHttpUrl(value: string): string | null {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export function readServerConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  const chatApiUrlValue = normalizeEnvValue(env.CHAT_API_URL);
  if (!chatApiUrlValue) {
    return {
      chatApiUrl: null,
      hasErrors: true,
    };
  }

  const chatApiUrl = normalizeHttpUrl(chatApiUrlValue);
  if (!chatApiUrl) {
    return {
      chatApiUrl: null,
      hasErrors: true,
    };
  }

  return {
    chatApiUrl,
    hasErrors: false,
  };
}

export const SERVER_CONFIG = readServerConfig();
