export const MAX_MESSAGE_LENGTH = 4000;
export const MAX_IDENTIFIER_LENGTH = 128;
export const MAX_SESSION_ID_LENGTH = 128;
export const MAX_PIN_LENGTH = 12;

export type ChatRequestPayload = {
  session_id?: string | null;
  message: string;
  identifier?: string | null;
  pin?: string;
};

export type ChatResponsePayload = {
  session_id?: string;
  message?: string;
  identified?: boolean;
  identifier?: string;
  verified?: boolean;
  role?: string;
  success?: boolean;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function sanitizeChatRequest(payload: unknown): ChatRequestPayload | null {
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

export function sanitizeChatResponse(payload: unknown): ChatResponsePayload {
  if (!isObject(payload)) {
    return {};
  }

  const sanitized: ChatResponsePayload = {};

  if (typeof payload.session_id === 'string') sanitized.session_id = payload.session_id;
  if (typeof payload.message === 'string') sanitized.message = payload.message;
  if (typeof payload.identified === 'boolean') sanitized.identified = payload.identified;
  if (typeof payload.identifier === 'string') sanitized.identifier = payload.identifier;
  if (typeof payload.verified === 'boolean') sanitized.verified = payload.verified;
  if (typeof payload.role === 'string') sanitized.role = payload.role;
  if (typeof payload.success === 'boolean') sanitized.success = payload.success;

  return sanitized;
}
