import { NextResponse } from 'next/server';
import { listArticles, usingSupabase } from '@/lib/db';
import { testProvider } from '@/lib/ai';
import { testWordPress } from '@/lib/wordpress';
import { getBlogInfo } from '@/lib/blogger';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { target } = await req.json();
    let result;
    switch (target) {
      case 'supabase':
        if (!usingSupabase) {
          result = { ok: false, message: 'Usando arquivo local (sem SUPABASE_URL). Em desenvolvimento funciona; na Vercel o conteúdo some a cada deploy.' };
        } else {
          const rows = await listArticles();
          result = { ok: true, message: `Supabase conectado! Tabela "articles" respondeu (${rows.length} artigo(s)).` };
        }
        break;
      case 'gemini': case 'deepseek': case 'openai': case 'compatible':
        result = await testProvider(target);
        break;
      case 'wordpress':
        result = await testWordPress();
        break;
      case 'blogger':
        try {
          const info = await getBlogInfo();
          result = { ok: true, message: `Blogger conectado: "${info.name}" (${info.url || 'ok'}).` };
        } catch (e) {
          result = { ok: false, message: String(e.message || e) };
        }
        break;
      default:
        result = { ok: false, message: `Alvo desconhecido: ${target}` };
    }
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ ok: false, message: String(e.message || e) }, { status: 500 });
  }
}
