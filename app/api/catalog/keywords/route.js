import { NextResponse } from 'next/server';
import { listKeywords, createKeyword, deleteKeyword } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const keywords = await listKeywords({
      niche: searchParams.get('niche') || undefined,
      language: searchParams.get('language') || undefined,
      intent: searchParams.get('intent') || undefined,
    });
    return NextResponse.json({ keywords });
  } catch (e) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
  }
}
export async function POST(req) {
  try {
    const body = await req.json();
    const keyword = await createKeyword(body || {});
    return NextResponse.json({ keyword }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
  }
}
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Informe o id.' }, { status: 400 });
    await deleteKeyword(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
  }
}
