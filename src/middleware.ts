import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/auth-session';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (
    pathname === '/api/auth/login' ||
    pathname === '/api/auth/recuperar' ||
    pathname === '/api/auth/restablecer' ||
    pathname === '/api/auth/logout' ||
    pathname === '/api/health' ||
    pathname === '/recuperar-contrasena' ||
    pathname === '/restablecer-contrasena' ||
    pathname === '/prueba-correo' ||
    pathname === '/api/correo/prueba'
  ) {
    return NextResponse.next();
  }

  const isAuthenticated = await verifySessionToken(
    request.cookies.get(SESSION_COOKIE_NAME)?.value,
    process.env.AUTH_SESSION_SECRET,
  );
  const isLoginPage = pathname === '/login';
  const isApiRoute = pathname.startsWith('/api/');

  if (isLoginPage && isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (!isLoginPage && !isAuthenticated) {
    if (isApiRoute) {
      return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });
    }

    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
