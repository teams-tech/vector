import { NextResponse } from 'next/server';

export type TimingBreakdown = {
  guard: number;
  parse: number;
  validate: number;
  upstream: number;
  sanitize: number;
};

export function createTimingBreakdown(): TimingBreakdown {
  return {
    guard: 0,
    parse: 0,
    validate: 0,
    upstream: 0,
    sanitize: 0,
  };
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

export function respondWithTiming(
  body: unknown,
  status: number,
  startedAt: number,
  timing: TimingBreakdown,
  additionalHeaders?: Record<string, string>
): NextResponse {
  const totalMs = performance.now() - startedAt;
  const headers: Record<string, string> = {
    'Cache-Control': 'no-store',
    'Server-Timing': formatServerTiming(timing, totalMs),
    'X-Chat-Proxy-Total-Ms': totalMs.toFixed(1),
    ...additionalHeaders,
  };

  return NextResponse.json(body, {
    status,
    headers,
  });
}
