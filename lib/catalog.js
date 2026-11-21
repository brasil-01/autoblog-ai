// ============================================
// Catálogo — nichos, categorias de blog e
// palavras-chave pré-cadastradas (Supabase)
// ============================================
import crypto from 'crypto';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const usingCatalog = !!(SUPABASE_URL && SUPABASE_KEY);

const NO_TABLE = 'Tabelas de catálogo não encontradas. Rode supabase/catalog.sql no SQL Editor do Supabase (leva 1 minuto).';

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
    const msg = (data && (data.message || data.hint || data.details || data.error)) || text || res.statusText;
    if (res.status === 404 || /relation .* does not exist|Could not find the table/i.test(String(msg))) {
      throw new Error(NO_TABLE);
    }
    throw new Error(`Supabase ${res.status}: ${msg}`);
  }
  return data;
}

function slugify(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60);
}

// ---------- Categorias ----------
export async function listCategories({ niche, language } = {}) {
  if (!usingCatalog) return [];
  let query = 'select=*&order=niche,language,name';
  if (niche) query += `&niche=eq.${encodeURIComponent(niche)}`;
  if (language) query += `&language=eq.${encodeURIComponent(language)}`;
  return sb('blog_categories', { query });
}
export async function createCategory({ name, niche = 'financas', language = 'pt-BR', description }) {
  if (!name || !String(name).trim()) throw new Error('Informe o nome da categoria.');
  const row = { name: String(name).trim(), slug: slugify(name), niche, language, description: description || null };
  const rows = await sb('blog_categories', { method: 'POST', body: row, prefer: 'return=representation' });
  return rows[0];
}
export async function deleteCategory(id) {
  await sb('blog_categories', { method: 'DELETE', query: `id=eq.${encodeURIComponent(id)}` });
  return true;
}

// ---------- Palavras-chave ----------
export async function listKeywords({ niche, language, intent } = {}) {
  if (!usingCatalog) return [];
  let query = 'select=*,category:blog_categories(name)&order=created_at.desc&limit=500';
  if (niche) query += `&niche=eq.${encodeURIComponent(niche)}`;
  if (language) query += `&language=eq.${encodeURIComponent(language)}`;
  if (intent) query += `&intent=eq.${encodeURIComponent(intent)}`;
  return sb('keywords', { query });
}
export async function createKeyword({ keyword, niche = 'financas', language = 'pt-BR', intent = 'informacional', difficulty = 'medio', category_id, notes }) {
  if (!keyword || !String(keyword).trim()) throw new Error('Informe a palavra-chave.');
  const row = {
    keyword: String(keyword).trim().toLowerCase(),
    niche, language, intent, difficulty,
    category_id: category_id || null,
    notes: notes || null,
  };
  const rows = await sb('keywords', { method: 'POST', body: row, prefer: 'return=representation,resolution=merge-duplicates' });
  return rows?.[0] || rows;
}
export async function deleteKeyword(id) {
  await sb('keywords', { method: 'DELETE', query: `id=eq.${encodeURIComponent(id)}` });
  return true;
}

// ---------- Seed: finanças (pt-BR) + exemplos en ----------
const SEED_CATEGORIES = [
  ['Finanças Pessoais', 'financas'], ['Dívidas e Nome Limpo', 'financas'],
  ['Orçamento e Planejamento', 'financas'], ['Cartões de Crédito', 'financas'],
  ['Investimentos', 'financas'], ['Renda Extra', 'financas'],
  ['Finanças para a Família', 'financas'], ['Contas e Bancos', 'financas'],
  ['Personal Finance', 'financas'], // en
];
const SEED_KEYWORDS = [
  // Finanças Pessoais
  ['como organizar as finanças pessoais', 'Finanças Pessoais', 'informacional', 'baixo'],
  ['planilha de controle financeiro', 'Finanças Pessoais', 'informacional', 'baixo'],
  ['como fazer um orçamento mensal', 'Orçamento e Planejamento', 'informacional', 'baixo'],
  ['método 50/30/20', 'Orçamento e Planejamento', 'informacional', 'medio'],
  ['gastos invisíveis como cortar', 'Finanças Pessoais', 'informacional', 'medio'],
  // Dívidas
  ['como sair das dívidas ganhando pouco', 'Dívidas e Nome Limpo', 'informacional', 'medio'],
  ['bola de neve dívidas como funciona', 'Dívidas e Nome Limpo', 'informacional', 'medio'],
  ['renegociar dívida como fazer', 'Dívidas e Nome Limpo', 'informacional', 'medio'],
  ['limpar o nome no SPC e Serasa', 'Dívidas e Nome Limpo', 'informacional', 'alto'],
  // Orçamento
  ['orçamento doméstico passo a passo', 'Orçamento e Planejamento', 'informacional', 'baixo'],
  ['metas financeiras como definir', 'Orçamento e Planejamento', 'informacional', 'medio'],
  // Cartões
  ['cartão de crédito para negativado', 'Cartões de Crédito', 'comercial', 'alto'],
  ['melhor cartão de crédito sem anuidade', 'Cartões de Crédito', 'comercial', 'alto'],
  ['como usar o cartão de crédito sem se endividar', 'Cartões de Crédito', 'informacional', 'medio'],
  // Reserva e investimento
  ['reserva de emergência quanto guardar', 'Investimentos', 'informacional', 'baixo'],
  ['tesouro selic vale a pena', 'Investimentos', 'comercial', 'medio'],
  ['poupança ou tesouro direto', 'Investimentos', 'comercial', 'medio'],
  ['quanto rende 1000 reais no tesouro selic', 'Investimentos', 'comercial', 'alto'],
  ['cdi o que é como funciona', 'Investimentos', 'informacional', 'medio'],
  ['investir com pouco dinheiro', 'Investimentos', 'informacional', 'medio'],
  ['cdb ou tesouro direto qual escolher', 'Investimentos', 'comercial', 'alto'],
  // Score
  ['como aumentar o score de crédito', 'Contas e Bancos', 'informacional', 'medio'],
  ['score baixo como melhorar', 'Contas e Bancos', 'informacional', 'medio'],
  // Renda extra
  ['renda extra ideias honestas', 'Renda Extra', 'informacional', 'medio'],
  ['como ganhar dinheiro trabalhando de casa', 'Renda Extra', 'informacional', 'alto'],
  ['renda extra online o que funciona', 'Renda Extra', 'informacional', 'alto'],
  // Família
  ['educação financeira familiar', 'Finanças para a Família', 'informacional', 'baixo'],
  ['como ensinar filhos a lidar com dinheiro', 'Finanças para a Família', 'informacional', 'baixo'],
  ['mesada pedagogia financeira', 'Finanças para a Família', 'informacional', 'medio'],
  // Conta digital
  ['conta digital sem tarifas vale a pena', 'Contas e Bancos', 'comercial', 'medio'],
  ['nubank ou inter qual melhor', 'Contas e Bancos', 'comercial', 'alto'],
  // EN examples (multi-idioma)
  ['how to build an emergency fund', 'Personal Finance', 'informacional', 'medio'],
];
const SEED_LANG = { 'Personal Finance': 'en', 'how to build an emergency fund': 'en' };

export async function seedFinanceCatalog() {
  if (!usingCatalog) throw new Error('Supabase não configurado (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).');
  const categories = {};
  let categoriesCreated = 0;
  for (const [name, niche] of SEED_CATEGORIES) {
    const language = SEED_LANG[name] || 'pt-BR';
    const rows = await sb('blog_categories', {
      method: 'POST',
      body: { name, slug: slugify(name), niche, language, description: null },
      prefer: 'return=representation,resolution=ignore-duplicates',
    });
    if (Array.isArray(rows) && rows.length) categoriesCreated++;
    const found = await sb('blog_categories', { query: `select=id,name&name=eq.${encodeURIComponent(name)}&language=eq.${language}` });
    if (found?.[0]) categories[found[0].name] = found[0].id;
  }
  let keywordsCreated = 0;
  for (const [keyword, categoryName, intent, difficulty] of SEED_KEYWORDS) {
    const language = SEED_LANG[keyword] || 'pt-BR';
    const row = {
      keyword, niche: 'financas', language, intent, difficulty,
      category_id: categories[categoryName] || null, notes: null,
    };
    const rows = await sb('keywords', { method: 'POST', body: row, prefer: 'return=representation,resolution=ignore-duplicates' });
    if (Array.isArray(rows) && rows.length) keywordsCreated++;
  }
  return { categoriesCreated, keywordsCreated, totalKeywords: SEED_KEYWORDS.length, totalCategories: SEED_CATEGORIES.length };
}
