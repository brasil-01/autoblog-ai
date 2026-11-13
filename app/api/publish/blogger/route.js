import { NextResponse } from 'next/server';
import { getArticle, updateArticle, getSetting } from '@/lib/db';
import { publishDraft } from '@/lib/blogger';
import { assembleArticleHtml } from '@/lib/assemble';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req) {
  try {
    const { id, includeJsonLd = false } = await req.json();
    if (!id) return NextResponse.json({ error: 'id do artigo é obrigatório' }, { status: 400 });

    const article = await getArticle(id);
    if (!article) return NextResponse.json({ error: 'Artigo não encontrado' }, { status: 404 });

    const siteName = (await getSetting('site_name')) || 'AutoBlog AI';
    const html = assembleArticleHtml(article, { includeJsonLd, siteName });

    const labels = [article.keyword, ...(article.tags || [])].filter(Boolean);
    const result = await publishDraft({ title: article.title, html, labels });

    const published_urls = { ...(article.published_urls || {}), blogger: result.url || null };
    await updateArticle(id, { status: 'published_blogger', blogger_post_id: String(result.id || ''), published_urls });

    return NextResponse.json({ ok: true, id: result.id, url: result.url || null, message: 'Rascunho criado no Blogger! Revise e publique no painel do Blogger.' });
  } catch (e) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
  }
}
