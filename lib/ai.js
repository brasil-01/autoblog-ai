// ============================================
// Provedores de IA: Google Gemini, DeepSeek,
// OpenAI e qualquer API compatível com OpenAI
// ============================================

export const PROVIDERS = {
  gemini: {
    label: 'Google Gemini',
    defaultModel: 'gemini-2.5-flash',
    models: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-1.5-flash'],
  },
  deepseek: {
    label: 'DeepSeek',
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-reasoner'],
  },
  openai: {
    label: 'OpenAI',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'gpt-4.1-nano'],
  },
  compatible: {
    label: 'OpenAI-compatível (OpenRouter, Groq…)',
    defaultModel: process.env.OPENAI_COMPATIBLE_MODEL || 'openrouter/auto',
    models: [
      process.env.OPENAI_COMPATIBLE_MODEL || 'openrouter/auto',
      'meta-llama/llama-3.3-70b-instruct',
      'deepseek/deepseek-chat',
      'openai/gpt-4o-mini',
    ],
  },
};

export function providerConfigured(id) {
  switch (id) {
    case 'gemini': return !!process.env.GEMINI_API_KEY;
    case 'deepseek': return !!process.env.DEEPSEEK_API_KEY;
    case 'openai': return !!process.env.OPENAI_API_KEY;
    case 'compatible': return !!(process.env.OPENAI_COMPATIBLE_API_KEY && process.env.OPENAI_COMPATIBLE_BASE_URL);
    default: return false;
  }
}
export function providerInfo() {
  return Object.entries(PROVIDERS).map(([id, p]) => ({
    id, label: p.label, defaultModel: p.defaultModel, models: p.models, configured: providerConfigured(id),
  }));
}

// ---------- Prompt SEO profissional (PT-BR) ----------
function buildSystemPrompt() {
  return `Você é um redator sênior de SEO e jornalista especialista em conteúdo para blogs brasileiros monetizados com Google AdSense.

REGRAS ABSOLUTAS:
- Escreva em português do Brasil, tom natural, humano, sem enrolação e sem "texto de IA".
- Conteúdo 100% original (nunca copie trechos de outras páginas).
- Nunca invente fatos, números ou estatísticas. Se não tiver certeza, escreva de forma genérica ou omita.
- Nada de promessas de ganho financeiro irreal, conteúdo adulto, ódio, violência ou desinformação — o artigo precisa ser aprovado pelo AdSense.
- Estrutura: introdução curta que responde a intenção de busca, corpo com subtítulos (<h2> e <h3>), listas quando útil, conclusão com chamada para ação suave.
- NÃO use <h1> (a plataforma já usa o título do post como H1).
- Cite a palavra-chave principal de forma natural no primeiro parágrafo, em pelo menos um <h2> e no fim do texto, sem keyword stuffing (densidade ideal 0,5%–2%).
- Inclua uma seção de perguntas frequentes (FAQ) com 4 perguntas reais que as pessoas buscam.
- E-E-A-T: demonstre experiência prática, seja específico, evite generalidades vazias.
- Referências: liste 2 a 5 fontes REAIS e confiáveis (sites oficiais .gov.br, .edu.br, Wikipedia, órgãos de classe, grandes portais). NUNCA invente URL — se não souber a URL exata, use o domínio raiz da fonte (ex.: https://www.gov.br). Referências são para o leitor confirmar; nunca apresente opinião como fato.
- Formate o conteúdo em HTML limpo: <p>, <h2>, <h3>, <ul>, <ol>, <li>, <strong>, <em>, <blockquote>. Sem <html>, <head>, <body> ou <script>.

FORMATO DE SAÍDA (OBRIGATÓRIO): responda APENAS com um objeto JSON válido, sem markdown, sem comentários, com exatamente estas chaves:
{
  "title": "Título do artigo, 30–65 caracteres, com a palavra-chave perto do início, sem clickbait",
  "slug": "slug-em-minusculas-com-hifens",
  "meta_description": "Descrição para o Google, 120–165 caracteres, com a palavra-chave, com convite à leitura",
  "keyword": "palavra-chave principal",
  "secondary_keywords": ["3 a 6 termos relacionados"],
  "tags": ["4 a 8 tags curtas"],
  "content_html": "<p>...</p><h2>...</h2>...",
  "faq": [{ "question": "...", "answer": "..." }],
  "references": [{ "title": "Nome da fonte", "url": "https://..." }],
  "image_prompt": "English prompt for a 1280x720 featured blog illustration, photorealistic or editorial style, no text"
}`;
}

function buildUserPrompt({ topic, keyword, niche, tone, wordCount, language }) {
  return `Escreva um artigo completo de blog com as seguintes especificações:

- Tópico / palavra-chave: ${topic}
- Palavra-chave principal a ranquear: ${keyword || topic}
- Nicho / segmento: ${niche || 'geral'}
- Tom de voz: ${tone || 'informativo e prático'}
- Tamanho aproximado: ${wordCount || 1200} palavras (mínimo ${Math.round((wordCount || 1200) * 0.85)})
- Idioma e público: ${language || 'português do Brasil'}
- Público: leitores brasileiros que usam o Google para resolver um problema real

Pense como um especialista que vai dominar a primeira página do Google para esse termo. Capriche na profundidade, nos exemplos concretos e na seção de FAQ.`;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 90000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetch(url, { ...options, signal: controller.signal }); }
  finally { clearTimeout(t); }
}

function parseModelJson(raw) {
  if (!raw) throw new Error('A IA retornou uma resposta vazia. Tente novamente.');
  let text = String(raw).trim();
  // remove cercas de código ```json ... ``` se existirem
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  try { return JSON.parse(text); } catch { /* continua */ }
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first >= 0 && last > first) {
    try { return JSON.parse(text.slice(first, last + 1)); } catch { /* continua */ }
  }
  throw new Error('A IA não retornou um JSON válido. Tente novamente ou troque de provedor/modelo.');
}

function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 70);
}

function normalizeArticle(raw, fallbackKeyword) {
  const faq = Array.isArray(raw.faq) ? raw.faq.filter(f => f && f.question && f.answer).slice(0, 8) : [];
  const references_json = Array.isArray(raw.references) ? raw.references.filter(r => r && r.title).slice(0, 8) : [];
  const title = String(raw.title || fallbackKeyword || 'Artigo sem título').trim();
  return {
    title,
    slug: slugify(raw.slug || title),
    meta_description: String(raw.meta_description || '').trim().slice(0, 165),
    excerpt: String(raw.meta_description || '').trim().slice(0, 200),
    keyword: String(raw.keyword || fallbackKeyword || '').trim(),
    secondary_keywords: Array.isArray(raw.secondary_keywords) ? raw.secondary_keywords.map(String).slice(0, 8) : [],
    tags: Array.isArray(raw.tags) ? raw.tags.map(String).slice(0, 10) : [],
    content_html: String(raw.content_html || '').trim(),
    faq,
    references_json,
    image_prompt: String(raw.image_prompt || raw.keyword || fallbackKeyword || title),
  };
}

async function callGemini({ model, system, user, apiKey }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.7, maxOutputTokens: 8192 },
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${data?.error?.message || 'erro na chamada'}`);
  const text = (data.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('');
  return text;
}

async function callOpenAICompatible({ baseUrl, apiKey, model, system, user }) {
  const url = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;
  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 8192,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${res.status} ${data?.error?.message || 'erro na API de IA'}`);
  return data.choices?.[0]?.message?.content || '';
}

export async function generateArticle({ provider = 'gemini', model, ...input }) {
  const cfg = PROVIDERS[provider];
  if (!cfg) throw new Error(`Provedor desconhecido: ${provider}`);
  const useModel = model || cfg.defaultModel;
  const system = buildSystemPrompt();
  const user = buildUserPrompt(input);

  let raw;
  if (provider === 'gemini') {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY não configurada. Veja Configurações e o guia passo a passo.');
    raw = await callGemini({ model: useModel, system, user, apiKey });
  } else if (provider === 'deepseek') {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) throw new Error('DEEPSEEK_API_KEY não configurada. Veja Configurações e o guia passo a passo.');
    raw = await callOpenAICompatible({ baseUrl: 'https://api.deepseek.com/v1', apiKey, model: useModel, system, user });
  } else if (provider === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY não configurada. Veja Configurações e o guia passo a passo.');
    raw = await callOpenAICompatible({ baseUrl: 'https://api.openai.com/v1', apiKey, model: useModel, system, user });
  } else { // compatible
    const baseUrl = process.env.OPENAI_COMPATIBLE_BASE_URL;
    const apiKey = process.env.OPENAI_COMPATIBLE_API_KEY;
    if (!baseUrl || !apiKey) throw new Error('OPENAI_COMPATIBLE_BASE_URL / OPENAI_COMPATIBLE_API_KEY não configuradas.');
    raw = await callOpenAICompatible({ baseUrl, apiKey, model: useModel, system, user });
  }

  const parsed = parseModelJson(raw);
  return { article: normalizeArticle(parsed, input.keyword || input.topic), provider, model: useModel };
}

export async function testProvider(id) {
  const cfg = PROVIDERS[id];
  if (!cfg) return { ok: false, message: 'Provedor desconhecido' };
  try {
    if (id === 'gemini') {
      const res = await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`, {}, 10000);
      return res.ok ? { ok: true, message: 'Gemini OK — chave válida.' } : { ok: false, message: `Gemini recusou a chave (${res.status}).` };
    }
    if (id === 'deepseek') {
      const res = await fetchWithTimeout('https://api.deepseek.com/v1/models', { headers: { Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` } }, 10000);
      return res.ok ? { ok: true, message: 'DeepSeek OK — chave válida.' } : { ok: false, message: `DeepSeek recusou a chave (${res.status}).` };
    }
    if (id === 'openai') {
      const res = await fetchWithTimeout('https://api.openai.com/v1/models', { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } }, 10000);
      return res.ok ? { ok: true, message: 'OpenAI OK — chave válida.' } : { ok: false, message: `OpenAI recusou a chave (${res.status}).` };
    }
    const res = await fetchWithTimeout(`${(process.env.OPENAI_COMPATIBLE_BASE_URL || '').replace(/\/+$/, '')}/models`, { headers: { Authorization: `Bearer ${process.env.OPENAI_COMPATIBLE_API_KEY}` } }, 10000);
    return res.ok ? { ok: true, message: 'API compatível respondeu OK.' } : { ok: false, message: `API respondeu ${res.status}.` };
  } catch (e) {
    return { ok: false, message: e.name === 'AbortError' ? 'Tempo esgotado ao contatar a API.' : String(e.message || e) };
  }
}
