import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const isAuthenticated =
    request.cookies.get('priceverify_session')?.value === 'authenticated';
  const isLoginPage = request.nextUrl.pathname === '/login';

  if (isLoginPage && isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (!isLoginPage && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
