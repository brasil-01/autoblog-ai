import { NextResponse } from 'next/server';
import { getArticle, updateArticle, getSetting } from '@/lib/db';
import { publishDraft } from '@/lib/wordpress';
import { assembleArticleHtml } from '@/lib/assemble';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req) {
  try {
    const { id, includeJsonLd = true } = await req.json();
    if (!id) return NextResponse.json({ error: 'id do artigo é obrigatório' }, { status: 400 });

    const article = await getArticle(id);
    if (!article) return NextResponse.json({ error: 'Artigo não encontrado' }, { status: 404 });

    const siteName = (await getSetting('site_name')) || 'AutoBlog AI';
    const html = assembleArticleHtml(article, { includeJsonLd, siteName });

    const result = await publishDraft({
      title: article.title,
      html,
      slug: article.slug,
      excerpt: article.meta_description,
      tags: article.tags || [],
    });

    const published_urls = { ...(article.published_urls || {}), wordpress: result.link || null };
    await updateArticle(id, { status: 'published_wordpress', wordpress_post_id: result.id || null, published_urls });

    return NextResponse.json({ ok: true, id: result.id, url: result.link || null, message: 'Rascunho criado no WordPress! Revise e publique em wp-admin → Posts.' });
  } catch (e) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
  }
}
