import { NextRequest } from 'next/server';
import { isSameOrigin } from '@/lib/chat/guards';
import { callChatUpstream } from '@/lib/chat/upstream';
import { createTimingBreakdown, respondWithTiming } from '@/lib/chat/response';
import { hasJsonContentType, parseJsonBody, validateChatRequestPayload } from '@/lib/chat/validation';
import { SERVER_CONFIG } from '@/lib/config.server';

const REQUEST_TIMEOUT_MS = 12000;

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const startedAt = performance.now();
  const timing = createTimingBreakdown();

  const respond = (body: unknown, status: number) => respondWithTiming(body, status, startedAt, timing);

  const guardStart = performance.now();
  if (!isSameOrigin(request)) {
    timing.guard = performance.now() - guardStart;
    return respond({ message: 'Forbidden origin.' }, 403);
  }

  if (!SERVER_CONFIG.chatApiUrl) {
    timing.guard = performance.now() - guardStart;
    return respond({ message: 'Chat service is unavailable.' }, 503);
  }
  const chatUpstreamUrl = SERVER_CONFIG.chatApiUrl;

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

  const upstreamResult = await callChatUpstream(chatUpstreamUrl, sanitizedRequest, REQUEST_TIMEOUT_MS);
  timing.upstream = upstreamResult.upstreamMs;
  timing.sanitize = upstreamResult.sanitizeMs;

  if (!upstreamResult.ok) {
    return respond({ message: upstreamResult.message }, upstreamResult.status);
  }

  return respond(upstreamResult.payload, upstreamResult.status);
}
