import { NextResponse } from 'next/server';
import { getBlogId, getAccessToken } from '@/lib/blogger';

export const dynamic = 'force-dynamic';

const API = 'https://www.googleapis.com/blogger/v3';

// Lista os posts publicados no blog (título, id, url)
export async function GET() {
  try {
    const blogId = await getBlogId();
    if (!blogId) return NextResponse.json({ error: 'BLOGGER_BLOG_ID não configurado.' }, { status: 400 });
    const token = await getAccessToken();
    const res = await fetch(`${API}/blogs/${blogId}/posts?status=LIVE&maxResults=50&view=ADMIN`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || `Blogger ${res.status}`);
    const posts = (data.items || []).map(p => ({ id: p.id, title: p.title, status: p.status, url: p.url, published: p.published }));
    return NextResponse.json({ ok: true, posts });
  } catch (e) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
  }
}

// Reverte um post publicado de volta para RASCUNHO (reversível; não apaga nada)
export async function POST(req) {
  try {
    const { postId } = await req.json();
    if (!postId) return NextResponse.json({ error: 'postId é obrigatório.' }, { status: 400 });
    const blogId = await getBlogId();
    if (!blogId) return NextResponse.json({ error: 'BLOGGER_BLOG_ID não configurado.' }, { status: 400 });
    const token = await getAccessToken();
    const res = await fetch(`${API}/blogs/${blogId}/posts/${postId}/revert`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || `Blogger ${res.status}`);
    return NextResponse.json({ ok: true, id: data.id, title: data.title, status: data.status || 'DRAFT', message: 'Post revertido para rascunho. Nada foi apagado — pode republicar quando quiser.' });
  } catch (e) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
  }
}
