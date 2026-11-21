// ============================================
// Camada de dados — Supabase (produção) ou
// arquivo JSON local (desenvolvimento)
// ============================================
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const usingSupabase = !!(SUPABASE_URL && SUPABASE_KEY);

// ---------- Supabase (PostgREST via fetch) ----------
async function sb(table, { method = 'GET', body, query = '', prefer } = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query ? `?${query}` : ''}`, {
    method,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const msg = (data && (data.message || data.error_description || data.hint || data.details)) || text || res.statusText;
    throw new Error(`Supabase ${res.status}: ${msg}`);
  }
  return data;
}

// ---------- Fallback local (desenvolvimento) ----------
function dataFile() {
  if (process.env.VERCEL) return '/tmp/autoblog-db.json'; // efêmero — use Supabase na Vercel!
  return path.join(process.cwd(), 'data', 'db.json');
}
function readLocal() {
  try { return JSON.parse(fs.readFileSync(dataFile(), 'utf8')); }
  catch { return { articles: [], settings: {} }; }
}
function writeLocal(db) {
  const f = dataFile();
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, JSON.stringify(db, null, 2));
}

// ---------- Articles ----------
export async function listArticles() {
  if (usingSupabase) return sb('articles', { query: 'select=*&order=created_at.desc&limit=200' });
  return readLocal().articles
    .slice()
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
}
export async function getArticle(id) {
  if (usingSupabase) {
    const rows = await sb('articles', { query: `select=*&id=eq.${encodeURIComponent(id)}` });
    return rows?.[0] || null;
  }
  return readLocal().articles.find(a => a.id === id) || null;
}
export async function createArticle(data) {
  const now = new Date().toISOString();
  if (usingSupabase) {
    const rows = await sb('articles', { method: 'POST', body: data, prefer: 'return=representation' });
    return rows[0];
  }
  const db = readLocal();
  const item = {
    id: crypto.randomUUID(),
    status: 'draft',
    published_urls: {},
    created_at: now,
    updated_at: now,
    ...data,
  };
  db.articles.push(item);
  writeLocal(db);
  return item;
}
const UPDATABLE = [
  'title', 'slug', 'keyword', 'meta_description', 'excerpt', 'content_html',
  'tags', 'secondary_keywords', 'faq', 'references_json', 'json_ld',
  'image_url', 'image_credit', 'provider', 'model', 'status', 'language',
  'seo_score', 'seo_report', 'blogger_post_id', 'wordpress_post_id', 'published_urls',
];
export async function updateArticle(id, patch) {
  const clean = { updated_at: new Date().toISOString() };
  for (const k of UPDATABLE) if (patch[k] !== undefined) clean[k] = patch[k];
  if (usingSupabase) {
    const rows = await sb('articles', { method: 'PATCH', query: `id=eq.${encodeURIComponent(id)}`, body: clean, prefer: 'return=representation' });
    return rows?.[0] || null;
  }
  const db = readLocal();
  const i = db.articles.findIndex(a => a.id === id);
  if (i < 0) return null;
  db.articles[i] = { ...db.articles[i], ...clean };
  writeLocal(db);
  return db.articles[i];
}
export async function deleteArticle(id) {
  if (usingSupabase) { await sb('articles', { method: 'DELETE', query: `id=eq.${encodeURIComponent(id)}` }); return true; }
  const db = readLocal();
  db.articles = db.articles.filter(a => a.id !== id);
  writeLocal(db);
  return true;
}

// ---------- Settings ----------
export async function getSetting(key) {
  if (usingSupabase) {
    const rows = await sb('settings', { query: `select=value&key=eq.${encodeURIComponent(key)}` });
    return rows?.[0]?.value ?? null;
  }
  return readLocal().settings[key] ?? null;
}
export async function setSetting(key, value) {
  const stamp = { key, value, updated_at: new Date().toISOString() };
  if (usingSupabase) {
    await sb('settings', { method: 'POST', body: stamp, prefer: 'resolution=merge-duplicates' });
    return true;
  }
  const db = readLocal();
  db.settings[key] = value;
  writeLocal(db);
  return true;
}
export async function getSettings(keys) {
  const map = {};
  if (usingSupabase) {
    try {
      const inList = keys.map(k => `"${k}"`).join(',');
      const rows = await sb('settings', { query: `select=*&key=in.(${inList})` });
      for (const r of rows || []) map[r.key] = r.value;
    } catch { /* tabela pode não existir ainda */ }
  } else {
    Object.assign(map, readLocal().settings);
  }
  return map;
}
