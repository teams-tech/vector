import { NextRequest, NextResponse } from 'next/server';
import { sanitizeChatRequest, sanitizeChatResponse } from '@/lib/chat-contract';
import { SERVER_CONFIG } from '@/lib/config.server';

const REQUEST_TIMEOUT_MS = 12000;

type TimingBreakdown = {
  guard: number;
  parse: number;
  validate: number;
  upstream: number;
  sanitize: number;
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isSameOrigin(request: NextRequest): boolean {
  const originHeader = request.headers.get('origin');

  if (!originHeader) {
    return true;
  }

  try {
    const origin = new URL(originHeader);
    const requestUrl = new URL(request.url);
    return origin.protocol === requestUrl.protocol && origin.host === requestUrl.host;
  } catch {
    return false;
  }
}


function formatServerTiming(timing: TimingBreakdown, totalMs: number): string {
  return [
    `guard;dur=${timing.guard.toFixed(1)}`,
    `parse;dur=${timing.parse.toFixed(1)}`,
    `validate;dur=${timing.validate.toFixed(1)}`,
    `upstream;dur=${timing.upstream.toFixed(1)}`,
    `sanitize;dur=${timing.sanitize.toFixed(1)}`,
    `total;dur=${totalMs.toFixed(1)}`,
  ].join(', ');
}

export async function POST(request: NextRequest) {
  const startedAt = performance.now();
  const timing: TimingBreakdown = {
    guard: 0,
    parse: 0,
    validate: 0,
    upstream: 0,
    sanitize: 0,
  };

  const respond = (body: unknown, status: number): NextResponse => {
    const totalMs = performance.now() - startedAt;
    return NextResponse.json(body, {
      status,
      headers: {
        'Cache-Control': 'no-store',
        'Server-Timing': formatServerTiming(timing, totalMs),
        'X-Chat-Proxy-Total-Ms': totalMs.toFixed(1),
      },
    });
  };

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

  const contentType = request.headers.get('content-type')?.toLowerCase() ?? '';
  if (!contentType.includes('application/json')) {
    timing.guard = performance.now() - guardStart;
    return respond({ message: 'Unsupported content type.' }, 415);
  }
  timing.guard = performance.now() - guardStart;

  const parseStart = performance.now();
  let requestBody: unknown;
  try {
    requestBody = await request.json();
  } catch {
    timing.parse = performance.now() - parseStart;
    return respond({ message: 'Invalid JSON payload.' }, 400);
  }
  timing.parse = performance.now() - parseStart;

  const validateStart = performance.now();
  const sanitizedRequest = sanitizeChatRequest(requestBody);
  if (!sanitizedRequest) {
    timing.validate = performance.now() - validateStart;
    return respond({ message: 'Invalid request payload.' }, 400);
  }
  timing.validate = performance.now() - validateStart;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const upstreamStart = performance.now();

  try {
    const upstreamResponse = await fetch(chatUpstreamUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sanitizedRequest),
      cache: 'no-store',
      signal: controller.signal,
    });

    const upstreamText = await upstreamResponse.text();
    timing.upstream = performance.now() - upstreamStart;
    const sanitizeStart = performance.now();
    let upstreamJson: unknown;

    try {
      upstreamJson = JSON.parse(upstreamText);
    } catch {
      timing.sanitize = performance.now() - sanitizeStart;
      return respond({ message: 'Chat service returned invalid data.' }, 502);
    }

    const responsePayload = sanitizeChatResponse(upstreamJson);
    timing.sanitize = performance.now() - sanitizeStart;
    return respond(responsePayload, upstreamResponse.status);
  } catch (error) {
    timing.upstream = performance.now() - upstreamStart;
    if (error instanceof Error && error.name === 'AbortError') {
      return respond({ message: 'Chat service timeout.' }, 504);
    }

    return respond({ message: 'Chat service unavailable.' }, 502);
  } finally {
    clearTimeout(timeoutId);
  }
}
