import { NextResponse } from 'next/server';
import { sha256Hex, AUTH_COOKIE, AUTH_MAX_AGE } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  const { password } = await req.json().catch(() => ({}));
  const expected = process.env.APP_PASSWORD;

  // Sem APP_PASSWORD definida, o app roda aberto (modo desenvolvimento).
  if (!expected) {
    const res = NextResponse.json({ ok: true, dev: true });
    return res;
  }
  if (String(password || '') !== expected) {
    return NextResponse.json({ error: 'Senha incorreta.' }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, sha256Hex(expected), {
    httpOnly: true,
    path: '/',
    maxAge: AUTH_MAX_AGE,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  return res;
}
