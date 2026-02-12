import 'server-only';

import { normalizeEnvValue } from './config';

export type ServerConfig = {
  chatApiUrl: string | null;
  chatAllowedOrigins: ReadonlySet<string>;
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

function normalizeOrigin(value: string): string | null {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.origin;
  } catch {
    return null;
  }
}

function parseAllowedOrigins(value: string | null): string[] | null {
  if (!value) {
    return null;
  }

  const entries = value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  if (entries.length === 0) {
    return null;
  }

  const normalizedOrigins: string[] = [];
  for (const entry of entries) {
    const normalized = normalizeOrigin(entry);
    if (!normalized) {
      return null;
    }
    normalizedOrigins.push(normalized);
  }

  return [...new Set(normalizedOrigins)];
}

export function readServerConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  const chatApiUrlValue = normalizeEnvValue(env.CHAT_API_URL);
  const chatAllowedOriginsValue = normalizeEnvValue(env.CHAT_ALLOWED_ORIGINS);
  const chatApiUrl = chatApiUrlValue ? normalizeHttpUrl(chatApiUrlValue) : null;
  const chatAllowedOriginsList = parseAllowedOrigins(chatAllowedOriginsValue);
  const hasErrors = !chatApiUrl || !chatAllowedOriginsList;

  return {
    chatApiUrl,
    chatAllowedOrigins: new Set(chatAllowedOriginsList ?? []),
    hasErrors,
  };
}

export const SERVER_CONFIG = readServerConfig();
