/**
 * On-demand ISR revalidation endpoint.
 *
 * The API revalidation worker POSTs here after it updates match data.
 * Secured with a shared secret token (REVALIDATION_TOKEN env var).
 *
 * POST /api/revalidate
 * Body: { path: string, token: string }
 *
 * Called from: apps/api/src/jobs/workers/revalidation.worker.ts
 * Env var:     NEXT_REVALIDATION_TOKEN (must match API's NEXT_REVALIDATION_TOKEN)
 */
import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  let body: { path?: string; token?: string };

  try {
    body = await request.json() as { path?: string; token?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { path, token } = body;

  if (!token || token !== process.env.REVALIDATION_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!path || typeof path !== 'string') {
    return NextResponse.json({ error: 'Missing path' }, { status: 400 });
  }

  try {
    revalidatePath(path);
    return NextResponse.json({ revalidated: true, path });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
