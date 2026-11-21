import { NextResponse } from 'next/server';
import { listCategories, createCategory, deleteCategory } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const categories = await listCategories({
      niche: searchParams.get('niche') || undefined,
      language: searchParams.get('language') || undefined,
    });
    return NextResponse.json({ categories });
  } catch (e) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
  }
}
export async function POST(req) {
  try {
    const body = await req.json();
    const category = await createCategory(body || {});
    return NextResponse.json({ category }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
  }
}
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Informe o id.' }, { status: 400 });
    await deleteCategory(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
  }
}
