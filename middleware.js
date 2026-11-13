import { NextResponse } from 'next/server';

const PUBLIC_PREFIXES = ['/login', '/api/auth/login', '/api/auth/logout', '/api/cron'];

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(text)));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function middleware(req) {
  const expected = process.env.APP_PASSWORD;
  if (!expected) return NextResponse.next(); // modo desenvolvimento sem senha

  const { pathname } = req.nextUrl;
  if (PUBLIC_PREFIXES.some(p => pathname.startsWith(p))) return NextResponse.next();

  const cookie = req.cookies.get('autoblog_auth')?.value;
  const expectedHash = await sha256Hex(expected);
  if (cookie && cookie === expectedHash) return NextResponse.next();

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Não autenticado. Faça login em /login.' }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.search = '';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
