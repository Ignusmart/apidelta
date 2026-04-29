import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

const API_BASE = process.env.API_URL ?? 'http://localhost:3001/api';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }
  const userId = (session.user as Record<string, unknown>).id as string | undefined;
  if (!userId) {
    return NextResponse.json({ error: 'Session has no user id' }, { status: 401 });
  }

  // userId is sourced from the server-side session — never trust the client
  // body for this. The API endpoint accepts userId because it's only called
  // from this trusted route.
  const res = await fetch(
    `${API_BASE}/team/invites/by-token/${encodeURIComponent(token)}/accept`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    },
  );

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('Content-Type') ?? 'application/json' },
  });
}
