import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getRedirectUri } from '@/lib/blogger';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({
      error: 'GOOGLE_CLIENT_ID não configurado. Crie um projeto no Google Cloud, ative a Blogger API v3 e configure o OAuth 2.0 (veja o guia, seção Blogger).',
    }, { status: 400 });
  }
  const origin = new URL(req.url).origin;
  const redirectUri = getRedirectUri(origin);
  const state = crypto.randomUUID();

  const url = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/blogger',
    access_type: 'offline',
    prompt: 'consent',
    state,
  });

  const res = NextResponse.redirect(url);
  res.cookies.set('g_oauth_state', state, { httpOnly: true, path: '/', maxAge: 600, sameSite: 'lax' });
  return res;
}
