import 'server-only';

import type { NextRequest } from 'next/server';
import type { ChatRequestPayload } from '@/lib/chat-contract';

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_IP_REQUESTS = 60;
const RATE_LIMIT_MAX_IDENTITY_REQUESTS = 30;

type Scope = 'ip' | 'identity';

type BucketRecord = {
  count: number;
  windowStartMs: number;
  updatedAtMs: number;
};

type BucketResult = {
  allowed: boolean;
  retryAfterSeconds: number;
  remaining: number;
  limit: number;
};

export type RateLimitDecision =
  | { allowed: true }
  | {
      allowed: false;
      retryAfterSeconds: number;
      remaining: number;
      limit: number;
      scope: Scope;
    };

const bucketStore = new Map<string, BucketRecord>();

function normalizeIdentifier(identifier: string): string | null {
  const normalized = identifier.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function extractClientIp(request: NextRequest): string | null {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0]?.trim();
    if (firstIp) {
      return firstIp;
    }
  }

  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp) {
    return realIp;
  }

  return null;
}

function resolveIdentityKey(payload: ChatRequestPayload): string | null {
  if (typeof payload.identifier === 'string') {
    const identifier = normalizeIdentifier(payload.identifier);
    if (identifier) {
      return `identifier:${identifier}`;
    }
  }

  if (typeof payload.session_id === 'string') {
    const sessionId = normalizeIdentifier(payload.session_id);
    if (sessionId) {
      return `session:${sessionId}`;
    }
  }

  return null;
}

function toRetryAfterSeconds(nowMs: number, windowStartMs: number): number {
  const retryAfterMs = windowStartMs + RATE_LIMIT_WINDOW_MS - nowMs;
  return Math.max(1, Math.ceil(retryAfterMs / 1000));
}

function pruneBuckets(nowMs: number): void {
  if (bucketStore.size < 1000) {
    return;
  }

  bucketStore.forEach((record, key) => {
    if (nowMs - record.updatedAtMs > RATE_LIMIT_WINDOW_MS * 2) {
      bucketStore.delete(key);
    }
  });
}

function consumeBucket(
  storeKey: string,
  limit: number,
  nowMs: number
): BucketResult {
  const existing = bucketStore.get(storeKey);

  if (!existing || nowMs - existing.windowStartMs >= RATE_LIMIT_WINDOW_MS) {
    bucketStore.set(storeKey, {
      count: 1,
      windowStartMs: nowMs,
      updatedAtMs: nowMs,
    });
    return {
      allowed: true,
      retryAfterSeconds: 0,
      remaining: limit - 1,
      limit,
    };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: toRetryAfterSeconds(nowMs, existing.windowStartMs),
      remaining: 0,
      limit,
    };
  }

  existing.count += 1;
  existing.updatedAtMs = nowMs;

  return {
    allowed: true,
    retryAfterSeconds: 0,
    remaining: Math.max(0, limit - existing.count),
    limit,
  };
}

function evaluateScope(
  scope: Scope,
  key: string | null,
  limit: number,
  nowMs: number
): RateLimitDecision {
  if (!key) {
    return { allowed: true };
  }

  const result = consumeBucket(`${scope}:${key}`, limit, nowMs);
  if (result.allowed) {
    return { allowed: true };
  }

  return {
    allowed: false,
    retryAfterSeconds: result.retryAfterSeconds,
    remaining: result.remaining,
    limit: result.limit,
    scope,
  };
}

export function enforceChatRateLimit(
  request: NextRequest,
  payload: ChatRequestPayload,
  nowMs = Date.now()
): RateLimitDecision {
  pruneBuckets(nowMs);

  const ipDecision = evaluateScope('ip', extractClientIp(request), RATE_LIMIT_MAX_IP_REQUESTS, nowMs);
  if (!ipDecision.allowed) {
    return ipDecision;
  }

  const identityDecision = evaluateScope(
    'identity',
    resolveIdentityKey(payload),
    RATE_LIMIT_MAX_IDENTITY_REQUESTS,
    nowMs
  );
  if (!identityDecision.allowed) {
    return identityDecision;
  }

  return { allowed: true };
}
