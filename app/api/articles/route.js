import { NextResponse } from 'next/server';
import { listArticles, createArticle } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json(await listArticles());
  } catch (e) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    if (!body?.title) return NextResponse.json({ error: 'title é obrigatório' }, { status: 400 });
    const article = await createArticle(body);
    return NextResponse.json(article, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
  }
}
