import { NextResponse } from 'next/server';
import { generateTitleSuggestions } from '@/lib/ai';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req) {
  try {
    const body = await req.json();
    const { titles, provider, model } = await generateTitleSuggestions(body || {});
    return NextResponse.json({ titles, provider, model });
  } catch (e) {
    const message = e?.name === 'AbortError' ? 'A IA demorou demais para responder. Tente novamente.' : String(e.message || e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
