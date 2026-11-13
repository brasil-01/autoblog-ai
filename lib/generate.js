// ============================================
// Pipeline: tópico → IA → imagem → SEO → banco
// Usado por /api/generate e pelo cron.
// ============================================
import { generateArticle } from './ai';
import { resolveImage } from './images';
import { analyzeSeo } from './seo';
import { buildJsonLd } from './assemble';
import { createArticle, getSetting } from './db';

export async function generateAndSave(input) {
  const {
    topic,
    keyword,
    niche,
    tone,
    wordCount,
    language = 'português do Brasil',
    provider = 'gemini',
    model,
    includeFaq = true,
    imageSource = 'auto',
  } = input;

  if (!topic || !String(topic).trim()) throw new Error('Informe o tópico (ou a palavra-chave) do artigo.');

  const siteName = (await getSetting('site_name')) || 'AutoBlog AI';

  const { article, provider: usedProvider, model: usedModel } = await generateArticle({
    provider, model, topic, keyword: keyword || topic, niche, tone,
    wordCount: Number(wordCount) || 1200, language,
  });

  if (!includeFaq) article.faq = [];

  const image = await resolveImage({ keyword: article.keyword, imagePrompt: article.image_prompt, imageSource });

  const seo = analyzeSeo(article);
  const jsonLd = buildJsonLd({ ...article, created_at: new Date().toISOString() }, siteName);

  const row = await createArticle({
    title: article.title,
    slug: article.slug,
    keyword: article.keyword,
    meta_description: article.meta_description,
    excerpt: article.excerpt,
    content_html: article.content_html,
    tags: article.tags,
    secondary_keywords: article.secondary_keywords,
    faq: article.faq,
    references_json: article.references_json,
    json_ld: jsonLd,
    image_url: image.url,
    image_credit: image.credit || null,
    provider: usedProvider,
    model: usedModel,
    status: 'draft',
    seo_score: seo.score,
    seo_report: seo,
    published_urls: {},
  });

  return { article: row, seo };
}
