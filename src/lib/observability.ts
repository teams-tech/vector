import 'server-only';

import type { NextRequest } from 'next/server';

type LogValue = string | number | boolean | null;

export const REQUEST_ID_HEADER_NAME = 'X-Request-Id';
const REQUEST_ID_INPUT_PATTERN = /^[A-Za-z0-9._:-]{8,128}$/;

function generateRequestId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

function normalizeRequestId(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!REQUEST_ID_INPUT_PATTERN.test(trimmed)) {
    return null;
  }

  return trimmed;
}

export function resolveRequestId(request: NextRequest): string {
  const directRequestId = normalizeRequestId(request.headers.get('x-request-id'));
  if (directRequestId) {
    return directRequestId;
  }

  const correlationRequestId = normalizeRequestId(request.headers.get('x-correlation-id'));
  if (correlationRequestId) {
    return correlationRequestId;
  }

  return generateRequestId();
}

export function writeStructuredLog(event: string, fields: Record<string, LogValue | undefined>): void {
  const payload: Record<string, LogValue> = {
    event,
    timestamp: new Date().toISOString(),
  };

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      payload[key] = value;
    }
  }

  try {
    process.stdout.write(`${JSON.stringify(payload)}\n`);
  } catch {
    // Do not impact request flow if logging serialization fails.
  }
}
