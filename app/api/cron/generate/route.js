import { NextResponse } from 'next/server';
import { getSetting, setSetting } from '@/lib/db';
import { generateAndSave } from '@/lib/generate';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Chamado pela Vercel Cron (vercel.json) 1x por dia.
// A Vercel envia automaticamente "Authorization: Bearer $CRON_SECRET".
// Também aceita ?secret= para disparo manual.
// O artigo NUNCA é publicado direto: fica como RASCUNHO no painel.
export async function GET(req) {
  const url = new URL(req.url);
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: 'Defina a variável CRON_SECRET na Vercel para ativar a geração automática.' }, { status: 500 });
  }
  const auth = req.headers.get('authorization') || '';
  const given = auth.startsWith('Bearer ') ? auth.slice(7) : url.searchParams.get('secret');
  if (given !== cronSecret) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const raw = (await getSetting('cron_topics')) || '';
  const topics = String(raw).split('\n').map(s => s.trim()).filter(Boolean);
  if (!topics.length) {
    return NextResponse.json({ skipped: true, reason: 'Nenhum tópico em "Tópicos do cron" (Configurações). Um por linha.' });
  }

  const cursor = Number(await getSetting('cron_cursor')) || 0;
  const topic = topics[cursor % topics.length];
  const provider = (await getSetting('default_provider')) || 'gemini';
  const model = (await getSetting('default_model')) || undefined;

  try {
    const { article, seo } = await generateAndSave({ topic, provider, model });
    await setSetting('cron_cursor', cursor + 1);
    return NextResponse.json({ ok: true, topic, article_id: article.id, seo_score: seo.score });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
