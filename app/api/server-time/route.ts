import { NextResponse } from 'next/server';

/**
 * Returns the server's current UTC timestamp (ms since epoch).
 * Clients compute an offset (serverTimestamp - Date.now()) and apply it
 * to all shift time calculations so no local clock manipulation is possible.
 */
export async function GET() {
  return NextResponse.json({
    timestamp: Date.now(),
    iso: new Date().toISOString(),
  });
}
