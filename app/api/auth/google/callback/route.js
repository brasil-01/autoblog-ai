import { NextResponse } from 'next/server';
import { getRedirectUri } from '@/lib/blogger';
import { getSetting, setSetting } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  const cookieState = req.cookies.get('g_oauth_state')?.value;

  const fail = (msg) => NextResponse.redirect(new URL(`/configuracoes?google=error&msg=${encodeURIComponent(msg)}`, url.origin));

  if (error) return fail(`Google recusou: ${error}`);
  if (!code) return fail('Código de autorização ausente.');
  if (!state || !cookieState || state !== cookieState) return fail('State inválido — tente conectar novamente.');

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = getRedirectUri(url.origin);

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code, client_id: clientId, client_secret: clientSecret,
      redirect_uri: redirectUri, grant_type: 'authorization_code',
    }),
  });
  const data = await res.json();
  if (!res.ok) return fail(data.error_description || data.error || 'Falha na troca do código por token.');

  // O Google só envia refresh_token na primeira autorização (prompt=consent força o envio).
  const previous = await getSetting('google_oauth');
  const merged = {
    access_token: data.access_token,
    refresh_token: data.refresh_token || previous?.refresh_token || null,
    expiry_date: Date.now() + Number(data.expires_in || 3600) * 1000,
  };
  await setSetting('google_oauth', merged);

  const out = NextResponse.redirect(new URL('/configuracoes?google=connected', url.origin));
  out.cookies.set('g_oauth_state', '', { httpOnly: true, path: '/', maxAge: 0 });
  return out;
}
