import { NextRequest } from 'next/server';

export function isAllowedOrigin(
  request: NextRequest,
  allowedOrigins: ReadonlySet<string>
): boolean {
  const originHeader = request.headers.get('origin');

  if (!originHeader) {
    return false;
  }

  try {
    const origin = new URL(originHeader);
    if (origin.protocol !== 'http:' && origin.protocol !== 'https:') {
      return false;
    }

    return allowedOrigins.has(origin.origin);
  } catch {
    return false;
  }
}
