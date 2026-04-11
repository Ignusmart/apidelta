import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Use auth() as a wrapper to get session info, handle demo mode bypass
export default auth((req) => {
  const isDemo = req.nextUrl.searchParams.get('demo') === 'true';

  if (isDemo) {
    // Set a header that the layout can read to skip auth check
    const response = NextResponse.next();
    response.headers.set('x-demo-mode', '1');
    return response;
  }

  // Redirect unauthenticated users to sign-in
  if (!req.auth) {
    const signInUrl = new URL('/sign-in', req.nextUrl.origin);
    signInUrl.searchParams.set('callbackUrl', req.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/dashboard/:path*'],
};
