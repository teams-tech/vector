import {
  sanitizeChatResponse,
  type ChatRequestPayload,
  type ChatResponsePayload,
} from '@/lib/chat-contract';

export type UpstreamCallResult =
  | {
      ok: true;
      status: number;
      payload: ChatResponsePayload;
      upstreamMs: number;
      sanitizeMs: number;
    }
  | {
      ok: false;
      status: 502 | 504;
      message: string;
      upstreamMs: number;
      sanitizeMs: number;
    };

export async function callChatUpstream(
  chatUpstreamUrl: string,
  requestPayload: ChatRequestPayload,
  timeoutMs: number
): Promise<UpstreamCallResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const upstreamStart = performance.now();

  try {
    const upstreamResponse = await fetch(chatUpstreamUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestPayload),
      cache: 'no-store',
      signal: controller.signal,
    });

    const upstreamText = await upstreamResponse.text();
    const upstreamMs = performance.now() - upstreamStart;
    const sanitizeStart = performance.now();
    let upstreamJson: unknown;

    try {
      upstreamJson = JSON.parse(upstreamText);
    } catch {
      return {
        ok: false,
        status: 502,
        message: 'Chat service returned invalid data.',
        upstreamMs,
        sanitizeMs: performance.now() - sanitizeStart,
      };
    }

    return {
      ok: true,
      status: upstreamResponse.status,
      payload: sanitizeChatResponse(upstreamJson),
      upstreamMs,
      sanitizeMs: performance.now() - sanitizeStart,
    };
  } catch (error) {
    const upstreamMs = performance.now() - upstreamStart;

    if (error instanceof Error && error.name === 'AbortError') {
      return {
        ok: false,
        status: 504,
        message: 'Chat service timeout.',
        upstreamMs,
        sanitizeMs: 0,
      };
    }

    return {
      ok: false,
      status: 502,
      message: 'Chat service unavailable.',
      upstreamMs,
      sanitizeMs: 0,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
