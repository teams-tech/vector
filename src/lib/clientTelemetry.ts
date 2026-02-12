'use client';

type TelemetryPrimitive = string | number | boolean | null;

type TelemetryEventPayload = {
  type: 'client_error';
  context: string;
  timestamp: string;
  error: {
    name?: string;
    message?: string;
    code?: string;
  };
  metadata?: Record<string, TelemetryPrimitive>;
};

const MAX_TEXT_LENGTH = 256;
const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const LONG_DIGIT_PATTERN = /\b\d{5,}\b/g;
const TOKEN_PATTERN = /\b(?:bearer|token|apikey|api_key|secret)\s*[:=]\s*[^\s,;]+/gi;

declare global {
  interface Window {
    __TEAMS_CLIENT_TELEMETRY__?: (payload: TelemetryEventPayload) => void;
  }
}

function sanitizeText(value: string): string {
  const trimmed = value.trim();
  const redacted = trimmed
    .replace(EMAIL_PATTERN, '[redacted-email]')
    .replace(LONG_DIGIT_PATTERN, '[redacted-number]')
    .replace(TOKEN_PATTERN, '[redacted-secret]');

  return redacted.slice(0, MAX_TEXT_LENGTH);
}

function sanitizeContext(context: string): string {
  const safeContext = sanitizeText(context);
  return safeContext.length > 0 ? safeContext : 'client_error';
}

function sanitizeMetadata(metadata?: Record<string, unknown>): Record<string, TelemetryPrimitive> | undefined {
  if (!metadata) {
    return undefined;
  }

  const sanitized: Record<string, TelemetryPrimitive> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeText(value);
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      sanitized[key] = value;
    } else if (value === null) {
      sanitized[key] = null;
    }
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

function sanitizeError(error: unknown): TelemetryEventPayload['error'] {
  if (error instanceof Error) {
    const result: TelemetryEventPayload['error'] = {
      name: sanitizeText(error.name),
      message: sanitizeText(error.message),
    };

    const candidateCode = (error as Error & { code?: unknown }).code;
    if (typeof candidateCode === 'string') {
      result.code = sanitizeText(candidateCode);
    }

    return result;
  }

  if (typeof error === 'string') {
    return { message: sanitizeText(error) };
  }

  if (typeof error === 'object' && error !== null) {
    const maybeName = (error as { name?: unknown }).name;
    const maybeMessage = (error as { message?: unknown }).message;
    const maybeCode = (error as { code?: unknown }).code;

    return {
      name: typeof maybeName === 'string' ? sanitizeText(maybeName) : undefined,
      message: typeof maybeMessage === 'string' ? sanitizeText(maybeMessage) : 'Unknown error',
      code: typeof maybeCode === 'string' ? sanitizeText(maybeCode) : undefined,
    };
  }

  return { message: 'Unknown error' };
}

export function reportClientError(
  context: string,
  error: unknown,
  metadata?: Record<string, unknown>
): void {
  const payload: TelemetryEventPayload = {
    type: 'client_error',
    context: sanitizeContext(context),
    timestamp: new Date().toISOString(),
    error: sanitizeError(error),
    metadata: sanitizeMetadata(metadata),
  };

  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.dispatchEvent(
      new CustomEvent<TelemetryEventPayload>('teams:client-error', {
        detail: payload,
      })
    );

    if (typeof window.__TEAMS_CLIENT_TELEMETRY__ === 'function') {
      window.__TEAMS_CLIENT_TELEMETRY__(payload);
    }
  } catch {
    // Swallow telemetry reporting failures to avoid impacting user interactions.
  }
}
