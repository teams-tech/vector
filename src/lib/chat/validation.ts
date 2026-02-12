import { sanitizeChatRequest, type ChatRequestPayload } from '@/lib/chat-contract';

export type ParseJsonResult =
  | { ok: true; value: unknown }
  | { ok: false };

export function hasJsonContentType(contentTypeHeader: string | null): boolean {
  const contentType = contentTypeHeader?.toLowerCase() ?? '';
  return contentType.includes('application/json');
}

export async function parseJsonBody(request: Request): Promise<ParseJsonResult> {
  try {
    return { ok: true, value: await request.json() };
  } catch {
    return { ok: false };
  }
}

export function validateChatRequestPayload(payload: unknown): ChatRequestPayload | null {
  return sanitizeChatRequest(payload);
}
