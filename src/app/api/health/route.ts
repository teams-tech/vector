import { NextRequest, NextResponse } from 'next/server';
import { SERVER_CONFIG } from '@/lib/config.server';
import { REQUEST_ID_HEADER_NAME, resolveRequestId, writeStructuredLog } from '@/lib/observability';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const requestId = resolveRequestId(request);
  const checks = {
    chat_api_url_configured: Boolean(SERVER_CONFIG.chatApiUrl),
    chat_allowed_origins_configured: SERVER_CONFIG.chatAllowedOrigins.size > 0,
  };

  const ready = checks.chat_api_url_configured && checks.chat_allowed_origins_configured;
  const statusCode = ready ? 200 : 503;
  const status = ready ? 'ok' : 'degraded';

  writeStructuredLog('health_check', {
    request_id: requestId,
    method: request.method,
    path: request.nextUrl.pathname,
    status,
    status_code: statusCode,
    chat_api_url_configured: checks.chat_api_url_configured,
    chat_allowed_origins_configured: checks.chat_allowed_origins_configured,
  });

  return NextResponse.json(
    {
      status,
      timestamp: new Date().toISOString(),
      checks,
    },
    {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-store',
        [REQUEST_ID_HEADER_NAME]: requestId,
      },
    }
  );
}
