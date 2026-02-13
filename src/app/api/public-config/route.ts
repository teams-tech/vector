import { NextResponse } from 'next/server';
import { readPublicConfig } from '@/lib/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const config = readPublicConfig(process.env);

  return NextResponse.json(
    {
      elevenLabsAgentId: config.elevenLabsAgentId,
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}
