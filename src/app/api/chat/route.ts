import { NextRequest } from 'next/server';
import { isAllowedOrigin } from '@/lib/chat/guards';
import { callChatUpstream } from '@/lib/chat/upstream';
import { createTimingBreakdown, respondWithTiming } from '@/lib/chat/response';
import { hasJsonContentType, parseJsonBody, validateChatRequestPayload } from '@/lib/chat/validation';
import { SERVER_CONFIG } from '@/lib/config.server';
import { enforceChatRateLimit } from '@/lib/security/rateLimit';
import {
  getPinLockoutStatus,
  getPinVerificationIdentifier,
  recordPinVerificationResult,
} from '@/lib/security/pinLockoutStore';

const REQUEST_TIMEOUT_MS = 12000;

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const PIN_LOCKED_MESSAGE = 'Too many failed PIN attempts. Please try again later.';

export async function POST(request: NextRequest) {
  const startedAt = performance.now();
  const timing = createTimingBreakdown();

  const respond = (body: unknown, status: number, headers?: Record<string, string>) =>
    respondWithTiming(body, status, startedAt, timing, headers);

  const guardStart = performance.now();
  if (SERVER_CONFIG.hasErrors || !SERVER_CONFIG.chatApiUrl) {
    timing.guard = performance.now() - guardStart;
    return respond({ message: 'Chat service is unavailable.' }, 503);
  }
  const chatUpstreamUrl = SERVER_CONFIG.chatApiUrl;

  if (!isAllowedOrigin(request, SERVER_CONFIG.chatAllowedOrigins)) {
    timing.guard = performance.now() - guardStart;
    return respond({ message: 'Forbidden origin.' }, 403);
  }

  if (!hasJsonContentType(request.headers.get('content-type'))) {
    timing.guard = performance.now() - guardStart;
    return respond({ message: 'Unsupported content type.' }, 415);
  }
  timing.guard = performance.now() - guardStart;

  const parseStart = performance.now();
  const parsedBody = await parseJsonBody(request);
  if (!parsedBody.ok) {
    timing.parse = performance.now() - parseStart;
    return respond({ message: 'Invalid JSON payload.' }, 400);
  }
  timing.parse = performance.now() - parseStart;

  const validateStart = performance.now();
  const sanitizedRequest = validateChatRequestPayload(parsedBody.value);
  if (!sanitizedRequest) {
    timing.validate = performance.now() - validateStart;
    return respond({ message: 'Invalid request payload.' }, 400);
  }
  timing.validate = performance.now() - validateStart;
  const pinIdentifier = getPinVerificationIdentifier(sanitizedRequest);

  if (pinIdentifier) {
    const lockoutStatus = getPinLockoutStatus(pinIdentifier);
    if (lockoutStatus.locked) {
      return respond(
        {
          message: PIN_LOCKED_MESSAGE,
          lockout_seconds_remaining: lockoutStatus.retryAfterSeconds,
        },
        423
      );
    }
  }

  const rateLimitDecision = enforceChatRateLimit(request, sanitizedRequest);
  if (!rateLimitDecision.allowed) {
    return respond(
      {
        message: 'Rate limit exceeded. Please retry later.',
        scope: rateLimitDecision.scope,
        retry_after_seconds: rateLimitDecision.retryAfterSeconds,
      },
      429,
      {
        'Retry-After': String(rateLimitDecision.retryAfterSeconds),
        'X-RateLimit-Limit': String(rateLimitDecision.limit),
        'X-RateLimit-Remaining': String(rateLimitDecision.remaining),
        'X-RateLimit-Scope': rateLimitDecision.scope,
      }
    );
  }

  const upstreamResult = await callChatUpstream(chatUpstreamUrl, sanitizedRequest, REQUEST_TIMEOUT_MS);
  timing.upstream = upstreamResult.upstreamMs;
  timing.sanitize = upstreamResult.sanitizeMs;

  if (!upstreamResult.ok) {
    return respond({ message: upstreamResult.message }, upstreamResult.status);
  }

  if (pinIdentifier) {
    const wasSuccessful = upstreamResult.payload.success === true || upstreamResult.payload.verified === true;
    const lockoutStatus = recordPinVerificationResult(pinIdentifier, wasSuccessful);
    if (lockoutStatus.locked) {
      return respond(
        {
          message: PIN_LOCKED_MESSAGE,
          lockout_seconds_remaining: lockoutStatus.retryAfterSeconds,
        },
        423
      );
    }
  }

  return respond(upstreamResult.payload, upstreamResult.status);
}
