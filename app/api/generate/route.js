import { NextResponse } from 'next/server';
import { generateAndSave } from '@/lib/generate';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // limite do plano Hobby da Vercel

export async function POST(req) {
  try {
    const body = await req.json();
    const { article, seo } = await generateAndSave(body);
    return NextResponse.json({ article, seo }, { status: 201 });
  } catch (e) {
    const message = e?.name === 'AbortError' ? 'A IA demorou demais para responder. Tente novamente.' : String(e.message || e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
