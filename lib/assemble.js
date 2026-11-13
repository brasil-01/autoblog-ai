// ============================================
// Monta o HTML final do artigo (Blogger/WP/cópia)
// Puro JS — seguro para rodar no navegador.
// ============================================

export function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function stripScripts(html) {
  return String(html || '').replace(/<script[\s\S]*?<\/script>/gi, '');
}

export function buildJsonLd(article, siteName) {
  const faq = Array.isArray(article.faq) ? article.faq : [];
  const graph = [
    {
      '@type': 'Article',
      headline: article.title,
      description: article.meta_description || '',
      image: article.image_url ? [article.image_url] : undefined,
      inLanguage: 'pt-BR',
      datePublished: article.created_at || new Date().toISOString(),
      dateModified: article.updated_at || article.created_at || new Date().toISOString(),
      keywords: [article.keyword, ...(article.secondary_keywords || [])].filter(Boolean).join(', '),
      mainEntityOfPage: article.slug ? { '@type': 'WebPage' } : undefined,
      author: { '@type': 'Organization', name: siteName || 'AutoBlog AI' },
      publisher: { '@type': 'Organization', name: siteName || 'AutoBlog AI' },
    },
  ];
  if (faq.length) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: faq.map(f => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer },
      })),
    });
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}

export function assembleArticleHtml(article, { includeJsonLd = false, siteName } = {}) {
  const parts = [];
  const kw = escapeHtml(article.keyword || article.title || 'artigo');

  if (article.image_url) {
    parts.push(
      `<figure style="margin:0 0 1.5em">` +
      `<img src="${escapeHtml(article.image_url)}" alt="${kw}" loading="lazy" style="max-width:100%;height:auto;border-radius:12px;display:block"/>` +
      (article.image_credit ? `<figcaption style="font-size:12px;color:#666;margin-top:6px">${escapeHtml(article.image_credit)}</figcaption>` : '') +
      `</figure>`
    );
  }

  parts.push(article.content_html || '');

  const faq = Array.isArray(article.faq) ? article.faq : [];
  if (faq.length) {
    parts.push('<h2>Perguntas frequentes</h2>');
    for (const f of faq) {
      parts.push(`<h3>${escapeHtml(f.question)}</h3>`);
      parts.push(`<p>${escapeHtml(f.answer)}</p>`);
    }
  }

  const refs = Array.isArray(article.references_json) ? article.references_json : [];
  if (refs.length) {
    parts.push('<h2>Referências</h2>');
    parts.push('<ol>');
    for (const r of refs) {
      if (r && r.url) parts.push(`<li><a href="${escapeHtml(r.url)}" rel="nofollow noopener" target="_blank">${escapeHtml(r.title || r.url)}</a></li>`);
      else if (r && r.title) parts.push(`<li>${escapeHtml(r.title)}</li>`);
    }
    parts.push('</ol>');
    parts.push('<p style="font-size:12px;color:#777">Fontes listadas para consulta. Ao usar este conteúdo, confirme as informações nas páginas oficiais.</p>');
  }

  if (includeJsonLd) {
    const jsonLd = article.json_ld || buildJsonLd(article, siteName);
    parts.push(`<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`);
  }

  return parts.join('\n');
}
