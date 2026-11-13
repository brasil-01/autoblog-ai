// ============================================
// Blogger API v3 — OAuth 2.0 + publicação rascunho
// ============================================
import { getSetting, setSetting } from './db';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';

export async function getGoogleConnection() {
  const envRefresh = process.env.GOOGLE_REFRESH_TOKEN;
  const stored = await getSetting('google_oauth');
  const refreshToken = stored?.refresh_token || envRefresh || null;
  return {
    connected: !!(refreshToken || stored?.access_token),
    expiry_date: stored?.expiry_date || null,
    via_env: !!envRefresh && !stored?.refresh_token,
  };
}

export async function getAccessToken() {
  const stored = await getSetting('google_oauth');
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const now = Date.now();

  if (stored?.access_token && stored?.expiry_date && stored.expiry_date > now + 60_000) {
    return stored.access_token;
  }
  // precisa renovar
  const refreshToken = stored?.refresh_token || process.env.GOOGLE_REFRESH_TOKEN;
  if (!refreshToken) throw new Error('Blogger não conectado. Vá em Configurações → Conectar Blogger (ou defina GOOGLE_REFRESH_TOKEN).');
  if (!clientId || !clientSecret) throw new Error('GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET não configurados.');

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Falha ao renovar token do Google: ${data.error_description || data.error || res.status}`);

  const next = {
    access_token: data.access_token,
    refresh_token: data.refresh_token || refreshToken,
    expiry_date: now + (Number(data.expires_in || 3600) * 1000),
  };
  await setSetting('google_oauth', next);
  return next.access_token;
}

export async function getBlogId() {
  const fromSettings = await getSetting('blogger_blog_id');
  return fromSettings || process.env.BLOGGER_BLOG_ID || null;
}

export async function getBlogInfo() {
  const blogId = await getBlogId();
  if (!blogId) throw new Error('BLOGGER_BLOG_ID não configurado (Configurações → Blogger ou variável de ambiente).');
  const token = await getAccessToken();
  const res = await fetch(`https://www.googleapis.com/blogger/v3/blogs/${blogId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `Blogger ${res.status}`);
  return data;
}

export async function publishDraft({ title, html, labels = [] }) {
  const blogId = await getBlogId();
  if (!blogId) throw new Error('BLOGGER_BLOG_ID não configurado.');
  const token = await getAccessToken();

  const res = await fetch(`https://www.googleapis.com/blogger/v3/blogs/${blogId}/posts/?isDraft=true`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      kind: 'blogger#post',
      title,
      content: html,
      labels: labels.slice(0, 20),
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `Blogger ${res.status}`);
  return data; // { id, url, ... }
}

export const GOOGLE_REDIRECT_PATH = '/api/auth/google/callback';
export function getRedirectUri(origin) {
  const base = (process.env.APP_URL || origin || 'http://localhost:3000').replace(/\/+$/, '');
  return `${base}${GOOGLE_REDIRECT_PATH}`;
}
