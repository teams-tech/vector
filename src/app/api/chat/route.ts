import { NextRequest, NextResponse } from 'next/server';

const CHAT_UPSTREAM_URL = process.env.CHAT_API_URL;
const REQUEST_TIMEOUT_MS = 12000;
const MAX_MESSAGE_LENGTH = 4000;
const MAX_IDENTIFIER_LENGTH = 128;
const MAX_SESSION_ID_LENGTH = 128;
const MAX_PIN_LENGTH = 12;

type ChatRequestPayload = {
  session_id?: string | null;
  message: string;
  identifier?: string | null;
  pin?: string;
};

type UpstreamChatResponse = {
  session_id?: unknown;
  message?: unknown;
  identified?: unknown;
  identifier?: unknown;
  verified?: unknown;
  role?: unknown;
  success?: unknown;
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

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

function sanitizeChatRequest(payload: unknown): ChatRequestPayload | null {
  if (!isObject(payload)) {
    return null;
  }

  if (typeof payload.message !== 'string') {
    return null;
  }

  const message = payload.message.trim();
  if (message.length === 0 || message.length > MAX_MESSAGE_LENGTH) {
    return null;
  }

  const sanitized: ChatRequestPayload = { message };

  if (payload.session_id !== undefined && payload.session_id !== null) {
    if (typeof payload.session_id !== 'string' || payload.session_id.length > MAX_SESSION_ID_LENGTH) {
      return null;
    }
    sanitized.session_id = payload.session_id;
  }

  if (payload.identifier !== undefined && payload.identifier !== null) {
    if (typeof payload.identifier !== 'string' || payload.identifier.length > MAX_IDENTIFIER_LENGTH) {
      return null;
    }
    sanitized.identifier = payload.identifier;
  }

  if (payload.pin !== undefined) {
    if (typeof payload.pin !== 'string' || payload.pin.length === 0 || payload.pin.length > MAX_PIN_LENGTH) {
      return null;
    }
    sanitized.pin = payload.pin;
  }

  return sanitized;
}

function sanitizeChatResponse(payload: UpstreamChatResponse): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  if (typeof payload.session_id === 'string') sanitized.session_id = payload.session_id;
  if (typeof payload.message === 'string') sanitized.message = payload.message;
  if (typeof payload.identified === 'boolean') sanitized.identified = payload.identified;
  if (typeof payload.identifier === 'string') sanitized.identifier = payload.identifier;
  if (typeof payload.verified === 'boolean') sanitized.verified = payload.verified;
  if (typeof payload.role === 'string') sanitized.role = payload.role;
  if (typeof payload.success === 'boolean') sanitized.success = payload.success;

  return sanitized;
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ message: 'Forbidden origin.' }, { status: 403 });
  }

  if (!CHAT_UPSTREAM_URL) {
    return NextResponse.json({ message: 'Chat service is unavailable.' }, { status: 503 });
  }

  const contentType = request.headers.get('content-type')?.toLowerCase() ?? '';
  if (!contentType.includes('application/json')) {
    return NextResponse.json({ message: 'Unsupported content type.' }, { status: 415 });
  }

  let requestBody: unknown;
  try {
    requestBody = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON payload.' }, { status: 400 });
  }

  const sanitizedRequest = sanitizeChatRequest(requestBody);
  if (!sanitizedRequest) {
    return NextResponse.json({ message: 'Invalid request payload.' }, { status: 400 });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const upstreamResponse = await fetch(CHAT_UPSTREAM_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sanitizedRequest),
      cache: 'no-store',
      signal: controller.signal,
    });

    const upstreamText = await upstreamResponse.text();
    let upstreamJson: UpstreamChatResponse;

    try {
      upstreamJson = JSON.parse(upstreamText) as UpstreamChatResponse;
    } catch {
      return NextResponse.json({ message: 'Chat service returned invalid data.' }, { status: 502 });
    }

    return NextResponse.json(sanitizeChatResponse(upstreamJson), {
      status: upstreamResponse.status,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({ message: 'Chat service timeout.' }, { status: 504 });
    }

    return NextResponse.json({ message: 'Chat service unavailable.' }, { status: 502 });
  } finally {
    clearTimeout(timeoutId);
  }
}
