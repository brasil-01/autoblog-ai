// ============================================
// WordPress REST API — publicação como RASCUNHO
// Autenticação: Application Password (Basic Auth)
// ============================================
import { getSetting } from './db';

export async function getWpConfig() {
  const [site, user, appPassword] = await Promise.all([
    getSetting('wp_site_url'),
    getSetting('wp_username'),
    getSetting('wp_app_password'),
  ]);
  return {
    siteUrl: String(site || process.env.WP_SITE_URL || '').replace(/\/+$/, ''),
    username: String(user || process.env.WP_USERNAME || ''),
    appPassword: String(appPassword || process.env.WP_APP_PASSWORD || ''),
  };
}

function authHeader(username, appPassword) {
  return 'Basic ' + Buffer.from(`${username}:${appPassword}`).toString('base64');
}

async function wpFetch(base, path, { method = 'GET', body, auth } = {}) {
  const res = await fetch(`${base}/wp-json/wp/v2${path}`, {
    method,
    headers: {
      Authorization: auth,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  return { ok: res.ok, status: res.status, data };
}

async function ensureTagIds(base, auth, tagNames) {
  const ids = [];
  for (const raw of (tagNames || []).slice(0, 8)) {
    const name = String(raw).trim();
    if (!name) continue;
    try {
      const search = await wpFetch(base, `/tags?search=${encodeURIComponent(name)}&per_page=5`, { auth });
      const found = Array.isArray(search.data) && search.data.find(t => t.name.toLowerCase() === name.toLowerCase());
      if (found) { ids.push(found.id); continue; }
      const created = await wpFetch(base, '/tags', { method: 'POST', body: { name }, auth });
      if (created.ok && created.data?.id) ids.push(created.data.id);
    } catch { /* tag é opcional — não bloqueia a publicação */ }
  }
  return ids;
}

export async function testWordPress() {
  const cfg = await getWpConfig();
  if (!cfg.siteUrl || !cfg.username || !cfg.appPassword) {
    return { ok: false, message: 'Configure URL do site, usuário e Application Password.' };
  }
  const auth = authHeader(cfg.username, cfg.appPassword);
  const { ok, status, data } = await wpFetch(cfg.siteUrl, '/users/me?context=edit', { auth });
  if (ok) return { ok: true, message: `Conectado como "${data?.name || data?.username || cfg.username}".` };
  if (status === 401) return { ok: false, message: '401 — Application Password inválida (em wp-admin → Usuários → Perfil → Senhas de aplicativo).' };
  if (status === 404) return { ok: false, message: '404 — REST API não encontrada. Confira a URL do site e se os links permanentes estão ativados.' };
  return { ok: false, message: `WordPress respondeu ${status}.` };
}

export async function publishDraft({ title, html, slug, excerpt, tags = [] }) {
  const cfg = await getWpConfig();
  if (!cfg.siteUrl || !cfg.username || !cfg.appPassword) {
    throw new Error('WordPress não configurado. Vá em Configurações → WordPress.');
  }
  const auth = authHeader(cfg.username, cfg.appPassword);
  const tagIds = await ensureTagIds(cfg.siteUrl, auth, tags);

  const body = {
    title,
    content: html,
    status: 'draft', // SEMPRE rascunho — você revisa e publica manualmente
    ...(slug ? { slug } : {}),
    ...(excerpt ? { excerpt } : {}),
    ...(tagIds.length ? { tags: tagIds } : {}),
  };
  const { ok, status, data } = await wpFetch(cfg.siteUrl, '/posts', { method: 'POST', body, auth });
  if (!ok) {
    const msg = data?.message || data?.code || `HTTP ${status}`;
    throw new Error(`WordPress ${status}: ${msg}`);
  }
  return data; // { id, link, ... }
}
