import { NextResponse } from 'next/server';
import { getArticle, updateArticle, deleteArticle } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(_req, { params }) {
  try {
    const article = await getArticle(params.id);
    if (!article) return NextResponse.json({ error: 'Artigo não encontrado' }, { status: 404 });
    return NextResponse.json(article);
  } catch (e) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const body = await req.json();
    const updated = await updateArticle(params.id, body || {});
    if (!updated) return NextResponse.json({ error: 'Artigo não encontrado' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  try {
    await deleteArticle(params.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
  }
}
