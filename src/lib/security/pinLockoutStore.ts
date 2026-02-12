import 'server-only';

import type { ChatRequestPayload } from '@/lib/chat-contract';

export const PIN_LOCKOUT_MAX_FAILURES = 3;
export const PIN_LOCKOUT_DURATION_MS = 15 * 60 * 1000;

type PinLockoutRecord = {
  failedAttempts: number;
  lockoutUntil: number;
  updatedAt: number;
};

type PinLockoutStatus = {
  locked: boolean;
  retryAfterSeconds: number;
};

const pinLockoutRecords = new Map<string, PinLockoutRecord>();

function normalizeIdentifier(identifier: string): string {
  return identifier.trim().toLowerCase();
}

function toRetryAfterSeconds(lockoutUntil: number, now: number): number {
  return Math.max(1, Math.ceil((lockoutUntil - now) / 1000));
}

function pruneStaleRecords(now: number): void {
  if (pinLockoutRecords.size < 200) {
    return;
  }

  for (const [key, record] of pinLockoutRecords.entries()) {
    const isUnlockedAndOld =
      record.lockoutUntil === 0 && now - record.updatedAt > PIN_LOCKOUT_DURATION_MS;
    const isExpiredLockoutAndOld =
      record.lockoutUntil > 0 && now > record.lockoutUntil + PIN_LOCKOUT_DURATION_MS;

    if (isUnlockedAndOld || isExpiredLockoutAndOld) {
      pinLockoutRecords.delete(key);
    }
  }
}

function readRecord(identifier: string): PinLockoutRecord | undefined {
  return pinLockoutRecords.get(normalizeIdentifier(identifier));
}

function writeRecord(identifier: string, record: PinLockoutRecord): void {
  pinLockoutRecords.set(normalizeIdentifier(identifier), record);
}

function clearRecord(identifier: string): void {
  pinLockoutRecords.delete(normalizeIdentifier(identifier));
}

export function getPinVerificationIdentifier(payload: ChatRequestPayload): string | null {
  if (typeof payload.pin !== 'string') {
    return null;
  }

  if (typeof payload.identifier !== 'string') {
    return null;
  }

  const normalized = normalizeIdentifier(payload.identifier);
  return normalized.length > 0 ? normalized : null;
}

export function getPinLockoutStatus(identifier: string, now = Date.now()): PinLockoutStatus {
  const record = readRecord(identifier);
  if (!record) {
    return { locked: false, retryAfterSeconds: 0 };
  }

  if (record.lockoutUntil > now) {
    return {
      locked: true,
      retryAfterSeconds: toRetryAfterSeconds(record.lockoutUntil, now),
    };
  }

  if (record.lockoutUntil > 0 && record.lockoutUntil <= now) {
    clearRecord(identifier);
  }

  return { locked: false, retryAfterSeconds: 0 };
}

export function recordPinVerificationResult(
  identifier: string,
  wasSuccessful: boolean,
  now = Date.now()
): PinLockoutStatus {
  pruneStaleRecords(now);

  if (wasSuccessful) {
    clearRecord(identifier);
    return { locked: false, retryAfterSeconds: 0 };
  }

  const existing = readRecord(identifier);
  if (existing && existing.lockoutUntil > now) {
    return {
      locked: true,
      retryAfterSeconds: toRetryAfterSeconds(existing.lockoutUntil, now),
    };
  }

  const nextFailedAttempts =
    existing && existing.lockoutUntil <= now ? existing.failedAttempts + 1 : 1;

  if (nextFailedAttempts >= PIN_LOCKOUT_MAX_FAILURES) {
    const lockoutUntil = now + PIN_LOCKOUT_DURATION_MS;
    writeRecord(identifier, {
      failedAttempts: 0,
      lockoutUntil,
      updatedAt: now,
    });

    return {
      locked: true,
      retryAfterSeconds: toRetryAfterSeconds(lockoutUntil, now),
    };
  }

  writeRecord(identifier, {
    failedAttempts: nextFailedAttempts,
    lockoutUntil: 0,
    updatedAt: now,
  });

  return { locked: false, retryAfterSeconds: 0 };
}
