/*import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PREFIXES = [
  '/privado',
  '/cruds',
  '/ordenes-trabajo',
  '/personal',
  '/aviones',
  '/stock',
  '/avisos',
  '/archivadas',
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const needsAuth = PROTECTED_PREFIXES.some(p => pathname.startsWith(p));
  if (!needsAuth) return NextResponse.next();

  // Chequea si existe la cookie que pone el backend
  const hasCookie = req.cookies.get('cc_access')?.value;
  if (!hasCookie) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';               // tu página de login
    url.searchParams.set('from', pathname); // opcional: para volver luego
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/privado/:path*',
    '/cruds/:path*',
    '/ordenes-trabajo/:path*',
    '/personal/:path*',
    '/aviones/:path*',
    '/stock/:path*',
    '/avisos/:path*',
    '/archivadas/:path*',
  ],
};
*/





// middleware.ts (versión suave)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(_req: NextRequest) {
  return NextResponse.next(); // no bloquea nada
}

export const config = {
  matcher: [
    '/privado/:path*',
    '/cruds/:path*',
    '/ordenes-trabajo/:path*',
    '/personal/:path*',
    '/aviones/:path*',
    '/stock/:path*',
    '/avisos/:path*',
    '/archivadas/:path*',
  ],
};
