// ============================================
// Auditoria de SEO on-page (0–100 pontos)
// Puro JS — roda no servidor e no navegador.
// ============================================

export function stripHtml(html) {
  return String(html || '').replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function countOccurrences(haystack, needle) {
  if (!needle) return 0;
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase().trim();
  if (!n) return 0;
  let i = 0, count = 0;
  while ((i = h.indexOf(n, i)) !== -1) { count++; i += n.length; }
  return count;
}

export function analyzeSeo({ title = '', meta_description = '', slug = '', content_html = '', keyword = '', faq = [], references_json = [] }) {
  const text = stripHtml(content_html);
  const words = text ? text.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;
  const kw = (keyword || '').trim();
  const kwLower = kw.toLowerCase();
  const occurrences = countOccurrences(text, kw);
  const density = wordCount > 0 ? (occurrences * (kw.split(/\s+/).length) / wordCount) * 100 : 0;
  const h2 = (String(content_html).match(/<h2[\s>]/gi) || []).length;
  const h3 = (String(content_html).match(/<h3[\s>]/gi) || []).length;
  const firstChunk = words.slice(0, 120).join(' ');

  const checks = [
    { id: 'title_len', label: 'Título entre 30 e 65 caracteres', passed: title.length >= 30 && title.length <= 65, points: 10, detail: `${title.length} caracteres` },
    { id: 'title_kw', label: 'Palavra-chave no título', passed: !!kwLower && title.toLowerCase().includes(kwLower), points: 12, detail: kw || 'sem keyword' },
    { id: 'meta_len', label: 'Meta description entre 120 e 165 caracteres', passed: meta_description.length >= 120 && meta_description.length <= 165, points: 10, detail: `${meta_description.length} caracteres` },
    { id: 'meta_kw', label: 'Palavra-chave na meta description', passed: !!kwLower && meta_description.toLowerCase().includes(kwLower), points: 8, detail: meta_description ? 'ok' : 'ausente' },
    { id: 'slug', label: 'Slug amigável (minúsculas, hífens, ≤ 70)', passed: /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) && slug.length <= 70, points: 8, detail: slug || 'ausente' },
    { id: 'slug_kw', label: 'Palavra-chave no slug', passed: !!kwLower && slug.toLowerCase().includes(kwLower.split(/\s+/)[0]), points: 7, detail: slug },
    { id: 'word_count', label: 'Artigo com 900+ palavras (ideal p/ AdSense)', passed: wordCount >= 900, points: 15, detail: `${wordCount} palavras` },
    { id: 'density', label: 'Densidade da keyword entre 0,5% e 2,5%', passed: density >= 0.5 && density <= 2.5, points: 10, detail: `${density.toFixed(2)}% (${occurrences} ocorrências)` },
    { id: 'first_para', label: 'Keyword nos primeiros 120 palavras', passed: !!kwLower && firstChunk.toLowerCase().includes(kwLower), points: 8, detail: 'intenção de busca clara no início' },
    { id: 'h2', label: 'Pelo menos 3 subtítulos H2', passed: h2 >= 3, points: 5, detail: `${h2} H2 encontrados` },
    { id: 'h3', label: 'Subtítulos H3 (escaneabilidade)', passed: h3 >= 1, points: 2, detail: `${h3} H3 encontrados` },
    { id: 'faq', label: 'Seção de FAQ (rich snippet no Google)', passed: Array.isArray(faq) && faq.length >= 3, points: 3, detail: `${(faq || []).length} perguntas` },
    { id: 'refs', label: 'Referências/fontes confiáveis (E-E-A-T)', passed: Array.isArray(references_json) && references_json.length >= 2, points: 2, detail: `${(references_json || []).length} fontes` },
  ];

  const max = checks.reduce((s, c) => s + c.points, 0);
  const got = checks.filter(c => c.passed).reduce((s, c) => s + c.points, 0);
  const score = Math.round((got / max) * 100);
  const grade = score >= 85 ? 'Excelente' : score >= 70 ? 'Bom' : score >= 50 ? 'Regular' : 'Fraco';

  return { score, grade, wordCount, density: Number(density.toFixed(2)), h2, h3, checks };
}
