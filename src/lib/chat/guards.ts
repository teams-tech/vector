import { NextRequest } from 'next/server';

export function isSameOrigin(request: NextRequest): boolean {
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
