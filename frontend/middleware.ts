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
